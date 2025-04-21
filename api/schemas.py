from pydantic import BaseModel

class ProfileBase(BaseModel):
    name: str
    headline: str
    url: str
    current_title: str
    location: str
    profile_pic: str | None = None
    about: str | None = None
    notes: str | None = None

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(BaseModel):
    notes: str | None = None

class Profile(ProfileBase):
    id: int

    class Config:
        orm_mode = True

class CompanyBase(BaseModel):
    name: str
    industry: str | None = None
    location: str | None = None
    website: str | None = None
    linkedin_url: str
    profile_pic: str | None = None
    about: str | None = None
    notes: str | None = None
    date_saved: str | None = None

class CompanyCreate(CompanyBase):
    pass

class Company(CompanyBase):
    id: int
    class Config:
        orm_mode = True
