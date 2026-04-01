import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Generate from './pages/Generate'
import History from './pages/History'
import BlogView from './pages/BlogView'
import Auth from './pages/Auth'

export default function App() {
  return (
    <div className="app-layout">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/history" element={<History />} />
          <Route path="/blog/:id" element={<BlogView />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}
