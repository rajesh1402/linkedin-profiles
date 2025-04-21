from sqlalchemy import Column, Integer, String
from database import Base

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    headline = Column(String, nullable=False)
    url = Column(String, unique=True, nullable=False)
    current_title = Column(String, nullable=False)
    location = Column(String, nullable=False)
    profile_pic = Column(String, nullable=True)
    about = Column(String, nullable=True)
    notes = Column(String, nullable=True)

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    industry = Column(String, nullable=True)
    location = Column(String, nullable=True)
    website = Column(String, nullable=True)
    linkedin_url = Column(String, unique=True, nullable=False)
    profile_pic = Column(String, nullable=True)
    about = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    date_saved = Column(String, nullable=True)
