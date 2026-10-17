"""Assignment module for GSaaS Emulator.

Defines the model and API for assigning satellites to ground stations,
including one-to-many relationships and unassignment.
"""

from flask import request
from flask_restful import Resource
from database import db


class SatelliteAssignment(db.Model):
    """Assignment linking table between satellites and ground stations."""
    id = db.Column(db.Integer, primary_key=True)
    satellite_id = db.Column(db.String(50), db.ForeignKey("satellite.satellite_id"), nullable=False)
    ground_station_id = db.Column(db.String(50), db.ForeignKey("ground_station.ground_station_id"), nullable=False)


class SatelliteAssignmentAPI(Resource):
    """Flask-RESTful API resource for satellite-ground station assignments."""

    def get(self, satellite_id=None):
        """Get all assignments or filter by satellite or ground station."""
        ground_station_id = request.args.get("ground_station_id")

        if satellite_id:
            assignments = SatelliteAssignment.query.filter_by(satellite_id=satellite_id).all()
        elif ground_station_id:
            assignments = SatelliteAssignment.query.filter_by(ground_station_id=ground_station_id).all()
        else:
            assignments = SatelliteAssignment.query.all()

        return [{
            "satellite_id": a.satellite_id,
            "ground_station_id": a.ground_station_id
        } for a in assignments], 200

    def post(self):
        """Assign a satellite to a ground station."""
        data = request.json
        assignment = SatelliteAssignment(
            satellite_id=data.get("satellite_id"),
            ground_station_id=data.get("ground_station_id")
        )
        db.session.add(assignment)
        db.session.commit()
        return {"message": "Assignment created"}, 201

    def delete(self):
        """Unassign a satellite from a ground station."""
        data = request.json
        assignment = SatelliteAssignment.query.filter_by(
            satellite_id=data.get("satellite_id"),
            ground_station_id=data.get("ground_station_id")
        ).first_or_404()
        db.session.delete(assignment)
        db.session.commit()
        return {"message": "Assignment removed"}, 200