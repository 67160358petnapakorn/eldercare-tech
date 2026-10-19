from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="THB", nullable=False)
    # pending | paid | cancelled. "paid" is set via a user-confirmed demo
    # button, not a verified bank webhook — see routers/payments.py.
    status = Column(String(20), default="pending", nullable=False)
    qr_payload = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

    booking = relationship("Booking")
