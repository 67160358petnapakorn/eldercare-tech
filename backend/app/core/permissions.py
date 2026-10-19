from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.caregiver import Caregiver
from app.models.elder import Elder
from app.models.user import User


def can_access_elder(current_user: User, elder_id: int, db: Session) -> bool:
    """Shared ownership/role check for every elder-scoped resource
    (health records, medications, appointments, referrals). Admin and nurse
    have full read/write access; family only for elders they own; caregiver
    only for elders they have an active booking with."""
    elder = db.query(Elder).filter(Elder.id == elder_id).first()
    if not elder:
        return False
    if current_user.role in {"admin", "nurse"}:
        return True
    if current_user.role == "family" and elder.user_id == current_user.id:
        return True
    if current_user.role == "caregiver":
        caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
        if not caregiver:
            return False
        has_booking = (
            db.query(Booking)
            .filter(Booking.elder_id == elder_id, Booking.caregiver_id == caregiver.id)
            .first()
            is not None
        )
        return has_booking
    return False
