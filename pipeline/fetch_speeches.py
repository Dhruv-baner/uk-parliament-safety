import requests
import json
import time
import os
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv()

# --- Config ---
OUTPUT_DIR = "data/raw"
os.makedirs(OUTPUT_DIR, exist_ok=True)

SEARCH_TERMS = [
    "artificial intelligence",
    "machine learning",
    "large language model",
    "AI safety",
    "AI regulation",
    "autonomous systems",
    "foundation model"
]

HANSARD_URL = "https://hansard.parliament.uk/search/Debates"
WQ_URL = "https://questions-statements-api.parliament.uk/api/writtenquestions/questions"

DELAY = 0.5  # seconds between requests
TIMEOUT = 20  # increased timeout

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.5",
}

# --- Hansard Debates ---
def fetch_hansard_debates(terms, max_pages=5):
    results = []
    for term in terms:
        print(f"\nFetching Hansard debates for: '{term}'")
        for page in tqdm(range(1, max_pages + 1)):
            params = {
                "searchTerm": term,
                "page": page,
                "pageSize": 20
            }
            try:
                r = requests.get(HANSARD_URL, params=params, headers=HEADERS, timeout=TIMEOUT)
                r.raise_for_status()
                data = r.json()
                hits = data.get("Results", [])
                if not hits:
                    break
                for hit in hits:
                    results.append({
                        "source": "hansard",
                        "search_term": term,
                        "member_name": hit.get("MemberName", ""),
                        "member_id": hit.get("MemberId", ""),
                        "party": hit.get("Party", ""),
                        "constituency": hit.get("Constituency", ""),
                        "text": hit.get("Value", ""),
                        "debate_title": hit.get("DebateSection", ""),
                        "date": hit.get("SittingDate", ""),
                        "house": hit.get("House", ""),
                        "url": f"https://hansard.parliament.uk{hit.get('HansardMemberUrl', '')}"
                    })
                time.sleep(DELAY)
            except Exception as e:
                print(f"  Error on page {page} for '{term}': {e}")
                break
    return results

# --- Written Questions ---
def fetch_written_questions(terms, max_pages=5):
    results = []
    for term in terms:
        print(f"\nFetching written questions for: '{term}'")
        skip = 0
        page_size = 20
        for _ in tqdm(range(max_pages)):
            params = {
                "searchTerm": term,
                "take": page_size,
                "skip": skip,
                "expandMember": "true"
            }
            try:
                r = requests.get(WQ_URL, params=params, headers=HEADERS, timeout=TIMEOUT)
                r.raise_for_status()
                data = r.json()
                hits = data.get("results", [])
                if not hits:
                    break
                for result in hits:
                    hit = result.get("value", {})
                    member = hit.get("askingMember", {})
                    date = hit.get("dateTabled", "")[:10] if hit.get("dateTabled") else ""
                    results.append({
                        "source": "written_question",
                        "search_term": term,
                        "member_name": member.get("name", ""),
                        "member_id": member.get("id", ""),
                        "party": member.get("party", ""),
                        "constituency": member.get("memberFrom", ""),
                        "text": hit.get("questionText", ""),
                        "answer_text": hit.get("answerText", ""),
                        "date": date,
                        "house": hit.get("house", ""),
                        "heading": hit.get("heading", ""),
                        "answering_body": hit.get("answeringBodyName", ""),
                        "url": f"https://questions-statements.parliament.uk/written-questions/detail/{date}/{hit.get('uin','')}"
                    })
                skip += page_size
                time.sleep(DELAY)
            except Exception as e:
                print(f"  Error on skip {skip} for '{term}': {e}")
                break
    return results

# --- Main ---
if __name__ == "__main__":
    print("=== UK Parliament AI Safety Data Fetcher ===\n")

    speeches = fetch_hansard_debates(SEARCH_TERMS, max_pages=5)
    questions = fetch_written_questions(SEARCH_TERMS, max_pages=5)

    # Save raw data
    with open(f"{OUTPUT_DIR}/speeches.json", "w") as f:
        json.dump(speeches, f, indent=2)

    with open(f"{OUTPUT_DIR}/written_questions.json", "w") as f:
        json.dump(questions, f, indent=2)

    # Summary
    all_members = set(
        [s["member_name"] for s in speeches if s["member_name"]] +
        [q["member_name"] for q in questions if q["member_name"]]
    )
    all_dates = (
        [s["date"] for s in speeches if s["date"]] +
        [q["date"] for q in questions if q["date"]]
    )

    print("\n=== SUMMARY ===")
    print(f"Hansard speech excerpts fetched: {len(speeches)}")
    print(f"Written questions fetched:        {len(questions)}")
    print(f"Unique members found:             {len(all_members)}")
    if all_dates:
        print(f"Date range:                       {min(all_dates)} → {max(all_dates)}")

    print("\nRaw data saved to data/raw/")