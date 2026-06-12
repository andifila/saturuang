require('dotenv').config()
const { execFile } = require('child_process')
const path = require('path')

const PRINTER_NAME = process.env.PRINTER_NAME || 'DNP DS-RX1HS'
const OUTPUTS_DIR = path.resolve(__dirname, 'outputs')
const PRINT_TIMEOUT_MS = 30_000

async function printPhoto(filePath) {
  const absPath = path.resolve(filePath)

  // Guard: only allow printing files inside our own outputs directory
  if (!absPath.startsWith(OUTPUTS_DIR + path.sep)) {
    throw new Error('Invalid print path — file outside outputs directory')
  }

  // Build a PowerShell script that uses variables, not string interpolation,
  // so the path and printer name are never interpreted as PS syntax.
  // Single-quote escaping in PS: replace ' with ''
  const escapedPath = absPath.replace(/'/g, "''")
  const escapedPrinter = PRINTER_NAME.replace(/'/g, "''")

  const script = [
    `$f = '${escapedPath}'`,
    `$p = '${escapedPrinter}'`,
    `Start-Process -FilePath $f -Verb PrintTo -ArgumentList $p -Wait -PassThru | Out-Null`,
  ].join('; ')

  // -EncodedCommand expects UTF-16LE Base64 — keeps the command fully out of shell parsing
  const encoded = Buffer.from(script, 'utf16le').toString('base64')

  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NonInteractive', '-NoProfile', '-EncodedCommand', encoded],
      { timeout: PRINT_TIMEOUT_MS },
      (err) => (err ? reject(new Error(`Cetak gagal: ${err.message}`)) : resolve())
    )
  })
}

module.exports = { printPhoto }
