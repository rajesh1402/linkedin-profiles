import requests
import os
from dotenv import load_dotenv

load_dotenv()
API_URL = os.getenv("API_URL", "http://localhost:8000/profiles")

def test_get():
    r = requests.get(API_URL)
    print(r.status_code, r.json())

if __name__ == "__main__":
    test_get()
