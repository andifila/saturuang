const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

// 4R print size at 300 DPI (4 x 6 inches)
const PRINT_W = 1200
const PRINT_H = 1800

const PADDING   = 48
const GAP       = 8
const LABEL_H   = 140 // reserved at bottom for template branding

// Grid layout per photo count
const LAYOUTS = {
  2: { cols: 1, rows: 2 },
  4: { cols: 2, rows: 2 },
  8: { cols: 2, rows: 4 },
}

// Programmatic template definitions — used when no PNG overlay exists
const TEMPLATE_STYLES = {
  minimal: { bg: '#ffffff', labelBg: '#ebebeb', labelColor: '#aaaaaa', labelText: 'SatuRuang' },
  gold:    { bg: '#0d0b08', labelBg: '#c9a96e', labelColor: '#0d0b08', labelText: 'SatuRuang' },
  pink:    { bg: '#fff0f3', labelBg: '#e8a0a0', labelColor: '#ffffff', labelText: 'SatuRuang' },
  film:    { bg: '#111009', labelBg: '#2a2218', labelColor: '#8a8060', labelText: 'SATU RUANG' },
}
const DEFAULT_STYLE = TEMPLATE_STYLES.minimal

const TEMPLATES_DIR = path.join(__dirname, 'templates')

// Cache rasterized label PNGs — one per template, computed once
const labelCache = new Map()

function base64ToBuffer(dataUrl) {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64, 'base64')
}

function makeLabelSvg(width, height, text, bgColor, textColor) {
  // Escape XML special characters
  const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<rect width="${width}" height="${height}" fill="${bgColor}"/>` +
    `<text x="${width / 2}" y="${height / 2 + 5}" ` +
    `text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="Arial, Helvetica, sans-serif" font-size="26" ` +
    `letter-spacing="6" fill="${textColor}" font-weight="600">${safe}</text>` +
    `</svg>`
  )
}

async function compositePhoto(photos, templateId, outputDir) {
  const count  = Math.min(photos.length, 8)
  const layout = LAYOUTS[count] || LAYOUTS[4]
  const style  = TEMPLATE_STYLES[templateId] || DEFAULT_STYLE

  // Photo area: full height minus top/bottom padding and label strip
  const areaW = PRINT_W - PADDING * 2
  const areaH = PRINT_H - PADDING - LABEL_H   // top padding only; label fills bottom

  const cellW = Math.floor((areaW - GAP * (layout.cols - 1)) / layout.cols)
  const cellH = Math.floor((areaH - GAP * (layout.rows - 1)) / layout.rows)

  // Resize photos + rasterize label in parallel
  const getLabelBuffer = () => {
    if (!labelCache.has(templateId)) {
      const svg = makeLabelSvg(PRINT_W, LABEL_H, style.labelText, style.labelBg, style.labelColor)
      labelCache.set(templateId, sharp(svg).png().toBuffer())
    }
    return labelCache.get(templateId)
  }

  const [photoLayers, labelInput] = await Promise.all([
    Promise.all(
      photos.slice(0, count).map(async (photo, i) => {
        const buf     = base64ToBuffer(photo)
        const resized = await sharp(buf)
          .resize(cellW, cellH, { fit: 'cover', position: 'attention' })
          .toBuffer()

        const col = i % layout.cols
        const row = Math.floor(i / layout.cols)

        return {
          input: resized,
          left:  PADDING + col * (cellW + GAP),
          top:   PADDING + row * (cellH + GAP),
        }
      })
    ),
    getLabelBuffer(),
  ])

  const labelLayer = { input: labelInput, left: 0, top: PRINT_H - LABEL_H }

  const allLayers = [...photoLayers, labelLayer]

  // Optional: PNG frame overlay from backend/templates/{templateId}.png
  if (templateId) {
    const templatePath = path.join(TEMPLATES_DIR, `${templateId}.png`)
    if (fs.existsSync(templatePath)) {
      allLayers.push({ input: templatePath, top: 0, left: 0 })
    }
  }

  const outputFilename = `photo_${Date.now()}.jpg`
  const outputPath     = path.join(outputDir, outputFilename)

  await sharp({
    create: { width: PRINT_W, height: PRINT_H, channels: 3, background: style.bg },
  })
    .composite(allLayers)
    .jpeg({ quality: 95 })
    .toFile(outputPath)

  return outputPath
}

module.exports = { compositePhoto }
