from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class ReferralCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    elder_id: int
    partner_id: int
    reason: str
    symptoms: str | None = None
    priority: str = "medium"
    consent: bool = False
    status: str = "new"

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, value: str) -> str:
        allowed = {"low", "medium", "high", "urgent"}
        if value not in allowed:
            raise ValueError("invalid priority")
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        allowed = {"new", "reviewed", "accepted", "rejected"}
        if value not in allowed:
            raise ValueError("invalid status")
        return value


class ReferralUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    elder_id: int | None = None
    partner_id: int | None = None
    reason: str | None = None
    symptoms: str | None = None
    priority: str | None = None
    consent: bool | None = None
    status: str | None = None


class ReferralResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    elder_id: int
    partner_id: int
    reason: str
    symptoms: str | None = None
    priority: str
    consent: bool
    status: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PaginatedReferralsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[ReferralResponse]
    total: int
    page: int
    size: int
