import React, { useEffect, useState } from "react";
import axios from "axios";
import JSONPretty from "react-json-pretty";
import "react-json-pretty/themes/monikai.css";

const API_BASE_URL = "";

function Alert({ msg, onClose }) {
    if (!msg.text) return null;
    return (
        <div className={`alert alert-${msg.type} alert-dismissible fade show`} role="alert">
            {msg.text}
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
        </div>
    );
}

function Spinner() {
    return (
        <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading…</span>
            </div>
        </div>
    );
}

function GroundStationPage() {
    const [groundStations, setGroundStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newStation, setNewStation] = useState({ ground_station_id: "", name: "" });
    const [creating, setCreating] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);
    const [telemetryPayload, setTelemetryPayload] = useState("{}");
    const [assignments, setAssignments] = useState([]);
    const [viewAssignmentsId, setViewAssignmentsId] = useState(null);
    const [msg, setMsg] = useState({ text: "", type: "" });

    useEffect(() => { fetchGroundStations(); }, []);

    const showMsg = (text, type = "success") => setMsg({ text, type });
    const clearMsg = () => setMsg({ text: "", type: "" });

    const fetchGroundStations = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/groundstations`);
            setGroundStations(res.data);
        } catch {
            showMsg("Failed to load ground stations.", "danger");
        } finally {
            setLoading(false);
        }
    };

    const createGroundStation = async (e) => {
        e.preventDefault();
        const { ground_station_id, name } = newStation;
        if (!ground_station_id || !name) return showMsg("ID and name are required.", "warning");
        setCreating(true);
        try {
            await axios.post(`${API_BASE_URL}/groundstations`, newStation);
            setNewStation({ ground_station_id: "", name: "" });
            showMsg(`Ground station "${name}" created successfully.`);
            fetchGroundStations();
        } catch (err) {
            showMsg(err.response?.data?.message || "Failed to create ground station.", "danger");
        } finally {
            setCreating(false);
        }
    };

    const deleteStation = async (id, name) => {
        if (!window.confirm(`Delete ground station "${name}"?`)) return;
        try {
            await axios.delete(`${API_BASE_URL}/groundstations/${id}`);
            showMsg(`Ground station "${name}" deleted.`);
            if (selectedStation?.ground_station_id === id) setSelectedStation(null);
            if (viewAssignmentsId === id) setViewAssignmentsId(null);
            fetchGroundStations();
        } catch {
            showMsg("Failed to delete ground station.", "danger");
        }
    };

    const updateTelemetry = async () => {
        try {
            const parsed = JSON.parse(telemetryPayload);
            await axios.put(`${API_BASE_URL}/groundstations/${selectedStation.ground_station_id}`, {
                telemetry_payload: parsed,
            });
            showMsg("Telemetry updated successfully.");
            fetchGroundStations();
        } catch (e) {
            showMsg(e.name === "SyntaxError" ? "Invalid JSON in telemetry payload." : "Failed to update telemetry.", "danger");
        }
    };

    const handleEdit = (gs) => {
        setSelectedStation(gs);
        setTelemetryPayload(JSON.stringify(gs.telemetry_payload || {}, null, 2));
    };

    const handleViewAssignments = async (stationId) => {
        if (viewAssignmentsId === stationId) {
            setViewAssignmentsId(null);
            return;
        }
        try {
            const res = await axios.get(`${API_BASE_URL}/assignments?ground_station_id=${stationId}`);
            setAssignments(res.data);
            setViewAssignmentsId(stationId);
        } catch {
            showMsg("Failed to load assignments.", "danger");
        }
    };

    return (
        <div>
            <div className="d-flex align-items-center mb-4">
                <h2 className="mb-0 fw-semibold">Ground Stations</h2>
                <span className="badge bg-secondary ms-2">{groundStations.length}</span>
            </div>

            <Alert msg={msg} onClose={clearMsg} />

            {/* Create form */}
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-white fw-semibold">Add New Ground Station</div>
                <div className="card-body">
                    <form onSubmit={createGroundStation} className="row g-3">
                        <div className="col-md-5">
                            <label className="form-label small text-muted">Station ID</label>
                            <input
                                className="form-control"
                                placeholder="e.g. gs-north"
                                value={newStation.ground_station_id}
                                onChange={(e) => setNewStation({ ...newStation, ground_station_id: e.target.value })}
                            />
                        </div>
                        <div className="col-md-5">
                            <label className="form-label small text-muted">Name</label>
                            <input
                                className="form-control"
                                placeholder="e.g. Northern Outpost"
                                value={newStation.name}
                                onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                            />
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <button className="btn btn-primary w-100" type="submit" disabled={creating}>
                                {creating ? <span className="spinner-border spinner-border-sm" /> : "Create"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Table */}
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-white fw-semibold">Ground Station List</div>
                {loading ? <Spinner /> : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groundStations.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center text-muted py-4">
                                            No ground stations yet. Create one above.
                                        </td>
                                    </tr>
                                ) : groundStations.map((gs) => (
                                    <tr key={gs.ground_station_id}>
                                        <td><code>{gs.ground_station_id}</code></td>
                                        <td>{gs.name}</td>
                                        <td className="text-end">
                                            <button
                                                className="btn btn-outline-secondary btn-sm me-2"
                                                onClick={() => handleEdit(gs)}
                                            >
                                                Edit Telemetry
                                            </button>
                                            <button
                                                className="btn btn-outline-primary btn-sm me-2"
                                                onClick={() => handleViewAssignments(gs.ground_station_id)}
                                            >
                                                {viewAssignmentsId === gs.ground_station_id ? "Hide" : "Satellites"}
                                            </button>
                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => deleteStation(gs.ground_station_id, gs.name)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Assignments panel */}
            {viewAssignmentsId && (
                <div className="card shadow-sm mb-4">
                    <div className="card-header bg-white fw-semibold">
                        Satellites assigned to <code>{viewAssignmentsId}</code>
                    </div>
                    <div className="card-body">
                        {assignments.length === 0 ? (
                            <p className="text-muted mb-0">No satellites assigned.</p>
                        ) : (
                            <ul className="list-group list-group-flush">
                                {assignments.map((a) => (
                                    <li key={a.satellite_id} className="list-group-item px-0">
                                        <code>{a.satellite_id}</code>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* Telemetry editor */}
            {selectedStation && (
                <div className="card shadow-sm">
                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                        <span className="fw-semibold">
                            Edit Telemetry &mdash; <code>{selectedStation.name}</code>
                        </span>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setSelectedStation(null)}
                            aria-label="Close"
                        />
                    </div>
                    <div className="card-body">
                        <textarea
                            className="form-control font-monospace mb-3"
                            rows={8}
                            value={telemetryPayload}
                            onChange={(e) => setTelemetryPayload(e.target.value)}
                            spellCheck={false}
                        />
                        <button className="btn btn-success" onClick={updateTelemetry}>
                            Save Telemetry
                        </button>
                        <div className="mt-3">
                            <JSONPretty data={telemetryPayload} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GroundStationPage;
