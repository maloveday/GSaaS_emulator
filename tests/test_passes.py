import pytest

from conftest import minutes_from_now, utc_now


class TestSchedulePass:
    def test_schedule_returns_201_with_pass_details(self, client, make_pass):
        result = make_pass(start_offset_minutes=60, end_offset_minutes=90)
        assert result["satellite_id"] == "SAT-1"
        assert result["ground_station_id"] == "GS-1"
        assert result["status"] == "SCHEDULED"
        assert result["pass_id"]

    def test_missing_fields_return_400(self, client):
        response = client.post(
            "/passes", json={"satellite_id": "SAT-1", "ground_station_id": "GS-1"}
        )
        assert response.status_code == 400

    def test_end_before_start_returns_400(self, client):
        response = client.post(
            "/passes",
            json={
                "satellite_id": "SAT-1",
                "ground_station_id": "GS-1",
                "start_time": minutes_from_now(90),
                "end_time": minutes_from_now(60),
            },
        )
        assert response.status_code == 400

    def test_zero_length_pass_returns_400(self, client):
        instant = minutes_from_now(60)
        response = client.post(
            "/passes",
            json={
                "satellite_id": "SAT-1",
                "ground_station_id": "GS-1",
                "start_time": instant,
                "end_time": instant,
            },
        )
        assert response.status_code == 400

    @pytest.mark.xfail(
        reason="Passes referencing nonexistent satellites/stations are currently "
        "accepted because SQLite does not enforce foreign keys by default",
        strict=True,
    )
    def test_pass_for_nonexistent_entities_is_rejected(self, client):
        response = client.post(
            "/passes",
            json={
                "satellite_id": "GHOST-SAT",
                "ground_station_id": "GHOST-GS",
                "start_time": minutes_from_now(60),
                "end_time": minutes_from_now(90),
            },
        )
        assert response.status_code in (400, 404)

    @pytest.mark.xfail(
        reason="Nothing prevents two overlapping passes on the same ground "
        "station; the emulator should reject scheduling conflicts",
        strict=True,
    )
    def test_overlapping_passes_on_same_station_are_rejected(self, client, make_pass):
        make_pass(start_offset_minutes=60, end_offset_minutes=90)
        response = client.post(
            "/passes",
            json={
                "satellite_id": "SAT-1",
                "ground_station_id": "GS-1",
                "start_time": minutes_from_now(75),
                "end_time": minutes_from_now(105),
            },
        )
        assert response.status_code == 409


class TestGetPasses:
    def test_empty_list(self, client):
        response = client.get("/passes")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_get_by_pass_id(self, client, make_pass):
        created = make_pass()
        response = client.get(f"/passes/{created['pass_id']}")
        assert response.status_code == 200
        assert response.get_json() == created

    def test_unknown_pass_returns_404(self, client):
        assert client.get("/passes/NOPE").status_code == 404

    def test_list_is_ordered_by_start_time(self, client, make_pass):
        later = make_pass(start_offset_minutes=120, end_offset_minutes=150)
        earlier = make_pass(
            start_offset_minutes=30, end_offset_minutes=45, create_entities=False
        )
        listed = client.get("/passes").get_json()
        assert [p["pass_id"] for p in listed] == [
            earlier["pass_id"],
            later["pass_id"],
        ]


class TestLiveStatus:
    """The reported status is computed from wall-clock UTC time on every read."""

    def test_future_pass_is_scheduled(self, client, make_pass):
        created = make_pass(start_offset_minutes=60, end_offset_minutes=90)
        assert (
            client.get(f"/passes/{created['pass_id']}").get_json()["status"]
            == "SCHEDULED"
        )

    def test_pass_spanning_now_is_in_progress(self, client, make_pass):
        created = make_pass(start_offset_minutes=-15, end_offset_minutes=15)
        assert (
            client.get(f"/passes/{created['pass_id']}").get_json()["status"]
            == "IN_PROGRESS"
        )

    def test_past_pass_is_completed(self, client, make_pass):
        created = make_pass(start_offset_minutes=-90, end_offset_minutes=-60)
        assert (
            client.get(f"/passes/{created['pass_id']}").get_json()["status"]
            == "COMPLETED"
        )

    @pytest.mark.xfail(
        reason="Pass times are compared as strings, so a non-UTC offset "
        "(e.g. +02:00) is misordered against the Z-suffixed clock string and "
        "the status is computed incorrectly",
        strict=True,
    )
    def test_non_utc_offset_timestamps_are_handled(
        self, client, make_satellite, make_ground_station
    ):
        from datetime import timedelta, timezone as tz

        make_satellite("SAT-1")
        make_ground_station("GS-1")
        plus_two = tz(timedelta(hours=2))
        # Ended an hour ago in real terms, but expressed in a +02:00 offset the
        # timestamp string sorts *after* the current Z-suffixed clock string.
        start = (utc_now() - timedelta(hours=2)).astimezone(plus_two)
        end = (utc_now() - timedelta(hours=1)).astimezone(plus_two)
        response = client.post(
            "/passes",
            json={
                "satellite_id": "SAT-1",
                "ground_station_id": "GS-1",
                "start_time": start.isoformat(),
                "end_time": end.isoformat(),
            },
        )
        assert response.status_code == 201
        assert response.get_json()["status"] == "COMPLETED"


class TestCancelPass:
    def test_cancel_scheduled_pass(self, client, make_pass):
        created = make_pass(start_offset_minutes=60, end_offset_minutes=90)
        response = client.delete(f"/passes/{created['pass_id']}")
        assert response.status_code == 200
        assert (
            client.get(f"/passes/{created['pass_id']}").get_json()["status"]
            == "CANCELLED"
        )

    def test_cancel_in_progress_pass(self, client, make_pass):
        created = make_pass(start_offset_minutes=-15, end_offset_minutes=15)
        assert client.delete(f"/passes/{created['pass_id']}").status_code == 200

    def test_cancelled_pass_stays_cancelled_inside_window(self, client, make_pass):
        created = make_pass(start_offset_minutes=-15, end_offset_minutes=15)
        client.delete(f"/passes/{created['pass_id']}")
        assert (
            client.get(f"/passes/{created['pass_id']}").get_json()["status"]
            == "CANCELLED"
        )

    def test_cannot_cancel_completed_pass(self, client, make_pass):
        created = make_pass(start_offset_minutes=-90, end_offset_minutes=-60)
        response = client.delete(f"/passes/{created['pass_id']}")
        assert response.status_code == 400

    def test_cancel_unknown_pass_returns_404(self, client):
        assert client.delete("/passes/NOPE").status_code == 404
