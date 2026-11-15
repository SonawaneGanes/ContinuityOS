import secrets

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app import models
from app.auth import ROLES, hash_password, verify_password
from app.database import get_db


router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=1024)


@router.post("/login")
def login(
    credentials: LoginRequest, db: Session = Depends(get_db)
) -> dict[str, str]:
    user = (
        db.query(models.User)
        .filter(models.User.username == credentials.username.strip())
        .first()
    )
    if (
        user is None
        or user.role not in ROLES
        or not verify_password(credentials.password, user.password_hash)
    ):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = secrets.token_urlsafe(32)
    db.add(models.AuthSession(token=token, user_id=user.id))
    db.commit()
    return {"token": token, "role": user.role, "username": user.username}
