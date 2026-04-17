from flask import Flask, render_template, request
from flask_restful import Api, Resource
from datetime import datetime
import uuid

app = Flask(__name__)
api = Api(app)

satellites = [
    {"satelliteId": "sat-1", "noradId": "12345", "name": "Satellite 1"},
    {"satelliteId": "sat-2", "noradId": "67890", "name": "Satellite 2"}
]

ground_stations = [
    {"groundStationId": "gs-1", "name": "Ground Station 1"},
    {"groundStationId": "gs-2", "name": "Ground Station 2"}
]

contacts = {}


@app.route("/")
def index():
    return render_template("index.html")


class ListSatellites(Resource):
    def get(self):
        return {"satellites": satellites}


class ListGroundStations(Resource):
    def get(self):
        return {"groundStations": ground_stations}


class ScheduleContact(Resource):
    def post(self):
        data = request.get_json()
        satellite_id = data.get("satelliteId")
        ground_station_id = data.get("groundStationId")
        start_time = data.get("startTime")
        end_time = data.get("endTime")

        if not any(sat["satelliteId"] == satellite_id for sat in satellites):
            return {"error": "Invalid satellite ID"}, 400
        if not any(gs["groundStationId"] == ground_station_id for gs in ground_stations):
            return {"error": "Invalid ground station ID"}, 400

        contact_id = str(uuid.uuid4())
        contacts[contact_id] = {
            "contactId": contact_id,
            "satelliteId": satellite_id,
            "groundStationId": ground_station_id,
            "startTime": start_time,
            "endTime": end_time,
            "status": "SCHEDULED"
        }
        return {"contactId": contact_id}, 201


class GetContactStatus(Resource):
    def get(self, contact_id):
        contact = contacts.get(contact_id)
        if not contact:
            return {"error": "Contact not found"}, 404

        now = datetime.utcnow().isoformat() + "Z"
        if contact["startTime"] <= now < contact["endTime"]:
            contact["status"] = "IN_PROGRESS"
        elif now >= contact["endTime"]:
            contact["status"] = "COMPLETED"

        return contact


api.add_resource(ListSatellites, "/satellites")
api.add_resource(ListGroundStations, "/groundstations")
api.add_resource(ScheduleContact, "/schedulecontact")
api.add_resource(GetContactStatus, "/contactstatus/<string:contact_id>")

if __name__ == "__main__":
    app.run(debug=True)
