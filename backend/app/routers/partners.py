from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.partner import Partner
from app.models.user import User
from app.schemas.partner import PartnerCreateRequest, PartnerResponse, PartnerUpdateRequest, PaginatedPartnersResponse

router = APIRouter(prefix="/api", tags=["Partners"])


@router.get("/partners", response_model=PaginatedPartnersResponse)
def list_partners(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Partner)
    if current_user.role not in {"admin", "partner", "family", "caregiver", "nurse"}:
        query = query.filter(False)

    if search:
        term = f"%{search}%"
        query = query.filter(
            (Partner.name.ilike(term)) | (Partner.type.ilike(term)) | (Partner.address.ilike(term))
        )

    total = query.count()
    items = query.order_by(Partner.id.asc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "total": total, "page": page, "size": size}


@router.post("/partners", response_model=PartnerResponse, status_code=status.HTTP_201_CREATED)
def create_partner(
    payload: PartnerCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in {"admin", "partner"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to create partners")

    partner = Partner(**payload.model_dump())
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return partner


@router.get("/partners/{partner_id}", response_model=PartnerResponse)
def get_partner(
    partner_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="partner not found")
    if current_user.role not in {"admin", "partner", "family", "caregiver", "nurse"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access partners")
    return partner


@router.patch("/partners/{partner_id}", response_model=PartnerResponse)
def update_partner(
    partner_id: int,
    payload: PartnerUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="partner not found")
    if current_user.role not in {"admin", "partner"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update partners")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(partner, field, value)

    db.commit()
    db.refresh(partner)
    return partner


@router.delete("/partners/{partner_id}")
def delete_partner(
    partner_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="partner not found")
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can delete partners")
    db.delete(partner)
    db.commit()
    return {"success": True, "message": "partner deleted"}
