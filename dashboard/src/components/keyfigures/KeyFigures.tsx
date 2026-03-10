/* eslint-disable */
// @ts-nocheck
import { useMemo, useState } from 'react'
import speechesData from '../../data/speeches.json'

const PARTY_COLOURS = {
  'Labour': '#E4003B', 'Labour/Co-operative': '#E4003B',
  'Conservative': '#0087DC', 'Liberal Democrat': '#FAA61A',
  'Scottish National Party': '#F59E0B', 'Plaid Cymru': '#166534',
  'Green Party': '#00B140', 'Crossbench': '#9CA3AF',
  'Non-affiliated': '#9CA3AF', 'Independent': '#6B7280',
  'default': '#D1D5DB',
}

const STANCE_CONFIG = {
  'pro_safety':       { label: 'Pro-Safety',      color: '#166534', bg: '#F0FDF4' },
  'pro_acceleration': { label: 'Pro-Acceleration', color: '#9A3412', bg: '#FFF7ED' },
  'concerned':        { label: 'Concerned',        color: '#92400E', bg: '#FFFBEB' },
  'neutral':          { label: 'Neutral',          color: '#374151', bg: '#F9FAFB' },
  'unclear':          { label: 'Unclear',          color: '#6B7280', bg: '#F3F4F6' },
}

// Key figures — manually curated with roles and categories
const KEY_FIGURES = [
  { name: 'Kanishka Narayan',    party: 'Labour',       house: 'Commons', role: 'Minister for AI & Online Safety',        category: 'government',   member_id: 5091 },
  { name: 'Liz Kendall',         party: 'Labour',       house: 'Commons', role: 'Secretary of State, DSIT',               category: 'government',   member_id: 4026 },
  { name: 'Lord Vallance',       party: 'Non-affiliated', house: 'Lords', role: 'Minister for Science',                   category: 'government',   member_id: 4994 },
  { name: 'Ian Murray',          party: 'Labour',       house: 'Commons', role: 'Minister for Digital Government',        category: 'government',   member_id: 4132 },
  { name: 'Feryal Clark',        party: 'Labour',       house: 'Commons', role: 'Former Minister for AI',                 category: 'government',   member_id: 4820 },
  { name: 'Peter Kyle',          party: 'Labour',       house: 'Commons', role: 'Former Secretary of State, DSIT',        category: 'government',   member_id: 4655 },
  { name: 'Chi Onwurah',         party: 'Labour',       house: 'Commons', role: 'Chair, Science & Technology Committee',  category: 'parliament',   member_id: 4113 },
  { name: 'Lord Holmes of Richmond', party: 'Conservative', house: 'Lords', role: 'AI Regulation Bill sponsor',          category: 'parliament',   member_id: 4109 },
  { name: 'Iqbal Mohamed',       party: 'Independent',  house: 'Commons', role: 'Led AI Safety debate, Dec 2025',         category: 'parliament',   member_id: 5042 },
  { name: 'Lord Drayson',        party: 'Labour',       house: 'Lords',   role: 'Lords S&T Committee, Appella AI director', category: 'parliament', member_id: 3489 },
  { name: 'Lord Clement-Jones',  party: 'Liberal Democrat', house: 'Lords', role: 'Most active AI voice in Lords',        category: 'parliament',   member_id: 3396 },
  { name: 'Matt Western',        party: 'Labour',       house: 'Commons', role: 'Science & Technology Committee',         category: 'parliament',   member_id: 4617 },
]

const CATEGORY_CONFIG = {
  government: { label: 'Government', color: '#1B4FD8', bg: '#EEF2FF' },
  parliament:  { label: 'Parliament', color: '#6B21A8', bg: '#F5F3FF' },
}

function dominantStance(speeches) {
  const stances = speeches
    .filter(s => s.classification?.stance && s.classification.stance !== 'unclear')
    .map(s => s.classification.stance)
  if (!stances.length) return 'unclear'
  const c = stances.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc }, {})
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]
}

function FigureCard({ figure, speeches, onClick }) {
  const partyColor = PARTY_COLOURS[figure.party] || PARTY_COLOURS.default
  const sc = STANCE_CONFIG[dominantStance(speeches)] || STANCE_CONFIG['unclear']
  const catCfg = CATEGORY_CONFIG[figure.category]

  return (
    <div
      onClick={() => onClick(figure)}
      className="card-sm"
      style={{
        cursor: 'pointer',
        transition: 'all 0.15s',
        borderLeft: `4px solid ${partyColor}`,
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{
          background: catCfg.bg, color: catCfg.color,
          borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 600,
        }}>
          {catCfg.label}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {speeches.length > 0 ? `${speeches.length} speech${speeches.length > 1 ? 'es' : ''}` : 'No speeches'}
        </span>
      </div>

      <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, marginBottom: 3 }}>{figure.name}</div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.4 }}>{figure.role}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: partyColor }} />
          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{figure.party}</span>
        </div>
        <span style={{
          background: sc.bg, color: sc.color,
          borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 600,
        }}>
          {sc.label}
        </span>
      </div>
    </div>
  )
}

function FigureDrawer({ figure, speeches, onClose }) {
  if (!figure) return null
  const partyColor = PARTY_COLOURS[figure.party] || PARTY_COLOURS.default
  const stance = dominantStance(speeches)
  const sc = STANCE_CONFIG[stance] || STANCE_CONFIG['unclear']
  const catCfg = CATEGORY_CONFIG[figure.category]

  // Top keywords from speeches
  const allText = speeches.map(s => s.text?.replace(/<[^>]+>/g, '') || '').join(' ').toLowerCase()
  const keywords = ['safety', 'regulation', 'risk', 'existential', 'frontier', 'superintelligence', 'compute', 'governance', 'innovation', 'growth', 'opportunity']
  const keywordCounts = keywords.map(k => ({ word: k, count: (allText.match(new RegExp(k, 'g')) || []).length }))
    .filter(k => k.count > 0).sort((a, b) => b.count - a.count).slice(0, 6)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />
      <div style={{
        position: 'relative', zIndex: 201,
        width: 520, maxWidth: '90vw',
        background: 'white',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ borderLeft: `5px solid ${partyColor}`, padding: 24, paddingLeft: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ background: catCfg.bg, color: catCfg.color, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                  {catCfg.label}
                </span>
                <span style={{ background: sc.bg, color: sc.color, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                  {sc.label}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 20, lineHeight: 1.2 }}>{figure.name}</div>
              <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 6 }}>{figure.role}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                {figure.party} · {figure.house}
              </div>
            </div>
            <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-3)', padding: 4, alignSelf: 'flex-start' }}>×</button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 24 }}>{speeches.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>AI speeches</div>
            </div>
            {keywordCounts.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Key themes</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {keywordCounts.map(k => (
                    <span key={k.word} style={{
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 4, padding: '2px 8px', fontSize: 11, color: 'var(--text-2)',
                    }}>
                      {k.word} <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{k.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

        {/* Speeches */}
        <div style={{ padding: 24 }}>
          <div className="label" style={{ marginBottom: 12 }}>AI Speeches</div>
          {speeches.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {speeches.slice(0, 6).map((s, i) => {
                const speechStance = STANCE_CONFIG[s.classification?.stance] || null
                return (
                  <div key={i} style={{
                    background: 'var(--bg)', borderRadius: 8, padding: 14,
                    borderLeft: `3px solid ${partyColor}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {s.date} · {s.debate_title || s.search_term}
                      </span>
                      {speechStance && (
                        <span style={{ background: speechStance.bg, color: speechStance.color, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>
                          {speechStance.label}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>
                      {s.text?.replace(/<[^>]+>/g, '').slice(0, 300)}…
                    </div>
                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6, display: 'inline-block' }}>
                      View in Hansard →
                    </a>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ color: 'var(--text-3)', fontSize: 13 }}>
              No AI speeches found in our dataset for this figure.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function KeyFigures() {
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

  const [selected, setSelected] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filtered = KEY_FIGURES.filter(f =>
    categoryFilter === 'all' || f.category === categoryFilter
  )

  const government = KEY_FIGURES.filter(f => f.category === 'government')
  const parliament = KEY_FIGURES.filter(f => f.category === 'parliament')

  const totalSpeeches = KEY_FIGURES.reduce((sum, f) => sum + (speechIndex[f.name]?.length || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Header */}
      <div>
        <div className="label" style={{ marginBottom: 8 }}>AI Policy Landscape</div>
        <h1 className="page-title">Key Figures</h1>
        <p className="page-subtitle" style={{ maxWidth: 560 }}>
          Ministers, committee chairs and influential parliamentary voices shaping UK AI policy.
          These are the people ControlAI needs to engage with.
        </p>
      </div>

      {/* Stats */}
      <div className="grid-4">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="stat-number">{KEY_FIGURES.length}</div>
          <div className="stat-label">Key figures tracked</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="stat-number">{government.length}</div>
          <div className="stat-label">Government ministers</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Current & recent</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="stat-number">{parliament.length}</div>
          <div className="stat-label">Parliamentary voices</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Committees & advocates</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="stat-number">{totalSpeeches}</div>
          <div className="stat-label">Total AI speeches</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Across all figures</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[['all', 'All'], ['government', 'Government'], ['parliament', 'Parliament']].map(([v, l]) => (
          <button key={v} onClick={() => setCategoryFilter(v)} style={{
            padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)',
            background: categoryFilter === v ? 'var(--accent)' : 'var(--surface)',
            color: categoryFilter === v ? 'white' : 'var(--text-2)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid-3">
        {filtered.map(figure => (
          <FigureCard
            key={figure.name}
            figure={figure}
            speeches={speechIndex[figure.name] || []}
            onClick={setSelected}
          />
        ))}
      </div>

      {/* Engagement ranking */}
      <div className="card">
        <div className="section-title">Engagement Ranking</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[...KEY_FIGURES]
            .map(f => ({ ...f, count: speechIndex[f.name]?.length || 0 }))
            .sort((a, b) => b.count - a.count)
            .map((f, i) => {
              const partyColor = PARTY_COLOURS[f.party] || PARTY_COLOURS.default
              const stance = dominantStance(speechIndex[f.name] || [])
              const sc = STANCE_CONFIG[stance]
              const catCfg = CATEGORY_CONFIG[f.category]
              const max = speechIndex[KEY_FIGURES[0].name]?.length || 1
              const pct = (f.count / Math.max(...KEY_FIGURES.map(k => speechIndex[k.name]?.length || 0))) * 100

              return (
                <div
                  key={f.name}
                  onClick={() => setSelected(f)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '10px 0', cursor: 'pointer',
                    borderBottom: i < KEY_FIGURES.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ width: 22, textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>{i + 1}</div>
                  <div style={{ width: 4, height: 28, borderRadius: 2, background: partyColor, flexShrink: 0 }} />
                  <div style={{ width: 180, flexShrink: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{f.role}</div>
                  </div>
                  <span style={{ background: catCfg.bg, color: catCfg.color, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                    {catCfg.label}
                  </span>
                  <div style={{ flex: 1, background: 'var(--border)', borderRadius: 4, height: 16, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, background: partyColor, height: '100%', borderRadius: 4, minWidth: f.count > 0 ? 4 : 0 }} />
                  </div>
                  <div style={{ minWidth: 50, textAlign: 'right', fontSize: 12, fontWeight: 600 }}>
                    {f.count} <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: 10 }}>speeches</span>
                  </div>
                  <span style={{ background: sc.bg, color: sc.color, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                    {sc.label}
                  </span>
                </div>
              )
            })}
        </div>
      </div>

      <FigureDrawer
        figure={selected}
        speeches={selected ? speechIndex[selected.name] || [] : []}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}