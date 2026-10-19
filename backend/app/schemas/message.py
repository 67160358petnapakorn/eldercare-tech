from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class MessageCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    recipient_id: int
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("content is required")
        if len(value) > 2000:
            raise ValueError("content must be 2000 characters or fewer")
        return value


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    recipient_id: int
    content: str
    is_read: bool
    created_at: datetime | None = None


class PaginatedMessagesResponse(BaseModel):
    items: list[MessageResponse]
    total: int
    page: int
    size: int


class ConversationSummary(BaseModel):
    user_id: int
    name: str
    role: str
    last_message: str | None = None
    last_message_at: datetime | None = None
    unread_count: int


class ContactSummary(BaseModel):
    user_id: int
    name: str
    role: str


class MarkReadRequest(BaseModel):
    with_user_id: int
