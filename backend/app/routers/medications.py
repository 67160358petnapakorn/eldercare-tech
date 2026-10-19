from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import can_access_elder
from app.core.security import get_current_user
from app.models.booking import Booking
from app.models.caregiver import Caregiver
from app.models.elder import Elder
from app.models.medication import Medication, MedicationLog
from app.models.user import User
from app.schemas.medication import (
    MedicationCreateRequest,
    MedicationLogCreateRequest,
    MedicationLogResponse,
    MedicationLogUpdateRequest,
    MedicationResponse,
    MedicationUpdateRequest,
    PaginatedMedicationLogsResponse,
    PaginatedMedicationsResponse,
)

router = APIRouter(prefix="/api", tags=["Medications"])


@router.get("/medications", response_model=PaginatedMedicationsResponse)
def list_medications(
    elder_id: int | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Medication)
    if elder_id is not None:
        if not can_access_elder(current_user, elder_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this elder's medications")
        query = query.filter(Medication.elder_id == elder_id)
    elif current_user.role == "family":
        elder_ids = [e.id for e in db.query(Elder).filter(Elder.user_id == current_user.id).all()]
        query = query.filter(Medication.elder_id.in_(elder_ids)) if elder_ids else query.filter(False)
    elif current_user.role == "caregiver":
        caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
        if not caregiver:
            return {"items": [], "total": 0, "page": page, "size": size}
        elder_ids = [b.elder_id for b in db.query(Booking).filter(Booking.caregiver_id == caregiver.id).all()]
        query = query.filter(Medication.elder_id.in_(elder_ids)) if elder_ids else query.filter(False)
    elif current_user.role not in {"admin", "nurse"}:
        query = query.filter(False)

    total = query.count()
    items = query.order_by(Medication.start_date.desc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "total": total, "page": page, "size": size}


@router.post("/medications", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
def create_medication(
    payload: MedicationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not can_access_elder(current_user, payload.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to create medications for this elder")

    medication = Medication(**payload.model_dump())
    db.add(medication)
    db.commit()
    db.refresh(medication)
    return medication


@router.get("/medications/{medication_id}", response_model=MedicationResponse)
def get_medication(
    medication_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    medication = db.query(Medication).filter(Medication.id == medication_id).first()
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="medication not found")
    if not can_access_elder(current_user, medication.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this medication")
    return medication


@router.patch("/medications/{medication_id}", response_model=MedicationResponse)
def update_medication(
    medication_id: int,
    payload: MedicationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    medication = db.query(Medication).filter(Medication.id == medication_id).first()
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="medication not found")
    if not can_access_elder(current_user, medication.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update this medication")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(medication, field, value)

    db.commit()
    db.refresh(medication)
    return medication


@router.delete("/medications/{medication_id}")
def delete_medication(
    medication_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    medication = db.query(Medication).filter(Medication.id == medication_id).first()
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="medication not found")
    if not can_access_elder(current_user, medication.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this medication")
    db.delete(medication)
    db.commit()
    return {"success": True, "message": "medication deleted"}


@router.get("/medication-logs", response_model=PaginatedMedicationLogsResponse)
def list_medication_logs(
    medication_id: int | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(MedicationLog)
    if medication_id is not None:
        med = db.query(Medication).filter(Medication.id == medication_id).first()
        if not med:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="medication not found")
        if not can_access_elder(current_user, med.elder_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this medication log")
        query = query.filter(MedicationLog.medication_id == medication_id)
    else:
        allowed_ids = []
        if current_user.role == "family":
            elder_ids = [e.id for e in db.query(Elder).filter(Elder.user_id == current_user.id).all()]
            allowed_ids = [m.id for m in db.query(Medication).filter(Medication.elder_id.in_(elder_ids)).all()] if elder_ids else []
        elif current_user.role == "caregiver":
            caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
            if caregiver:
                elder_ids = [b.elder_id for b in db.query(Booking).filter(Booking.caregiver_id == caregiver.id).all()]
                allowed_ids = [m.id for m in db.query(Medication).filter(Medication.elder_id.in_(elder_ids)).all()] if elder_ids else []
        elif current_user.role in {"admin", "nurse"}:
            allowed_ids = [m.id for m in db.query(Medication).all()]
        else:
            allowed_ids = []

        if not allowed_ids:
            return {"items": [], "total": 0, "page": page, "size": size}
        query = query.filter(MedicationLog.medication_id.in_(allowed_ids))

    total = query.count()
    items = query.order_by(MedicationLog.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "total": total, "page": page, "size": size}


@router.post("/medication-logs", response_model=MedicationLogResponse, status_code=status.HTTP_201_CREATED)
def create_medication_log(
    payload: MedicationLogCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    medication = db.query(Medication).filter(Medication.id == payload.medication_id).first()
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="medication not found")
    if not can_access_elder(current_user, medication.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to add logs for this medication")

    log = MedicationLog(**payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.patch("/medication-logs/{log_id}", response_model=MedicationLogResponse)
def update_medication_log(
    log_id: int,
    payload: MedicationLogUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = db.query(MedicationLog).filter(MedicationLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="medication log not found")
    medication = db.query(Medication).filter(Medication.id == log.medication_id).first()
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="medication not found")
    if not can_access_elder(current_user, medication.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update this medication log")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(log, field, value)

    db.commit()
    db.refresh(log)
    return log
