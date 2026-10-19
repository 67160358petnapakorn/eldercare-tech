from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from passlib.context import CryptContext

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.models import *  # noqa: F401,F403

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def seed_demo_data() -> None:
    db: Session = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return

        demo_users = [
            {
                "username": "family",
                "email": "family@example.com",
                "password_hash": hash_password("123456"),
                "first_name": "Family",
                "last_name": "User",
                "phone": "0811111111",
                "role": "family",
                "is_active": True,
            },
            {
                "username": "caregiver",
                "email": "caregiver@example.com",
                "password_hash": hash_password("123456"),
                "first_name": "Care",
                "last_name": "Giver",
                "phone": "0822222222",
                "role": "caregiver",
                "is_active": True,
            },
            {
                "username": "admin",
                "email": "admin@example.com",
                "password_hash": hash_password("123456"),
                "first_name": "Admin",
                "last_name": "System",
                "phone": "0833333333",
                "role": "admin",
                "is_active": True,
            },
        ]

        users = [User(**payload) for payload in demo_users]
        db.add_all(users)
        db.commit()

        family = db.query(User).filter(User.email == "family@example.com").first()
        caregiver = db.query(User).filter(User.email == "caregiver@example.com").first()
        admin = db.query(User).filter(User.email == "admin@example.com").first()

        elders = [
            Elder(
                user_id=family.id,
                first_name="สมใจ",
                last_name="ทนง",
                date_of_birth=date(1958, 5, 12),
                gender="female",
                phone="0844444444",
                address="Bangkok",
                emergency_contact="0899999999",
                relationship_type="daughter",
                medical_note="Needs monitoring for blood pressure.",
            ),
            Elder(
                user_id=family.id,
                first_name="วิชัย",
                last_name="ทองดี",
                date_of_birth=date(1952, 11, 4),
                gender="male",
                phone="0855555555",
                address="Nonthaburi",
                emergency_contact="0888888888",
                relationship_type="son",
                medical_note="Needs regular medication reminder.",
            ),
            Elder(
                user_id=family.id,
                first_name="กนก",
                last_name="รอดยิ่ง",
                date_of_birth=date(1960, 1, 22),
                gender="female",
                phone="0866666666",
                address="Pathum Thani",
                emergency_contact="0877777777",
                relationship_type="wife",
                medical_note="Monitor hydration and mobility.",
            ),
            Elder(
                user_id=family.id,
                first_name="ชวลิต",
                last_name="สวัสดิ์",
                date_of_birth=date(1949, 6, 15),
                gender="male",
                phone="0833333333",
                address="Samut Prakan",
                emergency_contact="0812121212",
                relationship_type="friend",
                medical_note="Needs checkup for dizziness.",
            ),
        ]
        db.add_all(elders)
        db.commit()

        elder_rows = db.query(Elder).all()
        for idx, elder in enumerate(elder_rows, start=1):
            db.add(
                HealthRecord(
                    elder_id=elder.id,
                    heart_rate=72 + idx,
                    systolic=118 + idx,
                    diastolic=76 + idx,
                    temperature=round(36.7 + (idx * 0.1), 1),
                    spo2=98,
                    blood_sugar=95 + idx,
                    weight=62.0 + idx,
                    sleep_hours=7.2,
                    activity=4200 + idx * 100,
                    created_at=datetime.utcnow() - timedelta(days=idx),
                )
            )

        caregiver_profile = Caregiver(
            user_id=caregiver.id,
            name="Caregiver A",
            role="caregiver",
            experience=5,
            location="Bangkok",
            hourly_rate=350,
            bio="Experienced caregiver for elderly care.",
            rating=4.8,
            verified=True,
        )
        db.add(caregiver_profile)
        db.commit()

        caregiver_profile = db.query(Caregiver).filter(Caregiver.user_id == caregiver.id).first()

        db.add_all(
            [
                CaregiverSkill(caregiver_id=caregiver_profile.id, skill="Elder Care"),
                CaregiverSkill(caregiver_id=caregiver_profile.id, skill="Medication"),
                CaregiverSkill(caregiver_id=caregiver_profile.id, skill="Daily Activity"),
            ]
        )

        partner = Partner(
            name="Bangkok Senior Clinic",
            type="clinic",
            address="Bangkok",
            phone="024444444",
            email="clinic@example.com",
            description="General elder care clinic",
            verified=True,
        )
        db.add(partner)
        db.commit()

        for elder in elder_rows:
            db.add(
                Booking(
                    elder_id=elder.id,
                    caregiver_id=caregiver_profile.id,
                    date=(datetime.utcnow() + timedelta(days=1)).date(),
                    start_time="09:00",
                    end_time="13:00",
                    service_type="elder_care",
                    note="General care support",
                    status="pending",
                )
            )
            db.add(
                Medication(
                    elder_id=elder.id,
                    name="Vitamin D",
                    dosage="1 tablet",
                    quantity=30,
                    time="08:00",
                    frequency="daily",
                    meal_instruction="After breakfast",
                    start_date=(datetime.utcnow() - timedelta(days=5)).date(),
                    end_date=(datetime.utcnow() + timedelta(days=20)).date(),
                    note="Continue as needed",
                )
            )
            db.add(
                Appointment(
                    elder_id=elder.id,
                    hospital_name="Bangkok General Hospital",
                    doctor_name="Dr. Somchai",
                    department="Cardiology",
                    appointment_date=(datetime.utcnow() + timedelta(days=7)).date(),
                    appointment_time="11:00",
                    reason="Routine checkup",
                    note="Bring blood pressure record",
                    status="upcoming",
                )
            )
            db.add(
                Referral(
                    elder_id=elder.id,
                    partner_id=partner.id,
                    reason="Routine health review",
                    symptoms="Light dizziness",
                    priority="medium",
                    consent=True,
                    status="new",
                )
            )
            db.add(
                HealthAlert(
                    elder_id=elder.id,
                    type="heart_rate",
                    title="Vital signs review",
                    message="Please monitor the elder's heart rate trend.",
                    severity="warning",
                    is_read=False,
                )
            )
            db.add(
                Notification(
                    user_id=family.id,
                    type="system",
                    title="Care update",
                    message=f"New update for {elder.first_name}",
                    is_read=False,
                )
            )

        now = datetime.utcnow()
        db.add_all(
            [
                Message(
                    sender_id=family.id,
                    recipient_id=caregiver.id,
                    content="สวัสดีค่ะ พรุ่งนี้สะดวกมาดูแลคุณแม่ตามเวลาเดิมไหมคะ",
                    is_read=True,
                    created_at=now - timedelta(hours=3),
                ),
                Message(
                    sender_id=caregiver.id,
                    recipient_id=family.id,
                    content="สะดวกค่ะ จะไปถึงประมาณ 9 โมงเช้าตามเดิมนะคะ",
                    is_read=True,
                    created_at=now - timedelta(hours=2, minutes=50),
                ),
                Message(
                    sender_id=family.id,
                    recipient_id=caregiver.id,
                    content="ขอบคุณค่ะ วันนี้คุณแม่ทานยาความดันตามเวลาไหมคะ",
                    is_read=False,
                    created_at=now - timedelta(minutes=20),
                ),
            ]
        )

        db.commit()
    finally:
        db.close()


def initialize_database() -> None:
    create_tables()
    if settings.SEED_DEMO_DATA:
        seed_demo_data()
