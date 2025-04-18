import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Profile

load_dotenv()

def seed():
    db: Session = SessionLocal()
    profiles = [
        Profile(
            name="Jane Doe",
            headline="Product Manager at Example Inc.",
            url="https://www.linkedin.com/in/janedoe/",
            current_title="Product Manager",
            location="San Francisco, CA",
            profile_pic="https://media.licdn.com/dms/image/C4D03AQFEXAMPLE/profile-displayphoto-shrink_200_200/0/1516341234567?e=1718236800&v=beta&t=ABC123"
        ),
        Profile(
            name="John Smith",
            headline="Software Engineer at TechCorp",
            url="https://www.linkedin.com/in/johnsmith/",
            current_title="Software Engineer",
            location="New York, NY",
            profile_pic="https://media.licdn.com/dms/image/C4D03AQFEXAMPLE/profile-displayphoto-shrink_200_200/0/1516341234567?e=1718236800&v=beta&t=XYZ456"
        )
    ]
    for profile in profiles:
        if not db.query(Profile).filter_by(url=profile.url).first():
            db.add(profile)
    db.commit()
    db.close()

if __name__ == "__main__":
    seed()
