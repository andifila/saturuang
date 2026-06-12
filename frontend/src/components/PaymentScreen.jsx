import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SIMULATE_DELAY = 4000 // ms until "payment success"

export default function PaymentScreen({ onSuccess }) {
  const [status, setStatus] = useState('waiting') // waiting | success

  useEffect(() => {
    const t = setTimeout(() => setStatus('success'), SIMULATE_DELAY)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(onSuccess, 1400)
      return () => clearTimeout(t)
    }
  }, [status, onSuccess])

  return (
    <motion.div
      className="w-screen h-screen flex flex-col items-center justify-center gap-8"
      style={{ background: '#0d0d0f' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <AnimatePresence mode="wait">
        {status === 'waiting' && (
          <motion.div
            key="waiting"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <p className="text-sm tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              SCAN UNTUK MEMBAYAR
            </p>

            {/* QRIS placeholder */}
            <div
              className="w-56 h-56 rounded-2xl flex items-center justify-center relative overflow-hidden"
              style={{ background: 'white' }}
            >
              <div
                className="w-44 h-44 rounded-lg"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, #000 0 4px, transparent 4px 8px), repeating-linear-gradient(90deg, #000 0 4px, transparent 4px 8px)',
                  backgroundSize: '8px 8px',
                  opacity: 0.15,
                }}
              />
              <div
                className="absolute inset-0 flex items-center justify-center text-6xl font-black"
                style={{ color: '#0d0d0f' }}
              >
                QR
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.div
                className="w-5 h-5 rounded-full border-2 border-white/20 border-t-[#c9a96e]"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
              />
              <span className="text-white/50 text-sm">Menunggu konfirmasi pembayaran…</span>
            </div>

            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
              (Demo: pembayaran otomatis dalam 4 detik)
            </p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key="success"
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          >
            <motion.div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(201,169,110,0.15)', border: '2px solid #c9a96e' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            >
              <motion.svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <motion.path
                  d="M8 20 L17 29 L32 12"
                  stroke="#c9a96e"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                />
              </motion.svg>
            </motion.div>
            <p className="text-white text-2xl font-bold">Pembayaran Berhasil!</p>
            <p className="text-white/40 text-sm">Bersiaplah untuk berfoto…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
