import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const FILTERS = [
  { id: 'original', label: 'Original', css: 'none' },
  { id: 'bw',       label: 'B&W',      css: 'grayscale(1) contrast(1.05)' },
  { id: 'vintage',  label: 'Vintage',  css: 'sepia(0.55) contrast(0.92) brightness(1.08) saturate(0.8)' },
]

const GRID_COLS = { 2: 1, 4: 2, 8: 2 }

// ─── TemplateThumbnail ────────────────────────────────────────────────────────

function TemplateThumbnail({ url, selected }) {
  return (
    <div style={{
      width: 52, height: 78, borderRadius: 8, overflow: 'hidden',
      boxShadow: selected
        ? '0 0 0 2px #c9a96e, 0 4px 16px rgba(201,169,110,0.35)'
        : '0 2px 8px rgba(0,0,0,0.5)',
      transition: 'box-shadow 0.15s',
    }}>
      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
    </div>
  )
}

// ─── PreviewScreen ────────────────────────────────────────────────────────────

export default function PreviewScreen({ photos, orderId, onDone, onRestart }) {
  const [templates,        setTemplates]        = useState([])
  const [templatesReady,   setTemplatesReady]   = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [filter,           setFilter]           = useState('original')
  const [compositePhase,   setCompositePhase]   = useState('loading')
  const [compositeUrl,     setCompositeUrl]      = useState(null)
  const [filename,         setFilename]          = useState(null)
  const [isMobile,         setIsMobile]          = useState(() => window.innerWidth < 768)
  const [backendStatus,    setBackendStatus]      = useState('checking')

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/health')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(() => { if (!cancelled) setBackendStatus('online') })
      .catch(() => { if (!cancelled) setBackendStatus('offline') })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/templates')
      .then(r => r.json())
      .then(list => {
        if (cancelled) return
        setTemplates(list)
        if (list.length > 0) setSelectedTemplate(list[0].id)
        setTemplatesReady(true)
      })
      .catch(() => { if (!cancelled) setTemplatesReady(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (backendStatus !== 'online' || !templatesReady) {
      if (backendStatus === 'offline') setCompositePhase('offline')
      return
    }
    let cancelled = false
    setCompositePhase('loading')
    setCompositeUrl(null)
    setFilename(null)

    fetch('/api/process-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos, template: selectedTemplate, orderId }),
    })
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(data => {
        if (cancelled) return
        if (data.url) { setCompositeUrl(data.url); setFilename(data.filename); setCompositePhase('ready') }
        else setCompositePhase('offline')
      })
      .catch(() => { if (!cancelled) setCompositePhase('offline') })

    return () => { cancelled = true }
  }, [selectedTemplate, backendStatus, templatesReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const filterCss  = FILTERS.find(f => f.id === filter)?.css || 'none'
  const ready      = compositePhase === 'ready'
  const cols       = GRID_COLS[photos.length] || 2
  const rows       = Math.ceil(photos.length / cols)

  return (
    <motion.div className="w-full h-full flex overflow-hidden"
      style={{ background: '#0d0d0f', flexDirection: isMobile ? 'column' : 'row' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}>

      {/* ── Strip panel ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center shrink-0"
        style={{
          width:        isMobile ? '100%' : '38%',
          height:       isMobile ? '38%'  : '100%',
          padding:      isMobile ? '12px 16px 8px' : '24px',
          borderRight:  isMobile ? 'none' : '1px solid #1e1e24',
          borderBottom: isMobile ? '1px solid #1e1e24' : 'none',
        }}>
        <div className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{ aspectRatio: '2/3', height: '100%', maxHeight: '100%', maxWidth: '100%', background: '#111114' }}>

          {/* Raw grid */}
          <div className="absolute inset-0"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
                     gridTemplateRows: `repeat(${rows}, 1fr)`, gap: 6, padding: 12,
                     background: '#111114' }}>
            {photos.map((src, i) => (
              <motion.img key={i} src={src} alt={`foto ${i + 1}`}
                className="w-full h-full object-cover rounded-lg"
                style={{ filter: ready ? 'none' : filterCss }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06 }} />
            ))}
          </div>

          {/* Composite cross-fade */}
          <AnimatePresence>
            {ready && compositeUrl && (
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
              {ready && (
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

      {/* ── Controls panel ─────────────────────────────────────────────────── */}
      <div className={`flex-1 min-h-0 flex flex-col overflow-y-auto ${isMobile ? 'px-4 py-4 gap-4' : 'h-full px-8 py-6 gap-6'}`}>

        {!isMobile && (
          <div>
            <p className="text-xs tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.3)' }}>HASIL FOTO</p>
            <p className="text-white font-semibold text-lg mt-0.5">Sesuaikan tampilan</p>
          </div>
        )}

        {/* Bingkai */}
        {templates.length > 0 && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>PILIH BINGKAI</p>
            <div className="flex gap-5 justify-center flex-wrap">
              {templates.map(t => (
                <motion.button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                  whileTap={{ scale: 0.93 }} whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center gap-2">
                  <TemplateThumbnail url={t.url} selected={selectedTemplate === t.id} />
                  <span className="text-xs font-semibold"
                    style={{ color: selectedTemplate === t.id ? '#c9a96e' : 'rgba(255,255,255,0.4)' }}>
                    {t.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>FILTER</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {FILTERS.map(f => (
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

        {backendStatus === 'offline' && (
          <p className="text-xs text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Backend offline — preview saja.<br />
            Jalankan <code className="text-[#c9a96e]">node server.js</code> untuk cetak & email.
          </p>
        )}

        <div className="flex-1" />

        {/* Lanjut */}
        <motion.button
          onClick={() => ready && onDone({ compositeUrl, filename, filterCss })}
          whileTap={ready ? { scale: 0.96 } : {}}
          className="w-full py-5 lg:py-7 rounded-2xl font-bold tracking-widest text-sm lg:text-base"
          style={{
            background: ready ? 'linear-gradient(135deg,#c9a96e,#d4b87a)' : 'rgba(201,169,110,0.15)',
            color:  ready ? '#0d0d0f' : 'rgba(201,169,110,0.4)',
            cursor: ready ? 'pointer' : 'default',
          }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>
          {ready ? 'Lanjut Cetak & Kirim →' : 'Memproses foto…'}
        </motion.button>

        <motion.button onClick={onRestart} whileTap={{ scale: 0.96 }}
          className="w-full py-3 rounded-xl text-xs font-medium tracking-widest text-center"
          style={{ color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.07)' }}>
          ← Mulai Sesi Baru
        </motion.button>
      </div>
    </motion.div>
  )
}
