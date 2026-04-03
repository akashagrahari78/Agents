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
    return <div className="generate-container flex items-center justify-center min-h-screen text-white">Loading...</div>
  }

  if (!blog) {
    return (
      <div className="generate-container" style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', height: '100vh', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Blog not found</h2>
          <Link to="/history" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>Back to History</Link>
        </div>
      </div>
    )
  }

  const wc = wordCount(blog.finalMarkdown || '')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="generate-container">
      <div className="generate-layout" style={{ display: 'block', maxWidth: '800px', margin: '0 auto' }}>
        <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '0.875rem' }}>
          <HiOutlineArrowLeft /> Back to Library
        </Link>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <span className="word-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <HiOutlineCalendar /> {formatDate(blog.createdAt)}
          </span>
          <span className="word-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
            <HiOutlineDocumentText /> {wc.toLocaleString()} words
          </span>
        </div>

        <h1 className="hero-title" style={{ fontSize: '3rem', marginBottom: '3rem', textAlign: 'left' }}>
          {blog.topic || blog.plan?.blog_title || 'Untitled Blog'}
        </h1>

        <div className="section-card" style={{ padding: '3rem 2rem' }}>
          <MarkdownViewer content={blog.finalMarkdown || ''} />
        </div>
      </div>
    </motion.div>
  )
}
