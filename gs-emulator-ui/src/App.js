import React, { useState, useEffect } from "react";
import axios from "axios";
import JSONPretty from "react-json-pretty";
import "react-json-pretty/themes/monikai.css"; // Import theme for JSONPretty
import "bootstrap/dist/css/bootstrap.min.css"; // Bootstrap for styling

const API_BASE_URL = "http://localhost:5000"; // Backend API URL

function App() {
  const [satellites, setSatellites] = useState([]);
  const [newSatellite, setNewSatellite] = useState({ satellite_id: "", name: "" });
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

  const createSatellite = async () => {
    if (!newSatellite.satellite_id || !newSatellite.name) {
      alert("Satellite ID and Name are required!");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/satellites`, newSatellite, {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
      });
      console.log("Server response:", response.data);
      fetchSatellites(); // Refresh list after adding
      setNewSatellite({ satellite_id: "", name: "" });
    } catch (error) {
      console.error("Error creating satellite:", error);
    }
  };

  const deleteSatellite = async (satellite_id) => {
    if (!window.confirm(`Are you sure you want to delete ${satellite_id}?`)) {
        return;
    }

    try {
        const response = await axios.delete(`${API_BASE_URL}/satellites/${satellite_id}`, {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            }
        });

        console.log("Delete response:", response.data);
        fetchSatellites();  // Refresh list after deleting
        alert("Satellite deleted successfully!");
    } catch (error) {
        console.error("Error deleting satellite:", error);
    }
  };

  const updateTelemetry = async () => {
    if (!selectedSatellite) {
        alert("No satellite selected!");
        return;
    }

    try {
        const response = await axios.put(
            `${API_BASE_URL}/satellites/${selectedSatellite.satellite_id}`,
            { telemetry_payload: JSON.parse(telemetryPayload) }, // Ensure valid JSON
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                }
            }
        );

        console.log("Telemetry update response:", response.data);
        fetchSatellites();  // Refresh list after updating
        alert("Telemetry updated successfully!");
    } catch (error) {
        console.error("Error updating telemetry:", error);
    }
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-3">Ground Station API Emulator</h1>

      {/* Create New Satellite */}
      <div className="card p-3 mb-4">
        <h3>Add a New Satellite</h3>
        <input
          type="text"
          className="form-control my-2"
          placeholder="Satellite ID"
          value={newSatellite.satellite_id}
          onChange={(e) => setNewSatellite({ ...newSatellite, satellite_id: e.target.value })}
        />
        <input
          type="text"
          className="form-control my-2"
          placeholder="Satellite Name"
          value={newSatellite.name}
          onChange={(e) => setNewSatellite({ ...newSatellite, name: e.target.value })}
        />
        <button className="btn btn-primary" onClick={createSatellite}>Create Satellite</button>
      </div>

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
                <button className="btn btn-info btn-sm me-2" onClick={() => {
                  setSelectedSatellite(sat);
                  setTelemetryPayload(JSON.stringify(sat.telemetry_payload || {}, null, 2));
                }}>
                  Edit Telemetry
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteSatellite(sat.satellite_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Telemetry Payload */}
      {selectedSatellite && (
        <div className="card p-3 mt-4">
          <h3>Edit Telemetry Payload for {selectedSatellite.name}</h3>
          <textarea
            className="form-control"
            rows="8"
            value={telemetryPayload}
            onChange={(e) => setTelemetryPayload(e.target.value)}
          />
          <button className="btn btn-success mt-3" onClick={updateTelemetry}>Update Telemetry</button>
          <h4 className="mt-3">Telemetry Data Preview:</h4>
          <JSONPretty id="json-pretty" data={telemetryPayload}></JSONPretty>
        </div>
      )}
    </div>
  );
}

export default App;
