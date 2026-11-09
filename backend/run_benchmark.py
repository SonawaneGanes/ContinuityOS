import argparse
from pathlib import Path
from statistics import mean
from types import SimpleNamespace as NS

from app.services.extractor import extract_claims
from app.services.gaps import run_all_checks


SAMPLE_DIR = Path(__file__).resolve().parents[1] / "sample_data"
SAMPLE_FILES = [
    SAMPLE_DIR / "meeting_notes.md",
    SAMPLE_DIR / "task_board.csv",
    SAMPLE_DIR / "README.md",
    SAMPLE_DIR / "chat_log.txt",
]

EXPECTED = {
    "unowned": ["SMS notification service", "Export to CSV", "Email reminders"],
    "conflict": ["deployment", "report"],
    "stale": ["SMS notification service"],
    "broken": ["Admin dashboard"],
}

DEFAULTS = {
    "kind": None,
    "subject": None,
    "owner": None,
    "due_date": None,
    "status": None,
    "depends_on": None,
    "last_updated": None,
}


def load_text() -> str:
    parts = []
    for path in SAMPLE_FILES:
        with path.open(encoding="utf-8") as sample_file:
            parts.append(f"--- {path.name} ---\n{sample_file.read()}")
    return "\n\n".join(parts)


def matches(found: str | None, expected: str) -> bool:
    if not found:
        return False
    found_normalized = found.casefold()
    expected_normalized = expected.casefold()
    return (
        expected_normalized in found_normalized
        or found_normalized in expected_normalized
    )


def score(flagged: list[NS], expected: list[str]) -> tuple[float, float]:
    found = [
        item
        for item in expected
        if any(matches(claim.subject, item) for claim in flagged)
    ]
    correct = [
        claim
        for claim in flagged
        if any(matches(claim.subject, item) for item in expected)
    ]
    recall = len(found) / len(expected) if expected else 1.0
    precision = len(correct) / len(flagged) if flagged else 0.0
    return recall, precision


def run_once() -> dict[str, tuple[float, float, int]]:
    raw_items = extract_claims(load_text())
    claims = [NS(**{**DEFAULTS, **item}) for item in raw_items]
    report = run_all_checks(claims)
    checks = {
        "Unowned tasks": (report["unowned_tasks"], EXPECTED["unowned"]),
        "Conflicting deadlines": (
            report["conflicting_deadlines"],
            EXPECTED["conflict"],
        ),
        "Stale tasks": (report["stale_tasks"], EXPECTED["stale"]),
        "Broken dependencies": (report["broken_dependencies"], EXPECTED["broken"]),
    }

    return {
        name: (*score(flagged, expected), len(flagged))
        for name, (flagged, expected) in checks.items()
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark claim extraction and gap checks.")
    parser.add_argument(
        "--runs",
        type=int,
        default=3,
        help="Number of independent extraction runs to average (default: 3)",
    )
    args = parser.parse_args()
    if args.runs < 1:
        parser.error("--runs must be at least 1")

    results = []
    for run_number in range(1, args.runs + 1):
        run = run_once()
        results.append(run)
        print(f"\nRun {run_number}/{args.runs}")
        print("Category              Recall   Precision   Flagged")
        for name, (recall, precision, count) in run.items():
            print(f"{name:<22}{recall:>6.0%}{precision:>11.0%}{count:>10}")

    if len(results) > 1:
        print(f"\nAverage across {len(results)} runs")
        print("Category              Recall   Precision")
        for name in results[0]:
            recall = mean(result[name][0] for result in results)
            precision = mean(result[name][1] for result in results)
            print(f"{name:<22}{recall:>6.0%}{precision:>11.0%}")


if __name__ == "__main__":
    main()
