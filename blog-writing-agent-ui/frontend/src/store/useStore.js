import { create } from 'zustand'

const token = localStorage.getItem('token')
const user = JSON.parse(localStorage.getItem('user'))

const useStore = create((set) => ({
  // Auth
  token: token || null,
  user: user || null,
  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },

  // Theme
  theme: 'dark',
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('light', next === 'light')
    return { theme: next }
  }),

  // Generation state
  isGenerating: false,
  setIsGenerating: (v) => set({ isGenerating: v }),

  progress: [],
  addProgress: (step) => set((s) => ({ progress: [...s.progress, step] })),
  updateProgress: (index, updates) => set((s) => ({
    progress: s.progress.map((p, i) => i === index ? { ...p, ...updates } : p)
  })),
  resetProgress: () => set({ progress: [] }),

  // Generated blog
  generatedBlog: null,
  setGeneratedBlog: (blog) => set({ generatedBlog: blog }),

  // History drawer
  drawerBlog: null,
  setDrawerBlog: (blog) => set({ drawerBlog: blog }),
  closeDrawer: () => set({ drawerBlog: null }),

  // Edit mode
  editMode: false,
  toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),
  setEditMode: (v) => set({ editMode: v }),
}))

export default useStore
