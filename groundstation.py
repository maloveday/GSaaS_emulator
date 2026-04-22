from flask import request
from flask_restful import Resource
from database import db


class GroundStation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ground_station_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    telemetry_payload = db.Column(db.JSON, nullable=True)


class GroundStationAPI(Resource):
    def get(self, ground_station_id=None):
        """Retrieve a single ground station by ID, or all ground stations."""
        if ground_station_id:
            station = GroundStation.query.filter_by(ground_station_id=ground_station_id).first()
            if not station:
                return {"error": "Ground station not found"}, 404
            return {
                "ground_station_id": station.ground_station_id,
                "name": station.name,
                "telemetry_payload": station.telemetry_payload,
            }, 200

        stations = GroundStation.query.all()
        return [
            {
                "ground_station_id": gs.ground_station_id,
                "name": gs.name,
                "telemetry_payload": gs.telemetry_payload,
            }
            for gs in stations
        ], 200

    def post(self):
        """Create a new ground station."""
        data = request.json
        if not data.get("ground_station_id") or not data.get("name"):
            return {"error": "ground_station_id and name are required"}, 400

        new_station = GroundStation(
            ground_station_id=data["ground_station_id"],
            name=data["name"],
            telemetry_payload={},
        )

        try:
            db.session.add(new_station)
            db.session.commit()
            return {"message": "Ground station created successfully"}, 201
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

    def put(self, ground_station_id):
        """Update the telemetry payload for a ground station."""
        station = GroundStation.query.filter_by(ground_station_id=ground_station_id).first()
        if not station:
            return {"error": "Ground station not found"}, 404

        data = request.json
        telemetry_data = data.get("telemetry_payload")
        if telemetry_data is None:
            return {"error": "telemetry_payload is required"}, 400

        try:
            station.telemetry_payload = telemetry_data
            db.session.commit()
            return {"message": "Telemetry updated successfully"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

    def delete(self, ground_station_id):
        """Delete a ground station by ID."""
        station = GroundStation.query.filter_by(ground_station_id=ground_station_id).first()
        if not station:
            return {"error": "Ground station not found"}, 404

        try:
            db.session.delete(station)
            db.session.commit()
            return {"message": f"Ground station {ground_station_id} deleted"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500
