from datetime import date, datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.appointment import Appointment
from app.models.booking import Booking
from app.models.caregiver import Caregiver
from app.models.elder import Elder
from app.models.health import HealthAlert, HealthRecord
from app.models.notification import Notification
from app.models.user import User

router = APIRouter(prefix="/api", tags=["Dashboard"])


def _serialize_value(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, list):
        return [_serialize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _serialize_value(val) for key, val in value.items()}
    return value


def _serialize_model(obj):
    if obj is None:
        return None
    return _serialize_value({key: value for key, value in obj.__dict__.items() if not key.startswith("_")})


def _resolve_relevant_elder_ids(db: Session, current_user: User) -> list[int]:
    if current_user.role == "family":
        return [elder.id for elder in db.query(Elder).filter(Elder.user_id == current_user.id).all()]

    if current_user.role == "caregiver":
        caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
        if not caregiver:
            return []
        return [booking.elder_id for booking in db.query(Booking).filter(Booking.caregiver_id == caregiver.id).all()]

    if current_user.role in {"admin", "nurse"}:
        return [elder.id for elder in db.query(Elder).all()]

    return []


@router.get("/dashboard/summary")
def get_dashboard_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    elder_ids = _resolve_relevant_elder_ids(db, current_user)

    elders_query = db.query(Elder)
    if elder_ids:
        elders_query = elders_query.filter(Elder.id.in_(elder_ids))
    elif current_user.role not in {"admin", "nurse"}:
        elders_query = elders_query.filter(False)

    appointments_query = db.query(Appointment)
    if elder_ids:
        appointments_query = appointments_query.filter(Appointment.elder_id.in_(elder_ids))
    elif current_user.role not in {"admin", "nurse"}:
        appointments_query = appointments_query.filter(False)

    bookings_query = db.query(Booking)
    if elder_ids:
        bookings_query = bookings_query.filter(Booking.elder_id.in_(elder_ids))
    elif current_user.role not in {"admin", "nurse"}:
        bookings_query = bookings_query.filter(False)

    alerts_query = db.query(HealthAlert)
    if elder_ids:
        alerts_query = alerts_query.filter(HealthAlert.elder_id.in_(elder_ids))
    elif current_user.role not in {"admin", "nurse"}:
        alerts_query = alerts_query.filter(False)

    latest_health = (
        db.query(HealthRecord)
        .filter(HealthRecord.elder_id.in_(elder_ids))
        .order_by(HealthRecord.created_at.desc())
        .first()
        if elder_ids
        else None
    )

    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(5)
        .all()
    )

    upcoming_appointments = appointments_query.order_by(Appointment.appointment_date.asc()).limit(5).all()
    recent_bookings = bookings_query.order_by(Booking.created_at.desc()).limit(5).all()
    recent_alerts = alerts_query.order_by(HealthAlert.created_at.desc()).limit(5).all()

    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "role": current_user.role,
        },
        "counts": {
            "elders": elders_query.count(),
            "caregivers": db.query(Caregiver).count(),
            "appointments": appointments_query.count(),
            "bookings": bookings_query.count(),
            "alerts": alerts_query.count(),
            "notifications": db.query(Notification).filter(Notification.user_id == current_user.id).count(),
        },
        "latest_health_record": _serialize_model(latest_health),
        "upcoming_appointments": [_serialize_model(item) for item in upcoming_appointments],
        "recent_bookings": [_serialize_model(item) for item in recent_bookings],
        "recent_alerts": [_serialize_model(item) for item in recent_alerts],
        "recent_notifications": [_serialize_model(item) for item in notifications],
    }
