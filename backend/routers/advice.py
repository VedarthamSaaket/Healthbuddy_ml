from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import cast, String
from pydantic import BaseModel
from models.database import get_db, User, SymptomLog, MedicationLog
from utils.auth import get_current_user
from services.llm import analyse_symptoms, generate_medication_recommendations, virtual_assessment
from services.ml import ensemble_predict, is_emergency
from security import sanitise_text, assert_owns_resource, log_security_event

router = APIRouter(tags=["health"])

MIN_WORD_COUNT = 10

SHORT_INPUT_RESPONSES = {
    "en": "Please describe your symptoms in more detail (at least a few words) so we can give you accurate results.",
    "hi": "कृपया अपने लक्षणों को अधिक विस्तार से बताएं ताकि हम सटीक परिणाम दे सकें।",
    "te": "దయచేసి మీ లక్షణాలను మరింత వివరంగా వివరించండి, తద్వారా మేము ఖచ్చితమైన ఫలితాలు అందించగలము.",
    "kn": "ದಯವಿಟ್ಟು ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಹೆಚ್ಚು ವಿವರವಾಗಿ ವಿವರಿಸಿ ಇದರಿಂದ ನಾವು ನಿಖರ ಫಲಿತಾಂಶಗಳನ್ನು ನೀಡಬಹುದು.",
}


class SymptomRequest(BaseModel):
    symptoms_text: str
    language: str = "en"


class MedicationRequest(BaseModel):
    query: str = ""
    language: str = "en"
    symptom_log_id: str = ""


@router.post("/api/advice/generate")
async def generate_advice_route(
    data: SymptomRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    text = data.symptoms_text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    sanitise_text(text, "symptoms_text")

    if len(text.split()) < MIN_WORD_COUNT:
        short_msg = SHORT_INPUT_RESPONSES.get(data.language, SHORT_INPUT_RESPONSES["en"])
        raise HTTPException(status_code=400, detail=short_msg)

    ml_predictions = ensemble_predict(text)
    emergency = is_emergency(text)

    llm_predictions, guidance = await analyse_symptoms(
        symptoms_text=text,
        language=data.language,
    )

    final_predictions = llm_predictions if llm_predictions else ml_predictions

    log = SymptomLog(
        user_id=current_user.id,
        symptoms=[],
        raw_text=text,
        predictions=final_predictions,
        source="symptom_check",
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return {
        "id": str(log.id),
        "predictions": final_predictions,
        "advice": guidance,
        "emergency": emergency,
    }


@router.get("/api/advice/history")
def get_advice_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id_str = str(current_user.id)
    logs = (
        db.query(SymptomLog)
        .filter(cast(SymptomLog.user_id, String) == user_id_str)
        .order_by(SymptomLog.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": str(log.id),
            "symptoms": log.symptoms,
            "predictions": log.predictions,
            "raw_text": log.raw_text,
            "source": log.source,
            "created_at": str(log.created_at),
        }
        for log in logs
    ]


@router.post("/api/medication/generate")
async def generate_medication(
    data: MedicationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id_str = str(current_user.id)

    if data.query:
        sanitise_text(data.query, "query")

    query = db.query(SymptomLog).filter(
        cast(SymptomLog.user_id, String) == user_id_str
    )

    if data.symptom_log_id:
        target_log = db.query(SymptomLog).filter(
            cast(SymptomLog.id, String) == data.symptom_log_id
        ).first()
        if target_log:
            assert_owns_resource(current_user.id, target_log.user_id, "symptom log")
        query = query.filter(cast(SymptomLog.id, String) == data.symptom_log_id)

    symptom_logs = query.order_by(SymptomLog.created_at.desc()).limit(5).all()

    if not symptom_logs:
        raise HTTPException(
            status_code=400,
            detail="No symptom data found. Please complete a Symptom Check first."
        )

    symptom_logs_data = [
        {
            "symptoms": log.symptoms,
            "predictions": log.predictions,
            "raw_text": log.raw_text,
            "created_at": str(log.created_at),
        }
        for log in symptom_logs
    ]

    latest_predictions = symptom_logs[0].predictions if symptom_logs else []

    recommendations = await generate_medication_recommendations(
        symptom_logs=symptom_logs_data,
        predictions=latest_predictions,
        language=data.language,
        user_query=data.query,
    )

    condition = latest_predictions[0].get("disease", "") if latest_predictions else ""

    med_log = MedicationLog(
        user_id=current_user.id,
        symptom_log_id=symptom_logs[0].id if symptom_logs else None,
        condition=condition,
        recommendations=recommendations[:6000],
        predictions=latest_predictions,
        language=data.language,
    )
    db.add(med_log)
    db.commit()
    db.refresh(med_log)

    return {
        "id": str(med_log.id),
        "recommendations": recommendations,
        "condition": condition,
        "predictions": latest_predictions,
        "symptom_summary": symptom_logs_data[0] if symptom_logs_data else {},
    }


@router.get("/api/medication/history")
def get_medication_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id_str = str(current_user.id)
    logs = (
        db.query(MedicationLog)
        .filter(cast(MedicationLog.user_id, String) == user_id_str)
        .order_by(MedicationLog.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": str(log.id),
            "condition": log.condition,
            "recommendations": log.recommendations,
            "predictions": log.predictions,
            "language": log.language,
            "created_at": str(log.created_at),
        }
        for log in logs
    ]


@router.get("/api/medication/symptom-logs")
def get_symptom_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id_str = str(current_user.id)
    logs = (
        db.query(SymptomLog)
        .filter(cast(SymptomLog.user_id, String) == user_id_str)
        .order_by(SymptomLog.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": str(log.id),
            "symptoms": log.symptoms,
            "predictions": log.predictions,
            "raw_text": log.raw_text,
            "source": log.source,
            "created_at": str(log.created_at),
        }
        for log in logs
    ]
