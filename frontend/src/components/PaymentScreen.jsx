import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SIMULATE_LOADING_MS = 1500  // lama spinner "generate QRIS"
const SIMULATE_SUCCESS_MS = 6000  // detik setelah QR muncul → auto sukses
const PAYMENT_TIMEOUT_SECONDS = SIMULATE_SUCCESS_MS / 1000

const PRICE_TABLE = { 2: 15000, 4: 25000, 8: 40000 }
const formatRupiah = n => `Rp ${n.toLocaleString('id-ID')}`

export default function PaymentScreen({ totalPhotos, onSuccess }) {
  const [phase, setPhase] = useState('loading') // loading | ready | success
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_TIMEOUT_SECONDS)

  useEffect(() => {
    const t = setTimeout(() => setPhase('ready'), SIMULATE_LOADING_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase !== 'ready') return

    const intervalId = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setPhase('success')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalId)
  }, [phase])

  // Pindah ke CaptureScreen setelah animasi sukses
  useEffect(() => {
    if (phase !== 'success') return
    const t = setTimeout(onSuccess, 1800)
    return () => clearTimeout(t)
  }, [phase, onSuccess])

  const displayPrice = formatRupiah(PRICE_TABLE[totalPhotos] ?? 25000)

  return (
    <motion.div
      className="w-screen h-screen flex flex-col items-center justify-center"
      style={{ background: '#0d0d0f' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <AnimatePresence mode="wait">

        {/* ── Loading ── */}
        {phase === 'loading' && (
          <motion.div
            key="loading"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-12 h-12 rounded-full border-4 border-white/10 border-t-[#c9a96e]"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            />
            <p className="text-white/40 text-sm tracking-[0.25em]">MENYIAPKAN QRIS…</p>
          </motion.div>
        )}

        {/* ── Ready: QR placeholder ── */}
        {phase === 'ready' && (
          <motion.div
            key="ready"
            className="flex flex-col items-center gap-5"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
          >
            <div className="flex flex-col items-center gap-1">
              <p className="text-white/40 text-xs tracking-[0.25em]">SCAN UNTUK MEMBAYAR</p>
              <p className="text-[#c9a96e] text-3xl font-bold">{displayPrice}</p>
            </div>

            {/* QR placeholder */}
            <motion.div
              className="p-5 rounded-3xl shadow-2xl relative overflow-hidden"
              style={{ background: 'white', width: 256, height: 256 }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              {/* Grid pattern simulasi QR */}
              <div
                className="absolute inset-5 rounded-xl"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg,#111 0 3px,transparent 3px 9px),' +
                    'repeating-linear-gradient(90deg,#111 0 3px,transparent 3px 9px)',
                  backgroundSize: '9px 9px',
                  opacity: 0.12,
                }}
              />
              {/* Corner squares (ciri khas QR) */}
              {[
                'top-5 left-5', 'top-5 right-5', 'bottom-5 left-5',
              ].map(pos => (
                <div
                  key={pos}
                  className={`absolute ${pos} w-10 h-10 rounded-sm border-4`}
                  style={{ borderColor: '#111' }}
                >
                  <div className="w-4 h-4 m-auto mt-1 rounded-[2px]" style={{ background: '#111' }} />
                </div>
              ))}
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <p className="text-[10px] font-bold tracking-widest" style={{ color: '#555' }}>SIMULASI</p>
                <p className="text-xs font-black" style={{ color: '#0d0d0f' }}>QRIS</p>
              </div>
            </motion.div>

            {/* Polling indicator */}
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-[#c9a96e]"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <span className="text-white/40 text-xs">Menunggu konfirmasi pembayaran…</span>
            </div>

            {/* Countdown */}
            <div className="flex flex-col items-center gap-1">
              <p className="text-white/20 text-xs tracking-widest">SIMULASI SUKSES DALAM</p>
              <p
                className="font-mono text-2xl font-bold tabular-nums"
                style={{ color: secondsLeft <= 3 ? '#c9a96e' : 'rgba(255,255,255,0.5)' }}
              >
                {String(secondsLeft).padStart(2, '0')}
              </p>
            </div>

            <p className="text-white/15 text-xs">Mode Simulasi — tidak ada transaksi nyata</p>
          </motion.div>
        )}

        {/* ── Success ── */}
        {phase === 'success' && (
          <motion.div
            key="success"
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          >
            <motion.div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(201,169,110,0.15)', border: '2px solid #c9a96e' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            >
              <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
                <motion.path
                  d="M8 20 L17 29 L32 12"
                  stroke="#c9a96e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                />
              </svg>
            </motion.div>
            <p className="text-white text-2xl font-bold">Pembayaran Berhasil!</p>
            <p className="text-white/40 text-sm">Bersiaplah untuk berfoto…</p>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  )
}
