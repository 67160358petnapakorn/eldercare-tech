from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator


class AppointmentCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    elder_id: int
    hospital_name: str
    doctor_name: str
    department: str
    appointment_date: date
    appointment_time: str
    reason: str
    note: str | None = None
    status: str = "upcoming"

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        allowed = {"upcoming", "completed", "cancelled", "rescheduled"}
        if value not in allowed:
            raise ValueError("invalid appointment status")
        return value


class AppointmentUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    elder_id: int | None = None
    hospital_name: str | None = None
    doctor_name: str | None = None
    department: str | None = None
    appointment_date: date | None = None
    appointment_time: str | None = None
    reason: str | None = None
    note: str | None = None
    status: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is not None:
            allowed = {"upcoming", "completed", "cancelled", "rescheduled"}
            if value not in allowed:
                raise ValueError("invalid appointment status")
        return value


class AppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    elder_id: int
    hospital_name: str
    doctor_name: str
    department: str
    appointment_date: date
    appointment_time: str
    reason: str
    note: str | None = None
    status: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PaginatedAppointmentsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[AppointmentResponse]
    total: int
    page: int
    size: int
