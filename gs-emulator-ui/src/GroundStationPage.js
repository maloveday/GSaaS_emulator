import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

function GroundStationPage() {
    const [groundStations, setGroundStations] = useState([]);
    const [newGroundStation, setNewGroundStation] = useState({ ground_station_id: "", name: "" });

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
        if (!newGroundStation.ground_station_id || !newGroundStation.name) {
            alert("Ground Station ID and Name are required!");
            return;
        }
        await axios.post(`${API_BASE_URL}/groundstations`, newGroundStation);
        fetchGroundStations();
        setNewGroundStation({ ground_station_id: "", name: "" });
    };

    return (
        <div>
            <h2>Manage Ground Stations</h2>
            <input type="text" placeholder="Ground Station ID" value={newGroundStation.ground_station_id}
                   onChange={(e) => setNewGroundStation({ ...newGroundStation, ground_station_id: e.target.value })} />
            <input type="text" placeholder="Ground Station Name" value={newGroundStation.name}
                   onChange={(e) => setNewGroundStation({ ...newGroundStation, name: e.target.value })} />
            <button onClick={createGroundStation}>Create</button>

            <h3>Ground Stations</h3>
            <ul>
                {groundStations.map((gs) => (
                    <li key={gs.ground_station_id}>{gs.name} ({gs.ground_station_id})</li>
                ))}
            </ul>
        </div>
    );
}

export default GroundStationPage;
