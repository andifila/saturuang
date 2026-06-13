const sharp = require('sharp')
const path  = require('path')
const fs    = require('fs')

const PRINT_W = 1200
const PRINT_H = 1800

// Dual-strip X anchors — left strip starts at 48, right at 648, each 504px wide
const LEFT_X  = 48
const RIGHT_X = 648
const PHOTO_W = 504

// Photo cell height derived from 16:9 landscape webcam aspect ratio
const PHOTO_H = Math.round(PHOTO_W * 9 / 16) // 284px

const TEMPLATES_DIR = path.join(__dirname, 'templates')

// Layout config per strip type
const LAYOUT = {
  2: {
    // Strip Pendek: 2 photos centered in the usable area, bottom reserved for template logo
    logoReserve: 480,
    topPad:      80,
    gap:         24,
  },
  4: {
    // Strip Klasik: 4 photos packed tightly from top, small bottom reserve
    logoReserve: 560,
    topPad:      48,
    gap:         16,
  },
}

function base64ToBuffer(dataUrl) {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64, 'base64')
}

// Centers n photos in (PRINT_H - logoReserve) with topPad offset
function calcYPositions(n, { logoReserve, topPad, gap }) {
  const usableH     = PRINT_H - logoReserve
  const totalPhotoH = n * PHOTO_H + (n - 1) * gap
  const freeAbove   = Math.max(0, Math.floor((usableH - topPad - totalPhotoH) / 2))
  const startY      = topPad + freeAbove
  return Array.from({ length: n }, (_, i) => startY + i * (PHOTO_H + gap))
}

async function compositePhoto(photos, templateId, outputDir) {
  const count = Math.min(photos.length, 4)

  if (count !== 2 && count !== 4) {
    throw Object.assign(new Error('Hanya mendukung 2 atau 4 foto'), { status: 400 })
  }

  const layout     = LAYOUT[count]
  const yPositions = calcYPositions(count, layout)

  // Resize all photos to PHOTO_W × PHOTO_H (cover crop, face-centered)
  const resizedPhotos = await Promise.all(
    photos.slice(0, count).map((photo) =>
      sharp(base64ToBuffer(photo))
        .resize(PHOTO_W, PHOTO_H, { fit: 'cover', position: 'attention' })
        .toBuffer()
    )
  )

  // Each photo composited onto both left and right strips (simetris)
  const layers = []
  for (let i = 0; i < count; i++) {
    const y = yPositions[i]
    layers.push({ input: resizedPhotos[i], left: LEFT_X,  top: y })
    layers.push({ input: resizedPhotos[i], left: RIGHT_X, top: y })
  }

  // PNG template overlay on top — strip_pendek.png or strip_klasik.png
  const templateFile = count === 2 ? 'strip_pendek.png' : 'strip_klasik.png'
  const templatePath = path.join(TEMPLATES_DIR, templateFile)
  if (fs.existsSync(templatePath)) {
    layers.push({ input: templatePath, top: 0, left: 0 })
  }

  const outputFilename = `photo_${Date.now()}.jpg`
  const outputPath     = path.join(outputDir, outputFilename)

  await sharp({
    create: { width: PRINT_W, height: PRINT_H, channels: 4, background: '#ffffff' },
  })
    .composite(layers)
    .jpeg({ quality: 95 })
    .toFile(outputPath)

  return outputPath
}

module.exports = { compositePhoto }
