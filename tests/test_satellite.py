import pytest


class TestCreateSatellite:
    def test_create_returns_201(self, client):
        response = client.post(
            "/satellites", json={"satellite_id": "SAT-1", "name": "Sentinel"}
        )
        assert response.status_code == 201
        assert response.get_json() == {"message": "Satellite created successfully"}

    def test_created_satellite_is_retrievable(self, client, make_satellite):
        make_satellite("SAT-1", "Sentinel")
        response = client.get("/satellites/SAT-1")
        assert response.status_code == 200
        assert response.get_json() == {
            "satellite_id": "SAT-1",
            "name": "Sentinel",
            "telemetry_payload": {},
        }

    def test_missing_satellite_id_returns_400(self, client):
        response = client.post("/satellites", json={"name": "Sentinel"})
        assert response.status_code == 400

    def test_missing_name_returns_400(self, client):
        response = client.post("/satellites", json={"satellite_id": "SAT-1"})
        assert response.status_code == 400

    @pytest.mark.xfail(
        reason="Duplicate satellite_id currently returns 500 with a raw SQLAlchemy "
        "error string; the API should return 409 Conflict",
        strict=True,
    )
    def test_duplicate_satellite_id_returns_409(self, client, make_satellite):
        make_satellite("SAT-1")
        response = client.post(
            "/satellites", json={"satellite_id": "SAT-1", "name": "Duplicate"}
        )
        assert response.status_code == 409

    @pytest.mark.xfail(
        reason="A POST without a JSON body currently raises an unhandled error "
        "instead of returning a clean 400",
        strict=True,
    )
    def test_post_without_json_body_returns_400(self, client):
        response = client.post("/satellites", data="not json")
        assert response.status_code == 400


class TestGetSatellites:
    def test_empty_list(self, client):
        response = client.get("/satellites")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_lists_all_satellites(self, client, make_satellite):
        make_satellite("SAT-1", "Alpha")
        make_satellite("SAT-2", "Beta")
        response = client.get("/satellites")
        assert response.status_code == 200
        ids = {sat["satellite_id"] for sat in response.get_json()}
        assert ids == {"SAT-1", "SAT-2"}

    def test_unknown_satellite_returns_404(self, client):
        response = client.get("/satellites/NOPE")
        assert response.status_code == 404
        assert "error" in response.get_json()


class TestUpdateTelemetry:
    def test_put_updates_telemetry_payload(self, client, make_satellite):
        make_satellite("SAT-1")
        payload = {"battery": 87, "mode": "NOMINAL"}
        response = client.put(
            "/satellites/SAT-1", json={"telemetry_payload": payload}
        )
        assert response.status_code == 200
        assert client.get("/satellites/SAT-1").get_json()["telemetry_payload"] == payload

    def test_put_unknown_satellite_returns_404(self, client):
        response = client.put(
            "/satellites/NOPE", json={"telemetry_payload": {"x": 1}}
        )
        assert response.status_code == 404

    def test_put_without_telemetry_payload_returns_400(self, client, make_satellite):
        make_satellite("SAT-1")
        response = client.put("/satellites/SAT-1", json={"other": "field"})
        assert response.status_code == 400


class TestDeleteSatellite:
    def test_delete_removes_satellite(self, client, make_satellite):
        make_satellite("SAT-1")
        response = client.delete("/satellites/SAT-1")
        assert response.status_code == 200
        assert client.get("/satellites/SAT-1").status_code == 404

    def test_delete_unknown_satellite_returns_404(self, client):
        response = client.delete("/satellites/NOPE")
        assert response.status_code == 404

    @pytest.mark.xfail(
        reason="Deleting a satellite currently leaves its assignments dangling; "
        "deletes should cascade or be rejected while assignments exist",
        strict=True,
    )
    def test_delete_cascades_assignments(
        self, client, make_satellite, make_ground_station
    ):
        make_satellite("SAT-1")
        make_ground_station("GS-1")
        client.post(
            "/assignments", json={"satellite_id": "SAT-1", "ground_station_id": "GS-1"}
        )
        client.delete("/satellites/SAT-1")
        assert client.get("/assignments/SAT-1").get_json() == []
