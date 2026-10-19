from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    elder_id = Column(Integer, ForeignKey("elders.id"), nullable=False)
    heart_rate = Column(Integer, nullable=False)
    systolic = Column(Integer, nullable=False)
    diastolic = Column(Integer, nullable=False)
    temperature = Column(Float, nullable=False)
    spo2 = Column(Integer, nullable=False)
    blood_sugar = Column(Integer, nullable=False)
    weight = Column(Float, nullable=False)
    sleep_hours = Column(Float, nullable=False)
    activity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    elder = relationship("Elder", back_populates="health_records")


class HealthAlert(Base):
    __tablename__ = "health_alerts"

    id = Column(Integer, primary_key=True, index=True)
    elder_id = Column(Integer, ForeignKey("elders.id"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False, default="info")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    elder = relationship("Elder", back_populates="health_alerts")
