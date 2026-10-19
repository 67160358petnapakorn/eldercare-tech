from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.init_db import initialize_database
from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.users import router as user_router
from app.routers.elders import router as elder_router
from app.routers.caregivers import router as caregiver_router
from app.routers.bookings import router as booking_router
from app.routers.health import router as health_router
from app.routers.medications import router as medication_router
from app.routers.appointments import router as appointment_router
from app.routers.partners import router as partner_router
from app.routers.referrals import router as referral_router
from app.routers.reviews import router as review_router
from app.routers.notifications import router as notification_router
from app.routers.messages import router as message_router
from app.routers.payments import router as payment_router

app = FastAPI(
    title="Eldercare Tech API",
    version="1.0.0",
    description="Backend API for eldercare service platform",
)

app.add_middleware(
    CORSMiddleware,
    # Local dev frontends can land on any port (Next.js auto-increments
    # when 3000 is busy) and on localhost/127.0.0.1/0.0.0.0, PLUS the
    # Vercel-hosted frontend (production + any preview deployment, which
    # Vercel names like eldercare-tech-<hash>.vercel.app or
    # eldercare-tech-git-<branch>-<user>.vercel.app) — a fixed allow_origins
    # list silently 400s the CORS preflight the moment the origin isn't an
    # exact match, which surfaces in the browser as a generic
    # "Failed to fetch". Match any of these origins instead.
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|0\.0\.0\.0):\d+|https://eldercare-tech(-[a-z0-9-]+)?\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    initialize_database()


app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(user_router)
app.include_router(elder_router)
app.include_router(caregiver_router)
app.include_router(booking_router)
app.include_router(health_router)
app.include_router(medication_router)
app.include_router(appointment_router)
app.include_router(partner_router)
app.include_router(referral_router)
app.include_router(review_router)
app.include_router(notification_router)
app.include_router(message_router)
app.include_router(payment_router)


@app.get("/")
def root():
    return {"message": "Eldercare Tech API", "version": "1.0.0"}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
