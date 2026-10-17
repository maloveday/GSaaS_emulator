"""GSaaS Emulator main application script.

Initializes the Flask app, database connection, and API routes.
"""

from flask import Flask
from flask_restful import Api
from flask_cors import CORS
from database import db
from satellite import SatelliteAPI
from groundstation import GroundStationAPI
from assignment import SatelliteAssignmentAPI

app = Flask(__name__)
CORS(app)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///gs_emulator.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
api = Api(app)

# Register API resources
api.add_resource(SatelliteAPI, "/satellites", "/satellites/<string:satellite_id>")
api.add_resource(GroundStationAPI, "/groundstations", "/groundstations/<string:ground_station_id>")
api.add_resource(SatelliteAssignmentAPI, "/assignments", "/assignments/<string:satellite_id>")

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)