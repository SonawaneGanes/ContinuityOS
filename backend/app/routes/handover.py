from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.services.gaps import run_all_checks


router = APIRouter(prefix="/projects", tags=["handover"])
READINESS_THRESHOLD = 85


@router.post("/{project_id}/approve")
def approve_handover(
    project_id: int,
    approved_by: str = Query(min_length=1),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    approved_by = approved_by.strip()
    if not approved_by:
        raise HTTPException(status_code=422, detail="Approver name cannot be empty")

    project = db.get(models.Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    claims = (
        db.query(models.Claim)
        .filter(models.Claim.project_id == project_id)
        .all()
    )
    score = run_all_checks(claims)["readiness_score"]
    if score < READINESS_THRESHOLD:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Readiness score is {score}. It must be at least "
                f"{READINESS_THRESHOLD} before approval."
            ),
        )

    project.status = "approved"
    db.commit()
    return {
        "status": "approved",
        "approved_by": approved_by,
        "readiness_score": score,
    }
