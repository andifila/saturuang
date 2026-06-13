import { useState } from 'react'
import { motion } from 'framer-motion'

const PHOTO_OPTIONS = [
  { value: 2, label: '2 Foto', desc: 'Strip Pendek', price: 'Rp 20.000' },
  { value: 4, label: '4 Foto', desc: 'Strip Klasik', price: 'Rp 30.000', popular: true },
]

export default function ConfigScreen({ onDone }) {
  const [photos, setPhotos] = useState(null)

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
      className="w-full h-full flex flex-col items-center justify-center px-6 sm:px-8 gap-8 sm:gap-10 overflow-hidden"
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
        className="flex gap-4 lg:gap-8 flex-wrap justify-center"
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
            className="relative flex flex-col items-center gap-1 lg:gap-2 px-8 lg:px-12 py-6 lg:py-9 rounded-2xl border-2 transition-colors"
            style={{
              background: photos === opt.value ? 'rgba(201,169,110,0.12)' : '#1a1a1f',
              borderColor: photos === opt.value ? '#c9a96e' : '#2e2e36',
              minWidth: 'clamp(140px, 22vw, 280px)',
            }}
          >
            {opt.popular && (
              <span
                className="absolute -top-3 text-xs lg:text-sm px-3 py-1 rounded-full font-semibold tracking-wider"
                style={{ background: '#c9a96e', color: '#0d0d0f' }}
              >
                POPULER
              </span>
            )}
            <span
              className="text-4xl lg:text-6xl font-black"
              style={{ color: photos === opt.value ? '#c9a96e' : 'white' }}
            >
              {opt.value}
            </span>
            <span className="text-white font-semibold lg:text-lg">{opt.label}</span>
            <span className="text-xs lg:text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {opt.desc}
            </span>
            <span
              className="text-sm lg:text-base font-bold mt-1"
              style={{ color: photos === opt.value ? '#c9a96e' : 'rgba(255,255,255,0.5)' }}
            >
              {opt.price}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Next button */}
      <motion.button
        onClick={() => photos && onDone({ photos })}
        whileTap={photos ? { scale: 0.96 } : {}}
        whileHover={photos ? { scale: 1.02 } : {}}
        className="w-full max-w-xs lg:max-w-sm px-8 py-4 lg:py-6 rounded-2xl font-bold tracking-widest uppercase text-sm lg:text-base"
        style={{
          background: photos
            ? 'linear-gradient(135deg, #c9a96e 0%, #d4b87a 100%)'
            : 'rgba(201,169,110,0.15)',
          color:   photos ? '#0d0d0f' : 'rgba(201,169,110,0.4)',
          cursor:  photos ? 'pointer' : 'default',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {photos ? 'Lanjut ke Pembayaran →' : 'Pilih paket dahulu'}
      </motion.button>
    </motion.div>
  )
}
