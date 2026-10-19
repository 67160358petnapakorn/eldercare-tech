from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import can_access_elder
from app.core.security import get_current_user
from app.models.elder import Elder
from app.models.partner import Partner
from app.models.referral import Referral
from app.models.user import User
from app.schemas.referral import ReferralCreateRequest, ReferralResponse, ReferralUpdateRequest, PaginatedReferralsResponse

router = APIRouter(prefix="/api", tags=["Referrals"])


@router.get("/referrals", response_model=PaginatedReferralsResponse)
def list_referrals(
    elder_id: int | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Referral)
    if elder_id is not None:
        if not can_access_elder(current_user, elder_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this elder's referrals")
        query = query.filter(Referral.elder_id == elder_id)
    elif current_user.role == "family":
        elder_ids = [e.id for e in db.query(Elder).filter(Elder.user_id == current_user.id).all()]
        query = query.filter(Referral.elder_id.in_(elder_ids)) if elder_ids else query.filter(False)
    elif current_user.role == "caregiver":
        from app.models.booking import Booking
        from app.models.caregiver import Caregiver

        caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
        if not caregiver:
            return {"items": [], "total": 0, "page": page, "size": size}
        elder_ids = [b.elder_id for b in db.query(Booking).filter(Booking.caregiver_id == caregiver.id).all()]
        query = query.filter(Referral.elder_id.in_(elder_ids)) if elder_ids else query.filter(False)
    elif current_user.role not in {"admin", "partner", "nurse"}:
        query = query.filter(False)

    total = query.count()
    items = query.order_by(Referral.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "total": total, "page": page, "size": size}


@router.post("/referrals", response_model=ReferralResponse, status_code=status.HTTP_201_CREATED)
def create_referral(
    payload: ReferralCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not can_access_elder(current_user, payload.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to create referrals for this elder")

    partner = db.query(Partner).filter(Partner.id == payload.partner_id).first()
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="partner not found")

    referral = Referral(**payload.model_dump())
    db.add(referral)
    db.commit()
    db.refresh(referral)
    return referral


@router.get("/referrals/{referral_id}", response_model=ReferralResponse)
def get_referral(
    referral_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="referral not found")
    if not can_access_elder(current_user, referral.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this referral")
    return referral


@router.patch("/referrals/{referral_id}", response_model=ReferralResponse)
def update_referral(
    referral_id: int,
    payload: ReferralUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="referral not found")
    if not can_access_elder(current_user, referral.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update this referral")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(referral, field, value)

    db.commit()
    db.refresh(referral)
    return referral


@router.delete("/referrals/{referral_id}")
def delete_referral(
    referral_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="referral not found")
    if not can_access_elder(current_user, referral.elder_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this referral")
    db.delete(referral)
    db.commit()
    return {"success": True, "message": "referral deleted"}
