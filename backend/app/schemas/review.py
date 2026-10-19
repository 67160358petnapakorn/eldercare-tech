from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class ReviewCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    booking_id: int
    caregiver_id: int
    rating: int
    comment: str | None = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, value: int) -> int:
        if value < 1 or value > 5:
            raise ValueError("rating must be between 1 and 5")
        return value


class ReviewUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    booking_id: int | None = None
    caregiver_id: int | None = None
    rating: int | None = None
    comment: str | None = None


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int
    caregiver_id: int
    rating: int
    comment: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PaginatedReviewsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[ReviewResponse]
    total: int
    page: int
    size: int
