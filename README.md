# Eldercare Tech — Phase 1 (Frontend UI)

แพลตฟอร์มดูแลผู้สูงอายุ — **“ดูแลคนที่คุณรัก แม้อยู่ไกลกัน”**

Phase 1 นี้เป็น **Frontend UI เท่านั้น** ใช้ Mock Data ทั้งหมด ยังไม่มี Backend / Database / Prisma / API จริง

## Tech Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Lucide React (icons)
- Recharts (chart)
- Noto Sans Thai + Inter (fonts, via `next/font/google`)

## Project Setup

```bash
npx create-next-app@latest eldercare-tech --typescript --tailwind --app
cd eldercare-tech
npm install lucide-react recharts
```

> โปรเจกต์นี้ถูกสร้างไว้ให้แล้วตามโครงสร้างด้านล่าง เพียง `npm install` แล้ว `npm run dev` ได้ทันที

## Folder Structure

```text
eldercare-tech/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                 # Landing page (/)
│   ├── login/page.tsx           # /login
│   ├── register/page.tsx        # /register
│   └── dashboard/
│       ├── layout.tsx           # Sidebar + Header shell
│       └── page.tsx             # /dashboard
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── Sidebar.tsx
│   ├── DashboardCard.tsx
│   ├── HealthCard.tsx
│   ├── HealthChart.tsx
│   ├── MedicationCard.tsx
│   ├── AppointmentCard.tsx
│   ├── CaregiverCard.tsx
│   ├── HealthAlert.tsx
│   └── StatusBadge.tsx
├── data/
│   └── mockData.ts              # All mock data (elder, health, meds, appointments, caregiver, notifications)
├── public/images/
├── package.json
└── README.md
```

## Run

```bash
npm install
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

## Demo Login (Mock only, no real auth)

| Role      | Email                                            | Password |
| --------- | ------------------------------------------------- | -------- |
| Family    | family@example.com                                 | 123456   |
| Caregiver | caregiver@example.com                              | 123456   |
| Admin     | admin@example.com                                  | 123456   |

Clicking any demo account on `/login` autofills the form. Submitting the form redirects straight to `/dashboard` — no real authentication is performed in Phase 1.

## Test Checklist

- [x] Landing Page เปิดได้
- [x] Navbar ทำงาน (desktop + mobile hamburger)
- [x] Login เปิดได้
- [x] Register เปิดได้
- [x] Dashboard เปิดได้
- [x] Sidebar ทำงาน (desktop fixed + mobile drawer)
- [x] Health Cards แสดง
- [x] Chart แสดง (วันนี้ / 7 วัน / 30 วัน)
- [x] Medication แสดง
- [x] Appointment แสดง
- [x] Caregiver แสดง
- [x] Responsive (Desktop / Tablet / Mobile)
- [x] ไม่มี Console Error

## Not in Phase 1

❌ Database · ❌ Prisma · ❌ MySQL · ❌ Backend API · ❌ Payment · ❌ Real Authentication · ❌ WebSocket · ❌ IoT · ❌ Hospital API

รอคำสั่ง **"ทำ Phase 2 ต่อ"** เพื่อเชื่อมต่อ Backend
