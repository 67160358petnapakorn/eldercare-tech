from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class CaregiverSkillSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    caregiver_id: int
    skill: str


class CaregiverDocumentSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    caregiver_id: int
    document_type: str
    file_url: str
    status: str
    created_at: datetime | None = None


class CaregiverCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str
    role: str = "caregiver"
    experience: int = 0
    location: str | None = None
    hourly_rate: float = 0.0
    bio: str | None = None
    rating: float = 0.0
    verified: bool = False
    skills: list[str] = []

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not value or len(value.strip()) < 2:
            raise ValueError("name must be at least 2 characters")
        return value.strip()

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        allowed = {"caregiver", "nurse", "admin"}
        if value not in allowed:
            raise ValueError("invalid role")
        return value


class CaregiverUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = None
    role: str | None = None
    experience: int | None = None
    location: str | None = None
    hourly_rate: float | None = None
    bio: str | None = None
    rating: float | None = None
    verified: bool | None = None
    skills: list[str] | None = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str | None) -> str | None:
        if value is not None:
            allowed = {"caregiver", "nurse", "admin"}
            if value not in allowed:
                raise ValueError("invalid role")
        return value


class CaregiverResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    role: str
    experience: int
    location: str | None = None
    hourly_rate: float
    bio: str | None = None
    rating: float
    verified: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None
    skills: list[CaregiverSkillSchema] = []
    documents: list[CaregiverDocumentSchema] = []


class PaginatedCaregiversResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[CaregiverResponse]
    total: int
    page: int
    size: int
