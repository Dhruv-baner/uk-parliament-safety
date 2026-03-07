import json
import os
import time
from openai import OpenAI
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

INPUT_FILE = "data/raw/written_questions.json"
OUTPUT_FILE = "data/processed/classified_questions.json"
os.makedirs("data/processed", exist_ok=True)

SYSTEM_PROMPT = """You are an expert analyst of UK Parliamentary activity on artificial intelligence policy.

Your task is to classify a parliamentary written question and determine whether it is genuinely relevant to AI technology, and if so, characterise it.

Respond ONLY with a valid JSON object. No preamble, no markdown, no explanation.

JSON schema:
{
  "is_ai_relevant": boolean,
  "topic": one of ["ai_safety_risks", "ai_regulation_governance", "ai_public_services", "autonomous_weapons", "surveillance_civil_liberties", "labour_displacement", "international_coordination", "ai_general_technology", "not_relevant"],
  "stance": one of ["pro_safety", "pro_acceleration", "neutral", "concerned", "unclear"],
  "mentions_existential_risk": boolean,
  "mentions_compute_governance": boolean,
  "mentions_international_coordination": boolean,
  "key_quote": "the single most signal-rich sentence from the question text, max 20 words, or empty string if not relevant",
  "summary": "one sentence plain English summary of what the MP is asking about, or empty string if not relevant",
  "confidence": float between 0 and 1
}

Guidelines:
- is_ai_relevant: true only if the question is substantively about AI technology, not just mentions a government agency that uses AI
- stance "pro_safety": MP expresses concern about risks, harms, or need for regulation
- stance "pro_acceleration": MP pushes for faster adoption, competitiveness, economic opportunity
- stance "concerned": MP raises specific harms or problems without explicitly calling for safety measures
- stance "neutral": factual/informational question with no clear normative stance
- mentions_existential_risk: true only if MP explicitly references catastrophic or existential-level AI risks
- key_quote: extract the most revealing phrase about their actual position"""

def classify_question(question: dict) -> dict:
    text = question.get("text", "")
    if not text or len(text) < 20:
        return None

    user_prompt = f"""Classify this UK Parliamentary written question:

Question: {text}
Answering body: {question.get('answering_body', '')}
Heading: {question.get('heading', '')}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0,
            max_tokens=300
        )
        raw = response.choices[0].message.content.strip()
        classification = json.loads(raw)
        return classification
    except Exception as e:
        print(f"  Classification error: {e}")
        return None

def main():
    print("=== AI Safety Classifier ===\n")

    with open(INPUT_FILE) as f:
        questions = json.load(f)

    print(f"Loaded {len(questions)} questions\n")

    # Deduplicate by question text
    seen = set()
    unique = []
    for q in questions:
        txt = q.get("text", "").strip()
        if txt and txt not in seen:
            seen.add(txt)
            unique.append(q)

    print(f"After deduplication: {len(unique)} unique questions\n")

    results = []
    ai_relevant_count = 0

    for q in tqdm(unique, desc="Classifying"):
        classification = classify_question(q)
        if classification:
            record = {**q, "classification": classification}
            results.append(record)
            if classification.get("is_ai_relevant"):
                ai_relevant_count += 1
        time.sleep(0.05)  # gentle rate limiting

    # Save all results
    with open(OUTPUT_FILE, "w") as f:
        json.dump(results, f, indent=2)

    # Save AI-relevant only
    relevant = [r for r in results if r["classification"].get("is_ai_relevant")]
    with open("data/processed/ai_relevant_questions.json", "w") as f:
        json.dump(relevant, f, indent=2)

    print(f"\n=== CLASSIFICATION SUMMARY ===")
    print(f"Total classified:     {len(results)}")
    print(f"AI relevant:          {ai_relevant_count}")
    print(f"Not relevant:         {len(results) - ai_relevant_count}")

    # Topic breakdown
    from collections import Counter
    topics = Counter(r["classification"].get("topic") for r in relevant)
    print(f"\nTopic breakdown:")
    for topic, count in topics.most_common():
        print(f"  {topic}: {count}")

    # Stance breakdown
    stances = Counter(r["classification"].get("stance") for r in relevant)
    print(f"\nStance breakdown:")
    for stance, count in stances.most_common():
        print(f"  {stance}: {count}")

    print(f"\nSaved to data/processed/")

if __name__ == "__main__":
    main()
    