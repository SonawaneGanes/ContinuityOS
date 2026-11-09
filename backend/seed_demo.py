from app import models
from app.database import Base, SessionLocal, engine


ROWS = [
    (
        "task",
        "SMS notification service",
        None,
        None,
        "In Progress",
        None,
        "2026-09-01",
        "SMS notification service is in progress.",
    ),
    (
        "task",
        "Login API",
        "Ravi Kumar",
        None,
        "In Progress",
        None,
        "2026-10-28",
        "Login API is in progress, owner Ravi Kumar.",
    ),
    (
        "task",
        "Export to CSV",
        None,
        None,
        "To Do",
        None,
        None,
        "Export to CSV still needs to be picked up.",
    ),
    (
        "task",
        "Admin dashboard",
        "Shreyas",
        None,
        "To Do",
        "T9",
        "2026-11-01",
        "Admin dashboard depends on T9.",
    ),
    (
        "deadline",
        "deployment",
        None,
        "2026-11-20",
        None,
        None,
        None,
        "Deployment date: 20 November 2026.",
    ),
    (
        "deadline",
        "deployment",
        None,
        "2026-11-25",
        None,
        None,
        None,
        "Deployment is moved to 25 November.",
    ),
    (
        "deadline",
        "report submission",
        None,
        "2026-11-15",
        None,
        None,
        None,
        "Report submission: 15 November 2026.",
    ),
    (
        "deadline",
        "report submission",
        None,
        "2026-11-18",
        None,
        None,
        None,
        "Report submission is 18 November now.",
    ),
]


def seed_demo() -> int:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        project = (
            db.query(models.Project)
            .filter(models.Project.name == "Demo Attendance")
            .first()
        )
        if project is None:
            project = models.Project(name="Demo Attendance")
            db.add(project)
            db.flush()

        existing_demo = (
            db.query(models.Document)
            .filter(
                models.Document.project_id == project.id,
                models.Document.filename == "demo_source.txt",
            )
            .first()
        )
        if existing_demo is None:
            raw_text = "\n".join(row[-1] for row in ROWS)
            document = models.Document(
                project_id=project.id,
                filename="demo_source.txt",
                raw_text=raw_text,
            )
            db.add(document)
            db.flush()

            for kind, subject, owner, due, status, depends, updated, quote in ROWS:
                start = raw_text.index(quote)
                db.add(
                    models.Claim(
                        project_id=project.id,
                        document_id=document.id,
                        kind=kind,
                        subject=subject,
                        owner=owner,
                        due_date=due,
                        status=status,
                        depends_on=depends,
                        last_updated=updated,
                        quote=quote,
                        start_char=start,
                        end_char=start + len(quote),
                    )
                )
        db.commit()
        return project.id


if __name__ == "__main__":
    print(f"Seeded project id {seed_demo()} with {len(ROWS)} demo claims.")
