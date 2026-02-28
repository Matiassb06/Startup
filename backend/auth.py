"""
auth.py – Módulo de autenticación JWT + bcrypt para Train-to-Hire.

Provee:
  - hash_password / verify_password  (bcrypt vía passlib)
  - create_access_token / decode_access_token  (JWT vía python-jose)
  - get_current_user  (FastAPI Dependency)
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

import database
import models

# ── Password hashing ──────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        # Si el hash almacenado no es bcrypt válido (ej. "demo_password_hash"),
        # permitimos acceso temporal comparando texto plano para migración suave.
        return plain == hashed


# ── JWT tokens ─────────────────────────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=database.JWT_EXPIRATION_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, database.JWT_SECRET, algorithm=database.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, database.JWT_SECRET, algorithms=[database.JWT_ALGORITHM])


# ── FastAPI dependency ─────────────────────────────────────────────
def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db),
) -> models.User:
    """Extrae el usuario autenticado del JWT en el header Authorization."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado. Inicia sesión primero.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if token is None:
        raise credentials_exception

    try:
        payload = decode_access_token(token)
        user_id: int = int(payload.get("sub", 0))
        if not user_id:
            raise credentials_exception
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise credentials_exception

    return user


def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db),
) -> Optional[models.User]:
    """Igual que get_current_user pero no falla si no hay token."""
    if not token:
        return None
    try:
        return get_current_user(token=token, db=db)
    except HTTPException:
        return None


def require_role(required: models.UserRole):
    """Devuelve un dependency que valida que el usuario tenga el rol requerido."""
    def dependency(current_user: models.User = Depends(get_current_user)) -> models.User:
        if current_user.role != required:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado: se requiere rol '{required.value}'.",
            )
        return current_user
    return dependency
