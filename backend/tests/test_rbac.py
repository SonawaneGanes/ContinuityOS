from app import models
from app.auth import hash_password


def create_user(db_session, username: str, role: str) -> models.User:
    user = models.User(
        username=username,
        password_hash=hash_password("test-password-with-sufficient-length"),
        role=role,
    )
    db_session.add(user)
    db_session.commit()
    return user


def login(client, username: str) -> str:
    response = client.post(
        "/auth/login",
        json={"username": username, "password": "test-password-with-sufficient-length"},
    )
    assert response.status_code == 200
    return response.json()["token"]


def test_login_success_returns_token_role_and_username(client, db_session):
    create_user(db_session, "lead-user", "lead")

    response = client.post(
        "/auth/login",
        json={"username": "lead-user", "password": "test-password-with-sufficient-length"},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "lead"
    assert response.json()["username"] == "lead-user"
    assert response.json()["token"]


def test_login_failure_returns_401(client, db_session):
    create_user(db_session, "lead-user", "lead")

    response = client.post(
        "/auth/login",
        json={"username": "lead-user", "password": "incorrect-password"},
    )

    assert response.status_code == 401


def test_missing_token_returns_401(client):
    response = client.get("/projects/1/claims")

    assert response.status_code == 401


def test_successor_cannot_approve(client, db_session):
    create_user(db_session, "successor-user", "successor")
    token = login(client, "successor-user")

    response = client.post(
        "/projects/1/approve?approved_by=Successor",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_manager_can_approve(client, db_session):
    create_user(db_session, "manager-user", "manager")
    project = models.Project(name="Test project")
    db_session.add(project)
    db_session.commit()
    token = login(client, "manager-user")

    response = client.post(
        f"/projects/{project.id}/approve?approved_by=Manager",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "approved"


def test_lead_can_upload(client, db_session, monkeypatch):
    create_user(db_session, "lead-user", "lead")
    project = models.Project(name="Test project")
    db_session.add(project)
    db_session.commit()
    token = login(client, "lead-user")
    monkeypatch.setattr(
        "app.routes.upload.extract_claims",
        lambda _: [
            {
                "kind": "task",
                "subject": "Task",
                "quote": "Task is in progress.",
            }
        ],
    )

    response = client.post(
        f"/projects/{project.id}/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("notes.txt", b"Task is in progress.", "text/plain")},
    )

    assert response.status_code == 200
    assert response.json()["claims_saved"] == 1
