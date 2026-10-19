from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.booking import Booking
from app.models.caregiver import Caregiver
from app.models.elder import Elder
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreateRequest, ReviewResponse, ReviewUpdateRequest, PaginatedReviewsResponse

router = APIRouter(prefix="/api", tags=["Reviews"])


def can_access_review(current_user: User, booking: Booking, db: Session) -> bool:
    if current_user.role in {"admin", "nurse"}:
        return True
    if current_user.role == "family":
        from app.models.elder import Elder
        elder = db.query(Elder).filter(Elder.id == booking.elder_id).first()
        return elder is not None and elder.user_id == current_user.id
    if current_user.role == "caregiver":
        caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
        return caregiver is not None and caregiver.id == booking.caregiver_id
    return False


@router.get("/reviews", response_model=PaginatedReviewsResponse)
def list_reviews(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Review)
    if current_user.role == "family":
        family_elder_ids = [e.id for e in db.query(Elder).filter(Elder.user_id == current_user.id).all()]
        bookings = db.query(Booking).filter(Booking.elder_id.in_(family_elder_ids)).all() if family_elder_ids else []
        booking_ids = [b.id for b in bookings]
        query = query.filter(Review.booking_id.in_(booking_ids)) if booking_ids else query.filter(False)
    elif current_user.role == "caregiver":
        caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
        if not caregiver:
            return {"items": [], "total": 0, "page": page, "size": size}
        query = query.filter(Review.caregiver_id == caregiver.id)
    elif current_user.role not in {"admin", "nurse"}:
        query = query.filter(False)

    total = query.count()
    items = query.order_by(Review.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "total": total, "page": page, "size": size}


@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="booking not found")
    if not can_access_review(current_user, booking, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to review this booking")
    if db.query(Review).filter(Review.booking_id == payload.booking_id).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="review already exists for this booking")
    review = Review(**payload.model_dump())
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("/reviews/{review_id}", response_model=ReviewResponse)
def get_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="review not found")
    booking = db.query(Booking).filter(Booking.id == review.booking_id).first()
    if booking is None or not can_access_review(current_user, booking, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this review")
    return review


@router.patch("/reviews/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    payload: ReviewUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="review not found")
    booking = db.query(Booking).filter(Booking.id == review.booking_id).first()
    if booking is None or not can_access_review(current_user, booking, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update this review")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(review, field, value)

    db.commit()
    db.refresh(review)
    return review


@router.delete("/reviews/{review_id}")
def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="review not found")
    booking = db.query(Booking).filter(Booking.id == review.booking_id).first()
    if booking is None or not can_access_review(current_user, booking, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this review")
    db.delete(review)
    db.commit()
    return {"success": True, "message": "review deleted"}
