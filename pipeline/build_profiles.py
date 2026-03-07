import json
import os
from collections import defaultdict, Counter

INPUT_SIGNATORIES = "data/raw/controlai_signatories.json"
INPUT_CLASSIFIED = "data/processed/ai_relevant_questions.json"
INPUT_ALL_QUESTIONS = "data/raw/written_questions.json"
OUTPUT_DIR = "data/output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

PARTY_COLOURS = {
    "Labour": "#E4003B",
    "Labour (Co-op)": "#E4003B",
    "Conservative": "#0087DC",
    "Liberal Democrat": "#FAA61A",
    "Scottish National Party": "#FDF38E",
    "Plaid Cymru": "#005B54",
    "Green Party": "#00B140",
    "Crossbench": "#888888",
    "Non-affiliated": "#AAAAAA",
    "Alliance": "#F6CB2F",
    "Bishops": "#9B59B6",
    "Social Democratic & Labour Party": "#2AA82C",
}

def compute_engagement_score(questions: list) -> float:
    """Score based on volume, recency, and depth of AI engagement."""
    if not questions:
        return 0.0

    score = 0.0
    for q in questions:
        base = 1.0
        c = q.get("classification", {})

        # Depth bonus
        if c.get("mentions_existential_risk"):
            base += 2.0
        if c.get("mentions_compute_governance"):
            base += 1.5
        if c.get("mentions_international_coordination"):
            base += 1.0

        # Topic weight
        topic = c.get("topic", "")
        if topic == "ai_safety_risks":
            base += 1.5
        elif topic == "ai_regulation_governance":
            base += 1.0
        elif topic == "autonomous_weapons":
            base += 1.0

        # Stance weight
        stance = c.get("stance", "")
        if stance == "pro_safety":
            base += 1.0
        elif stance == "concerned":
            base += 0.5

        # Recency weight (questions from 2025+ weighted more)
        date = q.get("date", "")
        if date >= "2025-01-01":
            base *= 1.2

        score += base

    return round(score, 2)


def get_dominant_stance(questions: list) -> str:
    if not questions:
        return "unclear"
    stances = [q["classification"].get("stance", "unclear")
               for q in questions if q.get("classification")]
    if not stances:
        return "unclear"
    return Counter(stances).most_common(1)[0][0]


def get_top_topics(questions: list) -> list:
    topics = [q["classification"].get("topic")
              for q in questions if q.get("classification")]
    return [t for t, _ in Counter(topics).most_common(3) if t and t != "not_relevant"]


def get_key_quotes(questions: list, n=3) -> list:
    quotes = []
    for q in questions:
        c = q.get("classification", {})
        quote = c.get("key_quote", "")
        if quote and len(quote) > 15:
            quotes.append({
                "quote": quote,
                "date": q.get("date", ""),
                "topic": c.get("topic", ""),
                "stance": c.get("stance", ""),
                "url": q.get("url", "")
            })
    # Sort by date descending, return top n
    quotes.sort(key=lambda x: x["date"], reverse=True)
    return quotes[:n]


def main():
    print("=== Building MP Profiles ===\n")

    # Load data
    with open(INPUT_SIGNATORIES) as f:
        signatories = json.load(f)

    with open(INPUT_CLASSIFIED) as f:
        classified = json.load(f)

    with open(INPUT_ALL_QUESTIONS) as f:
        all_questions = json.load(f)

    print(f"Signatories loaded:          {len(signatories)}")
    print(f"AI-relevant questions:       {len(classified)}")
    print(f"Total raw questions:         {len(all_questions)}")

    # Index classified questions by member name
    questions_by_name = defaultdict(list)
    for q in classified:
        name = q.get("member_name", "").strip()
        if name:
            questions_by_name[name].append(q)

    # Also count total questions asked (including non-AI) per member
    total_questions_by_name = Counter(
        q.get("member_name", "").strip() for q in all_questions
        if q.get("member_name")
    )

    # Build signatory profiles (deep)
    signatory_profiles = []
    for s in signatories:
        if s.get("error"):
            continue

        name = s.get("name", "")
        questions = questions_by_name.get(name, [])

        profile = {
            "member_id": s.get("member_id"),
            "name": name,
            "full_title": s.get("full_title", name),
            "party": s.get("party", ""),
            "party_colour": PARTY_COLOURS.get(s.get("party", ""), "#888888"),
            "party_abbreviation": s.get("party_abbreviation", ""),
            "house": "Commons" if s.get("house") == 1 else "Lords",
            "constituency": s.get("constituency", ""),
            "thumbnail_url": s.get("thumbnail_url", ""),
            "controlai_signatory": True,
            "ai_questions_count": len(questions),
            "total_questions_count": total_questions_by_name.get(name, 0),
            "engagement_score": compute_engagement_score(questions),
            "dominant_stance": get_dominant_stance(questions),
            "top_topics": get_top_topics(questions),
            "key_quotes": get_key_quotes(questions),
            "questions": questions
        }
        signatory_profiles.append(profile)

    # Build non-signatory profiles for MPs with AI activity
    signatory_names = {p["name"] for p in signatory_profiles}
    non_signatory_profiles = []

    for name, questions in questions_by_name.items():
        if name in signatory_names:
            continue
        if not questions:
            continue

        # Get party/house from first question
        sample = questions[0]
        profile = {
            "member_id": sample.get("member_id", ""),
            "name": name,
            "full_title": name,
            "party": sample.get("party", ""),
            "party_colour": PARTY_COLOURS.get(sample.get("party", ""), "#888888"),
            "house": sample.get("house", ""),
            "constituency": sample.get("constituency", ""),
            "thumbnail_url": f"https://members-api.parliament.uk/api/Members/{sample.get('member_id', '')}/Thumbnail",
            "controlai_signatory": False,
            "ai_questions_count": len(questions),
            "total_questions_count": total_questions_by_name.get(name, 0),
            "engagement_score": compute_engagement_score(questions),
            "dominant_stance": get_dominant_stance(questions),
            "top_topics": get_top_topics(questions),
            "key_quotes": get_key_quotes(questions),
            "questions": questions
        }
        non_signatory_profiles.append(profile)

    # Combine and sort by engagement score
    all_profiles = signatory_profiles + non_signatory_profiles
    all_profiles.sort(key=lambda x: (
        -x["controlai_signatory"],  # signatories first
        -x["engagement_score"]
    ))

    # Save outputs
    with open(f"{OUTPUT_DIR}/mp_profiles.json", "w") as f:
        json.dump(all_profiles, f, indent=2)

    # Save lightweight version for map (no full questions array)
    map_data = []
    for p in all_profiles:
        light = {k: v for k, v in p.items() if k != "questions"}
        map_data.append(light)

    with open(f"{OUTPUT_DIR}/mp_profiles_light.json", "w") as f:
        json.dump(map_data, f, indent=2)

    # Summary
    signatories_with_questions = [p for p in signatory_profiles if p["ai_questions_count"] > 0]
    top_10 = sorted(all_profiles, key=lambda x: -x["engagement_score"])[:10]

    print(f"\n=== PROFILE SUMMARY ===")
    print(f"Signatory profiles built:    {len(signatory_profiles)}")
    print(f"Non-signatory AI profiles:   {len(non_signatory_profiles)}")
    print(f"Signatories with questions:  {len(signatories_with_questions)}")
    print(f"\nTop 10 by engagement score:")
    for p in top_10:
        marker = "✓" if p["controlai_signatory"] else " "
        print(f"  [{marker}] {p['name']:<35} {p['party']:<20} score: {p['engagement_score']}")

    print(f"\nSaved to data/output/mp_profiles.json")
    print(f"Saved to data/output/mp_profiles_light.json")


if __name__ == "__main__":
    main()