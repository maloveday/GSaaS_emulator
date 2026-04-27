import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PassTimeline from "./PassTimeline";

const API_BASE_URL = "";

const STATUS_BADGE = {
    SCHEDULED:   { bg: "primary",   text: "Scheduled"   },
    IN_PROGRESS: { bg: "warning",   text: "In Progress" },
    COMPLETED:   { bg: "success",   text: "Completed"   },
    CANCELLED:   { bg: "secondary", text: "Cancelled"   },
};

const STATUS_FILTERS = ["ALL", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

function StatusBadge({ status }) {
    const { bg, text } = STATUS_BADGE[status] || { bg: "secondary", text: status };
    return (
        <span className={`badge bg-${bg} d-inline-flex align-items-center gap-1`}>
            {status === "IN_PROGRESS" && (
                <span
                    className="spinner-grow spinner-grow-sm"
                    style={{ width: "6px", height: "6px", flexShrink: 0 }}
                />
            )}
            {text}
        </span>
    );
}

function Alert({ msg, onClose }) {
    if (!msg.text) return null;
    return (
        <div className={`alert alert-${msg.type} alert-dismissible fade show`} role="alert">
            {msg.text}
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
        </div>
    );
}

function Spinner() {
    return (
        <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading…</span>
            </div>
        </div>
    );
}

// datetime-local value (local time string) → UTC ISO 8601
function toUTC(localDatetime) {
    return new Date(localDatetime).toISOString();
}

// UTC ISO 8601 → human-readable local time
function fmtLocal(iso) {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function durationLabel(start, end) {
    const mins = Math.round((new Date(end) - new Date(start)) / 60_000);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
}

// Default start = next full hour; default end = start + 10 minutes
function defaultTimes() {
    const start = new Date();
    start.setMinutes(60 - start.getMinutes(), 0, 0);
    const end = new Date(start.getTime() + 10 * 60_000);
    const toLocal = (d) => {
        // toISOString is UTC; adjust for local timezone
        const offset = d.getTimezoneOffset() * 60_000;
        return new Date(d - offset).toISOString().slice(0, 16);
    };
    return { start: toLocal(start), end: toLocal(end) };
}

function PassSchedulingPage() {
    const [passes, setPasses] = useState([]);
    const [satellites, setSatellites] = useState([]);
    const [groundStations, setGroundStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scheduling, setScheduling] = useState(false);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [msg, setMsg] = useState({ text: "", type: "" });

    const defaults = defaultTimes();
    const [form, setForm] = useState({
        satellite_id: "",
        ground_station_id: "",
        start_time: defaults.start,
        end_time: defaults.end,
    });

    const showMsg = (text, type = "success") => setMsg({ text, type });
    const clearMsg = () => setMsg({ text: "", type: "" });
    const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const fetchPasses = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/passes`);
            setPasses(res.data);
        } catch {
            showMsg("Failed to load passes.", "danger");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        Promise.all([
            axios.get(`${API_BASE_URL}/satellites`),
            axios.get(`${API_BASE_URL}/groundstations`),
        ])
            .then(([satRes, gsRes]) => {
                setSatellites(satRes.data);
                setGroundStations(gsRes.data);
            })
            .catch(() => showMsg("Failed to load satellites or ground stations.", "danger"));

        fetchPasses();
    }, [fetchPasses]);

    // Auto-refresh every 30 s while any pass is active
    useEffect(() => {
        const hasActive = passes.some(
            (p) => p.status === "SCHEDULED" || p.status === "IN_PROGRESS"
        );
        if (!hasActive) return;
        const timer = setInterval(fetchPasses, 30_000);
        return () => clearInterval(timer);
    }, [passes, fetchPasses]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearMsg();
        if (!form.satellite_id || !form.ground_station_id) {
            return showMsg("Select both a satellite and a ground station.", "warning");
        }
        if (new Date(form.start_time) >= new Date(form.end_time)) {
            return showMsg("End time must be after start time.", "warning");
        }

        setScheduling(true);
        try {
            await axios.post(`${API_BASE_URL}/passes`, {
                satellite_id: form.satellite_id,
                ground_station_id: form.ground_station_id,
                start_time: toUTC(form.start_time),
                end_time: toUTC(form.end_time),
            });
            showMsg("Pass scheduled successfully.");
            fetchPasses();
        } catch (err) {
            showMsg(err.response?.data?.error || "Failed to schedule pass.", "danger");
        } finally {
            setScheduling(false);
        }
    };

    const cancelPass = async (passId) => {
        try {
            await axios.delete(`${API_BASE_URL}/passes/${passId}`);
            showMsg("Pass cancelled.");
            fetchPasses();
        } catch (err) {
            showMsg(err.response?.data?.error || "Failed to cancel pass.", "danger");
        }
    };

    const filtered = statusFilter === "ALL"
        ? passes
        : passes.filter((p) => p.status === statusFilter);

    const navigate = useNavigate();

    const satName = (id) => satellites.find((s) => s.satellite_id === id)?.name || id;
    const gsName  = (id) => groundStations.find((g) => g.ground_station_id === id)?.name || id;

    const counts = STATUS_FILTERS.slice(1).reduce((acc, s) => {
        acc[s] = passes.filter((p) => p.status === s).length;
        return acc;
    }, {});

    return (
        <div>
            <div className="d-flex align-items-center mb-4">
                <h2 className="mb-0 fw-semibold">Pass Scheduling</h2>
                <span className="badge bg-secondary ms-2">{passes.length}</span>
            </div>

            <Alert msg={msg} onClose={clearMsg} />

            {/* Summary strip */}
            {!loading && passes.length > 0 && (
                <div className="row g-2 mb-4">
                    {[
                        { key: "SCHEDULED",   label: "Scheduled",   color: "primary" },
                        { key: "IN_PROGRESS", label: "In Progress", color: "warning" },
                        { key: "COMPLETED",   label: "Completed",   color: "success" },
                        { key: "CANCELLED",   label: "Cancelled",   color: "secondary" },
                    ].map(({ key, label, color }) => (
                        <div className="col-6 col-sm-3" key={key}>
                            <div className={`card border-${color} shadow-sm`}>
                                <div className="card-body text-center py-2">
                                    <div className={`fs-4 fw-bold text-${color}`}>{counts[key]}</div>
                                    <div className="small text-muted">{label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Schedule form */}
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-white fw-semibold">Schedule a New Pass</div>
                <div className="card-body">
                    <form onSubmit={handleSubmit} className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label small text-muted">Satellite</label>
                            <select
                                className="form-select"
                                value={form.satellite_id}
                                onChange={setField("satellite_id")}
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
                        <div className="col-md-6">
                            <label className="form-label small text-muted">Ground Station</label>
                            <select
                                className="form-select"
                                value={form.ground_station_id}
                                onChange={setField("ground_station_id")}
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
                        <div className="col-md-5">
                            <label className="form-label small text-muted">Start Time (local)</label>
                            <input
                                type="datetime-local"
                                className="form-control"
                                value={form.start_time}
                                onChange={setField("start_time")}
                                required
                            />
                        </div>
                        <div className="col-md-5">
                            <label className="form-label small text-muted">End Time (local)</label>
                            <input
                                type="datetime-local"
                                className="form-control"
                                value={form.end_time}
                                onChange={setField("end_time")}
                                required
                            />
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <button className="btn btn-primary w-100" type="submit" disabled={scheduling}>
                                {scheduling
                                    ? <span className="spinner-border spinner-border-sm" />
                                    : "Schedule"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Timeline */}
            {!loading && passes.length > 0 && (
                <PassTimeline passes={passes} satellites={satellites} groundStations={groundStations} />
            )}

            {/* Pass list */}
            <div className="card shadow-sm">
                <div className="card-header bg-white d-flex flex-wrap align-items-center gap-2">
                    <span className="fw-semibold me-auto">Scheduled Passes</span>
                    <div className="btn-group btn-group-sm">
                        {STATUS_FILTERS.map((s) => (
                            <button
                                key={s}
                                type="button"
                                className={`btn ${statusFilter === s ? "btn-dark" : "btn-outline-secondary"}`}
                                onClick={() => setStatusFilter(s)}
                            >
                                {s === "ALL" ? "All" : s.replace("_", " ")}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={fetchPasses}
                        title="Refresh"
                    >
                        ↻ Refresh
                    </button>
                </div>

                {loading ? <Spinner /> : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Satellite</th>
                                    <th>Ground Station</th>
                                    <th>Start</th>
                                    <th>End</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center text-muted py-4">
                                            {passes.length === 0
                                                ? "No passes scheduled yet. Use the form above to schedule one."
                                                : "No passes match the selected filter."}
                                        </td>
                                    </tr>
                                ) : filtered.map((p) => (
                                    <tr key={p.pass_id}>
                                        <td>{satName(p.satellite_id)}</td>
                                        <td>{gsName(p.ground_station_id)}</td>
                                        <td className="small">{fmtLocal(p.start_time)}</td>
                                        <td className="small">{fmtLocal(p.end_time)}</td>
                                        <td className="small text-muted">
                                            {durationLabel(p.start_time, p.end_time)}
                                        </td>
                                        <td><StatusBadge status={p.status} /></td>
                                        <td className="text-end">
                                            {p.status === "IN_PROGRESS" && (
                                                <button
                                                    className="btn btn-outline-success btn-sm me-2"
                                                    onClick={() => navigate(
                                                        `/telemetry?sat=${p.satellite_id}&gs=${p.ground_station_id}`
                                                    )}
                                                >
                                                    Telemetry
                                                </button>
                                            )}
                                            {(p.status === "SCHEDULED" || p.status === "IN_PROGRESS") && (
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => cancelPass(p.pass_id)}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PassSchedulingPage;
