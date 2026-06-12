require('dotenv').config()
const nodemailer = require('nodemailer')
const path = require('path')
const fs = require('fs')

// Lazy init — avoids crashing on import when SMTP creds are not yet configured
let _transporter = null
function getTransporter() {
  if (_transporter) return _transporter
  _transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER || '',
      // Gmail: generate an App Password at myaccount.google.com/apppasswords
      pass: process.env.MAIL_PASS || '',
    },
  })
  return _transporter
}

function buildHtml(filename) {
  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0d0f;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0f;padding:48px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#1a1a1f;border-radius:20px;overflow:hidden;border:1px solid #2e2e36;max-width:100%">

        <!-- Header gradient -->
        <tr>
          <td style="background:linear-gradient(135deg,#c9a96e 0%,#d4b87a 100%);padding:36px 32px;text-align:center">
            <div style="display:inline-block;background:#0d0d0f;border-radius:14px;padding:10px 20px;margin-bottom:16px">
              <span style="color:#c9a96e;font-size:20px;font-weight:900;letter-spacing:-1px">SatuRuang</span>
            </div>
            <h1 style="margin:0;color:#0d0d0f;font-size:30px;font-weight:900;letter-spacing:-1.2px;line-height:1.1">
              Foto kamu sudah siap! 📸
            </h1>
            <p style="margin:10px 0 0;color:rgba(13,13,15,0.6);font-size:14px">Photobox Self-Service</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px;text-align:center">
            <p style="margin:0 0 24px;color:rgba(255,255,255,0.6);font-size:15px;line-height:1.75">
              Hei! Foto kenangan kamu dari SatuRuang<br>terlampir dalam email ini.<br><br>
              Simpan, cetak ulang, dan bagikan momen indahmu! ✨
            </p>

            <!-- File chip -->
            <div style="display:inline-block;background:#0d0d0f;border-radius:12px;
                        padding:14px 24px;margin-bottom:28px;border:1px solid #2e2e36">
              <p style="margin:0 0 4px;color:rgba(255,255,255,0.3);font-size:10px;
                        letter-spacing:3px;text-transform:uppercase">File Terlampir</p>
              <p style="margin:0;color:#c9a96e;font-size:14px;font-weight:700">${filename}</p>
            </div>

            <!-- Tagline -->
            <div style="border-top:1px solid #2e2e36;padding-top:24px">
              <p style="margin:0;color:rgba(255,255,255,0.2);font-size:13px;font-style:italic;line-height:1.6">
                "Kunci tawamu di satu ruang,<br>bawa pulang dalam satu lembar."
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 32px;border-top:1px solid #2e2e36;text-align:center">
            <p style="margin:0;color:rgba(255,255,255,0.18);font-size:11px">
              © 2025 SatuRuang Photobox &nbsp;·&nbsp;
              Terima kasih sudah menggunakan layanan kami
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function sendPhotoEmail(toEmail, filePath) {
  if (!toEmail || !filePath) throw new Error('toEmail dan filePath wajib diisi')
  if (!fs.existsSync(filePath)) throw new Error(`File tidak ditemukan: ${filePath}`)

  const filename = path.basename(filePath)
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || '"SatuRuang Photobox" <noreply@saturuang.id>',
    to: toEmail,
    subject: 'Foto kamu dari SatuRuang sudah siap! 📸',
    html: buildHtml(filename),
    attachments: [{ filename, path: filePath }],
  })
}

module.exports = { sendPhotoEmail }
