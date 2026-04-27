import httpx
import json
from config import settings

SYSTEM_PROMPT = """You are HealthBuddy, a compassionate healthcare AI assistant.

STRICT RULES:
diagnoses; only suggest possible conditions.
* Do NOT prescribe exact medication dosages.
* You may suggest common, safe medications when explicitly asked, but keep it general.
* ALWAYS prioritize safety
* You are NOT a doctor.
* NEVER give definitivety without being overly alarmist.

SCOPE OF RESPONSES:

* Only respond to health-related queries.
* If a user asks a non-health-related question, respond with:
  "I am HealthBuddy. Please ask me only about health-related topics."

CONVERSATION LOGIC (VERY IMPORTANT):

1. If the user provides LESS THAN 3 clear symptoms:
   → DO NOT suggest diseases.
   → Ask ONE follow-up question to gather more details.
   → DO NOT mention doctors at this stage.

2. If symptoms are vague (fever, headache, fatigue):
   → Ask distinguishing questions like:

   * "Is the fever high or mild?"
   * "Do you have cough, rash, or body pain?"
   * "How long have you had these symptoms?"
     → DO NOT mention doctors here.

3. ONLY after sufficient symptoms are collected:
   → Suggest using Symptom Check for ML prediction.

4. If ML predictions are available:
   → Explain them carefully:

   * Use phrases like "possible conditions"
   * Mention uncertainty
   * Suggest consulting a doctor ONLY if:
     • symptoms are severe OR
     • condition could be serious OR
     • user asks for treatment/medication

5. Medication handling:
   → If user asks for medicines:
   - Suggest only common, safe options
   - Do NOT give exact dosages
   - THEN advise consulting a doctor if symptoms persist

6. EMERGENCY RULE:
   If symptoms include chest pain, breathing difficulty, unconsciousness:
   → Immediately respond:
   "This could be serious. Please seek immediate medical help or call emergency services (102 / 112 in India)."

STYLE:

* Friendly, calm, and caring
* Keep responses short and clear
* Ask ONLY ONE question at a time
* Try to avoid unnecessary warnings or much repeated doctor recommendations
* if the user selects one language but suddenly starts using another language out of the blue, adjust yourself according to the new language.
  """


AUDIO_LANGUAGE_PROMPTS = {
    "hi": (
        "LANGUAGE INSTRUCTION (highest priority): The user sent a voice message in Hindi. "
        "You MUST reply ENTIRELY in Devanagari Hindi script. "
        "Do NOT use English in your reply. "
        "After each sentence add the Roman transliteration in parentheses, e.g.: वाक्य। (vaakya.) \n\n"
    ),
    "te": (
        "LANGUAGE INSTRUCTION (highest priority): The user sent a voice message in Telugu. "
        "You MUST reply ENTIRELY in Telugu script (తెలుగు లిపి). "
        "Do NOT use English in your reply. "
        "After each sentence add the Roman transliteration in parentheses, e.g.: వాక్యం. (vaakyam.) \n\n"
    ),
    "kn": (
        "LANGUAGE INSTRUCTION (highest priority): The user sent a voice message in Kannada. "
        "You MUST reply ENTIRELY in Kannada script (ಕನ್ನಡ ಲಿಪಿ). "
        "Do NOT use English in your reply. "
        "After each sentence add the Roman transliteration in parentheses, e.g.: ವಾಕ್ಯ. (vaakya.) \n\n"
    ),
    "en": "",
}

MEDICATION_LANGUAGE_NAMES = {
    "hi": "Hindi — write exclusively in Devanagari script (हिन्दी). Example: बुखार के लिए पेरासिटामोल।",
    "te": "Telugu — write exclusively in Telugu script (తెలుగు). Example: జ్వరానికి పారాసిటమాల్.",
    "kn": "Kannada — write exclusively in Kannada script (ಕನ್ನಡ). Example: ಜ್ವರಕ್ಕೆ ಪ್ಯಾರಸಿಟಮಾಲ್.",
    "en": "English",
}

SYMPTOM_LANGUAGE_NAMES = {
    "hi": "Hindi (Devanagari script — हिन्दी)",
    "te": "Telugu (Telugu script — తెలుగు)",
    "kn": "Kannada (Kannada script — ಕನ್ನಡ)",
    "en": "English",
}


def build_symptom_analysis_system_prompt(language: str) -> str:
    lang_name = SYMPTOM_LANGUAGE_NAMES.get(language, "English")

    if language != "en":
        lang_instruction = (
            f"OUTPUT LANGUAGE (HIGHEST PRIORITY — NON-NEGOTIABLE): "
            f"Write the GUIDANCE section of your response entirely in {lang_name}. "
            f"Disease names in the PREDICTIONS block may stay in English for medical clarity. "
            f"Do NOT use English in the GUIDANCE block.\n\n"
        )
    else:
        lang_instruction = ""

    return lang_instruction + """You are Health Buddy's Symptom Analysis module. Analyse the symptoms provided and ALWAYS return a structured assessment. You NEVER ask follow-up questions — you always produce predictions with whatever information is given.

RULES:
1. Always produce the full structured output below. Never substitute it with a question.
2. Map symptoms to the top 3 most likely conditions with realistic confidence scores.
3. Confidence scores should reflect genuine likelihood — do not make all three equal.
4. After the structured PREDICTIONS block, write 2-3 sentences of plain health guidance.
5. Never diagnose definitively — use "possible", "likely", "may indicate".
6. Never prescribe dosages.
7. If symptoms could indicate an emergency (chest pain, difficulty breathing, unconsciousness), prepend a clear emergency warning before the PREDICTIONS block.

OUTPUT FORMAT — use exactly this structure with no deviations:

PREDICTIONS:
1. [Disease name] | [confidence]%
2. [Disease name] | [confidence]%
3. [Disease name] | [confidence]%

GUIDANCE:
[2-3 sentences of health advice relevant to the predictions. Mention when to see a doctor if relevant.]

No text before PREDICTIONS:, no text after the GUIDANCE block.
"""


def build_medication_system_prompt(language: str) -> str:
    lang_name = MEDICATION_LANGUAGE_NAMES.get(language, "English")

    if language != "en":
        lang_instruction = (
            f"OUTPUT LANGUAGE (HIGHEST PRIORITY — NON-NEGOTIABLE): "
            f"You MUST write your ENTIRE response in {lang_name}. "
            f"Do NOT use English anywhere in the response — not in section headers, "
            f"not in bullet points, not in warnings. Every single word must be in {lang_name}. "
            f"The section headers (**Likely Condition**, etc.) must also be translated into {lang_name}.\n\n"
        )
    else:
        lang_instruction = "OUTPUT LANGUAGE: English.\n\n"

    return lang_instruction + """You are Health Buddy's Medication Guidance module. Provide responsible, concise medication information based on ML symptom analysis results.

CRITICAL RULES:
1. Base recommendations ONLY on the provided symptom logs and ML predictions.
2. NEVER prescribe specific dosages as a definitive prescription. Use "commonly used" or "typically recommended".
3. Mention drug classes in addition to brand names where possible.
4. ALWAYS include contraindications and when to see a doctor.
5. If multiple conditions are possible, state this and recommend the safest conservative approach.
6. If symptom data is insufficient, say so and recommend a doctor visit rather than guessing.
7. This module handles medical guidance only. Do not engage with off-topic input.

OUTPUT FORMAT — follow this structure exactly. Translate the section headers into the output language:

**Likely Condition**
- [one short sentence]
- [one short sentence]

**Common OTC Remedies**
- [one short sentence]
- [one short sentence]

**Home Care Measures**
- [one short sentence]
- [one short sentence]

**Dietary Guidance**
- [one short sentence]
- [one short sentence]

**When to See a Doctor**
- [one short sentence]
- [one short sentence]

**Important Warnings**
- [one short sentence]
- [one short sentence]

STRICT FORMAT RULES:
- 2 to 4 bullets per section maximum.
- Each bullet is ONE short sentence only. No long sentences, no sub-clauses.
- No paragraphs anywhere. No preamble. No sign-off line at the end.
- Keep every bullet under 15 words.
"""


def build_history_context(symptom_logs=None, advice_logs=None, medication_logs=None):
    context_parts = []

    if symptom_logs:
        context_parts.append("=== USER'S SYMPTOM CHECK HISTORY ===")
        for log in symptom_logs[-5:]:
            predictions_text = ""
            if log.get("predictions"):
                preds = [f"{p['disease']} ({p['confidence']}%)" for p in log["predictions"]]
                predictions_text = f"ML Predictions: {', '.join(preds)}"
            symptoms_text = ""
            if log.get("symptoms"):
                if isinstance(log["symptoms"], list):
                    symptoms_text = f"Symptoms: {', '.join(log['symptoms'])}"
                else:
                    symptoms_text = f"Symptoms: {log['symptoms']}"
            raw = log.get("raw_text", "")
            date = log.get("created_at", "")
            context_parts.append(
                f"[{date}] {symptoms_text}. {predictions_text}. Input: {raw[:200]}"
            )

    if medication_logs:
        context_parts.append("=== USER'S MEDICATION HISTORY ===")
        for log in medication_logs[-3:]:
            context_parts.append(
                f"[{log.get('created_at', '')}] Condition: {log.get('condition', '')} | "
                f"Recommendations: {log.get('recommendations', '')[:300]}"
            )

    return "\n".join(context_parts) if context_parts else ""


def parse_symptom_analysis(text: str) -> tuple[list[dict], str]:
    import re
    predictions = []
    guidance_lines = []
    in_predictions = False
    in_guidance = False

    for line in text.strip().split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.upper().startswith("PREDICTIONS:"):
            in_predictions = True
            in_guidance = False
            continue
        if line.upper().startswith("GUIDANCE:"):
            in_predictions = False
            in_guidance = True
            continue
        if in_predictions:
            match = re.match(r"^\d+\.\s*(.+?)\s*\|\s*(\d+(?:\.\d+)?)%?", line)
            if match:
                predictions.append({
                    "disease": match.group(1).strip(),
                    "confidence": round(float(match.group(2))),
                })
        elif in_guidance:
            guidance_lines.append(line)

    return predictions, " ".join(guidance_lines).strip()


async def analyse_symptoms(
    symptoms_text: str,
    language: str = "en",
) -> tuple[list[dict], str]:
    use_multilingual = language != "en" and bool(getattr(settings, "MULTILINGUAL_API_KEY", None))

    if use_multilingual:
        api_key = settings.MULTILINGUAL_API_KEY
        base_url = settings.MULTILINGUAL_BASE_URL
        model = settings.MULTILINGUAL_MODEL
    else:
        api_key = settings.GROQ_API_KEY
        base_url = settings.SERVER_BASE_URL
        model = settings.MODEL

    lang_name = SYMPTOM_LANGUAGE_NAMES.get(language, "English")
    lang_reminder = (
        f"\n\nREMINDER: Write the GUIDANCE section entirely in {lang_name}. "
        f"Disease names in PREDICTIONS may stay in English."
    ) if language != "en" else ""

    messages = [
        {"role": "system", "content": build_symptom_analysis_system_prompt(language)},
        {"role": "user", "content": f"Symptoms: {symptoms_text}{lang_reminder}"},
    ]

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 600,
        "temperature": 0.2,
        "top_p": 0.9,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(base_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

            if "choices" in data:
                raw = data["choices"][0]["message"]["content"]
            elif "content" in data:
                content = data["content"]
                raw = "".join(block.get("text", "") for block in content if block.get("type") == "text") if isinstance(content, list) else str(content)
            else:
                raise ValueError(f"Unexpected response shape: {list(data.keys())}")

            predictions, guidance = parse_symptom_analysis(raw)

            if not predictions:
                predictions = [{"disease": "Unspecified condition", "confidence": 60}]
            if not guidance:
                guidance = raw.strip()

            return predictions, guidance

    except httpx.TimeoutException:
        return [], "Analysis timed out. Please try again."
    except Exception as e:
        print(f"Symptom Analysis Error: {type(e).__name__}: {e}")
        return [], "Unable to analyse symptoms right now. Please try again."


async def virtual_assessment(
    user_message: str,
    history: list[dict],
    predictions: list[dict] = None,
    symptom_count: int = 0,
    language: str = "en",
    is_emergency: bool = False,
    audio_language: str = None,
    symptom_logs: list = None,
    advice_logs: list = None,
    medication_logs: list = None,
) -> str:
    use_multilingual = language != "en" and bool(getattr(settings, "MULTILINGUAL_API_KEY", None))

    if use_multilingual:
        api_key = settings.MULTILINGUAL_API_KEY
        base_url = settings.MULTILINGUAL_BASE_URL
        model = settings.MULTILINGUAL_MODEL
    else:
        api_key = settings.GROQ_API_KEY
        base_url = settings.SERVER_BASE_URL
        model = settings.MODEL

    effective_audio_lang = (audio_language or "").strip().lower() or None

    lang_prefix = ""
    if effective_audio_lang and effective_audio_lang != "en":
        lang_prefix = AUDIO_LANGUAGE_PROMPTS.get(effective_audio_lang, "")

    system = lang_prefix + SYSTEM_PROMPT

    if symptom_count < 3:
        system += "\n\nThe user has provided very few symptoms. Ask a follow-up question. Do NOT suggest diseases."

    if is_emergency:
        system += (
            "\n\nEMERGENCY ALERT: The user has described emergency symptoms. "
            "Immediately and urgently tell them to call emergency services (102 / 112 in India, 911 in US). "
            "This is the top priority above everything else."
        )

    if predictions:
        pred_text = "\n".join(
            [f"- {p['disease']} ({p['confidence']}% confidence)" for p in predictions]
        )
        system += (
            f"\n\nML MODEL OUTPUT (share this with the user in simple terms, with appropriate caveats):\n{pred_text}"
        )

    history_context = build_history_context(symptom_logs, advice_logs, medication_logs)
    if history_context:
        system += f"\n\n{history_context}"

    messages = [{"role": "system", "content": system}]
    for msg in history[-10:]:
        if msg.get("role") in ("user", "assistant") and msg.get("content"):
            messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 1500 if use_multilingual else 1200,
        "temperature": 0.5 if use_multilingual else 0.65,
        "top_p": 0.9,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(base_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

            if "choices" in data:
                return data["choices"][0]["message"]["content"]
            elif "content" in data:
                content = data["content"]
                if isinstance(content, list):
                    return "".join(block.get("text", "") for block in content if block.get("type") == "text")
                return str(content)
            else:
                raise ValueError(f"Unexpected response shape: {list(data.keys())}")

    except httpx.TimeoutException:
        return "I'm taking a moment to gather my thoughts. Please try again, I'm here for you."
    except httpx.HTTPStatusError as e:
        status_code = e.response.status_code
        print(f"LLM HTTP Error {status_code}: {e.response.text[:300]}")
        if status_code == 401:
            return "I'm having trouble authenticating with the health service. Please contact support."
        if status_code == 429:
            return "I'm receiving a lot of requests right now. Please wait a moment and try again."
        return (
            "I'm having trouble connecting right now. "
            "If you're experiencing a medical emergency, please call 102 or 112 immediately."
        )
    except Exception as e:
        print(f"LLM Error: {type(e).__name__}: {e}")
        return (
            "I'm having trouble connecting right now. "
            "If you're experiencing a medical emergency, please call 102 or 112 immediately."
        )


async def generate_medication_recommendations(
    symptom_logs: list,
    predictions: list = None,
    language: str = "en",
    user_query: str = "",
) -> str:
    if not symptom_logs and not predictions:
        return (
            "I don't have enough symptom data to make medication recommendations. "
            "Please use the Symptom Check page first, or describe your symptoms in the chat."
        )

    context = "Based on the user's symptom analysis:\n\n"
    if symptom_logs:
        for log in symptom_logs[-3:]:
            if isinstance(log.get("symptoms"), list):
                syms = ", ".join(log["symptoms"])
            else:
                syms = str(log.get("symptoms", ""))
            preds = log.get("predictions", [])
            pred_text = ", ".join([f"{p['disease']} ({p['confidence']}%)" for p in preds]) if preds else "No predictions available"
            context += f"Symptoms: {syms}\nML Predictions: {pred_text}\nRaw description: {log.get('raw_text', '')[:300]}\n\n"

    if predictions:
        pred_text = "\n".join([f"- {p['disease']} ({p['confidence']}% confidence)" for p in predictions])
        context += f"Latest ML predictions:\n{pred_text}\n"

    use_multilingual = language != "en" and bool(getattr(settings, "MULTILINGUAL_API_KEY", None))
    api_key = settings.MULTILINGUAL_API_KEY if use_multilingual else settings.GROQ_API_KEY
    base_url = settings.MULTILINGUAL_BASE_URL if use_multilingual else settings.SERVER_BASE_URL
    model = settings.MULTILINGUAL_MODEL if use_multilingual else settings.MODEL

    lang_name = MEDICATION_LANGUAGE_NAMES.get(language, "English")

    if language != "en":
        lang_reminder = (
            f"\n\nREMINDER: Your response MUST be entirely in {lang_name}. "
            f"Do not write a single word in English. Translate every section header too."
        )
    else:
        lang_reminder = ""

    user_content = (
        f"{context}"
        f"\n\nUser query: {user_query or 'Please provide medication guidance based on my symptoms.'}"
        f"{lang_reminder}"
    )

    messages = [
        {"role": "system", "content": build_medication_system_prompt(language)},
        {"role": "user", "content": user_content},
    ]

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 1200,
        "temperature": 0.2,
        "top_p": 0.9,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(base_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            if "choices" in data:
                return data["choices"][0]["message"]["content"]
            elif "content" in data:
                content = data["content"]
                if isinstance(content, list):
                    return "".join(block.get("text", "") for block in content if block.get("type") == "text")
                return str(content)
    except Exception as e:
        print(f"Medication LLM Error: {type(e).__name__}: {e}")
        return "Unable to generate recommendations right now. Please consult a pharmacist or doctor."


TRANSLATION_SYSTEM_PROMPT = """You are a medical translator. Translate the given medical text accurately.

Rules:
- Translate to the target language specified.
- Keep medical terms accurate.
- After each sentence in the translated text, add the Roman transliteration in parentheses if the target script is non-Latin.
- Return ONLY the translated text with transliterations. No preamble, no explanation.
"""


async def translate_message(text: str, target_language: str) -> str:
    language_names = {
        "hi": "Hindi (Devanagari script — use Devanagari characters, e.g. नमस्ते)",
        "te": "Telugu (Telugu script — use Telugu characters, e.g. నమస్కారం)",
        "kn": "Kannada (Kannada script — use Kannada characters, e.g. ನಮಸ್ಕಾರ)",
    }

    if target_language == "en" or target_language not in language_names:
        return text

    lang_name = language_names[target_language]

    use_multilingual = bool(getattr(settings, "MULTILINGUAL_API_KEY", None))
    api_key = settings.MULTILINGUAL_API_KEY if use_multilingual else settings.GROQ_API_KEY
    base_url = settings.MULTILINGUAL_BASE_URL if use_multilingual else settings.SERVER_BASE_URL
    model = settings.MULTILINGUAL_MODEL if use_multilingual else settings.MODEL

    messages = [
        {"role": "system", "content": TRANSLATION_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Translate this to {lang_name}. "
                f"Write in the native script of that language, not Roman letters. "
                f"After each sentence add the Roman transliteration in parentheses.\n\n{text}"
            ),
        },
    ]

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"model": model, "messages": messages, "max_tokens": 1000, "temperature": 0.3}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(base_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            if "choices" in data:
                return data["choices"][0]["message"]["content"]
            elif "content" in data:
                content = data["content"]
                if isinstance(content, list):
                    return "".join(block.get("text", "") for block in content if block.get("type") == "text")
                return str(content)
    except Exception as e:
        print(f"Translation Error: {type(e).__name__}: {e}")
        return text


def post_process_response(response: str) -> str:
    diagnostic_phrases = [
        "you have diabetes", "you are diabetic", "you have cancer",
        "you are diagnosed with", "your diagnosis is", "you definitely have",
        "take this medication", "you should take", "prescribe",
    ]
    for phrase in diagnostic_phrases:
        if phrase in response.lower():
            response += (
                "\n\n*Note: I am not a doctor and cannot provide diagnoses or prescriptions. "
                "Please consult a qualified healthcare professional.*"
            )
            break
    return response