def test_register_rejects_admin_role(client):
    """Regression test for a real vulnerability that was found and fixed:
    self-registration used to accept role="admin" with zero checks, letting
    anyone create a working admin account. The allowlist must stay
    restricted to the roles actually offered on the public form."""
    resp = client.post(
        "/api/auth/register",
        json={
            "username": "wannabe_admin",
            "email": "wannabe_admin@example.com",
            "password": "123456",
            "first_name": "Would",
            "last_name": "BeAdmin",
            "role": "admin",
        },
    )
    assert resp.status_code == 422


def test_register_rejects_partner_role(client):
    resp = client.post(
        "/api/auth/register",
        json={
            "username": "sneaky_partner",
            "email": "sneaky_partner@example.com",
            "password": "123456",
            "first_name": "Sneaky",
            "last_name": "Partner",
            "role": "partner",
        },
    )
    assert resp.status_code == 422


def test_register_accepts_family_caregiver_nurse(client):
    for role in ["family", "caregiver", "nurse"]:
        resp = client.post(
            "/api/auth/register",
            json={
                "username": f"user_{role}",
                "email": f"user_{role}@example.com",
                "password": "123456",
                "first_name": "Test",
                "last_name": role,
                "role": role,
            },
        )
        assert resp.status_code == 201, resp.text
        assert resp.json()["role"] == role


def test_register_duplicate_email_conflicts(client, register_and_login):
    payload = {
        "username": "first_user",
        "email": "dup@example.com",
        "password": "123456",
        "first_name": "First",
        "last_name": "User",
        "role": "family",
    }
    assert client.post("/api/auth/register", json=payload).status_code == 201

    payload["username"] = "second_user"
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 409


def test_login_wrong_password_returns_401(client, register_and_login):
    register_and_login(email="loginuser@example.com")
    resp = client.post("/api/auth/login", json={"email": "loginuser@example.com", "password": "wrong-pass"})
    assert resp.status_code == 401


def test_login_returns_access_and_refresh_token(client, register_and_login):
    _, tokens = register_and_login(email="tokenuser@example.com")
    assert tokens["access_token"]
    assert tokens["refresh_token"]
    assert tokens["token_type"] == "bearer"


def test_me_requires_bearer_token(client, register_and_login):
    assert client.get("/api/auth/me").status_code in (401, 403)


def test_me_returns_current_user(client, register_and_login):
    headers, _ = register_and_login(email="meuser@example.com")
    resp = client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "meuser@example.com"


def test_refresh_token_rotates_and_old_token_is_single_use(client, register_and_login):
    """The refresh token must be single-use: once rotated, the old raw
    token can never be redeemed again even though it hasn't expired."""
    _, tokens = register_and_login(email="rotateuser@example.com")
    old_refresh = tokens["refresh_token"]

    first_refresh = client.post("/api/auth/refresh", json={"refresh_token": old_refresh})
    assert first_refresh.status_code == 200
    new_tokens = first_refresh.json()
    assert new_tokens["refresh_token"] != old_refresh

    replay = client.post("/api/auth/refresh", json={"refresh_token": old_refresh})
    assert replay.status_code == 401

    second_refresh = client.post("/api/auth/refresh", json={"refresh_token": new_tokens["refresh_token"]})
    assert second_refresh.status_code == 200


def test_refresh_with_garbage_token_returns_401(client, register_and_login):
    resp = client.post("/api/auth/refresh", json={"refresh_token": "not-a-real-token"})
    assert resp.status_code == 401


def test_logout_revokes_refresh_token(client, register_and_login):
    _, tokens = register_and_login(email="logoutuser@example.com")
    logout_resp = client.post("/api/auth/logout", json={"refresh_token": tokens["refresh_token"]})
    assert logout_resp.status_code == 200

    refresh_resp = client.post("/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert refresh_resp.status_code == 401


def test_change_password_requires_correct_current_password(client, register_and_login):
    headers, _ = register_and_login(email="pwuser@example.com")
    resp = client.post(
        "/api/auth/change-password",
        headers=headers,
        json={"current_password": "wrong", "new_password": "newpassword123"},
    )
    assert resp.status_code == 400


def test_change_password_success_then_old_password_rejected(client, register_and_login):
    headers, _ = register_and_login(email="pwuser2@example.com")
    resp = client.post(
        "/api/auth/change-password",
        headers=headers,
        json={"current_password": "123456", "new_password": "newpassword123"},
    )
    assert resp.status_code == 200

    old_login = client.post("/api/auth/login", json={"email": "pwuser2@example.com", "password": "123456"})
    assert old_login.status_code == 401

    new_login = client.post("/api/auth/login", json={"email": "pwuser2@example.com", "password": "newpassword123"})
    assert new_login.status_code == 200
