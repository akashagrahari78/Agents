import { motion } from 'framer-motion'
import { HiOutlineBookOpen, HiOutlineGlobe, HiOutlineLibrary } from 'react-icons/hi'

const modes = [
  { id: 'hybrid', title: 'Hybrid', desc: 'Pre-trained + Web', icon: HiOutlineGlobe },
  { id: 'open_book', title: 'Open Book', desc: 'Web Only', icon: HiOutlineLibrary },
  { id: 'closed_book', title: 'Closed Book', desc: 'Pre-trained Only', icon: HiOutlineBookOpen },
]

export default function ModeSelector({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
      {modes.map((mode) => {
        const Icon = mode.icon
        const active = value === mode.id
        return (
          <button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            style={{
              position: 'relative', overflow: 'hidden', padding: '1rem 0.75rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer',
              backgroundColor: active ? 'rgba(139, 92, 246, 0.05)' : 'var(--color-bg-elevated)',
              boxShadow: active ? 'inset 0 0 0 1.5px #8b5cf6' : 'inset 0 0 0 1px var(--color-border)',
              transition: 'all 0.2s', textAlign: 'center'
            }}
          >
            <div style={{ position: 'relative', zIndex: 10 }}>
              <Icon style={{ width: '1.25rem', height: '1.25rem', margin: '0 auto 0.5rem auto', color: active ? '#c084fc' : 'var(--color-text-muted)' }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.2rem', color: active ? '#c084fc' : 'var(--color-text-primary)' }}>
                {mode.title}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-subtle)' }}>
                {mode.desc}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
