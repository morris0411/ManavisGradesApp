import io

import pytest


@pytest.fixture(scope="session")
def app_with_imports_bp(app):
    # conftest の最小 app に imports blueprint だけ足す（create_app は DATABASE_URL が必要なため使わない）
    from flaskr.routes.imports import imports_bp

    if "imports" not in app.blueprints:
        app.register_blueprint(imports_bp, url_prefix="/api")
    return app


@pytest.fixture
def client(app_with_imports_bp, session):
    # session fixture でDBを毎回クリーンにしてから client を使う
    return app_with_imports_bp.test_client()


def test_import_students_400_when_no_file(client):
    res = client.post("/api/imports/students")
    assert res.status_code == 400
    assert res.get_json()["error"] == "file がありません"


def test_import_exams_xlsx_400_when_no_file(client):
    res = client.post("/api/imports/exams_xlsx")
    assert res.status_code == 400
    assert res.get_json()["error"] == "file がありません"


def test_import_students_200_when_ok(client, monkeypatch):
    from flaskr.services import import_service

    monkeypatch.setattr(
        import_service,
        "import_students_from_csv",
        lambda _file: {"inserted": 1, "updated": 0, "skipped": 0, "total_in_file": 1},
    )
    data = {"file": (io.BytesIO(b"dummy"), "students.csv")}
    res = client.post("/api/imports/students", data=data, content_type="multipart/form-data")
    assert res.status_code == 200
    body = res.get_json()
    assert body["ok"] is True
    assert body["inserted"] == 1
    assert body["marked_resigned"] is True


def test_import_exams_xlsx_200_when_ok(client, monkeypatch):
    from flaskr.services import import_service

    monkeypatch.setattr(
        import_service,
        "import_exams_from_xlsx",
        lambda _file: {"inserted": {"exams": 0}, "skipped_students": 0},
    )
    data = {"file": (io.BytesIO(b"dummy"), "exams.xlsx")}
    res = client.post("/api/imports/exams_xlsx", data=data, content_type="multipart/form-data")
    assert res.status_code == 200
    body = res.get_json()
    assert body["ok"] is True
    assert body["inserted"] == {"exams": 0}


def test_academic_year_status_200(client, monkeypatch):
    from flaskr.services import academic_year_service

    monkeypatch.setattr(academic_year_service, "get_academic_year", lambda: 2025)
    monkeypatch.setattr(academic_year_service, "get_last_update_year", lambda: 2024)
    monkeypatch.setattr(academic_year_service, "can_update_academic_year", lambda: (True, None))

    res = client.get("/api/imports/academic_year_status")
    assert res.status_code == 200
    body = res.get_json()
    assert body["current_academic_year"] == 2025
    assert body["last_update_year"] == 2024
    assert body["can_update"] is True
    assert body["error_message"] is None
    assert "last_update_datetime" in body


def test_update_academic_year_200(client, monkeypatch):
    from flaskr.services import academic_year_service

    monkeypatch.setattr(
        academic_year_service,
        "execute_academic_year_update",
        lambda: {"updated": 2, "graduated": 1, "academic_year": 2025},
    )
    res = client.post("/api/imports/update_academic_year")
    assert res.status_code == 200
    body = res.get_json()
    assert body["ok"] is True
    assert body["updated"] == 2
    assert "message" in body


def test_404_for_unknown_route(client):
    res = client.get("/api/does_not_exist")
    assert res.status_code == 404


