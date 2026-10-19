from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.appointment import Appointment
from app.models.booking import Booking
from app.models.caregiver import Caregiver
from app.models.elder import Elder
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreateRequest,
    AppointmentResponse,
    AppointmentUpdateRequest,
    PaginatedAppointmentsResponse,
)

router = APIRouter(prefix="/api", tags=["Appointments"])


def can_access_elder(current_user: User, elder_id: int, db: Session) -> bool:
    elder = db.query(Elder).filter(Elder.id == elder_id).first()
    if not elder:
        return False
    if current_user.role == "admin":
        return True
    if current_user.role == "family" and elder.user_id == current_user.id:
        return True
    if current_user.role == "caregiver":
        caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
        if not caregiver:
            return False
        has_booking = db.query(Booking).filter(Booking.elder_id == elder_id, Booking.caregiver_id == caregiver.id).first() is not None
        return has_booking
    return False


@router.get("/appointments", response_model=PaginatedAppointmentsResponse)
def list_appointments(
    elder_id: int | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Appointment)

    if elder_id is not None:
        if not can_access_elder(current_user, elder_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this elder's appointments")
        query = query.filter(Appointment.elder_id == elder_id)
    elif current_user.role == "family":
        elder_ids = [e.id for e in db.query(Elder).filter(Elder.user_id == current_user.id).all()]
        query = query.filter(Appointment.elder_id.in_(elder_ids)) if elder_ids else query.filter(False)
    elif current_user.role == "caregiver":
        caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
        if not caregiver:
            return {"items": [], "total": 0, "page": page, "size": size}
        elder_ids = [b.elder_id for b in db.query(Booking).filter(Booking.caregiver_id == caregiver.id).all()]
        query = query.filter(Appointment.elder_id.in_(elder_ids)) if elder_ids else query.filter(False)
    elif current_user.role not in {"admin", "nurse"}:
        query = query.filter(False)

    if search:
        term = f"%{search}%"
        query = query.filter(or_(Appointment.hospital_name.ilike(term), Appointment.doctor_name.ilike(term), Appointment.department.ilike(term)))

    total = query.count()
    items = query.order_by(Appointment.appointment_date.desc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "total": total, "page": page, "size": size}


@router.post("/appointments", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not can_access_elder(current_user, payload.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to create appointments for this elder")

    appointment = Appointment(**payload.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="appointment not found")
    if not can_access_elder(current_user, appointment.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this appointment")
    return appointment


@router.patch("/appointments/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    payload: AppointmentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="appointment not found")
    if not can_access_elder(current_user, appointment.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update this appointment")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(appointment, field, value)

    db.commit()
    db.refresh(appointment)
    return appointment


@router.delete("/appointments/{appointment_id}")
def delete_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="appointment not found")
    if not can_access_elder(current_user, appointment.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this appointment")
    db.delete(appointment)
    db.commit()
    return {"success": True, "message": "appointment deleted"}
