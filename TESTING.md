# Testing Guide

## Running the backend tests

```bash
pip install -r requirements-dev.txt
pytest                          # run the suite
pytest --cov=. --cov-report=term-missing   # with coverage
```

Tests run against an in-memory SQLite database via the `create_app()` factory in
`GSaaS_emulator.py`, so they never touch `gs_emulator.db` and need no running
server. A GitHub Actions workflow (`.github/workflows/tests.yml`) runs the suite
on every push and pull request.

## Suite layout

| File | Covers |
|------|--------|
| `tests/conftest.py` | App/client fixtures, entity factories, timestamp helpers |
| `tests/test_satellite.py` | Satellite CRUD, telemetry updates, error paths |
| `tests/test_groundstation.py` | Ground station CRUD, telemetry updates, error paths |
| `tests/test_assignment.py` | Assign/unassign, idempotency, filtering by satellite or station |
| `tests/test_passes.py` | Pass scheduling, validation, live status transitions, cancellation |
| `tests/test_telemetry.py` | Pass-gated telemetry access: 200/404/503, `Retry-After`, next-pass selection |

Pass-status tests build timestamps relative to the real clock (e.g. a pass from
15 minutes ago to 15 minutes from now is `IN_PROGRESS`), so no clock mocking is
required. If timing-sensitive tests ever flake, adopt `freezegun` to pin the
clock instead of widening tolerances.

## Known bugs documented as `xfail`

Nine tests are marked `@pytest.mark.xfail(strict=True)`. Each one asserts the
*intended* behaviour and currently fails, which pins down a real defect. When a
defect is fixed, its test starts passing and strict mode makes the leftover
`xfail` marker an error — remove the marker as part of the fix.

1. **Duplicate IDs return 500, not 409** (`test_satellite.py`,
   `test_groundstation.py`) — the unique-constraint violation leaks a raw
   SQLAlchemy error string.
2. **Missing/non-JSON request bodies crash** (`test_satellite.py`) — resources
   call `request.json` without a fallback, so a bad `Content-Type` or empty
   body is not turned into a clean 400.
3. **Foreign keys are not enforced** (`test_assignment.py`, `test_passes.py`) —
   assignments and passes can reference satellites/stations that don't exist,
   and deleting a satellite leaves its assignments dangling.
4. **Timestamps are compared as strings** (`test_passes.py`) — a pass submitted
   with a non-UTC offset (e.g. `+02:00`) is misordered against the Z-suffixed
   clock string, so its live status is computed incorrectly.
5. **Naive timestamps crash the telemetry endpoint** (`test_telemetry.py`) —
   computing `Retry-After` for a next pass whose `start_time` has no timezone
   raises `TypeError` and returns an unhandled 500.
6. **No overlap detection** (`test_passes.py`) — two overlapping passes can be
   scheduled on the same ground station.

The common fix for 4 and 5 is to normalise timestamps on write (parse with
`datetime.fromisoformat`, store as UTC) and compare `datetime` objects rather
than strings.

## Recommended next steps (not yet implemented)

- **Frontend unit tests**: the Vite build makes Vitest + React Testing Library a
  natural fit for `gs-emulator-ui` — form validation, list rendering, and the
  "No ground stations assigned" empty states.
- **End-to-end tests**: the manual scenarios in
  `Ground_Station_API_Emulator_Test_Plan.md` translate almost mechanically into
  Playwright specs, turning the manual regression checklist into an automated
  one.
- **Coverage floor**: once coverage is stable, add `--cov-fail-under` to the CI
  invocation so it cannot silently regress.
