from flask import request, jsonify
from flask_restful import Resource
from database import db  # ✅ Import db from database.py

class Satellite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    satellite_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100))
    telemetry_payload = db.Column(db.JSON)

class SatelliteAPI(Resource):
    def get(self, satellite_id=None):
        if satellite_id:
            satellite = Satellite.query.filter_by(satellite_id=satellite_id).first()
            if not satellite:
                return {"error": "Satellite not found"}, 404
            return {
                "satellite_id": satellite.satellite_id,
                "name": satellite.name,
                "telemetry_payload": satellite.telemetry_payload
            }
        return [
            {
                "satellite_id": s.satellite_id,
                "name": s.name,
                "telemetry_payload": s.telemetry_payload
            } for s in Satellite.query.all()
        ]
