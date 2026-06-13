import { useState, useEffect } from 'react'
import './index.css'
import LoginScreen     from './components/dashboard/LoginScreen'
import DashboardScreen from './components/dashboard/DashboardScreen'

// Di dev: kosong (pakai Vite proxy ke localhost:3001)
// Di Vercel/prod: isi VITE_API_URL=https://backend-kamu.com di env Vercel
export const API_BASE = import.meta.env.VITE_API_URL || ''

export default function DashboardApp() {
  const [token, setToken] = useState(() => sessionStorage.getItem('dashboard_token'))

  // Validate stored token on mount
  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE}/api/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.status === 401) { setToken(null); sessionStorage.removeItem('dashboard_token') } })
      .catch(() => {})
  }, [])

  // Allow body to scroll (kiosk CSS sets overflow:hidden)
  useEffect(() => {
    document.body.style.overflow = 'auto'
    document.body.style.height   = 'auto'
    return () => {
      document.body.style.overflow = 'hidden'
      document.body.style.height   = '100%'
    }
  }, [])

  const handleLogin  = (t) => { sessionStorage.setItem('dashboard_token', t); setToken(t) }
  const handleLogout = () => { sessionStorage.removeItem('dashboard_token'); setToken(null) }

  if (!token) return <LoginScreen onLogin={handleLogin} />
  return <DashboardScreen token={token} onLogout={handleLogout} />
}
