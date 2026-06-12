import { useState } from 'react'
import { motion } from 'framer-motion'

const PHOTO_OPTIONS = [
  { value: 2, label: '2 Foto', desc: 'Strip Pendek', price: 'Rp 15.000' },
  { value: 4, label: '4 Foto', desc: 'Strip Klasik', price: 'Rp 25.000', popular: true },
  { value: 8, label: '8 Foto', desc: 'Edisi Lengkap', price: 'Rp 40.000' },
]

const TEMPLATES = [
  { id: 'minimal', label: 'Minimal', desc: 'Bersih & simpel',  bg: '#ffffff', labelBg: '#ebebeb', labelColor: '#aaa',    photoSlot: '#cccccc' },
  { id: 'gold',    label: 'Gold',    desc: 'Mewah & hangat',   bg: '#0d0b08', labelBg: '#c9a96e', labelColor: '#0d0b08', photoSlot: '#2a2418', popular: true },
  { id: 'pink',    label: 'Blush',   desc: 'Lembut & manis',   bg: '#fff0f3', labelBg: '#e8a0a0', labelColor: '#fff',    photoSlot: '#ddc8cc' },
  { id: 'film',    label: 'Film',    desc: 'Retro sinematik',  bg: '#111009', labelBg: '#2a2218', labelColor: '#8a8060', photoSlot: '#1e1a10' },
]

// Mini photostrip preview — shows actual layout with template colours
function StripPreview({ tmpl, photoCount, selected }) {
  const cols = photoCount === 2 ? 1 : 2
  const rows = photoCount === 8 ? 4 : 2
  const slots = Array.from({ length: photoCount })

  return (
    <div
      className="relative flex flex-col rounded-xl overflow-hidden transition-all duration-200"
      style={{
        width: 72,
        height: 108,
        background: tmpl.bg,
        boxShadow: selected
          ? `0 0 0 2px #c9a96e, 0 4px 20px rgba(201,169,110,0.35)`
          : '0 2px 8px rgba(0,0,0,0.35)',
      }}
    >
      {/* Photo slots */}
      <div
        className="flex-1 p-[5px]"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: 2,
        }}
      >
        {slots.map((_, i) => (
          <div key={i} className="rounded-[2px]" style={{ background: tmpl.photoSlot }} />
        ))}
      </div>

      {/* Label strip */}
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ height: 14, background: tmpl.labelBg }}
      >
        <span style={{ fontSize: 4.5, letterSpacing: 1, color: tmpl.labelColor, fontWeight: 700 }}>
          SATU RUANG
        </span>
      </div>
    </div>
  )
}

export default function ConfigScreen({ onDone }) {
  const [photos, setPhotos] = useState(4)
  const [template, setTemplate] = useState('minimal')

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
  }

  return (
    <motion.div
      className="w-screen h-screen flex flex-col items-center justify-center px-8 gap-10 overflow-hidden"
      style={{ background: '#0d0d0f' }}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h2
        className="font-bold tracking-tight text-white"
        style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Pilih Paketmu
      </motion.h2>

      {/* Photo count cards */}
      <motion.div
        className="flex gap-4 flex-wrap justify-center"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {PHOTO_OPTIONS.map((opt) => (
          <motion.button
            key={opt.value}
            variants={itemVariants}
            onClick={() => setPhotos(opt.value)}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.04 }}
            className="relative flex flex-col items-center gap-1 px-8 py-6 rounded-2xl border-2 transition-colors"
            style={{
              background: photos === opt.value ? 'rgba(201,169,110,0.12)' : '#1a1a1f',
              borderColor: photos === opt.value ? '#c9a96e' : '#2e2e36',
              minWidth: 140,
            }}
          >
            {opt.popular && (
              <span
                className="absolute -top-3 text-xs px-3 py-1 rounded-full font-semibold tracking-wider"
                style={{ background: '#c9a96e', color: '#0d0d0f' }}
              >
                POPULER
              </span>
            )}
            <span
              className="text-4xl font-black"
              style={{ color: photos === opt.value ? '#c9a96e' : 'white' }}
            >
              {opt.value}
            </span>
            <span className="text-white font-semibold">{opt.label}</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {opt.desc}
            </span>
            <span
              className="text-sm font-bold mt-1"
              style={{ color: photos === opt.value ? '#c9a96e' : 'rgba(255,255,255,0.5)' }}
            >
              {opt.price}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Template selector */}
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-sm tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
          PILIH BINGKAI
        </p>
        <div className="flex gap-5">
          {TEMPLATES.map((t) => (
            <motion.button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              whileTap={{ scale: 0.93 }}
              whileHover={{ scale: 1.06 }}
              className="flex flex-col items-center gap-2 relative"
            >
              {t.popular && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider whitespace-nowrap z-10"
                  style={{ background: '#c9a96e', color: '#0d0d0f' }}
                >
                  POPULER
                </span>
              )}
              <StripPreview tmpl={t} photoCount={photos} selected={template === t.id} />
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className="text-xs font-semibold"
                  style={{ color: template === t.id ? '#c9a96e' : 'rgba(255,255,255,0.7)' }}
                >
                  {t.label}
                </span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {t.desc}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Next button */}
      <motion.button
        onClick={() => onDone({ photos, template })}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        className="px-16 py-4 rounded-2xl font-bold tracking-widest uppercase text-sm"
        style={{
          background: 'linear-gradient(135deg, #c9a96e 0%, #d4b87a 100%)',
          color: '#0d0d0f',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Lanjut ke Pembayaran →
      </motion.button>
    </motion.div>
  )
}
