# Round 2 testing evidence

## Automated and integration checks

- Backend unit tests: 21 passed.
- Python compile check: passed.
- Frontend Oxlint: passed.
- Frontend production build: passed.
- Database-backed demo API check: passed for all four gap categories, saved
  evidence labels, source offsets, CORS, and the approval threshold.
- Browser check: backend health, timeline, source highlighting, and gap panel
  verified against the seeded demo project.

The demo has two unowned tasks, two conflicting milestone groups, one broken
dependency, and one stale task. Applying the documented weights gives
`100 - (3 * 2) - (5 * 2) - (2 * 1) = 82`. The task guide says 84, but that is an
arithmetic error.

## LLM extraction benchmark

The benchmark script runs three extraction passes by default and prints the
recall/precision averages. It was not run because `GEMINI_API_KEY` is not
configured in this environment. No benchmark results are reported as if they
were measured. After configuring the key in `backend/.env`, run
`python run_benchmark.py` from `backend` and add the measured output here.
