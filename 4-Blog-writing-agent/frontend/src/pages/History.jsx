import { motion } from 'framer-motion'
import BlogCard from '../components/BlogCard'
import { HiOutlineSearch, HiOutlineDocumentSearch } from 'react-icons/hi'
import { useState, useEffect } from 'react'
import axios from 'axios'
import useStore from '../store/useStore'

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
      const res = await axios.get('/api/blogs', {
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
      await axios.delete(`/api/blogs/${id}`, {
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
      <div className="generate-layout" style={{ display: 'block' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="hero-title" style={{ fontSize: '2.5rem', marginBottom: 0 }}>Content Library</h1>
          
          <div style={{ position: 'relative', width: '300px' }}>
            <HiOutlineSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search content..." className="input-textarea"
              style={{ paddingLeft: '2.5rem', borderRadius: '99px' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" style={{ margin: '0 auto', width: '30px', height: '30px' }} />
          </div>
        ) : error ? (
          <div className="empty-state">
            <div style={{ textAlign: 'center' }}>
              <div className="empty-box"><HiOutlineDocumentSearch size={40} color="var(--color-text-subtle)" /></div>
              <p style={{ color: '#f87171' }}>{error}</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ textAlign: 'center' }}>
              <div className="empty-box"><HiOutlineDocumentSearch size={40} color="var(--color-text-subtle)" /></div>
              <p style={{ color: 'var(--color-text-muted)' }}>No content found</p>
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
