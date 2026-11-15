import argparse
import json
from pathlib import Path
from statistics import mean
from types import SimpleNamespace as NS
from typing import Any

from app.services.extractor import extract_claims_with_stats
from app.services.gaps import run_all_checks


BENCHMARK_DIR = Path(__file__).resolve().parent / "benchmark_data"
RESULTS_PATH = Path(__file__).resolve().parent / "benchmark_results.md"
CATEGORY_CHECKS = {
    "unowned": "unowned_tasks",
    "conflict": "conflicting_deadlines",
    "stale": "stale_tasks",
    "broken": "broken_dependencies",
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


def matches(found: str | None, expected: str) -> bool:
    if not found:
        return False
    found_normalized = found.casefold()
    expected_normalized = expected.casefold()
    return (
        expected_normalized in found_normalized
        or found_normalized in expected_normalized
    )


def load_dataset(
    benchmark_dir: Path = BENCHMARK_DIR,
) -> tuple[list[Path], list[dict[str, str]]]:
    with (benchmark_dir / "answer_key.json").open(encoding="utf-8") as file:
        answer_key = json.load(file)
    if not isinstance(answer_key, list):
        raise ValueError("answer_key.json must contain a list")
    documents = sorted(
        path
        for path in benchmark_dir.iterdir()
        if path.suffix.lower() in {".md", ".txt", ".csv"}
    )
    if not documents:
        raise ValueError("benchmark_data contains no synthetic documents")
    return documents, answer_key


def _unique_findings(report: dict[str, Any]) -> set[tuple[str, str, str]]:
    findings = set()
    for category, report_key in CATEGORY_CHECKS.items():
        for claim in report[report_key]:
            findings.add(
                (
                    claim.benchmark_file,
                    category,
                    str(claim.subject or "").strip().casefold(),
                )
            )
    return findings


def _score(
    findings: set[tuple[str, str, str]], answer_key: list[dict[str, str]]
) -> tuple[float, float, dict[str, tuple[float, float]]]:
    remaining_expected = list(answer_key)
    correct = 0
    category_counts = {
        category: {"expected": 0, "found": 0, "correct": 0}
        for category in CATEGORY_CHECKS
    }
    for item in answer_key:
        category_counts[item["category"]]["expected"] += 1
    for filename, category, subject in sorted(findings):
        category_counts[category]["found"] += 1
        for index, expected in enumerate(remaining_expected):
            if (
                expected["file"] == filename
                and expected["category"] == category
                and matches(subject, expected["subject"])
            ):
                del remaining_expected[index]
                category_counts[category]["correct"] += 1
                correct += 1
                break

    precision = correct / len(findings) if findings else 0.0
    recall = correct / len(answer_key) if answer_key else 1.0
    category_scores = {}
    for category, counts in category_counts.items():
        category_precision = (
            counts["correct"] / counts["found"] if counts["found"] else 0.0
        )
        category_recall = (
            counts["correct"] / counts["expected"]
            if counts["expected"]
            else 1.0
        )
        category_scores[category] = (category_precision, category_recall)
    return precision, recall, category_scores


def run_once(benchmark_dir: Path = BENCHMARK_DIR) -> dict[str, Any]:
    documents, answer_key = load_dataset(benchmark_dir)
    claims = []
    invalid_outputs = 0
    for path in documents:
        text = path.read_text(encoding="utf-8")
        extracted, invalid = extract_claims_with_stats(text)
        invalid_outputs += invalid
        for item in extracted:
            if not isinstance(item, dict):
                invalid_outputs += 1
                continue
            claim = NS(**{**DEFAULTS, **item}, benchmark_file=path.name)
            claims.append(claim)

    report = run_all_checks(claims)
    findings = _unique_findings(report)
    precision, recall, category_scores = _score(findings, answer_key)
    return {
        "precision": precision,
        "recall": recall,
        "invalid_outputs": invalid_outputs,
        "category_scores": category_scores,
    }


def format_results(results: list[dict[str, Any]]) -> str:
    rows = [
        "# Synthetic benchmark results",
        "",
        f"Dataset: `{BENCHMARK_DIR.name}`; independent runs: {len(results)}.",
        "",
        "| Run | Precision | Recall | Invalid model outputs |",
        "|---:|---:|---:|---:|",
    ]
    for index, result in enumerate(results, start=1):
        rows.append(
            f"| {index} | {result['precision']:.1%} | {result['recall']:.1%} "
            f"| {result['invalid_outputs']} |"
        )
    rows.extend(
        [
            f"| **Average** | **{mean(r['precision'] for r in results):.1%}** "
            f"| **{mean(r['recall'] for r in results):.1%}** "
            f"| **{mean(r['invalid_outputs'] for r in results):.2f}** |",
            "",
            "## Average by category",
            "",
            "| Category | Precision | Recall |",
            "|---|---:|---:|",
        ]
    )
    for category in CATEGORY_CHECKS:
        rows.append(
            f"| {category} | "
            f"{mean(r['category_scores'][category][0] for r in results):.1%} | "
            f"{mean(r['category_scores'][category][1] for r in results):.1%} |"
        )
    rows.append("")
    return "\n".join(rows)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Evaluate extraction and gap checks on synthetic documents."
    )
    parser.add_argument(
        "--runs",
        type=int,
        default=3,
        help="Number of independent extraction runs (default: 3)",
    )
    args = parser.parse_args()
    if args.runs < 1:
        parser.error("--runs must be at least 1")

    results = []
    for run_number in range(1, args.runs + 1):
        result = run_once()
        results.append(result)
        print(
            f"Run {run_number}/{args.runs}: "
            f"precision {result['precision']:.1%}, "
            f"recall {result['recall']:.1%}, "
            f"invalid model outputs {result['invalid_outputs']}"
        )

    markdown = format_results(results)
    RESULTS_PATH.write_text(markdown, encoding="utf-8")
    print(markdown)
    print(f"Results written to {RESULTS_PATH}")


if __name__ == "__main__":
    main()
