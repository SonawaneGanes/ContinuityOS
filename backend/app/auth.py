import hashlib
import hmac
import secrets

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.database import get_db


PASSWORD_ITERATIONS = 600_000
PASSWORD_ALGORITHM = "pbkdf2_sha256"
ROLES = frozenset({"lead", "successor", "manager"})


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS
    )
    return f"{PASSWORD_ALGORITHM}${PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations_text, salt_hex, digest_hex = password_hash.split("$")
        if algorithm != PASSWORD_ALGORITHM:
            return False
        iterations = int(iterations_text)
        if iterations < 1:
            return False
        expected = bytes.fromhex(digest_hex)
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), iterations
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(actual, expected)


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> models.User:
    scheme, separator, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not separator or not token.strip():
        raise _unauthorized()

    session = db.get(models.AuthSession, token.strip())
    if session is None:
        raise _unauthorized()
    user = db.get(models.User, session.user_id)
    if user is None:
        raise _unauthorized()
    return user


def authorize_project(
    user: models.User, project_id: int, allowed_roles: set[str] | frozenset[str]
) -> None:
    if user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient role")
    if user.project_id is not None and user.project_id != project_id:
        raise HTTPException(status_code=403, detail="User is not assigned to this project")


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=401,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )
