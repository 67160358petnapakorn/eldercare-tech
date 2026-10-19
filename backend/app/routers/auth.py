from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_password_hash,
    hash_refresh_token,
    verify_password,
)
from app.models.appointment import Appointment
from app.models.booking import Booking
from app.models.caregiver import Caregiver, CaregiverDocument, CaregiverSkill
from app.models.elder import Elder
from app.models.health import HealthAlert, HealthRecord
from app.models.medication import Medication, MedicationLog
from app.models.message import Message
from app.models.notification import Notification
from app.models.payment import Payment
from app.models.referral import Referral
from app.models.refresh_token import RefreshToken
from app.models.review import Review
from app.models.user import User
from app.schemas.appointment import AppointmentResponse
from app.schemas.auth import (
    ChangePasswordRequest,
    DeleteAccountRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.schemas.booking import BookingResponse
from app.schemas.caregiver import CaregiverResponse
from app.schemas.elder import ElderResponse
from app.schemas.health import HealthAlertResponse, HealthRecordResponse
from app.schemas.medication import MedicationResponse
from app.schemas.message import MessageResponse
from app.schemas.notification import NotificationResponse
from app.schemas.referral import ReferralResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter((User.email == payload.email) | (User.username == payload.username)).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="username or email already exists",
        )

    user = User(
        username=payload.username,
        email=str(payload.email),
        password_hash=get_password_hash(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _issue_tokens(user: User, db: Session) -> dict:
    access_token = create_access_token(user.id)
    raw_refresh, token_hash, expires_at = create_refresh_token()
    db.add(RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at))
    db.commit()
    return {"access_token": access_token, "refresh_token": raw_refresh, "token_type": "bearer"}


@router.post("/login", response_model=TokenResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == str(payload.email)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    return _issue_tokens(user, db)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
    )

    token_hash = hash_refresh_token(payload.refresh_token)
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if not stored or stored.revoked or stored.expires_at < datetime.utcnow():
        raise credentials_exception

    user = db.query(User).filter(User.id == stored.user_id).first()
    if not user or not user.is_active:
        raise credentials_exception

    # Rotate: the old refresh token is single-use so a stolen, already-used
    # token can't be replayed once the legitimate client has refreshed.
    stored.revoked = True
    db.commit()

    return _issue_tokens(user, db)


@router.post("/logout")
def logout_user(payload: LogoutRequest, db: Session = Depends(get_db)):
    if payload.refresh_token:
        token_hash = hash_refresh_token(payload.refresh_token)
        stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
        if stored:
            stored.revoked = True
            db.commit()

    return {"success": True, "message": "logged out successfully"}


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="current password is incorrect",
        )

    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    return {"success": True, "message": "password changed successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/me/export")
def export_my_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """PDPA data-portability endpoint: every row this account owns, as a
    single downloadable JSON file — the frontend just saves the response
    body (see the settings page's "ดาวน์โหลดข้อมูลของฉัน" button)."""
    elders = db.query(Elder).filter(Elder.user_id == current_user.id).all()
    elder_payload = [
        {
            "elder": ElderResponse.model_validate(elder).model_dump(mode="json"),
            "health_records": [
                HealthRecordResponse.model_validate(r).model_dump(mode="json") for r in elder.health_records
            ],
            "health_alerts": [
                HealthAlertResponse.model_validate(a).model_dump(mode="json") for a in elder.health_alerts
            ],
            "medications": [
                MedicationResponse.model_validate(m).model_dump(mode="json") for m in elder.medications
            ],
            "appointments": [
                AppointmentResponse.model_validate(a).model_dump(mode="json") for a in elder.appointments
            ],
            "referrals": [
                ReferralResponse.model_validate(r).model_dump(mode="json") for r in elder.referrals
            ],
            "bookings": [
                BookingResponse.model_validate(b).model_dump(mode="json") for b in elder.bookings
            ],
        }
        for elder in elders
    ]

    caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
    caregiver_payload = CaregiverResponse.model_validate(caregiver).model_dump(mode="json") if caregiver else None
    caregiver_bookings = (
        [BookingResponse.model_validate(b).model_dump(mode="json") for b in caregiver.bookings]
        if caregiver
        else []
    )

    notifications = db.query(Notification).filter(Notification.user_id == current_user.id).all()
    messages = (
        db.query(Message)
        .filter((Message.sender_id == current_user.id) | (Message.recipient_id == current_user.id))
        .all()
    )

    return {
        "exported_at": datetime.utcnow().isoformat(),
        "user": UserResponse.model_validate(current_user).model_dump(mode="json"),
        "elders": elder_payload,
        "caregiver_profile": caregiver_payload,
        "caregiver_bookings": caregiver_bookings,
        "notifications": [NotificationResponse.model_validate(n).model_dump(mode="json") for n in notifications],
        "messages": [MessageResponse.model_validate(m).model_dump(mode="json") for m in messages],
    }


def _purge_account_data(user: User, db: Session) -> None:
    """Deletes every row this account owns, in FK-safe (child-before-parent)
    order — none of the relationships here cascade at the DB level, so a
    real delete has to walk the dependency graph manually rather than
    relying on `ON DELETE CASCADE`."""
    elder_ids = [e.id for e in db.query(Elder.id).filter(Elder.user_id == user.id).all()]
    caregiver = db.query(Caregiver).filter(Caregiver.user_id == user.id).first()
    caregiver_id = caregiver.id if caregiver else None

    booking_ids: set[int] = set()
    if elder_ids:
        booking_ids.update(b.id for b in db.query(Booking.id).filter(Booking.elder_id.in_(elder_ids)).all())
    if caregiver_id:
        booking_ids.update(b.id for b in db.query(Booking.id).filter(Booking.caregiver_id == caregiver_id).all())

    if booking_ids:
        db.query(Payment).filter(Payment.booking_id.in_(booking_ids)).delete(synchronize_session=False)
        db.query(Review).filter(Review.booking_id.in_(booking_ids)).delete(synchronize_session=False)

    if elder_ids:
        medication_ids = [
            m.id for m in db.query(Medication.id).filter(Medication.elder_id.in_(elder_ids)).all()
        ]
        if medication_ids:
            db.query(MedicationLog).filter(MedicationLog.medication_id.in_(medication_ids)).delete(
                synchronize_session=False
            )
        db.query(Medication).filter(Medication.elder_id.in_(elder_ids)).delete(synchronize_session=False)
        db.query(HealthRecord).filter(HealthRecord.elder_id.in_(elder_ids)).delete(synchronize_session=False)
        db.query(HealthAlert).filter(HealthAlert.elder_id.in_(elder_ids)).delete(synchronize_session=False)
        db.query(Appointment).filter(Appointment.elder_id.in_(elder_ids)).delete(synchronize_session=False)
        db.query(Referral).filter(Referral.elder_id.in_(elder_ids)).delete(synchronize_session=False)

    if booking_ids:
        db.query(Booking).filter(Booking.id.in_(booking_ids)).delete(synchronize_session=False)

    if elder_ids:
        db.query(Elder).filter(Elder.id.in_(elder_ids)).delete(synchronize_session=False)

    if caregiver_id:
        db.query(CaregiverSkill).filter(CaregiverSkill.caregiver_id == caregiver_id).delete(synchronize_session=False)
        db.query(CaregiverDocument).filter(CaregiverDocument.caregiver_id == caregiver_id).delete(
            synchronize_session=False
        )
        db.query(Caregiver).filter(Caregiver.id == caregiver_id).delete(synchronize_session=False)

    db.query(Notification).filter(Notification.user_id == user.id).delete(synchronize_session=False)
    db.query(Message).filter((Message.sender_id == user.id) | (Message.recipient_id == user.id)).delete(
        synchronize_session=False
    )
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete(synchronize_session=False)

    db.delete(user)
    db.commit()


@router.delete("/me")
def delete_my_account(
    payload: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """PDPA right-to-erasure endpoint. Requires the current password as
    confirmation — this is permanent and removes every elder, booking,
    health record, etc. this account owns, not just the login."""
    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="รหัสผ่านไม่ถูกต้อง")

    _purge_account_data(current_user, db)
    return {"success": True, "message": "account deleted"}
