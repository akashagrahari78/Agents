import { motion } from 'framer-motion'
import BlogCard from '../components/BlogCard'
import { HiOutlineSearch, HiOutlineDocumentSearch } from 'react-icons/hi'
import { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import { apiClient } from '../utils/api'

export default function History() {
  const [history, setHistory] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const token = useStore(state => state.token)

  const fetchHistory = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await apiClient.get('/api/blogs', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHistory(res.data)
    } catch (err) {
      console.error('Failed to fetch history', err)
      setError(err.response?.data?.message || 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [token])

  const handleDelete = async (id) => {
    if (!id) return

    try {
      setDeletingId(id)
      setError('')
      setHistory((prev) => prev.filter(b => b._id !== id && b.id !== id))
      await apiClient.delete(`/api/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (err) {
      console.error('Failed to delete', err)
      setError(err.response?.data?.message || 'Failed to delete blog')
      await fetchHistory()
    } finally {
      setDeletingId('')
    }
  }

  const filtered = history.filter(b => (b.topic || b.plan?.blog_title || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="generate-container">
      <div className="vanna-bg" />
      <div className="generate-layout" style={{ display: 'block' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Content Library</h1>
          
          <div style={{ position: 'relative', width: '280px', minWidth: '200px' }}>
            <HiOutlineSearch style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)' }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search content..." className="input-textarea"
              style={{ paddingLeft: '2.3rem', borderRadius: 'var(--radius-full)' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div style={{ width: '30px', height: '30px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div style={{ textAlign: 'center' }}>
              <div className="empty-box"><HiOutlineDocumentSearch size={32} color="var(--color-text-subtle)" /></div>
              <p style={{ color: '#dc2626', fontSize: '0.88rem' }}>{error}</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ textAlign: 'center' }}>
              <div className="empty-box"><HiOutlineDocumentSearch size={32} color="var(--color-text-subtle)" /></div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>No content found</p>
            </div>
          </div>
        ) : (
          <div className="history-grid">
            {filtered.map(blog => (
              <BlogCard
                key={blog._id || blog.id}
                blog={blog}
                onDelete={() => handleDelete(blog._id || blog.id)}
                isDeleting={deletingId === (blog._id || blog.id)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
