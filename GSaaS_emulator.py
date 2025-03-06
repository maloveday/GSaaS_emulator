from flask import Flask
from flask_restful import Api
from flask_cors import CORS
from database import db  # ✅ Import the shared database instance

app = Flask(__name__)
CORS(app)

# Configure database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///gs_emulator.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)  # ✅ Register db with Flask

# Import resources AFTER initializing Flask app to avoid circular imports
from satellite import SatelliteAPI
from groundstation import GroundStationAPI

api = Api(app)

# ✅ Ensure GET, POST, PUT, DELETE are registered correctly
api.add_resource(SatelliteAPI, "/satellites", "/satellites/<string:satellite_id>")
api.add_resource(GroundStationAPI, "/groundstations", "/groundstations/<string:ground_station_id>")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # ✅ Ensure tables are created
    app.run(debug=True)
