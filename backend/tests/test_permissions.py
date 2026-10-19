from datetime import date

from app.core.permissions import can_access_elder
from app.core.security import get_password_hash
from app.models.booking import Booking
from app.models.caregiver import Caregiver
from app.models.elder import Elder
from app.models.user import User


def _make_user(db_session, *, email: str, role: str) -> User:
    user = User(
        username=email.split("@")[0],
        email=email,
        password_hash=get_password_hash("123456"),
        first_name="Test",
        last_name=role,
        role=role,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _make_elder(db_session, owner: User) -> Elder:
    elder = Elder(user_id=owner.id, first_name="Somchai", last_name="Test", date_of_birth=date(1950, 1, 1))
    db_session.add(elder)
    db_session.commit()
    db_session.refresh(elder)
    return elder


def test_admin_can_access_any_elder(db_session):
    owner = _make_user(db_session, email="owner1@example.com", role="family")
    admin = _make_user(db_session, email="admin1@example.com", role="admin")
    elder = _make_elder(db_session, owner)

    assert can_access_elder(admin, elder.id, db_session) is True


def test_nurse_can_access_any_elder(db_session):
    owner = _make_user(db_session, email="owner2@example.com", role="family")
    nurse = _make_user(db_session, email="nurse2@example.com", role="nurse")
    elder = _make_elder(db_session, owner)

    assert can_access_elder(nurse, elder.id, db_session) is True


def test_family_can_access_own_elder(db_session):
    owner = _make_user(db_session, email="owner3@example.com", role="family")
    elder = _make_elder(db_session, owner)

    assert can_access_elder(owner, elder.id, db_session) is True


def test_family_cannot_access_someone_elses_elder(db_session):
    owner = _make_user(db_session, email="owner4@example.com", role="family")
    other_family = _make_user(db_session, email="other4@example.com", role="family")
    elder = _make_elder(db_session, owner)

    assert can_access_elder(other_family, elder.id, db_session) is False


def test_caregiver_without_booking_cannot_access_elder(db_session):
    owner = _make_user(db_session, email="owner5@example.com", role="family")
    caregiver_user = _make_user(db_session, email="cg5@example.com", role="caregiver")
    db_session.add(Caregiver(user_id=caregiver_user.id, name="Caregiver Five"))
    db_session.commit()
    elder = _make_elder(db_session, owner)

    assert can_access_elder(caregiver_user, elder.id, db_session) is False


def test_caregiver_with_booking_can_access_elder(db_session):
    owner = _make_user(db_session, email="owner6@example.com", role="family")
    caregiver_user = _make_user(db_session, email="cg6@example.com", role="caregiver")
    caregiver = Caregiver(user_id=caregiver_user.id, name="Caregiver Six")
    db_session.add(caregiver)
    db_session.commit()
    db_session.refresh(caregiver)
    elder = _make_elder(db_session, owner)

    db_session.add(
        Booking(
            elder_id=elder.id,
            caregiver_id=caregiver.id,
            date=date(2026, 1, 1),
            start_time="09:00",
            end_time="13:00",
            service_type="elder_care",
            status="pending",
        )
    )
    db_session.commit()

    assert can_access_elder(caregiver_user, elder.id, db_session) is True


def test_unknown_elder_id_returns_false(db_session):
    admin = _make_user(db_session, email="admin7@example.com", role="admin")
    assert can_access_elder(admin, 999999, db_session) is False
