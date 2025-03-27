import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

function AssignSatellitePage() {
    const [satellites, setSatellites] = useState([]);
    const [groundStations, setGroundStations] = useState([]);
    const [selectedSatellite, setSelectedSatellite] = useState("");
    const [selectedGroundStation, setSelectedGroundStation] = useState("");
    const [assignments, setAssignments] = useState([]);

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

    const fetchSatellites = async () => {
        const response = await axios.get(`${API_BASE_URL}/satellites`);
        setSatellites(response.data);
    };

    const fetchGroundStations = async () => {
        const response = await axios.get(`${API_BASE_URL}/groundstations`);
        setGroundStations(response.data);
    };

    const fetchAssignments = async (satelliteId) => {
        const response = await axios.get(`${API_BASE_URL}/assignments/${satelliteId}`);
        setAssignments(response.data);
    };

    const assignSatellite = async () => {
        if (!selectedSatellite || !selectedGroundStation) return;
        await axios.post(`${API_BASE_URL}/assignments`, {
            satellite_id: selectedSatellite,
            ground_station_id: selectedGroundStation,
        });
        fetchAssignments(selectedSatellite);
    };

    const unassign = async (gsId) => {
        await axios.delete(`${API_BASE_URL}/assignments`, {
            data: {
                satellite_id: selectedSatellite,
                ground_station_id: gsId,
            },
        });
        fetchAssignments(selectedSatellite);
    };

    return (
        <div>
            <h2>Assign Satellite to Ground Stations</h2>

            <div className="card p-3 mb-4">
                <div className="row mb-3">
                    <div className="col">
                        <label>Satellite</label>
                        <select
                            className="form-select"
                            value={selectedSatellite}
                            onChange={(e) => setSelectedSatellite(e.target.value)}
                        >
                            <option value="">Select...</option>
                            {satellites.map((s) => (
                                <option key={s.satellite_id} value={s.satellite_id}>
                                    {s.satellite_id}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col">
                        <label>Ground Station</label>
                        <select
                            className="form-select"
                            value={selectedGroundStation}
                            onChange={(e) => setSelectedGroundStation(e.target.value)}
                        >
                            <option value="">Select...</option>
                            {groundStations.map((gs) => (
                                <option key={gs.ground_station_id} value={gs.ground_station_id}>
                                    {gs.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-auto d-flex align-items-end">
                        <button className="btn btn-primary" onClick={assignSatellite}>
                            Assign
                        </button>
                    </div>
                </div>
            </div>

            {selectedSatellite && (
                <div>
                    <h4>Assignments for {selectedSatellite}</h4>
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>Ground Station ID</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map((a) => (
                                <tr key={a.ground_station_id}>
                                    <td>{a.ground_station_id}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => unassign(a.ground_station_id)}
                                        >
                                            Unassign
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AssignSatellitePage;
