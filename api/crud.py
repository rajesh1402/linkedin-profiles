from sqlalchemy.orm import Session
import models
import schemas

def get_profile(db: Session, profile_id: int):
    return db.query(models.Profile).filter(models.Profile.id == profile_id).first()

def get_profile_by_url(db: Session, url: str):
    return db.query(models.Profile).filter(models.Profile.url == url).first()

def get_profiles(db: Session):
    return db.query(models.Profile).order_by(models.Profile.id).all()

def create_profile(db: Session, profile: schemas.ProfileCreate):
    db_profile = models.Profile(**profile.dict())
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

def delete_profile(db: Session, profile_id: int):
    db_profile = get_profile(db, profile_id)
    if db_profile:
        db.delete(db_profile)
        db.commit()
    return db_profile

def update_profile_notes(db: Session, profile_id: int, notes: str):
    profile = get_profile(db, profile_id)
    if profile is None:
        return None
    profile.notes = notes
    db.commit()
    db.refresh(profile)
    return profile
