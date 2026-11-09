from types import SimpleNamespace as NS

from app.routes.gaps import apply_labels


def test_gap_labels_follow_severity_precedence():
    stale_and_unowned = NS(label="VERIFIED")
    conflicting_and_broken = NS(label="VERIFIED")
    stale_only = NS(label="VERIFIED")
    verified = NS(label="MISSING")
    claims = [stale_and_unowned, conflicting_and_broken, stale_only, verified]

    apply_labels(
        claims,
        {
            "stale_tasks": [stale_and_unowned, stale_only],
            "conflicting_deadlines": [conflicting_and_broken],
            "unowned_tasks": [stale_and_unowned],
            "broken_dependencies": [conflicting_and_broken],
        },
    )

    assert [claim.label for claim in claims] == [
        "MISSING",
        "MISSING",
        "UNCERTAIN",
        "VERIFIED",
    ]
