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


def _family_has_booking_with_caregiver(family_user: User, caregiver_user: User, db: Session) -> bool:
    caregiver = db.query(Caregiver).filter(Caregiver.user_id == caregiver_user.id).first()
    if not caregiver:
        return False
    elder_ids = [e.id for e in db.query(Elder).filter(Elder.user_id == family_user.id).all()]
    if not elder_ids:
        return False
    return (
        db.query(Booking)
        .filter(Booking.caregiver_id == caregiver.id, Booking.elder_id.in_(elder_ids))
        .first()
        is not None
    )


def can_message_user(current_user: User, other_user_id: int, db: Session) -> bool:
    """Who's allowed to direct-message whom. admin/nurse act as support and
    are reachable by (and can reach) anyone; family and caregiver can only
    message each other if they share an active booking — messaging is scoped
    to an actual care relationship, not an open directory of every user."""
    if current_user.id == other_user_id:
        return False

    other = db.query(User).filter(User.id == other_user_id).first()
    if not other or not other.is_active:
        return False

    if current_user.role in {"admin", "nurse"} or other.role in {"admin", "nurse"}:
        return True

    if current_user.role == "family" and other.role == "caregiver":
        return _family_has_booking_with_caregiver(current_user, other, db)
    if current_user.role == "caregiver" and other.role == "family":
        return _family_has_booking_with_caregiver(other, current_user, db)

    return False
