require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const { sendPhotoEmail } = require('./mailer')
const { printPhoto } = require('./printer')
const { compositePhoto } = require('./composer')

const app = express()
const PORT = process.env.PORT || 3001
const OUTPUTS_DIR = path.resolve(__dirname, 'outputs')

if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true })

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '80mb' }))
app.use('/outputs', express.static(OUTPUTS_DIR))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Returns the absolute path to a file in outputs/ after validating that:
//   1. The filename matches a safe pattern (no path traversal chars)
//   2. The resolved path actually lives inside OUTPUTS_DIR
//   3. The file exists on disk
function resolveOutputFile(filename) {
  if (!filename || !/^[\w-]+\.(jpg|jpeg|png)$/i.test(filename)) {
    const err = new Error('Nama file tidak valid')
    err.status = 400
    throw err
  }
  const fullPath = path.join(OUTPUTS_DIR, filename)
  // Extra guard: join can still produce a path inside the dir, but verify explicitly
  if (!fullPath.startsWith(OUTPUTS_DIR + path.sep)) {
    const err = new Error('Akses path tidak diizinkan')
    err.status = 403
    throw err
  }
  if (!fs.existsSync(fullPath)) {
    const err = new Error('File tidak ditemukan')
    err.status = 404
    throw err
  }
  return fullPath
}

function asyncHandler(fn) {
  return (req, res, next) => fn(req, res).catch(next)
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// POST /api/process-image
// Body  : { photos: string[] (base64 dataURLs), template: string | null }
// Return: { url: string, filename: string }
app.post('/api/process-image', asyncHandler(async (req, res) => {
  const { photos, template } = req.body
  if (!Array.isArray(photos) || photos.length === 0) {
    return res.status(400).json({ error: 'Array photos wajib diisi' })
  }
  const outputPath = await compositePhoto(photos, template || null, OUTPUTS_DIR)
  const filename = path.basename(outputPath)
  res.json({ url: `/outputs/${filename}`, filename })
}))

// POST /api/send-email
// Body  : { email: string, filename: string }
// Return: { ok: true }
app.post('/api/send-email', asyncHandler(async (req, res) => {
  const { email, filename } = req.body
  if (!email) return res.status(400).json({ error: 'Email wajib diisi' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Format email tidak valid' })
  }
  const filePath = resolveOutputFile(filename)
  await sendPhotoEmail(email, filePath)
  res.json({ ok: true })
}))

// POST /api/print
// Body  : { filename: string }
// Return: { ok: true }
app.post('/api/print', asyncHandler(async (req, res) => {
  const { filename } = req.body
  const filePath = resolveOutputFile(filename)
  await printPhoto(filePath)
  res.json({ ok: true })
}))

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status = err.status || 500
  console.error(`[${req.path}]`, err.message)
  res.status(status).json({ error: err.message })
})

app.listen(PORT, () => {
  console.log(`SatuRuang backend → http://localhost:${PORT}`)
})
