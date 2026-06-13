import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_BASE } from '../../DashboardApp'

export default function LoginScreen({ onLogin }) {
  const [pin,     setPin]     = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (loading || pin.length === 0) return
    setLoading(true)
    setError('')
    try {
      const r = await fetch(`${API_BASE}/api/dashboard/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      if (!r.ok) { setError('PIN salah'); setPin(''); return }
      const { token } = await r.json()
      onLogin(token)
    } catch {
      setError('Tidak dapat terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  const press = (k) => {
    if (loading) return
    if (k === '⌫') return setPin(p => p.slice(0, -1))
    if (k === '✓') return submit()
    if (pin.length < 8) setPin(p => p + k)
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','⌫','0','✓']

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0f' }}>
      <motion.div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, width: '100%', maxWidth: 320, padding: '0 24px' }}
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>

        {/* Badge + title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg,#c9a96e,#d4b87a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#0d0d0f', fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em' }}>SR</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: '0.2em', margin: 0 }}>DASHBOARD OWNER</p>
        </div>

        {/* PIN dots */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
            <motion.div key={i}
              style={{
                width: 14, height: 14, borderRadius: '50%',
                background: i < pin.length ? '#c9a96e' : 'rgba(255,255,255,0.15)',
              }}
              animate={{ scale: i === pin.length - 1 ? [1, 1.35, 1] : 1 }}
              transition={{ duration: 0.15 }} />
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              style={{ color: '#f87171', fontSize: 12, margin: '-16px 0 0', textAlign: 'center' }}
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%' }}>
          {KEYS.map(k => (
            <motion.button key={k} onClick={() => press(k)}
              whileTap={{ scale: 0.88 }}
              style={{
                height: 56, borderRadius: 16, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: k === '✓'
                  ? 'linear-gradient(135deg,#c9a96e,#d4b87a)'
                  : k === '⌫'
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(255,255,255,0.08)',
                color: k === '✓' ? '#0d0d0f' : 'rgba(255,255,255,0.85)',
                outline: '1px solid ' + (k === '✓' ? 'transparent' : 'rgba(255,255,255,0.07)'),
              }}>
              {k}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
