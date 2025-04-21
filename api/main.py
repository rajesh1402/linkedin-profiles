import os
from fastapi import FastAPI, HTTPException, Request, Response, Body, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse
from dotenv import load_dotenv

import models
import schemas
import crud
from database import SessionLocal, engine

load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to ["https://www.linkedin.com"] for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    response = JSONResponse({"detail": "Internal server error"}, status_code=500)
    try:
        request.state.db = SessionLocal()
        response = await call_next(request)
    finally:
        request.state.db.close()
    return response

@app.post("/profiles", response_model=schemas.Profile)
def create_profile(profile: schemas.ProfileCreate, request: Request):
    db: Session = request.state.db
    db_profile = crud.get_profile_by_url(db, url=profile.url)
    if db_profile:
        raise HTTPException(status_code=409, detail="Profile already exists")
    return crud.create_profile(db=db, profile=profile)

@app.get("/profiles", response_model=list[schemas.Profile])
def read_profiles(request: Request):
    db: Session = request.state.db
    return crud.get_profiles(db)

@app.get("/profiles/by_url", response_model=schemas.Profile)
def get_profile_by_url(url: str, request: Request):
    db: Session = request.state.db
    db_profile = crud.get_profile_by_url(db, url=url)
    if db_profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return db_profile

@app.delete("/profiles/{profile_id}", response_model=schemas.Profile)
def delete_profile(profile_id: int, request: Request):
    db: Session = request.state.db
    db_profile = crud.get_profile(db, profile_id=profile_id)
    if db_profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return crud.delete_profile(db=db, profile_id=profile_id)

@app.patch("/profiles/{profile_id}", response_model=schemas.Profile)
def update_profile(profile_id: int, data: schemas.ProfileUpdate = Body(...), request: Request = None):
    db: Session = request.state.db
    db_profile = crud.get_profile(db, profile_id=profile_id)
    if db_profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    # Only update notes if provided
    notes = data.notes
    if notes is not None:
        db_profile = crud.update_profile_notes(db, profile_id, notes)
    return db_profile

# --- Company Endpoints ---
@app.post("/companies", response_model=schemas.Company, status_code=status.HTTP_201_CREATED)
def create_company(company: schemas.CompanyCreate, request: Request):
    db: Session = request.state.db
    db_company = crud.get_company_by_url(db, url=company.linkedin_url)
    if db_company:
        raise HTTPException(status_code=409, detail="Company already exists")
    return crud.create_company(db=db, company=company)

@app.get("/companies", response_model=list[schemas.Company])
def read_companies(request: Request):
    db: Session = request.state.db
    return crud.get_companies(db)

@app.get("/companies/{company_id}", response_model=schemas.Company)
def get_company(company_id: int, request: Request):
    db: Session = request.state.db
    db_company = crud.get_company(db, company_id=company_id)
    if db_company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    return db_company

@app.patch("/companies/{company_id}", response_model=schemas.Company)
def update_company(company_id: int, company: dict = Body(...), request: Request = None):
    db: Session = request.state.db
    db_company = crud.update_company(db, company_id=company_id, company_data=company)
    if db_company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    return db_company

@app.delete("/companies/{company_id}", response_model=schemas.Company)
def delete_company(company_id: int, request: Request):
    db: Session = request.state.db
    db_company = crud.delete_company(db, company_id=company_id)
    if db_company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    return db_company
