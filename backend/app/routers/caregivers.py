from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.caregiver import Caregiver, CaregiverDocument, CaregiverSkill
from app.models.user import User
from app.schemas.caregiver import (
    CaregiverCreateRequest,
    CaregiverResponse,
    CaregiverUpdateRequest,
    PaginatedCaregiversResponse,
)

router = APIRouter(prefix="/api", tags=["Caregivers"])


@router.get("/caregivers", response_model=PaginatedCaregiversResponse)
def list_caregivers(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Caregiver)

    if current_user.role not in {"admin", "nurse"}:
        query = query.filter(Caregiver.user_id == current_user.id)

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Caregiver.name.ilike(term),
                Caregiver.location.ilike(term),
                Caregiver.role.ilike(term),
            )
        )

    total = query.count()
    items = query.order_by(Caregiver.id.asc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "total": total, "page": page, "size": size}


@router.post("/caregivers", response_model=CaregiverResponse, status_code=status.HTTP_201_CREATED)
def create_caregiver(
    payload: CaregiverCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in {"caregiver", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only caregivers or admins can create caregiver profiles",
        )

    if db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="caregiver profile already exists for this user",
        )

    caregiver = Caregiver(user_id=current_user.id, **payload.model_dump(exclude={"skills"}))
    db.add(caregiver)
    db.commit()
    db.refresh(caregiver)

    if payload.skills:
        for skill_name in payload.skills:
            skill_name = skill_name.strip()
            if not skill_name:
                continue
            db.add(CaregiverSkill(caregiver_id=caregiver.id, skill=skill_name))
        db.commit()

    return caregiver


@router.get("/caregivers/{caregiver_id}", response_model=CaregiverResponse)
def get_caregiver(
    caregiver_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    caregiver = db.query(Caregiver).filter(Caregiver.id == caregiver_id).first()
    if not caregiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="caregiver not found")

    if current_user.role not in {"admin", "nurse"} and caregiver.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this caregiver",
        )

    return caregiver


@router.patch("/caregivers/{caregiver_id}", response_model=CaregiverResponse)
def update_caregiver(
    caregiver_id: int,
    payload: CaregiverUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    caregiver = db.query(Caregiver).filter(Caregiver.id == caregiver_id).first()
    if not caregiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="caregiver not found")

    if current_user.role != "admin" and caregiver.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this caregiver",
        )

    updates = payload.model_dump(exclude_unset=True)
    skills = updates.pop("skills", None)

    for field, value in updates.items():
        setattr(caregiver, field, value)

    if skills is not None:
        db.query(CaregiverSkill).filter(CaregiverSkill.caregiver_id == caregiver.id).delete()
        for skill_name in skills:
            skill_name = skill_name.strip()
            if not skill_name:
                continue
            db.add(CaregiverSkill(caregiver_id=caregiver.id, skill=skill_name))

    db.commit()
    db.refresh(caregiver)
    return caregiver


@router.delete("/caregivers/{caregiver_id}")
def delete_caregiver(
    caregiver_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    caregiver = db.query(Caregiver).filter(Caregiver.id == caregiver_id).first()
    if not caregiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="caregiver not found")

    if current_user.role != "admin" and caregiver.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this caregiver",
        )

    db.query(CaregiverSkill).filter(CaregiverSkill.caregiver_id == caregiver.id).delete()
    db.query(CaregiverDocument).filter(CaregiverDocument.caregiver_id == caregiver.id).delete()
    db.delete(caregiver)
    db.commit()
    return {"success": True, "message": "caregiver deleted"}


@router.post("/caregivers/{caregiver_id}/skills")
def add_caregiver_skill(
    caregiver_id: int,
    skill: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    caregiver = db.query(Caregiver).filter(Caregiver.id == caregiver_id).first()
    if not caregiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="caregiver not found")
    if current_user.role != "admin" and caregiver.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to edit this caregiver")

    skill_name = skill.strip()
    if not skill_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="skill is required")

    db.add(CaregiverSkill(caregiver_id=caregiver.id, skill=skill_name))
    db.commit()
    return {"success": True, "message": "skill added"}


@router.post("/caregivers/{caregiver_id}/documents")
def add_caregiver_document(
    caregiver_id: int,
    document_type: str,
    file_url: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    caregiver = db.query(Caregiver).filter(Caregiver.id == caregiver_id).first()
    if not caregiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="caregiver not found")
    if current_user.role != "admin" and caregiver.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to edit this caregiver")

    if not document_type.strip() or not file_url.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="document_type and file_url are required")

    doc = CaregiverDocument(caregiver_id=caregiver.id, document_type=document_type.strip(), file_url=file_url.strip())
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc
