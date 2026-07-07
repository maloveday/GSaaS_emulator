import pytest


class TestCreateGroundStation:
    def test_create_returns_201(self, client):
        response = client.post(
            "/groundstations", json={"ground_station_id": "GS-1", "name": "Svalbard"}
        )
        assert response.status_code == 201

    def test_created_station_is_retrievable(self, client, make_ground_station):
        make_ground_station("GS-1", "Svalbard")
        response = client.get("/groundstations/GS-1")
        assert response.status_code == 200
        assert response.get_json() == {
            "ground_station_id": "GS-1",
            "name": "Svalbard",
            "telemetry_payload": {},
        }

    def test_missing_fields_return_400(self, client):
        assert client.post("/groundstations", json={"name": "Svalbard"}).status_code == 400
        assert (
            client.post("/groundstations", json={"ground_station_id": "GS-1"}).status_code
            == 400
        )

    @pytest.mark.xfail(
        reason="Duplicate ground_station_id currently returns 500 with a raw "
        "SQLAlchemy error string; the API should return 409 Conflict",
        strict=True,
    )
    def test_duplicate_ground_station_id_returns_409(self, client, make_ground_station):
        make_ground_station("GS-1")
        response = client.post(
            "/groundstations", json={"ground_station_id": "GS-1", "name": "Duplicate"}
        )
        assert response.status_code == 409


class TestGetGroundStations:
    def test_empty_list(self, client):
        response = client.get("/groundstations")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_lists_all_stations(self, client, make_ground_station):
        make_ground_station("GS-1", "Svalbard")
        make_ground_station("GS-2", "Wallops")
        ids = {gs["ground_station_id"] for gs in client.get("/groundstations").get_json()}
        assert ids == {"GS-1", "GS-2"}

    def test_unknown_station_returns_404(self, client):
        assert client.get("/groundstations/NOPE").status_code == 404


class TestUpdateTelemetry:
    def test_put_updates_telemetry_payload(self, client, make_ground_station):
        make_ground_station("GS-1")
        payload = {"antenna": "S-band", "status": "TRACKING"}
        response = client.put(
            "/groundstations/GS-1", json={"telemetry_payload": payload}
        )
        assert response.status_code == 200
        assert (
            client.get("/groundstations/GS-1").get_json()["telemetry_payload"] == payload
        )

    def test_put_unknown_station_returns_404(self, client):
        response = client.put(
            "/groundstations/NOPE", json={"telemetry_payload": {"x": 1}}
        )
        assert response.status_code == 404

    def test_put_without_telemetry_payload_returns_400(self, client, make_ground_station):
        make_ground_station("GS-1")
        response = client.put("/groundstations/GS-1", json={"other": "field"})
        assert response.status_code == 400


class TestDeleteGroundStation:
    def test_delete_removes_station(self, client, make_ground_station):
        make_ground_station("GS-1")
        assert client.delete("/groundstations/GS-1").status_code == 200
        assert client.get("/groundstations/GS-1").status_code == 404

    def test_delete_unknown_station_returns_404(self, client):
        assert client.delete("/groundstations/NOPE").status_code == 404
