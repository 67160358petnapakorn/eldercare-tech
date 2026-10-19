from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class PartnerCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str
    type: str
    address: str
    phone: str | None = None
    email: str | None = None
    description: str | None = None
    verified: bool = False

    @field_validator("name", "type", "address")
    @classmethod
    def validate_required(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("this field is required")
        return value.strip()


class PartnerUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = None
    type: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    description: str | None = None
    verified: bool | None = None


class PartnerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: str
    address: str
    phone: str | None = None
    email: str | None = None
    description: str | None = None
    verified: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PaginatedPartnersResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[PartnerResponse]
    total: int
    page: int
    size: int
