from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import models
from app.database import Base, engine
from app.routes import claims, gaps, handover, upload


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="ContinuityOS API", lifespan=lifespan)
app.include_router(upload.router)
app.include_router(claims.router)
app.include_router(gaps.router)
app.include_router(handover.router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
