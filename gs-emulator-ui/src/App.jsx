import React from "react";
import { BrowserRouter as Router, Route, Routes, NavLink, Navigate } from "react-router-dom";
import SatellitePage from "./SatellitePage";
import GroundStationPage from "./GroundStationPage";
import AssignSatellitePage from "./AssignSatellitePage";
import AssignmentOverviewPage from "./AssignmentOverviewPage";
import PassSchedulingPage from "./PassSchedulingPage";
import TelemetryPage from "./TelemetryPage";
import "./App.css";

const NAV_LINKS = [
    { to: "/satellites",    label: "Satellites" },
    { to: "/groundstations",label: "Ground Stations" },
    { to: "/assign",        label: "Assign" },
    { to: "/passes",        label: "Pass Scheduling" },
    { to: "/telemetry",     label: "Telemetry" },
    { to: "/overview",      label: "Overview" },
];

function App() {
    return (
        <Router>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
                <div className="container">
                    <NavLink className="navbar-brand d-flex align-items-center gap-2" to="/satellites">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
                            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        GSaaS Emulator
                    </NavLink>

                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#mainNav"
                        aria-controls="mainNav"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon" />
                    </button>

                    <div className="collapse navbar-collapse" id="mainNav">
                        <ul className="navbar-nav ms-auto">
                            {NAV_LINKS.map(({ to, label }) => (
                                <li className="nav-item" key={to}>
                                    <NavLink className="nav-link px-3" to={to}>{label}</NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </nav>

            <main className="container py-4 flex-grow-1">
                <Routes>
                    <Route path="/" element={<Navigate to="/satellites" replace />} />
                    <Route path="/satellites"     element={<SatellitePage />} />
                    <Route path="/groundstations" element={<GroundStationPage />} />
                    <Route path="/assign"         element={<AssignSatellitePage />} />
                    <Route path="/passes"         element={<PassSchedulingPage />} />
                    <Route path="/telemetry"      element={<TelemetryPage />} />
                    <Route path="/overview"       element={<AssignmentOverviewPage />} />
                </Routes>
            </main>

            <footer className="page-footer">
                GSaaS Emulator &mdash; Mock AWS Ground Station API
            </footer>
        </Router>
    );
}

export default App;
