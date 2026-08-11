import { createContext, useState } from 'react'

export const userContext = createContext()

export const UserContextProvider = ({ children }) => {
  const [token, setTokenState] = useState(localStorage.getItem('token') || null)
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'))
  const [theme, setTheme] = useState('dark')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState([])
  const [generatedBlog, setGeneratedBlog] = useState(null)
  const [pendingPlanReview, setPendingPlanReview] = useState(null)
  const [generationSessionId, setGenerationSessionId] = useState(null)
  const [history] = useState([])
  const [drawerBlog, setDrawerBlog] = useState(null)
  const [editMode, setEditMode] = useState(false)

  const setToken = (nextToken) => {
    if (nextToken) {
      localStorage.setItem('token', nextToken)
    } else {
      localStorage.removeItem('token')
    }
    setTokenState(nextToken || null)
  }

  const setAuth = (user, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    setTokenState(token)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setTokenState(null)
  }

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('light', nextTheme === 'light')
      return nextTheme
    })
  }

  const addProgress = (step) => {
    setProgress((currentProgress) => [...currentProgress, step])
  }

  const updateProgress = (index, updates) => {
    setProgress((currentProgress) => (
      currentProgress.map((step, stepIndex) => (
        stepIndex === index ? { ...step, ...updates } : step
      ))
    ))
  }

  const resetProgress = () => {
    setProgress([])
  }

  const closeDrawer = () => {
    setDrawerBlog(null)
  }

  const toggleEditMode = () => {
    setEditMode((currentEditMode) => !currentEditMode)
  }

  const value = {
    token,
    setToken,
    user,
    setAuth,
    logout,
    theme,
    toggleTheme,
    isGenerating,
    setIsGenerating,
    progress,
    addProgress,
    setProgress,
    updateProgress,
    resetProgress,
    generatedBlog,
    setGeneratedBlog,
    pendingPlanReview,
    setPendingPlanReview,
    generationSessionId,
    setGenerationSessionId,
    history,
    drawerBlog,
    setDrawerBlog,
    closeDrawer,
    editMode,
    toggleEditMode,
    setEditMode,
  }

  return (
    <userContext.Provider value={value}>
      {children}
    </userContext.Provider>
  )
}
