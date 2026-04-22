from flask import request
from flask_restful import Resource
from database import db
from datetime import datetime, timezone
import uuid


class SatellitePass(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pass_id = db.Column(db.String(50), unique=True, nullable=False)
    satellite_id = db.Column(
        db.String(50), db.ForeignKey("satellite.satellite_id"), nullable=False
    )
    ground_station_id = db.Column(
        db.String(50), db.ForeignKey("ground_station.ground_station_id"), nullable=False
    )
    start_time = db.Column(db.String(50), nullable=False)
    end_time = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default="SCHEDULED")


def _live_status(pass_obj):
    """Return the current computed status based on wall-clock UTC time."""
    if pass_obj.status == "CANCELLED":
        return "CANCELLED"
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    if now >= pass_obj.end_time:
        return "COMPLETED"
    if now >= pass_obj.start_time:
        return "IN_PROGRESS"
    return "SCHEDULED"


def _serialise(pass_obj):
    return {
        "pass_id": pass_obj.pass_id,
        "satellite_id": pass_obj.satellite_id,
        "ground_station_id": pass_obj.ground_station_id,
        "start_time": pass_obj.start_time,
        "end_time": pass_obj.end_time,
        "status": _live_status(pass_obj),
    }


class SatellitePassAPI(Resource):
    def get(self, pass_id=None):
        """
        Retrieve pass(es).

        - GET /passes            → all passes ordered by start time
        - GET /passes/<pass_id>  → a single pass
        """
        if pass_id:
            p = SatellitePass.query.filter_by(pass_id=pass_id).first()
            if not p:
                return {"error": "Pass not found"}, 404
            return _serialise(p), 200

        passes = SatellitePass.query.order_by(SatellitePass.start_time).all()
        return [_serialise(p) for p in passes], 200

    def post(self):
        """
        Schedule a new satellite pass.

        Expects JSON:
            {
              "satellite_id": "...",
              "ground_station_id": "...",
              "start_time": "<ISO 8601 UTC>",
              "end_time":   "<ISO 8601 UTC>"
            }
        """
        data = request.json or {}
        satellite_id = data.get("satellite_id")
        ground_station_id = data.get("ground_station_id")
        start_time = data.get("start_time")
        end_time = data.get("end_time")

        if not all([satellite_id, ground_station_id, start_time, end_time]):
            return {
                "error": "satellite_id, ground_station_id, start_time and end_time are required"
            }, 400

        if start_time >= end_time:
            return {"error": "end_time must be after start_time"}, 400

        new_pass = SatellitePass(
            pass_id=str(uuid.uuid4()),
            satellite_id=satellite_id,
            ground_station_id=ground_station_id,
            start_time=start_time,
            end_time=end_time,
        )

        try:
            db.session.add(new_pass)
            db.session.commit()
            return _serialise(new_pass), 201
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

    def delete(self, pass_id):
        """Cancel a scheduled or in-progress pass."""
        p = SatellitePass.query.filter_by(pass_id=pass_id).first()
        if not p:
            return {"error": "Pass not found"}, 404

        if _live_status(p) == "COMPLETED":
            return {"error": "Cannot cancel a completed pass"}, 400

        try:
            p.status = "CANCELLED"
            db.session.commit()
            return {"message": f"Pass {pass_id} cancelled"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500
