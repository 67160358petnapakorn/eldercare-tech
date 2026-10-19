from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.elder import Elder
from app.models.user import User
from app.schemas.elder import (
    ElderCreateRequest,
    ElderUpdateRequest,
    ElderResponse,
    PaginatedEldersResponse,
)

router = APIRouter(prefix="/api", tags=["Elders"])


@router.get("/elders", response_model=PaginatedEldersResponse)
def list_elders(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Elder)

    # non-admins should only see elders they own
    if current_user.role != "admin":
        query = query.filter(Elder.user_id == current_user.id)

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(Elder.first_name.ilike(term), Elder.last_name.ilike(term), Elder.phone.ilike(term))
        )

    total = query.count()
    items = query.order_by(Elder.id.asc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "total": total, "page": page, "size": size}


@router.post("/elders", response_model=ElderResponse, status_code=status.HTTP_201_CREATED)
def create_elder(payload: ElderCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    elder = Elder(user_id=current_user.id, **payload.model_dump())
    db.add(elder)
    db.commit()
    db.refresh(elder)
    return elder


@router.get("/elders/{elder_id}", response_model=ElderResponse)
def get_elder(elder_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    elder = db.query(Elder).filter(Elder.id == elder_id).first()
    if not elder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="elder not found")

    if current_user.role != "admin" and elder.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this elder")

    return elder


@router.patch("/elders/{elder_id}", response_model=ElderResponse)
def update_elder(elder_id: int, payload: ElderUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    elder = db.query(Elder).filter(Elder.id == elder_id).first()
    if not elder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="elder not found")

    if current_user.role != "admin" and elder.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update this elder")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(elder, field, value)

    db.commit()
    db.refresh(elder)
    return elder


@router.delete("/elders/{elder_id}")
def delete_elder(elder_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    elder = db.query(Elder).filter(Elder.id == elder_id).first()
    if not elder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="elder not found")

    # only admin or owner can delete
    if current_user.role != "admin" and elder.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this elder")

    # soft delete: we will remove the record for now (could set is_active flag instead)
    db.delete(elder)
    db.commit()
    return {"success": True, "message": "elder deleted"}
