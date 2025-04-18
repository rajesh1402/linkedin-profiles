import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models

load_dotenv()

def truncate():
    db: Session = SessionLocal()
    db.query(models.Profile).delete()
    db.commit()
    db.close()

if __name__ == "__main__":
    truncate()
