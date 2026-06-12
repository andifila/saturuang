const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

// 4R print size at 300 DPI (4 x 6 inches)
const PRINT_W = 1200
const PRINT_H = 1800

// Outer margin and gap between cells (px)
const PADDING = 48
const GAP = 8

// Grid layout per photo count
const LAYOUTS = {
  2: { cols: 1, rows: 2 },
  4: { cols: 2, rows: 2 },
  8: { cols: 2, rows: 4 },
}

const TEMPLATES_DIR = path.join(__dirname, 'templates')

function base64ToBuffer(dataUrl) {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64, 'base64')
}

async function compositePhoto(photos, templateId, outputDir) {
  const count = Math.min(photos.length, 8)
  const layout = LAYOUTS[count] || LAYOUTS[4]

  // Available drawing area after outer padding
  const areaW = PRINT_W - PADDING * 2
  const areaH = PRINT_H - PADDING * 2

  // Cell dimensions — equally divided with gaps between columns/rows
  const cellW = Math.floor((areaW - GAP * (layout.cols - 1)) / layout.cols)
  const cellH = Math.floor((areaH - GAP * (layout.rows - 1)) / layout.rows)

  // Resize and place each photo into its cell
  const photoLayers = await Promise.all(
    photos.slice(0, count).map(async (photo, i) => {
      const buf = base64ToBuffer(photo)
      const resized = await sharp(buf)
        .resize(cellW, cellH, { fit: 'cover', position: 'attention' })
        .toBuffer()

      const col = i % layout.cols
      const row = Math.floor(i / layout.cols)

      return {
        input: resized,
        left: PADDING + col * (cellW + GAP),
        top: PADDING + row * (cellH + GAP),
      }
    })
  )

  // Optionally composite a transparent PNG frame on top
  const allLayers = [...photoLayers]
  if (templateId) {
    const templatePath = path.join(TEMPLATES_DIR, `${templateId}.png`)
    if (fs.existsSync(templatePath)) {
      allLayers.push({ input: templatePath, top: 0, left: 0 })
    }
  }

  const outputFilename = `photo_${Date.now()}.jpg`
  const outputPath = path.join(outputDir, outputFilename)

  await sharp({
    create: { width: PRINT_W, height: PRINT_H, channels: 3, background: '#ffffff' },
  })
    .composite(allLayers)
    .jpeg({ quality: 95 })
    .toFile(outputPath)

  return outputPath
}

module.exports = { compositePhoto }
