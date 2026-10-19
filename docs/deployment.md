# Deploy to production — Render (backend) + Vercel (frontend)

ตอนนี้ Vercel deploy แค่ฝั่ง **frontend** อัตโนมัติจาก GitHub ส่วน
**backend ยังไม่เคย deploy ที่ไหนเลย** — รันอยู่แค่ในเครื่อง dev เท่านั้น
นี่คือสาเหตุที่ `https://eldercare-tech.vercel.app/login` ขึ้น
"Failed to fetch": ตอน build ไม่มี `NEXT_PUBLIC_API_BASE_URL` ให้ โค้ดเลย
fallback ไปเรียก `http://localhost:8000` ซึ่งหมายถึงเครื่องของคนเข้าเว็บ
เอง ไม่ใช่ server ของเรา

ทำตามขั้นตอนนี้ทีละข้อเพื่อแก้ให้ใช้งานได้จริง

## 1. Deploy backend ไปที่ Render

1. ไปที่ [render.com](https://render.com) สมัคร/login ด้วย GitHub
2. กด **New +** → **Blueprint**
3. เลือก repo `eldercare-tech` — Render จะเจอไฟล์ `render.yaml` ที่
   root ของ repo นี้เองและตั้งค่าทุกอย่างให้อัตโนมัติ (รวมถึง
   `SECRET_KEY` ที่สุ่มสร้างให้ปลอดภัย ไม่ใช่ placeholder เดิม)
4. กด **Apply** แล้วรอ build (ใช้ `backend/Dockerfile` ที่มีอยู่แล้ว)
5. เมื่อ deploy สำเร็จ จะได้ URL แบบ
   `https://eldercare-tech-api.onrender.com` — **คัดลอก URL นี้ไว้**

> **ข้อควรรู้**: free tier ของ Render ใช้ disk แบบ ephemeral —
> ข้อมูลใน SQLite จะรีเซ็ตทุกครั้งที่ deploy ใหม่หรือ service restart
> (เช่น หลัง sleep จาก inactivity) แต่ไม่ต้องกังวลเรื่อง demo login
> เพราะ `init_db.py` seed บัญชี demo ให้อัตโนมัติทุกครั้งที่ฐานข้อมูล
> ว่างอยู่แล้ว ถ้าต้องการข้อมูลถาวรจริงๆ ค่อยย้ายไปใช้ Render
> PostgreSQL (ต้องแก้ `DATABASE_URL` และเพิ่ม `psycopg2-binary` ใน
> `requirements.txt`)

## 2. ตั้งค่า Vercel ให้รู้จัก backend URL

1. ไปที่ Vercel dashboard → โปรเจค `eldercare-tech` → **Settings** →
   **Environment Variables**
2. เพิ่มตัวแปรใหม่:
   - Key: `NEXT_PUBLIC_API_BASE_URL`
   - Value: URL จาก Render ขั้นตอนที่แล้ว (เช่น
     `https://eldercare-tech-api.onrender.com`) — **ห้ามมี `/` ปิดท้าย**
   - Environment: เลือกทั้ง Production และ Preview
3. ไปที่แท็บ **Deployments** → กด **...** ที่ deployment ล่าสุด →
   **Redeploy**

> **สำคัญ**: `NEXT_PUBLIC_*` env vars ของ Next.js ถูกฝังเข้าโค้ดตอน
> **build** ไม่ใช่ตอน runtime — แค่ตั้งค่าใน Vercel เฉยๆ ไม่พอ ต้อง
> trigger build ใหม่เสมอ (Redeploy หรือ push commit ใหม่) ค่าถึงจะมีผล

## 3. ทดสอบ

เปิด `https://eldercare-tech.vercel.app/login` แล้วลอง login ด้วย
demo account — เปิด DevTools → Network tab เช็คว่า request ไปที่ URL
ของ Render (ไม่ใช่ `localhost:8000` อีกแล้ว)

ถ้ายังเจอ "Failed to fetch": เช็คว่า Render service สถานะ "Live"
(ไม่ใช่ sleep/crashed), เช็ค CORS error ใน Console (backend
`main.py` อนุญาต origin `https://eldercare-tech*.vercel.app` ไว้แล้ว
— ถ้า Vercel project ใช้ domain อื่น ต้องเพิ่ม origin นั้นเข้า regex ด้วย)
