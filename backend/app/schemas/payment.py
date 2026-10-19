from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int
    amount: float
    currency: str
    status: str
    qr_payload: str
    qr_image: str | None = None
    created_at: datetime | None = None
    paid_at: datetime | None = None
