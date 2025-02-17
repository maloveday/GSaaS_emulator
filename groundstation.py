from flask import request, jsonify
from flask_restful import Resource
from database import db  # ✅ Import db from database.py

class GroundStation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ground_station_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100))

class GroundStationAPI(Resource):
    def get(self, ground_station_id=None):
        if ground_station_id:
            gs = GroundStation.query.filter_by(ground_station_id=ground_station_id).first()
            if not gs:
                return {"error": "Ground station not found"}, 404
            return {"ground_station_id": gs.ground_station_id, "name": gs.name}
        return [{"ground_station_id": gs.ground_station_id, "name": gs.name} for gs in GroundStation.query.all()]

    def post(self):
        data = request.json
        if not data.get("ground_station_id") or not data.get("name"):
            return {"error": "Ground Station ID and Name are required"}, 400

        new_ground_station = GroundStation(
            ground_station_id=data["ground_station_id"],
            name=data["name"]
        )

        try:
            db.session.add(new_ground_station)
            db.session.commit()
            return {"message": "Ground Station created successfully"}, 201
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

# ✅ Ensure `post()` method is added so API allows POST requests
