/* eslint-disable */
// @ts-nocheck
import { useMemo, useState } from 'react'
import profilesData from '../../data/mp_profiles.json'
import speechesData from '../../data/speeches.json'

const PARTY_COLOURS = {
  'Labour': '#E4003B', 'Labour (Co-op)': '#E4003B',
  'Conservative': '#0087DC', 'Liberal Democrat': '#FAA61A',
  'Scottish National Party': '#F59E0B', 'Plaid Cymru': '#166534',
  'Green Party': '#00B140', 'Crossbench': '#9CA3AF',
  'Non-affiliated': '#9CA3AF', 'Independent': '#6B7280',
  'Alliance': '#F6CB2F', 'default': '#D1D5DB',
}

const STANCE_CONFIG = {
  'pro_safety':       { label: 'Pro-Safety',      color: '#34D399', bg: 'rgba(52,211,153,0.12)'  },
  'pro_acceleration': { label: 'Pro-Acceleration', color: '#FB923C', bg: 'rgba(251,146,60,0.12)'  },
  'concerned':        { label: 'Concerned',        color: '#FBBF24', bg: 'rgba(251,191,36,0.12)'  },
  'neutral':          { label: 'Neutral',          color: '#94A3B8', bg: 'rgba(148,163,184,0.08)' },
  'unclear':          { label: 'Unclear',          color: '#55556A', bg: 'rgba(85,85,106,0.08)'   },
}

const TOPIC_LABELS = {
  'ai_public_services': 'Public Services',
  'ai_regulation_governance': 'Regulation & Governance',
  'ai_safety_risks': 'Safety Risks',
  'ai_general_technology': 'General Technology',
  'autonomous_weapons': 'Autonomous Weapons',
  'labour_displacement': 'Labour & Economy',
  'surveillance_civil_liberties': 'Surveillance',
  'international_coordination': 'International',
}

function dominantStance(stances) {
  if (!stances.length) return 'unclear'
  const c = stances.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc }, {})
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]
}

function MPCard({ profile, memberSpeeches, stance, onClick }) {
  const partyColor = PARTY_COLOURS[profile.party] || PARTY_COLOURS.default
  const sc = STANCE_CONFIG[stance] || STANCE_CONFIG['unclear']

  return (
    <div
      onClick={() => onClick(profile)}
      className="card-sm"
      style={{ cursor: 'pointer', borderTop: `3px solid ${partyColor}` }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <img
          src={profile.thumbnail_url}
          alt={profile.name}
          style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: 'var(--surface-3)' }}
          onError={e => { e.target.style.display = 'none' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, color: 'var(--text-1)' }}>{profile.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
            {profile.party} · {profile.house}
          </div>
          {profile.constituency && (
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{profile.constituency}</div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <span style={{ background: sc.bg, color: sc.color, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>
          {sc.label}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {memberSpeeches.length > 0 ? `${memberSpeeches.length} speech${memberSpeeches.length > 1 ? 'es' : ''}` : 'No speeches'}
        </span>
      </div>
    </div>
  )
}

function MPDrawer({ profile, memberSpeeches, stance, onClose }) {
  if (!profile) return null
  const partyColor = PARTY_COLOURS[profile.party] || PARTY_COLOURS.default
  const sc = STANCE_CONFIG[stance] || STANCE_CONFIG['unclear']

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{
        position: 'relative', zIndex: 201,
        width: 480, maxWidth: '90vw',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.5)',
        overflowY: 'auto',
      }}>
        <div style={{ borderTop: `4px solid ${partyColor}`, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <img
                src={profile.thumbnail_url}
                alt={profile.name}
                style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', background: 'var(--surface-3)' }}
                onError={e => { e.target.style.display = 'none' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2, color: 'var(--text-1)' }}>{profile.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>{profile.party}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {profile.house}{profile.constituency ? ` · ${profile.constituency}` : ''}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-3)', padding: 4 }}>×</button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{ background: sc.bg, color: sc.color, borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
              {sc.label}
            </span>
            <span style={{ background: 'rgba(79,127,255,0.12)', color: '#4F7FFF', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
              ControlAI Signatory
            </span>
            {memberSpeeches.length > 0 && (
              <span style={{ background: 'var(--surface-2)', color: 'var(--text-2)', borderRadius: 6, padding: '4px 12px', fontSize: 12 }}>
                {memberSpeeches.length} AI speech{memberSpeeches.length > 1 ? 'es' : ''}
              </span>
            )}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

        {profile.top_topics?.length > 0 && (
          <div style={{ padding: '16px 24px' }}>
            <div className="label" style={{ marginBottom: 10 }}>Top Topics</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {profile.top_topics.map(t => (
                <span key={t} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: 'var(--text-2)' }}>
                  {TOPIC_LABELS[t] || t}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: '0 24px 24px' }}>
          <div className="label" style={{ marginBottom: 12 }}>AI Speeches</div>
          {memberSpeeches.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {memberSpeeches.slice(0, 5).map((s, i) => (
                <div key={i} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 14, borderLeft: `3px solid ${partyColor}` }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
                    {s.date} · {s.debate_title || s.search_term}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>
                    {s.text?.replace(/<[^>]+>/g, '').slice(0, 280)}…
                  </div>
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: '#4F7FFF', marginTop: 6, display: 'inline-block' }}>
                    View in Hansard →
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-3)', fontSize: 13 }}>No AI speeches found for this member.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SignatoryNetwork() {
  const signatories = useMemo(() =>
    (profilesData as any[]).filter(p => p.controlai_signatory)
  , [])

  const speeches = useMemo(() => speechesData as any[], [])

  const speechIndex = useMemo(() => {
    const idx = {}
    speeches.forEach(s => {
      const name = s.member_name
      if (!name) return
      if (!idx[name]) idx[name] = []
      idx[name].push(s)
    })
    return idx
  }, [speeches])

  const stanceMap = useMemo(() => {
    const map = {}
    signatories.forEach(p => {
      const memberSpeeches = speechIndex[p.name] || []
      const speechStances = memberSpeeches
        .filter(s => s.classification?.stance && s.classification.stance !== 'unclear')
        .map(s => s.classification.stance)
      if (speechStances.length > 0) {
        map[p.name] = dominantStance(speechStances)
      } else if (p.dominant_stance && p.dominant_stance !== 'unclear') {
        map[p.name] = p.dominant_stance
      } else {
        map[p.name] = 'pro_safety'
      }
    })
    return map
  }, [signatories, speechIndex])

  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const stats = useMemo(() => {
    const commons = signatories.filter(p => p.house === 'Commons').length
    const lords = signatories.filter(p => p.house === 'Lords').length
    const parties = {}
    signatories.forEach(p => { parties[p.party] = (parties[p.party] || 0) + 1 })
    return { commons, lords, parties }
  }, [signatories])

  const filtered = useMemo(() =>
    signatories.filter(p => {
      if (filter === 'commons' && p.house !== 'Commons') return false
      if (filter === 'lords' && p.house !== 'Lords') return false
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
          !p.party.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  , [signatories, filter, search])

  const partyEntries = Object.entries(stats.parties)
    .sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 6)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Header */}
      <div>
        <div className="label" style={{ marginBottom: 8 }}>ControlAI Campaign</div>
        <h1 className="page-title">Signatory Network</h1>
        <p className="page-subtitle" style={{ maxWidth: 520 }}>
          Cross-party parliamentarians who have publicly supported ControlAI's campaign for binding regulation of frontier AI systems.
        </p>
      </div>

      {/* Party breakdown */}
      <div className="card">
        <div className="section-title">Party Breakdown — {signatories.length} Westminster Signatories</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {partyEntries.map(([party, count]) => {
            const color = PARTY_COLOURS[party] || PARTY_COLOURS.default
            const pct = ((count as number) / signatories.length) * 100
            return (
              <div key={party} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 150, fontSize: 12, color: 'var(--text-2)', textAlign: 'right', flexShrink: 0 }}>{party}</div>
                <div style={{ flex: 1, background: 'var(--surface-3)', borderRadius: 4, height: 20, overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, background: color, height: '100%', borderRadius: 4,
                    display: 'flex', alignItems: 'center', paddingLeft: 8, minWidth: 24,
                  }}>
                    <span style={{ fontSize: 11, color: 'white', fontWeight: 600 }}>{count}</span>
                  </div>
                </div>
                <div style={{ width: 32, fontSize: 11, color: 'var(--text-3)', textAlign: 'right' }}>{Math.round(pct)}%</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', `All (${signatories.length})`], ['commons', `Commons (${stats.commons})`], ['lords', `Lords (${stats.lords})`]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{
              padding: '6px 14px', borderRadius: 6,
              border: `1px solid ${filter === v ? '#4F7FFF44' : 'var(--border)'}`,
              background: filter === v ? 'rgba(79,127,255,0.12)' : 'var(--surface)',
              color: filter === v ? '#4F7FFF' : 'var(--text-2)',
              fontSize: 12, fontWeight: filter === v ? 600 : 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>{l}</button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name or party..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, width: 220 }}
        />
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{filtered.length} shown</span>
      </div>

      {/* Grid */}
      <div className="grid-3">
        {filtered.map(profile => (
          <MPCard
            key={profile.member_id}
            profile={profile}
            memberSpeeches={speechIndex[profile.name] || []}
            stance={stanceMap[profile.name]}
            onClick={setSelected}
          />
        ))}
      </div>

      {/* Drawer */}
      <MPDrawer
        profile={selected}
        memberSpeeches={selected ? speechIndex[selected.name] || [] : []}
        stance={selected ? stanceMap[selected.name] : 'unclear'}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}