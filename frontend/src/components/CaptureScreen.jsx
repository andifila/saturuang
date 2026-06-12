import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const COUNTDOWN_FROM = 3
const FLASH_DURATION = 120 // ms
const BETWEEN_SHOT_DELAY = 1200 // ms pause after each capture

export default function CaptureScreen({ totalPhotos, onDone }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [phase, setPhase] = useState('init') // init | countdown | flash | review | done
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM)
  const [shotIndex, setShotIndex] = useState(0)
  const [photos, setPhotos] = useState([])
  const [flash, setFlash] = useState(false)
  const [lastShot, setLastShot] = useState(null)

  // Start camera
  useEffect(() => {
    let mounted = true
    navigator.mediaDevices
      .getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (!mounted) return
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        // Small delay so camera warms up
        setTimeout(() => mounted && setPhase('countdown'), 800)
      })
      .catch((err) => {
        console.error('Camera error:', err)
      })

    return () => {
      mounted = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  // Capture frame to canvas → dataURL
  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    // Mirror flip to match preview
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.92)
  }, [])

  // Countdown loop
  useEffect(() => {
    if (phase !== 'countdown') return

    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(t)
    }

    // countdown hit 0 → fire flash + capture
    setFlash(true)
    const dataUrl = capturePhoto()
    const newPhotos = [...photos, dataUrl]
    setPhotos(newPhotos)
    setLastShot(dataUrl)
    setPhase('flash')

    setTimeout(() => {
      setFlash(false)
      if (newPhotos.length >= totalPhotos) {
        setPhase('done')
        setTimeout(() => onDone(newPhotos), 800)
      } else {
        setPhase('review')
        setTimeout(() => {
          setShotIndex((i) => i + 1)
          setCountdown(COUNTDOWN_FROM)
          setPhase('countdown')
        }, BETWEEN_SHOT_DELAY)
      }
    }, FLASH_DURATION)
  }, [phase, countdown, capturePhoto, photos, totalPhotos, onDone])

  const progressPercent = Math.round((photos.length / totalPhotos) * 100)

  return (
    <motion.div
      className="relative w-screen h-screen flex items-center justify-center bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4 }}
    >
      {/* Live camera feed — mirrored */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Dark vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key="flash"
            className="absolute inset-0 bg-white z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.06 }}
          />
        )}
      </AnimatePresence>

      {/* Top bar — shot counter + progress */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Array.from({ length: totalPhotos }).map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{ background: i < photos.length ? '#c9a96e' : 'rgba(255,255,255,0.25)' }}
              initial={{ width: 8, height: 8 }}
              animate={{
                width: i === photos.length && phase === 'countdown' ? 12 : 8,
                height: i === photos.length && phase === 'countdown' ? 12 : 8,
                scale: i === photos.length && phase === 'countdown' ? [1, 1.3, 1] : 1,
              }}
              transition={{ repeat: i === photos.length ? Infinity : 0, duration: 1 }}
            />
          ))}
        </div>
        <span className="text-white/60 text-sm font-medium tracking-widest">
          {photos.length + (phase === 'countdown' ? 1 : 0)} / {totalPhotos}
        </span>
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] z-20">
        <motion.div
          className="h-full"
          style={{ background: 'linear-gradient(to right, #c9a96e, #f0d9a8)' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Countdown number */}
      <AnimatePresence mode="wait">
        {phase === 'countdown' && countdown > 0 && (
          <motion.div
            key={`cd-${countdown}-shot-${shotIndex}`}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <span
              className="font-black leading-none select-none"
              style={{
                fontSize: 'clamp(140px, 22vw, 280px)',
                color: 'white',
                textShadow: '0 0 60px rgba(201,169,110,0.6), 0 8px 40px rgba(0,0,0,0.8)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {countdown}
            </span>
          </motion.div>
        )}

        {phase === 'countdown' && countdown === 0 && (
          <motion.div
            key="shoot"
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <span
              className="font-black leading-none select-none tracking-tight"
              style={{
                fontSize: 'clamp(70px, 10vw, 120px)',
                color: '#c9a96e',
                textShadow: '0 0 40px rgba(201,169,110,0.9)',
              }}
            >
              SMILE!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Between-shot mini preview thumbnail */}
      <AnimatePresence>
        {phase === 'review' && lastShot && (
          <motion.div
            key="mini-preview"
            className="absolute bottom-8 right-8 z-30 rounded-xl overflow-hidden border-2 shadow-2xl"
            style={{ borderColor: '#c9a96e' }}
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <img src={lastShot} alt="last shot" className="w-40 h-24 object-cover" />
            <div
              className="absolute inset-0 flex items-end justify-center pb-2"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}
            >
              <span className="text-white text-xs font-semibold tracking-widest">✓ TERSIMPAN</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera frame corners */}
      <div className="absolute inset-8 z-10 pointer-events-none">
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
          <div
            key={pos}
            className={`absolute w-10 h-10 ${
              pos.includes('top') ? 'top-0' : 'bottom-0'
            } ${pos.includes('left') ? 'left-0' : 'right-0'}`}
            style={{
              borderColor: 'rgba(201,169,110,0.7)',
              borderStyle: 'solid',
              borderWidth: 0,
              ...(pos === 'top-left' && { borderTopWidth: 3, borderLeftWidth: 3 }),
              ...(pos === 'top-right' && { borderTopWidth: 3, borderRightWidth: 3 }),
              ...(pos === 'bottom-left' && { borderBottomWidth: 3, borderLeftWidth: 3 }),
              ...(pos === 'bottom-right' && { borderBottomWidth: 3, borderRightWidth: 3 }),
              borderRadius: 4,
            }}
          />
        ))}
      </div>

      {/* Init loading state */}
      <AnimatePresence>
        {phase === 'init' && (
          <motion.div
            key="init"
            className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black/80 backdrop-blur-md gap-5"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="w-12 h-12 rounded-full border-4 border-white/20 border-t-[#c9a96e]"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            />
            <p className="text-white/60 text-sm tracking-widest font-medium">
              MENGAKTIFKAN KAMERA…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Done transition overlay */}
      <AnimatePresence>
        {phase === 'done' && (
          <motion.div
            key="done-overlay"
            className="absolute inset-0 flex flex-col items-center justify-center z-40 gap-4"
            style={{ background: 'rgba(13,13,15,0.92)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            >
              <span style={{ fontSize: 72 }}>🎉</span>
            </motion.div>
            <p className="text-white text-2xl font-bold tracking-tight">
              {totalPhotos} Foto Berhasil!
            </p>
            <p className="text-white/50 text-sm tracking-widest">Memproses hasil foto…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
