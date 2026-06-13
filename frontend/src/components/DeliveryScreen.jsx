import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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

// ─── Key ──────────────────────────────────────────────────────────────────────

function Key({ label, onPress, compact, kiosk }) {
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
        height: compact ? 36 : kiosk ? 60 : 46,
        ...(compact
          ? { flex: label === '[SPACE]' ? '4 1 0' : isWide ? '1.5 1 0' : '1 1 0', minWidth: 0 }
          : {
              minWidth: label === '[SPACE]'
                ? (kiosk ? 240 : 200)
                : isWide ? (kiosk ? 96 : 76) : (kiosk ? 68 : 52),
              flexGrow: label === '[SPACE]' ? 1 : 0,
            }
        ),
        fontSize: compact ? (isSpecial ? 8 : 12) : kiosk ? (isSpecial ? 13 : 20) : (isSpecial ? 10 : 15),
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

// ─── VirtualKeyboard ──────────────────────────────────────────────────────────

function VirtualKeyboard({ value, onChange, onClose, compact, kiosk }) {
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
      className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col ${
        compact ? 'gap-1 px-2 pb-2 pt-2'
        : kiosk  ? 'gap-2 px-8 pb-8 pt-5'
        :          'gap-1.5 px-4 pb-4 pt-3'
      }`}
      style={{ background: 'rgba(16,16,20,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid #2e2e36' }}
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 400, damping: 38 }}
    >
      <div className={`flex items-center gap-3 px-4 rounded-xl mb-1 ${kiosk ? 'py-4' : 'py-2.5'}`}
           style={{ background: '#1a1a1f', border: '1px solid #2e2e36' }}>
        <span className={`${kiosk ? 'text-xs' : 'text-[10px]'} tracking-widest shrink-0`}
              style={{ color: 'rgba(255,255,255,0.3)' }}>EMAIL</span>
        <span className={`flex-1 ${kiosk ? 'text-base' : 'text-sm'} font-medium truncate`}
              style={{ color: value ? 'white' : 'rgba(255,255,255,0.25)' }}>
          {value || 'nama@email.com'}
        </span>
        {value && (
          <button onPointerDown={(e) => { e.preventDefault(); onChange('') }}
                  className={`${kiosk ? 'text-sm px-3 py-2' : 'text-[10px] px-2 py-1'} rounded-lg`}
                  style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.07)' }}>
            hapus
          </button>
        )}
      </div>
      {rows.map((row, ri) => (
        <div key={ri} className={`flex justify-center ${compact ? 'gap-1' : kiosk ? 'gap-2' : 'gap-1.5'}`}>
          {row.map((key) => <Key key={key} label={key} onPress={handleKey} compact={compact} kiosk={kiosk} />)}
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
          {state === 'idle'    && children}
          {state === 'loading' && loadingLabel}
          {state === 'done'    && doneLabel}
          {state === 'error'   && errorLabel}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

// ─── DeliveryScreen ───────────────────────────────────────────────────────────

export default function DeliveryScreen({ compositeUrl, filename, filterCss, onBack, onRestart }) {
  const [email,        setEmail]        = useState('')
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [emailState,   setEmailState]   = useState('idle')
  const [printState,   setPrintState]   = useState('idle')
  const [isMobile,     setIsMobile]     = useState(() => window.innerWidth < 768)
  const [isKiosk,      setIsKiosk]      = useState(() => window.innerWidth >= 1024)

  useEffect(() => {
    const h = () => { setIsMobile(window.innerWidth < 768); setIsKiosk(window.innerWidth >= 1024) }
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

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

  return (
    <>
      <motion.div
        className="w-full h-full flex overflow-hidden"
        style={{ background: '#0d0d0f', flexDirection: isMobile ? 'column' : 'row' }}
        initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── Foto strip final ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-center shrink-0"
          style={{
            width:        isMobile ? '100%' : '38%',
            height:       isMobile ? '42%'  : '100%',
            padding:      isMobile ? '12px 16px 8px' : '24px',
            borderRight:  isMobile ? 'none' : '1px solid #1e1e24',
            borderBottom: isMobile ? '1px solid #1e1e24' : 'none',
          }}>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ aspectRatio: '2/3', height: '100%', maxHeight: '100%', maxWidth: '100%', background: '#111114' }}>
            {compositeUrl && (
              <img src={compositeUrl} alt="Foto final"
                className="w-full h-full object-contain"
                style={{ filter: filterCss }} />
            )}
            <div className="absolute top-3 right-3">
              <div className="px-2.5 py-1.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                <span className="text-[9px] tracking-widest" style={{ color: '#4ade80' }}>✓ SIAP CETAK</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Actions panel ─────────────────────────────────────────────────── */}
        <div className={`flex-1 min-h-0 flex flex-col overflow-y-auto ${isMobile ? 'px-4 py-4 gap-4' : 'h-full px-8 py-6 gap-6'}`}>

          {!isMobile && (
            <div>
              <p className="text-xs tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.3)' }}>LANGKAH TERAKHIR</p>
              <p className="text-white font-semibold text-lg mt-0.5">Cetak & kirim fotomu</p>
            </div>
          )}

          {/* Cetak */}
          <ActionButton
            state={printState}
            onClick={handlePrint}
            disabled={!filename}
            className="w-full py-5 lg:py-7 rounded-2xl text-sm lg:text-base"
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

          <div className="h-px shrink-0" style={{ background: '#1e1e24' }} />

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
              className="w-full py-3.5 lg:py-5 rounded-xl text-xs lg:text-sm"
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

          <div className="flex-1" />

          {/* Navigation */}
          <div className="flex flex-col gap-2">
            <motion.button onClick={onBack} whileTap={{ scale: 0.96 }}
              className="w-full py-3 rounded-xl text-xs font-medium tracking-widest text-center"
              style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)' }}>
              ← Ubah Tampilan
            </motion.button>
            <motion.button onClick={onRestart} whileTap={{ scale: 0.96 }}
              className="w-full py-3 rounded-xl text-xs font-medium tracking-widest text-center"
              style={{ color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
              Mulai Sesi Baru
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showKeyboard && (
          <>
            <motion.div key="backdrop" className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowKeyboard(false)} />
            <VirtualKeyboard key="kbd" value={email} onChange={setEmail}
              onClose={() => setShowKeyboard(false)} compact={isMobile} kiosk={isKiosk} />
          </>
        )}
      </AnimatePresence>
    </>
  )
}
