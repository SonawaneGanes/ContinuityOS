import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv(Path(__file__).resolve().parents[1] / ".env")

PROMPT = """You extract project handover facts from text.
Return ONLY a JSON list. No explanation and no markdown.
Each item must have these keys:
kind (task, deadline or decision)
subject (task name or milestone name)
owner (person name, or null if not written)
due_date (YYYY-MM-DD, or null)
status (To Do, In Progress, Done, or null)
depends_on (name of the prerequisite task, or null)
last_updated (YYYY-MM-DD, or null)
quote (copy the exact sentence or line from the text)
Only include facts that are written in the text. Do not guess."""


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
    raw = content.strip()
    if raw.startswith("```"):
        raw = raw.removeprefix("```json").removeprefix("```")
        raw = raw.removesuffix("```").strip()

    items = json.loads(raw)
    if not isinstance(items, list):
        raise ValueError("LLM did not return a list")
    return items
