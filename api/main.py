import os
from fastapi import FastAPI, HTTPException, Request, Response
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

@app.delete("/profiles/{profile_id}", response_model=schemas.Profile)
def delete_profile(profile_id: int, request: Request):
    db: Session = request.state.db
    db_profile = crud.get_profile(db, profile_id=profile_id)
    if db_profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return crud.delete_profile(db=db, profile_id=profile_id)
