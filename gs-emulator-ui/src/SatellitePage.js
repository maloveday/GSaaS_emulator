import React, { useState, useEffect } from "react";
import axios from "axios";
import JSONPretty from "react-json-pretty";
import "react-json-pretty/themes/monikai.css";

const API_BASE_URL = "http://localhost:5000";

function SatellitePage() {
    const [satellites, setSatellites] = useState([]);
    const [selectedSatellite, setSelectedSatellite] = useState(null);
    const [telemetryPayload, setTelemetryPayload] = useState("{}");

    useEffect(() => {
        fetchSatellites();
    }, []);

    const fetchSatellites = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/satellites`);
            setSatellites(response.data);
        } catch (error) {
            console.error("Error fetching satellites:", error);
        }
    };

    const deleteSatellite = async (satellite_id) => {
        if (!window.confirm(`Are you sure you want to delete ${satellite_id}?`)) {
            return;
        }
        try {
            await axios.delete(`${API_BASE_URL}/satellites/${satellite_id}`);
            fetchSatellites();
            alert(`Satellite ${satellite_id} deleted successfully!`);
        } catch (error) {
            console.error("Error deleting satellite:", error);
            alert("Failed to delete the satellite.");
        }
    };

    const updateTelemetry = async () => {
        if (!selectedSatellite) {
            alert("No satellite selected!");
            return;
        }
        try {
            const parsedTelemetry = JSON.parse(telemetryPayload);
            await axios.put(`${API_BASE_URL}/satellites/${selectedSatellite.satellite_id}`, {
                telemetry_payload: parsedTelemetry
            });
            fetchSatellites();
            alert("Telemetry updated successfully!");
        } catch (error) {
            console.error("Error updating telemetry:", error);
            alert("Invalid JSON format!");
        }
    };

    return (
        <div>
            <h2>Manage Satellites</h2>

            {/* Satellite List */}
            <h3>Satellites</h3>
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>Satellite ID</th>
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
                                <button className="btn btn-info btn-sm me-2"
                                        onClick={() => {
                                            setSelectedSatellite(sat);
                                            setTelemetryPayload(JSON.stringify(sat.telemetry_payload || {}, null, 2));
                                        }}>
                                    Edit Telemetry
                                </button>
                                <button className="btn btn-danger btn-sm"
                                        onClick={() => deleteSatellite(sat.satellite_id)}>
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Edit Telemetry Payload */}
            {selectedSatellite && (
                <div className="card p-3 mt-4">
                    <h3>Edit Telemetry Payload for {selectedSatellite.name}</h3>
                    <textarea className="form-control"
                              rows="6"
                              value={telemetryPayload}
                              onChange={(e) => setTelemetryPayload(e.target.value)} />
                    <button className="btn btn-success mt-3" onClick={updateTelemetry}>
                        Update Telemetry
                    </button>
                    <h4 className="mt-3">Telemetry Data Preview:</h4>
                    <JSONPretty data={telemetryPayload}></JSONPretty>
                </div>
            )}
        </div>
    );
}

export default SatellitePage;
