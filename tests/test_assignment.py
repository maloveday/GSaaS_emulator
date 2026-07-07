import pytest


@pytest.fixture()
def assigned_pair(client, make_satellite, make_ground_station):
    make_satellite("SAT-1")
    make_ground_station("GS-1")
    response = client.post(
        "/assignments", json={"satellite_id": "SAT-1", "ground_station_id": "GS-1"}
    )
    assert response.status_code == 201
    return "SAT-1", "GS-1"


class TestCreateAssignment:
    def test_assign_returns_201(self, client, make_satellite, make_ground_station):
        make_satellite("SAT-1")
        make_ground_station("GS-1")
        response = client.post(
            "/assignments", json={"satellite_id": "SAT-1", "ground_station_id": "GS-1"}
        )
        assert response.status_code == 201

    def test_duplicate_assignment_is_idempotent(self, client, assigned_pair):
        satellite_id, ground_station_id = assigned_pair
        response = client.post(
            "/assignments",
            json={"satellite_id": satellite_id, "ground_station_id": ground_station_id},
        )
        assert response.status_code == 200
        assert response.get_json() == {"message": "Already assigned"}
        # Still only one assignment on record
        assert len(client.get("/assignments").get_json()) == 1

    def test_missing_fields_return_400(self, client):
        assert client.post("/assignments", json={"satellite_id": "SAT-1"}).status_code == 400
        assert (
            client.post("/assignments", json={"ground_station_id": "GS-1"}).status_code
            == 400
        )

    @pytest.mark.xfail(
        reason="Assignments referencing nonexistent satellites/stations are "
        "currently accepted because SQLite does not enforce foreign keys by "
        "default; the API should validate both entities exist",
        strict=True,
    )
    def test_assignment_to_nonexistent_entities_is_rejected(self, client):
        response = client.post(
            "/assignments",
            json={"satellite_id": "GHOST-SAT", "ground_station_id": "GHOST-GS"},
        )
        assert response.status_code in (400, 404)


class TestGetAssignments:
    def test_empty_list(self, client):
        response = client.get("/assignments")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_list_all_assignments(self, client, assigned_pair):
        response = client.get("/assignments")
        assert response.get_json() == [
            {"satellite_id": "SAT-1", "ground_station_id": "GS-1"}
        ]

    def test_filter_by_satellite(self, client, assigned_pair, make_satellite):
        make_satellite("SAT-2")
        client.post(
            "/assignments", json={"satellite_id": "SAT-2", "ground_station_id": "GS-1"}
        )
        response = client.get("/assignments/SAT-1")
        assert response.status_code == 200
        assert response.get_json() == [
            {"satellite_id": "SAT-1", "ground_station_id": "GS-1"}
        ]

    def test_filter_by_ground_station(self, client, assigned_pair, make_ground_station):
        make_ground_station("GS-2")
        client.post(
            "/assignments", json={"satellite_id": "SAT-1", "ground_station_id": "GS-2"}
        )
        response = client.get("/assignments?ground_station_id=GS-2")
        assert response.status_code == 200
        assert response.get_json() == [
            {"satellite_id": "SAT-1", "ground_station_id": "GS-2"}
        ]

    def test_filter_with_no_matches_returns_empty_list(self, client, assigned_pair):
        assert client.get("/assignments/UNKNOWN").get_json() == []
        assert client.get("/assignments?ground_station_id=UNKNOWN").get_json() == []


class TestDeleteAssignment:
    def test_unassign_removes_assignment(self, client, assigned_pair):
        satellite_id, ground_station_id = assigned_pair
        response = client.delete(
            "/assignments",
            json={"satellite_id": satellite_id, "ground_station_id": ground_station_id},
        )
        assert response.status_code == 200
        assert client.get("/assignments").get_json() == []

    def test_unassign_nonexistent_returns_404(self, client):
        response = client.delete(
            "/assignments",
            json={"satellite_id": "SAT-1", "ground_station_id": "GS-1"},
        )
        assert response.status_code == 404
