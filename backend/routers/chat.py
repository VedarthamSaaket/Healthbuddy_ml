import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import cast, String
from pydantic import BaseModel
from models.database import get_db, User, ChatMessage, SymptomLog, AdviceLog, EmergencyLog, MedicationLog
from utils.auth import get_current_user
from services.llm import virtual_assessment, post_process_response, translate_message
from services.ml import ensemble_predict, extract_symptoms, is_emergency
from security import sanitise_text, assert_owns_resource, log_security_event
import uuid

router = APIRouter(prefix="/api/chat", tags=["chat"])

AUDIO_TAG_RE = re.compile(r'^\[AUDIO-([a-z]{2})\]\s*', re.IGNORECASE)

MAX_MESSAGE_LENGTH = 2000
MAX_HISTORY_TURNS = 10


class MessageRequest(BaseModel):
    content: str
    history: list[dict] = []
    language: str = "en"
    session_id: str = ""
    audio_language: str = ""


class TranslateRequest(BaseModel):
    text: str
    target_language: str


@router.post("/message")
async def send_message(
    data: MessageRequest,
    request=None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = data.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(content) > MAX_MESSAGE_LENGTH:
        raise HTTPException(status_code=400, detail="Message too long.")

    sanitise_text(content, "message")

    session_id = data.session_id.strip() or str(uuid.uuid4())
    user_id_str = str(current_user.id)

    if data.session_id:
        existing_session_msg = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.session_id == data.session_id,
                ChatMessage.user_id != current_user.id,
            )
            .first()
        )
        if existing_session_msg:
            log_security_event("SESSION_HIJACK_ATTEMPT", f"user={user_id_str} session={data.session_id}")
            raise HTTPException(status_code=403, detail="Access denied to this session.")

    audio_lang = data.audio_language.strip().lower() if data.audio_language else ""
    tag_match = AUDIO_TAG_RE.match(content)
    if not audio_lang and tag_match:
        audio_lang = tag_match.group(1).lower()
    clean_content = AUDIO_TAG_RE.sub("", content).strip() if tag_match else content

    emergency = is_emergency(clean_content)
    symptoms = extract_symptoms(clean_content)
    predictions = ensemble_predict(clean_content) if len(symptoms) >= 3 else []

    if emergency:
        log = EmergencyLog(user_id=current_user.id, symptoms=clean_content[:500])
        db.add(log)

    symptom_log_id = None
    if symptoms:
        sym_log = SymptomLog(
            user_id=current_user.id,
            session_id=session_id,
            symptoms=symptoms,
            predictions=predictions,
            raw_text=clean_content[:500],
            source="chat",
        )
        db.add(sym_log)
        db.flush()
        symptom_log_id = sym_log.id

    user_msg = ChatMessage(
        user_id=current_user.id,
        session_id=session_id,
        role="user",
        content=clean_content[:MAX_MESSAGE_LENGTH],
    )
    db.add(user_msg)

    recent_symptom_logs = (
        db.query(SymptomLog)
        .filter(cast(SymptomLog.user_id, String) == user_id_str)
        .order_by(SymptomLog.created_at.desc())
        .limit(5)
        .all()
    )
    symptom_logs_data = [
        {
            "symptoms": log.symptoms,
            "predictions": log.predictions,
            "raw_text": log.raw_text,
            "created_at": str(log.created_at),
        }
        for log in recent_symptom_logs
    ]

    recent_medication_logs = (
        db.query(MedicationLog)
        .filter(cast(MedicationLog.user_id, String) == user_id_str)
        .order_by(MedicationLog.created_at.desc())
        .limit(3)
        .all()
    )
    medication_logs_data = [
        {
            "condition": log.condition,
            "recommendations": log.recommendations,
            "created_at": str(log.created_at),
        }
        for log in recent_medication_logs
    ]

    safe_history = []
    for msg in data.history[-MAX_HISTORY_TURNS:]:
        if msg.get("role") in ("user", "assistant") and msg.get("content"):
            safe_history.append({
                "role": msg["role"],
                "content": str(msg["content"])[:MAX_MESSAGE_LENGTH],
            })

    response = await virtual_assessment(
        user_message=clean_content,
        history=safe_history,
        predictions=predictions if predictions else None,
        symptom_count=len(symptoms),
        language=data.language,
        is_emergency=emergency,
        audio_language=audio_lang or None,
        symptom_logs=symptom_logs_data,
        medication_logs=medication_logs_data,
    )
    response = post_process_response(response)

    assistant_msg = ChatMessage(
        user_id=current_user.id,
        session_id=session_id,
        role="assistant",
        content=response[:2000],
    )
    db.add(assistant_msg)

    if response:
        advice_entry = AdviceLog(
            user_id=current_user.id,
            symptom_log_id=symptom_log_id,
            advice=response[:4000],
            language=data.language,
        )
        db.add(advice_entry)

    db.commit()

    return {
        "response": response,
        "predictions": predictions,
        "symptoms_detected": symptoms,
        "emergency": emergency,
        "session_id": session_id,
        "suggest_symptom_check": len(symptoms) >= 3,
    }


@router.post("/translate")
async def translate_text(
    data: TranslateRequest,
    current_user: User = Depends(get_current_user),
):
    sanitise_text(data.text, "text")
    translated = await translate_message(data.text, data.target_language)
    return {"translated": translated, "target_language": data.target_language}


@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(200)
        .all()
    )
    return [
        {
            "id": str(m.id),
            "role": m.role,
            "content": m.content,
            "session_id": m.session_id,
            "created_at": str(m.created_at),
        }
        for m in messages
    ]


@router.get("/sessions")
def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == current_user.id,
            ChatMessage.role == "user",
            ChatMessage.session_id.isnot(None),
        )
        .order_by(ChatMessage.created_at.desc())
        .all()
    )

    seen: dict = {}
    for row in rows:
        sid = row.session_id
        if sid not in seen:
            seen[sid] = {
                "session_id": sid,
                "title": row.content[:60],
                "created_at": str(row.created_at),
            }

    return list(seen.values())
