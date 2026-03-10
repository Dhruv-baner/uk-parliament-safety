import requests
import json
import time
import os
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv()

TWFY_KEY = os.getenv("THEYWORKFORYOU_API_KEY")
TWFY_BASE = "https://www.theyworkforyou.com/api"

INPUT_ID_MAP = "data/raw/twfy_id_map.json"
INPUT_ADDITIONAL = "data/raw/additional_targets.json"
EXISTING_SPEECHES = "data/raw/signatory_speeches.json"
OUTPUT_DIR = "data/raw"
os.makedirs(OUTPUT_DIR, exist_ok=True)

AI_KEYWORDS = [
    "artificial intelligence",
    "AI safety",
    "large language model",
    "foundation model",
    "superintelligence",
    "generative AI",
    "AI regulation",
    "frontier AI",
    "AI bill",
    "machine learning",
    "autonomous weapons",
    "AI Act",
]

HEADERS = {"Accept": "application/json"}


def find_twfy_id(name: str, house: str) -> str | None:
    """Find TWFY person_id using getMPs or getLords search."""
    clean = name
    for prefix in ["The Rt Hon ", "Rt Hon ", "Sir ", "Dame ", "Dr ", "Mr ", "Mrs ", "Ms ", "Lord ", "Baroness ", "Viscount ", "Earl "]:
        clean = clean.replace(prefix, "")
    clean = clean.strip()

    # Use last name for search
    last_name = clean.split()[-1] if clean else name
    endpoint = "getLords" if house == "Lords" else "getMPs"

    try:
        r = requests.get(
            f"{TWFY_BASE}/{endpoint}",
            params={"key": TWFY_KEY, "search": last_name, "output": "js"},
            headers=HEADERS,
            timeout=10
        )
        if r.status_code != 200:
            return None

        results = r.json()
        if not isinstance(results, list) or not results:
            return None

        # Try to match on full name
        clean_lower = clean.lower()
        for res in results:
            full = res.get("full_name", "").lower()
            # Match if all significant parts of name appear in result
            parts = [p for p in clean_lower.split() if len(p) > 3]
            if all(p in full for p in parts):
                return str(res.get("person_id", ""))

        # Fallback: first result
        return str(results[0].get("person_id", ""))

    except Exception:
        return None


def fetch_hansard_by_keyword(term: str, signatory_ids: set, existing_gids: set, max_pages: int = 15) -> list:
    """Search Hansard by keyword, return speeches by our targets only."""
    results = []

    for page in range(1, max_pages + 1):
        try:
            r = requests.get(
                f"{TWFY_BASE}/getHansard",
                params={
                    "key": TWFY_KEY,
                    "search": term,
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

                # Skip already fetched
                if gid in existing_gids:
                    continue

                # Only keep speeches by our targets
                speaker = row.get("speaker", {})
                person_id = str(speaker.get("person_id", ""))
                if person_id not in signatory_ids:
                    continue

                text = row.get("body", "")
                if not text or len(text) < 50:
                    continue

                results.append({
                    "gid": gid,
                    "person_id": person_id,
                    "text": text,
                    "debate_title": row.get("subsection_title") or row.get("section_title", ""),
                    "date": row.get("hdate", ""),
                    "house": row.get("house", ""),
                    "search_term": term,
                    "url": f"https://www.theyworkforyou.com/debates/?id={gid}"
                })

            time.sleep(0.25)

        except Exception as e:
            print(f"  Error on page {page} for '{term}': {e}")
            break

    return results


def main():
    print("=== TheyWorkForYou Speech Fetcher (Final Run) ===\n")

    if not TWFY_KEY:
        print("ERROR: THEYWORKFORYOU_API_KEY not found in .env")
        return

    # --- Load existing speeches to avoid re-fetching ---
    existing_speeches = []
    existing_gids = set()
    if os.path.exists(EXISTING_SPEECHES):
        with open(EXISTING_SPEECHES) as f:
            existing_speeches = json.load(f)
        existing_gids = {s.get("gid", "") for s in existing_speeches}
        print(f"Existing speeches loaded:     {len(existing_speeches)}")
        print(f"Existing GIDs (skip these):   {len(existing_gids)}\n")

    # --- Load confirmed signatory ID map ---
    with open(INPUT_ID_MAP) as f:
        id_map = json.load(f)

    id_to_entry = {e["twfy_person_id"]: e for e in id_map}
    signatory_ids = set(id_to_entry.keys())
    print(f"Confirmed signatories:        {len(signatory_ids)}")

    # --- Load and resolve additional targets ---
    additional_entries = []
    if os.path.exists(INPUT_ADDITIONAL):
        with open(INPUT_ADDITIONAL) as f:
            additional_targets = json.load(f)

        print(f"Additional targets to find:   {len(additional_targets)}\n")
        print("Resolving additional target TWFY IDs...")

        unresolved = []
        for t in tqdm(additional_targets, desc="Finding IDs"):
            name = t["name"]
            house = t.get("house", "Commons")
            person_id = find_twfy_id(name, house)
            time.sleep(0.3)

            if person_id and person_id not in signatory_ids:
                entry = {
                    "name": name,
                    "house": house,
                    "twfy_person_id": person_id,
                    "role": t.get("role", ""),
                    "category": "target"
                }
                additional_entries.append(entry)
                id_to_entry[person_id] = entry
                signatory_ids.add(person_id)
            elif not person_id:
                unresolved.append(name)

        print(f"Additional targets resolved:  {len(additional_entries)}")
        if unresolved:
            print(f"Could not resolve:            {unresolved}")

    # Mark signatories with category
    for pid, entry in id_to_entry.items():
        if "category" not in entry:
            entry["category"] = "signatory"

    print(f"\nTotal targets to fetch for:   {len(signatory_ids)}")
    print(f"Keywords to search:           {len(AI_KEYWORDS)}")
    print(f"Pages per keyword:            15")
    print(f"Estimated new API calls:      ~{len(AI_KEYWORDS) * 15}\n")

    # --- Fetch speeches by keyword ---
    all_new_speeches = []
    new_gids = set()

    for term in tqdm(AI_KEYWORDS, desc="Searching Hansard"):
        new = fetch_hansard_by_keyword(term, signatory_ids, existing_gids | new_gids, max_pages=15)
        for s in new:
            if s["gid"] not in new_gids:
                new_gids.add(s["gid"])
                all_new_speeches.append(s)
        time.sleep(0.3)

    # --- Enrich new speeches with member info ---
    enriched_new = []
    for s in all_new_speeches:
        pid = s.get("person_id", "")
        entry = id_to_entry.get(pid, {})
        enriched_new.append({
            "source": "hansard_speech",
            "search_term": s["search_term"],
            "member_name": entry.get("name", ""),
            "twfy_person_id": pid,
            "category": entry.get("category", "unknown"),
            "role": entry.get("role", ""),
            "text": s["text"],
            "debate_title": s["debate_title"],
            "date": s["date"],
            "house": s["house"],
            "gid": s["gid"],
            "url": s["url"]
        })

    # --- Merge with existing ---
    # Re-enrich existing speeches with category if missing
    for s in existing_speeches:
        if "category" not in s:
            pid = s.get("twfy_person_id", "")
            entry = id_to_entry.get(pid, {})
            s["category"] = entry.get("category", "signatory")
            s["role"] = entry.get("role", "")

    all_speeches = existing_speeches + enriched_new

    # --- Save ---
    with open(f"{OUTPUT_DIR}/signatory_speeches.json", "w") as f:
        json.dump(all_speeches, f, indent=2)

    # Save updated ID map with additional targets
    full_id_map = list(id_to_entry.values())
    with open(f"{OUTPUT_DIR}/twfy_id_map.json", "w") as f:
        json.dump(full_id_map, f, indent=2)

    # --- Summary ---
    by_member = {}
    by_category = {"signatory": 0, "target": 0, "unknown": 0}
    for s in all_speeches:
        name = s.get("member_name", "Unknown")
        by_member[name] = by_member.get(name, 0) + 1
        cat = s.get("category", "unknown")
        by_category[cat] = by_category.get(cat, 0) + 1

    print(f"\n=== FINAL SUMMARY ===")
    print(f"Previously existing speeches: {len(existing_speeches)}")
    print(f"New speeches fetched:         {len(enriched_new)}")
    print(f"Total speeches:               {len(all_speeches)}")
    print(f"\nBy category:")
    for cat, count in by_category.items():
        print(f"  {cat}: {count}")

    print(f"\nTop 20 most active speakers:")
    for name, count in sorted(by_member.items(), key=lambda x: -x[1])[:20]:
        pid = next((s.get("twfy_person_id") for s in all_speeches if s.get("member_name") == name), "")
        cat = id_to_entry.get(pid, {}).get("category", "")
        role = id_to_entry.get(pid, {}).get("role", "")
        label = f"[{cat}]" if not role else f"[{cat}] {role}"
        print(f"  {name:<40} {count:>3}  {label}")

    print(f"\nSaved to {OUTPUT_DIR}/signatory_speeches.json")


if __name__ == "__main__":
    main()