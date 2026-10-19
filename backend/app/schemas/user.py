from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.schemas.auth import UserResponse


class UserUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    username: str | None = None
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    role: str | None = None
    is_active: bool | None = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str | None) -> str | None:
        if value is not None and len(value) < 3:
            raise ValueError("username must be at least 3 characters")
        return value

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str | None) -> str | None:
        if value is not None:
            allowed_roles = {"family", "elder", "caregiver", "nurse", "partner", "admin"}
            if value not in allowed_roles:
                raise ValueError("invalid role")
        return value


class PaginatedUsersResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[UserResponse]
    total: int
    page: int
    size: int
