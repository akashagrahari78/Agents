import { motion } from 'framer-motion'
import { HiOutlineChevronRight } from 'react-icons/hi'
import useStore from '../store/useStore'
import { wordCount, truncate, markdownToText } from '../utils/helpers'
import { Link } from 'react-router-dom'

export default function Drawer({ isOpen, onClose }) {
  const { history } = useStore()
  
  if (!isOpen) return null
  
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
      />
      
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{ position: 'relative', width: '100%', maxWidth: '400px', backgroundColor: 'var(--color-bg-surface)', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <div style={{ padding: '1.5rem', backgroundColor: 'rgba(14, 14, 17, 0.9)', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>History Workspace</h2>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.5rem', color: 'var(--color-text-muted)' }}>
              <HiOutlineChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', marginTop: '2rem' }}>No generated blogs yet.</p>
          ) : (
            history.map(blog => {
              const plainText = markdownToText(blog.finalMarkdown || '')
              return (
                <Link key={blog.id} to={`/blog/${blog.id}`} onClick={onClose}
                  style={{ display: 'block', padding: '1rem', backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', transition: 'border-color 0.2s' }}
                >
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                    {truncate(blog.topic || 'Untitled', 40)}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                    {truncate(plainText, 60)}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>
                    <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                    <span>{wordCount(plainText).toLocaleString()} words</span>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </motion.div>
    </div>
  )
}
