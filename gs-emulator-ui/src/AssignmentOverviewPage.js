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

    const getGroundStationName = (gsId) => {
        const gs = groundStations.find(g => g.ground_station_id === gsId);
        return gs ? gs.name : "Unknown";
    };

    const getAssignedStations = (satelliteId) => {
        return assignments
            .filter(a => a.satellite_id === satelliteId)
            .map(a => a.ground_station_id);
    };

    return (
        <div>
            <h2>Assignment Overview</h2>
            <p className="text-muted">
                This page shows all satellites and their assigned ground stations.
            </p>

            {satellites.map((sat) => {
                const assignedGsIds = getAssignedStations(sat.satellite_id);
                return (
                    <div key={sat.satellite_id} className="card mb-3 p-3">
                        <h5>{sat.name || sat.satellite_id}</h5>
                        {assignedGsIds.length > 0 ? (
                            <ul>
                                {assignedGsIds.map((gsId) => (
                                    <li key={gsId}>
                                        {gsId} – {getGroundStationName(gsId)}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted">No ground stations assigned.</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default AssignmentOverviewPage;
