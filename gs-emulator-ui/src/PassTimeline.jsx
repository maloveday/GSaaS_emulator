import React, { useState, useEffect } from "react";

const STATUS_COLOR = {
    SCHEDULED:   "#0d6efd",
    IN_PROGRESS: "#ffc107",
    COMPLETED:   "#198754",
    CANCELLED:   "#adb5bd",
};

const LEGEND = [
    { status: "SCHEDULED",   label: "Scheduled",   color: STATUS_COLOR.SCHEDULED },
    { status: "IN_PROGRESS", label: "In Progress", color: STATUS_COLOR.IN_PROGRESS },
    { status: "COMPLETED",   label: "Completed",   color: STATUS_COLOR.COMPLETED },
    { status: "CANCELLED",   label: "Cancelled",   color: STATUS_COLOR.CANCELLED },
];

// Nice tick intervals in milliseconds
const TICK_INTERVALS = [
    5 * 60_000,
    10 * 60_000,
    15 * 60_000,
    30 * 60_000,
    60 * 60_000,
    2 * 60 * 60_000,
    3 * 60 * 60_000,
    6 * 60 * 60_000,
    12 * 60 * 60_000,
    24 * 60 * 60_000,
];

function pickInterval(rangeMs) {
    for (const iv of TICK_INTERVALS) {
        if (rangeMs / iv <= 10) return iv;
    }
    return TICK_INTERVALS[TICK_INTERVALS.length - 1];
}

function fmtTick(ms) {
    return new Date(ms).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

const MARGIN_LEFT  = 160;
const MARGIN_RIGHT = 20;
const MARGIN_TOP   = 36;
const MARGIN_BOTTOM = 32;
const ROW_HEIGHT   = 48;
const BAR_HEIGHT   = 22;
const VIEW_W       = 1000;
const INNER_W      = VIEW_W - MARGIN_LEFT - MARGIN_RIGHT;

function PassTimeline({ passes, satellites }) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30_000);
        return () => clearInterval(timer);
    }, []);

    if (!passes || passes.length === 0) return null;

    const satIds = [...new Set(passes.map((p) => p.satellite_id))];
    const satName = (id) => satellites?.find((s) => s.satellite_id === id)?.name || id;

    const height = MARGIN_TOP + satIds.length * ROW_HEIGHT + MARGIN_BOTTOM;

    const times = passes.flatMap((p) => [
        new Date(p.start_time).getTime(),
        new Date(p.end_time).getTime(),
    ]);
    const minMs = Math.min(...times);
    const maxMs = Math.max(...times);
    const rangeMs = Math.max(maxMs - minMs, 60_000);
    const pad = rangeMs * 0.05;
    const viewStart = minMs - pad;
    const viewEnd   = maxMs + pad;
    const viewRange = viewEnd - viewStart;

    const toX = (ms) => MARGIN_LEFT + ((ms - viewStart) / viewRange) * INNER_W;

    const tickInterval = pickInterval(viewRange);
    const firstTick = Math.ceil(viewStart / tickInterval) * tickInterval;
    const ticks = [];
    for (let t = firstTick; t <= viewEnd; t += tickInterval) ticks.push(t);

    const nowX = toX(now);
    const nowInView = nowX >= MARGIN_LEFT && nowX <= MARGIN_LEFT + INNER_W;

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header bg-white d-flex flex-wrap align-items-center gap-3">
                <span className="fw-semibold me-auto">Pass Window Timeline</span>
                <div className="d-flex flex-wrap gap-3 align-items-center" style={{ fontSize: 12 }}>
                    {LEGEND.map(({ status, label, color }) => (
                        <span key={status} className="d-flex align-items-center gap-1">
                            <span style={{
                                display: "inline-block", width: 14, height: 14,
                                borderRadius: 3, background: color, flexShrink: 0,
                            }} />
                            {label}
                        </span>
                    ))}
                    <span className="d-flex align-items-center gap-1">
                        <svg width="14" height="14" aria-hidden="true">
                            <line x1="7" y1="0" x2="7" y2="14"
                                stroke="#dc3545" strokeWidth="2" strokeDasharray="3,2" />
                        </svg>
                        Now
                    </span>
                </div>
            </div>

            <div className="card-body p-0" style={{ overflowX: "auto" }}>
                <svg
                    viewBox={`0 0 ${VIEW_W} ${height}`}
                    style={{ width: "100%", minWidth: 480, display: "block" }}
                    aria-label="Pass window timeline"
                >
                    {/* Chart background */}
                    <rect x={MARGIN_LEFT} y={MARGIN_TOP}
                        width={INNER_W} height={satIds.length * ROW_HEIGHT}
                        fill="#f8f9fa" />

                    {/* Alternating row shading */}
                    {satIds.map((_, i) => i % 2 === 1 && (
                        <rect key={i}
                            x={MARGIN_LEFT} y={MARGIN_TOP + i * ROW_HEIGHT}
                            width={INNER_W} height={ROW_HEIGHT}
                            fill="#e9ecef" />
                    ))}

                    {/* Gridlines and axis tick labels */}
                    {ticks.map((t) => {
                        const x = toX(t);
                        return (
                            <g key={t}>
                                <line x1={x} y1={MARGIN_TOP}
                                    x2={x} y2={MARGIN_TOP + satIds.length * ROW_HEIGHT}
                                    stroke="#dee2e6" strokeWidth="1" />
                                <text x={x} y={MARGIN_TOP + satIds.length * ROW_HEIGHT + 18}
                                    textAnchor="middle" fontSize="10" fill="#6c757d">
                                    {fmtTick(t)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Satellite name labels (Y-axis) */}
                    {satIds.map((id, i) => {
                        const label = satName(id);
                        const truncated = label.length > 17 ? label.slice(0, 16) + "…" : label;
                        return (
                            <text key={id}
                                x={MARGIN_LEFT - 8}
                                y={MARGIN_TOP + i * ROW_HEIGHT + ROW_HEIGHT / 2 + 4}
                                textAnchor="end" fontSize="11" fill="#212529">
                                {truncated}
                            </text>
                        );
                    })}

                    {/* Pass bars */}
                    {passes.map((p) => {
                        const rowIdx = satIds.indexOf(p.satellite_id);
                        if (rowIdx < 0) return null;
                        const x1 = toX(new Date(p.start_time).getTime());
                        const x2 = toX(new Date(p.end_time).getTime());
                        const barW = Math.max(x2 - x1, 2);
                        const y = MARGIN_TOP + rowIdx * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;
                        const color = STATUS_COLOR[p.status] ?? "#6c757d";
                        return (
                            <g key={p.pass_id}>
                                <rect x={x1} y={y} width={barW} height={BAR_HEIGHT}
                                    fill={color} rx={4}
                                    opacity={p.status === "CANCELLED" ? 0.4 : 0.85}>
                                    <title>
                                        {`${p.satellite_id} → ${p.ground_station_id}\n${p.start_time} – ${p.end_time}\nStatus: ${p.status}`}
                                    </title>
                                </rect>
                                {barW > 40 && (
                                    <text
                                        x={x1 + barW / 2}
                                        y={y + BAR_HEIGHT / 2 + 4}
                                        textAnchor="middle" fontSize="9" fill="white"
                                        style={{ pointerEvents: "none" }}>
                                        {p.ground_station_id}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* NOW indicator */}
                    {nowInView && (
                        <g>
                            <line x1={nowX} y1={MARGIN_TOP - 8}
                                x2={nowX} y2={MARGIN_TOP + satIds.length * ROW_HEIGHT + 6}
                                stroke="#dc3545" strokeWidth="1.5" strokeDasharray="4,3" />
                            <text x={nowX} y={MARGIN_TOP - 12}
                                textAnchor="middle" fontSize="10"
                                fill="#dc3545" fontWeight="bold">
                                NOW
                            </text>
                        </g>
                    )}

                    {/* Border */}
                    <rect x={MARGIN_LEFT} y={MARGIN_TOP}
                        width={INNER_W} height={satIds.length * ROW_HEIGHT}
                        fill="none" stroke="#dee2e6" strokeWidth="1" />
                </svg>
            </div>
        </div>
    );
}

export default PassTimeline;
