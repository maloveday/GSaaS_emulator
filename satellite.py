from flask import request, jsonify
from flask_restful import Resource
from database import db  # ✅ Import the shared database instance

class Satellite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    satellite_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100))
    telemetry_payload = db.Column(db.JSON, nullable=True)  # ✅ Ensure telemetry can store JSON

class SatelliteAPI(Resource):
    def get(self, satellite_id=None):
        """✅ Retrieve a single satellite or all satellites"""
        if satellite_id:
            satellite = Satellite.query.filter_by(satellite_id=satellite_id).first()
            if not satellite:
                return {"error": "Satellite not found"}, 404
            return {
                "satellite_id": satellite.satellite_id,
                "name": satellite.name,
                "telemetry_payload": satellite.telemetry_payload
            }, 200
        
        # ✅ Return all satellites
        satellites = Satellite.query.all()
        return [
            {
                "satellite_id": sat.satellite_id,
                "name": sat.name,
                "telemetry_payload": sat.telemetry_payload
            } for sat in satellites
        ], 200

    def post(self):
        """✅ Create a new satellite"""
        data = request.json
        if not data.get("satellite_id") or not data.get("name"):
            return {"error": "Satellite ID and Name are required"}, 400

        new_satellite = Satellite(
            satellite_id=data["satellite_id"],
            name=data["name"],
            telemetry_payload={}
        )

        try:
            db.session.add(new_satellite)
            db.session.commit()
            return {"message": "Satellite created successfully"}, 201
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

    def put(self, satellite_id):
        """✅ Update telemetry data for a satellite"""
        satellite = Satellite.query.filter_by(satellite_id=satellite_id).first()
        if not satellite:
            return {"error": "Satellite not found"}, 404

        data = request.json
        telemetry_data = data.get("telemetry_payload")

        if telemetry_data is None:
            return {"error": "Telemetry data required"}, 400

        try:
            satellite.telemetry_payload = telemetry_data
            db.session.commit()
            return {"message": "Telemetry updated successfully"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

    def delete(self, satellite_id):
        """✅ Remove a satellite"""
        satellite = Satellite.query.filter_by(satellite_id=satellite_id).first()
        if not satellite:
            return {"error": "Satellite not found"}, 404

        try:
            db.session.delete(satellite)
            db.session.commit()
            return {"message": f"Satellite {satellite_id} deleted successfully"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500
