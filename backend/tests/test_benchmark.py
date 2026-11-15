import json

import run_benchmark


def test_benchmark_scores_mocked_extractor_and_counts_invalid_outputs(
    tmp_path, monkeypatch
):
    (tmp_path / "synthetic.txt").write_text(
        "Unowned migration task.", encoding="utf-8"
    )
    (tmp_path / "answer_key.json").write_text(
        json.dumps(
            [
                {
                    "file": "synthetic.txt",
                    "category": "unowned",
                    "subject": "migration task",
                }
            ]
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(
        run_benchmark,
        "extract_claims_with_stats",
        lambda _: (
            [
                {
                    "kind": "task",
                    "subject": "migration task",
                    "owner": None,
                }
            ],
            2,
        ),
    )

    result = run_benchmark.run_once(tmp_path)

    assert result["precision"] == 1
    assert result["recall"] == 1
    assert result["invalid_outputs"] == 2
