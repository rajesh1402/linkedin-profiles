import requests

API_URL = "http://localhost:8000/companies"

def test_get_companies():
    r = requests.get(API_URL)
    print(r.status_code, r.json())

if __name__ == "__main__":
    test_get_companies()
