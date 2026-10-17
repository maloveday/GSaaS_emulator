"""Ground Station module for GSaaS Emulator.

Provides the GroundStation model and API for CRUD operations,
including telemetry payload handling.
"""

from flask import request
from flask_restful import Resource
from database import db


class GroundStation(db.Model):
    """GroundStation database model."""
    ground_station_id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    telemetry_payload = db.Column(db.JSON, nullable=True)


class GroundStationAPI(Resource):
    """Flask-RESTful API resource for Ground Station operations."""

    def get(self):
        """Get a list of all ground stations."""
        stations = GroundStation.query.all()
        return [{
            "ground_station_id": s.ground_station_id,
            "name": s.name,
            "telemetry_payload": s.telemetry_payload
        } for s in stations]

    def post(self):
        """Create a new ground station with ID and name."""
        data = request.json
        station = GroundStation(
            ground_station_id=data.get("ground_station_id"),
            name=data.get("name")
        )
        db.session.add(station)
        db.session.commit()
        return {"message": "Ground station created"}, 201

    def put(self, ground_station_id):
        """Update telemetry payload for the specified ground station."""
        station = GroundStation.query.get_or_404(ground_station_id)
        data = request.json
        station.telemetry_payload = data.get("telemetry_payload")
        db.session.commit()
        return {"message": "Telemetry updated"}, 200

    def delete(self, ground_station_id):
        """Delete the ground station with the given ID."""
        station = GroundStation.query.get_or_404(ground_station_id)
        db.session.delete(station)
        db.session.commit()
        return {"message": "Ground station deleted"}, 200