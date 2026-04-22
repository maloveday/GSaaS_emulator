import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = "";

function AssignmentOverviewPage() {
    const [satellites, setSatellites] = useState([]);
    const [groundStations, setGroundStations] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            const [satRes, gsRes, asgRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/satellites`),
                axios.get(`${API_BASE_URL}/groundstations`),
                axios.get(`${API_BASE_URL}/assignments`),
            ]);
            setSatellites(satRes.data);
            setGroundStations(gsRes.data);
            setAssignments(asgRes.data);
        } catch {
            setError("Failed to load overview data. Is the API server running?");
        } finally {
            setLoading(false);
        }
    };

    const getGroundStationName = (gsId) => {
        const gs = groundStations.find((g) => g.ground_station_id === gsId);
        return gs ? gs.name : null;
    };

    const getAssignedStations = (satelliteId) =>
        assignments.filter((a) => a.satellite_id === satelliteId).map((a) => a.ground_station_id);

    const totalAssignments = assignments.length;

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h2 className="fw-semibold mb-0">Assignment Overview</h2>
                <button className="btn btn-outline-secondary btn-sm" onClick={fetchData} disabled={loading}>
                    {loading
                        ? <span className="spinner-border spinner-border-sm" />
                        : "Refresh"}
                </button>
            </div>

            {error && (
                <div className="alert alert-danger">{error}</div>
            )}

            {/* Summary row */}
            {!loading && !error && (
                <div className="row g-3 mb-4">
                    {[
                        { label: "Satellites",     value: satellites.length,    color: "primary" },
                        { label: "Ground Stations",value: groundStations.length, color: "info" },
                        { label: "Assignments",    value: totalAssignments,      color: "success" },
                    ].map(({ label, value, color }) => (
                        <div className="col-sm-4" key={label}>
                            <div className={`card shadow-sm border-${color} border-top border-top-4`}>
                                <div className="card-body text-center py-3">
                                    <div className={`fs-2 fw-bold text-${color}`}>{value}</div>
                                    <div className="small text-muted">{label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading…</span>
                    </div>
                </div>
            ) : satellites.length === 0 ? (
                <div className="text-center text-muted py-5">
                    No satellites found. Add some on the Satellites page.
                </div>
            ) : (
                <div className="row g-3">
                    {satellites.map((sat) => {
                        const assignedGsIds = getAssignedStations(sat.satellite_id);
                        return (
                            <div className="col-md-6" key={sat.satellite_id}>
                                <div className="card shadow-sm h-100">
                                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                        <span className="fw-semibold">{sat.name || sat.satellite_id}</span>
                                        <span className={`badge ${assignedGsIds.length > 0 ? "bg-success" : "bg-secondary"}`}>
                                            {assignedGsIds.length} station{assignedGsIds.length !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <div className="card-body">
                                        <div className="small text-muted mb-2">
                                            <code>{sat.satellite_id}</code>
                                        </div>
                                        {assignedGsIds.length === 0 ? (
                                            <p className="text-muted small mb-0">No ground stations assigned.</p>
                                        ) : (
                                            <ul className="list-group list-group-flush">
                                                {assignedGsIds.map((gsId) => (
                                                    <li key={gsId} className="list-group-item px-0 py-1 d-flex justify-content-between">
                                                        <code className="small">{gsId}</code>
                                                        <span className="text-muted small">
                                                            {getGroundStationName(gsId) || ""}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default AssignmentOverviewPage;
