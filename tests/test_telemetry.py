import pytest

from conftest import minutes_from_now


TELEMETRY = {"battery": 92, "temperature": -12.5, "mode": "NOMINAL"}


@pytest.fixture()
def pair(client, make_satellite, make_ground_station):
    make_satellite("SAT-1", "Sentinel")
    make_ground_station("GS-1", "Svalbard")
    client.put("/satellites/SAT-1", json={"telemetry_payload": TELEMETRY})
    return "SAT-1", "GS-1"


def schedule_pass(client, start_offset_minutes, end_offset_minutes):
    response = client.post(
        "/passes",
        json={
            "satellite_id": "SAT-1",
            "ground_station_id": "GS-1",
            "start_time": minutes_from_now(start_offset_minutes),
            "end_time": minutes_from_now(end_offset_minutes),
        },
    )
    assert response.status_code == 201
    return response.get_json()


class TestNotFound:
    def test_unknown_satellite_returns_404(self, client, make_ground_station):
        make_ground_station("GS-1")
        assert client.get("/telemetry/NOPE/GS-1").status_code == 404

    def test_unknown_ground_station_returns_404(self, client, make_satellite):
        make_satellite("SAT-1")
        assert client.get("/telemetry/SAT-1/NOPE").status_code == 404


class TestActivePass:
    def test_telemetry_available_during_active_pass(self, client, pair):
        active = schedule_pass(client, -15, 15)
        response = client.get("/telemetry/SAT-1/GS-1")
        assert response.status_code == 200
        body = response.get_json()
        assert body["telemetry"] == TELEMETRY
        assert body["pass_id"] == active["pass_id"]
        assert body["satellite_name"] == "Sentinel"
        assert body["ground_station_name"] == "Svalbard"

    def test_empty_telemetry_payload_returns_empty_object(
        self, client, make_satellite, make_ground_station
    ):
        make_satellite("SAT-1")
        make_ground_station("GS-1")
        schedule_pass(client, -15, 15)
        response = client.get("/telemetry/SAT-1/GS-1")
        assert response.status_code == 200
        assert response.get_json()["telemetry"] == {}

    def test_pass_with_other_station_does_not_grant_access(
        self, client, pair, make_ground_station
    ):
        make_ground_station("GS-2")
        # Active pass exists, but with GS-2 — telemetry via GS-1 must be gated
        response = client.post(
            "/passes",
            json={
                "satellite_id": "SAT-1",
                "ground_station_id": "GS-2",
                "start_time": minutes_from_now(-15),
                "end_time": minutes_from_now(15),
            },
        )
        assert response.status_code == 201
        assert client.get("/telemetry/SAT-1/GS-1").status_code == 503


class TestOutsidePassWindow:
    def test_no_passes_returns_503_without_retry_after(self, client, pair):
        response = client.get("/telemetry/SAT-1/GS-1")
        assert response.status_code == 503
        assert "Retry-After" not in response.headers
        assert "next_pass_id" not in response.get_json()

    def test_upcoming_pass_returns_503_with_retry_after(self, client, pair):
        upcoming = schedule_pass(client, 30, 60)
        response = client.get("/telemetry/SAT-1/GS-1")
        assert response.status_code == 503
        body = response.get_json()
        assert body["next_pass_id"] == upcoming["pass_id"]
        assert body["next_pass_start"] == upcoming["start_time"]
        # Roughly 30 minutes out, allowing slack for test runtime
        assert 0 < int(response.headers["Retry-After"]) <= 30 * 60

    def test_earliest_upcoming_pass_is_reported(self, client, pair):
        schedule_pass(client, 120, 150)
        soonest = schedule_pass(client, 30, 60)
        body = client.get("/telemetry/SAT-1/GS-1").get_json()
        assert body["next_pass_id"] == soonest["pass_id"]

    def test_completed_pass_does_not_grant_access(self, client, pair):
        schedule_pass(client, -90, -60)
        assert client.get("/telemetry/SAT-1/GS-1").status_code == 503

    def test_cancelled_pass_does_not_grant_access(self, client, pair):
        active = schedule_pass(client, -15, 15)
        client.delete(f"/passes/{active['pass_id']}")
        response = client.get("/telemetry/SAT-1/GS-1")
        assert response.status_code == 503

    def test_cancelled_future_pass_is_not_reported_as_next(self, client, pair):
        upcoming = schedule_pass(client, 30, 60)
        client.delete(f"/passes/{upcoming['pass_id']}")
        response = client.get("/telemetry/SAT-1/GS-1")
        assert response.status_code == 503
        assert "next_pass_id" not in response.get_json()

    @pytest.mark.xfail(
        reason="A next pass stored with a timezone-naive start_time makes the "
        "Retry-After computation subtract an aware datetime from a naive one, "
        "raising TypeError and returning an unhandled 500",
        strict=True,
    )
    def test_naive_next_pass_timestamp_does_not_crash(self, client, pair):
        from datetime import datetime, timedelta

        naive_start = (datetime.utcnow() + timedelta(minutes=30)).isoformat()
        naive_end = (datetime.utcnow() + timedelta(minutes=60)).isoformat()
        response = client.post(
            "/passes",
            json={
                "satellite_id": "SAT-1",
                "ground_station_id": "GS-1",
                "start_time": naive_start,
                "end_time": naive_end,
            },
        )
        assert response.status_code == 201
        assert client.get("/telemetry/SAT-1/GS-1").status_code == 503
