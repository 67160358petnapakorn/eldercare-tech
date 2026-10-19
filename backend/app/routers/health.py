from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.booking import Booking
from app.models.caregiver import Caregiver
from app.models.elder import Elder
from app.models.health import HealthAlert, HealthRecord
from app.models.user import User
from app.schemas.health import (
    HealthAlertCreateRequest,
    HealthAlertResponse,
    HealthAlertUpdateRequest,
    HealthRecordCreateRequest,
    HealthRecordResponse,
    HealthRecordUpdateRequest,
    PaginatedHealthAlertsResponse,
    PaginatedHealthRecordsResponse,
)

router = APIRouter(prefix="/api", tags=["Health"])


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


@router.get("/health-records", response_model=PaginatedHealthRecordsResponse)
def list_health_records(
    elder_id: int | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(HealthRecord)
    if elder_id is not None:
        if not can_access_elder(current_user, elder_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this elder's health records")
        query = query.filter(HealthRecord.elder_id == elder_id)
    elif current_user.role == "family":
        elder_ids = [e.id for e in db.query(Elder).filter(Elder.user_id == current_user.id).all()]
        query = query.filter(HealthRecord.elder_id.in_(elder_ids)) if elder_ids else query.filter(False)
    elif current_user.role == "caregiver":
        caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
        if not caregiver:
            return {"items": [], "total": 0, "page": page, "size": size}
        elder_ids = [b.elder_id for b in db.query(Booking).filter(Booking.caregiver_id == caregiver.id).all()]
        query = query.filter(HealthRecord.elder_id.in_(elder_ids)) if elder_ids else query.filter(False)
    elif current_user.role not in {"admin", "nurse"}:
        query = query.filter(False)

    total = query.count()
    items = query.order_by(HealthRecord.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "total": total, "page": page, "size": size}


@router.post("/health-records", response_model=HealthRecordResponse, status_code=status.HTTP_201_CREATED)
def create_health_record(
    payload: HealthRecordCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not can_access_elder(current_user, payload.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to create health records for this elder")

    record = HealthRecord(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/health-records/{record_id}", response_model=HealthRecordResponse)
def get_health_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(HealthRecord).filter(HealthRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="health record not found")
    if not can_access_elder(current_user, record.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this health record")
    return record


@router.patch("/health-records/{record_id}", response_model=HealthRecordResponse)
def update_health_record(
    record_id: int,
    payload: HealthRecordUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(HealthRecord).filter(HealthRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="health record not found")
    if not can_access_elder(current_user, record.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update this health record")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/health-records/{record_id}")
def delete_health_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(HealthRecord).filter(HealthRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="health record not found")
    if not can_access_elder(current_user, record.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this health record")
    db.delete(record)
    db.commit()
    return {"success": True, "message": "health record deleted"}


@router.get("/health-alerts", response_model=PaginatedHealthAlertsResponse)
def list_health_alerts(
    elder_id: int | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(HealthAlert)
    if elder_id is not None:
        if not can_access_elder(current_user, elder_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this elder's alerts")
        query = query.filter(HealthAlert.elder_id == elder_id)
    elif current_user.role == "family":
        elder_ids = [e.id for e in db.query(Elder).filter(Elder.user_id == current_user.id).all()]
        query = query.filter(HealthAlert.elder_id.in_(elder_ids)) if elder_ids else query.filter(False)
    elif current_user.role == "caregiver":
        caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
        if not caregiver:
            return {"items": [], "total": 0, "page": page, "size": size}
        elder_ids = [b.elder_id for b in db.query(Booking).filter(Booking.caregiver_id == caregiver.id).all()]
        query = query.filter(HealthAlert.elder_id.in_(elder_ids)) if elder_ids else query.filter(False)
    elif current_user.role not in {"admin", "nurse"}:
        query = query.filter(False)

    total = query.count()
    items = query.order_by(HealthAlert.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "total": total, "page": page, "size": size}


@router.post("/health-alerts", response_model=HealthAlertResponse, status_code=status.HTTP_201_CREATED)
def create_health_alert(
    payload: HealthAlertCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not can_access_elder(current_user, payload.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to create alerts for this elder")

    alert = HealthAlert(**payload.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.patch("/health-alerts/{alert_id}", response_model=HealthAlertResponse)
def update_health_alert(
    alert_id: int,
    payload: HealthAlertUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    alert = db.query(HealthAlert).filter(HealthAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="health alert not found")
    if not can_access_elder(current_user, alert.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update this health alert")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(alert, field, value)

    db.commit()
    db.refresh(alert)
    return alert
