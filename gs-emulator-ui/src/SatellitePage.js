import React, { useState, useEffect } from "react";
import axios from "axios";
import JSONPretty from "react-json-pretty";
import "react-json-pretty/themes/monikai.css";

const API_BASE_URL = "http://localhost:5000";

function SatellitePage() {
    const [satellites, setSatellites] = useState([]);
    const [newSatellite, setNewSatellite] = useState({ satellite_id: "", name: "" });
    const [selectedSatellite, setSelectedSatellite] = useState(null);
    const [telemetryPayload, setTelemetryPayload] = useState("{}");
    const [assignments, setAssignments] = useState([]);
    const [viewAssignmentsId, setViewAssignmentsId] = useState(null);

    useEffect(() => {
        fetchSatellites();
    }, []);

    const fetchSatellites = async () => {
        const res = await axios.get(`${API_BASE_URL}/satellites`);
        setSatellites(res.data);
    };

    const createSatellite = async () => {
        const { satellite_id, name } = newSatellite;
        if (!satellite_id || !name) return alert("Satellite ID and name required.");

        await axios.post(`${API_BASE_URL}/satellites`, newSatellite);
        fetchSatellites();
        setNewSatellite({ satellite_id: "", name: "" });
    };

    const deleteSatellite = async (id) => {
        await axios.delete(`${API_BASE_URL}/satellites/${id}`);
        fetchSatellites();
    };

    const updateTelemetry = async () => {
        try {
            const parsed = JSON.parse(telemetryPayload);
            await axios.put(`${API_BASE_URL}/satellites/${selectedSatellite.satellite_id}`, {
                telemetry_payload: parsed,
            });
            fetchSatellites();
            alert("Telemetry updated.");
        } catch (e) {
            alert("Invalid JSON.");
        }
    };

    const handleEdit = (sat) => {
        setSelectedSatellite(sat);
        setTelemetryPayload(JSON.stringify(sat.telemetry_payload || {}, null, 2));
    };

    const handleViewAssignments = async (satelliteId) => {
        const res = await axios.get(`${API_BASE_URL}/assignments/${satelliteId}`);
        setAssignments(res.data);
        setViewAssignmentsId(satelliteId);
    };

    return (
        <div>
            <h2>Manage Satellites</h2>

            <div className="card p-3 mb-4">
                <input
                    className="form-control mb-2"
                    placeholder="Satellite ID"
                    value={newSatellite.satellite_id}
                    onChange={(e) =>
                        setNewSatellite({ ...newSatellite, satellite_id: e.target.value })
                    }
                />
                <input
                    className="form-control mb-2"
                    placeholder="Satellite Name"
                    value={newSatellite.name}
                    onChange={(e) => setNewSatellite({ ...newSatellite, name: e.target.value })}
                />
                <button className="btn btn-primary" onClick={createSatellite}>
                    Create Satellite
                </button>
            </div>

            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {satellites.map((sat) => (
                        <tr key={sat.satellite_id}>
                            <td>{sat.satellite_id}</td>
                            <td>{sat.name}</td>
                            <td>
                                <button
                                    className="btn btn-info btn-sm me-2"
                                    onClick={() => handleEdit(sat)}
                                >
                                    Edit Telemetry
                                </button>
                                <button
                                    className="btn btn-danger btn-sm me-2"
                                    onClick={() => deleteSatellite(sat.satellite_id)}
                                >
                                    Delete
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleViewAssignments(sat.satellite_id)}
                                >
                                    View Assignments
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedSatellite && (
                <div className="card p-3 mt-4">
                    <h5>Edit Telemetry for {selectedSatellite.name}</h5>
                    <textarea
                        className="form-control mb-2"
                        rows={6}
                        value={telemetryPayload}
                        onChange={(e) => setTelemetryPayload(e.target.value)}
                    />
                    <button className="btn btn-success" onClick={updateTelemetry}>
                        Update Telemetry
                    </button>
                    <JSONPretty data={telemetryPayload}></JSONPretty>
                </div>
            )}

            {viewAssignmentsId && (
                <div className="card p-3 mt-4">
                    <h5>Assigned Ground Stations for {viewAssignmentsId}</h5>
                    {assignments.length > 0 ? (
                        <ul>
                            {assignments.map((a) => (
                                <li key={a.ground_station_id}>{a.ground_station_id}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted">No ground stations assigned.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default SatellitePage;
