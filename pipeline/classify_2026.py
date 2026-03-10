import json
import os
import time
from openai import OpenAI
from dotenv import load_dotenv
from tqdm import tqdm
from collections import Counter

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

INPUT_FILE = "data/raw/debates_2026_raw.json"
OUTPUT_FILE = "data/processed/debates_2026_classified.json"
os.makedirs("data/processed", exist_ok=True)

SYSTEM_PROMPT = """You are an expert analyst of UK Parliamentary activity on artificial intelligence policy.

Classify the following parliamentary speech. Respond ONLY with a valid JSON object. No preamble, no markdown, no explanation.

JSON schema:
{
  "is_ai_relevant": boolean,
  "topic": one of ["ai_safety_risks", "ai_regulation_governance", "ai_public_services", "autonomous_weapons", "surveillance_civil_liberties", "labour_displacement", "international_coordination", "ai_general_technology", "not_relevant"],
  "stance": one of ["pro_safety", "pro_acceleration", "neutral", "concerned", "unclear"],
  "mentions_existential_risk": boolean,
  "mentions_compute_governance": boolean,
  "mentions_international_coordination": boolean,
  "key_quote": "most signal-rich sentence from the text, max 20 words, or empty string if not relevant",
  "summary": "one sentence plain English summary, or empty string if not relevant",
  "confidence": float between 0 and 1
}

Guidelines:
- is_ai_relevant: true only if substantively about AI technology
- pro_safety: speaker expresses concern about risks or need for regulation
- pro_acceleration: speaker pushes for faster adoption or competitiveness
- concerned: raises specific harms without explicitly calling for safety measures
- neutral: factual or informational, no clear normative stance"""


def classify_speech(speech: dict) -> dict | None:
    text = speech.get("text", "")
    if not text or len(text) < 30:
        return None

    # Strip HTML tags simply
    import re
    text_clean = re.sub(r"<[^>]+>", " ", text).strip()
    text_clean = " ".join(text_clean.split())

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Speech: {text_clean[:1200]}"}
            ],
            temperature=0,
            max_tokens=300
        )
        raw = response.choices[0].message.content.strip()
        return json.loads(raw)
    except Exception as e:
        return None


def main():
    print("=== 2026 AI Debates Classifier ===\n")

    with open(INPUT_FILE) as f:
        speeches = json.load(f)

    print(f"Loaded {len(speeches)} speeches to classify\n")

    results = []
    for s in tqdm(speeches, desc="Classifying"):
        classification = classify_speech(s)
        results.append({**s, "classification": classification})
        time.sleep(0.05)

    with open(OUTPUT_FILE, "w") as f:
        json.dump(results, f, indent=2)

    # Summary
    relevant = [r for r in results if r.get("classification") and r["classification"].get("is_ai_relevant")]
    topics = Counter(r["classification"].get("topic") for r in relevant)
    stances = Counter(r["classification"].get("stance") for r in relevant)
    parties = Counter(r.get("party", "Unknown") for r in relevant)
    existential = sum(1 for r in relevant if r["classification"].get("mentions_existential_risk"))
    international = sum(1 for r in relevant if r["classification"].get("mentions_international_coordination"))

    print(f"\n=== CLASSIFICATION SUMMARY ===")
    print(f"Total classified:          {len(results)}")
    print(f"AI relevant:               {len(relevant)}")
    print(f"Not relevant:              {len(results) - len(relevant)}")
    print(f"Mentions existential risk: {existential}")
    print(f"Mentions intl coord:       {international}")

    print(f"\nTopic breakdown:")
    for topic, count in topics.most_common():
        print(f"  {topic:<35} {count}")

    print(f"\nStance breakdown:")
    for stance, count in stances.most_common():
        print(f"  {stance:<20} {count}")

    print(f"\nBy party (AI-relevant speeches):")
    for party, count in parties.most_common(10):
        print(f"  {party:<30} {count}")

    print(f"\nSaved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()