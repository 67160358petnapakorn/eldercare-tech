from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class HealthRecordCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    elder_id: int
    heart_rate: int
    systolic: int
    diastolic: int
    temperature: float
    spo2: int
    blood_sugar: int
    weight: float
    sleep_hours: float
    activity: int

    @field_validator("heart_rate", "systolic", "diastolic", "spo2", "blood_sugar", "activity")
    @classmethod
    def validate_positive(cls, value: int) -> int:
        if value < 0:
            raise ValueError("value must be non-negative")
        return value


class HealthRecordUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    elder_id: int | None = None
    heart_rate: int | None = None
    systolic: int | None = None
    diastolic: int | None = None
    temperature: float | None = None
    spo2: int | None = None
    blood_sugar: int | None = None
    weight: float | None = None
    sleep_hours: float | None = None
    activity: int | None = None


class HealthRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    elder_id: int
    heart_rate: int
    systolic: int
    diastolic: int
    temperature: float
    spo2: int
    blood_sugar: int
    weight: float
    sleep_hours: float
    activity: int
    created_at: datetime | None = None


class HealthAlertCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    elder_id: int
    type: str
    title: str
    message: str
    severity: str = "info"
    is_read: bool = False


class HealthAlertUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    elder_id: int | None = None
    type: str | None = None
    title: str | None = None
    message: str | None = None
    severity: str | None = None
    is_read: bool | None = None


class HealthAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    elder_id: int
    type: str
    title: str
    message: str
    severity: str
    is_read: bool
    created_at: datetime | None = None


class PaginatedHealthRecordsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[HealthRecordResponse]
    total: int
    page: int
    size: int


class PaginatedHealthAlertsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[HealthAlertResponse]
    total: int
    page: int
    size: int
