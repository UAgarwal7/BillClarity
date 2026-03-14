# BillClarity Backend

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db.connection import connect_db, close_db
from routers import bills, analysis, appeal_packets, calls, demo


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="BillClarity API",
    description="AI Medical Bill Intelligence + Dispute Automation",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(bills.router, prefix="/api/bills", tags=["bills"])
app.include_router(analysis.router, prefix="/api/bills", tags=["analysis"])
app.include_router(appeal_packets.router, prefix="/api", tags=["appeal-packets"])
app.include_router(calls.router, prefix="/api/calls", tags=["calls"])
app.include_router(demo.router, prefix="/api/demo", tags=["demo"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}
