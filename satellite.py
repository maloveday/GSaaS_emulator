"""Satellite module for GSaaS Emulator.

Defines the Satellite model and API resource for managing satellite records,
including CRUD operations and telemetry payload updates.
"""

from flask import request
from flask_restful import Resource
from database import db


class Satellite(db.Model):
    """Satellite database model."""
    satellite_id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    telemetry_payload = db.Column(db.JSON, nullable=True)


class SatelliteAPI(Resource):
    """Flask-RESTful API resource for Satellite operations."""

    def get(self):
        """Get a list of all satellites."""
        satellites = Satellite.query.all()
        return [{
            "satellite_id": s.satellite_id,
            "name": s.name,
            "telemetry_payload": s.telemetry_payload
        } for s in satellites]

    def post(self):
        """Create a new satellite with ID and name."""
        data = request.json
        satellite = Satellite(
            satellite_id=data.get("satellite_id"),
            name=data.get("name")
        )
        db.session.add(satellite)
        db.session.commit()
        return {"message": "Satellite created"}, 201

    def put(self, satellite_id):
        """Update telemetry payload for the specified satellite."""
        satellite = Satellite.query.get_or_404(satellite_id)
        data = request.json
        satellite.telemetry_payload = data.get("telemetry_payload")
        db.session.commit()
        return {"message": "Telemetry updated"}, 200

    def delete(self, satellite_id):
        """Delete the satellite with the given ID."""
        satellite = Satellite.query.get_or_404(satellite_id)
        db.session.delete(satellite)
        db.session.commit()
        return {"message": "Satellite deleted"}, 200