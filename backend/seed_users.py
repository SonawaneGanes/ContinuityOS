import os

from app import models
from app.auth import hash_password
from app.database import Base, SessionLocal, engine


SEED_USERS = (
    ("lead", "lead", "SEED_LEAD_PASSWORD"),
    ("successor", "successor", "SEED_SUCCESSOR_PASSWORD"),
    ("manager", "manager", "SEED_MANAGER_PASSWORD"),
)
MINIMUM_PASSWORD_LENGTH = 24


def main() -> None:
    passwords = {}
    for username, _, environment_name in SEED_USERS:
        password = os.getenv(environment_name)
        if not password or len(password) < MINIMUM_PASSWORD_LENGTH:
            raise RuntimeError(
                f"{environment_name} must be set to at least "
                f"{MINIMUM_PASSWORD_LENGTH} characters"
            )
        passwords[username] = password

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        for username, role, _ in SEED_USERS:
            user = (
                db.query(models.User)
                .filter(models.User.username == username)
                .first()
            )
            if user is None:
                db.add(
                    models.User(
                        username=username,
                        password_hash=hash_password(passwords[username]),
                        role=role,
                    )
                )
                print(f"Created {role} user")
            else:
                print(f"{role.capitalize()} user already exists; left unchanged")
        db.commit()


if __name__ == "__main__":
    main()
