# Ground Station as a Service (GSaaS) Emulator

## Summary

The **GSaaS Emulator** is a full-stack application that simulates a Ground Station-as-a-Service platform. It allows users to:

- Perform CRUD operations on **Satellites** and **Ground Stations**
- Set and update **telemetry payloads**
- Assign a **satellite to one or more ground stations**
- View assignments in a dedicated **overview dashboard**
- Inspect assignment relationships from either the satellite or ground station perspective

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
├── requirements.txt       # Python dependencies
└── gs-emulator-ui/        # React frontend
    ├── src/
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

When you are done, deactivate with:

```bash
deactivate
```

---

## Frontend Setup

### 1. Install dependencies

```bash
cd gs-emulator-ui
npm install
```

### 2. Start the React development server

```bash
npm start
```

The UI will be available at `http://localhost:3000`.

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

## Design Notes

- **Modular structure** — `satellite.py`, `groundstation.py`, and `assignment.py` each own one domain, following the same model/resource pattern.
- **Shared database instance** — `database.py` holds a single `SQLAlchemy` object initialised with `db.init_app(app)` to avoid circular imports.
- **One-to-many assignments** — a satellite can be assigned to multiple ground stations via a join table.
- **CORS enabled** — `Flask-CORS` allows the React frontend on port 3000 to call the API on port 5000 during development.
- **SQLite** — zero-configuration database stored in `gs_emulator.db` (excluded from version control via `.gitignore`).

---

## Future Improvements

- Add user authentication
- Implement satellite pass scheduling emulation
- Export telemetry history per satellite / ground station
- Migrate frontend tooling from Create React App to Vite
