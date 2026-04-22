import React, { useState, useEffect } from "react";
import axios from "axios";

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

function AssignSatellitePage() {
    const [satellites, setSatellites] = useState([]);
    const [groundStations, setGroundStations] = useState([]);
    const [selectedSatellite, setSelectedSatellite] = useState("");
    const [selectedGroundStation, setSelectedGroundStation] = useState("");
    const [assignments, setAssignments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [assigning, setAssigning] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });

    useEffect(() => {
        Promise.all([
            axios.get(`${API_BASE_URL}/satellites`),
            axios.get(`${API_BASE_URL}/groundstations`),
        ]).then(([satRes, gsRes]) => {
            setSatellites(satRes.data);
            setGroundStations(gsRes.data);
        }).catch(() => setMsg({ text: "Failed to load data.", type: "danger" }));
    }, []);

    useEffect(() => {
        if (selectedSatellite) {
            fetchAssignments(selectedSatellite);
        } else {
            setAssignments([]);
        }
    }, [selectedSatellite]);

    const fetchAssignments = async (satelliteId) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/assignments/${satelliteId}`);
            setAssignments(res.data);
        } catch {
            setMsg({ text: "Failed to load assignments.", type: "danger" });
        }
    };

    const assignSatellite = async (e) => {
        e.preventDefault();
        if (!selectedSatellite || !selectedGroundStation) {
            setMsg({ text: "Select both a satellite and a ground station.", type: "warning" });
            return;
        }
        setAssigning(true);
        try {
            await axios.post(`${API_BASE_URL}/assignments`, {
                satellite_id: selectedSatellite,
                ground_station_id: selectedGroundStation,
            });
            setSelectedGroundStation("");
            setMsg({ text: "Assignment created successfully.", type: "success" });
            fetchAssignments(selectedSatellite);
        } catch (err) {
            setMsg({ text: err.response?.data?.message || "Failed to create assignment.", type: "danger" });
        } finally {
            setAssigning(false);
        }
    };

    const unassign = async (gsId) => {
        try {
            await axios.delete(`${API_BASE_URL}/assignments`, {
                data: { satellite_id: selectedSatellite, ground_station_id: gsId },
            });
            setMsg({ text: "Assignment removed.", type: "success" });
            fetchAssignments(selectedSatellite);
        } catch {
            setMsg({ text: "Failed to remove assignment.", type: "danger" });
        }
    };

    const filteredAssignments = assignments.filter((a) => {
        const gs = groundStations.find((g) => g.ground_station_id === a.ground_station_id);
        return (a.ground_station_id + (gs?.name || "")).toLowerCase().includes(searchTerm.toLowerCase());
    });

    const selectedSatName = satellites.find((s) => s.satellite_id === selectedSatellite)?.name;

    return (
        <div>
            <h2 className="fw-semibold mb-4">Assign Satellite to Ground Station</h2>

            <Alert msg={msg} onClose={() => setMsg({ text: "", type: "" })} />

            <div className="card shadow-sm mb-4">
                <div className="card-header bg-white fw-semibold">New Assignment</div>
                <div className="card-body">
                    <form onSubmit={assignSatellite} className="row g-3 align-items-end">
                        <div className="col-md-5">
                            <label className="form-label small text-muted">Satellite</label>
                            <select
                                className="form-select"
                                value={selectedSatellite}
                                onChange={(e) => setSelectedSatellite(e.target.value)}
                            >
                                <option value="">Select satellite…</option>
                                {satellites.map((s) => (
                                    <option key={s.satellite_id} value={s.satellite_id}>
                                        {s.name} ({s.satellite_id})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-5">
                            <label className="form-label small text-muted">Ground Station</label>
                            <select
                                className="form-select"
                                value={selectedGroundStation}
                                onChange={(e) => setSelectedGroundStation(e.target.value)}
                            >
                                <option value="">Select ground station…</option>
                                {groundStations.map((gs) => (
                                    <option key={gs.ground_station_id} value={gs.ground_station_id}>
                                        {gs.name} ({gs.ground_station_id})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <button className="btn btn-primary w-100" type="submit" disabled={assigning}>
                                {assigning ? <span className="spinner-border spinner-border-sm" /> : "Assign"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {selectedSatellite && (
                <div className="card shadow-sm">
                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                        <span className="fw-semibold">
                            Assignments for <code>{selectedSatName || selectedSatellite}</code>
                        </span>
                        <span className="badge bg-secondary">{filteredAssignments.length}</span>
                    </div>
                    <div className="card-body pb-0">
                        <input
                            type="text"
                            className="form-control mb-3"
                            placeholder="Filter by ground station ID or name…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Ground Station ID</th>
                                    <th>Name</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssignments.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center text-muted py-4">
                                            {assignments.length === 0
                                                ? "No ground stations assigned to this satellite."
                                                : "No results match your filter."}
                                        </td>
                                    </tr>
                                ) : filteredAssignments.map((a) => {
                                    const gs = groundStations.find((g) => g.ground_station_id === a.ground_station_id);
                                    return (
                                        <tr key={a.ground_station_id}>
                                            <td><code>{a.ground_station_id}</code></td>
                                            <td>{gs?.name || <span className="text-muted">Unknown</span>}</td>
                                            <td className="text-end">
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => unassign(a.ground_station_id)}
                                                >
                                                    Unassign
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!selectedSatellite && (
                <div className="text-center text-muted py-5">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mb-3 d-block mx-auto opacity-50">
                        <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5M12 12h.01M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
                    </svg>
                    Select a satellite above to view or manage its ground station assignments.
                </div>
            )}
        </div>
    );
}

export default AssignSatellitePage;
