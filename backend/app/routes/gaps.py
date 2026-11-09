from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.routes.claims import claim_to_dict
from app.services.gaps import run_all_checks


router = APIRouter(prefix="/projects", tags=["gaps"])


@router.get("/{project_id}/gaps")
def get_gaps(project_id: int, db: Session = Depends(get_db)) -> dict[str, object]:
    claims = (
        db.query(models.Claim)
        .filter(models.Claim.project_id == project_id)
        .all()
    )
    report = run_all_checks(claims)
    return {
        "readiness_score": report["readiness_score"],
        "unowned_tasks": [claim_to_dict(c) for c in report["unowned_tasks"]],
        "conflicting_deadlines": [
            claim_to_dict(c) for c in report["conflicting_deadlines"]
        ],
        "stale_tasks": [claim_to_dict(c) for c in report["stale_tasks"]],
        "broken_dependencies": [
            claim_to_dict(c) for c in report["broken_dependencies"]
        ],
    }
