from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, Float, Date, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from datetime import date
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://user:password@localhost/weightdb")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI(title="Weight Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WeightEntry(Base):
    __tablename__ = "weight_entries"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    weight = Column(Float, nullable=False)
    note = Column(String, nullable=True)

Base.metadata.create_all(bind=engine)

class WeightEntryCreate(BaseModel):
    date: date
    weight: float
    note: str = ""

class WeightEntryResponse(WeightEntryCreate):
    id: int
    class Config:
        from_attributes = True

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "Weight Tracker API is running"}

@app.get("/api/entries", response_model=list[WeightEntryResponse])
def get_entries(db: Session = Depends(get_db)):
    return db.query(WeightEntry).order_by(WeightEntry.date.desc()).all()

@app.post("/api/entries", response_model=WeightEntryResponse)
def create_entry(entry: WeightEntryCreate, db: Session = Depends(get_db)):
    db_entry = WeightEntry(**entry.dict())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.delete("/api/entries/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(WeightEntry).filter(WeightEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Entry deleted"}
