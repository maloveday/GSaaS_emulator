/**
 * AssignmentOverviewPage Component
 *
 * Provides an overview of all satellite-to-ground station assignments.
 * Lists satellites and displays their associated ground stations.
 */

import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

function AssignmentOverviewPage() {
    const [satellites, setSatellites] = useState([]);
    const [groundStations, setGroundStations] = useState([]);
    const [assignments, setAssignments] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    /**
     * Load all necessary data to build the overview list.
     */
    const fetchData = async () => {
        const [satRes, gsRes, asgRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/satellites`),
            axios.get(`${API_BASE_URL}/groundstations`),
            axios.get(`${API_BASE_URL}/assignments`),
        ]);

        setSatellites(satRes.data);
        setGroundStations(gsRes.data);
        setAssignments(asgRes.data);
    };

    /**
     * Get ground station name by ID.
     * @param {string} gsId
     */
    const getGroundStationName = (gsId) => {
        const gs = groundStations.find(g => g.ground_station_id === gsId);
        return gs ? gs.name : "Unknown";
    };

    /**
     * Return ground station IDs assigned to a satellite.
     * @param {string} satelliteId
     */
    const getAssignedStations = (satelliteId) => {
        return assignments
            .filter(a => a.satellite_id === satelliteId)
            .map(a => a.ground_station_id);
    };

    return (
        <div>
            <h2>Assignment Overview</h2>
            ...
        </div>
    );
}

export default AssignmentOverviewPage;