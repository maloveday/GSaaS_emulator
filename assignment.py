from flask import request
from flask_restful import Resource
from database import db


class SatelliteAssignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    satellite_id = db.Column(db.String(50), db.ForeignKey("satellite.satellite_id"), nullable=False)
    ground_station_id = db.Column(db.String(50), db.ForeignKey("ground_station.ground_station_id"), nullable=False)


class SatelliteAssignmentAPI(Resource):
    def get(self, satellite_id=None):
        """
        Retrieve assignments.

        - GET /assignments                          → all assignments
        - GET /assignments/<satellite_id>           → ground stations for a satellite
        - GET /assignments?ground_station_id=<id>  → satellites for a ground station
        """
        ground_station_id = request.args.get("ground_station_id")

        if satellite_id:
            assignments = SatelliteAssignment.query.filter_by(satellite_id=satellite_id).all()
        elif ground_station_id:
            assignments = SatelliteAssignment.query.filter_by(ground_station_id=ground_station_id).all()
        else:
            assignments = SatelliteAssignment.query.all()

        return [
            {
                "satellite_id": a.satellite_id,
                "ground_station_id": a.ground_station_id,
            }
            for a in assignments
        ], 200

    def post(self):
        """
        Assign a satellite to a ground station.

        Expects JSON: { "satellite_id": "...", "ground_station_id": "..." }
        """
        data = request.json
        satellite_id = data.get("satellite_id")
        ground_station_id = data.get("ground_station_id")

        if not satellite_id or not ground_station_id:
            return {"error": "satellite_id and ground_station_id are required"}, 400

        existing = SatelliteAssignment.query.filter_by(
            satellite_id=satellite_id,
            ground_station_id=ground_station_id,
        ).first()
        if existing:
            return {"message": "Already assigned"}, 200

        try:
            assignment = SatelliteAssignment(
                satellite_id=satellite_id,
                ground_station_id=ground_station_id,
            )
            db.session.add(assignment)
            db.session.commit()
            return {"message": f"{satellite_id} assigned to {ground_station_id}"}, 201
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

    def delete(self):
        """
        Unassign a satellite from a ground station.

        Expects JSON: { "satellite_id": "...", "ground_station_id": "..." }
        """
        data = request.json
        satellite_id = data.get("satellite_id")
        ground_station_id = data.get("ground_station_id")

        assignment = SatelliteAssignment.query.filter_by(
            satellite_id=satellite_id,
            ground_station_id=ground_station_id,
        ).first()
        if not assignment:
            return {"error": "Assignment not found"}, 404

        try:
            db.session.delete(assignment)
            db.session.commit()
            return {"message": f"Unassigned {satellite_id} from {ground_station_id}"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500
