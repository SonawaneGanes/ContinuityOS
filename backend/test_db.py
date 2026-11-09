from sqlalchemy import text

from app.database import engine


try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version()"))
        print("Connected:", result.scalar())
except Exception as exc:
    raise SystemExit(f"Database connection failed: {exc}") from exc
finally:
    engine.dispose()
