from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from openai import APIError
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.services.extractor import extract_claims
from app.services.parser import parse_file
from app.services.verifier import locate_and_verify


router = APIRouter(prefix="/projects", tags=["upload"])


@router.post("")
def create_project(name: str, db: Session = Depends(get_db)) -> dict[str, object]:
    name = name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Project name cannot be empty")

    project = models.Project(name=name)
    db.add(project)
    db.commit()
    db.refresh(project)
    return {"id": project.id, "name": project.name, "status": project.status}


@router.post("/{project_id}/upload")
async def upload_file(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> dict[str, int]:
    if not db.get(models.Project, project_id):
        raise HTTPException(status_code=404, detail="Project not found")

    content = await file.read()
    try:
        text = parse_file(file.filename or "", content)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    document = models.Document(
        project_id=project_id,
        filename=file.filename or "upload",
        raw_text=text,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    try:
        items = extract_claims(text)
    except (APIError, RuntimeError, ValueError) as error:
        raise HTTPException(status_code=502, detail=f"Extraction failed: {error}") from error

    saved = 0
    rejected = 0
    for item in items:
        if not isinstance(item, dict):
            rejected += 1
            continue
        quote = item.get("quote")
        span = locate_and_verify(text, quote)
        if span is None:
            rejected += 1
            continue

        claim = models.Claim(
            project_id=project_id,
            document_id=document.id,
            kind=item.get("kind"),
            subject=item.get("subject"),
            owner=item.get("owner"),
            due_date=item.get("due_date"),
            status=item.get("status"),
            depends_on=item.get("depends_on"),
            last_updated=item.get("last_updated"),
            quote=quote,
            start_char=span[0],
            end_char=span[1],
        )
        db.add(claim)
        saved += 1

    db.commit()
    return {
        "document_id": document.id,
        "claims_saved": saved,
        "claims_rejected": rejected,
    }
