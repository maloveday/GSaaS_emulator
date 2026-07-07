from flask import Flask
from flask_restful import Api
from flask_cors import CORS
from database import db


def create_app(database_uri="sqlite:///gs_emulator.db"):
    """Application factory so tests can build an app against their own database."""
    app = Flask(__name__)
    CORS(app)

    app.config["SQLALCHEMY_DATABASE_URI"] = database_uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    # Import resources after initialising the app to avoid circular imports
    from satellite import SatelliteAPI
    from groundstation import GroundStationAPI
    from assignment import SatelliteAssignmentAPI
    from passes import SatellitePassAPI
    from telemetry import TelemetryAPI

    api = Api(app)

    api.add_resource(SatelliteAPI, "/satellites", "/satellites/<string:satellite_id>")
    api.add_resource(GroundStationAPI, "/groundstations", "/groundstations/<string:ground_station_id>")
    api.add_resource(SatelliteAssignmentAPI, "/assignments", "/assignments/<string:satellite_id>")
    api.add_resource(SatellitePassAPI, "/passes", "/passes/<string:pass_id>")
    api.add_resource(
        TelemetryAPI,
        "/telemetry/<string:satellite_id>/<string:ground_station_id>",
    )

    return app


app = create_app()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
