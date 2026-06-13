require('dotenv').config()
const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')
const os = require('os')
const si = require('systeminformation')
const midtransClient = require('midtrans-client')
const { sendPhotoEmail } = require('./mailer')
const { printPhoto } = require('./printer')
const { compositePhoto } = require('./composer')

const app = express()
const PORT = process.env.PORT || 3001
const OUTPUTS_DIR   = path.resolve(__dirname, 'outputs')
const TEMPLATES_DIR = path.resolve(__dirname, 'templates')
const SERVER_START  = Date.now()

if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true })

// In-memory stores
const transactions     = new Map() // orderId → { status }
const transactionLog   = []        // persistent log untuk dashboard
const dashboardSessions = new Map() // token → expiry (ms)

const midtrans = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
})

const PRICE_TABLE   = { 2: 20000, 4: 30000 }
const TTL_MS        = 30 * 60 * 1000

// Require a strong DASHBOARD_PIN — refuse to start without it
const DASHBOARD_PIN = process.env.DASHBOARD_PIN
if (!DASHBOARD_PIN || DASHBOARD_PIN.length < 6) {
  console.error('[FATAL] DASHBOARD_PIN belum diset atau terlalu pendek (minimal 6 karakter).')
  console.error('[FATAL] Tambahkan DASHBOARD_PIN=<pin-kuat-anda> ke file .env dan restart server.')
  process.exit(1)
}

// In-memory rate limiter untuk /api/dashboard/auth
// 5 percobaan gagal → kunci 15 menit per IP
const AUTH_MAX_ATTEMPTS = 5
const AUTH_LOCKOUT_MS   = 15 * 60 * 1000
const authAttempts      = new Map() // ip → { count, resetAt }

function checkAuthRateLimit(ip) {
  const now   = Date.now()
  const entry = authAttempts.get(ip)
  if (entry && entry.resetAt > now && entry.count >= AUTH_MAX_ATTEMPTS) return false
  if (!entry || entry.resetAt <= now) {
    authAttempts.set(ip, { count: 1, resetAt: now + AUTH_LOCKOUT_MS })
  } else {
    entry.count++
  }
  return true
}

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '80mb' }))
app.use('/outputs',   express.static(OUTPUTS_DIR))
app.use('/templates', express.static(TEMPLATES_DIR))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveOutputFile(filename) {
  if (!filename || !/^[\w-]+\.(jpg|jpeg|png)$/i.test(filename)) {
    const err = new Error('Nama file tidak valid'); err.status = 400; throw err
  }
  const fullPath = path.join(OUTPUTS_DIR, filename)
  if (!fullPath.startsWith(OUTPUTS_DIR + path.sep)) {
    const err = new Error('Akses path tidak diizinkan'); err.status = 403; throw err
  }
  if (!fs.existsSync(fullPath)) {
    const err = new Error('File tidak ditemukan'); err.status = 404; throw err
  }
  return fullPath
}

function asyncHandler(fn) {
  return (req, res, next) => fn(req, res).catch(next)
}

function requireDashboardAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const expiry = token && dashboardSessions.get(token)
  if (!expiry || expiry < Date.now()) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

function isToday(ts) {
  const now = new Date(), d = new Date(ts)
  return d.getFullYear() === now.getFullYear()
    && d.getMonth()    === now.getMonth()
    && d.getDate()     === now.getDate()
}

// ---------------------------------------------------------------------------
// Routes — Kiosk
// ---------------------------------------------------------------------------

app.post('/api/process-image', asyncHandler(async (req, res) => {
  const { photos, template, orderId } = req.body
  if (!Array.isArray(photos) || photos.length === 0)
    return res.status(400).json({ error: 'Array photos wajib diisi' })
  const outputPath = await compositePhoto(photos, template || null, OUTPUTS_DIR, orderId || null)
  res.json({ url: `/outputs/${path.basename(outputPath)}`, filename: path.basename(outputPath) })
}))

app.post('/api/send-email', asyncHandler(async (req, res) => {
  const { email, filename } = req.body
  if (!email) return res.status(400).json({ error: 'Email wajib diisi' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Format email tidak valid' })
  await sendPhotoEmail(email, resolveOutputFile(filename))
  res.json({ ok: true })
}))

app.post('/api/print', asyncHandler(async (req, res) => {
  await printPhoto(resolveOutputFile(req.body.filename))
  res.json({ ok: true })
}))

app.post('/api/generate-qris', asyncHandler(async (req, res) => {
  const totalPhotos = Number(req.body.totalPhotos)
  const price = PRICE_TABLE[totalPhotos]
  if (!price) return res.status(400).json({ error: 'Jumlah foto tidak valid' })

  const orderId = `SR-${Date.now()}`

  const chargeResponse = await midtrans.charge({
    payment_type: 'gopay',
    transaction_details: { order_id: orderId, gross_amount: price },
    gopay: { enable_callback: false },
    item_details: [{ id: `PHOTO-${totalPhotos}`, price, quantity: 1, name: `SatuRuang ${totalPhotos} Foto` }],
  })

  const qrAction = chargeResponse.actions?.find(a => a.name === 'generate-qr-code')
  if (!qrAction?.url)
    return res.status(502).json({ error: 'Gagal mendapatkan URL QRIS dari Midtrans' })

  transactions.set(orderId, { status: 'pending' })
  setTimeout(() => transactions.delete(orderId), TTL_MS)

  // Catat ke log dashboard
  transactionLog.push({ orderId, timestamp: new Date(), totalPhotos, price, status: 'pending' })

  res.json({ orderId, qrCodeUrl: qrAction.url, price })
}))

app.post('/api/payment-webhook', asyncHandler(async (req, res) => {
  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = req.body

  const expected = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
    .digest('hex')
  if (expected !== signature_key)
    return res.status(403).json({ error: 'Signature tidak valid' })

  const settled = transaction_status === 'settlement'
    || (transaction_status === 'capture' && fraud_status === 'accept')

  if (settled) {
    if (transactions.has(order_id)) transactions.get(order_id).status = 'success'
    const logEntry = transactionLog.findLast(t => t.orderId === order_id)
    if (logEntry) logEntry.status = 'success'
  }

  res.json({ ok: true })
}))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/api/templates', (_req, res) => {
  if (!fs.existsSync(TEMPLATES_DIR)) return res.json([])
  const files = fs.readdirSync(TEMPLATES_DIR).filter(f => /\.png$/i.test(f))
  res.json(files.map(f => ({
    id:   f.replace(/\.png$/i, ''),
    name: f.replace(/\.png$/i, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    url:  `/templates/${f}`,
  })))
})

app.get('/api/check-status/:orderId', (req, res) => {
  const { orderId } = req.params
  if (!/^SR-\d+$/.test(orderId))
    return res.status(400).json({ error: 'Order ID tidak valid' })
  const tx = transactions.get(orderId)
  res.json({ status: tx ? tx.status : 'not_found' })
})

// ---------------------------------------------------------------------------
// Routes — Dashboard
// ---------------------------------------------------------------------------

app.post('/api/dashboard/auth', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'

  if (!checkAuthRateLimit(ip)) {
    return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' })
  }

  const { pin } = req.body
  const valid = typeof pin === 'string'
    && pin.length === DASHBOARD_PIN.length
    && crypto.timingSafeEqual(Buffer.from(pin), Buffer.from(DASHBOARD_PIN))

  if (!valid) {
    console.warn(`[dashboard/auth] Percobaan PIN gagal dari ${ip}`)
    return res.status(401).json({ error: 'PIN salah' })
  }

  // Reset rate limit on successful login
  authAttempts.delete(ip)

  const token = crypto.randomBytes(32).toString('hex')
  dashboardSessions.set(token, Date.now() + 8 * 60 * 60 * 1000) // 8 jam
  res.json({ token })
})

app.get('/api/dashboard/stats', requireDashboardAuth, asyncHandler(async (_req, res) => {
  // System
  const mem = process.memoryUsage()
  let cpuTemp = null
  try { const t = await si.cpuTemperature(); cpuTemp = t.main ?? null } catch {}

  const outputFiles = fs.existsSync(OUTPUTS_DIR)
    ? fs.readdirSync(OUTPUTS_DIR).filter(f => /\.(jpg|jpeg|png)$/i.test(f)).length
    : 0

  // Today
  const todayLogs    = transactionLog.filter(t => isToday(t.timestamp))
  const successLogs  = todayLogs.filter(t => t.status === 'success')
  const pendingLogs  = todayLogs.filter(t => t.status === 'pending')

  res.json({
    system: {
      uptime:      Math.floor(process.uptime()),
      memUsed:     mem.heapUsed,
      memTotal:    os.totalmem(),
      memFree:     os.freemem(),
      cpuTemp,
      cpuModel:    os.cpus()[0]?.model?.split('@')[0]?.trim() || 'N/A',
      platform:    os.platform(),
      hostname:    os.hostname(),
      nodeVersion: process.version,
      outputFiles,
      serverStarted: SERVER_START,
    },
    today: {
      label:    new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' }),
      revenue:  successLogs.reduce((s, t) => s + t.price, 0),
      sessions: successLogs.length,
      pending:  pendingLogs.length,
      byPackage: {
        2: successLogs.filter(t => t.totalPhotos === 2).length,
        4: successLogs.filter(t => t.totalPhotos === 4).length,
      },
    },
    recent: [...transactionLog].reverse().slice(0, 30),
  })
}))

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error(`[${req.path}]`, err.message)
  res.status(err.status || 500).json({ error: err.message })
})

app.listen(PORT, () => console.log(`SatuRuang backend → http://localhost:${PORT}`))
