type Section = 'landscape' | 'signatories' | 'keyfigures'

const SECTIONS = [
  { id: 'landscape',   label: 'The Landscape' },
  { id: 'signatories', label: 'Signatory Network' },
  { id: 'keyfigures',  label: 'Key Figures' },
] as const

export default function Nav({ active, setActive }: {
  active: Section
  setActive: (s: Section) => void
}) {
  return (
    <nav style={{
      background: 'rgba(10,10,15,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1320,
        margin: '0 auto',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, #4F7FFF, #818CF8)',
            borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(79,127,255,0.4)',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.5" opacity="0.4"/>
              <circle cx="9" cy="9" r="3.5" fill="white"/>
              <circle cx="9" cy="2" r="1.5" fill="white" opacity="0.7"/>
              <circle cx="9" cy="16" r="1.5" fill="white" opacity="0.7"/>
              <circle cx="2" cy="9" r="1.5" fill="white" opacity="0.7"/>
              <circle cx="16" cy="9" r="1.5" fill="white" opacity="0.7"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.4px', color: 'var(--text-1)' }}>UK Parliament AI</div>
            <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginTop: 1 }}>Intelligence Dashboard</div>
          </div>
        </div>

        {/* Nav pills */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--surface)', borderRadius: 12, padding: 4, border: '1px solid var(--border)' }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id as Section)}
              style={{
                padding: '7px 18px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: active === s.id ? 600 : 400,
                background: active === s.id ? 'var(--surface-3)' : 'transparent',
                color: active === s.id ? 'var(--text-1)' : 'var(--text-3)',
                transition: 'all 0.15s',
                boxShadow: active === s.id ? '0 0 12px rgba(79,127,255,0.15)' : 'none',
                letterSpacing: '-0.1px',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
            <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>Live data</span>
          </div>
        </div>
      </div>
    </nav>
  )
}