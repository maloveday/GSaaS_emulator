import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import JSONPretty from "react-json-pretty";
import "react-json-pretty/themes/monikai.css";

const API_BASE_URL = "";

// Format ISO UTC string to local time
function fmtLocal(iso) {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// Human-readable duration until a future ISO UTC string
function timeUntil(iso) {
    const secs = Math.max(0, Math.round((new Date(iso) - Date.now()) / 1000));
    if (secs < 60)  return `${secs}s`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
}

function TelemetryPage() {
    const [searchParams] = useSearchParams();

    const [satellites, setSatellites] = useState([]);
    const [groundStations, setGroundStations] = useState([]);
    const [satelliteId, setSatelliteId] = useState(searchParams.get("sat") || "");
    const [groundStationId, setGroundStationId] = useState(searchParams.get("gs") || "");
    const [result, setResult] = useState(null);   // { status, data }
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        Promise.all([
            axios.get(`${API_BASE_URL}/satellites`),
            axios.get(`${API_BASE_URL}/groundstations`),
        ]).then(([satRes, gsRes]) => {
            setSatellites(satRes.data);
            setGroundStations(gsRes.data);
        });
    }, []);

    // Auto-fetch if both IDs were supplied via query params
    useEffect(() => {
        if (searchParams.get("sat") && searchParams.get("gs")) {
            fetchTelemetry(searchParams.get("sat"), searchParams.get("gs"));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchTelemetry = async (satId = satelliteId, gsId = groundStationId) => {
        if (!satId || !gsId) return;
        setFetching(true);
        setResult(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/telemetry/${satId}/${gsId}`);
            setResult({ status: res.status, data: res.data });
        } catch (err) {
            setResult({
                status: err.response?.status ?? 0,
                data: err.response?.data ?? { error: "Network error" },
            });
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchTelemetry();
    };

    const isInWindow  = result?.status === 200;
    const isOutOfRange = result?.status === 503;
    const isNotFound  = result?.status === 404;

    return (
        <div>
            <div className="d-flex align-items-center mb-4">
                <h2 className="mb-0 fw-semibold">Telemetry</h2>
            </div>

            {/* Query form */}
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-white fw-semibold">Fetch Spacecraft Telemetry</div>
                <div className="card-body">
                    <form onSubmit={handleSubmit} className="row g-3 align-items-end">
                        <div className="col-md-5">
                            <label className="form-label small text-muted">Satellite</label>
                            <select
                                className="form-select"
                                value={satelliteId}
                                onChange={(e) => { setSatelliteId(e.target.value); setResult(null); }}
                                required
                            >
                                <option value="">Select satellite…</option>
                                {satellites.map((s) => (
                                    <option key={s.satellite_id} value={s.satellite_id}>
                                        {s.name} ({s.satellite_id})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-5">
                            <label className="form-label small text-muted">Ground Station</label>
                            <select
                                className="form-select"
                                value={groundStationId}
                                onChange={(e) => { setGroundStationId(e.target.value); setResult(null); }}
                                required
                            >
                                <option value="">Select ground station…</option>
                                {groundStations.map((gs) => (
                                    <option key={gs.ground_station_id} value={gs.ground_station_id}>
                                        {gs.name} ({gs.ground_station_id})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <button
                                type="submit"
                                className="btn btn-primary w-100"
                                disabled={fetching || !satelliteId || !groundStationId}
                            >
                                {fetching
                                    ? <span className="spinner-border spinner-border-sm" />
                                    : "Fetch"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Result panels */}
            {result && (
                <>
                    {/* ── 200 In-window ─────────────────────────────────── */}
                    {isInWindow && (
                        <div className="card shadow-sm border-success">
                            <div className="card-header bg-success bg-opacity-10 d-flex align-items-center gap-2">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.8" className="text-success">
                                    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5M12 12h.01
                                             M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
                                </svg>
                                <span className="fw-semibold text-success">
                                    In Contact &mdash; HTTP 200 OK
                                </span>
                                <span className="badge bg-success ms-auto">LIVE</span>
                            </div>
                            <div className="card-body">
                                <div className="row g-3 mb-3 small text-muted">
                                    <div className="col-sm-6">
                                        <div className="fw-semibold text-body">Satellite</div>
                                        {result.data.satellite_name}&nbsp;
                                        (<code>{result.data.satellite_id}</code>)
                                    </div>
                                    <div className="col-sm-6">
                                        <div className="fw-semibold text-body">Ground Station</div>
                                        {result.data.ground_station_name}&nbsp;
                                        (<code>{result.data.ground_station_id}</code>)
                                    </div>
                                    <div className="col-sm-6">
                                        <div className="fw-semibold text-body">Pass Window</div>
                                        {fmtLocal(result.data.pass_start)} &rarr; {fmtLocal(result.data.pass_end)}
                                    </div>
                                    <div className="col-sm-6">
                                        <div className="fw-semibold text-body">Pass ID</div>
                                        <code className="small">{result.data.pass_id}</code>
                                    </div>
                                </div>

                                <div className="fw-semibold mb-1">Telemetry Payload</div>
                                {Object.keys(result.data.telemetry).length === 0 ? (
                                    <p className="text-muted small mb-0">
                                        No telemetry data set. Update it on the Satellites page.
                                    </p>
                                ) : (
                                    <JSONPretty data={result.data.telemetry} />
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── 503 Out of window ──────────────────────────────── */}
                    {isOutOfRange && (
                        <div className="card shadow-sm border-warning">
                            <div className="card-header bg-warning bg-opacity-10 d-flex align-items-center gap-2">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.8" className="text-warning">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 8v4M12 16h.01" />
                                </svg>
                                <span className="fw-semibold text-warning">
                                    Out of Contact &mdash; HTTP 503 Service Unavailable
                                </span>
                            </div>
                            <div className="card-body">
                                <p className="mb-3">{result.data.error}</p>

                                {result.data.next_pass_start ? (
                                    <div className="alert alert-info mb-0 d-flex align-items-start gap-3">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" strokeWidth="1.8" className="flex-shrink-0 mt-1">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        <div>
                                            <div className="fw-semibold">Next scheduled pass</div>
                                            <div>
                                                {fmtLocal(result.data.next_pass_start)}
                                                &nbsp;&rarr;&nbsp;
                                                {fmtLocal(result.data.next_pass_end)}
                                            </div>
                                            <div className="small text-muted mt-1">
                                                Starts in&nbsp;
                                                <strong>{timeUntil(result.data.next_pass_start)}</strong>
                                                &nbsp;&mdash;&nbsp;
                                                Pass ID: <code>{result.data.next_pass_id}</code>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="alert alert-secondary mb-0">
                                        No future passes are scheduled for this satellite
                                        and ground station combination. Schedule one on the
                                        Pass Scheduling page.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── 404 Not found ─────────────────────────────────── */}
                    {isNotFound && (
                        <div className="card shadow-sm border-danger">
                            <div className="card-header bg-danger bg-opacity-10 fw-semibold text-danger">
                                HTTP 404 Not Found
                            </div>
                            <div className="card-body">
                                <p className="mb-0">{result.data.error}</p>
                            </div>
                        </div>
                    )}

                    {/* ── Unexpected error ──────────────────────────────── */}
                    {!isInWindow && !isOutOfRange && !isNotFound && (
                        <div className="alert alert-danger">
                            Unexpected error (HTTP {result.status}): {result.data.error}
                        </div>
                    )}
                </>
            )}

            {/* Empty prompt */}
            {!result && !fetching && (
                <div className="text-center text-muted py-5">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.2"
                        className="mb-3 d-block mx-auto opacity-50">
                        <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5
                                 M12 12h.01M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
                    </svg>
                    Select a satellite and ground station, then click <strong>Fetch</strong> to
                    retrieve live telemetry.
                    <br />
                    <span className="small">
                        Telemetry is only accessible during an active pass window.
                    </span>
                </div>
            )}
        </div>
    );
}

export default TelemetryPage;
