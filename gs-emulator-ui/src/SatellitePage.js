import React, { useState, useEffect } from "react";
import axios from "axios";
import JSONPretty from "react-json-pretty";
import "react-json-pretty/themes/monikai.css";

const API_BASE_URL = "http://localhost:5000";

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

function SatellitePage() {
    const [satellites, setSatellites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSatellite, setNewSatellite] = useState({ satellite_id: "", name: "" });
    const [creating, setCreating] = useState(false);
    const [selectedSatellite, setSelectedSatellite] = useState(null);
    const [telemetryPayload, setTelemetryPayload] = useState("{}");
    const [assignments, setAssignments] = useState([]);
    const [viewAssignmentsId, setViewAssignmentsId] = useState(null);
    const [msg, setMsg] = useState({ text: "", type: "" });

    useEffect(() => { fetchSatellites(); }, []);

    const showMsg = (text, type = "success") => setMsg({ text, type });
    const clearMsg = () => setMsg({ text: "", type: "" });

    const fetchSatellites = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/satellites`);
            setSatellites(res.data);
        } catch {
            showMsg("Failed to load satellites.", "danger");
        } finally {
            setLoading(false);
        }
    };

    const createSatellite = async (e) => {
        e.preventDefault();
        const { satellite_id, name } = newSatellite;
        if (!satellite_id || !name) return showMsg("Satellite ID and name are required.", "warning");
        setCreating(true);
        try {
            await axios.post(`${API_BASE_URL}/satellites`, newSatellite);
            setNewSatellite({ satellite_id: "", name: "" });
            showMsg(`Satellite "${name}" created successfully.`);
            fetchSatellites();
        } catch (err) {
            showMsg(err.response?.data?.message || "Failed to create satellite.", "danger");
        } finally {
            setCreating(false);
        }
    };

    const deleteSatellite = async (id, name) => {
        if (!window.confirm(`Delete satellite "${name}"?`)) return;
        try {
            await axios.delete(`${API_BASE_URL}/satellites/${id}`);
            showMsg(`Satellite "${name}" deleted.`);
            if (selectedSatellite?.satellite_id === id) setSelectedSatellite(null);
            if (viewAssignmentsId === id) setViewAssignmentsId(null);
            fetchSatellites();
        } catch {
            showMsg("Failed to delete satellite.", "danger");
        }
    };

    const updateTelemetry = async () => {
        try {
            const parsed = JSON.parse(telemetryPayload);
            await axios.put(`${API_BASE_URL}/satellites/${selectedSatellite.satellite_id}`, {
                telemetry_payload: parsed,
            });
            showMsg("Telemetry updated successfully.");
            fetchSatellites();
        } catch (e) {
            showMsg(e.name === "SyntaxError" ? "Invalid JSON in telemetry payload." : "Failed to update telemetry.", "danger");
        }
    };

    const handleEdit = (sat) => {
        setSelectedSatellite(sat);
        setTelemetryPayload(JSON.stringify(sat.telemetry_payload || {}, null, 2));
    };

    const handleViewAssignments = async (satelliteId) => {
        if (viewAssignmentsId === satelliteId) {
            setViewAssignmentsId(null);
            return;
        }
        try {
            const res = await axios.get(`${API_BASE_URL}/assignments/${satelliteId}`);
            setAssignments(res.data);
            setViewAssignmentsId(satelliteId);
        } catch {
            showMsg("Failed to load assignments.", "danger");
        }
    };

    return (
        <div>
            <div className="d-flex align-items-center mb-4">
                <h2 className="mb-0 fw-semibold">Satellites</h2>
                <span className="badge bg-secondary ms-2">{satellites.length}</span>
            </div>

            <Alert msg={msg} onClose={clearMsg} />

            {/* Create form */}
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-white fw-semibold">Add New Satellite</div>
                <div className="card-body">
                    <form onSubmit={createSatellite} className="row g-3">
                        <div className="col-md-5">
                            <label className="form-label small text-muted">Satellite ID</label>
                            <input
                                className="form-control"
                                placeholder="e.g. sat-alpha"
                                value={newSatellite.satellite_id}
                                onChange={(e) => setNewSatellite({ ...newSatellite, satellite_id: e.target.value })}
                            />
                        </div>
                        <div className="col-md-5">
                            <label className="form-label small text-muted">Name</label>
                            <input
                                className="form-control"
                                placeholder="e.g. Alpha Sat"
                                value={newSatellite.name}
                                onChange={(e) => setNewSatellite({ ...newSatellite, name: e.target.value })}
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
                <div className="card-header bg-white fw-semibold">Satellite List</div>
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
                                {satellites.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center text-muted py-4">
                                            No satellites yet. Create one above.
                                        </td>
                                    </tr>
                                ) : satellites.map((sat) => (
                                    <tr key={sat.satellite_id}>
                                        <td><code>{sat.satellite_id}</code></td>
                                        <td>{sat.name}</td>
                                        <td className="text-end">
                                            <button
                                                className="btn btn-outline-secondary btn-sm me-2"
                                                onClick={() => handleEdit(sat)}
                                            >
                                                Edit Telemetry
                                            </button>
                                            <button
                                                className="btn btn-outline-primary btn-sm me-2"
                                                onClick={() => handleViewAssignments(sat.satellite_id)}
                                            >
                                                {viewAssignmentsId === sat.satellite_id ? "Hide" : "Assignments"}
                                            </button>
                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => deleteSatellite(sat.satellite_id, sat.name)}
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
                        Ground Stations assigned to <code>{viewAssignmentsId}</code>
                    </div>
                    <div className="card-body">
                        {assignments.length === 0 ? (
                            <p className="text-muted mb-0">No ground stations assigned.</p>
                        ) : (
                            <ul className="list-group list-group-flush">
                                {assignments.map((a) => (
                                    <li key={a.ground_station_id} className="list-group-item px-0">
                                        <code>{a.ground_station_id}</code>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* Telemetry editor */}
            {selectedSatellite && (
                <div className="card shadow-sm">
                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                        <span className="fw-semibold">
                            Edit Telemetry &mdash; <code>{selectedSatellite.name}</code>
                        </span>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setSelectedSatellite(null)}
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

export default SatellitePage;
