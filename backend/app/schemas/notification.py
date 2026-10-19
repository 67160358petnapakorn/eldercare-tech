from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    user_id: int
    type: str = "system"
    title: str
    message: str
    is_read: bool = False


class NotificationUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    user_id: int | None = None
    type: str | None = None
    title: str | None = None
    message: str | None = None
    is_read: bool | None = None


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime | None = None


class PaginatedNotificationsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[NotificationResponse]
    total: int
    page: int
    size: int
