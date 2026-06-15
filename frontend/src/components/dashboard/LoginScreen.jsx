import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_BASE } from '../../DashboardApp'

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=JetBrains+Mono:wght@300;400&display=swap'

const CSS = `
@import url('${FONT_URL}');

@keyframes sr-grain {
  0%,100%{ transform:translate(0,0) }
  20%{ transform:translate(-2%,-3%) }
  40%{ transform:translate(3%,-1%) }
  60%{ transform:translate(-1%,3%) }
  80%{ transform:translate(2%,-2%) }
}
@keyframes sr-shimmer {
  0%{ background-position:-200% center }
  100%{ background-position:200% center }
}
@keyframes sr-spin {
  to{ transform:rotate(360deg) }
}

.sr-root {
  min-height:100dvh;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#0d0d0f;
  position:relative;
  overflow:hidden;
  font-family:'JetBrains Mono',monospace;
}

/* Film grain */
.sr-root::before {
  content:'';
  position:fixed;
  inset:-50%;
  width:200%;
  height:200%;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
  opacity:.14;
  pointer-events:none;
  animation:sr-grain .65s steps(1) infinite;
  z-index:0;
}

/* Diagonal grid */
.sr-root::after {
  content:'';
  position:fixed;
  inset:0;
  background-image:
    repeating-linear-gradient(
      -45deg,
      rgba(201,169,110,0.025) 0px,
      rgba(201,169,110,0.025) 1px,
      transparent 1px,
      transparent 48px
    );
  pointer-events:none;
  z-index:0;
}

.sr-key {
  position:relative;
  overflow:hidden;
  cursor:pointer;
  border:none;
  outline:none;
  transition:background .15s, border-color .15s, color .15s;
}
.sr-key::before {
  content:'';
  position:absolute;
  inset:0;
  background:radial-gradient(ellipse at 50% 0%,rgba(201,169,110,.18) 0%,transparent 70%);
  opacity:0;
  transition:opacity .25s;
}
.sr-key:hover::before { opacity:1; }

.sr-loader {
  width:20px; height:20px;
  border-radius:50%;
  border:1px solid rgba(201,169,110,.2);
  border-top-color:#c9a96e;
  animation:sr-spin .9s linear infinite;
}
`

export default function LoginScreen({ onLogin }) {
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = CSS
    document.head.appendChild(el)
    return () => document.head.removeChild(el)
  }, [])

  const [pin,     setPin]     = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [shake,   setShake]   = useState(false)

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
      if (!r.ok) {
        setError('PIN salah')
        setPin('')
        setShake(true)
        setTimeout(() => setShake(false), 600)
        return
      }
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
  const DOT_COUNT = Math.max(4, pin.length)

  return (
    <>
      <div className="sr-root">

        {/* Ambient glow behind card */}
        <div style={{
          position:'absolute', top:'40%', left:'50%',
          transform:'translate(-50%,-50%)',
          width:700, height:700, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(201,169,110,.055) 0%,transparent 65%)',
          pointerEvents:'none', zIndex:1,
        }} />

        {/* Corner filigree */}
        {[
          { top:20, left:20, borderTop:'1px solid', borderLeft:'1px solid' },
          { top:20, right:20, borderTop:'1px solid', borderRight:'1px solid' },
          { bottom:20, left:20, borderBottom:'1px solid', borderLeft:'1px solid' },
          { bottom:20, right:20, borderBottom:'1px solid', borderRight:'1px solid' },
        ].map((s, i) => (
          <div key={i} style={{
            position:'absolute', width:28, height:28,
            borderColor:'rgba(201,169,110,.28)', ...s,
            zIndex:2,
          }} />
        ))}

        {/* Card */}
        <motion.div
          initial={{ opacity:0, y:28, scale:.97 }}
          animate={{ opacity:1, y:0, scale:1 }}
          transition={{ duration:.75, ease:[.16,1,.3,1] }}
          style={{
            position:'relative', zIndex:3,
            display:'flex', flexDirection:'column', alignItems:'center',
            width:'100%', maxWidth:340,
            padding:'48px 32px 44px',
            background:'rgba(255,255,255,.025)',
            border:'1px solid rgba(255,255,255,.07)',
            borderRadius:2,
            backdropFilter:'blur(24px)',
          }}>

          {/* — Brand — */}
          <motion.div
            initial={{ opacity:0, y:-10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:.18, duration:.6 }}
            style={{ textAlign:'center', marginBottom:40, width:'100%' }}>

            {/* Aperture monogram */}
            <div style={{ position:'relative', width:60, height:60, margin:'0 auto 18px' }}>
              {/* Outer ring */}
              <div style={{
                position:'absolute', inset:0, borderRadius:'50%',
                border:'1px solid rgba(201,169,110,.35)',
              }} />
              {/* Mid ring */}
              <div style={{
                position:'absolute', inset:8, borderRadius:'50%',
                border:'1px solid rgba(201,169,110,.18)',
              }} />
              {/* Radial ticks */}
              {Array.from({length:8}).map((_,i) => (
                <div key={i} style={{
                  position:'absolute', top:'50%', left:'50%',
                  width:1, height:8,
                  background:'rgba(201,169,110,.22)',
                  transformOrigin:'0 0',
                  transform:`rotate(${i*45}deg) translate(-50%,-30px)`,
                }} />
              ))}
              {/* Monogram */}
              <div style={{
                position:'absolute', inset:0,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <span style={{
                  fontFamily:"'Cormorant Garamond',Georgia,serif",
                  fontSize:17, fontWeight:600,
                  background:'linear-gradient(135deg,#c9a96e,#e8d49e,#c9a96e)',
                  backgroundSize:'200% auto',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                  animation:'sr-shimmer 3s linear infinite',
                  letterSpacing:'.06em',
                }}>SR</span>
              </div>
            </div>

            <h1 style={{
              fontFamily:"'Cormorant Garamond',Georgia,serif",
              fontSize:26, fontWeight:400,
              color:'rgba(255,255,255,.9)',
              margin:'0 0 8px',
              letterSpacing:'.04em',
            }}>SatuRuang</h1>

            {/* Rule + label */}
            <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
              <div style={{ flex:1, height:1, background:'linear-gradient(90deg,transparent,rgba(201,169,110,.3))' }} />
              <span style={{
                fontSize:8, letterSpacing:'.22em',
                color:'rgba(255,255,255,.22)',
                textTransform:'uppercase',
                fontFamily:"'JetBrains Mono',monospace",
              }}>Owner Access</span>
              <div style={{ flex:1, height:1, background:'linear-gradient(90deg,rgba(201,169,110,.3),transparent)' }} />
            </div>
          </motion.div>

          {/* — PIN dots — */}
          <motion.div
            animate={shake ? { x:[-8,8,-7,7,-4,4,0] } : { x:0 }}
            transition={{ duration:.5 }}
            style={{ marginBottom:6, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>

            <span style={{
              fontSize:8, letterSpacing:'.2em',
              color:'rgba(255,255,255,.18)', textTransform:'uppercase',
              fontFamily:"'JetBrains Mono',monospace",
            }}>Masukkan PIN</span>

            <div style={{ display:'flex', gap:12, padding:'10px 0' }}>
              {Array.from({ length: DOT_COUNT }).map((_, i) => {
                const filled = i < pin.length
                return (
                  <motion.div key={i}
                    animate={{ scale: i === pin.length - 1 ? [1,1.5,1] : 1 }}
                    transition={{ duration:.18 }}
                    style={{
                      width: filled ? 12 : 10,
                      height: filled ? 12 : 10,
                      borderRadius:'50%',
                      background: filled
                        ? 'linear-gradient(135deg,#c9a96e,#e8d49e)'
                        : 'transparent',
                      border: filled ? 'none' : '1px solid rgba(255,255,255,.22)',
                      boxShadow: filled ? '0 0 10px rgba(201,169,110,.5),0 0 24px rgba(201,169,110,.18)' : 'none',
                      transition:'all .18s',
                    }}
                  />
                )
              })}
            </div>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                key="err"
                initial={{ opacity:0, y:-4, height:0 }}
                animate={{ opacity:1, y:0, height:'auto' }}
                exit={{ opacity:0, height:0 }}
                style={{
                  margin:'0 0 4px',
                  color:'#f87171',
                  fontSize:9,
                  letterSpacing:'.14em',
                  textTransform:'uppercase',
                  fontFamily:"'JetBrains Mono',monospace",
                  textAlign:'center',
                }}>
                ✕ {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div style={{
            width:'100%', height:1, margin:'16px 0 20px',
            background:'linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)',
          }} />

          {/* — Numpad — */}
          <motion.div
            initial={{ opacity:0, y:14 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:.35, duration:.55 }}
            style={{
              display:'grid', gridTemplateColumns:'repeat(3,1fr)',
              gap:7, width:'100%',
            }}>
            {KEYS.map(k => {
              const isConfirm = k === '✓'
              const isDelete  = k === '⌫'
              return (
                <motion.button
                  key={k}
                  className="sr-key"
                  onClick={() => press(k)}
                  whileTap={{ scale:.88, y:1 }}
                  style={{
                    height:54, borderRadius:2,
                    border: isConfirm
                      ? '1px solid rgba(201,169,110,.45)'
                      : '1px solid rgba(255,255,255,.07)',
                    background: isConfirm
                      ? 'linear-gradient(160deg,rgba(201,169,110,.18),rgba(201,169,110,.08))'
                      : 'rgba(255,255,255,.032)',
                    color: isConfirm
                      ? '#d4b87a'
                      : isDelete
                      ? 'rgba(255,255,255,.38)'
                      : 'rgba(255,255,255,.72)',
                    fontSize: isDelete ? 15 : isConfirm ? 15 : 18,
                    fontFamily: isDelete ? 'system-ui,sans-serif' : "'JetBrains Mono',monospace",
                    fontWeight: 300,
                    letterSpacing: isDelete ? 0 : '.04em',
                    boxShadow: isConfirm
                      ? 'inset 0 1px 0 rgba(201,169,110,.2), 0 0 20px rgba(201,169,110,.06)'
                      : 'inset 0 1px 0 rgba(255,255,255,.05)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                  {k}
                </motion.button>
              )
            })}
          </motion.div>

          {/* Loading overlay */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                exit={{ opacity:0 }}
                style={{
                  position:'absolute', inset:0, borderRadius:2,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background:'rgba(13,13,15,.82)',
                  backdropFilter:'blur(6px)',
                  zIndex:10,
                }}>
                <div className="sr-loader" />
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>

        {/* Watermark */}
        <div style={{
          position:'absolute', bottom:18, left:0, right:0,
          textAlign:'center', zIndex:2,
        }}>
          <span style={{
            fontSize:8, letterSpacing:'.16em',
            color:'rgba(255,255,255,.09)',
            textTransform:'uppercase',
            fontFamily:"'JetBrains Mono',monospace",
          }}>Photobox Management System</span>
        </div>

      </div>
    </>
  )
}
