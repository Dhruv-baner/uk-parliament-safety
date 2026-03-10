import requests
import json
import time
import os
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv()

TWFY_KEY = os.getenv("THEYWORKFORYOU_API_KEY")
TWFY_BASE = "https://www.theyworkforyou.com/api"

OUTPUT_DIR = "data/raw"
os.makedirs(OUTPUT_DIR, exist_ok=True)

DATE_FROM = "2026-01-01"

AI_KEYWORDS = [
    "artificial intelligence",
    "AI safety",
    "large language model",
    "foundation model",
    "superintelligence",
    "generative AI",
    "AI regulation",
    "frontier AI",
    "machine learning",
    "autonomous weapons",
]

HEADERS = {"Accept": "application/json"}


def fetch_2026_speeches(term: str, existing_gids: set, max_pages: int = 10) -> list:
    """Fetch all speeches on a keyword from 2026 onwards, any speaker."""
    results = []

    for page in range(1, max_pages + 1):
        try:
            r = requests.get(
                f"{TWFY_BASE}/getHansard",
                params={
                    "key": TWFY_KEY,
                    "search": term,
                    "date_from": DATE_FROM,
                    "order": "d",
                    "num": 20,
                    "page": page,
                    "output": "js"
                },
                headers=HEADERS,
                timeout=15
            )
            if r.status_code != 200:
                break

            data = r.json()
            rows = data.get("rows", []) if isinstance(data, dict) else []

            if not rows:
                break

            for row in rows:
                gid = row.get("gid", "")
                if gid in existing_gids:
                    continue

                text = row.get("body", "")
                if not text or len(text) < 50:
                    continue

                # Double check date is 2026
                date = row.get("hdate", "")
                if date < DATE_FROM:
                    continue

                speaker = row.get("speaker", {})

                results.append({
                    "gid": gid,
                    "search_term": term,
                    "member_name": speaker.get("name", ""),
                    "twfy_person_id": str(speaker.get("person_id", "")),
                    "party": speaker.get("party", ""),
                    "constituency": speaker.get("constituency", ""),
                    "text": text,
                    "debate_title": row.get("subsection_title") or row.get("section_title", ""),
                    "date": date,
                    "house": row.get("house", ""),
                    "url": f"https://www.theyworkforyou.com/debates/?id={gid}"
                })

            time.sleep(0.25)

        except Exception as e:
            print(f"  Error on page {page} for '{term}': {e}")
            break

    return results


def main():
    print("=== 2026 AI Parliamentary Debates Fetcher ===")
    print(f"Fetching all AI-related speeches from {DATE_FROM} onwards\n")

    if not TWFY_KEY:
        print("ERROR: THEYWORKFORYOU_API_KEY not found in .env")
        return

    all_speeches = []
    seen_gids = set()

    for term in tqdm(AI_KEYWORDS, desc="Searching 2026 Hansard"):
        speeches = fetch_2026_speeches(term, seen_gids, max_pages=10)
        for s in speeches:
            if s["gid"] not in seen_gids:
                seen_gids.add(s["gid"])
                all_speeches.append(s)
        time.sleep(0.3)

    # Save raw
    with open(f"{OUTPUT_DIR}/debates_2026_raw.json", "w") as f:
        json.dump(all_speeches, f, indent=2)

    # Summary
    by_party = {}
    by_house = {}
    by_keyword = {}
    by_week = {}

    for s in all_speeches:
        party = s.get("party", "Unknown") or "Unknown"
        house = s.get("house", "Unknown") or "Unknown"
        term = s.get("search_term", "")
        date = s.get("date", "")
        week = date[:7] if date else "unknown"  # YYYY-MM

        by_party[party] = by_party.get(party, 0) + 1
        by_house[house] = by_house.get(house, 0) + 1
        by_keyword[term] = by_keyword.get(term, 0) + 1
        by_week[week] = by_week.get(week, 0) + 1

    print(f"\n=== SUMMARY ===")
    print(f"Total unique AI speeches in 2026: {len(all_speeches)}")

    print(f"\nBy keyword:")
    for term, count in sorted(by_keyword.items(), key=lambda x: -x[1]):
        print(f"  {term:<35} {count}")

    print(f"\nBy house:")
    for house, count in sorted(by_house.items(), key=lambda x: -x[1]):
        print(f"  {house}: {count}")

    print(f"\nBy party (top 10):")
    for party, count in sorted(by_party.items(), key=lambda x: -x[1])[:10]:
        print(f"  {party:<30} {count}")

    print(f"\nBy month:")
    for week, count in sorted(by_week.items()):
        print(f"  {week}: {count}")

    print(f"\nSaved to data/raw/debates_2026_raw.json")
    print(f"\nNext step: run classify.py on this file to get topic/stance labels")


if __name__ == "__main__":
    main()