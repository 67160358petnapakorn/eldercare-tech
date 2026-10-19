from app.core.promptpay import _crc16, build_promptpay_payload


def test_promptpay_crc16_matches_known_test_vector():
    """CRC16/CCITT-FALSE reference test vector: the ASCII string
    "123456789" must checksum to 29B1 per the standard spec this
    implementation follows."""
    assert _crc16("123456789") == "29B1"


def test_promptpay_payload_contains_amount_and_currency():
    payload = build_promptpay_payload("0812345678", amount=123.45)
    assert "123.45" in payload
    assert "764" in payload  # THB currency code
    assert payload.startswith("000201")  # payload format indicator + dynamic QR


def test_promptpay_payload_static_when_amount_omitted():
    payload = build_promptpay_payload("0812345678")
    assert "5802TH" in payload  # no amount tag (54) inserted before country code


def _setup_booking(client, register_and_login):
    headers_family, _ = register_and_login(email="payfamily@example.com", role="family")
    headers_caregiver, _ = register_and_login(email="paycaregiver@example.com", role="caregiver")

    elder = client.post(
        "/api/elders", headers=headers_family, json={"first_name": "Pay", "last_name": "Elder"}
    ).json()
    caregiver = client.post(
        "/api/caregivers", headers=headers_caregiver, json={"name": "Pay Caregiver", "hourly_rate": 300}
    ).json()
    booking = client.post(
        "/api/bookings",
        headers=headers_family,
        json={
            "elder_id": elder["id"],
            "caregiver_id": caregiver["id"],
            "date": "2026-01-01",
            "start_time": "09:00",
            "end_time": "13:00",
            "service_type": "elder_care",
        },
    ).json()
    return headers_family, headers_caregiver, booking


def test_create_payment_computes_amount_from_hourly_rate_and_duration(client, register_and_login):
    headers_family, _, booking = _setup_booking(client, register_and_login)

    resp = client.post(f"/api/bookings/{booking['id']}/payment", headers=headers_family)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    # 300/hr * 4 hours (09:00-13:00)
    assert data["amount"] == 1200.0
    assert data["status"] == "pending"
    assert data["qr_image"].startswith("data:image/png;base64,")


def test_caregiver_cannot_create_payment_for_own_booking(client, register_and_login):
    """The caregiver is the payee, not the payer — only family or admin
    may create/confirm a payment."""
    _, headers_caregiver, booking = _setup_booking(client, register_and_login)

    resp = client.post(f"/api/bookings/{booking['id']}/payment", headers=headers_caregiver)
    assert resp.status_code == 403


def test_caregiver_can_read_but_not_confirm_payment(client, register_and_login):
    headers_family, headers_caregiver, booking = _setup_booking(client, register_and_login)
    payment = client.post(f"/api/bookings/{booking['id']}/payment", headers=headers_family).json()

    read_resp = client.get(f"/api/bookings/{booking['id']}/payment", headers=headers_caregiver)
    assert read_resp.status_code == 200

    confirm_resp = client.post(f"/api/payments/{payment['id']}/confirm", headers=headers_caregiver)
    assert confirm_resp.status_code == 403


def test_family_can_confirm_payment_and_double_confirm_fails(client, register_and_login):
    headers_family, _, booking = _setup_booking(client, register_and_login)
    payment = client.post(f"/api/bookings/{booking['id']}/payment", headers=headers_family).json()

    confirm_resp = client.post(f"/api/payments/{payment['id']}/confirm", headers=headers_family)
    assert confirm_resp.status_code == 200
    assert confirm_resp.json()["status"] == "paid"

    second_confirm = client.post(f"/api/payments/{payment['id']}/confirm", headers=headers_family)
    assert second_confirm.status_code == 409


def test_creating_payment_twice_returns_existing_pending_payment(client, register_and_login):
    headers_family, _, booking = _setup_booking(client, register_and_login)
    first = client.post(f"/api/bookings/{booking['id']}/payment", headers=headers_family).json()
    second = client.post(f"/api/bookings/{booking['id']}/payment", headers=headers_family).json()
    assert first["id"] == second["id"]
