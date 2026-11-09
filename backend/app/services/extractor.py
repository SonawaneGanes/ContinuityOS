import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import ValidationError

from app.services.schemas import ClaimItem


load_dotenv(Path(__file__).resolve().parents[2] / ".env")

PROMPT = """You extract project handover facts from text.
Return ONLY a JSON list. No explanation and no markdown.
Each item must have these keys:
kind: one of task, deadline, decision
subject: task name or milestone name
owner: person name, or null if not written in the text
due_date: YYYY-MM-DD, or null
status: To Do, In Progress, Done, or null
depends_on: name of the prerequisite task, or null
last_updated: YYYY-MM-DD, or null
quote: copy the exact sentence or line from the text
Only include facts that are written in the text. Do not guess.
Treat tentative language such as "might" or "if time permits" as unconfirmed;
do not assign a confirmed owner or commitment unless the text states it explicitly.
If the same fact appears twice, include it twice with its own quote."""


def _clean_json(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.removeprefix("```json").removeprefix("```")
        raw = raw.removesuffix("```")
    return raw.strip()


def validate_items(raw_items: list[Any]) -> tuple[list[dict[str, Any]], int]:
    """Keep schema-valid claims and count rejected items."""
    valid: list[dict[str, Any]] = []
    invalid = 0
    for item in raw_items:
        try:
            valid.append(ClaimItem.model_validate(item).model_dump())
        except (ValidationError, TypeError):
            invalid += 1
    return valid, invalid


def extract_claims(text: str) -> list[dict[str, Any]]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_key_here":
        raise RuntimeError("OPENAI_API_KEY is not set in backend/.env")

    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
        messages=[
            {"role": "system", "content": PROMPT},
            {"role": "user", "content": text},
        ],
        temperature=0,
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("LLM returned an empty response")
    items = json.loads(_clean_json(content))
    if not isinstance(items, list):
        raise ValueError("LLM did not return a list")

    valid, invalid = validate_items(items)
    print(f"Extraction: {len(valid)} valid, {invalid} invalid claims")
    return valid
