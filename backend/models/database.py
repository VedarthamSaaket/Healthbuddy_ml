from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid
from config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id            = Column(String, primary_key=True, default=generate_uuid)
    email         = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    full_name     = Column(String, nullable=True)
    role          = Column(String, default="user")
    age_confirmed = Column(Boolean, default=False)
    theme         = Column(String, default="dark")
    language      = Column(String, default="en")
    created_at    = Column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id         = Column(String, primary_key=True, default=generate_uuid)
    user_id    = Column(String, nullable=False, index=True)
    session_id = Column(String, nullable=True, index=True)
    role       = Column(String, nullable=False)
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SymptomLog(Base):
    __tablename__ = "symptom_logs"
    id          = Column(String, primary_key=True, default=generate_uuid)
    user_id     = Column(String, nullable=False, index=True)
    session_id  = Column(String, nullable=True, index=True)
    symptoms    = Column(JSON, default=list)
    predictions = Column(JSON, default=list)
    raw_text    = Column(Text, nullable=True)
    source      = Column(String, default="chat")
    created_at  = Column(DateTime, default=datetime.utcnow)


class AdviceLog(Base):
    __tablename__ = "advice_logs"
    id             = Column(String, primary_key=True, default=generate_uuid)
    user_id        = Column(String, nullable=False, index=True)
    symptom_log_id = Column(String, nullable=True)
    advice         = Column(Text, nullable=False)
    language       = Column(String, default="en")
    created_at     = Column(DateTime, default=datetime.utcnow)


class MedicationLog(Base):
    """Stores medication recommendations generated from symptom data."""
    __tablename__ = "medication_logs"
    id              = Column(String, primary_key=True, default=generate_uuid)
    user_id         = Column(String, nullable=False, index=True)
    symptom_log_id  = Column(String, nullable=True)   # linked symptom analysis
    condition       = Column(String, nullable=True)    # inferred condition
    recommendations = Column(Text, nullable=False)     # full LLM recommendation text
    predictions     = Column(JSON, default=list)       # ML predictions at time of generation
    language        = Column(String, default="en")
    created_at      = Column(DateTime, default=datetime.utcnow)


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"
    id         = Column(String, primary_key=True, default=generate_uuid)
    user_id    = Column(String, unique=True, nullable=False, index=True)
    name       = Column(String, nullable=False)
    specialty  = Column(String, nullable=False)
    bio        = Column(Text, nullable=True)
    available  = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Appointment(Base):
    __tablename__ = "appointments"
    id           = Column(String, primary_key=True, default=generate_uuid)
    user_id      = Column(String, nullable=False, index=True)
    doctor_id    = Column(String, nullable=False, index=True)
    doctor_name  = Column(String, nullable=True)
    specialty    = Column(String, nullable=True)
    status       = Column(String, default="pending")
    note         = Column(Text, nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow)


class EmergencyLog(Base):
    __tablename__ = "emergency_logs"
    id        = Column(String, primary_key=True, default=generate_uuid)
    user_id   = Column(String, nullable=True)
    symptoms  = Column(Text, nullable=False)
    logged_at = Column(DateTime, default=datetime.utcnow)