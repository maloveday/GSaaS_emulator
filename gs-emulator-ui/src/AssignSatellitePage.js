/**
 * AssignSatellitePage Component
 *
 * Handles the assignment of satellites to ground stations and allows
 * viewing and unassigning of existing relationships. Supports filtering.
 */

import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

function AssignSatellitePage() {
    const [satellites, setSatellites] = useState([]);
    const [groundStations, setGroundStations] = useState([]);
    const [selectedSatellite, setSelectedSatellite] = useState("");
    const [selectedGroundStation, setSelectedGroundStation] = useState("");
    const [assignments, setAssignments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchSatellites();
        fetchGroundStations();
    }, []);

    useEffect(() => {
        if (selectedSatellite) {
            fetchAssignments(selectedSatellite);
        } else {
            setAssignments([]);
        }
    }, [selectedSatellite]);

    /**
     * Fetch all satellites.
     */
    const fetchSatellites = async () => {
        const response = await axios.get(`${API_BASE_URL}/satellites`);
        setSatellites(response.data);
    };

    /**
     * Fetch all ground stations.
     */
    const fetchGroundStations = async () => {
        const response = await axios.get(`${API_BASE_URL}/groundstations`);
        setGroundStations(response.data);
    };

    /**
     * Fetch assignments for the selected satellite.
     * @param {string} satelliteId
     */
    const fetchAssignments = async (satelliteId) => {
        const response = await axios.get(`${API_BASE_URL}/assignments/${satelliteId}`);
        setAssignments(response.data);
    };

    /**
     * Assign a satellite to a ground station.
     */
    const assignSatellite = async () => {
        if (!selectedSatellite || !selectedGroundStation) return;
        await axios.post(`${API_BASE_URL}/assignments`, {
            satellite_id: selectedSatellite,
            ground_station_id: selectedGroundStation,
        });
        fetchAssignments(selectedSatellite);
    };

    /**
     * Unassign a satellite from a ground station.
     * @param {string} gsId
     */
    const unassign = async (gsId) => {
        await axios.delete(`${API_BASE_URL}/assignments`, {
            data: {
                satellite_id: selectedSatellite,
                ground_station_id: gsId,
            },
        });
        fetchAssignments(selectedSatellite);
    };

    const filteredAssignments = assignments.filter((a) => {
        const gs = groundStations.find(gs => gs.ground_station_id === a.ground_station_id);
        const text = (a.ground_station_id + (gs?.name || "")).toLowerCase();
        return text.includes(searchTerm.toLowerCase());
    });

    return (
        <div>
            <h2>Assign Satellite to Ground Stations</h2>
            ...
        </div>
    );
}

export default AssignSatellitePage;