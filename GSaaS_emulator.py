from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api, Resource

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///gs_emulator.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
api = Api(app)

# Models
class Satellite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    satellite_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100))
    telemetry_payload = db.Column(db.JSON)

class GroundStation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ground_station_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100))

# ✅ Ensure `db.create_all()` runs within the Flask app context
with app.app_context():
    db.create_all()

# Example API Resource
class SatelliteAPI(Resource):
    def get(self, satellite_id=None):
        if satellite_id:
            satellite = Satellite.query.filter_by(satellite_id=satellite_id).first()
            if not satellite:
                return {"error": "Satellite not found"}, 404
            return {"id": satellite.id, "satellite_id": satellite.satellite_id, "name": satellite.name, "telemetry_payload": satellite.telemetry_payload}
        satellites = Satellite.query.all()
        return [{"satellite_id": s.satellite_id, "name": s.name} for s in satellites]

    def post(self):
        data = request.json
        if not data.get('satellite_id') or not data.get('name'):
            return {"error": "Satellite ID and Name are required"}, 400  # Validation

        satellite = Satellite(
            satellite_id=data['satellite_id'], 
            name=data['name'], 
            telemetry_payload={}
        )

        try:
            db.session.add(satellite)
            db.session.commit()  # ✅ Ensure data is saved
            return {"message": "Satellite created successfully"}, 201
        except Exception as e:
            db.session.rollback()  # Rollback in case of failure
            return {"error": str(e)}, 500

    def put(self, satellite_id):
        satellite = Satellite.query.filter_by(satellite_id=satellite_id).first()
        if not satellite:
            return {"error": "Satellite not found"}, 404
        satellite.name = request.json.get('name', satellite.name)
        satellite.telemetry_payload = request.json.get('telemetry_payload', satellite.telemetry_payload)
        db.session.commit()
        return {"message": "Satellite updated"}, 200

    def delete(self, satellite_id):
        satellite = Satellite.query.filter_by(satellite_id=satellite_id).first()
        if not satellite:
            return {"error": "Satellite not found"}, 404
        db.session.delete(satellite)
        db.session.commit()
        return {"message": "Satellite deleted"}, 200

api.add_resource(SatelliteAPI, '/satellites', '/satellites/<string:satellite_id>')

if __name__ == '__main__':
    app.run(debug=True)
