from flask import request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Resource

db = SQLAlchemy()

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

        ground_station = GroundStation(ground_station_id=data["ground_station_id"], name=data["name"])
        db.session.add(ground_station)
        db.session.commit()
        return {"message": "Ground Station created"}, 201

    def put(self, ground_station_id):
        gs = GroundStation.query.filter_by(ground_station_id=ground_station_id).first()
        if not gs:
            return {"error": "Ground station not found"}, 404

        data = request.json
        gs.name = data.get("name", gs.name)
        db.session.commit()
        return {"message": "Ground Station updated"}, 200

    def delete(self, ground_station_id):
        gs = GroundStation.query.filter_by(ground_station_id=ground_station_id).first()
        if not gs:
            return {"error": "Ground station not found"}, 404

        db.session.delete(gs)
        db.session.commit()
        return {"message": "Ground Station deleted"}, 200
