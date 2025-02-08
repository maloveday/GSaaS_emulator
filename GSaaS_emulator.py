from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api, Resource
from flask_cors import CORS  # Import CORS

app = Flask(__name__)
CORS(app)  # Allow all origins (for development)
# CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})  # More secure approach

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

# ✅ Ensure data commits properly
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
        satellites = Satellite.query.all()
        return [{"satellite_id": s.satellite_id, "name": s.name, "telemetry_payload": s.telemetry_payload} for s in satellites]

    def post(self):
        data = request.json  # Ensure JSON request is being read
        if not data.get('satellite_id') or not data.get('name'):
            return {"error": "Satellite ID and Name are required"}, 400

        satellite = Satellite(
            satellite_id=data['satellite_id'],
            name=data['name'],
            telemetry_payload={}
        )
        
        try:
            db.session.add(satellite)
            db.session.commit()
            return {"message": "Satellite created successfully"}, 201
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500
        
    def put(self, satellite_id):
        satellite = Satellite.query.filter_by(satellite_id=satellite_id).first()
        if not satellite:
            return {"error": "Satellite not found"}, 404

        try:
            data = request.json
            satellite.telemetry_payload = data.get("telemetry_payload", satellite.telemetry_payload)
            db.session.commit()
            return {"message": "Telemetry updated successfully"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

api.add_resource(SatelliteAPI, '/satellites', '/satellites/<string:satellite_id>')

if __name__ == '__main__':
    app.run(debug=True)
