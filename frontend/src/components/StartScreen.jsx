import { motion } from 'framer-motion'

export default function StartScreen({ onStart }) {
  return (
    <motion.div
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0d0d0f' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.5 }}
    >
      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 'min(600px, 90vw)',
          height: 'min(600px, 90vw)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,169,110,0.12) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#c9a96e 1px, transparent 1px), linear-gradient(90deg, #c9a96e 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        className="flex flex-col items-center gap-6 z-10"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo mark */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-2"
          style={{
            background: 'linear-gradient(135deg, #c9a96e 0%, #f0d9a8 100%)',
            boxShadow: '0 0 40px rgba(201,169,110,0.35)',
          }}
        >
          <span className="text-[#0d0d0f] text-3xl font-black tracking-tighter">SR</span>
        </div>

        <h1
          className="font-black tracking-tight"
          style={{ fontSize: 'clamp(56px, 9vw, 100px)', color: 'white', lineHeight: 1 }}
        >
          SatuRuang
        </h1>

        <p
          className="text-center max-w-md leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.45)', fontSize: 'clamp(14px, 1.5vw, 18px)' }}
        >
          Kunci tawamu di satu ruang,<br />bawa pulang dalam satu lembar.
        </p>

        {/* CTA button with pulse */}
        <motion.button
          onClick={onStart}
          className="mt-6 px-10 sm:px-14 py-4 sm:py-5 rounded-2xl font-bold tracking-widest uppercase text-sm relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #c9a96e 0%, #d4b87a 100%)',
            color: '#0d0d0f',
            boxShadow: '0 0 0 0 rgba(201,169,110,0.5)',
          }}
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(201,169,110,0.5)',
              '0 0 0 18px rgba(201,169,110,0)',
              '0 0 0 0 rgba(201,169,110,0)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.03 }}
        >
          Sentuh untuk Memulai
        </motion.button>
      </motion.div>

      {/* Bottom tagline */}
      <motion.p
        className="absolute bottom-8 text-xs tracking-[0.25em]"
        style={{ color: 'rgba(255,255,255,0.2)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        PHOTOBOX SELF-SERVICE
      </motion.p>
    </motion.div>
  )
}
