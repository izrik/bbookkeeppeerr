from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api import auth, accounts, ledger

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="bbookkeeppeerr API",
    description="Bookkeeping and accounting system API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(ledger.router)


@app.get("/")
def read_root():
    return {"message": "bbookkeeppeerr API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}