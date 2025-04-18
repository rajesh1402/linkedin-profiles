from pydantic import BaseModel

class ProfileBase(BaseModel):
    name: str
    headline: str
    url: str
    current_title: str
    location: str
    profile_pic: str | None = None

class ProfileCreate(ProfileBase):
    pass

class Profile(ProfileBase):
    id: int

    class Config:
        orm_mode = True
