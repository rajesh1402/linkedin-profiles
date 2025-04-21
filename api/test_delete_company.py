import requests

API_URL = "http://localhost:8000/companies/1"  # Change ID as needed

def test_delete_company():
    r = requests.delete(API_URL)
    print(r.status_code, r.json())

if __name__ == "__main__":
    test_delete_company()
