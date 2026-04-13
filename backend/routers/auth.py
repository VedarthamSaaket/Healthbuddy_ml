from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from models.database import get_db, User
from utils.auth import hash_password, verify_password, create_access_token, get_current_user, set_auth_cookie, delete_auth_cookie
from security import (
    brute_force_tracker,
    sanitise_text,
    sanitise_email,
    sanitise_password,
    log_security_event,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "user"
    age_confirmed: bool


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
def signup(data: SignupRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    sanitised_email = sanitise_email(str(data.email))
    sanitised_name = sanitise_text(data.full_name, "full_name")
    sanitise_password(data.password)

    if data.role not in ("user", "doctor"):
        log_security_event("INVALID_ROLE", f"role={data.role}", request)
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'doctor'")

    existing = db.query(User).filter(User.email == sanitised_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=sanitised_email,
        password_hash=hash_password(data.password),
        full_name=sanitised_name[:100],
        role=data.role,
        age_confirmed=data.age_confirmed,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    set_auth_cookie(response, token)
    return {"message": "Account created", "user_id": str(user.id), "role": user.role}


@router.post("/signin")
def signin(data: SigninRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    sanitised_email = sanitise_email(str(data.email))

    if brute_force_tracker.is_locked(sanitised_email):
        remaining = brute_force_tracker.lockout_seconds_remaining(sanitised_email)
        log_security_event("BRUTE_FORCE_BLOCKED", f"email_hash={sanitised_email[:8]}...", request)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed attempts. Try again in {remaining} seconds.",
        )

    user = db.query(User).filter(User.email == sanitised_email).first()
    if not user or not verify_password(data.password, user.password_hash):
        brute_force_tracker.record_failure(sanitised_email)
        log_security_event("LOGIN_FAILURE", f"email={sanitised_email}", request)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    brute_force_tracker.reset(sanitised_email)
    token = create_access_token({"sub": str(user.id)})
    set_auth_cookie(response, token)
    return {"message": "Signed in", "user_id": str(user.id), "role": user.role}


@router.post("/signout")
def signout(response: Response):
    delete_auth_cookie(response)
    return {"message": "Signed out"}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "theme": current_user.theme,
        "language": current_user.language,
        "age_confirmed": current_user.age_confirmed,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }
