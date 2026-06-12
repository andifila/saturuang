import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const COUNTDOWN_FROM      = 10   // detik countdown per foto
const FLASH_DURATION      = 120  // ms
const BETWEEN_SHOT_DELAY  = 2500 // ms thumbnail terlihat sebelum countdown berikutnya

const GRID_LAYOUT = { 2: { cols: 1, rows: 2 }, 4: { cols: 2, rows: 2 }, 8: { cols: 2, rows: 4 } }

const TEMPLATE_STYLES = {
  minimal: { bg: '#ffffff', labelBg: '#ebebeb', labelColor: '#aaaaaa' },
  gold:    { bg: '#0d0b08', labelBg: '#c9a96e', labelColor: '#0d0b08' },
  pink:    { bg: '#fff0f3', labelBg: '#e8a0a0', labelColor: '#ffffff' },
  film:    { bg: '#111009', labelBg: '#2a2218', labelColor: '#8a8060' },
}

export default function CaptureScreen({ totalPhotos, template, onDone }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  // 'ready' → user tap mulai → 'init' → camera warm up → 'countdown' → 'flash' → 'review' → ... → 'finalReview' → 'done'
  const [phase,        setPhase]        = useState('ready')
  const [countdown,    setCountdown]    = useState(COUNTDOWN_FROM)
  const [shotIndex,    setShotIndex]    = useState(0)
  const [photos,       setPhotos]       = useState([])
  const [flash,        setFlash]        = useState(false)
  const [lastShot,     setLastShot]     = useState(null)
  const [retakeIndex,  setRetakeIndex]  = useState(null)
  const [retakenSlots, setRetakenSlots] = useState(new Set()) // slot yg sudah pernah diulang

  // Mulai kamera saat masuk fase 'init'
  useEffect(() => {
    if (phase !== 'init') return
    let mounted = true
    navigator.mediaDevices
      .getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (!mounted) return
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setTimeout(() => mounted && setPhase('countdown'), 800)
      })
      .catch((err) => console.error('Camera error:', err))

    return () => {
      mounted = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [phase])

  const capturePhoto = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null
    canvas.width  = video.videoWidth  || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.92)
  }, [])

  // Countdown → capture
  useEffect(() => {
    if (phase !== 'countdown') return

    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(t)
    }

    setFlash(true)
    const dataUrl = capturePhoto()
    const newPhotos = retakeIndex !== null
      ? photos.map((p, i) => (i === retakeIndex ? dataUrl : p))
      : [...photos, dataUrl]
    setPhotos(newPhotos)
    setLastShot(dataUrl)
    setPhase('flash')

    setTimeout(() => {
      setFlash(false)
      if (retakeIndex !== null) {
        setRetakeIndex(null)
        setPhase('finalReview')
      } else if (newPhotos.length >= totalPhotos) {
        setPhase('finalReview')
      } else {
        setPhase('review')
        setTimeout(() => {
          setShotIndex((i) => i + 1)
          setCountdown(COUNTDOWN_FROM)
          setPhase('countdown')
        }, BETWEEN_SHOT_DELAY)
      }
    }, FLASH_DURATION)
  }, [phase, countdown, capturePhoto, photos, totalPhotos, retakeIndex])

  const handleRetake = (index) => {
    setRetakenSlots(prev => new Set([...prev, index]))
    setRetakeIndex(index)
    setCountdown(COUNTDOWN_FROM)
    setPhase('countdown')
  }

  const handleConfirm = () => {
    setPhase('done')
    setTimeout(() => onDone(photos), 800)
  }

  const progressPercent = Math.round((photos.length / totalPhotos) * 100)
  const layout    = GRID_LAYOUT[totalPhotos] || GRID_LAYOUT[4]
  const tmplStyle = TEMPLATE_STYLES[template] || TEMPLATE_STYLES.minimal

  return (
    <motion.div
      className="relative w-screen h-screen flex items-center justify-center bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4 }}
    >
      {/* Live camera feed */}
      <video ref={videoRef} autoPlay playsInline muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }} />
      <canvas ref={canvasRef} className="hidden" />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />

      {/* Flash */}
      <AnimatePresence>
        {flash && (
          <motion.div key="flash" className="absolute inset-0 bg-white z-50 pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.06 }} />
        )}
      </AnimatePresence>

      {/* Top bar — dots centered, counter top-right */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3">
          {Array.from({ length: totalPhotos }).map((_, i) => (
            <motion.div key={i} className="rounded-full"
              style={{ background: i < photos.length ? '#c9a96e' : 'rgba(255,255,255,0.25)' }}
              initial={{ width: 8, height: 8 }}
              animate={{
                width:  i === photos.length && phase === 'countdown' ? 12 : 8,
                height: i === photos.length && phase === 'countdown' ? 12 : 8,
                scale:  i === photos.length && phase === 'countdown' ? [1, 1.3, 1] : 1,
              }}
              transition={{ repeat: i === photos.length ? Infinity : 0, duration: 1 }} />
          ))}
        </div>
        <span className="absolute right-6 text-white/60 text-sm font-medium tracking-widest">
          {retakeIndex !== null
            ? `↺ FOTO ${retakeIndex + 1}`
            : `${photos.length + (phase === 'countdown' ? 1 : 0)} / ${totalPhotos}`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] z-20">
        <motion.div className="h-full"
          style={{ background: 'linear-gradient(to right, #c9a96e, #f0d9a8)' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }} />
      </div>

      {/* Countdown number */}
      <AnimatePresence mode="wait">
        {phase === 'countdown' && countdown > 0 && (
          <motion.div key={`cd-${countdown}-shot-${shotIndex}`}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
            initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2.5, opacity: 0 }} transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <span className="font-black leading-none select-none"
              style={{ fontSize: 'clamp(140px, 22vw, 280px)', color: 'white',
                       textShadow: '0 0 60px rgba(201,169,110,0.6), 0 8px 40px rgba(0,0,0,0.8)',
                       fontVariantNumeric: 'tabular-nums' }}>
              {countdown}
            </span>
          </motion.div>
        )}
        {phase === 'countdown' && countdown === 0 && (
          <motion.div key="shoot"
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1.1, opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          >
            <span className="font-black leading-none select-none tracking-tight"
              style={{ fontSize: 'clamp(70px, 10vw, 120px)', color: '#c9a96e',
                       textShadow: '0 0 40px rgba(201,169,110,0.9)' }}>
              SMILE!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Between-shot mini preview */}
      <AnimatePresence>
        {phase === 'review' && lastShot && (
          <motion.div key="mini-preview"
            className="absolute bottom-8 right-8 z-30 rounded-xl overflow-hidden border-2 shadow-2xl"
            style={{ borderColor: '#c9a96e' }}
            initial={{ opacity: 0, scale: 0.7, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <img src={lastShot} alt="last shot" className="w-40 h-24 object-cover" />
            <div className="absolute inset-0 flex items-end justify-center pb-2"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
              <span className="text-white text-xs font-semibold tracking-widest">✓ TERSIMPAN</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera frame corners */}
      <div className="absolute inset-8 z-10 pointer-events-none">
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
          <div key={pos}
            className={`absolute w-10 h-10 ${pos.includes('top') ? 'top-0' : 'bottom-0'} ${pos.includes('left') ? 'left-0' : 'right-0'}`}
            style={{ borderColor: 'rgba(201,169,110,0.7)', borderStyle: 'solid', borderWidth: 0,
              ...(pos === 'top-left'     && { borderTopWidth: 3, borderLeftWidth: 3 }),
              ...(pos === 'top-right'    && { borderTopWidth: 3, borderRightWidth: 3 }),
              ...(pos === 'bottom-left'  && { borderBottomWidth: 3, borderLeftWidth: 3 }),
              ...(pos === 'bottom-right' && { borderBottomWidth: 3, borderRightWidth: 3 }),
              borderRadius: 4 }} />
        ))}
      </div>

      {/* ── Ready screen — user tap sebelum kamera mulai ── */}
      <AnimatePresence>
        {phase === 'ready' && (
          <motion.div key="ready-screen"
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-10"
            style={{ background: '#0d0d0f' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.35 }}
          >
            {/* Icon kamera */}
            <motion.div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(201,169,110,0.1)', border: '2px solid rgba(201,169,110,0.3)' }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </motion.div>

            <div className="flex flex-col items-center gap-2">
              <p className="text-white/40 text-xs tracking-[0.3em]">SESI FOTO DIMULAI</p>
              <p className="text-white text-3xl font-bold">{totalPhotos} Foto</p>
              <p className="text-white/40 text-sm text-center max-w-xs leading-relaxed mt-1">
                Bersiaplah di depan kamera, lalu tekan tombol di bawah
              </p>
            </div>

            <motion.button
              onClick={() => setPhase('init')}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              className="px-16 py-5 rounded-2xl font-bold tracking-widest text-base"
              style={{ background: 'linear-gradient(135deg, #c9a96e, #d4b87a)', color: '#0d0d0f' }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Mulai Sesi Foto →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Init loading */}
      <AnimatePresence>
        {phase === 'init' && (
          <motion.div key="init"
            className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black/80 backdrop-blur-md gap-5"
            exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <motion.div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-[#c9a96e]"
              animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }} />
            <p className="text-white/60 text-sm tracking-widest font-medium">MENGAKTIFKAN KAMERA…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Final Review ── */}
      <AnimatePresence>
        {phase === 'finalReview' && (
          <motion.div key="final-review"
            className="absolute inset-0 z-40 flex flex-col"
            style={{ background: '#0d0d0f' }}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-6 pt-5 pb-3 flex items-center justify-between shrink-0">
              <div>
                <p className="text-white/40 text-[10px] tracking-[0.25em]">REVIEW FOTO</p>
                <p className="text-white font-semibold">
                  {retakenSlots.size < totalPhotos ? 'Tap ↺ untuk mengulang' : 'Semua kesempatan digunakan'}
                </p>
              </div>
              <span className="text-white/30 text-xs">
                ↺ {totalPhotos - retakenSlots.size} tersisa
              </span>
            </div>

            {/* Photostrip card styled per template */}
            <div className="flex-1 flex items-center justify-center px-6 pb-3 min-h-0">
              <motion.div
                className="h-full rounded-2xl overflow-hidden flex flex-col shadow-2xl"
                style={{ background: tmplStyle.bg, aspectRatio: '2/3', maxWidth: '100%' }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              >
                <div className="flex-1 min-h-0 p-2.5"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
                    gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
                    gap: 5,
                  }}
                >
                  {photos.map((src, i) => {
                    const alreadyRetaken = retakenSlots.has(i)
                    return (
                      <motion.div key={i} className="relative rounded-lg overflow-hidden"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05, type: 'spring', stiffness: 280, damping: 22 }}
                      >
                        <img src={src} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
                        {alreadyRetaken ? (
                          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-1.5"
                            style={{ background: 'rgba(0,0,0,0.45)' }}>
                            <span className="text-white/40 text-[9px] font-bold tracking-wider">✓ DIULANG</span>
                          </div>
                        ) : (
                          <motion.button onClick={() => handleRetake(i)} whileTap={{ scale: 0.94 }}
                            className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-1.5"
                            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
                          >
                            <span className="text-white/90 text-[9px] font-bold tracking-wider">↺ ULANGI</span>
                          </motion.button>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                <div className="shrink-0 flex items-center justify-center"
                  style={{ background: tmplStyle.labelBg, height: 32 }}>
                  <span className="text-[9px] font-bold tracking-[0.35em]" style={{ color: tmplStyle.labelColor }}>
                    SATU RUANG
                  </span>
                </div>
              </motion.div>
            </div>

            <div className="px-6 pb-6 pt-2 shrink-0">
              <motion.button onClick={handleConfirm} whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl font-bold tracking-widest text-sm"
                style={{ background: 'linear-gradient(135deg, #c9a96e, #d4b87a)', color: '#0d0d0f' }}>
                Lanjut ke Preview →
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Done transition overlay */}
      <AnimatePresence>
        {phase === 'done' && (
          <motion.div key="done-overlay"
            className="absolute inset-0 flex flex-col items-center justify-center z-40 gap-4"
            style={{ background: 'rgba(13,13,15,0.92)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}>
              <span style={{ fontSize: 72 }}>🎉</span>
            </motion.div>
            <p className="text-white text-2xl font-bold tracking-tight">{totalPhotos} Foto Berhasil!</p>
            <p className="text-white/50 text-sm tracking-widest">Memproses hasil foto…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
