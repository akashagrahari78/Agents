import { motion } from 'framer-motion'
import { HiCheck, HiOutlineDesktopComputer } from 'react-icons/hi'

export default function ProgressTracker({ steps }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {steps.map((step, idx) => (
        <motion.div
          key={`${step.id}-${idx}`}
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}
        >
          {/* Node dot / indicator */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0.2rem' }}>
            <div
              style={{
                width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                backgroundColor: step.status === 'done' ? '#10b981' : step.status === 'active' ? 'var(--color-accent-primary)' : step.status === 'error' ? '#ef4444' : '#e2e8f0',
                border: step.status === 'pending' ? '2px solid #cbd5e1' : 'none',
              }}
            >
              {step.status === 'done' && <HiCheck size={10} color="#fff" />}
              {step.status === 'active' && <div style={{ width: '6px', height: '6px', backgroundColor: '#fff', borderRadius: '50%' }} />}
            </div>
            {idx !== steps.length - 1 && (
              <div style={{ width: '2px', height: '100%', minHeight: '1.25rem', backgroundColor: step.status === 'done' ? 'rgba(16, 185, 129, 0.35)' : '#e2e8f0', margin: '3px 0' }} />
            )}
          </div>

          <div style={{ flex: 1, paddingBottom: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.15rem', flexWrap: 'wrap' }}>
              <HiOutlineDesktopComputer
                size={13}
                color={step.status === 'pending' ? 'var(--color-text-subtle)' : 'var(--color-accent-primary)'}
              />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: step.status === 'pending' ? 'var(--color-text-subtle)' : 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                {step.label}
              </span>
              {step.status === 'active' && (
                <span style={{ fontSize: '0.62rem', padding: '0.12rem 0.4rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(20, 184, 166, 0.1)', color: 'var(--color-accent-primary)', fontWeight: 600 }}>
                  Processing
                </span>
              )}
              {step.status === 'done' && (
                <span style={{ fontSize: '0.62rem', padding: '0.12rem 0.4rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 600 }}>
                  Done
                </span>
              )}
              {step.status === 'error' && (
                <span style={{ fontSize: '0.62rem', padding: '0.12rem 0.4rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#dc2626', fontWeight: 600 }}>
                  Error
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', lineHeight: 1.5 }}>
              {step.status === 'pending' && 'Waiting for this stage to begin.'}
              {step.status === 'active' && 'This step is running right now.'}
              {step.status === 'done' && 'Completed successfully.'}
              {step.status === 'error' && 'Something went wrong during this step.'}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
