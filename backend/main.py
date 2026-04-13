from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from models.database import Base, engine
from routers import auth, chat, appointments
from routers.advice import router as health_router
from config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Refuse to start with a missing or placeholder SECRET_KEY
    settings.validate_secrets()
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Health Buddy API",
    description="AI-Powered Healthcare Assistant Backend",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
)

_extra_origin = getattr(settings, "FRONTEND_URL", None)
ALLOWED_ORIGINS = ["http://localhost:3000"]
if _extra_origin and _extra_origin not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append(_extra_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(appointments.router)
app.include_router(health_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Health Buddy API"}