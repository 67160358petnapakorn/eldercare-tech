from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Caregiver(Base):
    __tablename__ = "caregivers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    name = Column(String(120), nullable=False)
    role = Column(String(30), nullable=False, default="caregiver")
    experience = Column(Integer, default=0)
    location = Column(String(120), nullable=True)
    hourly_rate = Column(Float, default=0.0)
    bio = Column(Text, nullable=True)
    photo_url = Column(String(255), nullable=True)
    rating = Column(Float, default=0.0)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="caregiver")
    documents = relationship("CaregiverDocument", back_populates="caregiver")
    skills = relationship("CaregiverSkill", back_populates="caregiver")
    bookings = relationship("Booking", back_populates="caregiver")
    reviews = relationship("Review", back_populates="caregiver")


class CaregiverDocument(Base):
    __tablename__ = "caregiver_documents"

    id = Column(Integer, primary_key=True, index=True)
    caregiver_id = Column(Integer, ForeignKey("caregivers.id"), nullable=False)
    document_type = Column(String(60), nullable=False)
    file_url = Column(String(255), nullable=False)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    caregiver = relationship("Caregiver", back_populates="documents")


class CaregiverSkill(Base):
    __tablename__ = "caregiver_skills"

    id = Column(Integer, primary_key=True, index=True)
    caregiver_id = Column(Integer, ForeignKey("caregivers.id"), nullable=False)
    skill = Column(String(120), nullable=False)

    caregiver = relationship("Caregiver", back_populates="skills")
