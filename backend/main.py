from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.db import engine, Base
from app.routes import users, fitness, nutrition, body_stats, summary

# Create database tables
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    pass

app = FastAPI(
    title="Lifelog API",
    description="Fitness and nutrition tracking API for busy professionals",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(fitness.router, prefix="/api/fitness", tags=["fitness"])
app.include_router(nutrition.router, prefix="/api/nutrition", tags=["nutrition"])
app.include_router(body_stats.router, prefix="/api/body", tags=["body-stats"])
app.include_router(summary.router, prefix="/api/summary", tags=["summary"])

@app.get("/")
async def root():
    return {"message": "Lifelog API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
