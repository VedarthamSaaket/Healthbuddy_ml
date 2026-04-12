from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from models.database import get_db, User
from utils.auth import hash_password, verify_password, create_access_token, get_current_user, set_auth_cookie, delete_auth_cookie

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
def signup(data: SignupRequest, response: Response, db: Session = Depends(get_db)):
    if data.role not in ("user", "doctor"):
        print(f"Signup failed: invalid role {data.role}")
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'doctor'")
    if len(data.password) < 8:
        print(f"Signup failed: password too short for {data.email}")
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        print(f"Signup failed: email {data.email} already registered")
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
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
def signin(data: SigninRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        print(f"Signin failed: user {data.email} not found")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(data.password, user.password_hash):
        print(f"Signin failed: wrong password for {data.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    set_auth_cookie(response, token)
    return {"message": "Signed in", "user_id": str(user.id), "role": user.role}


@router.post("/signout")
def signout(response: Response):
    delete_auth_cookie(response)
    return {"message": "Signed out"}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    print(f"Fetching /me for user: {current_user.email} ({current_user.role})")
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