from flask import request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Resource

db = SQLAlchemy()

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
                "telemetry_payload": satellite.telemetry_payload  # ✅ Ensure telemetry is returned
            }
        return [
            {
                "satellite_id": s.satellite_id,
                "name": s.name,
                "telemetry_payload": s.telemetry_payload  # ✅ Ensure list includes telemetry data
            } for s in Satellite.query.all()
        ]
        
    def post(self):
        data = request.json
        if not data.get("satellite_id") or not data.get("name"):
            return {"error": "Satellite ID and Name are required"}, 400

        satellite = Satellite(
            satellite_id=data["satellite_id"],
            name=data["name"],
            telemetry_payload={}
        )
        db.session.add(satellite)
        db.session.commit()
        return {"message": "Satellite created"}, 201

    def put(self, satellite_id):
        satellite = Satellite.query.filter_by(satellite_id=satellite_id).first()
        if not satellite:
            return {"error": "Satellite not found"}, 404

        data = request.json
        satellite.name = data.get("name", satellite.name)
        satellite.telemetry_payload = data.get("telemetry_payload", satellite.telemetry_payload)
        db.session.commit()
        return {"message": "Satellite updated"}, 200

    def delete(self, satellite_id):
        satellite = Satellite.query.filter_by(satellite_id=satellite_id).first()
        if not satellite:
            return {"error": "Satellite not found"}, 404

        db.session.delete(satellite)
        db.session.commit()
        return {"message": "Satellite deleted"}, 200
