import requests
import os
from dotenv import load_dotenv

load_dotenv()
API_URL = os.getenv("API_URL", "http://localhost:8000/profiles")

def test_delete(profile_id):
    r = requests.delete(f"{API_URL}/{profile_id}")
    print(r.status_code, r.json())

if __name__ == "__main__":
    # Replace 1 with the actual profile_id to delete
    test_delete(1)
