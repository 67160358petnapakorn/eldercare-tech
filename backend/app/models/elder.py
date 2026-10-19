from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Elder(Base):
    __tablename__ = "elders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    emergency_contact = Column(String(20), nullable=True)
    relationship_type = Column(String(50), nullable=True)
    medical_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="elders")
    health_records = relationship("HealthRecord", back_populates="elder")
    health_alerts = relationship("HealthAlert", back_populates="elder")
    medications = relationship("Medication", back_populates="elder")
    appointments = relationship("Appointment", back_populates="elder")
    bookings = relationship("Booking", back_populates="elder")
    referrals = relationship("Referral", back_populates="elder")
