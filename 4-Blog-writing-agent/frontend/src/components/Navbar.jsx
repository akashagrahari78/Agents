import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HiHome, HiPencilAlt, HiCollection, HiLogout, HiLogin, HiMenu, HiX } from 'react-icons/hi'
import { motion } from 'framer-motion'
import useStore from '../store/useStore'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setMobileOpen(false)
    navigate('/auth')
  }

  const closeMobile = () => setMobileOpen(false)

  const navItems = [
    { to: '/', label: 'Home', icon: HiHome },
    { to: '/generate', label: 'Generate', icon: HiPencilAlt },
    { to: '/history', label: 'History', icon: HiCollection },
  ]

  return (
    <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-brand" onClick={closeMobile}>
          <div className="nav-logo">A</div>
          <span>Agent Blog</span>
        </Link>

        {/* Desktop nav */}
        <div className="nav-links">
          {navItems.map(item => (
            <Link key={item.to} to={item.to} className={`nav-link ${location.pathname === item.to ? 'active' : ''}`}>
              <item.icon /> {item.label}
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-main)' }}>
              <HiLogout /> Logout
            </button>
          ) : (
            <Link to="/auth" className={`nav-link ${location.pathname === '/auth' ? 'active' : ''}`}>
              <HiLogin /> Sign In
            </Link>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="hamburger-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <HiX /> : <HiMenu />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && <div className="mobile-overlay open" onClick={closeMobile} />}

      {/* Mobile menu */}
      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        {navItems.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className={`nav-link ${location.pathname === item.to ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <item.icon /> {item.label}
          </Link>
        ))}
        {user ? (
          <button onClick={handleLogout} className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-main)', width: '100%', textAlign: 'left' }}>
            <HiLogout /> Logout
          </button>
        ) : (
          <Link to="/auth" className={`nav-link ${location.pathname === '/auth' ? 'active' : ''}`} onClick={closeMobile}>
            <HiLogin /> Sign In
          </Link>
        )}
      </div>
    </motion.nav>
  )
}
