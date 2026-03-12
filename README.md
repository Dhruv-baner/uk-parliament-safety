# UK Parliament AI Safety Intelligence Dashboard

A live intelligence tool profiling parliamentary engagement with AI safety in the UK 

**Live dashboard:** [uk-parliament-safety.vercel.app](https://uk-parliament-safety-yz74-9noih9t67-dhruvs-projects-0d4ea20c.vercel.app)

---

### Overview

This project maps the full landscape of AI-related discourse in UK Parliament; tracking who is speaking, what positions they hold, and how aligned they are with the case for AI safety regulation. It combines automated data collection across four public APIs with GPT-4o-mini classification to produce a structured, searchable intelligence dashboard.

The dashboard has three sections:

| Section | Description |
|---|---|
| **The Landscape** | Every AI-related speech in Parliament from January–March 2026, classified by topic and stance |
| **Signatory Network** | Profiles of 80 cross-party parliamentarians who have publicly supported ControlAI's campaign |
| **Key Figures** | Deep profiles of DSIT ministers, committee chairs, and the most influential AI voices in Parliament |

---

### Data Pipeline

Built in Python across five scripts in the `/pipeline` directory.

- Scraped ControlAI's public statement page to extract 80 confirmed Westminster signatories with Parliament member IDs
- Hit the UK Parliament Members API to build full profiles (party, house, constituency, photo)
- Used TheyWorkForYou API to pull Hansard speeches for all 80 signatories plus 12 key figures (ministers, committee chairs), filtered to AI-related keywords
- Fetched all AI-related written questions from the UK Parliament Written Questions API
- Used the same TWFY API to pull all 604 AI-related speeches in Parliament from January–March 2026
- Ran GPT-4o-mini classification on all speeches and questions, outputting structured JSON with topic, stance, key quote, and flags for existential risk and international coordination mentions
- Built an MP profile aggregation script merging all sources into a unified per-member JSON

#### Classification schema

Each speech is classified with the following fields:
```json
{
  "is_ai_relevant": true,
  "topic": "ai_safety_risks | ai_regulation_governance | ai_public_services | ...",
  "stance": "pro_safety | pro_acceleration | concerned | neutral | unclear",
  "mentions_existential_risk": false,
  "mentions_international_coordination": false,
  "key_quote": "most signal-rich sentence from the speech",
  "summary": "one sentence plain English summary",
  "confidence": 0.91
}
```

---

### Dashboard

Built with **Vite + React 19 + TypeScript**, deployed to Vercel.

- Three sections: The Landscape, Signatory Network, Key Figures
- Custom SVG charts built from scratch — donut chart, horizontal bars, vertical bars, sparkline timeline — all with hover interactivity
- Animated rotating stat card cycling through key metrics
- Slide-out drawer for detailed MP profiles with speech excerpts and Hansard links
- Dark theme throughout using CSS custom properties

---

### Data Sources

| Source | Usage |
|---|---|
| [UK Parliament Members API](https://members-api.parliament.uk) | MP and Lord profiles, party, constituency |
| [UK Parliament Written Questions API](https://questions-statements-api.parliament.uk) | AI-related written questions |
| [TheyWorkForYou API](https://www.theyworkforyou.com/api/) | Hansard speeches by member and keyword |
| [ControlAI statement page](https://controlai.com/statement) | Confirmed signatory list |
| OpenAI GPT-4o-mini | Speech classification |

---

### Project Structure
```
uk-parliament-safety/
├── pipeline/
│   ├── fetch_speeches.py
│   ├── fetch_member_speeches.py
│   ├── fetch_signatories.py
│   ├── fetch_2026_ai_debates.py
│   ├── classify.py
│   ├── classify_2026.py
│   └── build_profiles.py
├── data/
│   ├── raw/
│   ├── processed/
│   └── output/
└── dashboard/
    └── src/
        ├── components/
        │   ├── landscape/
        │   ├── signatories/
        │   └── keyfigures/
        └── data/
```

---

### Setup
```bash
# Python pipeline
pip install -r requirements.txt
cp .env.example .env

# Run pipeline in order
python pipeline/fetch_signatories.py
python pipeline/fetch_member_speeches.py
python pipeline/fetch_2026_ai_debates.py
python pipeline/classify_2026.py
python pipeline/build_profiles.py

# Dashboard
cd dashboard
npm install
npm run dev
```

**Required API keys** (add to `.env`):
- `OPENAI_API_KEY`
- `THEYWORKFORYOU_API_KEY` — free at [theyworkforyou.com/api/key](https://www.theyworkforyou.com/api/key)