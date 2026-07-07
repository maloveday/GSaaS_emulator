from datetime import datetime, timedelta, timezone

import pytest

from GSaaS_emulator import create_app
from database import db


def iso_z(dt):
    """Format a datetime the same way the API does: ISO 8601 UTC with a Z suffix."""
    return dt.isoformat().replace("+00:00", "Z")


def utc_now():
    return datetime.now(timezone.utc)


def minutes_from_now(minutes):
    """ISO 8601 Z-suffixed timestamp offset from the current wall-clock time."""
    return iso_z(utc_now() + timedelta(minutes=minutes))


@pytest.fixture()
def app():
    app = create_app("sqlite:///:memory:")
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def make_satellite(client):
    def _make(satellite_id="SAT-1", name="Test Satellite"):
        response = client.post(
            "/satellites", json={"satellite_id": satellite_id, "name": name}
        )
        assert response.status_code == 201
        return satellite_id

    return _make


@pytest.fixture()
def make_ground_station(client):
    def _make(ground_station_id="GS-1", name="Test Ground Station"):
        response = client.post(
            "/groundstations",
            json={"ground_station_id": ground_station_id, "name": name},
        )
        assert response.status_code == 201
        return ground_station_id

    return _make


@pytest.fixture()
def make_pass(client, make_satellite, make_ground_station):
    """Schedule a pass between a satellite and ground station, creating both."""

    def _make(
        satellite_id="SAT-1",
        ground_station_id="GS-1",
        start_offset_minutes=60,
        end_offset_minutes=90,
        create_entities=True,
    ):
        if create_entities:
            make_satellite(satellite_id)
            make_ground_station(ground_station_id)
        response = client.post(
            "/passes",
            json={
                "satellite_id": satellite_id,
                "ground_station_id": ground_station_id,
                "start_time": minutes_from_now(start_offset_minutes),
                "end_time": minutes_from_now(end_offset_minutes),
            },
        )
        assert response.status_code == 201
        return response.get_json()

    return _make
