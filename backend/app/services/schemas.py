from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator


class ClaimItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["task", "deadline", "decision"]
    subject: str
    owner: str | None = None
    due_date: str | None = None
    status: str | None = None
    depends_on: str | None = None
    last_updated: str | None = None
    quote: str

    @field_validator("owner", "status", "depends_on")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("subject")
    @classmethod
    def normalize_subject(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("subject must not be empty")
        return value

    @field_validator("due_date", "last_updated")
    @classmethod
    def check_date_format(cls, value: str | None) -> str | None:
        if value is None:
            return value
        parsed = date.fromisoformat(value)
        if parsed.isoformat() != value:
            raise ValueError("date must use YYYY-MM-DD format")
        return value

    @field_validator("quote")
    @classmethod
    def quote_not_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("quote must not be empty")
        return value
