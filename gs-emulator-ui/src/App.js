import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import SatellitePage from "./SatellitePage";
import GroundStationPage from "./GroundStationPage";
import AssignSatellitePage from "./AssignSatellitePage";
import AssignmentOverviewPage from './AssignmentOverviewPage';

function App() {
    return (
        <Router>
            <div className="container">
                <h1>Ground Station API Emulator</h1>
                <nav>
                    <Link to="/satellites">Manage Satellites</Link> | 
                    <Link to="/groundstations">Manage Ground Stations</Link> | 
                    <Link to="/assign">Assign Satellite to Ground Station</Link> |
                    <Link to="/overview">Assignment Overview</Link>
                </nav>

                <Routes>
                    <Route path="/satellites" element={<SatellitePage />} />
                    <Route path="/groundstations" element={<GroundStationPage />} />
                    <Route path="/assign" element={<AssignSatellitePage />} />
                    <Route path="/overview" element={<AssignmentOverviewPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
