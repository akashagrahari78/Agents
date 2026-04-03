import axios from 'axios'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export function buildApiUrl(path) {
  if (!path) return API_BASE_URL
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE_URL}${path}`
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined,
})
