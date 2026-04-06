import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import MarkdownViewer from '../components/MarkdownViewer'
import { HiOutlineArrowLeft, HiOutlineCalendar, HiOutlineDocumentText } from 'react-icons/hi'
import { formatDate, wordCount } from '../utils/helpers'
import { apiClient } from '../utils/api'

export default function BlogView() {
  const { id } = useParams()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const token = useStore(state => state.token)

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await apiClient.get('/api/blogs', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const found = res.data.find(b => b._id === id || b.id === id)
        if (found) setBlog(found)
      } catch (err) {
        console.error('Failed to fetch blog', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBlog()
  }, [id, token])

  if (loading) {
    return (
      <div className="generate-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="vanna-bg" />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Loading...</p>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="generate-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="vanna-bg" />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Blog not found</h2>
          <Link to="/history" className="btn-primary" style={{ display: 'inline-block' }}>Back to History</Link>
        </div>
      </div>
    )
  }

  const wc = wordCount(blog.finalMarkdown || '')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="generate-container">
      <div className="vanna-bg" />
      <div className="generate-layout" style={{ display: 'block', maxWidth: '800px', margin: '0 auto' }}>
        <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-text-muted)', marginBottom: '1.75rem', fontSize: '0.88rem', fontWeight: 500, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
        >
          <HiOutlineArrowLeft /> Back to Library
        </Link>
        
        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          <span className="word-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <HiOutlineCalendar /> {formatDate(blog.createdAt)}
          </span>
          <span className="word-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(245, 158, 11, 0.08)', color: '#d97706' }}>
            <HiOutlineDocumentText /> {wc.toLocaleString()} words
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, marginBottom: '2.5rem', textAlign: 'left', color: 'var(--color-text-primary)', lineHeight: 1.15 }}>
          {blog.topic || blog.plan?.blog_title || 'Untitled Blog'}
        </h1>

        <div className="section-card" style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
          <MarkdownViewer content={blog.finalMarkdown || ''} />
        </div>
      </div>
    </motion.div>
  )
}
