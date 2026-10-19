from datetime import datetime, time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import can_access_booking
from app.core.promptpay import build_promptpay_payload, qr_payload_to_png_data_uri
from app.core.security import get_current_user
from app.models.booking import Booking
from app.models.caregiver import Caregiver
from app.models.elder import Elder
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import PaymentResponse

router = APIRouter(prefix="/api", tags=["Payments"])


def _can_pay(current_user: User, booking: Booking, db: Session) -> bool:
    """Only the family that owns the booking's elder (the payer) or an
    admin can create/confirm a payment — the caregiver is the payee, not
    the one paying, so they get read-only access via can_access_booking."""
    if current_user.role == "admin":
        return True
    if current_user.role == "family":
        elder = db.query(Elder).filter(Elder.id == booking.elder_id).first()
        return elder is not None and elder.user_id == current_user.id
    return False


def _estimate_amount(booking: Booking, db: Session) -> float:
    caregiver = db.query(Caregiver).filter(Caregiver.id == booking.caregiver_id).first()
    hourly_rate = caregiver.hourly_rate if caregiver and caregiver.hourly_rate else 300.0

    def _parse(t: str) -> time:
        hour, minute = (t.split(":") + ["0"])[:2]
        return time(int(hour), int(minute))

    try:
        start = _parse(booking.start_time)
        end = _parse(booking.end_time)
        hours = max((end.hour * 60 + end.minute) - (start.hour * 60 + start.minute), 60) / 60
    except (ValueError, IndexError):
        hours = 4.0

    return round(hourly_rate * hours, 2)


def _get_booking_or_404(booking_id: int, db: Session) -> Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="booking not found")
    return booking


def _to_response(payment: Payment, include_qr_image: bool) -> PaymentResponse:
    data = PaymentResponse.model_validate(payment)
    if include_qr_image and payment.status == "pending":
        data.qr_image = qr_payload_to_png_data_uri(payment.qr_payload)
    return data


@router.get("/bookings/{booking_id}/payment", response_model=PaymentResponse | None)
def get_booking_payment(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = _get_booking_or_404(booking_id, db)
    if not can_access_booking(current_user, booking, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this booking")

    payment = (
        db.query(Payment)
        .filter(Payment.booking_id == booking_id)
        .order_by(Payment.created_at.desc())
        .first()
    )
    if not payment:
        return None
    return _to_response(payment, include_qr_image=True)


@router.post("/bookings/{booking_id}/payment", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_booking_payment(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = _get_booking_or_404(booking_id, db)
    if not _can_pay(current_user, booking, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to pay for this booking")

    existing = (
        db.query(Payment)
        .filter(Payment.booking_id == booking_id, Payment.status.in_(["pending", "paid"]))
        .order_by(Payment.created_at.desc())
        .first()
    )
    if existing:
        return _to_response(existing, include_qr_image=True)

    amount = _estimate_amount(booking, db)
    qr_payload = build_promptpay_payload(settings.PROMPTPAY_ID, amount)

    payment = Payment(booking_id=booking_id, amount=amount, currency="THB", status="pending", qr_payload=qr_payload)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return _to_response(payment, include_qr_image=True)


@router.post("/payments/{payment_id}/confirm", response_model=PaymentResponse)
def confirm_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Marks a payment as paid. This is a DEMO confirmation the payer
    triggers themselves — this project has no real PromptPay merchant
    account, so there's no bank webhook to verify the transfer actually
    happened. A production system would never trust a client-side
    "I've paid" button for this."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="payment not found")

    booking = _get_booking_or_404(payment.booking_id, db)
    if not _can_pay(current_user, booking, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to confirm this payment")

    if payment.status != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"payment is already {payment.status}")

    payment.status = "paid"
    payment.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(payment)
    return _to_response(payment, include_qr_image=False)


@router.post("/payments/{payment_id}/cancel", response_model=PaymentResponse)
def cancel_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="payment not found")

    booking = _get_booking_or_404(payment.booking_id, db)
    if not _can_pay(current_user, booking, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to cancel this payment")

    if payment.status != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"payment is already {payment.status}")

    payment.status = "cancelled"
    db.commit()
    db.refresh(payment)
    return _to_response(payment, include_qr_image=False)
