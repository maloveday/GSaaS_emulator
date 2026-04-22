# Ground Station as a Service (GSaaS) Emulator

## 📌 Summary

The **GSaaS Emulator** is a full-stack application designed to simulate a Ground Station-as-a-Service platform. It allows users to:

- Perform CRUD operations on **Satellites** and **Ground Stations**
- Set and update **telemetry payloads**
- Assign a **satellite to one or more ground stations**
- View assignments in a dedicated **overview dashboard**
- Inspect assignment relationships from either the satellite or ground station perspective

This emulator is intended for development, demonstration, and education purposes.

---

## 🔧 Prerequisites

### Backend:
- Python 3.9+
- `pip` or `pipenv`
- Flask
- Flask-RESTful
- Flask-CORS
- Flask-SQLAlchemy

Install dependencies:
```bash
pip install -r requirements.txt
```

> (or use `pipenv install` if using Pipenv)

### Frontend:
- Node.js 18+
- npm

Install frontend dependencies:
```bash
cd gs-emulator-ui
npm install
```

---

## 🌐 API Endpoints

### Satellite API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/satellites` | List all satellites |
| POST | `/satellites` | Create a new satellite |
| PUT | `/satellites/<satellite_id>` | Update telemetry payload |
| DELETE | `/satellites/<satellite_id>` | Delete satellite |

### Ground Station API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/groundstations` | List all ground stations |
| POST | `/groundstations` | Create a new ground station |
| PUT | `/groundstations/<ground_station_id>` | Update telemetry payload |
| DELETE | `/groundstations/<ground_station_id>` | Delete ground station |

### Assignment API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assignments` | List all assignments |
| GET | `/assignments/<satellite_id>` | List ground stations assigned to a satellite |
| GET | `/assignments?ground_station_id=<id>` | List satellites assigned to a ground station |
| POST | `/assignments` | Assign a satellite to a ground station |
| DELETE | `/assignments` | Unassign a satellite from a ground station |

---

## ▶️ How to Start the Application

### Backend

```bash
python GSaaS_emulator.py
```

> This will create `gs_emulator.db` if it doesn't exist and start the Flask API on port 5000.

### Frontend

```bash
cd gs-emulator-ui
npm start
```

> React app will run on [http://localhost:3000](http://localhost:3000) by default.

---

## 📌 Design Justifications

- **Modular Python structure**: `satellite.py`, `groundstation.py`, and `assignment.py` each encapsulate one domain and follow the same model/API class pattern for clarity and consistency.
- **One-to-many assignment model**: One satellite can be assigned to multiple ground stations using a clean linking table in the database.
- **PEP 8 compliant docstrings**: Code is documented using Python docstring standards to help junior developers understand functionality.
- **RESTful design**: Each domain is exposed via well-scoped, logically grouped endpoints.
- **Frontend in React**: Provides a clean and responsive UI using modern patterns, including real-time list views, assignment management, and telemetry editing with JSON validation.

---

## 🚀 Future Improvements

- Add user authentication
- Implement satellite pass scheduling emulation
- Export telemetry history per satellite/ground station
- Migrate to Vite or another modern frontend tooling system