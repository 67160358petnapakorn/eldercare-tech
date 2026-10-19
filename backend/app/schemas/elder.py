from pydantic import BaseModel, ConfigDict, field_validator
from datetime import date, datetime


class ElderCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    first_name: str
    last_name: str
    date_of_birth: date | None = None
    gender: str | None = None
    phone: str | None = None
    address: str | None = None
    emergency_contact: str | None = None
    relationship_type: str | None = None
    medical_note: str | None = None

    @field_validator("first_name")
    @classmethod
    def validate_first_name(cls, value: str) -> str:
        if not value or len(value) < 1:
            raise ValueError("first_name is required")
        return value


class ElderUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    first_name: str | None = None
    last_name: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    phone: str | None = None
    address: str | None = None
    emergency_contact: str | None = None
    relationship_type: str | None = None
    medical_note: str | None = None


class ElderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    first_name: str
    last_name: str
    date_of_birth: date | None = None
    gender: str | None = None
    phone: str | None = None
    address: str | None = None
    emergency_contact: str | None = None
    relationship_type: str | None = None
    medical_note: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PaginatedEldersResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[ElderResponse]
    total: int
    page: int
    size: int
