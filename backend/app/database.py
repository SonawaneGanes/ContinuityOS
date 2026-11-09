import os
from pathlib import Path
from collections.abc import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, declarative_base, sessionmaker


load_dotenv(Path(__file__).resolve().parents[1] / ".env")
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL is not set in the environment or backend/.env")

database_url_config = make_url(database_url)
if database_url_config.drivername in {"postgres", "postgresql", "postgresql+psycopg"}:
    database_url_config = database_url_config.set(
        drivername="postgresql+psycopg2"
    )

engine = create_engine(database_url_config)
SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
