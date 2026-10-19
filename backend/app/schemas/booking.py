from datetime import date as date_type, datetime

from pydantic import BaseModel, ConfigDict, field_validator


class BookingCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    elder_id: int
    caregiver_id: int
    date: date_type
    start_time: str
    end_time: str
    service_type: str
    note: str | None = None
    status: str = "pending"

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time(cls, value: str) -> str:
        if len(value) < 4:
            raise ValueError("time must be in HH:MM format")
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        allowed = {"pending", "confirmed", "completed", "cancelled", "rejected"}
        if value not in allowed:
            raise ValueError("invalid booking status")
        return value


class BookingUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    elder_id: int | None = None
    caregiver_id: int | None = None
    date: date_type | None = None
    start_time: str | None = None
    end_time: str | None = None
    service_type: str | None = None
    note: str | None = None
    status: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is not None:
            allowed = {"pending", "confirmed", "completed", "cancelled", "rejected"}
            if value not in allowed:
                raise ValueError("invalid booking status")
        return value


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    elder_id: int
    caregiver_id: int
    date: date_type
    start_time: str
    end_time: str
    service_type: str
    note: str | None = None
    status: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PaginatedBookingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[BookingResponse]
    total: int
    page: int
    size: int
