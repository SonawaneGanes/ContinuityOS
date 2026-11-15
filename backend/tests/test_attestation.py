from app import models
from app.auth import hash_password


def test_source_response_includes_matching_attestation(client, db_session):
    user = models.User(
        username="lead-user",
        password_hash=hash_password("test-password-with-sufficient-length"),
        role="lead",
    )
    project = models.Project(name="Test project")
    db_session.add_all([user, project])
    db_session.commit()
    text = "The source sentence."
    document = models.Document(
        project_id=project.id,
        filename="notes.txt",
        raw_text=text,
    )
    db_session.add(document)
    db_session.commit()
    claim = models.Claim(
        project_id=project.id,
        document_id=document.id,
        kind="task",
        subject="Sample task",
        quote=text,
        start_char=0,
        end_char=len(text),
    )
    db_session.add(claim)
    db_session.commit()
    login_response = client.post(
        "/auth/login",
        json={
            "username": "lead-user",
            "password": "test-password-with-sufficient-length",
        },
    )

    response = client.get(
        f"/projects/{project.id}/claims/{claim.id}/source",
        headers={"Authorization": f"Bearer {login_response.json()['token']}"},
    )

    assert response.status_code == 200
    assert response.json()["attested"] is True


def test_approval_is_rejected_for_failed_attestation(client, db_session):
    manager = models.User(
        username="manager-user",
        password_hash=hash_password("test-password-with-sufficient-length"),
        role="manager",
    )
    project = models.Project(name="Test project")
    db_session.add_all([manager, project])
    db_session.commit()
    document = models.Document(
        project_id=project.id,
        filename="notes.txt",
        raw_text="The actual source sentence.",
    )
    db_session.add(document)
    db_session.commit()
    claim = models.Claim(
        project_id=project.id,
        document_id=document.id,
        kind="task",
        subject="Sample task",
        quote="The actual source sentence.",
        start_char=0,
        end_char=5,
    )
    db_session.add(claim)
    db_session.commit()

    login_response = client.post(
        "/auth/login",
        json={
            "username": "manager-user",
            "password": "test-password-with-sufficient-length",
        },
    )
    token = login_response.json()["token"]
    summary = client.get(
        f"/projects/{project.id}/attestation",
        headers={"Authorization": f"Bearer {token}"},
    )
    response = client.post(
        f"/projects/{project.id}/approve?approved_by=Manager",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert summary.json() == {
        "total": 1,
        "attested": 0,
        "failed": 1,
        "failed_claim_ids": [claim.id],
    }
    assert response.status_code == 400
    assert "failed quote attestation" in response.json()["detail"]
