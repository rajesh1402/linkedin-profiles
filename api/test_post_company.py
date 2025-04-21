import requests

API_URL = "http://localhost:8000/companies"

def test_post_company():
    data = {
        "name": "Example Corp",
        "industry": "Software",
        "location": "San Francisco, CA",
        "website": "https://www.example.com",
        "linkedin_url": "https://www.linkedin.com/company/example-corp/",
        "profile_pic": "https://media.licdn.com/example-company-logo.png",
        "about": "A sample company for testing.",
        "notes": "Initial test company.",
        "date_saved": "2025-04-20T22:55:00"
    }
    r = requests.post(API_URL, json=data)
    print(r.status_code, r.json())

if __name__ == "__main__":
    test_post_company()
