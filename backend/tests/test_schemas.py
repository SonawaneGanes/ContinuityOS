import pytest
from pydantic import ValidationError

from app.services.schemas import ClaimItem
from app.services.extractor import validate_items


def test_valid_claim_uses_optional_defaults():
    item = ClaimItem(kind="task", subject="Login API", quote="Login API is planned.")
    assert item.owner is None
    assert item.due_date is None


def test_invalid_kind_is_rejected():
    with pytest.raises(ValidationError):
        ClaimItem(kind="bug", subject="Login API", quote="A source quote.")


@pytest.mark.parametrize("value", ["2026-2-03", "20260203", "not-a-date"])
def test_non_iso_calendar_date_is_rejected(value):
    with pytest.raises(ValidationError):
        ClaimItem(
            kind="task",
            subject="Login API",
            due_date=value,
            quote="A source quote.",
        )


def test_empty_subject_and_quote_are_rejected():
    with pytest.raises(ValidationError):
        ClaimItem(kind="task", subject="  ", quote="A source quote.")
    with pytest.raises(ValidationError):
        ClaimItem(kind="task", subject="Login API", quote="  ")


def test_validate_items_keeps_valid_items_and_counts_invalid_items():
    valid, invalid = validate_items(
        [
            {"kind": "task", "subject": "Login API", "quote": "Login API is planned."},
            {"kind": "bug", "subject": "Bad kind", "quote": "A quote."},
            None,
        ]
    )
    assert len(valid) == 1
    assert invalid == 2
