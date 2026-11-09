from datetime import date, datetime, timedelta
from typing import Any


STALE_DAYS = 14
DEADLINE_TOLERANCE = timedelta(hours=24)


def _parse(date_text: str) -> datetime:
    return datetime.fromisoformat(date_text)


def find_unowned_tasks(claims: list[Any]) -> list[Any]:
    return [claim for claim in claims if claim.kind == "task" and not claim.owner]


def find_conflicting_deadlines(claims: list[Any]) -> list[Any]:
    by_milestone: dict[str | None, list[Any]] = {}
    for claim in claims:
        if claim.kind == "deadline" and claim.due_date:
            by_milestone.setdefault(claim.subject, []).append(claim)

    conflicts = []
    for items in by_milestone.values():
        dates = [_parse(item.due_date) for item in items]
        if max(dates) - min(dates) > DEADLINE_TOLERANCE:
            conflicts.extend(items)
    return conflicts


def find_stale_tasks(
    claims: list[Any], today: datetime | date | None = None
) -> list[Any]:
    current_time = today or datetime.utcnow()
    if isinstance(current_time, date) and not isinstance(current_time, datetime):
        current_time = datetime.combine(current_time, datetime.min.time())

    stale = []
    for claim in claims:
        if claim.kind == "task" and claim.status == "In Progress" and claim.last_updated:
            if current_time - _parse(claim.last_updated) > timedelta(days=STALE_DAYS):
                stale.append(claim)
    return stale


def find_broken_dependencies(claims: list[Any]) -> list[Any]:
    task_names = {claim.subject for claim in claims if claim.kind == "task"}
    return [
        claim
        for claim in claims
        if claim.kind == "task"
        and claim.depends_on
        and claim.depends_on not in task_names
    ]


def calculate_readiness_score(
    unowned: list[Any],
    conflicts: list[Any],
    missing_evidence: list[Any],
    open_deps: list[Any],
) -> int:
    score = (
        100
        - 3 * len(unowned)
        - 5 * len(conflicts)
        - 2 * len(missing_evidence)
        - 2 * len(open_deps)
    )
    return max(0, score)


def run_all_checks(claims: list[Any]) -> dict[str, Any]:
    unowned = find_unowned_tasks(claims)
    conflicts = find_conflicting_deadlines(claims)
    stale = find_stale_tasks(claims)
    broken = find_broken_dependencies(claims)
    missing_evidence: list[Any] = []

    return {
        "readiness_score": calculate_readiness_score(
            unowned, conflicts, missing_evidence, broken
        ),
        "unowned_tasks": unowned,
        "conflicting_deadlines": conflicts,
        "stale_tasks": stale,
        "broken_dependencies": broken,
    }
