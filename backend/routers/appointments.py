from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional 
from models.database import get_db, User, DoctorProfile, Appointment
from utils.auth import get_current_user

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

class AppointmentRequest(BaseModel):
    doctor_id: str
    note: Optional[str] = ""


class AppointmentStatusUpdate(BaseModel):
    status: str   # "confirmed" | "cancelled" | "completed"


@router.get("/doctors")
def list_doctors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all available doctors."""
    doctors = (
        db.query(DoctorProfile)
        .filter(DoctorProfile.available == True)
        .order_by(DoctorProfile.name)
        .all()
    )
    return [
        {
            "id": d.id,
            "user_id": d.user_id,
            "name": d.name,
            "specialty": d.specialty,
            "bio": d.bio,
            "available": d.available,
            "created_at": d.created_at,
        }
        for d in doctors
    ]


@router.post("/book")
def book_appointment(
    data: AppointmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Book an appointment with a doctor."""
    doctor = db.query(DoctorProfile).filter(DoctorProfile.id == data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    if not doctor.available:
        raise HTTPException(status_code=400, detail="Doctor is not available")

    # Check if the user already has a pending appointment with this doctor
    existing = (
        db.query(Appointment)
        .filter(
            Appointment.user_id == current_user.id,
            Appointment.doctor_id == data.doctor_id,
            Appointment.status == "pending",
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending appointment with this doctor")

    appt = Appointment(
        user_id=current_user.id,
        doctor_id=data.doctor_id,
        doctor_name=doctor.name,
        specialty=doctor.specialty,
        status="pending",
        note=data.note[:500] if data.note else "",
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)

    return {
        "id": appt.id,
        "doctor_name": appt.doctor_name,
        "specialty": appt.specialty,
        "status": appt.status,
        "note": appt.note,
        "requested_at": appt.requested_at,
    }


@router.get("/my")
def my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's appointments."""
    appts = (
        db.query(Appointment)
        .filter(Appointment.user_id == current_user.id)
        .order_by(Appointment.requested_at.desc())
        .all()
    )

    result = []
    for a in appts:
        # Resolve doctor name if not stored
        doctor_name = a.doctor_name
        specialty = a.specialty
        if not doctor_name:
            doc = db.query(DoctorProfile).filter(DoctorProfile.id == a.doctor_id).first()
            if doc:
                doctor_name = doc.name
                specialty = doc.specialty

        result.append({
            "id": a.id,
            "doctor_id": a.doctor_id,
            "doctor_name": doctor_name or "Unknown Doctor",
            "specialty": specialty or "General",
            "status": a.status,
            "note": a.note,
            "created_at": a.requested_at,
        })

    return result


@router.get("/doctor-patients")
def doctor_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Doctors can view their appointments."""
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint")

    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found. Please create one.")

    appts = (
        db.query(Appointment)
        .filter(Appointment.doctor_id == profile.id)
        .order_by(Appointment.requested_at.desc())
        .all()
    )

    result = []
    for a in appts:
        patient = db.query(User).filter(User.id == a.user_id).first()
        result.append({
            "id": a.id,
            "patient_name": patient.full_name if patient else "Unknown",
            "patient_email": patient.email if patient else "Unknown",
            "status": a.status,
            "note": a.note,
            "requested_at": a.requested_at,
        })

    return result


@router.patch("/{appointment_id}/status")
def update_status(
    appointment_id: str,
    data: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Doctors can confirm / cancel / complete appointments."""
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can update appointment status")

    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Verify this appointment belongs to this doctor
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not profile or appt.doctor_id != profile.id:
        raise HTTPException(status_code=403, detail="Not authorised to update this appointment")

    valid_statuses = ["pending", "confirmed", "cancelled", "completed"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {valid_statuses}")

    appt.status = data.status
    db.commit()

    return {"id": appt.id, "status": appt.status}


@router.delete("/{appointment_id}")
def cancel_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Patient can cancel their own appointment."""
    appt = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.user_id == current_user.id,
    ).first()

    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appt.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel a completed appointment")

    appt.status = "cancelled"
    db.commit()

    return {"id": appt.id, "status": "cancelled"}


@router.post("/doctor-profile")
def create_doctor_profile(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create or update doctor profile."""
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create a profile")

    existing = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()

    if existing:
        existing.name = data.get("name", existing.name)
        existing.specialty = data.get("specialty", existing.specialty)
        existing.bio = data.get("bio", existing.bio)
        existing.available = data.get("available", existing.available)
        db.commit()
        db.refresh(existing)
        return {"id": existing.id, "name": existing.name, "specialty": existing.specialty}
    else:
        profile = DoctorProfile(
            user_id=current_user.id,
            name=data.get("name", current_user.full_name or "Doctor"),
            specialty=data.get("specialty", "General Medicine"),
            bio=data.get("bio", ""),
            available=True,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return {"id": profile.id, "name": profile.name, "specialty": profile.specialty}