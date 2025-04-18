import requests
import os
from dotenv import load_dotenv

load_dotenv()
API_URL = os.getenv("API_URL", "http://localhost:8000/profiles")

def test_post():
    data = {
        "name": "Alice Example",
        "headline": "Designer at Example LLC",
        "url": "https://www.linkedin.com/in/aliceexample/",
        "current_title": "Designer",
        "location": "Austin, TX",
        "profile_pic": "https://media.licdn.com/dms/image/C4D03AQEXAMPLE/profile-displayphoto-shrink_200_200/0/1516341234567?e=1718236800&v=beta&t=EXAMPLE"
    }
    r = requests.post(API_URL, json=data)
    print(r.status_code, r.json())

if __name__ == "__main__":
    test_post()
