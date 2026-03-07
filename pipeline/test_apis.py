import requests
import json

def test_wq():
    url = "https://questions-statements-api.parliament.uk/api/writtenquestions/questions"
    # Try different searchTerm forms
    for param in ["searchTerm", "q", "keyword", "search"]:
        res = requests.get(url, params={param: "artificial intelligence", "take": 2})
        if res.status_code == 200:
            data = res.json()
            results = data.get('results', [])
            total = data.get('totalResults', data.get('pagingInfo', {}).get('total', 'unknown'))
            print(f"WQ param '{param}': {len(results)} results returned. Total indicated: {total}")
            if results:
                qText = results[0].get('value', {}).get('questionText', '')
                print(f"Sample Question text snippet: {qText[:100]}")
        else:
            print(f"WQ param '{param}': Status {res.status_code}")

def test_hansard():
    url = "https://hansard.parliament.uk/search/Debates"
    res = requests.get(url, params={"searchTerm": "artificial intelligence"}, headers={"Accept": "application/json"})
    print(f"Hansard API json request: Status {res.status_code}, Content-Type: {res.headers.get('content-type')}")
    if 'application/json' in res.headers.get('content-type', '').lower():
        try:
            print("Hansard keys:", res.json().keys())
            print("Sample data:", str(res.json())[:300])
        except:
            print("Could not parse JSON")
    else:
        print("Hansard did not return JSON. Preview HTML:")
        print(res.text[:300])

if __name__ == "__main__":
    print("Testing Written Questions...")
    test_wq()
    print("\nTesting Hansard...")
    test_hansard()
