# Microservices Architecture — Eldercare Tech

อ้างอิงแนวคิดจากตัวอย่าง Netflix microservices
(<https://dev.to/somadevtoo/10-things-you-can-learn-from-netflixs-architecture-1bnn>)

## สถานะปัจจุบันของโปรเจค (ข้อเท็จจริง)

ระบบที่ implement จริงใน repo นี้ตอนนี้เป็น **monolith** ไม่ใช่ microservices:

- Frontend: Next.js app เดียว (`app/`)
- Backend: FastAPI app เดียว (`backend/app/main.py`) ที่รวม 12 routers
  (auth, users, elders, caregivers, bookings, health, medications,
  appointments, partners, referrals, reviews, notifications) ไว้ใน
  process เดียว, ต่อ database เดียว (SQLite ตอน dev / MySQL ตอน prod
  ผ่าน `docker-compose.yml`)

ไดอะแกรมด้านล่างคือ **แผนออกแบบ (proposed design)** ว่าถ้าจะแตกระบบนี้
เป็น microservices จริง ควรแบ่ง service ตามขอบเขตธุรกิจ (bounded
context) อย่างไร โดย map 1:1 กับ router ที่มีอยู่แล้ว เพื่อให้เห็น
เส้นทางการ migrate จาก monolith → microservices ในอนาคต

## Diagram

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        WEB["Next.js Web App<br/>(React + TypeScript)"]
    end

    subgraph Gateway["API Gateway"]
        GW["API Gateway / BFF<br/>(routing, JWT validation, rate limiting)"]
    end

    subgraph Services["Microservices (แยกตาม bounded context)"]
        AUTH["Auth Service<br/>login / register / JWT"]
        USER["User Service"]
        ELDER["Elder Profile Service"]
        CARE["Caregiver Service"]
        BOOK["Booking Service"]
        HEALTH["Health Monitoring Service"]
        MED["Medication Service"]
        APPT["Appointment Service"]
        PARTNER["Partner Service"]
        REF["Referral Service"]
        REVIEW["Review Service"]
        NOTIF["Notification Service"]
    end

    subgraph Data["Database per Service"]
        AUTH_DB[(Auth DB)]
        USER_DB[(User DB)]
        ELDER_DB[(Elder DB)]
        CARE_DB[(Caregiver DB)]
        BOOK_DB[(Booking DB)]
        HEALTH_DB[(Health DB)]
        MED_DB[(Medication DB)]
        APPT_DB[(Appointment DB)]
        PARTNER_DB[(Partner DB)]
        REF_DB[(Referral DB)]
        REVIEW_DB[(Review DB)]
        NOTIF_DB[(Notification DB)]
    end

    subgraph Async["Event Bus (Async)"]
        MQ["Message Broker<br/>RabbitMQ / Kafka"]
    end

    subgraph External["External Integrations (อนาคต)"]
        PAY["Payment Gateway"]
        HOSP["Hospital API"]
        IOT["IoT Health Devices"]
    end

    WEB --> GW
    GW --> AUTH & USER & ELDER & CARE & BOOK & HEALTH & MED & APPT & PARTNER & REF & REVIEW & NOTIF

    AUTH --> AUTH_DB
    USER --> USER_DB
    ELDER --> ELDER_DB
    CARE --> CARE_DB
    BOOK --> BOOK_DB
    HEALTH --> HEALTH_DB
    MED --> MED_DB
    APPT --> APPT_DB
    PARTNER --> PARTNER_DB
    REF --> REF_DB
    REVIEW --> REVIEW_DB
    NOTIF --> NOTIF_DB

    BOOK -. event .-> MQ
    HEALTH -. event .-> MQ
    MED -. event .-> MQ
    APPT -. event .-> MQ
    MQ -. consume .-> NOTIF

    BOOK -.->|payment| PAY
    HEALTH -.->|vitals sync| IOT
    APPT -.->|referral record| HOSP
```

## Mapping service ↔ โค้ดปัจจุบัน

| Proposed Service | โค้ดปัจจุบัน (monolith) |
| --- | --- |
| Auth Service | `backend/app/routers/auth.py`, `core/security.py` |
| User Service | `backend/app/routers/users.py` |
| Elder Profile Service | `backend/app/routers/elders.py` |
| Caregiver Service | `backend/app/routers/caregivers.py` |
| Booking Service | `backend/app/routers/bookings.py` |
| Health Monitoring Service | `backend/app/routers/health.py` |
| Medication Service | `backend/app/routers/medications.py` |
| Appointment Service | `backend/app/routers/appointments.py` |
| Partner Service | `backend/app/routers/partners.py` |
| Referral Service | `backend/app/routers/referrals.py` |
| Review Service | `backend/app/routers/reviews.py` |
| Notification Service | `backend/app/routers/notifications.py` |

## เหตุผลที่ยังไม่แตกเป็น microservices จริงในเฟสนี้

- ขนาดทีม/ขอบเขตงานยังเล็ก (project การศึกษา) — monolith ดูแลง่ายกว่า
  และ deploy ง่ายกว่าในช่วง MVP
- ยังไม่มี load เพียงพอที่ทำให้ต้อง scale แต่ละ domain แยกกัน
- การแตก microservices เพิ่ม operational overhead (service discovery,
  distributed tracing, data consistency ข้าม service) ซึ่งเกินความ
  จำเป็นของ Phase ปัจจุบัน

แผนนี้จึงเป็น target architecture สำหรับ Phase ต่อไปถ้าระบบขยายใหญ่ขึ้น
