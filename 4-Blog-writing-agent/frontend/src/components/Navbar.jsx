import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HiHome, HiPencilAlt, HiCollection, HiLogout, HiLogin } from 'react-icons/hi'
import { motion } from 'framer-motion'
import useStore from '../store/useStore'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useStore()

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  return (
    <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="navbar">
      <div style={{ display: 'flex', width: '100%', maxWidth: '1200px', margin: '0 auto', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="nav-brand">
          <div className="nav-logo">A</div>
          <span>Agent Blog</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <HiHome /> Home
          </Link>
          <Link to="/generate" className={`nav-link ${location.pathname === '/generate' ? 'active' : ''}`}>
            <HiPencilAlt /> Generate
          </Link>
          <Link to="/history" className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}>
            <HiCollection /> History
          </Link>
          {user ? (
            <>
              <button onClick={handleLogout} className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <HiLogout /> Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className={`nav-link ${location.pathname === '/auth' ? 'active' : ''}`}>
              <HiLogin /> Sign In / Sign Up
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  )
}
