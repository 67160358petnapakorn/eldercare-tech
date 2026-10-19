from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    elder_id = Column(Integer, ForeignKey("elders.id"), nullable=False)
    name = Column(String(120), nullable=False)
    dosage = Column(String(80), nullable=False)
    quantity = Column(Integer, nullable=False)
    time = Column(String(10), nullable=False)
    frequency = Column(String(50), nullable=False)
    meal_instruction = Column(String(120), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    elder = relationship("Elder", back_populates="medications")
    logs = relationship("MedicationLog", back_populates="medication")


class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=False)
    status = Column(String(20), nullable=False, default="taken")
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    medication = relationship("Medication", back_populates="logs")
