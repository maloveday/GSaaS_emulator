import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

function AssignSatellitePage() {
    const [satellites, setSatellites] = useState([]);
    const [groundStations, setGroundStations] = useState([]);
    const [selectedSatellite, setSelectedSatellite] = useState("");
    const [selectedGroundStation, setSelectedGroundStation] = useState("");

    useEffect(() => {
        fetchSatellites();
        fetchGroundStations();
    }, []);

    const fetchSatellites = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/satellites`);
            setSatellites(response.data);
        } catch (error) {
            console.error("Error fetching satellites:", error);
        }
    };

    const fetchGroundStations = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/groundstations`);
            setGroundStations(response.data);
        } catch (error) {
            console.error("Error fetching ground stations:", error);
        }
    };

    const assignSatellite = async () => {
        if (!selectedSatellite || !selectedGroundStation) {
            alert("Select a Satellite and a Ground Station!");
            return;
        }
        await axios.post(`${API_BASE_URL}/assign_satellite`, {
            satellite_id: selectedSatellite,
            ground_station_id: selectedGroundStation
        });
        alert("Satellite assigned successfully!");
    };

    return (
        <div>
            <h2>Assign Satellite to Ground Station</h2>

            <label>Choose a Satellite:</label>
            <select onChange={(e) => setSelectedSatellite(e.target.value)}>
                <option value="">Select</option>
                {satellites.map((sat) => (
                    <option key={sat.satellite_id} value={sat.satellite_id}>{sat.name}</option>
                ))}
            </select>

            <label>Choose a Ground Station:</label>
            <select onChange={(e) => setSelectedGroundStation(e.target.value)}>
                <option value="">Select</option>
                {groundStations.map((gs) => (
                    <option key={gs.ground_station_id} value={gs.ground_station_id}>{gs.name}</option>
                ))}
            </select>

            <button onClick={assignSatellite}>Assign</button>
        </div>
    );
}

export default AssignSatellitePage;
