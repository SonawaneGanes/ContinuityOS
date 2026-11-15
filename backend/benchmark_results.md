# Synthetic benchmark results

The three-run model benchmark has not been executed in this environment because
`GEMINI_API_KEY` is not configured. No model precision or recall is reported.

After setting the key, run `python run_benchmark.py` from `backend/`. The script
runs three independent passes by default and replaces this file with measured
per-run and average precision, recall, and invalid-output counts.
