from flask_restful import Resource
from database import db
from satellite import Satellite
from groundstation import GroundStation
from passes import SatellitePass, _live_status
from datetime import datetime, timezone


class TelemetryAPI(Resource):
    def get(self, satellite_id, ground_station_id):
        """
        Retrieve real-time telemetry for a satellite via a ground station.

        Telemetry is only accessible while an active pass window (IN_PROGRESS)
        exists between the satellite and the ground station.

        Returns:
            200 OK               – telemetry payload with active pass context
            404 Not Found        – satellite or ground station does not exist
            503 Service Unavailable – spacecraft is outside the pass window;
                                     includes Retry-After header (seconds) and
                                     next_pass_start field when a future pass
                                     is scheduled
        """
        satellite = Satellite.query.filter_by(satellite_id=satellite_id).first()
        if not satellite:
            return {"error": f"Satellite '{satellite_id}' not found"}, 404

        station = GroundStation.query.filter_by(ground_station_id=ground_station_id).first()
        if not station:
            return {"error": f"Ground station '{ground_station_id}' not found"}, 404

        all_passes = SatellitePass.query.filter_by(
            satellite_id=satellite_id,
            ground_station_id=ground_station_id,
        ).all()

        active_pass = next(
            (p for p in all_passes if _live_status(p) == "IN_PROGRESS"),
            None,
        )

        if active_pass:
            return {
                "satellite_id": satellite.satellite_id,
                "satellite_name": satellite.name,
                "ground_station_id": station.ground_station_id,
                "ground_station_name": station.name,
                "pass_id": active_pass.pass_id,
                "pass_start": active_pass.start_time,
                "pass_end": active_pass.end_time,
                "telemetry": satellite.telemetry_payload or {},
            }, 200

        # Spacecraft is outside the pass window — find the next scheduled pass
        upcoming = sorted(
            [p for p in all_passes if _live_status(p) == "SCHEDULED"],
            key=lambda p: p.start_time,
        )
        next_pass = upcoming[0] if upcoming else None

        body = {
            "error": (
                f"Spacecraft '{satellite_id}' is not currently in contact with "
                f"ground station '{ground_station_id}': no active pass window"
            ),
        }

        headers = {}
        if next_pass:
            body["next_pass_id"] = next_pass.pass_id
            body["next_pass_start"] = next_pass.start_time
            body["next_pass_end"] = next_pass.end_time
            next_start = datetime.fromisoformat(
                next_pass.start_time.replace("Z", "+00:00")
            )
            retry_after = max(0, int((next_start - datetime.now(timezone.utc)).total_seconds()))
            headers["Retry-After"] = str(retry_after)

        return body, 503, headers
