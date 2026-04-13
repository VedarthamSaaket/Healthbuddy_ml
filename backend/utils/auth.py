from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from models.database import get_db, User
from config import settings
from typing import Optional
import logging

logger = logging.getLogger("uvicorn.error")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    payload = {**data, "sub": str(data["sub"])}
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload["exp"] = expire
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def set_auth_cookie(response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        # secure=True in production (HTTPS). Driven by SECURE_COOKIES env var.
        # Set SECURE_COOKIES=true in your production .env.
        secure=settings.SECURE_COOKIES,
        max_age=604800,
        path="/",
    )


def delete_auth_cookie(response):
    response.delete_cookie(
        key="access_token",
        samesite="lax",
        secure=settings.SECURE_COOKIES,
        path="/",
    )


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )

    token: Optional[str] = request.cookies.get("access_token")

    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[len("Bearer "):]

    if not token:
        logger.warning(f"AUTH FAILED: No token on {request.url.path}")
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            logger.error("AUTH FAILED: Token payload missing 'sub'")
            raise credentials_exception
    except JWTError as e:
        logger.error(f"AUTH FAILED: JWT decode error on {request.url.path}: {e}")
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"AUTH FAILED: User ID {user_id} not found in database")
        raise credentials_exception

    logger.info(f"AUTH OK: {user.email} → {request.url.path}")
    return user


def get_optional_user(
    request: Request,
    db: Session = Depends(get_db),
) -> Optional[User]:
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None