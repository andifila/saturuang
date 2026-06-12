import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'original', label: 'Original', css: 'none' },
  { id: 'bw',       label: 'B&W',      css: 'grayscale(1) contrast(1.05)' },
  { id: 'vintage',  label: 'Vintage',  css: 'sepia(0.55) contrast(0.92) brightness(1.08) saturate(0.8)' },
]

// Grid layout matching backend composer.js
const GRID_COLS = { 2: 1, 4: 2, 8: 2 }

const ROWS_ALPHA = [
  ['q','w','e','r','t','y','u','i','o','p','⌫'],
  ['a','s','d','f','g','h','j','k','l','@'],
  ['z','x','c','v','b','n','m','.','_'],
  ['123','[SPACE]','.com','✓'],
]
const ROWS_NUM = [
  ['1','2','3','4','5','6','7','8','9','0','⌫'],
  ['-','_','.','@','!','#','$','%','&','*'],
  ['(',')','+','=','/','\\',':',';',',','?'],
  ['ABC','[SPACE]','.com','✓'],
]

// ─── VirtualKeyboard ──────────────────────────────────────────────────────────

function Key({ label, onPress }) {
  const isSpecial = ['⌫','123','ABC','.com','✓','[SPACE]'].includes(label)
  const isAccent  = label === '✓'
  const isWide    = ['123','ABC','.com','⌫'].includes(label)

  const display = label === '[SPACE]' ? 'SPACE' : label === '✓' ? 'SELESAI' : label

  return (
    <motion.button
      onPointerDown={(e) => { e.preventDefault(); onPress(label) }}
      whileTap={{ scale: 0.85, opacity: 0.7 }}
      className="flex items-center justify-center rounded-xl font-semibold select-none"
      style={{
        height: 50,
        minWidth: label === '[SPACE]' ? 240 : isWide ? 84 : 60,
        flexGrow: label === '[SPACE]' ? 1 : 0,
        fontSize: isSpecial ? 11 : 16,
        letterSpacing: isSpecial ? '0.1em' : 0,
        background: isAccent
          ? 'linear-gradient(135deg,#c9a96e,#d4b87a)'
          : label === '⌫'
          ? 'rgba(255,255,255,0.07)'
          : isSpecial
          ? 'rgba(255,255,255,0.09)'
          : 'rgba(255,255,255,0.07)',
        color: isAccent ? '#0d0d0f' : 'rgba(255,255,255,0.85)',
        border: isAccent ? 'none' : '1px solid rgba(255,255,255,0.07)',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {display}
    </motion.button>
  )
}

function VirtualKeyboard({ value, onChange, onClose }) {
  const [mode, setMode] = useState('alpha')
  const rows = mode === 'alpha' ? ROWS_ALPHA : ROWS_NUM

  const handleKey = useCallback((key) => {
    if (key === '⌫')      return onChange(value.slice(0, -1))
    if (key === '123')    return setMode('num')
    if (key === 'ABC')    return setMode('alpha')
    if (key === '[SPACE]') return onChange(value + ' ')
    if (key === '.com')   return onChange(value + '.com')
    if (key === '✓')      return onClose()
    onChange(value + key)
  }, [value, onChange, onClose])

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col gap-1.5 px-4 pb-4 pt-3"
      style={{ background: 'rgba(16,16,20,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid #2e2e36' }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 400, damping: 38 }}
    >
      {/* Email display strip */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-1"
           style={{ background: '#1a1a1f', border: '1px solid #2e2e36' }}>
        <span className="text-[10px] tracking-widest shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>EMAIL</span>
        <span className="flex-1 text-sm font-medium tracking-wide truncate"
              style={{ color: value ? 'white' : 'rgba(255,255,255,0.25)' }}>
          {value || 'nama@email.com'}
        </span>
        {value && (
          <button onPointerDown={(e) => { e.preventDefault(); onChange('') }}
                  className="text-[10px] px-2 py-1 rounded-lg"
                  style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.07)' }}>
            hapus
          </button>
        )}
      </div>

      {rows.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1.5">
          {row.map((key) => <Key key={key} label={key} onPress={handleKey} />)}
        </div>
      ))}
    </motion.div>
  )
}

// ─── Photo Grid (raw fallback) ─────────────────────────────────────────────────

function RawPhotoGrid({ photos, filterCss }) {
  const cols = GRID_COLS[photos.length] || 2
  return (
    <div
      className="w-full h-full"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${Math.ceil(photos.length / cols)}, 1fr)`,
        gap: 4,
        padding: 12,
        background: '#111114',
      }}
    >
      {photos.map((src, i) => (
        <motion.img
          key={i}
          src={src}
          alt={`foto ${i + 1}`}
          className="w-full h-full object-cover rounded-lg"
          style={{ filter: filterCss }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  )
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

function ActionButton({ onClick, state, disabled, labels, variant, onRetry }) {
  const label = labels[state] || labels.idle
  const isPrimary = variant === 'primary'

  const colors = {
    idle:    isPrimary ? { bg: 'linear-gradient(135deg,#c9a96e,#d4b87a)', color: '#0d0d0f', border: 'none' }
                       : { bg: 'rgba(201,169,110,0.1)', color: '#c9a96e', border: '1px solid #c9a96e' },
    loading: isPrimary ? { bg: 'rgba(201,169,110,0.3)', color: '#c9a96e', border: 'none' }
                       : { bg: 'rgba(201,169,110,0.08)', color: '#c9a96e', border: '1px solid rgba(201,169,110,0.4)' },
    done:    { bg: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid #4ade80' },
    error:   { bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid #f87171' },
  }

  const style = colors[state] || colors.idle

  return (
    <motion.button
      onClick={() => state === 'error' ? onRetry() : (!disabled && state === 'idle' && onClick())}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      className="w-full py-4 rounded-2xl font-bold text-xs tracking-widest"
      style={{ background: style.bg, color: style.color, border: style.border,
               opacity: disabled ? 0.38 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <AnimatePresence mode="wait">
        <motion.span key={state} className="flex items-center justify-center gap-2"
                     initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.13 }}>
          {state === 'loading' && (
            <motion.span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent inline-block"
                         animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
          )}
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

// ─── PreviewScreen ────────────────────────────────────────────────────────────

export default function PreviewScreen({ photos, template, onRestart }) {
  // 'loading' | 'ready' | 'offline'
  const [compositePhase, setCompositePhase] = useState('loading')
  const [compositeUrl,  setCompositeUrl]    = useState(null)
  const [filename,      setFilename]        = useState(null)

  const [filter,       setFilter]       = useState('original')
  const [email,        setEmail]        = useState('')
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [emailState,   setEmailState]   = useState('idle')   // idle|loading|done|error
  const [printState,   setPrintState]   = useState('idle')

  // ── Composite on mount (non-blocking) ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    fetch('/api/process-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos, template }),
    })
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then((data) => {
        if (cancelled) return
        if (data.url) {
          setCompositeUrl(data.url)
          setFilename(data.filename)
          setCompositePhase('ready')
        } else {
          setCompositePhase('offline')
        }
      })
      .catch(() => { if (!cancelled) setCompositePhase('offline') })
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleSendEmail = async () => {
    if (!email || !filename || emailState !== 'idle') return
    setEmailState('loading')
    setShowKeyboard(false)
    try {
      const r    = await fetch('/api/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, filename }),
      })
      const data = await r.json()
      setEmailState(data.ok ? 'done' : 'error')
    } catch { setEmailState('error') }
  }

  const handlePrint = async () => {
    if (!filename || printState !== 'idle') return
    setPrintState('loading')
    try {
      const r    = await fetch('/api/print', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      })
      const data = await r.json()
      setPrintState(data.ok ? 'done' : 'error')
    } catch { setPrintState('error') }
  }

  const filterCss   = FILTERS.find((f) => f.id === filter)?.css || 'none'
  const backendReady = compositePhase === 'ready'

  return (
    <>
      <motion.div className="w-screen h-screen flex overflow-hidden" style={{ background: '#0d0d0f' }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}>

        {/* ── Left: Photo Preview ─────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 p-6 gap-4 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between shrink-0">
            <p className="text-xs tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              HASIL FOTO
            </p>
            {/* Backend status badge */}
            <AnimatePresence mode="wait">
              {compositePhase === 'loading' && (
                <motion.div key="proc" className="flex items-center gap-2 px-3 py-1 rounded-full"
                            style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.3)' }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.span className="w-2 h-2 rounded-full bg-[#c9a96e] inline-block"
                               animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} />
                  <span className="text-[10px] tracking-widest" style={{ color: '#c9a96e' }}>MEMPROSES</span>
                </motion.div>
              )}
              {compositePhase === 'ready' && (
                <motion.div key="ready" className="flex items-center gap-2 px-3 py-1 rounded-full"
                            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)' }}
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <span className="text-[10px] tracking-widest" style={{ color: '#4ade80' }}>✓ SIAP CETAK</span>
                </motion.div>
              )}
              {compositePhase === 'offline' && (
                <motion.div key="offline" className="px-3 py-1 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <span className="text-[10px] tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>PREVIEW ONLY</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Photo display area */}
          <div className="flex-1 rounded-2xl overflow-hidden relative" style={{ background: '#111114' }}>
            {/* Raw photos — always visible immediately */}
            <div className="absolute inset-0">
              <RawPhotoGrid photos={photos} filterCss={compositePhase === 'ready' ? 'none' : filterCss} />
            </div>

            {/* Composited image — cross-fades in when ready */}
            <AnimatePresence>
              {compositePhase === 'ready' && compositeUrl && (
                <motion.div key="composite" className="absolute inset-0 flex items-center justify-center"
                            style={{ background: '#111114' }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}>
                  <img src={compositeUrl} alt="Foto final"
                       className="max-w-full max-h-full object-contain"
                       style={{ filter: filterCss }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 shrink-0">
            {FILTERS.map((f) => (
              <motion.button key={f.id} onClick={() => setFilter(f.id)} whileTap={{ scale: 0.92 }}
                             className="px-5 py-2.5 rounded-xl text-xs font-semibold tracking-widest"
                             style={{
                               background: filter === f.id ? '#c9a96e' : 'rgba(255,255,255,0.06)',
                               color:      filter === f.id ? '#0d0d0f' : 'rgba(255,255,255,0.45)',
                               border:     filter === f.id ? 'none' : '1px solid rgba(255,255,255,0.07)',
                             }}>
                {f.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Right: Actions Panel ─────────────────────────────────────────── */}
        <div className="w-[340px] shrink-0 flex flex-col gap-4 p-6 border-l" style={{ borderColor: '#1e1e24' }}>
          <p className="text-xs tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            KIRIM & CETAK
          </p>

          {/* Email section */}
          <div className="flex flex-col gap-2">
            <label className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
              ALAMAT EMAIL
            </label>
            <motion.button
              onClick={() => setShowKeyboard(true)} whileTap={{ scale: 0.98 }}
              className="w-full text-left px-4 py-3.5 rounded-xl text-sm relative"
              style={{
                background: '#1a1a1f',
                border: `1px solid ${showKeyboard ? '#c9a96e' : '#2e2e36'}`,
                color: email ? 'white' : 'rgba(255,255,255,0.3)',
                transition: 'border-color 0.2s',
              }}>
              {email || 'Ketuk untuk memasukkan email…'}
              {showKeyboard && (
                <motion.span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                             style={{ color: '#c9a96e' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>▼</motion.span>
              )}
            </motion.button>
          </div>

          <ActionButton
            onClick={handleSendEmail} state={emailState}
            disabled={!email || !backendReady}
            labels={{ idle: 'KIRIM EMAIL', loading: 'MENGIRIM…', done: '✓ EMAIL TERKIRIM', error: '↺ COBA LAGI' }}
            variant="outline" onRetry={() => setEmailState('idle')}
          />

          <ActionButton
            onClick={handlePrint} state={printState}
            disabled={!backendReady}
            labels={{ idle: 'CETAK FOTO', loading: 'MENCETAK…', done: '✓ DIKIRIM KE PRINTER', error: '↺ COBA LAGI' }}
            variant="primary" onRetry={() => setPrintState('idle')}
          />

          {/* Offline notice */}
          <AnimatePresence>
            {compositePhase === 'offline' && (
              <motion.p className="text-xs text-center leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.25)' }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Backend offline — preview tetap tampil.<br />Jalankan <code className="text-[#c9a96e]">node server.js</code> untuk cetak & email.
              </motion.p>
            )}
            {printState === 'done' && (
              <motion.p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                Foto sedang diproses printer. Ambil dalam 10–15 detik.
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex-1" />

          <motion.button onClick={onRestart} whileTap={{ scale: 0.96 }}
                         className="w-full py-3 rounded-xl text-xs font-medium tracking-widest text-center"
                         style={{ color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.07)' }}>
            ← Mulai Sesi Baru
          </motion.button>
        </div>
      </motion.div>

      {/* Virtual Keyboard overlay */}
      <AnimatePresence>
        {showKeyboard && (
          <>
            <motion.div key="backdrop" className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.55)' }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowKeyboard(false)} />
            <VirtualKeyboard key="kbd" value={email} onChange={setEmail} onClose={() => setShowKeyboard(false)} />
          </>
        )}
      </AnimatePresence>
    </>
  )
}
