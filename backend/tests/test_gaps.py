from datetime import datetime
from types import SimpleNamespace as NS

from app.services.gaps import (
    calculate_readiness_score,
    find_broken_dependencies,
    find_conflicting_deadlines,
    find_stale_tasks,
    find_unowned_tasks,
)


def make(**kwargs):
    base = dict(
        kind=None,
        subject=None,
        owner=None,
        due_date=None,
        status=None,
        depends_on=None,
        last_updated=None,
    )
    base.update(kwargs)
    return NS(**base)


def test_unowned_task_is_found():
    claims = [make(kind="task", subject="SMS service", owner=None)]
    assert len(find_unowned_tasks(claims)) == 1


def test_owned_task_is_not_flagged():
    claims = [make(kind="task", subject="Login API", owner="Ravi Kumar")]
    assert find_unowned_tasks(claims) == []


def test_deadlines_more_than_24_hours_apart_conflict():
    claims = [
        make(kind="deadline", subject="deployment", due_date="2026-11-20"),
        make(kind="deadline", subject="deployment", due_date="2026-11-25"),
    ]
    assert len(find_conflicting_deadlines(claims)) == 2


def test_same_deadline_does_not_conflict():
    claims = [
        make(kind="deadline", subject="deployment", due_date="2026-11-20"),
        make(kind="deadline", subject="deployment", due_date="2026-11-20"),
    ]
    assert find_conflicting_deadlines(claims) == []


def test_old_in_progress_task_is_stale():
    claims = [
        make(
            kind="task",
            subject="SMS service",
            status="In Progress",
            last_updated="2026-09-01",
        )
    ]
    assert len(find_stale_tasks(claims, today=datetime(2026, 11, 9))) == 1


def test_broken_dependency_is_found():
    claims = [make(kind="task", subject="Admin dashboard", depends_on="T9")]
    assert len(find_broken_dependencies(claims)) == 1


def test_readiness_score_formula():
    unowned = [1, 2, 3]
    conflicts = [1, 2]
    assert calculate_readiness_score(unowned, conflicts, [], []) == 81


def test_readiness_counts_conflicting_milestones_not_each_evidence_claim():
    conflicts = [
        make(kind="deadline", subject="deployment", due_date="2026-11-20"),
        make(kind="deadline", subject="deployment", due_date="2026-11-25"),
        make(kind="deadline", subject="report", due_date="2026-11-15"),
        make(kind="deadline", subject="report", due_date="2026-11-18"),
    ]
    assert calculate_readiness_score([], conflicts, [], []) == 90


def test_readiness_score_never_below_zero():
    assert calculate_readiness_score([1] * 50, [], [], []) == 0
