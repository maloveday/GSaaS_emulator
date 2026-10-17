/**
 * GroundStationPage Component
 *
 * Manages CRUD operations for ground stations including telemetry payload updates
 * and displays satellite assignment status.
 */

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

    /**
     * Fetch all ground stations from the backend API.
     */
    const fetchGroundStations = async () => {
        const res = await axios.get(`${API_BASE_URL}/groundstations`);
        setGroundStations(res.data);
    };

    /**
     * Create a new ground station.
     */
    const createGroundStation = async () => {
        const { ground_station_id, name } = newStation;
        if (!ground_station_id || !name) return alert("ID and name required.");
        await axios.post(`${API_BASE_URL}/groundstations`, newStation);
        fetchGroundStations();
        setNewStation({ ground_station_id: "", name: "" });
    };

    /**
     * Delete a ground station by ID.
     * @param {string} id - Ground Station ID
     */
    const deleteStation = async (id) => {
        await axios.delete(`${API_BASE_URL}/groundstations/${id}`);
        fetchGroundStations();
    };

    /**
     * Update telemetry payload for the selected ground station.
     */
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

    /**
     * Load telemetry data into the editor.
     * @param {object} gs - Ground station object
     */
    const handleEdit = (gs) => {
        setSelectedStation(gs);
        setTelemetryPayload(JSON.stringify(gs.telemetry_payload || {}, null, 2));
    };

    /**
     * Load assigned satellites for a ground station.
     * @param {string} stationId - Ground Station ID
     */
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
            ...
        </div>
    );
}

export default GroundStationPage;