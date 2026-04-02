import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import useStore from './store/useStore'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Generate from './pages/Generate'
import History from './pages/History'
import BlogView from './pages/BlogView'
import Auth from './pages/Auth'

const ProtectedRoute = ({ children }) => {
  const token = useStore(state => state.token)
  if (!token) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  return (
    <div className="app-layout">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/generate" element={<ProtectedRoute><Generate /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/blog/:id" element={<ProtectedRoute><BlogView /></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}
