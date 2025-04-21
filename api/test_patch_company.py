import requests

API_URL = "http://localhost:8000/companies/1"  # Change ID as needed

def test_patch_company():
    data = {"notes": "Updated notes for the company."}
    r = requests.patch(API_URL, json=data)
    print(r.status_code, r.json())

if __name__ == "__main__":
    test_patch_company()
