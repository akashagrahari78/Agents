import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineTrash } from 'react-icons/hi'
import { wordCount, formatDate, truncate, markdownToText } from '../utils/helpers'

const modeColors = {
  closed_book: { bg: 'rgba(20, 184, 166, 0.08)', color: '#0d9488', border: 'rgba(20, 184, 166, 0.2)' },
  hybrid: { bg: 'rgba(245, 158, 11, 0.08)', color: '#d97706', border: 'rgba(245, 158, 11, 0.2)' },
  open_book: { bg: 'rgba(16, 185, 129, 0.08)', color: '#059669', border: 'rgba(16, 185, 129, 0.2)' },
}

export default function BlogCard({ blog, onDelete }) {
  const navigate = useNavigate()
  const plainText = markdownToText(blog.finalMarkdown || '')
  const wc = wordCount(plainText)
  const modeStyle = modeColors[blog.mode] || modeColors.hybrid
  const blogId = blog._id || blog.id

  const handleDeleteClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete()
  }

  const handleOpen = () => {
    if (!blogId) return
    navigate(`/blog/${blogId}`)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleOpen()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="feature-card"
      style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', textTransform: 'uppercase', backgroundColor: modeStyle.bg, color: modeStyle.color, border: `1px solid ${modeStyle.border}`, letterSpacing: '0.03em' }}>
          {(blog.mode || 'hybrid').replace('_', ' ')}
        </span>
        <button
          type="button"
          title="Delete blog"
          aria-label="Delete blog"
          onMouseDown={handleDeleteClick}
          onClick={handleDeleteClick}
          className="action-btn"
          style={{
            background: 'transparent',
            padding: '0.35rem',
            color: 'var(--color-text-subtle)',
            position: 'relative',
            zIndex: 5,
            border: 'none',
          }}
        >
          <HiOutlineTrash size={15} />
        </button>
      </div>

      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: '0.4rem', lineHeight: 1.4, color: 'var(--color-text-primary)' }}>
          {truncate(blog.topic || blog.plan?.blog_title, 60)}
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.85rem', lineHeight: 1.55 }}>
          {truncate(plainText, 120)}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.85rem', borderTop: '1px solid var(--color-border)', fontSize: '0.72rem', color: 'var(--color-text-subtle)', fontWeight: 500 }}>
        <span>{formatDate(blog.createdAt)}</span>
        <span>{wc.toLocaleString()} words</span>
      </div>
    </motion.div>
  )
}
