def _create_elder(client, headers, first_name="Somchai"):
    resp = client.post("/api/elders", headers=headers, json={"first_name": first_name, "last_name": "Test"})
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_export_includes_elders_and_their_health_records(client, register_and_login):
    headers, _ = register_and_login(email="exportuser@example.com", role="family")
    elder = _create_elder(client, headers)
    client.post(
        "/api/health-records",
        headers=headers,
        json={
            "elder_id": elder["id"], "heart_rate": 70, "systolic": 120, "diastolic": 80,
            "temperature": 36.5, "spo2": 98, "blood_sugar": 90, "weight": 60, "sleep_hours": 7, "activity": 3000,
        },
    )

    resp = client.get("/api/auth/me/export", headers=headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["user"]["email"] == "exportuser@example.com"
    assert len(data["elders"]) == 1
    assert data["elders"][0]["elder"]["id"] == elder["id"]
    assert len(data["elders"][0]["health_records"]) == 1
    assert data["elders"][0]["health_records"][0]["heart_rate"] == 70


def test_export_requires_authentication(client):
    assert client.get("/api/auth/me/export").status_code in (401, 403)


def test_delete_account_requires_correct_password(client, register_and_login):
    headers, _ = register_and_login(email="delwrongpw@example.com", role="family")
    resp = client.request("DELETE", "/api/auth/me", headers=headers, json={"password": "wrong-password"})
    assert resp.status_code == 400

    # account must still be usable
    login_resp = client.post("/api/auth/login", json={"email": "delwrongpw@example.com", "password": "123456"})
    assert login_resp.status_code == 200


def test_delete_account_removes_user_and_all_owned_data(client, register_and_login, db_session):
    headers, _ = register_and_login(email="deluser@example.com", role="family")
    elder = _create_elder(client, headers)
    client.post(
        "/api/health-records",
        headers=headers,
        json={
            "elder_id": elder["id"], "heart_rate": 70, "systolic": 120, "diastolic": 80,
            "temperature": 36.5, "spo2": 98, "blood_sugar": 90, "weight": 60, "sleep_hours": 7, "activity": 3000,
        },
    )

    resp = client.request("DELETE", "/api/auth/me", headers=headers, json={"password": "123456"})
    assert resp.status_code == 200, resp.text

    from app.models.elder import Elder
    from app.models.health import HealthRecord
    from app.models.user import User

    assert db_session.query(User).filter(User.email == "deluser@example.com").first() is None
    assert db_session.query(Elder).filter(Elder.id == elder["id"]).first() is None
    assert db_session.query(HealthRecord).filter(HealthRecord.elder_id == elder["id"]).count() == 0

    # the access token is now for a deleted user — must stop working
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 401

    # and the account can no longer log in
    login_resp = client.post("/api/auth/login", json={"email": "deluser@example.com", "password": "123456"})
    assert login_resp.status_code == 401


def test_delete_account_also_removes_caregiver_profile_and_bookings(client, register_and_login, db_session):
    family_headers, _ = register_and_login(email="delfamily2@example.com", role="family")
    caregiver_headers, _ = register_and_login(email="delcaregiver2@example.com", role="caregiver")

    elder = _create_elder(client, family_headers)
    caregiver = client.post(
        "/api/caregivers", headers=caregiver_headers, json={"name": "Del Caregiver", "hourly_rate": 300}
    ).json()
    booking = client.post(
        "/api/bookings",
        headers=family_headers,
        json={
            "elder_id": elder["id"], "caregiver_id": caregiver["id"], "date": "2026-01-01",
            "start_time": "09:00", "end_time": "13:00", "service_type": "elder_care",
        },
    ).json()

    resp = client.request("DELETE", "/api/auth/me", headers=caregiver_headers, json={"password": "123456"})
    assert resp.status_code == 200, resp.text

    from app.models.booking import Booking
    from app.models.caregiver import Caregiver

    assert db_session.query(Caregiver).filter(Caregiver.id == caregiver["id"]).first() is None
    assert db_session.query(Booking).filter(Booking.id == booking["id"]).first() is None
