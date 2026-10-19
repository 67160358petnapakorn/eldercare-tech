from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.booking import Booking
from app.models.caregiver import Caregiver
from app.models.elder import Elder
from app.models.user import User
from app.schemas.booking import (
    BookingCreateRequest,
    BookingResponse,
    BookingUpdateRequest,
    PaginatedBookingsResponse,
)

router = APIRouter(prefix="/api", tags=["Bookings"])


@router.get("/bookings", response_model=PaginatedBookingsResponse)
def list_bookings(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: str | None = None,
    search: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Booking)

    if current_user.role == "family":
        elder_ids = [elder.id for elder in db.query(Elder).filter(Elder.user_id == current_user.id).all()]
        query = query.filter(Booking.elder_id.in_(elder_ids)) if elder_ids else query.filter(False)
    elif current_user.role == "caregiver":
        caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
        if not caregiver:
            return {"items": [], "total": 0, "page": page, "size": size}
        query = query.filter(Booking.caregiver_id == caregiver.id)
    elif current_user.role not in {"admin", "nurse"}:
        query = query.filter(False)

    if status:
        query = query.filter(Booking.status == status)

    if search:
        term = f"%{search}%"
        query = query.filter(or_(Booking.service_type.ilike(term), Booking.note.ilike(term)))

    total = query.count()
    items = query.order_by(Booking.date.desc(), Booking.start_time.desc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "total": total, "page": page, "size": size}


@router.post("/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    elder = db.query(Elder).filter(Elder.id == payload.elder_id).first()
    if not elder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="elder not found")

    caregiver = db.query(Caregiver).filter(Caregiver.id == payload.caregiver_id).first()
    if not caregiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="caregiver not found")

    if current_user.role == "family":
        if elder.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to book for this elder",
            )
    elif current_user.role == "caregiver":
        if caregiver.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create bookings for your own caregiver profile",
            )
    elif current_user.role not in {"admin", "nurse"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to create bookings")

    booking = Booking(**payload.model_dump())
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/bookings/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="booking not found")

    elder = db.query(Elder).filter(Elder.id == booking.elder_id).first()
    caregiver = db.query(Caregiver).filter(Caregiver.id == booking.caregiver_id).first()
    if current_user.role == "family":
        if not elder or elder.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this booking")
    elif current_user.role == "caregiver":
        if not caregiver or caregiver.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this booking")
    elif current_user.role not in {"admin", "nurse"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this booking")

    return booking


@router.patch("/bookings/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int,
    payload: BookingUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="booking not found")

    elder = db.query(Elder).filter(Elder.id == booking.elder_id).first()
    caregiver = db.query(Caregiver).filter(Caregiver.id == booking.caregiver_id).first()

    if current_user.role == "family":
        if not elder or elder.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update this booking")
    elif current_user.role == "caregiver":
        if not caregiver or caregiver.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update this booking")
    elif current_user.role not in {"admin", "nurse"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update this booking")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(booking, field, value)

    db.commit()
    db.refresh(booking)
    return booking


@router.delete("/bookings/{booking_id}")
def delete_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="booking not found")

    elder = db.query(Elder).filter(Elder.id == booking.elder_id).first()
    caregiver = db.query(Caregiver).filter(Caregiver.id == booking.caregiver_id).first()

    if current_user.role == "family":
        if not elder or elder.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this booking")
    elif current_user.role == "caregiver":
        if not caregiver or caregiver.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this booking")
    elif current_user.role not in {"admin", "nurse"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this booking")

    db.delete(booking)
    db.commit()
    return {"success": True, "message": "booking deleted"}
