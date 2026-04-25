# Ground Station as a Service (GSaaS) Emulator

## Summary

The **GSaaS Emulator** is a full-stack application that simulates a Ground Station-as-a-Service platform. It allows users to:

- Perform CRUD operations on **Satellites** and **Ground Stations**
- Set and update **telemetry payloads**
- Assign a **satellite to one or more ground stations**
- Schedule and track **satellite pass windows** against ground stations
- View assignments and passes in dedicated dashboard pages

This emulator is intended for development, demonstration, and education purposes.

---

## Prerequisites

| Component | Requirement |
|-----------|-------------|
| Backend   | Python 3.9+ |
| Frontend  | Node.js 18+, npm |

---

## Project Structure

```
GSaaS_emulator/
├── GSaaS_emulator.py      # Flask application entry point
├── database.py            # Shared SQLAlchemy instance
├── satellite.py           # Satellite model and API resource
├── groundstation.py       # Ground Station model and API resource
├── assignment.py          # Assignment model and API resource
├── passes.py              # Satellite pass model and API resource
├── requirements.txt       # Python dependencies
└── gs-emulator-ui/        # React + Vite frontend
    ├── index.html         # Vite entry HTML
    ├── vite.config.js     # Vite configuration and dev-server proxy
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── SatellitePage.jsx
    │   ├── GroundStationPage.jsx
    │   ├── AssignSatellitePage.jsx
    │   ├── AssignmentOverviewPage.jsx
    │   └── PassSchedulingPage.jsx
    └── public/
```

---

## Backend Setup

### 1. Create a virtual environment

```bash
python3 -m venv venv
```

### 2. Activate the virtual environment

**macOS / Linux:**
```bash
source venv/bin/activate
```

**Windows (Command Prompt):**
```cmd
venv\Scripts\activate.bat
```

**Windows (PowerShell):**
```powershell
venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the Flask server

```bash
python GSaaS_emulator.py
```

The API will be available at `http://localhost:5000`. On first run, the SQLite database (`gs_emulator.db`) is created automatically.

### Deactivating the virtual environment

```bash
deactivate
```

---

## Frontend Setup

The frontend uses **Vite** as the build tool. The Vite dev server proxies all API calls to `http://localhost:5000` automatically, so no CORS configuration is needed during development.

### 1. Install dependencies

```bash
cd gs-emulator-ui
npm install
```

### 2. Start the development server

```bash
npm run dev
```

The UI will be available at `http://localhost:3000`.

### 3. Build for production

```bash
npm run build
```

The production bundle is written to `gs-emulator-ui/dist/`.

---

## API Reference

### Satellite API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/satellites` | List all satellites |
| GET | `/satellites/<satellite_id>` | Get a satellite by ID |
| POST | `/satellites` | Create a new satellite |
| PUT | `/satellites/<satellite_id>` | Update telemetry payload |
| DELETE | `/satellites/<satellite_id>` | Delete a satellite |

**POST body:**
```json
{ "satellite_id": "sat-1", "name": "Alpha Sat" }
```

**PUT body:**
```json
{ "telemetry_payload": { "altitude_km": 550, "signal_strength": -72 } }
```

---

### Ground Station API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/groundstations` | List all ground stations |
| GET | `/groundstations/<ground_station_id>` | Get a ground station by ID |
| POST | `/groundstations` | Create a new ground station |
| PUT | `/groundstations/<ground_station_id>` | Update telemetry payload |
| DELETE | `/groundstations/<ground_station_id>` | Delete a ground station |

**POST body:**
```json
{ "ground_station_id": "gs-1", "name": "Northern Outpost" }
```

---

### Assignment API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assignments` | List all assignments |
| GET | `/assignments/<satellite_id>` | Ground stations assigned to a satellite |
| GET | `/assignments?ground_station_id=<id>` | Satellites assigned to a ground station |
| POST | `/assignments` | Assign a satellite to a ground station |
| DELETE | `/assignments` | Remove an assignment |

**POST / DELETE body:**
```json
{ "satellite_id": "sat-1", "ground_station_id": "gs-1" }
```

---

### Pass Scheduling API

Satellite passes represent scheduled communication windows between a satellite and a ground station. Status is computed dynamically from wall-clock UTC time — no manual status updates are needed.

| Status | Meaning |
|--------|---------|
| `SCHEDULED` | Pass is in the future |
| `IN_PROGRESS` | Current time is within the pass window |
| `COMPLETED` | Pass window has elapsed |
| `CANCELLED` | Manually cancelled |

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/passes` | List all passes (ordered by start time) |
| GET | `/passes/<pass_id>` | Get a single pass |
| POST | `/passes` | Schedule a new pass |
| DELETE | `/passes/<pass_id>` | Cancel a pass |

**POST body:**
```json
{
  "satellite_id": "sat-1",
  "ground_station_id": "gs-1",
  "start_time": "2025-06-01T10:00:00.000Z",
  "end_time":   "2025-06-01T10:12:00.000Z"
}
```

> Times must be ISO 8601 UTC strings. `end_time` must be after `start_time`. Completed passes cannot be cancelled.

---

### Telemetry API

Provides read-only access to a satellite's telemetry payload, gated by the pass window. Telemetry can only be retrieved while an active (`IN_PROGRESS`) pass exists between the satellite and the requested ground station.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/telemetry/<satellite_id>/<ground_station_id>` | Fetch telemetry if in pass window |

**Response — 200 OK** (spacecraft is within the pass window):
```json
{
  "satellite_id": "sat-1",
  "satellite_name": "Alpha Sat",
  "ground_station_id": "gs-1",
  "ground_station_name": "Northern Outpost",
  "pass_id": "...",
  "pass_start": "2025-06-01T10:00:00.000Z",
  "pass_end":   "2025-06-01T10:12:00.000Z",
  "telemetry": { "altitude_km": 550, "signal_strength": -72 }
}
```

**Response — 503 Service Unavailable** (spacecraft is outside the pass window):
```json
{
  "error": "Spacecraft 'sat-1' is not currently in contact with ground station 'gs-1': no active pass window",
  "next_pass_id":    "...",
  "next_pass_start": "2025-06-01T10:00:00.000Z",
  "next_pass_end":   "2025-06-01T10:12:00.000Z"
}
```

> The `Retry-After` response header is included when a future pass is scheduled, indicating the number of seconds until that pass begins. The `next_pass_*` fields are omitted if no future pass exists.

**Response — 404 Not Found** — satellite or ground station ID does not exist.

---

## Design Notes

- **Modular structure** — each domain (`satellite`, `groundstation`, `assignment`, `passes`, `telemetry`) lives in its own file, following the same model/resource pattern.
- **Shared database instance** — `database.py` holds a single `SQLAlchemy` object initialised with `db.init_app(app)` to avoid circular imports.
- **Dynamic pass status** — pass status is derived from the current UTC time on every `GET` request; no background jobs or cron tasks are needed.
- **Pass-gated telemetry** — the telemetry endpoint reuses `_live_status()` from `passes.py` to determine contact eligibility; the same logic drives both the pass list and the telemetry gate, keeping them consistent.
- **`Retry-After` header** — the 503 response includes this standard HTTP header so API clients can schedule an automatic retry at the right time.
- **Vite dev proxy** — `vite.config.js` proxies `/satellites`, `/groundstations`, `/assignments`, `/passes`, and `/telemetry` to `http://localhost:5000`, so frontend components use relative paths and no CORS headers are required.
- **CORS enabled** — `Flask-CORS` is still configured for cases where the frontend is served separately (e.g., production).
- **SQLite** — zero-configuration database stored in `gs_emulator.db` (excluded from version control).

---

## Future Improvements

- Add user authentication
- Export telemetry history per satellite / ground station
- Visualise pass windows on a timeline or map
- Add Vitest unit tests for frontend components
