const sharp   = require('sharp')
const path    = require('path')
const fs      = require('fs')
const QRCode  = require('qrcode')

// ── Canvas ───────────────────────────────────────────────────────────────────
// Full output: 1200×1800 (two 600px strips side by side)
const PRINT_W  = 1200
const PRINT_H  = 1800
const STRIP_W  = 600   // width of one template strip

const TEMPLATES_DIR = path.join(__dirname, 'templates')
const LOCATION      = process.env.PHOTO_LOCATION || 'Malang'

// ── Strip layout specs (derived from strip_pendek.svg) ───────────────────────
// Both strips share the same Y coordinates; right strip is offset by STRIP_W.
const STRIPS = {
  2: {
    photoW:    504,
    photoH:    600,
    photos:    [{ y: 48 }, { y: 696 }],   // positions within one 600px strip
    qr:        { xInStrip: 210, y: 1456, size: 180 },
    dateY:     1660,
    template:  'strip_pendek.png',
  },
  4: {
    // Strip Klasik — update these once strip_klasik.png is designed
    photoW:    504,
    photoH:    360,
    photos:    [{ y: 40 }, { y: 412 }, { y: 784 }, { y: 1156 }],
    qr:        { xInStrip: 210, y: 1588, size: 160 },
    dateY:     1766,
    template:  'strip_klasik.png',
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function base64ToBuffer(dataUrl) {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64, 'base64')
}

function formatDate(date) {
  const formatted = date.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  return `${LOCATION}, ${formatted}`
}

// SVG text buffer — single line, centered, serif, white with opacity
function makeDateSvgBuffer(text) {
  const W = STRIP_W, H = 36
  const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
    `<text x="${W / 2}" y="${H * 0.72}" ` +
    `text-anchor="middle" ` +
    `font-family="Georgia, 'Times New Roman', serif" ` +
    `font-size="13" letter-spacing="1.5" ` +
    `fill="rgba(255,255,255,0.55)">${safe}</text>` +
    `</svg>`
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function compositePhoto(photos, templateId, outputDir, orderId) {
  const count = Math.min(photos.length, 4)
  if (count !== 2 && count !== 4) {
    throw Object.assign(new Error('Hanya mendukung 2 atau 4 foto'), { status: 400 })
  }

  const spec = STRIPS[count]

  // ── 1. Resize photos ──────────────────────────────────────────────────────
  const resizedPhotos = await Promise.all(
    photos.slice(0, count).map((photo) =>
      sharp(base64ToBuffer(photo))
        .resize(spec.photoW, spec.photoH, { fit: 'cover', position: 'attention' })
        .toBuffer()
    )
  )

  // ── 2. QR Code (dynamic — links to softcopy download) ────────────────────
  const baseUrl    = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
  const downloadId = orderId || `local_${Date.now()}`
  const qrUrl      = `${baseUrl}/download/${downloadId}`
  const qrBuffer   = await QRCode.toBuffer(qrUrl, {
    width:  spec.qr.size,
    margin: 2,
    color:  { dark: '#0d0d0f', light: '#ffffff' },
  })

  // ── 3. Date/location SVG ──────────────────────────────────────────────────
  const dateSvgBuffer = makeDateSvgBuffer(formatDate(new Date()))

  // ── 4. Build composite layers ─────────────────────────────────────────────
  const layers = []

  // 4a. Grid foto — kiri dan kanan simetris
  for (let i = 0; i < count; i++) {
    const { y } = spec.photos[i]
    const xLeft  = (STRIP_W - spec.photoW) / 2              // centered in left strip  → 48
    const xRight = STRIP_W + (STRIP_W - spec.photoW) / 2    // centered in right strip → 648
    layers.push({ input: resizedPhotos[i], left: xLeft,  top: y })
    layers.push({ input: resizedPhotos[i], left: xRight, top: y })
  }

  // 4b. Template PNG transparan — gunakan pilihan user, fallback ke default per jenis strip
  const templateFile = templateId ? `${templateId}.png` : spec.template
  const templatePath = path.join(TEMPLATES_DIR, templateFile)
  if (fs.existsSync(templatePath)) {
    layers.push({ input: templatePath, left: 0,       top: 0 })
    layers.push({ input: templatePath, left: STRIP_W, top: 0 })
  }

  // 4c. Teks tanggal dinamis — di atas area QR, simetris kiri-kanan
  layers.push({ input: dateSvgBuffer, left: 0,       top: spec.dateY })
  layers.push({ input: dateSvgBuffer, left: STRIP_W, top: spec.dateY })

  // 4d. QR Code kembar — lapisan paling atas
  const qrLeft  = spec.qr.xInStrip
  const qrRight = STRIP_W + spec.qr.xInStrip
  layers.push({ input: qrBuffer, left: qrLeft,  top: spec.qr.y })
  layers.push({ input: qrBuffer, left: qrRight, top: spec.qr.y })

  // ── 5. Render output ──────────────────────────────────────────────────────
  const outputFilename = `photo_${Date.now()}.jpg`
  const outputPath     = path.join(outputDir, outputFilename)

  await sharp({
    create: { width: PRINT_W, height: PRINT_H, channels: 4, background: '#000000' },
  })
    .composite(layers)
    .jpeg({ quality: 95 })
    .toFile(outputPath)

  return outputPath
}

module.exports = { compositePhoto }
