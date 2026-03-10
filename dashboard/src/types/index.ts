export interface Classification {
  is_ai_relevant: boolean
  topic: string
  stance: string
  mentions_existential_risk: boolean
  mentions_compute_governance: boolean
  mentions_international_coordination: boolean
  key_quote: string
  summary: string
  confidence: number
}

export interface Speech {
  member_name: string
  party: string
  house: string
  date: string
  debate_title: string
  text: string
  url: string
  search_term: string
  classification: Classification | null
}

export interface MPProfile {
  member_id: number
  name: string
  full_title: string
  party: string
  party_colour: string
  party_abbreviation: string
  house: string
  constituency: string
  thumbnail_url: string
  controlai_signatory: boolean
  ai_questions_count: number
  total_questions_count: number
  engagement_score: number
  dominant_stance: string
  top_topics: string[]
  key_quotes: {
    quote: string
    date: string
    topic: string
    stance: string
    url: string
  }[]
}