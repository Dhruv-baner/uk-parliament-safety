/* eslint-disable */
// @ts-nocheck
import { useMemo, useState, useEffect } from 'react'
import rawData from '../../data/debates_2026.json'

const PARTY_COLOURS = {
  'Labour': '#E4003B', 'Labour/Co-operative': '#E4003B',
  'Conservative': '#0087DC', 'Liberal Democrat': '#FAA61A',
  'Scottish National Party': '#F59E0B', 'Plaid Cymru': '#166534',
  'Green Party': '#00B140', 'Crossbench': '#9CA3AF',
  'Non-affiliated': '#9CA3AF', 'Independent': '#6B7280',
  'DUP': '#8B1A1A', 'default': '#D1D5DB',
}

const TOPIC_LABELS = {
  'ai_public_services': 'Public Services',
  'ai_regulation_governance': 'Regulation & Governance',
  'ai_safety_risks': 'Safety Risks',
  'ai_general_technology': 'General Technology',
  'autonomous_weapons': 'Autonomous Weapons',
  'labour_displacement': 'Labour & Economy',
  'surveillance_civil_liberties': 'Surveillance & Civil Liberties',
  'international_coordination': 'International Coordination',
}

const TOPIC_COLOURS = {
  'ai_public_services': '#3B82F6',
  'ai_regulation_governance': '#8B5CF6',
  'ai_safety_risks': '#EF4444',
  'ai_general_technology': '#6B7280',
  'autonomous_weapons': '#F97316',
  'labour_displacement': '#F59E0B',
  'surveillance_civil_liberties': '#EC4899',
  'international_coordination': '#10B981',
}

const STANCE_CONFIG = {
  'pro_safety':       { label: 'Pro-Safety',      color: '#34D399', bg: 'rgba(52,211,153,0.12)',  bar: '#34D399' },
  'pro_acceleration': { label: 'Pro-Acceleration', color: '#FB923C', bg: 'rgba(251,146,60,0.12)',  bar: '#FB923C' },
  'concerned':        { label: 'Concerned',        color: '#FBBF24', bg: 'rgba(251,191,36,0.12)',  bar: '#FBBF24' },
  'neutral':          { label: 'Neutral',          color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', bar: '#94A3B8' },
  'unclear':          { label: 'Unclear',          color: '#55556A', bg: 'rgba(85,85,106,0.08)',   bar: '#55556A' },
}

function countBy(arr, key) {
  return arr.reduce((acc, item) => { const k = key(item); acc[k] = (acc[k] || 0) + 1; return acc }, {})
}
function dominantStance(stances) {
  if (!stances.length) return 'unclear'
  const c = countBy(stances, s => s)
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]
}

// --- ROTATING STAT CARD ---
function RotatingStatCard({ stats, proSafetyPct }) {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  const items = [
    { value: stats.total, label: 'AI-Relevant Speeches', sub: 'January – March 2026', accent: '#4F7FFF' },
    { value: `${proSafetyPct}%`, label: 'Pro-Safety Voices', sub: `${stats.proSafety} speeches classified pro-safety`, accent: '#34D399' },
    { value: stats.existential, label: 'Mention Existential Risk', sub: 'Frontier-aware parliamentarians', accent: '#EF4444' },
    { value: stats.speakers, label: 'Unique Speakers', sub: 'Across Commons and Lords', accent: '#8B5CF6' },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % items.length)
        setVisible(true)
      }, 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const item = items[idx]

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${item.accent}44`,
      borderRadius: 20,
      padding: '32px 36px',
      display: 'flex',
      alignItems: 'center',
      gap: 32,
      boxShadow: `0 0 32px ${item.accent}18`,
      transition: 'border-color 0.4s, box-shadow 0.4s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 180, height: 180, borderRadius: '50%',
        background: `radial-gradient(circle, ${item.accent}18, transparent 70%)`,
        transition: 'all 0.4s',
        pointerEvents: 'none',
      }} />

      {/* Circle indicator */}
      <div style={{
        width: 100, height: 100, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${item.accent}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(circle, ${item.accent}14, transparent 70%)`,
        position: 'relative',
      }}>
        <svg width={100} height={100} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
          <circle cx={50} cy={50} r={46} fill="none" stroke={`${item.accent}22`} strokeWidth={3} />
          <circle cx={50} cy={50} r={46} fill="none" stroke={item.accent} strokeWidth={3}
            strokeDasharray={`${(idx + 1) / items.length * 289} 289`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: item.accent,
            letterSpacing: '0.8px', textTransform: 'uppercase',
            opacity: 0.7,
          }}>{idx + 1}/{items.length}</div>
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.3s, transform 0.3s' }}>
        <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2.5px', color: 'var(--text-1)', lineHeight: 1, marginBottom: 8 }}>
          {item.value}
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>{item.label}</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{item.sub}</div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end', paddingBottom: 4 }}>
        {items.map((_, i) => (
          <div key={i} onClick={() => { setIdx(i); setVisible(true) }} style={{
            width: i === idx ? 20 : 6, height: 6, borderRadius: 3,
            background: i === idx ? item.accent : 'var(--border-2)',
            transition: 'all 0.3s', cursor: 'pointer',
          }} />
        ))}
      </div>
    </div>
  )
}

// --- HORIZONTAL BAR CHART ---
function HBarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-1)', fontWeight: 500 }}>{d.name}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
          </div>
          <div style={{ background: 'var(--surface-3)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
            <div style={{
              width: `${(d.value / max) * 100}%`,
              background: d.color,
              height: '100%', borderRadius: 6,
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// --- STANCE DONUT (sleek, no white outlines) ---
function BigDonut({ data, total }) {
  const [hovered, setHovered] = useState(null)
  const size = 220
  const cx = size / 2, cy = size / 2
  const r = 88, innerR = 58
  let cumulative = 0

  const segments = data.map((d, idx) => {
    const pct = d.value / total
    const gap = 0.008
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2 + gap
    cumulative += pct
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2 - gap
    const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0
    const isHovered = hovered === idx
    const rr = isHovered ? r + 7 : r
    const x1 = cx + rr * Math.cos(startAngle), y1 = cy + rr * Math.sin(startAngle)
    const x2 = cx + rr * Math.cos(endAngle),   y2 = cy + rr * Math.sin(endAngle)
    const ix1 = cx + innerR * Math.cos(endAngle),   iy1 = cy + innerR * Math.sin(endAngle)
    const ix2 = cx + innerR * Math.cos(startAngle), iy2 = cy + innerR * Math.sin(startAngle)
    const path = `M ${x1} ${y1} A ${rr} ${rr} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`
    return { ...d, path, pct, idx }
  })

  const hoveredSeg = hovered !== null ? segments[hovered] : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width={size} height={size} style={{ overflow: 'visible', flexShrink: 0 }}>
        <defs>
          {segments.map((s, i) => (
            <radialGradient key={i} id={`grad${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={s.bar} stopOpacity="1"/>
              <stop offset="100%" stopColor={s.bar} stopOpacity="0.7"/>
            </radialGradient>
          ))}
        </defs>
        {segments.map((s, i) => (
          <path key={i} d={s.path}
            fill={`url(#grad${i})`}
            stroke="none"
            style={{ cursor: 'pointer', transition: 'all 0.2s', filter: hovered === i ? `drop-shadow(0 0 10px ${s.bar}88)` : 'none' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        {hoveredSeg ? (
          <>
            <text x={cx} y={cy - 16} textAnchor="middle" fontSize={30} fontWeight={800} fill="var(--text-1)">{hoveredSeg.value}</text>
            <text x={cx} y={cy + 8} textAnchor="middle" fontSize={12} fontWeight={600} fill={hoveredSeg.bar}>{hoveredSeg.name}</text>
            <text x={cx} y={cy + 26} textAnchor="middle" fontSize={12} fill="var(--text-2)">{Math.round(hoveredSeg.pct * 100)}%</text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 8} textAnchor="middle" fontSize={34} fontWeight={800} fill="var(--text-1)">{total}</text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--text-3)" letterSpacing="1">TOTAL</text>
          </>
        )}
      </svg>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map((s, i) => (
          <div key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
              background: hovered === i ? s.bg : 'transparent',
              border: `1px solid ${hovered === i ? s.bar + '44' : 'transparent'}`,
              transition: 'all 0.15s',
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.bar, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: hovered === i ? 600 : 400, color: hovered === i ? 'var(--text-1)' : 'var(--text-2)', transition: 'all 0.15s' }}>{s.name}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.bar }}>{s.value}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', width: 34, textAlign: 'right' }}>{Math.round(s.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- PARTY BARS (visible by default) ---
function PartyBars({ data }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const [hovered, setHovered] = useState(null)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 150, paddingTop: 24 }}>
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * 120, 4)
        const isH = hovered === i
        return (
          <div key={i}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: isH ? d.color : 'var(--text-1)', transition: 'color 0.15s' }}>{d.value}</span>
            <div style={{
              width: '100%', maxWidth: 38,
              background: isH ? d.color : `${d.color}CC`,
              borderRadius: '6px 6px 0 0',
              height: `${h}px`,
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: isH ? `0 -6px 16px ${d.color}66` : 'none',
              cursor: 'default',
            }} />
            <span style={{ fontSize: 9, color: isH ? 'var(--text-2)' : 'var(--text-3)', textAlign: 'center', maxWidth: 50, lineHeight: 1.2, transition: 'color 0.15s' }}>{d.name}</span>
          </div>
        )
      })}
    </div>
  )
}

// --- MINI TIMELINE ---
function MiniTimeline({ data }) {
  if (!data.length) return null
  const w = 280, h = 80, pad = { t: 16, r: 12, b: 24, l: 12 }
  const max = Math.max(...data.map(d => d.value), 1)
  const xs = (i) => pad.l + (i / Math.max(data.length - 1, 1)) * (w - pad.l - pad.r)
  const ys = (v) => pad.t + (1 - v / max) * (h - pad.t - pad.b)
  const pts = data.map((d, i) => `${xs(i)},${ys(d.value)}`).join(' ')
  const [hovered, setHovered] = useState(null)

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F7FFF" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#4F7FFF" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`${xs(0)},${ys(0)} ${pts} ${xs(data.length-1)},${ys(0)}`} fill="url(#tGrad)" />
      <polyline points={pts} fill="none" stroke="#4F7FFF" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"/>
      {data.map((d, i) => (
        <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'default' }}>
          <circle cx={xs(i)} cy={ys(d.value)} r={hovered === i ? 6 : 4} fill="#4F7FFF" stroke="#0A0A0F" strokeWidth={2} style={{ transition: 'r 0.15s' }}/>
          <text x={xs(i)} y={h - 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--text-2)">{d.label}</text>
          {hovered === i && (
            <g>
              <rect x={xs(i) - 22} y={ys(d.value) - 28} width={44} height={20} rx={5} fill="#4F7FFF"/>
              <text x={xs(i)} y={ys(d.value) - 14} textAnchor="middle" fontSize={11} fontWeight={700} fill="white">{d.value}</text>
            </g>
          )}
        </g>
      ))}
    </svg>
  )
}

function Tab({ id, label, active, onClick }) {
  return (
    <button onClick={() => onClick(id)} style={{
      padding: '10px 22px', border: 'none', background: 'none', cursor: 'pointer',
      fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 400,
      color: active ? 'var(--text-1)' : 'var(--text-3)',
      borderBottom: active ? '2px solid #4F7FFF' : '2px solid transparent',
      marginBottom: -1, transition: 'all 0.15s',
    }}>{label}</button>
  )
}

export default function Landscape() {
  const speeches = useMemo(() => rawData.filter(s => s.classification?.is_ai_relevant), [])
  const [activeTab, setActiveTab] = useState('overview')
  const [feedFilter, setFeedFilter] = useState('all')

  const stats = useMemo(() => {
    const topics  = countBy(speeches, s => s.classification.topic)
    const stances = countBy(speeches, s => s.classification.stance)
    const parties = countBy(speeches, s => s.party || 'Unknown')
    const existential = speeches.filter(s => s.classification?.mentions_existential_risk).length
    const byMonth = {}
    speeches.forEach(s => { const m = s.date?.slice(0, 7); if (m) byMonth[m] = (byMonth[m] || 0) + 1 })
    const bySpeaker = {}
    speeches.forEach(s => {
      const n = s.member_name || 'Unknown'
      if (!bySpeaker[n]) bySpeaker[n] = { count: 0, party: s.party || '', stances: [] }
      bySpeaker[n].count++
      if (s.classification?.stance) bySpeaker[n].stances.push(s.classification.stance)
    })
    return { topics, stances, parties, existential, byMonth, bySpeaker, total: speeches.length, proSafety: stances['pro_safety'] || 0, speakers: Object.keys(bySpeaker).length }
  }, [speeches])

  const proSafetyPct = Math.round((stats.proSafety / speeches.length) * 100)

  const topicData = Object.entries(stats.topics)
    .filter(([k]) => k !== 'not_relevant')
    .map(([k, v]) => ({ name: TOPIC_LABELS[k] || k, value: v, color: TOPIC_COLOURS[k] || '#6B7280' }))
    .sort((a, b) => b.value - a.value)

  const stanceData = Object.entries(stats.stances)
    .map(([k, v]) => ({ name: STANCE_CONFIG[k]?.label || k, value: v, bar: STANCE_CONFIG[k]?.bar || '#ccc', bg: STANCE_CONFIG[k]?.bg || '#111', color: STANCE_CONFIG[k]?.color || '#666' }))
    .sort((a, b) => b.value - a.value)

  const partyData = Object.entries(stats.parties)
    .filter(([k]) => k && k !== 'Unknown' && k !== '')
    .map(([k, v]) => ({
      name: k.replace('Labour/Co-operative','Lab/Co-op').replace('Liberal Democrat','Lib Dem').replace('Scottish National Party','SNP').replace('Non-affiliated','Non-aff.'),
      value: v, color: PARTY_COLOURS[k] || PARTY_COLOURS.default
    }))
    .sort((a, b) => b.value - a.value).slice(0, 7)

  const timelineData = Object.entries(stats.byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, v]) => ({ label: m === '2026-01' ? 'Jan' : m === '2026-02' ? 'Feb' : 'Mar', value: v }))

  const topSpeakers = Object.entries(stats.bySpeaker)
    .sort((a, b) => b[1].count - a[1].count).slice(0, 15)

  const feedSpeeches = useMemo(() =>
    speeches
      .filter(s => feedFilter === 'all' || s.classification?.stance === feedFilter)
      .filter(s => s.classification?.key_quote)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30)
  , [speeches, feedFilter])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Header */}
      <div>
        <div className="label" style={{ marginBottom: 10 }}>January – March 2026</div>
        <h1 className="page-title">The Landscape</h1>
        <p className="page-subtitle" style={{ maxWidth: 480 }}>
          Every AI-related speech in UK Parliament, classified by topic and stance using GPT-4o.
        </p>
      </div>

      {/* Rotating stat card */}
      <RotatingStatCard stats={stats} proSafetyPct={proSafetyPct} />

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <Tab id="overview" label="Overview" active={activeTab === 'overview'} onClick={setActiveTab} />
        <Tab id="voices" label="Voices" active={activeTab === 'voices'} onClick={setActiveTab} />
        <Tab id="feed" label="Speech Feed" active={activeTab === 'feed'} onClick={setActiveTab} />
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px' }}>
              <div className="section-title">What Parliament is saying about AI</div>
              <HBarChart data={topicData} />
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px' }}>
              <div className="section-title">Stance Distribution</div>
              <BigDonut data={stanceData} total={speeches.length} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px' }}>
              <div className="section-title">Engagement by Party</div>
              <PartyBars data={partyData} />
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="section-title" style={{ marginBottom: 0 }}>Monthly Activity</div>
                <span style={{ fontSize: 10, color: 'var(--text-3)', background: 'var(--surface-2)', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>2026</span>
              </div>
              <MiniTimeline data={timelineData} />
            </div>
          </div>
        </div>
      )}

      {/* VOICES */}
      {activeTab === 'voices' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Most Active AI Speakers in 2026</div>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Top 15 by speech count</span>
          </div>
          <div style={{ padding: '0 24px' }}>
            {topSpeakers.map(([name, data], i) => {
              const stance = dominantStance(data.stances)
              const sc = STANCE_CONFIG[stance]
              const partyColor = PARTY_COLOURS[data.party] || PARTY_COLOURS.default
              const maxCount = topSpeakers[0][1].count
              return (
                <div key={name} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0',
                  borderBottom: i < topSpeakers.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ width: 24, textAlign: 'right', fontSize: 13, fontWeight: 700, color: i < 3 ? '#4F7FFF' : 'var(--text-3)' }}>{i + 1}</div>
                  <div style={{ width: 4, height: 34, borderRadius: 2, background: partyColor, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{data.party}</div>
                  </div>
                  <div style={{ width: 120, background: 'var(--surface-3)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${(data.count / maxCount) * 100}%`, background: partyColor, height: '100%', borderRadius: 4 }} />
                  </div>
                  <div style={{ background: sc?.bg, color: sc?.color, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                    {sc?.label || stance}
                  </div>
                  <div style={{ minWidth: 52, textAlign: 'right', fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>
                    {data.count}<span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: 10, marginLeft: 2 }}>sp</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* FEED */}
      {activeTab === 'feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['all', 'pro_safety', 'concerned', 'pro_acceleration', 'neutral'].map(f => {
              const cfg = f !== 'all' ? STANCE_CONFIG[f] : null
              const isActive = feedFilter === f
              return (
                <button key={f} onClick={() => setFeedFilter(f)} style={{
                  padding: '7px 16px', borderRadius: 8,
                  border: `1px solid ${isActive ? (cfg?.bar || '#4F7FFF') + '66' : 'var(--border)'}`,
                  background: isActive ? (cfg?.bg || 'rgba(79,127,255,0.12)') : 'var(--surface)',
                  color: isActive ? (cfg?.color || '#4F7FFF') : 'var(--text-2)',
                  fontSize: 12, fontWeight: isActive ? 700 : 500, cursor: 'pointer',
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}>
                  {f === 'all' ? 'All speeches' : cfg?.label || f}
                </button>
              )
            })}
          </div>

          {feedSpeeches.map((s, i) => {
            const sc = STANCE_CONFIG[s.classification?.stance || '']
            const partyColor = PARTY_COLOURS[s.party] || PARTY_COLOURS.default
            return (
              <div key={i} style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
                padding: '18px 20px', display: 'flex', gap: 16, transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ width: 3, borderRadius: 4, background: partyColor, flexShrink: 0, alignSelf: 'stretch', minHeight: 40 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{s.member_name}</span>
                      <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{s.party}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {sc && <span style={{ background: sc.bg, color: sc.color, borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700 }}>{sc.label}</span>}
                      <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--surface-2)', borderRadius: 5, padding: '2px 8px' }}>{s.date}</span>
                    </div>
                  </div>
                  {s.classification?.key_quote && (
                    <div style={{ margin: '12px 0 8px', padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, borderLeft: `3px solid ${partyColor}`, fontSize: 13, fontStyle: 'italic', lineHeight: 1.6, color: 'var(--text-1)' }}>
                      "{s.classification.key_quote}"
                    </div>
                  )}
                  {s.classification?.summary && <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{s.classification.summary}</div>}
                  {s.debate_title && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>📋 {s.debate_title}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}