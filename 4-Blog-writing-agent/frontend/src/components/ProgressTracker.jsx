import { motion } from 'framer-motion'
import { HiCheck, HiOutlineDesktopComputer } from 'react-icons/hi'

export default function ProgressTracker({ steps }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {steps.map((step, idx) => (
        <motion.div
          key={`${step.id}-${idx}`}
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}
        >
          {/* Node dot / indicator */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0.25rem' }}>
            <div
              style={{
                width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                backgroundColor: step.status === 'done' ? '#10b981' : step.status === 'active' ? '#c084fc' : step.status === 'error' ? '#ef4444' : 'var(--color-bg-hover)',
                border: step.status === 'pending' ? '2px solid var(--color-border)' : 'none',
              }}
            >
              {step.status === 'done' && <HiCheck size={10} color="#fff" />}
              {step.status === 'active' && <div style={{ width: '6px', height: '6px', backgroundColor: '#fff', borderRadius: '50%' }} />}
            </div>
            {idx !== steps.length - 1 && (
              <div style={{ width: '2px', height: '100%', minHeight: '1.5rem', backgroundColor: step.status === 'done' ? 'rgba(16, 185, 129, 0.4)' : 'var(--color-border)', margin: '4px 0' }} />
            )}
          </div>

          <div style={{ flex: 1, paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: step.status === 'pending' ? 'var(--color-text-muted)' : 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                {step.node?.replace(/_/g, ' ')}
              </span>
              {step.status === 'active' && (
                <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '99px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#c084fc' }}>
                  Processing
                </span>
              )}
            </div>
            
            {step.details && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', lineHeight: 1.5, marginTop: '0.25rem', padding: '0.5rem', backgroundColor: 'var(--color-bg-primary)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                {step.details}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
