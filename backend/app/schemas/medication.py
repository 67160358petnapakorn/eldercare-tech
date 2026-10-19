from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator


class MedicationCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    elder_id: int
    name: str
    dosage: str
    quantity: int
    time: str
    frequency: str
    meal_instruction: str | None = None
    start_date: date
    end_date: date
    note: str | None = None

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, value: int) -> int:
        if value < 0:
            raise ValueError("quantity must be non-negative")
        return value


class MedicationUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    elder_id: int | None = None
    name: str | None = None
    dosage: str | None = None
    quantity: int | None = None
    time: str | None = None
    frequency: str | None = None
    meal_instruction: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    note: str | None = None


class MedicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    elder_id: int
    name: str
    dosage: str
    quantity: int
    time: str
    frequency: str
    meal_instruction: str | None = None
    start_date: date
    end_date: date
    note: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class MedicationLogCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    medication_id: int
    status: str = "taken"
    note: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        allowed = {"taken", "missed", "delayed", "skipped"}
        if value not in allowed:
            raise ValueError("invalid medication log status")
        return value


class MedicationLogUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    medication_id: int | None = None
    status: str | None = None
    note: str | None = None


class MedicationLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    medication_id: int
    status: str
    note: str | None = None
    created_at: datetime | None = None


class PaginatedMedicationsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[MedicationResponse]
    total: int
    page: int
    size: int


class PaginatedMedicationLogsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[MedicationLogResponse]
    total: int
    page: int
    size: int
