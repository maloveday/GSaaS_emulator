# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend

```bash
# One-time setup
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate.bat
pip install -r requirements.txt

# Run the API server (creates gs_emulator.db on first run)
python GSaaS_emulator.py          # listens on http://localhost:5000
```

### Frontend (`gs-emulator-ui/`)

```bash
npm install          # first time only
npm run dev          # dev server on http://localhost:3000
npm run build        # production bundle → dist/
npm run preview      # serve the production bundle locally
npm test             # Vitest in watch mode
npm run test:run     # Vitest single run (CI-friendly)
```

### Manual API testing

```bash
# Example: fetch telemetry during an active pass
curl http://localhost:5000/telemetry/<satellite_id>/<ground_station_id>

# Reference fixture for pass scheduling
cat test/schedulecontact.json
```

The frontend test suite uses **Vitest + @testing-library/react** with `jsdom`. Test files live in `gs-emulator-ui/src/test/`. The manual end-to-end test plan is in `Ground_Station_API_Emulator_Test_Plan.md`.

---

## Architecture

### Backend

`GSaaS_emulator.py` is the entry point. It initialises Flask, CORS, and SQLAlchemy, then imports resource modules **after** `db.init_app(app)` to avoid circular imports (the resources import `db` from `database.py` at module load time).

Each domain follows an identical two-class pattern in its own file:

| File | Model class | Resource class | Routes |
|---|---|---|---|
| `satellite.py` | `Satellite` | `SatelliteAPI` | `/satellites`, `/satellites/<id>` |
| `groundstation.py` | `GroundStation` | `GroundStationAPI` | `/groundstations`, `/groundstations/<id>` |
| `assignment.py` | `SatelliteAssignment` | `SatelliteAssignmentAPI` | `/assignments`, `/assignments/<id>` |
| `passes.py` | `SatellitePass` | `SatellitePassAPI` | `/passes`, `/passes/<id>` |
| `telemetry.py` | *(none — read-only)* | `TelemetryAPI` | `/telemetry/<sat_id>/<gs_id>` |

`database.py` holds the single shared `SQLAlchemy()` instance. `db.create_all()` is called inside an app context in `__main__`.

**Pass status is never persisted as a state transition.** `_live_status(pass_obj)` in `passes.py` computes `SCHEDULED / IN_PROGRESS / COMPLETED / CANCELLED` by comparing UTC wall-clock time against `start_time` / `end_time` strings on every request. `telemetry.py` imports this same function to determine contact eligibility — the two are always consistent.

The telemetry endpoint returns:
- **200** — active `IN_PROGRESS` pass found; includes full `telemetry_payload`
- **503** — no active pass; includes `next_pass_start/end/id` if a future pass exists, plus a `Retry-After` header (seconds until next pass)
- **404** — satellite or ground station ID not found

Flask-RESTful resources return plain dicts (or `(dict, status)` / `(dict, status, headers)` tuples); never `jsonify()`.

### Frontend

Built with **React 19 + Vite + Bootstrap 5**. All source files live in `gs-emulator-ui/src/`.

`main.jsx` bootstraps the app. `App.jsx` owns the `BrowserRouter`, sticky navbar, and route definitions.

All pages set `const API_BASE_URL = ""` and use relative paths (e.g. `/satellites`). The Vite dev server proxies those paths to `http://localhost:5000` — see `vite.config.js`. **Do not hardcode the Flask port in component files.**

Every page component follows the same pattern:
- Local `Alert` and `Spinner` helper components defined in the same file
- `axios` for API calls; error messages extracted from `err.response?.data?.error`
- Inline dismissible Bootstrap alerts instead of `alert()`
- Loading spinner while data is in-flight; empty-state message when list is empty

`TelemetryPage.jsx` reads `?sat=` and `?gs=` URL search params on mount (via `useSearchParams`) and auto-fetches if both are present — this enables deep-linking from `PassSchedulingPage.jsx`'s "Telemetry" button on `IN_PROGRESS` rows.

`PassTimeline.jsx` is a pure SVG component that visualises pass windows on a horizontal timeline. It receives `passes` and `satellites` props from `PassSchedulingPage`. The time axis range is computed dynamically from the earliest/latest pass times with 5% padding. The NOW indicator re-renders every 30 s via a `setInterval`. No external charting library is used.

### Ignored directories

`static/` and `templates/` are legacy artefacts from an earlier prototype and are not used by the current application.
