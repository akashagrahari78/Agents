import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../utils/api'

export function useBlogs() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchBlogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await apiClient.get('/api/blogs')
      setBlogs(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchBlog = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await apiClient.get(`/api/blogs/${id}`)
      return data
    } catch (err) {
      setError(err.response?.data?.message || err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteBlog = useCallback(async (id) => {
    try {
      await apiClient.delete(`/api/blogs/${id}`)
      setBlogs((prev) => prev.filter((b) => b._id !== id))
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    }
  }, [])

  const updateBlog = useCallback(async (id, updates) => {
    try {
      const { data } = await apiClient.patch(`/api/blogs/${id}`, updates)
      setBlogs((prev) => prev.map((b) => b._id === id ? data : b))
      return data
    } catch (err) {
      setError(err.response?.data?.message || err.message)
      return null
    }
  }, [])

  useEffect(() => {
    fetchBlogs()
  }, [fetchBlogs])

  return { blogs, loading, error, fetchBlogs, fetchBlog, deleteBlog, updateBlog }
}
