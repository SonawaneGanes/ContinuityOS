from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.auth import authorize_project, get_current_user
from app.database import get_db
from app.services.verifier import attest_claim


router = APIRouter(prefix="/projects", tags=["claims"])
READ_ROLES = frozenset({"lead", "successor", "manager"})


class LabelUpdate(BaseModel):
    label: str


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
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> list[dict[str, object]]:
    authorize_project(current_user, project_id, READ_ROLES)
    rows = (
        db.query(models.Claim)
        .filter(models.Claim.project_id == project_id)
        .all()
    )
    return [claim_to_dict(claim) for claim in rows]


@router.get("/{project_id}/claims/{claim_id}/source")
def source_for_claim(
    project_id: int,
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> dict[str, object]:
    authorize_project(current_user, project_id, READ_ROLES)
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
        "attested": attest_claim(
            document.raw_text, claim.quote, claim.start_char, claim.end_char
        ),
    }


@router.get("/{project_id}/attestation")
def project_attestation(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> dict[str, object]:
    authorize_project(current_user, project_id, READ_ROLES)
    return calculate_project_attestation(db, project_id)


def calculate_project_attestation(
    db: Session, project_id: int
) -> dict[str, object]:
    claims = (
        db.query(models.Claim)
        .filter(models.Claim.project_id == project_id)
        .order_by(models.Claim.id)
        .all()
    )
    document_ids = {claim.document_id for claim in claims}
    documents = {
        document.id: document.raw_text
        for document in db.query(models.Document)
        .filter(
            models.Document.id.in_(document_ids),
            models.Document.project_id == project_id,
        )
        .all()
    } if document_ids else {}
    failed_claim_ids = [
        claim.id
        for claim in claims
        if not attest_claim(
            documents.get(claim.document_id, ""),
            claim.quote,
            claim.start_char,
            claim.end_char,
        )
    ]
    failed = len(failed_claim_ids)
    total = len(claims)
    return {
        "total": total,
        "attested": total - failed,
        "failed": failed,
        "failed_claim_ids": failed_claim_ids,
    }


@router.patch("/{project_id}/claims/{claim_id}/label")
def update_claim_label(
    project_id: int,
    claim_id: int,
    update: LabelUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> dict[str, object]:
    authorize_project(current_user, project_id, {"lead"})
    if update.label not in {"VERIFIED", "UNCERTAIN", "CONFLICTING", "MISSING"}:
        raise HTTPException(status_code=422, detail="Invalid claim label")

    claim = db.get(models.Claim, claim_id)
    if claim is None or claim.project_id != project_id:
        raise HTTPException(status_code=404, detail="Claim not found")
    claim.label = update.label
    db.commit()
    return claim_to_dict(claim)
