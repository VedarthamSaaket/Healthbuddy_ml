# import re
# from difflib import SequenceMatcher
# from typing import List, Tuple

# DISEASE_PROFILES: dict[str, dict] = {
#     "Common Cold": {
#         "symptoms": ["runny nose", "sneezing", "sore throat", "cough", "congestion", "mild fever", "fatigue", "headache"],
#         "weight": 1.0,
#     },
#     "Influenza": {
#         "symptoms": ["high fever", "body ache", "chills", "fatigue", "cough", "headache", "sore throat", "muscle pain"],
#         "weight": 1.1,
#     },
#     "COVID-19": {
#         "symptoms": ["fever", "dry cough", "fatigue", "loss of taste", "loss of smell", "shortness of breath", "body ache", "headache", "sore throat"],
#         "weight": 1.2,
#     },
#     "Dengue Fever": {
#         "symptoms": ["high fever", "severe headache", "joint pain", "muscle pain", "rash", "fatigue", "nausea", "vomiting", "pain behind eyes"],
#         "weight": 1.2,
#     },
#     "Malaria": {
#         "symptoms": ["fever", "chills", "sweating", "headache", "nausea", "vomiting", "fatigue", "muscle pain"],
#         "weight": 1.1,
#     },
#     "Typhoid": {
#         "symptoms": ["sustained fever", "weakness", "stomach pain", "headache", "loss of appetite", "constipation", "diarrhea", "rash"],
#         "weight": 1.1,
#     },
#     "Pneumonia": {
#         "symptoms": ["chest pain", "cough", "fever", "shortness of breath", "fatigue", "chills", "sweating", "nausea"],
#         "weight": 1.2,
#     },
#     "Asthma": {
#         "symptoms": ["wheezing", "shortness of breath", "chest tightness", "cough", "difficulty breathing"],
#         "weight": 1.0,
#     },
#     "Diabetes (Type 2)": {
#         "symptoms": ["frequent urination", "excessive thirst", "fatigue", "blurred vision", "slow healing wounds", "tingling hands", "weight loss"],
#         "weight": 1.1,
#     },
#     "Hypertension": {
#         "symptoms": ["headache", "dizziness", "blurred vision", "chest pain", "shortness of breath", "nosebleed", "fatigue"],
#         "weight": 1.0,
#     },
#     "Migraine": {
#         "symptoms": ["severe headache", "nausea", "vomiting", "light sensitivity", "sound sensitivity", "visual disturbances", "dizziness"],
#         "weight": 1.0,
#     },
#     "Gastroenteritis": {
#         "symptoms": ["nausea", "vomiting", "diarrhea", "stomach cramps", "fever", "muscle aches", "headache"],
#         "weight": 1.0,
#     },
#     "Urinary Tract Infection": {
#         "symptoms": ["burning urination", "frequent urination", "cloudy urine", "pelvic pain", "fever", "strong urine odor", "blood in urine"],
#         "weight": 1.0,
#     },
#     "Anemia": {
#         "symptoms": ["fatigue", "weakness", "pale skin", "shortness of breath", "dizziness", "cold hands", "chest pain", "headache"],
#         "weight": 1.0,
#     },
#     "Hypothyroidism": {
#         "symptoms": ["fatigue", "weight gain", "cold sensitivity", "constipation", "dry skin", "muscle weakness", "depression", "slow heartbeat"],
#         "weight": 1.0,
#     },
#     "Appendicitis": {
#         "symptoms": ["severe abdominal pain", "nausea", "vomiting", "fever", "loss of appetite", "abdominal swelling", "pain near navel"],
#         "weight": 1.3,
#     },
#     "Chickenpox": {
#         "symptoms": ["itchy rash", "blisters", "fever", "fatigue", "headache", "loss of appetite"],
#         "weight": 1.0,
#     },
#     "Tuberculosis": {
#         "symptoms": ["persistent cough", "coughing blood", "chest pain", "night sweats", "weight loss", "fatigue", "fever", "chills"],
#         "weight": 1.2,
#     },
#     "Jaundice": {
#         "symptoms": ["yellow skin", "yellow eyes", "dark urine", "pale stool", "fatigue", "abdominal pain", "nausea", "fever"],
#         "weight": 1.1,
#     },
#     "Arthritis": {
#         "symptoms": ["joint pain", "joint stiffness", "swelling", "reduced range of motion", "redness", "warmth around joint"],
#         "weight": 1.0,
#     },
# }

# EMERGENCY_SYMPTOMS = [
#     "chest pain", "difficulty breathing", "shortness of breath", "unconscious",
#     "severe bleeding", "stroke", "paralysis", "heart attack", "cannot breathe",
#     "severe chest pain", "blue lips", "fainting", "seizure", "loss of consciousness",
# ]

# TYPO_MAP = {
#     "headche": "headache", "faver": "fever", "fevr": "fever", "coff": "cough",
#     "nausia": "nausea", "vomitting": "vomiting", "diarhea": "diarrhea",
#     "diarrhoea": "diarrhea", "sorethroat": "sore throat", "runynose": "runny nose",
#     "stomachache": "stomach pain", "tummy ache": "stomach pain", "tirednes": "fatigue",
#     "tired": "fatigue", "breathless": "shortness of breath", "cant breathe": "difficulty breathing",
#     "bodyache": "body ache", "bodyaches": "body ache", "joint aches": "joint pain",
# }

# def normalize_text(text: str) -> str:
#     text = text.lower().strip()
#     for wrong, right in TYPO_MAP.items():
#         text = text.replace(wrong, right)
#     return text

# def extract_symptoms(text: str) -> List[str]:
#     text = normalize_text(text)
#     found = []
#     all_symptoms = set()
#     for profile in DISEASE_PROFILES.values():
#         all_symptoms.update(profile["symptoms"])
#     for symptom in all_symptoms:
#         if symptom in text:
#             found.append(symptom)
#     return list(set(found))

# def model1_rule_based(symptoms: List[str]) -> dict[str, float]:
#     scores: dict[str, float] = {}
#     if not symptoms:
#         return scores
#     for disease, profile in DISEASE_PROFILES.items():
#         matched = sum(1 for s in symptoms if s in profile["symptoms"])
#         if matched > 0:
#             scores[disease] = (matched / len(profile["symptoms"])) * profile["weight"]
#     return scores

# def model2_nlp_weighted(text: str) -> dict[str, float]:
#     scores: dict[str, float] = {}
#     text = normalize_text(text)
#     for disease, profile in DISEASE_PROFILES.items():
#         score = 0.0
#         for symptom in profile["symptoms"]:
#             if symptom in text:
#                 score += 1.0
#             elif any(word in text for word in symptom.split()):
#                 score += 0.4
#         if score > 0:
#             scores[disease] = (score / len(profile["symptoms"])) * profile["weight"]
#     return scores

# def fuzzy_similarity(a: str, b: str) -> float:
#     return SequenceMatcher(None, a, b).ratio()

# def model3_fuzzy(text: str) -> dict[str, float]:
#     scores: dict[str, float] = {}
#     text = normalize_text(text)
#     words = re.findall(r'\w+', text)
#     for disease, profile in DISEASE_PROFILES.items():
#         score = 0.0
#         for symptom in profile["symptoms"]:
#             sym_words = symptom.split()
#             for sw in sym_words:
#                 for tw in words:
#                     sim = fuzzy_similarity(sw, tw)
#                     if sim > 0.82:
#                         score += sim * 0.5
#         if score > 0:
#             scores[disease] = (score / len(profile["symptoms"])) * profile["weight"]
#     return scores

# def ensemble_predict(text: str) -> List[dict]:
#     symptoms = extract_symptoms(text)
#     s1 = model1_rule_based(symptoms)
#     s2 = model2_nlp_weighted(text)
#     s3 = model3_fuzzy(text)

#     all_diseases = set(list(s1.keys()) + list(s2.keys()) + list(s3.keys()))
#     combined: dict[str, float] = {}

#     for d in all_diseases:
#         combined[d] = (
#             s1.get(d, 0.0) * 0.45 +
#             s2.get(d, 0.0) * 0.35 +
#             s3.get(d, 0.0) * 0.20
#         )

#     if not combined:
#         return []

#     max_score = max(combined.values()) or 1.0
#     normalized = {d: round(v / max_score, 3) for d, v in combined.items()}
#     sorted_results = sorted(normalized.items(), key=lambda x: x[1], reverse=True)

#     return [
#         {"disease": d, "confidence": round(conf * 100, 1)}
#         for d, conf in sorted_results[:3]
#         if conf > 0.05
#     ]

# def is_emergency(text: str) -> bool:
#     text_lower = text.lower()
#     return any(kw in text_lower for kw in EMERGENCY_SYMPTOMS)

import re
from difflib import SequenceMatcher
from typing import List

# -----------------------------
# CONFIG
# -----------------------------

MIN_SYMPTOMS_REQUIRED = 2

COMMON_DISEASES = [
    "Common Cold", "Influenza", "Viral Fever",
    "Allergic Rhinitis", "Gastritis", "Migraine"
]

TYPO_MAP = {
    "headche": "headache",
    "faver": "fever",
    "fevr": "fever",
    "coff": "cough",
    "tired": "fatigue"
}

EMERGENCY_SYMPTOMS = [
    "chest pain", "difficulty breathing", "shortness of breath",
    "unconscious", "severe bleeding", "seizure",
    "loss of speech", "paralysis", "severe abdominal pain",
    "vomiting blood", "high fever", "confusion"
]

# -----------------------------
# DISEASE DATABASE
# -----------------------------

DISEASE_PROFILES = {
    "Common Cold": {
        "symptoms": ["runny nose", "sneezing", "sore throat", "cough", "congestion", "mild fever", "fatigue"],
        "weight": 1.0,
    },
    "Influenza": {
        "symptoms": ["high fever", "body ache", "chills", "fatigue", "cough", "headache", "muscle pain"],
        "weight": 1.2,
    },
    "COVID-19": {
        "symptoms": ["fever", "dry cough", "fatigue", "loss of taste", "loss of smell", "shortness of breath"],
        "weight": 1.2,
    },
    "Dengue Fever": {
        "symptoms": ["high fever", "severe headache", "joint pain", "rash", "pain behind eyes"],
        "weight": 1.1,
    },
    "Malaria": {
        "symptoms": ["fever", "chills", "sweating", "headache"],
        "weight": 1.1,
    },
    "Typhoid": {
        "symptoms": ["sustained fever", "weakness", "stomach pain"],
        "weight": 1.0,
    },
    "Pneumonia": {
        "symptoms": ["chest pain", "cough", "fever", "shortness of breath"],
        "weight": 1.3,
    },
    "Migraine": {
        "symptoms": ["severe headache", "nausea", "light sensitivity"],
        "weight": 1.0,
    },

    # NEW ADDITIONS
    "Diabetes": {
        "symptoms": ["frequent urination", "increased thirst", "fatigue", "blurred vision"],
        "weight": 1.1,
    },
    "Hypertension": {
        "symptoms": ["headache", "dizziness", "blurred vision", "chest pain"],
        "weight": 1.0,
    },
    "Asthma": {
        "symptoms": ["shortness of breath", "wheezing", "chest tightness", "cough"],
        "weight": 1.2,
    },
    "Bronchitis": {
        "symptoms": ["cough", "mucus", "fatigue", "chest discomfort"],
        "weight": 1.0,
    },
    "Gastritis": {
        "symptoms": ["stomach pain", "nausea", "vomiting", "bloating"],
        "weight": 1.0,
    },
    "Food Poisoning": {
        "symptoms": ["vomiting", "diarrhea", "stomach cramps", "fever"],
        "weight": 1.1,
    },
    "UTI": {
        "symptoms": ["burning urination", "frequent urination", "lower abdominal pain"],
        "weight": 1.1,
    },
    "Anemia": {
        "symptoms": ["fatigue", "pale skin", "shortness of breath", "dizziness"],
        "weight": 1.0,
    },
    "Anxiety": {
        "symptoms": ["restlessness", "rapid heartbeat", "sweating", "fear"],
        "weight": 0.9,
    },
    "Depression": {
        "symptoms": ["sadness", "fatigue", "loss of interest", "sleep issues"],
        "weight": 0.9,
    },
    "Sinusitis": {
        "symptoms": ["facial pain", "headache", "nasal congestion", "runny nose"],
        "weight": 1.0,
    },
    "Appendicitis": {
        "symptoms": ["lower right abdominal pain", "fever", "nausea"],
        "weight": 1.4,
    },
    "Kidney Stones": {
        "symptoms": ["severe abdominal pain", "back pain", "blood in urine"],
        "weight": 1.3,
    },
    "Heart Attack": {
        "symptoms": ["chest pain", "shortness of breath", "sweating", "arm pain"],
        "weight": 1.6,
    },
}

# -----------------------------
# HELPERS
# -----------------------------

def normalize_text(text: str) -> str:
    text = text.lower()
    for wrong, right in TYPO_MAP.items():
        text = text.replace(wrong, right)
    return text


def fuzzy_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def extract_symptoms(text: str) -> List[str]:
    text = normalize_text(text)
    found = []
    all_symptoms = set()

    for profile in DISEASE_PROFILES.values():
        all_symptoms.update(profile["symptoms"])

    words = text.split()

    for symptom in all_symptoms:
        if symptom in text:
            found.append(symptom)
        else:
            for word in words:
                if fuzzy_similarity(symptom, word) > 0.8:
                    found.append(symptom)

    return list(set(found))


def score_disease(text: str, symptoms: List[str]) -> dict:
    scores = {}

    for disease, profile in DISEASE_PROFILES.items():
        score = 0

        for s in profile["symptoms"]:
            if s in symptoms:
                score += 1
            elif any(fuzzy_similarity(s, word) > 0.8 for word in text.split()):
                score += 0.3

        if score > 0:
            scores[disease] = score * profile["weight"]

    return scores


# -----------------------------
# MAIN PREDICTOR
# -----------------------------

def ensemble_predict(text: str) -> List[dict]:
    text = normalize_text(text)
    symptoms = extract_symptoms(text)

    # Avoid weak predictions
    if len(symptoms) < MIN_SYMPTOMS_REQUIRED:
        return []

    scores = score_disease(text, symptoms)

    if not scores:
        return []

    max_score = max(scores.values())

    normalized = {
        d: round((v / max_score) * 0.8, 3)
        for d, v in scores.items()
    }

    sorted_results = sorted(
        normalized.items(),
        key=lambda x: (x[0] not in COMMON_DISEASES, -x[1])
    )

    return [
        {"disease": d, "confidence": round(conf * 100, 1)}
        for d, conf in sorted_results[:3]
    ]


# -----------------------------
# EMERGENCY DETECTION
# -----------------------------

def is_emergency(text: str) -> bool:
    text = text.lower()
    return any(e in text for e in EMERGENCY_SYMPTOMS)


# -----------------------------
# TEST
# -----------------------------

if __name__ == "__main__":
    user_input = "I have fever, headache and body pain with chills"
    print("Predictions:", ensemble_predict(user_input))
    print("Emergency:", is_emergency(user_input))