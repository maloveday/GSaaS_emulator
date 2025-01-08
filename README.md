# GSaaS_emulator

A python 3 script that emulated the AWS Ground Station as a Service API.

## Mock AWS Ground Station as a Service (GSaaS) API

To emulate the AWS Ground Station as a Service (GSaaS) API, we'll create a mock server using Python's Flask library. This server will mimic the basic endpoints and functionalities of the Ground Station API, such as:

- Listing satellites
- Listing ground stations
- Scheduling a contact
- Retrieving contact status

This mock API will be useful for testing purposes, though it won’t interact with real satellites or ground stations. Instead, it will store and return dummy data to simulate the behavior of the actual AWS Ground Station API.

## Prerequisites

1. Install Flask:

   ```bash
   pip install Flask

2. Install Flask-RESTful (for simpler REST API implementation):

   ```bash
   pip install Flask-RESTful

## Explanation of Endpoints

1. /satellites (GET): Returns a list of available satellites in JSON format.
2. /groundstations (GET): Returns a list of available ground stations in JSON format.
3. /schedulecontact (POST): Accepts a JSON payload with satelliteId, groundStationId, startTime, and endTime to schedule a contact. It validates the IDs, generates a unique contactId, and stores the contact information in memory.
4. /contactstatus/<contact_id> (GET): Retrieves the status of a contact by contactId. It updates the status to "IN_PROGRESS" if the current time is within the contact duration or to "COMPLETED" if the end time has passed.

## Testing the Mock API

1. Start the server by running the script:

   ```bash
   python <script_name>.py

2. Test the endpoints using curl or Postman:

- List satellites: GET http://127.0.0.1:5000/satellites
- List ground stations: GET http://127.0.0.1:5000/groundstations
- Schedule a contact: POST http://127.0.0.1:5000/schedulecontact
- Get contact status: GET http://127.0.0.1:5000/contactstatus/<contact_id>

Note: schedulecontact.json has example data for POST

## Important Notes

- Data Persistence: This mock server uses an in-memory dictionary for simplicity. Restarting the server will clear all data.
- Time-based Status Simulation: The GetContactStatus endpoint updates the contact status based on the current time relative to the scheduled start and end times, simulating real-world contact progression.
- Extendability: You can add more endpoints or improve functionality, such as validation, error handling, and logging, to make this emulation more robust.
