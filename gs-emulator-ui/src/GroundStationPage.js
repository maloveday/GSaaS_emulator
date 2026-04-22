import React, { useEffect, useState } from "react";
import axios from "axios";
import JSONPretty from "react-json-pretty";

const API_BASE_URL = "http://localhost:5000";

function GroundStationPage() {
    const [groundStations, setGroundStations] = useState([]);
    const [newStation, setNewStation] = useState({ ground_station_id: "", name: "" });
    const [selectedStation, setSelectedStation] = useState(null);
    const [telemetryPayload, setTelemetryPayload] = useState("{}");
    const [assignments, setAssignments] = useState([]);
    const [viewAssignmentsId, setViewAssignmentsId] = useState(null);

    useEffect(() => {
        fetchGroundStations();
    }, []);

    const fetchGroundStations = async () => {
        const res = await axios.get(`${API_BASE_URL}/groundstations`);
        setGroundStations(res.data);
    };

    const createGroundStation = async () => {
        const { ground_station_id, name } = newStation;
        if (!ground_station_id || !name) return alert("ID and name required.");
        await axios.post(`${API_BASE_URL}/groundstations`, newStation);
        fetchGroundStations();
        setNewStation({ ground_station_id: "", name: "" });
    };

    const deleteStation = async (id) => {
        await axios.delete(`${API_BASE_URL}/groundstations/${id}`);
        fetchGroundStations();
    };

    const updateTelemetry = async () => {
        try {
            const parsed = JSON.parse(telemetryPayload);
            await axios.put(`${API_BASE_URL}/groundstations/${selectedStation.ground_station_id}`, {
                telemetry_payload: parsed,
            });
            fetchGroundStations();
            alert("Telemetry updated.");
        } catch (e) {
            alert("Invalid JSON.");
        }
    };

    const handleEdit = (gs) => {
        setSelectedStation(gs);
        setTelemetryPayload(JSON.stringify(gs.telemetry_payload || {}, null, 2));
    };

    const handleViewAssignments = async (stationId) => {
        const res = await axios.get(
            `${API_BASE_URL}/assignments?ground_station_id=${stationId}`
        );
        setAssignments(res.data);
        setViewAssignmentsId(stationId);
    };

    return (
        <div>
            <h2>Manage Ground Stations</h2>

            <div className="card p-3 mb-4">
                <input
                    className="form-control mb-2"
                    placeholder="Ground Station ID"
                    value={newStation.ground_station_id}
                    onChange={(e) =>
                        setNewStation({ ...newStation, ground_station_id: e.target.value })
                    }
                />
                <input
                    className="form-control mb-2"
                    placeholder="Ground Station Name"
                    value={newStation.name}
                    onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                />
                <button className="btn btn-primary" onClick={createGroundStation}>
                    Create Ground Station
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
                    {groundStations.map((gs) => (
                        <tr key={gs.ground_station_id}>
                            <td>{gs.ground_station_id}</td>
                            <td>{gs.name}</td>
                            <td>
                                <button
                                    className="btn btn-info btn-sm me-2"
                                    onClick={() => handleEdit(gs)}
                                >
                                    Edit Telemetry
                                </button>
                                <button
                                    className="btn btn-danger btn-sm me-2"
                                    onClick={() => deleteStation(gs.ground_station_id)}
                                >
                                    Delete
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleViewAssignments(gs.ground_station_id)}
                                >
                                    View Assigned Satellites
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedStation && (
                <div className="card p-3 mt-4">
                    <h5>Edit Telemetry for {selectedStation.name}</h5>
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
                    <h5>Satellites assigned to {viewAssignmentsId}</h5>
                    {assignments.length > 0 ? (
                        <ul>
                            {assignments.map((a) => (
                                <li key={a.satellite_id}>{a.satellite_id}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted">No satellites assigned.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default GroundStationPage;
