/**
 * SatellitePage Component
 *
 * Manages CRUD operations for satellites including telemetry payload updates
 * and displays ground station assignment status.
 */

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

    /**
     * Fetch all satellites from the backend API.
     */
    const fetchSatellites = async () => {
        const res = await axios.get(`${API_BASE_URL}/satellites`);
        setSatellites(res.data);
    };

    /**
     * Create a new satellite with the provided ID and name.
     */
    const createSatellite = async () => {
        const { satellite_id, name } = newSatellite;
        if (!satellite_id || !name) return alert("Satellite ID and name required.");
        await axios.post(`${API_BASE_URL}/satellites`, newSatellite);
        fetchSatellites();
        setNewSatellite({ satellite_id: "", name: "" });
    };

    /**
     * Delete the satellite with the given ID.
     * @param {string} id - Satellite ID to delete
     */
    const deleteSatellite = async (id) => {
        await axios.delete(`${API_BASE_URL}/satellites/${id}`);
        fetchSatellites();
    };

    /**
     * Update telemetry payload for the selected satellite.
     */
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

    /**
     * Load telemetry for editing.
     * @param {object} sat - Satellite object
     */
    const handleEdit = (sat) => {
        setSelectedSatellite(sat);
        setTelemetryPayload(JSON.stringify(sat.telemetry_payload || {}, null, 2));
    };

    /**
     * Load ground station assignments for the given satellite.
     * @param {string} satelliteId - Satellite ID
     */
    const handleViewAssignments = async (satelliteId) => {
        const res = await axios.get(`${API_BASE_URL}/assignments/${satelliteId}`);
        setAssignments(res.data);
        setViewAssignmentsId(satelliteId);
    };

    return (
        <div>
            <h2>Manage Satellites</h2>
            ...
        </div>
    );
}

export default SatellitePage;