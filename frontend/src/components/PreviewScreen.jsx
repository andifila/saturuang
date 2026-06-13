import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TEMPLATES = [
  { id: 'minimal', label: 'Minimal', bg: '#ffffff', labelBg: '#ebebeb', labelColor: '#aaa',    photoSlot: '#cccccc' },
  { id: 'gold',    label: 'Gold',    bg: '#0d0b08', labelBg: '#c9a96e', labelColor: '#0d0b08', photoSlot: '#2a2418' },
  { id: 'pink',    label: 'Blush',   bg: '#fff0f3', labelBg: '#e8a0a0', labelColor: '#fff',    photoSlot: '#ddc8cc' },
  { id: 'film',    label: 'Film',    bg: '#111009', labelBg: '#2a2218', labelColor: '#8a8060', photoSlot: '#1e1a10' },
]

const FILTERS = [
  { id: 'original', label: 'Original', css: 'none' },
  { id: 'bw',       label: 'B&W',      css: 'grayscale(1) contrast(1.05)' },
  { id: 'vintage',  label: 'Vintage',  css: 'sepia(0.55) contrast(0.92) brightness(1.08) saturate(0.8)' },
]

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

// ─── StripPreview ─────────────────────────────────────────────────────────────

function StripPreview({ tmpl, photoCount, selected }) {
  const cols = photoCount === 2 ? 1 : 2
  const rows = photoCount === 8 ? 4 : 2
  return (
    <div className="flex flex-col rounded-xl overflow-hidden"
      style={{
        width: 52, height: 78, background: tmpl.bg,
        boxShadow: selected
          ? '0 0 0 2px #c9a96e, 0 4px 16px rgba(201,169,110,0.35)'
          : '0 2px 6px rgba(0,0,0,0.4)',
        transition: 'box-shadow 0.15s',
      }}>
      <div className="flex-1 p-[4px]"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
                 gridTemplateRows: `repeat(${rows}, 1fr)`, gap: 2 }}>
        {Array.from({ length: photoCount }).map((_, i) => (
          <div key={i} className="rounded-[2px]" style={{ background: tmpl.photoSlot }} />
        ))}
      </div>
      <div className="shrink-0 flex items-center justify-center"
        style={{ height: 10, background: tmpl.labelBg }}>
        <span style={{ fontSize: 3.5, letterSpacing: 0.8, color: tmpl.labelColor, fontWeight: 700 }}>
          SATU RUANG
        </span>
      </div>
    </div>
  )
}

// ─── VirtualKeyboard ──────────────────────────────────────────────────────────

function Key({ label, onPress, compact }) {
  const isWide    = ['123','ABC','.com','⌫'].includes(label)
  const isAccent  = label === '✓'
  const isSpecial = ['⌫','123','ABC','.com','✓','[SPACE]'].includes(label)
  const display   = label === '[SPACE]' ? 'SPACE' : label === '✓' ? 'SELESAI' : label
  return (
    <motion.button
      onPointerDown={(e) => { e.preventDefault(); onPress(label) }}
      whileTap={{ scale: 0.85, opacity: 0.7 }}
      className="flex items-center justify-center rounded-xl font-semibold select-none"
      style={{
        height: compact ? 36 : 46,
        ...(compact
          ? { flex: label === '[SPACE]' ? '4 1 0' : isWide ? '1.5 1 0' : '1 1 0', minWidth: 0 }
          : { minWidth: label === '[SPACE]' ? 200 : isWide ? 76 : 52, flexGrow: label === '[SPACE]' ? 1 : 0 }
        ),
        fontSize: compact ? (isSpecial ? 8 : 12) : (isSpecial ? 10 : 15),
        letterSpacing: isSpecial ? '0.1em' : 0,
        background: isAccent ? 'linear-gradient(135deg,#c9a96e,#d4b87a)'
          : label === '⌫' ? 'rgba(255,255,255,0.07)'
          : isSpecial ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.07)',
        color: isAccent ? '#0d0d0f' : 'rgba(255,255,255,0.85)',
        border: isAccent ? 'none' : '1px solid rgba(255,255,255,0.07)',
        touchAction: 'none', userSelect: 'none',
      }}>
      {display}
    </motion.button>
  )
}

function VirtualKeyboard({ value, onChange, onClose, compact }) {
  const [mode, setMode] = useState('alpha')
  const rows = mode === 'alpha' ? ROWS_ALPHA : ROWS_NUM
  const handleKey = useCallback((key) => {
    if (key === '⌫')       return onChange(value.slice(0, -1))
    if (key === '123')     return setMode('num')
    if (key === 'ABC')     return setMode('alpha')
    if (key === '[SPACE]') return onChange(value + ' ')
    if (key === '.com')    return onChange(value + '.com')
    if (key === '✓')       return onClose()
    onChange(value + key)
  }, [value, onChange, onClose])
  return (
    <motion.div
      className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col ${compact ? 'gap-1 px-2 pb-2 pt-2' : 'gap-1.5 px-4 pb-4 pt-3'}`}
      style={{ background: 'rgba(16,16,20,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid #2e2e36' }}
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 400, damping: 38 }}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-1"
           style={{ background: '#1a1a1f', border: '1px solid #2e2e36' }}>
        <span className="text-[10px] tracking-widest shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>EMAIL</span>
        <span className="flex-1 text-sm font-medium truncate"
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
        <div key={ri} className={`flex justify-center ${compact ? 'gap-1' : 'gap-1.5'}`}>
          {row.map((key) => <Key key={key} label={key} onPress={handleKey} compact={compact} />)}
        </div>
      ))}
    </motion.div>
  )
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

function ActionButton({ state, onClick, disabled, className, style, loadingLabel, doneLabel, errorLabel, children }) {
  return (
    <motion.button
      onClick={!disabled && state === 'idle' ? onClick : undefined}
      whileTap={!disabled && state === 'idle' ? { scale: 0.97 } : {}}
      className={`font-bold tracking-widest flex items-center justify-center gap-2 ${className}`}
      style={{
        ...style,
        ...(state === 'done'  && { background: 'rgba(74,222,128,0.12)',  color: '#4ade80', border: '1px solid #4ade80'  }),
        ...(state === 'error' && { background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid #f87171' }),
        opacity: disabled && state === 'idle' ? 0.45 : 1,
        cursor: disabled || state !== 'idle' ? 'default' : 'pointer',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span key={state} className="flex items-center gap-2"
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}>
          {state === 'loading' && (
            <motion.span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent inline-block"
              animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
          )}
          {state === 'idle' && children}
          {state === 'loading' && loadingLabel}
          {state === 'done'    && doneLabel}
          {state === 'error'   && errorLabel}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

// ─── PreviewScreen ────────────────────────────────────────────────────────────

export default function PreviewScreen({ photos, onRestart }) {
  const [selectedTemplate, setSelectedTemplate] = useState('gold')
  const [filter,           setFilter]           = useState('original')
  const [compositePhase,   setCompositePhase]   = useState('loading')
  const [compositeUrl,     setCompositeUrl]      = useState(null)
  const [filename,         setFilename]          = useState(null)
  const [email,            setEmail]             = useState('')
  const [showKeyboard,     setShowKeyboard]      = useState(false)
  const [emailState,       setEmailState]        = useState('idle')
  const [printState,       setPrintState]        = useState('idle')
  const [isMobile,         setIsMobile]          = useState(() => window.innerWidth < 768)
  const [backendStatus,    setBackendStatus]      = useState('checking') // checking | online | offline

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  // Health check saat mount — tentukan status koneksi backend secara akurat
  useEffect(() => {
    let cancelled = false
    fetch('/api/health')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(() => { if (!cancelled) setBackendStatus('online') })
      .catch(() => { if (!cancelled) setBackendStatus('offline') })
    return () => { cancelled = true }
  }, [])

  // Re-process saat template berubah atau backend baru online
  useEffect(() => {
    if (backendStatus !== 'online') {
      if (backendStatus === 'offline') setCompositePhase('offline')
      return
    }
    let cancelled = false
    setCompositePhase('loading')
    setCompositeUrl(null)
    setFilename(null)
    setPrintState('idle')
    setEmailState('idle')

    fetch('/api/process-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos, template: selectedTemplate }),
    })
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then((data) => {
        if (cancelled) return
        if (data.url) { setCompositeUrl(data.url); setFilename(data.filename); setCompositePhase('ready') }
        else setCompositePhase('offline')
      })
      .catch(() => { if (!cancelled) setCompositePhase('offline') })

    return () => { cancelled = true }
  }, [selectedTemplate, backendStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrint = async () => {
    if (!filename || printState !== 'idle') return
    setPrintState('loading')
    try {
      const r = await fetch('/api/print', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      })
      setPrintState((await r.json()).ok ? 'done' : 'error')
    } catch { setPrintState('error') }
  }

  const handleSendEmail = async () => {
    if (!email || !filename || emailState !== 'idle') return
    setEmailState('loading')
    setShowKeyboard(false)
    try {
      const r = await fetch('/api/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, filename }),
      })
      setEmailState((await r.json()).ok ? 'done' : 'error')
    } catch { setEmailState('error') }
  }

  const filterCss    = FILTERS.find((f) => f.id === filter)?.css || 'none'
  const backendReady = compositePhase === 'ready'
  const cols         = GRID_COLS[photos.length] || 2
  const rows         = Math.ceil(photos.length / cols)

  return (
    <>
      <motion.div className="w-full h-full flex overflow-hidden" style={{ background: '#0d0d0f', flexDirection: isMobile ? 'column' : 'row' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}>

        {/* ── Strip panel (left on desktop, top on mobile) ───────────────── */}
        <div className="flex items-center justify-center shrink-0"
          style={{
            width: isMobile ? '100%' : '38%',
            height: isMobile ? '38%' : '100%',
            padding: isMobile ? '12px 16px 8px' : '24px',
            borderRight: isMobile ? 'none' : '1px solid #1e1e24',
            borderBottom: isMobile ? '1px solid #1e1e24' : 'none',
          }}>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ aspectRatio: '2/3', height: '100%', maxHeight: '100%', maxWidth: '100%', background: '#111114' }}>

            {/* Raw grid — langsung tampil */}
            <div className="absolute inset-0"
              style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
                       gridTemplateRows: `repeat(${rows}, 1fr)`, gap: 6, padding: 12,
                       background: '#111114' }}>
              {photos.map((src, i) => (
                <motion.img key={i} src={src} alt={`foto ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                  style={{ filter: backendReady ? 'none' : filterCss }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }} />
              ))}
            </div>

            {/* Composite cross-fade */}
            <AnimatePresence>
              {backendReady && compositeUrl && (
                <motion.img key="composite" src={compositeUrl} alt="Foto final"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ filter: filterCss }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }} />
              )}
            </AnimatePresence>

            {/* Status badge */}
            <div className="absolute top-3 right-3">
              <AnimatePresence mode="wait">
                {compositePhase === 'loading' && (
                  <motion.div key="loading" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.span className="w-1.5 h-1.5 rounded-full bg-[#c9a96e] inline-block"
                      animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} />
                    <span className="text-[9px] tracking-widest" style={{ color: '#c9a96e' }}>MEMPROSES</span>
                  </motion.div>
                )}
                {compositePhase === 'ready' && (
                  <motion.div key="ready" className="px-2.5 py-1.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <span className="text-[9px] tracking-widest" style={{ color: '#4ade80' }}>✓ SIAP CETAK</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Controls panel (right on desktop, bottom on mobile) ─────────── */}
        <div className={`flex-1 min-h-0 flex flex-col overflow-y-auto ${isMobile ? 'px-4 py-4 gap-4' : 'h-full px-8 py-6 gap-6'}`}>

          {!isMobile && (
            <div>
              <p className="text-xs tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.3)' }}>HASIL FOTO</p>
              <p className="text-white font-semibold text-lg mt-0.5">Sesuaikan tampilan</p>
            </div>
          )}

          {/* Bingkai — centered */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>PILIH BINGKAI</p>
            <div className="flex gap-5 justify-center flex-wrap">
              {TEMPLATES.map((t) => (
                <motion.button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                  whileTap={{ scale: 0.93 }} whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center gap-2">
                  <StripPreview tmpl={t} photoCount={photos.length} selected={selectedTemplate === t.id} />
                  <span className="text-xs font-semibold"
                    style={{ color: selectedTemplate === t.id ? '#c9a96e' : 'rgba(255,255,255,0.4)' }}>
                    {t.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Filter — centered */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>FILTER</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {FILTERS.map((f) => (
                <motion.button key={f.id} onClick={() => setFilter(f.id)} whileTap={{ scale: 0.92 }}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wider"
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

          <div className="h-px shrink-0" style={{ background: '#1e1e24' }} />

          {/* Cetak */}
          <ActionButton
            state={printState}
            onClick={handlePrint}
            disabled={!filename}
            className="w-full py-5 rounded-2xl text-sm"
            style={{
              background: filename ? 'linear-gradient(135deg,#c9a96e,#d4b87a)' : 'rgba(201,169,110,0.15)',
              color: filename ? '#0d0d0f' : '#c9a96e',
            }}
            loadingLabel="MENCETAK…"
            doneLabel="✓ DIKIRIM KE PRINTER"
            errorLabel="↺ COBA LAGI"
          >
            🖨  CETAK FOTO
          </ActionButton>

          {printState === 'done' && (
            <motion.p className="text-xs text-center -mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Ambil foto di printer dalam 10–15 detik
            </motion.p>
          )}

          {/* Email */}
          <div className="flex flex-col gap-2">
            <p className="text-xs tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              KIRIM KE EMAIL <span style={{ color: 'rgba(255,255,255,0.2)' }}>(opsional)</span>
            </p>
            <motion.button onClick={() => setShowKeyboard(true)} whileTap={{ scale: 0.98 }}
              className="w-full text-left px-4 py-3.5 rounded-xl text-sm"
              style={{
                background: '#1a1a1f',
                border: `1px solid ${showKeyboard ? '#c9a96e' : '#2e2e36'}`,
                color: email ? 'white' : 'rgba(255,255,255,0.3)',
              }}>
              {email || 'Ketuk untuk memasukkan email…'}
            </motion.button>
            <ActionButton
              state={emailState}
              onClick={handleSendEmail}
              disabled={!email || !filename}
              className="w-full py-3.5 rounded-xl text-xs"
              style={{
                background: 'rgba(201,169,110,0.1)',
                color: '#c9a96e',
                border: '1px solid rgba(201,169,110,0.3)',
              }}
              loadingLabel="MENGIRIM…"
              doneLabel="✓ EMAIL TERKIRIM"
              errorLabel="↺ COBA LAGI"
            >
              KIRIM EMAIL
            </ActionButton>
          </div>

          {backendStatus === 'offline' && (
            <p className="text-xs text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Backend offline — preview saja.<br />
              Jalankan <code className="text-[#c9a96e]">node server.js</code> untuk cetak & email.
            </p>
          )}

          <div className="flex-1" />

          <motion.button onClick={onRestart} whileTap={{ scale: 0.96 }}
            className="w-full py-3 rounded-xl text-xs font-medium tracking-widest text-center"
            style={{ color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.07)' }}>
            ← Mulai Sesi Baru
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showKeyboard && (
          <>
            <motion.div key="backdrop" className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowKeyboard(false)} />
            <VirtualKeyboard key="kbd" value={email} onChange={setEmail} onClose={() => setShowKeyboard(false)} compact={isMobile} />
          </>
        )}
      </AnimatePresence>
    </>
  )
}
