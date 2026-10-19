def _create_elder(client, headers, first_name="Somchai"):
    resp = client.post(
        "/api/elders",
        headers=headers,
        json={"first_name": first_name, "last_name": "Test"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def _create_caregiver_profile(client, headers, name="Caregiver One"):
    resp = client.post(
        "/api/caregivers",
        headers=headers,
        json={"name": name, "hourly_rate": 300},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_family_cannot_view_another_familys_elder(client, register_and_login):
    headers_a, _ = register_and_login(email="familyA@example.com", role="family")
    headers_b, _ = register_and_login(email="familyB@example.com", role="family")

    elder = _create_elder(client, headers_a)

    resp = client.get(f"/api/elders/{elder['id']}", headers=headers_b)
    assert resp.status_code == 403


def test_admin_can_view_any_elder(client, register_and_login, db_session):
    headers_family, _ = register_and_login(email="familyC@example.com", role="family")
    headers_admin, _ = register_and_login(email="adminC@example.com", role="family")
    # promote this user to admin directly — self-registration can never
    # grant admin (see test_auth.py), so the only way to get one is a role
    # change made out-of-band, which this simulates.
    from app.models.user import User

    user = db_session.query(User).filter(User.email == "adminC@example.com").first()
    user.role = "admin"
    db_session.commit()

    elder = _create_elder(client, headers_family)
    resp = client.get(f"/api/elders/{elder['id']}", headers=headers_admin)
    assert resp.status_code == 200


def test_elder_list_only_shows_own_elders_for_family(client, register_and_login):
    headers_a, _ = register_and_login(email="familyD@example.com", role="family")
    headers_b, _ = register_and_login(email="familyE@example.com", role="family")

    _create_elder(client, headers_a, first_name="A-Elder")
    _create_elder(client, headers_b, first_name="B-Elder")

    resp = client.get("/api/elders", headers=headers_a)
    assert resp.status_code == 200
    names = [item["first_name"] for item in resp.json()["items"]]
    assert names == ["A-Elder"]


def test_elder_photo_url_roundtrips_through_patch(client, register_and_login):
    headers, _ = register_and_login(email="familyF@example.com", role="family")
    elder = _create_elder(client, headers)
    assert elder["photo_url"] is None

    resp = client.patch(
        f"/api/elders/{elder['id']}",
        headers=headers,
        json={"photo_url": "/uploads/example.jpg"},
    )
    assert resp.status_code == 200
    assert resp.json()["photo_url"] == "/uploads/example.jpg"


def test_caregiver_directory_is_visible_to_family(client, register_and_login):
    """caregivers.py was fixed so any authenticated role can browse the
    caregiver directory (family needs this to find/book someone) — it used
    to filter the list to `Caregiver.user_id == current_user.id`, which is
    never true for family and silently returned an empty list."""
    headers_caregiver, _ = register_and_login(email="cgA@example.com", role="caregiver")
    headers_family, _ = register_and_login(email="familyG@example.com", role="family")

    _create_caregiver_profile(client, headers_caregiver)

    resp = client.get("/api/caregivers", headers=headers_family)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


def test_caregiver_documents_redacted_for_other_roles(client, register_and_login):
    headers_caregiver, _ = register_and_login(email="cgB@example.com", role="caregiver")
    headers_family, _ = register_and_login(email="familyH@example.com", role="family")

    caregiver = _create_caregiver_profile(client, headers_caregiver, name="Caregiver With Docs")
    doc_resp = client.post(
        f"/api/caregivers/{caregiver['id']}/documents",
        headers=headers_caregiver,
        params={"document_type": "id_card", "file_url": "/uploads/id.jpg"},
    )
    assert doc_resp.status_code == 200, doc_resp.text

    as_owner = client.get(f"/api/caregivers/{caregiver['id']}", headers=headers_caregiver)
    assert len(as_owner.json()["documents"]) == 1

    as_family = client.get(f"/api/caregivers/{caregiver['id']}", headers=headers_family)
    assert as_family.json()["documents"] == []


def test_caregiver_cannot_update_someone_elses_profile(client, register_and_login):
    headers_a, _ = register_and_login(email="cgC@example.com", role="caregiver")
    headers_b, _ = register_and_login(email="cgD@example.com", role="caregiver")

    caregiver = _create_caregiver_profile(client, headers_a)

    resp = client.patch(
        f"/api/caregivers/{caregiver['id']}",
        headers=headers_b,
        json={"photo_url": "/uploads/hijack.jpg"},
    )
    assert resp.status_code == 403


def test_caregiver_can_update_own_photo(client, register_and_login):
    headers, _ = register_and_login(email="cgE@example.com", role="caregiver")
    caregiver = _create_caregiver_profile(client, headers)

    resp = client.patch(
        f"/api/caregivers/{caregiver['id']}",
        headers=headers,
        json={"photo_url": "/uploads/me.jpg"},
    )
    assert resp.status_code == 200
    assert resp.json()["photo_url"] == "/uploads/me.jpg"
