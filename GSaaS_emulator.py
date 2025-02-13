from flask import Flask
from flask_restful import Api
from flask_cors import CORS
from satellite import db, SatelliteAPI
from groundstation import GroundStationAPI

app = Flask(__name__)
CORS(app)

# Configure database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///gs_emulator.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

api = Api(app)

# Register APIs
api.add_resource(SatelliteAPI, "/satellites", "/satellites/<string:satellite_id>")
api.add_resource(GroundStationAPI, "/groundstations", "/groundstations/<string:ground_station_id>")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
