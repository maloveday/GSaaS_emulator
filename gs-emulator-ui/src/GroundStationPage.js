import React, { useState, useEffect } from "react";
import axios from "axios";
import JSONPretty from "react-json-pretty";
import "react-json-pretty/themes/monikai.css";

const API_BASE_URL = "http://localhost:5000";

function GroundStationPage() {
    const [groundStations, setGroundStations] = useState([]);
    const [newStation, setNewStation] = useState({ ground_station_id: "", name: "" });
    const [selectedStation, setSelectedStation] = useState(null);
    const [telemetryPayload, setTelemetryPayload] = useState("{}");

    useEffect(() => {
        fetchGroundStations();
    }, []);

    const fetchGroundStations = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/groundstations`);
            setGroundStations(response.data);
        } catch (error) {
            console.error("Error fetching ground stations:", error);
        }
    };

    const createGroundStation = async () => {
        if (!newStation.ground_station_id || !newStation.name) {
            alert("Ground Station ID and Name are required!");
            return;
        }
        try {
            await axios.post(`${API_BASE_URL}/groundstations`, newStation);
            fetchGroundStations();
            setNewStation({ ground_station_id: "", name: "" });
            alert("Ground station created successfully!");
        } catch (error) {
            console.error("Error creating ground station:", error);
            alert("Failed to create ground station.");
        }
    };

    const deleteGroundStation = async (ground_station_id) => {
        if (!window.confirm(`Delete ground station ${ground_station_id}?`)) return;
        try {
            await axios.delete(`${API_BASE_URL}/groundstations/${ground_station_id}`);
            fetchGroundStations();
            alert("Ground station deleted.");
        } catch (error) {
            console.error("Error deleting station:", error);
            alert("Failed to delete ground station.");
        }
    };

    const updateTelemetry = async () => {
        if (!selectedStation) {
            alert("No ground station selected!");
            return;
        }
        try {
            const parsed = JSON.parse(telemetryPayload);
            await axios.put(`${API_BASE_URL}/groundstations/${selectedStation.ground_station_id}`, {
                telemetry_payload: parsed,
            });
            fetchGroundStations();
            alert("Telemetry updated.");
        } catch (error) {
            console.error("Error updating telemetry:", error);
            alert("Invalid JSON or server error.");
        }
    };

    return (
        <div>
            <h2>Manage Ground Stations</h2>

            <div className="card p-3 mb-4">
                <h3>Add New Ground Station</h3>
                <input
                    type="text"
                    placeholder="Ground Station ID"
                    className="form-control mb-2"
                    value={newStation.ground_station_id}
                    onChange={(e) =>
                        setNewStation({ ...newStation, ground_station_id: e.target.value })
                    }
                />
                <input
                    type="text"
                    placeholder="Name"
                    className="form-control mb-2"
                    value={newStation.name}
                    onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                />
                <button className="btn btn-primary" onClick={createGroundStation}>
                    Create Ground Station
                </button>
            </div>

            <h3>Ground Stations</h3>
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
                                    onClick={() => {
                                        setSelectedStation(gs);
                                        setTelemetryPayload(
                                            JSON.stringify(gs.telemetry_payload || {}, null, 2)
                                        );
                                    }}
                                >
                                    Edit Telemetry
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => deleteGroundStation(gs.ground_station_id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedStation && (
                <div className="card p-3 mt-4">
                    <h3>Edit Telemetry for {selectedStation.name}</h3>
                    <textarea
                        className="form-control"
                        rows="6"
                        value={telemetryPayload}
                        onChange={(e) => setTelemetryPayload(e.target.value)}
                    />
                    <button className="btn btn-success mt-3" onClick={updateTelemetry}>
                        Update Telemetry
                    </button>
                    <h4 className="mt-3">Preview:</h4>
                    <JSONPretty data={telemetryPayload}></JSONPretty>
                </div>
            )}
        </div>
    );
}

export default GroundStationPage;
