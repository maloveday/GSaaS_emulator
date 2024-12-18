# GSaaS_emulator
A python 3 script that emulated the AWS Ground Station as a Service API.

# Mock AWS Ground Station as a Service (GSaaS) API

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
