# Eldercare Tech — Phase 2 (Frontend + Backend)

แพลตฟอร์มดูแลผู้สูงอายุ — **“ดูแลคนที่คุณรัก แม้อยู่ไกลกัน”**

Phase 2 เชื่อม **Backend API จริงแล้ว** (FastAPI + SQLAlchemy + JWT
Authentication ที่มี refresh token + RBAC ต่อ endpoint, Real-time chat
ผ่าน WebSocket, ชำระเงินผ่าน PromptPay QR) ทุกหน้าของ dashboard เรียก
ข้อมูลจาก API แทน mock data เดิม — สมัครสมาชิกแล้วเพิ่ม/แก้/ลบข้อมูล
ของตัวเองได้ครบทุกหน้า (ผู้สูงอายุ สุขภาพ ยา นัดหมาย การจอง ผู้ดูแล
Partner Referral Review การแจ้งเตือน) ไม่ต้องพึ่งข้อมูล demo รองรับ
**Dark mode** ทั้งแอพ และมีหน้านโยบายความเป็นส่วนตัว +
ดาวน์โหลด/ลบข้อมูลของตัวเองได้ตาม PDPA ยังไม่มี IoT / Hospital API —
ดูหัวข้อ [Not in Phase 2](#not-in-phase-2)

สถาปัตยกรรมและ technology stack ของโปรเจคอยู่ที่
[`docs/microservices-architecture.md`](docs/microservices-architecture.md)
และ [`docs/technology-stack.md`](docs/technology-stack.md)

**Deploy ขึ้น production**: ดู [`docs/deployment.md`](docs/deployment.md)
— ตอนนี้ Vercel deploy เฉพาะ frontend อัตโนมัติ **backend ยังไม่ได้
deploy** ทำให้เว็บที่ deploy แล้วขึ้น "Failed to fetch" ตอน login
จนกว่าจะทำตามขั้นตอนใน doc นี้

## Tech Stack

**Frontend**
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Lucide React (icons)
- Recharts (chart)
- Noto Sans Thai + Inter (fonts, via `next/font/google`)

**Backend**
- FastAPI + Uvicorn (ASGI server)
- SQLAlchemy 2.0 (ORM)
- Pydantic v2 (schema validation)
- python-jose (JWT, access + rotating single-use refresh tokens) + passlib/bcrypt (password hashing)
- FastAPI WebSocket (real-time chat, `/api/ws/messages`)
- `qrcode` + Pillow (PromptPay QR generation — pure-Python, no payment gateway/API key needed)
- SQLite (local dev, default) / MySQL 8.0 (ผ่าน docker-compose) / PostgreSQL (production บน Render) — `DATABASE_URL` เลือกได้ทั้งสามแบบ

**Infra / Testing**
- Docker + docker-compose (backend API + MySQL)
- Playwright (E2E test)
- pytest + httpx (backend unit/integration test, `backend/tests/`)

## Folder Structure

```text
eldercare-tech/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                      # Landing page (/) — real data when logged in
│   ├── login/page.tsx                # /login — เรียก API จริง
│   ├── register/page.tsx             # /register — เรียก API จริง, auto-login หลังสมัคร
│   ├── privacy/page.tsx              # /privacy — นโยบายความเป็นส่วนตัว (PDPA)
│   └── dashboard/
│       ├── layout.tsx                # Sidebar + Header + auth guard
│       ├── page.tsx                  # /dashboard — onboarding ถ้ายังไม่มีผู้สูงอายุ
│       ├── elders/ · caregivers/ · bookings/
│       ├── health/ · medications/ · appointments/
│       ├── partners/ · referrals/ · reviews/
│       ├── notifications/ · messages/
│       └── users/ · settings/        # settings: เปลี่ยนรหัสผ่าน, export/ลบบัญชี (PDPA)
├── components/
│   ├── Modal.tsx                     # modal กลางที่ทุกหน้าใช้ร่วมกันสำหรับฟอร์ม CRUD
│   ├── PhotoUpload.tsx               # อัปโหลดรูปโปรไฟล์ (ผู้สูงอายุ/ผู้ดูแล)
│   ├── LandingElderPreview.tsx       # การ์ดตัวอย่าง/ข้อมูลจริงบนหน้าแรก
│   └── ...                           # cards, charts, badges ฯลฯ
├── data/mockData.ts                  # mock data เดิม (ไม่ได้ใช้แล้วในหน้า dashboard)
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI entrypoint + CORS (ALLOWED_ORIGINS)
│   │   ├── core/                     # config (env-based, production guard), database, security, permissions, init_db (seed data)
│   │   ├── models/                   # SQLAlchemy models (13 domains + refresh tokens)
│   │   ├── schemas/                  # Pydantic schemas
│   │   └── routers/                  # API routers (auth incl. data export/delete, users, elders, messages (+ WebSocket), payments, uploads, ...)
│   ├── tests/                        # pytest suite
│   ├── requirements.txt
│   └── Dockerfile
├── docs/
│   ├── microservices-architecture.md
│   ├── technology-stack.md
│   └── deployment.md                 # Render (backend+Postgres) + Vercel (frontend) steps
├── tests/e2e/playwright-e2e.spec.ts
├── docker-compose.yml                # api + mysql
├── render.yaml                       # Render Blueprint: backend + PostgreSQL
├── .env.example
└── README.md
```

## Run

### Quick start (แนะนำ) — รันทั้งระบบด้วยคำสั่งเดียว

```bash
./dev.sh
```

สคริปต์นี้จะสร้าง Python venv + `npm install` ให้อัตโนมัติในครั้งแรก
แล้วรัน backend (port 8000) และ frontend (port 3000) พร้อมกัน กด
`Ctrl+C` เพื่อหยุดทั้งคู่ วิธีนี้ช่วยกัน error "Failed to fetch" ที่
เกิดจากลืมเปิด backend ก่อนเข้าใช้เว็บ

ถ้าอยากรันแยกเพื่อดู log แต่ละฝั่ง หรือ debug เฉพาะจุด ใช้ขั้นตอน
ด้านล่างแทนได้

### 1. Backend (FastAPI)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

ค่า default ใช้ SQLite (`backend/eldercare.db`) ตามที่ตั้งไว้ใน `.env` —
ไม่ต้องรัน MySQL ก็ใช้งาน backend ได้ทันทีตอน dev ฐานข้อมูลจะถูกสร้าง
และ seed demo users ให้อัตโนมัติตอน startup (`init_db.py`)

เปิดดู API docs ได้ที่ [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend (Next.js)

```bash
npm install
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

> Frontend อ่าน backend URL จาก `NEXT_PUBLIC_API_BASE_URL` (ดูตัวอย่างใน
> `.env.example`) ค่า default คือ `http://localhost:8000`

### 3. (ทางเลือก) รันทั้งระบบด้วย Docker — backend + MySQL

```bash
docker compose up --build
```

จะรัน FastAPI (port 8000) + MySQL 8.0 (port 3306) ให้ แล้วค่อยรัน
`npm run dev` แยกสำหรับ frontend ตามปกติ

### 4. Backend unit test (pytest)

```bash
cd backend
source .venv/bin/activate
pip install -r requirements-dev.txt   # pytest + httpx (ครั้งแรกครั้งเดียว)
pytest
```

รันกับ SQLite in-memory แยกต่างหาก ไม่แตะฐานข้อมูล dev จริง
(`backend/eldercare.db`) หรือ MySQL เลย — ครอบคลุม auth (รวม regression
test ของช่องโหว่ role="admin" ที่เคยเจอ), refresh token rotation,
permission ต่อ role (`can_access_elder`), RBAC ของ elders/caregivers
endpoint, payment/PromptPay, และการตรวจสอบไฟล์อัปโหลด

## Deploy ขึ้น production

ขั้นตอนละเอียดอยู่ที่ [`docs/deployment.md`](docs/deployment.md) สรุปสั้นๆ:

1. **Backend → Render**: กด New → Blueprint → เลือก repo นี้ Render
   จะอ่าน [`render.yaml`](render.yaml) แล้วสร้างทั้ง backend service
   และฐานข้อมูล PostgreSQL ให้อัตโนมัติ (`SECRET_KEY` สุ่มให้เองแบบ
   ปลอดภัย ไม่ใช้ placeholder)
2. **Frontend → Vercel**: ตั้ง env var `NEXT_PUBLIC_API_BASE_URL` เป็น
   URL ของ Render ที่ได้จากข้อ 1 (เช่น
   `https://eldercare-tech-api.onrender.com`) ที่ Vercel → Settings →
   Environment Variables แล้ว **Redeploy** (ค่า `NEXT_PUBLIC_*` ถูกฝัง
   ตอน build ไม่ใช่ runtime — ตั้งค่าเฉยๆ ไม่พอ ต้อง build ใหม่)
3. **CORS**: ถ้า frontend ใช้โดเมนอื่นนอกจาก
   `https://eldercare-tech.vercel.app` ให้ตั้ง `ALLOWED_ORIGINS` ที่
   Render service ให้ตรงกับโดเมนจริง (ดูรายละเอียดใน deployment doc)

## Demo Login (บัญชีจริง ผ่าน JWT Authentication)

| Role      | Email                | Password |
| --------- | --------------------- | -------- |
| Family    | family@example.com    | 123456   |
| Caregiver | caregiver@example.com | 123456   |
| Admin     | admin@example.com     | 123456   |

บัญชีเหล่านี้ถูก seed อัตโนมัติตอน backend startup ครั้งแรก (ดู
`backend/app/core/init_db.py`) คลิกบัญชีใดก็ได้ในหน้า `/login` เพื่อ
autofill ฟอร์ม — การ login เรียก `/api/auth/login` จริงและได้ JWT
access token กลับมาเก็บใน `localStorage`

## Test Checklist

- [x] Landing Page เปิดได้
- [x] Navbar ทำงาน (desktop + mobile hamburger)
- [x] Login / Register เรียก API จริง ไม่ใช่ mock
- [x] Dashboard มี auth guard (redirect ไป `/login` ถ้าไม่มี token)
- [x] ทุกหน้า dashboard (elders, caregivers, bookings, health,
      medications, appointments, partners, referrals, reviews,
      notifications, users, settings) ดึงข้อมูลจาก backend จริง และมี
      **CRUD ครบ** (เพิ่มผ่าน modal, แก้ไข, ลบพร้อม confirm, loading/empty
      state, validation) ไม่ใช่แค่แสดงผลอย่างเดียวอีกต่อไป
- [x] หน้าแรก (`/`) และ dashboard หลัก (`/dashboard`) ใช้ข้อมูลจริงของ
      ผู้ใช้ที่ login อยู่ — การ์ดตัวอย่างบนหน้าแรกติดป้าย "ตัวอย่าง"
      ชัดเจนเมื่อยังไม่ login; ผู้ใช้ใหม่ที่ยังไม่มีผู้สูงอายุจะเห็นหน้า
      "เพิ่มผู้สูงอายุคนแรก" แทนข้อมูลปลอม
- [x] กราฟแนวโน้มสุขภาพ (`HealthChart`) คำนวณจากข้อมูลจริงทั้งหมดแล้ว
      ไม่ใช้ mock data อีกต่อไป
- [x] หน้า "ข้อความ" เป็น real-time chat จริงผ่าน WebSocket (ไม่ใช่
      placeholder แล้ว) — ส่ง/รับข้อความสดโดยไม่ต้อง refresh
- [x] RBAC ต่อ endpoint (family/caregiver/nurse/admin เห็น/แก้ข้อมูล
      ตามสิทธิ์จริง ไม่ใช่แค่ login แล้วเข้าถึงได้หมด)
- [x] Refresh token หมุนเวียนอัตโนมัติ ไม่ต้อง login ใหม่บ่อยๆ
- [x] ชำระเงินผ่าน PromptPay QR ในหน้า "การจอง" — คำนวณยอดจาก
      hourly_rate ของผู้ดูแล × ระยะเวลา สร้าง QR code จริง
      (EMV QR / BOT PromptPay spec) ยืนยันการชำระแบบ demo (ไม่ได้ต่อ
      ธนาคารจริง ไม่มี merchant account)
- [x] Dark mode / Light mode สลับได้ทั้งแอพ (ปุ่มที่ navbar หน้าแรก,
      หน้า login/register, header ของ dashboard) จำค่าไว้ใน
      localStorage และตามค่า OS ถ้ายังไม่เคยเลือกเอง
- [x] Health Cards + Chart แสดงผล (วันนี้ / 7 วัน / 30 วัน)
- [x] อัปโหลดรูปโปรไฟล์จริงได้ ทั้งผู้สูงอายุ (หน้า "ผู้สูงอายุ") และ
      ผู้ดูแล (หน้า "ผู้ดูแล" เฉพาะโปรไฟล์ตัวเอง) — เก็บไฟล์จริงที่ backend
      (`backend/uploads/`) ไม่ใช่ URL ปลอม แสดงผลทันทีทุกจุดที่มีรูป
      (การ์ด dashboard, รายการผู้ดูแล)
- [x] PDPA: หน้า [`/privacy`](app/privacy/page.tsx) อธิบายนโยบายครบถ้วน;
      หน้า "ตั้งค่า" มีปุ่มดาวน์โหลดข้อมูลของตัวเองเป็น JSON
      (`GET /api/auth/me/export`) และลบบัญชีถาวรพร้อมข้อมูลที่เกี่ยวข้อง
      ทั้งหมด (`DELETE /api/auth/me`, ต้องยืนยันรหัสผ่าน)
- [x] Backend พร้อม production: อ่าน `ALLOWED_ORIGINS` สำหรับ CORS,
      รองรับ PostgreSQL (`postgres://` แปลงเป็น `postgresql://`
      อัตโนมัติ), seed demo data เฉพาะตอน `SEED_DEMO_DATA=true`,
      ปฏิเสธการสตาร์ทถ้า `ENVIRONMENT=production` แต่ `SECRET_KEY` ยัง
      เป็นค่า default, ไม่มี bcrypt version warning แล้ว
- [x] Responsive (Desktop / Tablet / Mobile)
- [x] ไม่มี Console Error
- [x] Playwright E2E ครอบคลุม login → dashboard → CRUD พื้นฐาน
- [x] Backend unit test (pytest) — 53 tests ครอบคลุม auth/RBAC/refresh
      token rotation/permissions/payment/upload validation/production
      config guard/PDPA export & delete
      (`cd backend && source .venv/bin/activate && pytest`)
- [x] ทดสอบ deploy จริงกับ MySQL ผ่าน docker-compose — รันจริงแล้ว
      (`docker compose up --build`), ยืนยันตาราง + seed data อยู่ใน MySQL
      จริง (ไม่ใช่ fallback SQLite) และ login/CRUD/อัปโหลดรูปทำงานผ่าน
      browser จริงกับ backend ที่ต่อ MySQL

## Not in Phase 2

❌ IoT device sync · ❌ Hospital API integration

**ข้อจำกัดที่ควรรู้:**
- WebSocket chat ใช้ in-memory connection registry ต่อ process เดียว —
  รองรับ local/dev ได้สบาย แต่ถ้า deploy จริงแบบหลาย worker ต้องมี
  pub/sub (เช่น Redis) มาช่วยกระจายข้อความข้าม process
- Payment เป็น QR จริงตาม PromptPay spec (สแกนได้ด้วยแอปธนาคารจริง)
  แต่ **ไม่มี merchant account/webhook จากธนาคาร** — การ "ยืนยันชำระเงิน"
  เป็นปุ่มที่ผู้จ่ายกดเอง (demo) ไม่ใช่การยืนยันจากธนาคารจริง ถ้าจะใช้งาน
  จริงต้องต่อผ่าน payment gateway (เช่น Omise, 2C2P) ที่มี webhook
  ยืนยันธุรกรรม
