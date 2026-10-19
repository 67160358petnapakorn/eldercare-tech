import base64


# Smallest possible valid 1x1 transparent PNG, used so the upload endpoint
# sees real image bytes rather than an arbitrary string.
_TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


def test_upload_requires_authentication(client, register_and_login):
    resp = client.post("/api/uploads/photo", files={"file": ("photo.png", _TINY_PNG, "image/png")})
    assert resp.status_code in (401, 403)


def test_upload_rejects_non_image_content_type(client, register_and_login):
    headers, _ = register_and_login(email="uploader1@example.com")
    resp = client.post(
        "/api/uploads/photo",
        headers=headers,
        files={"file": ("notes.txt", b"just some text", "text/plain")},
    )
    assert resp.status_code == 400


def test_upload_rejects_oversized_file(client, register_and_login):
    headers, _ = register_and_login(email="uploader2@example.com")
    oversized = b"\x00" * (5 * 1024 * 1024 + 1)
    resp = client.post(
        "/api/uploads/photo",
        headers=headers,
        files={"file": ("big.png", oversized, "image/png")},
    )
    assert resp.status_code == 400


def test_upload_accepts_valid_png_and_serves_it_back(client, register_and_login):
    headers, _ = register_and_login(email="uploader3@example.com")
    resp = client.post(
        "/api/uploads/photo",
        headers=headers,
        files={"file": ("photo.png", _TINY_PNG, "image/png")},
    )
    assert resp.status_code == 200, resp.text
    url = resp.json()["url"]
    assert url.startswith("/uploads/")
    assert url.endswith(".png")

    served = client.get(url)
    assert served.status_code == 200
    assert served.content == _TINY_PNG
