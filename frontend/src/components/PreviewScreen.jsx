import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'original', label: 'Original', css: 'none' },
  { id: 'bw',       label: 'B&W',      css: 'grayscale(1) contrast(1.05)' },
  { id: 'vintage',  label: 'Vintage',  css: 'sepia(0.55) contrast(0.92) brightness(1.08) saturate(0.8)' },
]

// Keyboard rows — alpha mode
const ROWS_ALPHA = [
  ['q','w','e','r','t','y','u','i','o','p','⌫'],
  ['a','s','d','f','g','h','j','k','l','@'],
  ['z','x','c','v','b','n','m','.','_'],
  ['123','[SPACE]','.com','✓'],
]

// Keyboard rows — numeric/symbol mode
const ROWS_NUM = [
  ['1','2','3','4','5','6','7','8','9','0','⌫'],
  ['-','_','.','@','!','#','$','%','&','*'],
  ['(',')','+','=','/','\\',':',';',',','?'],
  ['ABC','[SPACE]','.com','✓'],
]

// ─── VirtualKeyboard ──────────────────────────────────────────────────────────

function Key({ label, onPress, wide = false, accent = false }) {
  const isSpecial = ['⌫', '123', 'ABC', '.com', '✓', '[SPACE]'].includes(label)

  let display = label
  if (label === '⌫') display = '⌫'
  if (label === '[SPACE]') display = 'SPACE'
  if (label === '✓') display = 'SELESAI'

  return (
    <motion.button
      onPointerDown={(e) => { e.preventDefault(); onPress(label) }}
      whileTap={{ scale: 0.88, backgroundColor: 'rgba(201,169,110,0.25)' }}
      className="flex items-center justify-center rounded-xl select-none font-semibold"
      style={{
        height: 52,
        minWidth: label === '[SPACE]' ? 260 : wide ? 88 : 64,
        flexGrow: label === '[SPACE]' ? 1 : 0,
        fontSize: isSpecial ? 11 : 16,
        letterSpacing: isSpecial ? '0.12em' : 0,
        background: accent
          ? 'linear-gradient(135deg,#c9a96e,#d4b87a)'
          : label === '⌫'
          ? 'rgba(255,255,255,0.06)'
          : isSpecial
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(255,255,255,0.07)',
        color: accent ? '#0d0d0f' : label === '⌫' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.85)',
        border: accent ? 'none' : '1px solid rgba(255,255,255,0.06)',
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

  const handleKey = useCallback(
    (key) => {
      if (key === '⌫') return onChange(value.slice(0, -1))
      if (key === '123') return setMode('num')
      if (key === 'ABC') return setMode('alpha')
      if (key === '[SPACE]') return onChange(value + ' ')
      if (key === '.com') return onChange(value + '.com')
      if (key === '✓') return onClose()
      onChange(value + key)
    },
    [value, onChange, onClose]
  )

  return (
    <motion.div
      key="keyboard"
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col gap-1.5 px-4 pb-4 pt-3"
      style={{ background: 'rgba(18,18,22,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid #2e2e36' }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
    >
      {/* Email display strip */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-1"
        style={{ background: '#1a1a1f', border: '1px solid #2e2e36' }}
      >
        <span className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
          EMAIL
        </span>
        <span
          className="flex-1 text-sm font-medium tracking-wide truncate"
          style={{ color: value ? 'white' : 'rgba(255,255,255,0.25)' }}
        >
          {value || 'nama@email.com'}
        </span>
        {value && (
          <motion.button
            onPointerDown={(e) => { e.preventDefault(); onChange('') }}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)' }}
          >
            hapus
          </motion.button>
        )}
      </div>

      {/* Key rows */}
      {rows.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1.5">
          {row.map((key) => (
            <Key
              key={key}
              label={key}
              onPress={handleKey}
              accent={key === '✓'}
              wide={['123', 'ABC', '.com', '⌫'].includes(key)}
            />
          ))}
        </div>
      ))}
    </motion.div>
  )
}

// ─── PreviewScreen ────────────────────────────────────────────────────────────

export default function PreviewScreen({ photos, template, onRestart }) {
  // Composite image fetched from backend on mount
  const [composite, setComposite] = useState({ phase: 'loading', url: null, filename: null })

  // Filter (CSS-only, client-side)
  const [filter, setFilter] = useState('original')

  // Email
  const [email, setEmail] = useState('')
  const [showKeyboard, setShowKeyboard] = useState(false)

  // Action states: 'idle' | 'loading' | 'done' | 'error'
  const [emailState, setEmailState] = useState('idle')
  const [printState, setPrintState] = useState('idle')

  // ── Composite on mount ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    fetch('/api/process-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos, template }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.url) setComposite({ phase: 'ready', url: data.url, filename: data.filename })
        else setComposite({ phase: 'error', url: null, filename: null })
      })
      .catch(() => {
        if (!cancelled) setComposite({ phase: 'error', url: null, filename: null })
      })
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSendEmail = async () => {
    if (!email || !composite.filename || emailState !== 'idle') return
    setEmailState('loading')
    setShowKeyboard(false)
    try {
      const r = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, filename: composite.filename }),
      })
      const data = await r.json()
      setEmailState(data.ok ? 'done' : 'error')
    } catch {
      setEmailState('error')
    }
  }

  const handlePrint = async () => {
    if (!composite.filename || printState !== 'idle') return
    setPrintState('loading')
    try {
      const r = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: composite.filename }),
      })
      const data = await r.json()
      setPrintState(data.ok ? 'done' : 'error')
    } catch {
      setPrintState('error')
    }
  }

  const activeFilterCss = FILTERS.find((f) => f.id === filter)?.css || 'none'
  const isReady = composite.phase === 'ready'

  return (
    <>
      <motion.div
        className="w-screen h-screen flex overflow-hidden"
        style={{ background: '#0d0d0f' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* ── Left: Photo Preview ──────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 p-6 gap-4 min-w-0">
          <p className="text-xs tracking-[0.25em] shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
            HASIL FOTO
          </p>

          {/* Composite image area */}
          <div
            className="flex-1 rounded-2xl overflow-hidden flex items-center justify-center relative"
            style={{ background: '#111114' }}
          >
            {composite.phase === 'loading' && (
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  className="w-10 h-10 rounded-full border-4 border-white/10 border-t-[#c9a96e]"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
                />
                <p className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  MEMPROSES FOTO…
                </p>
              </div>
            )}

            {composite.phase === 'error' && (
              <p className="text-sm" style={{ color: 'rgba(255,80,80,0.7)' }}>
                Gagal memproses foto. Coba lagi.
              </p>
            )}

            {composite.phase === 'ready' && (
              <motion.img
                src={composite.url}
                alt="Hasil foto"
                className="max-w-full max-h-full object-contain"
                style={{ filter: activeFilterCss }}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </div>

          {/* Filter selector */}
          <div className="flex gap-2 shrink-0">
            {FILTERS.map((f) => (
              <motion.button
                key={f.id}
                onClick={() => setFilter(f.id)}
                whileTap={{ scale: 0.92 }}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold tracking-widest"
                style={{
                  background: filter === f.id ? '#c9a96e' : 'rgba(255,255,255,0.06)',
                  color:      filter === f.id ? '#0d0d0f' : 'rgba(255,255,255,0.45)',
                  border:     filter === f.id ? 'none' : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {f.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Right: Actions Panel ─────────────────────────────────────────── */}
        <div
          className="w-[340px] shrink-0 flex flex-col gap-4 p-6 border-l"
          style={{ borderColor: '#1e1e24' }}
        >
          <p className="text-xs tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            KIRIM & CETAK
          </p>

          {/* ── Email section ───────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <label className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
              ALAMAT EMAIL
            </label>

            {/* Tappable email display — opens virtual keyboard */}
            <motion.button
              onClick={() => setShowKeyboard(true)}
              whileTap={{ scale: 0.98 }}
              className="w-full text-left px-4 py-3.5 rounded-xl text-sm relative overflow-hidden"
              style={{
                background: '#1a1a1f',
                border: `1px solid ${showKeyboard ? '#c9a96e' : '#2e2e36'}`,
                color: email ? 'white' : 'rgba(255,255,255,0.3)',
                transition: 'border-color 0.2s',
              }}
            >
              {email || 'Ketuk untuk memasukkan email…'}
              {showKeyboard && (
                <motion.span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: '#c9a96e' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ▼
                </motion.span>
              )}
            </motion.button>
          </div>

          {/* ── Send email button ────────────────────────────────────── */}
          <ActionButton
            onClick={handleSendEmail}
            state={emailState}
            disabled={!email || !isReady}
            idleLabel="KIRIM EMAIL"
            loadingLabel="MENGIRIM…"
            doneLabel="✓ EMAIL TERKIRIM"
            errorLabel="✕ COBA LAGI"
            variant="outline"
            onRetry={() => setEmailState('idle')}
          />

          {/* ── Print button ─────────────────────────────────────────── */}
          <ActionButton
            onClick={handlePrint}
            state={printState}
            disabled={!isReady}
            idleLabel="CETAK FOTO"
            loadingLabel="MENCETAK…"
            doneLabel="✓ DIKIRIM KE PRINTER"
            errorLabel="✕ GAGAL CETAK"
            variant="primary"
            onRetry={() => setPrintState('idle')}
          />

          {/* Print status hint */}
          <AnimatePresence>
            {printState === 'done' && (
              <motion.p
                className="text-xs text-center"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                Foto sedang diproses oleh printer. Ambil dalam 10-15 detik.
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex-1" />

          <motion.button
            onClick={onRestart}
            whileTap={{ scale: 0.96 }}
            className="w-full py-3 rounded-xl text-xs font-medium tracking-widest text-center"
            style={{ color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            ← Mulai Sesi Baru
          </motion.button>
        </div>
      </motion.div>

      {/* ── Virtual Keyboard overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {showKeyboard && (
          <>
            {/* Backdrop */}
            <motion.div
              key="kbd-backdrop"
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowKeyboard(false)}
            />
            <VirtualKeyboard
              key="kbd"
              value={email}
              onChange={setEmail}
              onClose={() => setShowKeyboard(false)}
            />
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

function ActionButton({ onClick, state, disabled, idleLabel, loadingLabel, doneLabel, errorLabel, variant, onRetry }) {
  const isPrimary = variant === 'primary'
  const isDone    = state === 'done'
  const isError   = state === 'error'
  const isLoading = state === 'loading'

  const label = isLoading ? loadingLabel : isDone ? doneLabel : isError ? errorLabel : idleLabel

  const handleClick = () => {
    if (isError) return onRetry()
    if (!disabled && state === 'idle') onClick()
  }

  const baseStyle = {
    width: '100%',
    padding: '16px',
    borderRadius: 16,
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: '0.15em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.2s',
    opacity: disabled ? 0.4 : 1,
  }

  const variantStyle = isPrimary
    ? {
        background: isDone
          ? 'rgba(74,222,128,0.15)'
          : isError
          ? 'rgba(248,113,113,0.15)'
          : 'linear-gradient(135deg,#c9a96e,#d4b87a)',
        color: isDone ? '#4ade80' : isError ? '#f87171' : '#0d0d0f',
        border: isDone ? '1px solid #4ade80' : isError ? '1px solid #f87171' : 'none',
      }
    : {
        background: isDone
          ? 'rgba(74,222,128,0.08)'
          : isError
          ? 'rgba(248,113,113,0.08)'
          : 'rgba(201,169,110,0.1)',
        color: isDone ? '#4ade80' : isError ? '#f87171' : '#c9a96e',
        border: `1px solid ${isDone ? '#4ade80' : isError ? '#f87171' : '#c9a96e'}`,
      }

  return (
    <motion.button
      onClick={handleClick}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      whileHover={!disabled ? { scale: 1.01 } : {}}
      style={{ ...baseStyle, ...variantStyle }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={state}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {isLoading && (
            <motion.span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '2px solid currentColor',
                borderTopColor: 'transparent',
              }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            />
          )}
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
