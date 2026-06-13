import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const formatRp    = n  => `Rp ${Number(n).toLocaleString('id-ID')}`
const formatMB    = b  => `${Math.round(b / 1024 / 1024)} MB`
const formatUptime = s => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}j ${m}m` : `${m}m ${Math.floor(s % 60)}d`
}
const fmtTime = ts => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
const statusColor = s => s === 'success' ? '#4ade80' : s === 'pending' ? '#facc15' : '#f87171'
const statusLabel = s => s === 'success' ? 'Lunas' : s === 'pending' ? 'Menunggu' : 'Gagal'

// ── Metric card ───────────────────────────────────────────────────────────────

function Card({ title, value, sub, accent, children }) {
  return (
    <div style={{
      background: '#18181c', borderRadius: 16, padding: '20px 20px 18px',
      border: '1px solid #2a2a32', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.18em', margin: 0 }}>{title}</p>
      {children ?? (
        <>
          <p style={{ color: accent || 'white', fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>{sub}</p>}
        </>
      )}
    </div>
  )
}

// ── StatusDot ─────────────────────────────────────────────────────────────────

function StatusDot({ ok, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <motion.div style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? '#4ade80' : '#f87171', flexShrink: 0 }}
        animate={ok ? { opacity: [1, 0.4, 1] } : {}} transition={{ repeat: Infinity, duration: 2 }} />
      <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{label}</span>
    </div>
  )
}

// ── TempBar ───────────────────────────────────────────────────────────────────

function TempBar({ temp }) {
  const pct   = Math.min(100, Math.max(0, ((temp - 30) / 70) * 100))
  const color = temp > 85 ? '#f87171' : temp > 65 ? '#facc15' : '#4ade80'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.15em' }}>SUHU CPU</span>
        <span style={{ color, fontSize: 13, fontWeight: 700 }}>{temp !== null ? `${temp}°C` : 'N/A'}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <motion.div style={{ height: '100%', borderRadius: 3, background: color, width: `${pct}%` }}
          animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
      </div>
    </div>
  )
}

// ── MemBar ────────────────────────────────────────────────────────────────────

function MemBar({ used, total }) {
  const pct   = Math.round((used / total) * 100)
  const color = pct > 85 ? '#f87171' : pct > 65 ? '#facc15' : '#4ade80'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.15em' }}>MEMORI SISTEM</span>
        <span style={{ color, fontSize: 13, fontWeight: 700 }}>{pct}% ({formatMB(used)} / {formatMB(total)})</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <motion.div style={{ height: '100%', borderRadius: 3, background: color, width: `${pct}%` }}
          animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
      </div>
    </div>
  )
}

// ── DashboardScreen ───────────────────────────────────────────────────────────

export default function DashboardScreen({ token, onLogout }) {
  const [stats,       setStats]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [error,       setError]       = useState(null)

  const fetchStats = async () => {
    try {
      const r = await fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } })
      if (r.status === 401) { onLogout(); return }
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setStats(await r.json())
      setLastUpdated(new Date())
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    fetchStats()
    const id = setInterval(fetchStats, 10000)
    return () => clearInterval(id)
  }, [])

  const sys = stats?.system
  const tod = stats?.today

  return (
    <div style={{ minHeight: '100dvh', background: '#0d0d0f', color: 'white', fontFamily: 'inherit' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(13,13,15,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #1e1e28',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg,#c9a96e,#d4b87a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#0d0d0f', fontWeight: 900, fontSize: 11 }}>SR</span>
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Dashboard Owner</p>
            <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
              SatuRuang Photobox
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastUpdated && (
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
              Diperbarui {fmtTime(lastUpdated)}
            </p>
          )}
          <motion.button onClick={onLogout} whileTap={{ scale: 0.94 }}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '6px 14px',
              fontSize: 12, cursor: 'pointer', fontWeight: 600,
            }}>
            Keluar
          </motion.button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 48px' }}>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: '10px 16px', marginBottom: 20 }}>
              <p style={{ color: '#f87171', fontSize: 12, margin: 0 }}>Gagal memuat data: {error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date */}
        {tod && (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, letterSpacing: '0.1em', marginBottom: 20, marginTop: 0 }}>
            {tod.label.toUpperCase()}
          </p>
        )}

        {/* ── Revenue & sessions ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
          <Card title="PENDAPATAN HARI INI" value={tod ? formatRp(tod.revenue) : '—'} accent="#c9a96e" />
          <Card title="SESI BERHASIL" value={tod?.sessions ?? '—'} sub="transaksi lunas hari ini" accent="white" />
          <Card title="STRIP PENDEK (2F)" value={tod?.byPackage[2] ?? '—'} sub="Rp 20.000 / sesi" />
          <Card title="STRIP KLASIK (4F)" value={tod?.byPackage[4] ?? '—'} sub="Rp 30.000 / sesi" />
        </div>

        {/* ── System status ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 20 }}>

          {/* Koneksi & layanan */}
          <Card title="STATUS LAYANAN">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <StatusDot ok={!!sys} label={sys ? `Server online (${sys.hostname})` : 'Server tidak terjangkau'} />
              <StatusDot ok={!!sys} label={sys ? `Node.js ${sys.nodeVersion}` : 'Backend offline'} />
              <StatusDot ok={tod !== undefined} label={`${tod?.pending ?? 0} transaksi pending`} />
            </div>
          </Card>

          {/* Resource */}
          <Card title="RESOURCE SISTEM">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
              {sys && <MemBar used={sys.memTotal - sys.memFree} total={sys.memTotal} />}
              {sys && <TempBar temp={sys.cpuTemp} />}
              {!sys && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: 0 }}>Memuat…</p>}
            </div>
          </Card>

          {/* Info mesin */}
          <Card title="INFO MESIN">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {[
                ['CPU',       sys?.cpuModel ?? '—'],
                ['Platform',  sys ? `${sys.platform} / ${sys.hostname}` : '—'],
                ['Uptime',    sys ? formatUptime(sys.uptime) : '—'],
                ['File output', sys ? `${sys.outputFiles} gambar` : '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{k}</span>
                  <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Recent transactions ─────────────────────────────────────────── */}
        <div style={{ background: '#18181c', borderRadius: 16, border: '1px solid #2a2a32', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a32', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Transaksi Terbaru</p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
              {stats?.recent?.length ?? 0} entri
            </p>
          </div>

          {(!stats?.recent || stats.recent.length === 0) ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, margin: 0 }}>Belum ada transaksi</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a2a32' }}>
                    {['Order ID', 'Waktu', 'Paket', 'Harga', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.3)', fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '0.08em', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((t, i) => (
                    <tr key={t.orderId + i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{t.orderId}</td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>{fmtTime(t.timestamp)}</td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                        {t.totalPhotos === 2 ? 'Strip Pendek' : 'Strip Klasik'} ({t.totalPhotos}F)
                      </td>
                      <td style={{ padding: '12px 16px', color: '#c9a96e', fontWeight: 600 }}>{formatRp(t.price)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                          background: `${statusColor(t.status)}18`,
                          border: `1px solid ${statusColor(t.status)}40`,
                          color: statusColor(t.status), fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                        }}>
                          {statusLabel(t.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.12)', fontSize: 10, textAlign: 'center', marginTop: 24, letterSpacing: '0.1em' }}>
          Auto-refresh setiap 10 detik · SatuRuang Photobox Dashboard
        </p>
      </div>
    </div>
  )
}
