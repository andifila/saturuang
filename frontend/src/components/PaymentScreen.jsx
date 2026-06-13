import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const POLL_INTERVAL_MS = 2000
const SIM_SUCCESS_SECS = 6
const PRICE_TABLE      = { 2: 20000, 4: 30000 }
const formatRupiah     = n => `Rp ${n.toLocaleString('id-ID')}`

// ── QrBox: real QR image + skeleton loading ───────────────────────────────────

function QrBox({ url, size }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <motion.div
      className="rounded-3xl shadow-2xl relative overflow-hidden flex items-center justify-center"
      style={{ background: 'white', width: size, height: size }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <AnimatePresence>
        {!loaded && (
          <motion.div key="skeleton" className="absolute inset-0 flex items-center justify-center"
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <motion.div
              className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-gray-400"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <img
        src={url}
        alt="QRIS"
        className="w-full h-full object-contain p-3"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
        onLoad={() => setLoaded(true)}
      />
    </motion.div>
  )
}

// ── SimQrBox: placeholder statis untuk mode simulasi (backend offline) ─────────

function SimQrBox({ size }) {
  return (
    <motion.div
      className="p-5 rounded-3xl shadow-2xl relative overflow-hidden"
      style={{ background: 'white', width: size, height: size }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
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
      {['top-5 left-5', 'top-5 right-5', 'bottom-5 left-5'].map(pos => (
        <div key={pos} className={`absolute ${pos} w-10 h-10 rounded-sm border-4`}
          style={{ borderColor: '#111' }}>
          <div className="w-4 h-4 m-auto mt-1 rounded-[2px]" style={{ background: '#111' }} />
        </div>
      ))}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <p className="text-[10px] font-bold tracking-widest" style={{ color: '#555' }}>SIMULASI</p>
        <p className="text-xs font-black" style={{ color: '#0d0d0f' }}>QRIS</p>
      </div>
    </motion.div>
  )
}

// ── PaymentScreen ─────────────────────────────────────────────────────────────
// phase: 'loading'   — memanggil /api/generate-qris
//        'ready'     — QR nyata tampil, polling /api/check-status/:orderId
//        'sim-ready' — backend offline, countdown simulasi
//        'success'   — pembayaran dikonfirmasi

export default function PaymentScreen({ totalPhotos, onSuccess }) {
  const [phase,      setPhase]      = useState('loading')
  const [orderId,    setOrderId]    = useState(null)
  const [qrCodeUrl,  setQrCodeUrl]  = useState(null)
  const [price,      setPrice]      = useState(PRICE_TABLE[totalPhotos] ?? 25000)
  const [simSeconds, setSimSeconds] = useState(SIM_SUCCESS_SECS)

  // ── 1. Generate QRIS saat mount ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    fetch('/api/generate-qris', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalPhotos }),
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => {
        if (cancelled) return
        setOrderId(data.orderId)
        setQrCodeUrl(data.qrCodeUrl)
        setPrice(data.price)
        setPhase('ready')
      })
      .catch(() => { if (!cancelled) setPhase('sim-ready') })
    return () => { cancelled = true }
  }, [totalPhotos])

  // ── 2. Polling status pembayaran (cleanup mencegah memory leak) ────────────
  useEffect(() => {
    if (phase !== 'ready' || !orderId) return
    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      try {
        const r    = await fetch(`/api/check-status/${orderId}`)
        const data = await r.json()
        if (!cancelled && data.status === 'success') { setPhase('success'); return }
      } catch { /* retry senyap */ }
      if (!cancelled) setTimeout(poll, POLL_INTERVAL_MS)
    }

    const t = setTimeout(poll, POLL_INTERVAL_MS)
    return () => { cancelled = true; clearTimeout(t) }
  }, [phase, orderId])

  // ── 3. Countdown simulasi (fallback jika backend offline) ─────────────────
  useEffect(() => {
    if (phase !== 'sim-ready') return
    const id = setInterval(() => {
      setSimSeconds(s => {
        if (s <= 1) { setPhase('success'); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  // ── 4. Pindah ke CaptureScreen setelah animasi sukses ─────────────────────
  useEffect(() => {
    if (phase !== 'success') return
    const t = setTimeout(() => onSuccess(orderId), 1800)
    return () => clearTimeout(t)
  }, [phase, onSuccess])

  const displayPrice = formatRupiah(price)
  const qrSize       = 'min(256px, 62vw)'

  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center"
      style={{ background: '#0d0d0f' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <AnimatePresence mode="wait">

        {/* ── Loading ── */}
        {phase === 'loading' && (
          <motion.div key="loading" className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <motion.div
              className="w-12 h-12 rounded-full border-4 border-white/10 border-t-[#c9a96e]"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            />
            <p className="text-white/40 text-sm tracking-[0.25em]">MENYIAPKAN QRIS…</p>
          </motion.div>
        )}

        {/* ── Ready: QRIS nyata dari Midtrans ── */}
        {phase === 'ready' && (
          <motion.div key="ready" className="flex flex-col items-center gap-5"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}>
            <div className="flex flex-col items-center gap-1">
              <p className="text-white/40 text-xs tracking-[0.25em]">SCAN UNTUK MEMBAYAR</p>
              <p className="text-[#c9a96e] text-3xl font-bold">{displayPrice}</p>
            </div>
            <QrBox url={qrCodeUrl} size={qrSize} />
            <div className="flex items-center gap-2">
              <motion.div className="w-2 h-2 rounded-full bg-[#c9a96e]"
                animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
              <span className="text-white/40 text-xs">Menunggu konfirmasi pembayaran…</span>
            </div>
          </motion.div>
        )}

        {/* ── Sim-Ready: simulasi (backend offline / tanpa Midtrans) ── */}
        {phase === 'sim-ready' && (
          <motion.div key="sim-ready" className="flex flex-col items-center gap-5"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}>
            <div className="flex flex-col items-center gap-1">
              <p className="text-white/40 text-xs tracking-[0.25em]">SCAN UNTUK MEMBAYAR</p>
              <p className="text-[#c9a96e] text-3xl font-bold">{displayPrice}</p>
            </div>
            <SimQrBox size={qrSize} />
            <div className="flex items-center gap-2">
              <motion.div className="w-2 h-2 rounded-full bg-[#c9a96e]"
                animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
              <span className="text-white/40 text-xs">Menunggu konfirmasi pembayaran…</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-white/20 text-xs tracking-widest">SIMULASI SUKSES DALAM</p>
              <p className="font-mono text-2xl font-bold tabular-nums"
                style={{ color: simSeconds <= 3 ? '#c9a96e' : 'rgba(255,255,255,0.5)' }}>
                {String(simSeconds).padStart(2, '0')}
              </p>
            </div>
            <p className="text-white/15 text-xs">Mode Simulasi — tidak ada transaksi nyata</p>
          </motion.div>
        )}

        {/* ── Success ── */}
        {phase === 'success' && (
          <motion.div key="success" className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}>
            <motion.div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(201,169,110,0.15)', border: '2px solid #c9a96e' }}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}>
              <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
                <motion.path d="M8 20 L17 29 L32 12" stroke="#c9a96e" strokeWidth="3"
                  strokeLinecap="round" strokeLinejoin="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }} />
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
