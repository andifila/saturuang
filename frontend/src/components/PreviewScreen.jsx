import { useEffect, useState, useCallback, useRef } from 'react'
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

// ─── StripPreview (mini frame thumbnail) ─────────────────────────────────────

function StripPreview({ tmpl, photoCount, selected }) {
  const cols = photoCount === 2 ? 1 : 2
  const rows = photoCount === 8 ? 4 : 2
  return (
    <div className="flex flex-col rounded-xl overflow-hidden transition-all duration-200"
      style={{
        width: 52, height: 78, background: tmpl.bg,
        boxShadow: selected
          ? '0 0 0 2px #c9a96e, 0 4px 16px rgba(201,169,110,0.35)'
          : '0 2px 6px rgba(0,0,0,0.4)',
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

function Key({ label, onPress }) {
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
        height: 46, minWidth: label === '[SPACE]' ? 200 : isWide ? 76 : 52,
        flexGrow: label === '[SPACE]' ? 1 : 0,
        fontSize: isSpecial ? 10 : 15, letterSpacing: isSpecial ? '0.1em' : 0,
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

function VirtualKeyboard({ value, onChange, onClose }) {
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
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col gap-1.5 px-4 pb-4 pt-3"
      style={{ background: 'rgba(16,16,20,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid #2e2e36' }}
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 400, damping: 38 }}
    >
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
  const processingRef = useRef(false)

  // Re-process whenever template changes
  useEffect(() => {
    if (processingRef.current) return
    processingRef.current = true
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
        processingRef.current = false
        if (data.url) {
          setCompositeUrl(data.url)
          setFilename(data.filename)
          setCompositePhase('ready')
        } else {
          setCompositePhase('offline')
        }
      })
      .catch(() => {
        processingRef.current = false
        setCompositePhase('offline')
      })
  }, [selectedTemplate]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendEmail = async () => {
    if (!email || !filename || emailState !== 'idle') return
    setEmailState('loading')
    setShowKeyboard(false)
    try {
      const r = await fetch('/api/send-email', {
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
      const r = await fetch('/api/print', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      })
      const data = await r.json()
      setPrintState(data.ok ? 'done' : 'error')
    } catch { setPrintState('error') }
  }

  const filterCss    = FILTERS.find((f) => f.id === filter)?.css || 'none'
  const backendReady = compositePhase === 'ready'
  const cols         = GRID_COLS[photos.length] || 2

  return (
    <>
      <motion.div
        className="w-screen h-screen flex flex-col overflow-hidden"
        style={{ background: '#0d0d0f' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Header */}
        <div className="shrink-0 px-6 pt-5 pb-3 flex items-center justify-between">
          <p className="text-xs tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.3)' }}>HASIL FOTO</p>
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
                <span className="text-[10px] tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>OFFLINE</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Photo preview — grows to fill available space */}
        <div className="mx-6 rounded-2xl overflow-hidden relative shrink-0"
          style={{ background: '#111114', aspectRatio: '3/2', maxHeight: '38vh' }}>
          {/* Raw grid — immediately visible */}
          <div className="absolute inset-0"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
                     gridTemplateRows: `repeat(${Math.ceil(photos.length / cols)}, 1fr)`,
                     gap: 4, padding: 10, background: '#111114' }}>
            {photos.map((src, i) => (
              <motion.img key={i} src={src} alt={`foto ${i + 1}`}
                className="w-full h-full object-cover rounded-lg"
                style={{ filter: compositePhase === 'ready' ? 'none' : filterCss }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }} />
            ))}
          </div>
          {/* Composited image cross-fades in */}
          <AnimatePresence>
            {compositePhase === 'ready' && compositeUrl && (
              <motion.div key="composite" className="absolute inset-0 flex items-center justify-center"
                style={{ background: '#111114' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <img src={compositeUrl} alt="Foto final"
                  className="max-w-full max-h-full object-contain"
                  style={{ filter: filterCss }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scrollable bottom area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-5 min-h-0 mt-4">

          {/* Bingkai picker */}
          <div className="flex flex-col gap-3">
            <p className="text-xs tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>PILIH BINGKAI</p>
            <div className="flex gap-4">
              {TEMPLATES.map((t) => (
                <motion.button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                  whileTap={{ scale: 0.93 }} className="flex flex-col items-center gap-2">
                  <StripPreview tmpl={t} photoCount={photos.length} selected={selectedTemplate === t.id} />
                  <span className="text-[11px] font-semibold"
                    style={{ color: selectedTemplate === t.id ? '#c9a96e' : 'rgba(255,255,255,0.45)' }}>
                    {t.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex flex-col gap-3">
            <p className="text-xs tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>FILTER</p>
            <div className="flex gap-2">
              {FILTERS.map((f) => (
                <motion.button key={f.id} onClick={() => setFilter(f.id)} whileTap={{ scale: 0.92 }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider"
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

          {/* Print button */}
          <motion.button
            onClick={handlePrint}
            whileTap={backendReady && printState === 'idle' ? { scale: 0.97 } : {}}
            className="w-full py-5 rounded-2xl font-bold tracking-widest text-sm flex items-center justify-center gap-3"
            style={{
              background: printState === 'done' ? 'rgba(74,222,128,0.12)'
                : printState === 'error' ? 'rgba(248,113,113,0.12)'
                : backendReady && printState === 'idle' ? 'linear-gradient(135deg,#c9a96e,#d4b87a)'
                : 'rgba(201,169,110,0.2)',
              color: printState === 'done' ? '#4ade80'
                : printState === 'error' ? '#f87171'
                : backendReady && printState === 'idle' ? '#0d0d0f'
                : '#c9a96e',
              border: printState === 'done' ? '1px solid #4ade80'
                : printState === 'error' ? '1px solid #f87171'
                : 'none',
              opacity: !backendReady && printState === 'idle' ? 0.45 : 1,
              cursor: !backendReady || printState !== 'idle' ? 'not-allowed' : 'pointer',
            }}>
            <AnimatePresence mode="wait">
              <motion.span key={printState} className="flex items-center gap-2"
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}>
                {printState === 'loading' && (
                  <motion.span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent inline-block"
                    animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
                )}
                {printState === 'idle' && '🖨'}
                {printState === 'idle'    ? ' CETAK FOTO'
                  : printState === 'loading' ? 'MENCETAK…'
                  : printState === 'done'    ? '✓ DIKIRIM KE PRINTER'
                  : '↺ COBA LAGI'}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          {printState === 'done' && (
            <motion.p className="text-xs text-center -mt-2"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Ambil foto di printer dalam 10–15 detik
            </motion.p>
          )}

          {/* Email section */}
          <div className="flex flex-col gap-2">
            <p className="text-xs tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>KIRIM KE EMAIL (opsional)</p>
            <motion.button
              onClick={() => setShowKeyboard(true)} whileTap={{ scale: 0.98 }}
              className="w-full text-left px-4 py-3.5 rounded-xl text-sm"
              style={{
                background: '#1a1a1f',
                border: `1px solid ${showKeyboard ? '#c9a96e' : '#2e2e36'}`,
                color: email ? 'white' : 'rgba(255,255,255,0.3)',
              }}>
              {email || 'Ketuk untuk memasukkan email…'}
            </motion.button>
            <motion.button
              onClick={handleSendEmail}
              whileTap={email && backendReady && emailState === 'idle' ? { scale: 0.97 } : {}}
              className="w-full py-3.5 rounded-xl font-bold tracking-widest text-xs"
              style={{
                background: emailState === 'done' ? 'rgba(74,222,128,0.08)'
                  : emailState === 'error' ? 'rgba(248,113,113,0.08)'
                  : 'rgba(201,169,110,0.1)',
                color: emailState === 'done' ? '#4ade80'
                  : emailState === 'error' ? '#f87171' : '#c9a96e',
                border: emailState === 'done' ? '1px solid #4ade80'
                  : emailState === 'error' ? '1px solid #f87171'
                  : '1px solid rgba(201,169,110,0.4)',
                opacity: (!email || !backendReady) && emailState === 'idle' ? 0.38 : 1,
                cursor: (!email || !backendReady) && emailState === 'idle' ? 'not-allowed' : 'pointer',
              }}>
              <AnimatePresence mode="wait">
                <motion.span key={emailState} className="flex items-center justify-center gap-2"
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}>
                  {emailState === 'loading' && (
                    <motion.span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent inline-block"
                      animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
                  )}
                  {emailState === 'idle' ? 'KIRIM EMAIL'
                    : emailState === 'loading' ? 'MENGIRIM…'
                    : emailState === 'done' ? '✓ EMAIL TERKIRIM'
                    : '↺ COBA LAGI'}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>

          {compositePhase === 'offline' && (
            <p className="text-xs text-center leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.2)' }}>
              Backend offline — preview saja.<br />
              Jalankan <code className="text-[#c9a96e]">node server.js</code> untuk cetak & email.
            </p>
          )}

          <motion.button onClick={onRestart} whileTap={{ scale: 0.96 }}
            className="w-full py-3 rounded-xl text-xs font-medium tracking-widest text-center mt-auto"
            style={{ color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.07)' }}>
            ← Mulai Sesi Baru
          </motion.button>
        </div>
      </motion.div>

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
