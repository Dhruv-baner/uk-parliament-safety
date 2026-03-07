import requests
import json
import re
import time
import os
from bs4 import BeautifulSoup
from tqdm import tqdm

OUTPUT_DIR = "data/raw"
os.makedirs(OUTPUT_DIR, exist_ok=True)

CONTROLAI_URL = "https://controlai.com/statement"
MEMBERS_API = "https://members-api.parliament.uk/api/Members"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

def scrape_signatory_ids():
    """Scrape ControlAI statement page and extract Parliament member IDs."""
    print("Fetching ControlAI statement page...")
    r = requests.get(CONTROLAI_URL, headers=HEADERS, timeout=15)
    r.raise_for_status()

    soup = BeautifulSoup(r.text, "html.parser")

    # Extract all parliament member URLs
    member_ids = set()
    names_by_id = {}

    for a in soup.find_all("a", href=True):
        href = a["href"]
        # Match parliament member URLs
        match = re.search(r'members\.parliament\.uk/member/(\d+)', href)
        if match:
            member_id = int(match.group(1))
            member_ids.add(member_id)

            # Try to get name from nearby text
            img = a.find("img")
            if img and img.get("alt"):
                names_by_id[member_id] = img["alt"]

    # Also extract non-Westminster signatories (MSPs, MLAs, MSs)
    non_westminster = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if any(x in href for x in ["parliament.scot", "senedd.wales", "niassembly.gov.uk"]):
            img = a.find("img")
            name = img["alt"] if img and img.get("alt") else ""
            non_westminster.append({"name": name, "url": href, "legislature": "devolved"})

    print(f"Found {len(member_ids)} Westminster parliament member IDs")
    print(f"Found {len(non_westminster)} devolved legislature members")

    return list(member_ids), names_by_id, non_westminster


def fetch_member_profile(member_id: int) -> dict:
    """Fetch full profile from Parliament Members API."""
    url = f"{MEMBERS_API}/{member_id}"
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        data = r.json()
        value = data.get("value", {})
        return {
            "member_id": member_id,
            "name": value.get("nameDisplayAs", ""),
            "full_title": value.get("nameFullTitle", ""),
            "party": value.get("latestParty", {}).get("name", ""),
            "party_abbreviation": value.get("latestParty", {}).get("abbreviation", ""),
            "house": value.get("latestHouseMembership", {}).get("house", ""),
            "membership_status": value.get("latestHouseMembership", {}).get("membershipStatus", ""),
            "constituency": value.get("latestHouseMembership", {}).get("membershipFrom", ""),
            "thumbnail_url": f"https://members-api.parliament.uk/api/Members/{member_id}/Thumbnail",
            "controlai_signatory": True
        }
    except Exception as e:
        print(f"  Error fetching member {member_id}: {e}")
        return {"member_id": member_id, "controlai_signatory": True, "error": str(e)}


def main():
    print("=== ControlAI Signatory Fetcher ===\n")

    # Step 1: Scrape signatory IDs
    member_ids, names_by_id, non_westminster = scrape_signatory_ids()

    # Step 2: Fetch full profiles from Parliament API
    print(f"\nFetching profiles for {len(member_ids)} members...")
    profiles = []
    for mid in tqdm(member_ids):
        profile = fetch_member_profile(mid)
        profiles.append(profile)
        time.sleep(0.3)

    # Step 3: Save
    with open(f"{OUTPUT_DIR}/controlai_signatories.json", "w") as f:
        json.dump(profiles, f, indent=2)

    with open(f"{OUTPUT_DIR}/non_westminster_signatories.json", "w") as f:
        json.dump(non_westminster, f, indent=2)

    # Summary
    lords = [p for p in profiles if p.get("house") == 2]
    commons = [p for p in profiles if p.get("house") == 1]
    parties = {}
    for p in profiles:
        party = p.get("party", "Unknown")
        parties[party] = parties.get(party, 0) + 1

    print(f"\n=== SIGNATORY SUMMARY ===")
    print(f"Total Westminster signatories: {len(profiles)}")
    print(f"House of Commons MPs: {len(commons)}")
    print(f"House of Lords Peers: {len(lords)}")
    print(f"\nParty breakdown:")
    for party, count in sorted(parties.items(), key=lambda x: -x[1]):
        print(f"  {party}: {count}")
    print(f"\nSaved to data/raw/controlai_signatories.json")


if __name__ == "__main__":
    main()