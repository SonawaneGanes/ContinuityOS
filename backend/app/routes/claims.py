from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.database import get_db


router = APIRouter(prefix="/projects", tags=["claims"])


def claim_to_dict(claim: models.Claim) -> dict[str, object]:
    return {
        "id": claim.id,
        "kind": claim.kind,
        "subject": claim.subject,
        "owner": claim.owner,
        "due_date": claim.due_date,
        "status": claim.status,
        "depends_on": claim.depends_on,
        "quote": claim.quote,
        "label": claim.label,
    }


@router.get("/{project_id}/claims")
def list_claims(
    project_id: int, db: Session = Depends(get_db)
) -> list[dict[str, object]]:
    rows = (
        db.query(models.Claim)
        .filter(models.Claim.project_id == project_id)
        .all()
    )
    return [claim_to_dict(claim) for claim in rows]


@router.get("/{project_id}/claims/{claim_id}/source")
def source_for_claim(
    project_id: int, claim_id: int, db: Session = Depends(get_db)
) -> dict[str, object]:
    claim = db.get(models.Claim, claim_id)
    if not claim or claim.project_id != project_id:
        raise HTTPException(status_code=404, detail="Claim not found")

    document = db.get(models.Document, claim.document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Source document not found")
    return {
        "filename": document.filename,
        "text": document.raw_text,
        "start_char": claim.start_char,
        "end_char": claim.end_char,
    }
