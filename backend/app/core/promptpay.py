"""PromptPay QR payload generation per the Thai Bankers' Association / Bank
of Thailand EMV QR Code spec. Pure-Python, no external API or merchant
account needed to *generate* a technically valid QR — any Thai banking app
can scan it. This project has no real settlement access, so the "payment
confirmed" step is a simulated button (see routers/payments.py), not a
verified bank webhook.
"""

import base64
import io

import qrcode

_PROMPTPAY_AID = "A000000677010111"


def _tlv(tag: str, value: str) -> str:
    return f"{tag}{len(value):02d}{value}"


def _crc16(payload: str) -> str:
    poly = 0x1021
    crc = 0xFFFF
    for byte in payload.encode("utf-8"):
        crc ^= byte << 8
        for _ in range(8):
            crc = ((crc << 1) ^ poly) & 0xFFFF if crc & 0x8000 else (crc << 1) & 0xFFFF
    return f"{crc:04X}"


def _normalize_target(promptpay_id: str) -> tuple[str, str]:
    target = promptpay_id.strip().replace("-", "").replace(" ", "")
    if len(target) <= 10:
        # mobile number -> country code 66 + number without the leading 0,
        # left-padded to 13 digits total (BOT spec)
        if target.startswith("0"):
            target = target[1:]
        target = "0066" + target
        return "01", target
    # 13-digit citizen ID / tax ID
    return "02", target


def build_promptpay_payload(promptpay_id: str, amount: float | None = None) -> str:
    tag, target = _normalize_target(promptpay_id)
    merchant_info = _tlv("00", _PROMPTPAY_AID) + _tlv(tag, target)

    payload = (
        _tlv("00", "01")  # Payload Format Indicator
        + _tlv("01", "12" if amount is not None else "11")  # Point of Initiation: dynamic/static
        + _tlv("29", merchant_info)  # Merchant Account Info — PromptPay
        + _tlv("53", "764")  # Currency: THB
    )
    if amount is not None:
        payload += _tlv("54", f"{amount:.2f}")
    payload += _tlv("58", "TH")  # Country code
    payload += "6304"  # CRC tag + fixed length, value appended below
    return payload + _crc16(payload)


def qr_payload_to_png_data_uri(payload: str) -> str:
    img = qrcode.make(payload, box_size=8, border=2)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"
