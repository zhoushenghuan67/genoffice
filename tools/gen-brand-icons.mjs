/**
 * Regenerates the HuanOffice brand icon set from the cat-head badge
 * (apps/shell/src/renderer/src/assets/huan-cat.svg).
 *
 * The badge SVG is the single source of truth for every raster the shell
 * ships: the electron-builder app icon (build/icon.png, build/icon.ico,
 * build/icon.icns), the linux hicolor set (build/icons/*.png) and the
 * renderer copy used by the onboarding carousel and the update page
 * (apps/shell/src/renderer/src/assets/app-icon.png).
 *
 * Rasterization uses the system Chrome via Playwright (transparent
 * background), the same way tools/gen-file-association-icons.mjs does.
 *
 * Regenerate after changing huan-cat.svg:
 *   node tools/gen-brand-icons.mjs
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const badgePath = join(root, 'apps/shell/src/renderer/src/assets/huan-cat.svg')
const buildDir = join(root, 'apps/shell/build')
const iconsDir = join(buildDir, 'icons')
const rendererIcon = join(root, 'apps/shell/src/renderer/src/assets/app-icon.png')

// macOS app icons carry the standard grid margin (824/1024 content) so they
// sit at the same optical size as neighbouring icons in Finder.
const MAC_CONTENT_RATIO = 824 / 1024

// hicolor raster sizes the deb/rpm packages install.
const HICOLOR_SIZES = [16, 32, 48, 64, 128, 256, 512, 1024]
// Windows ICO slots.
const WIN_SIZES = [16, 24, 32, 48, 64, 128, 256]
// macOS ICNS slots: [type, pixel size].
const ICNS_SLOTS = [
  ['ic04', 16],
  ['ic05', 32],
  ['ic07', 128],
  ['ic08', 256],
  ['ic09', 512],
  ['ic10', 1024],
  ['ic11', 32],
  ['ic12', 64],
  ['ic13', 512],
  ['ic14', 1024],
]

/** ICO container with PNG-compressed entries (supported since Vista). */
function buildIco(entries) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(entries.length, 4)
  const dir = Buffer.alloc(16 * entries.length)
  let offset = header.length + dir.length
  entries.forEach(({ size, png }, i) => {
    const o = i * 16
    dir.writeUInt8(size >= 256 ? 0 : size, o) // 0 means 256
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1)
    dir.writeUInt8(0, o + 2) // palette
    dir.writeUInt8(0, o + 3) // reserved
    dir.writeUInt16LE(1, o + 4) // planes
    dir.writeUInt16LE(32, o + 6) // bpp
    dir.writeUInt32LE(png.length, o + 8)
    dir.writeUInt32LE(offset, o + 12)
    offset += png.length
  })
  return Buffer.concat([header, dir, ...entries.map((e) => e.png)])
}

/** ICNS container: 'icns' magic, total length, then [type][length][data]. */
function buildIcns(chunks, info) {
  const parts = chunks.map(({ type, png }) => {
    const head = Buffer.alloc(8)
    head.write(type, 0, 4, 'latin1')
    head.writeUInt32BE(png.length + 8, 4)
    return Buffer.concat([head, png])
  })
  if (info) {
    const head = Buffer.alloc(8)
    head.write('info', 0, 4, 'latin1')
    head.writeUInt32BE(info.length + 8, 4)
    parts.push(Buffer.concat([head, info]))
  }
  const body = Buffer.concat(parts)
  const head = Buffer.alloc(8)
  head.write('icns', 0, 4, 'latin1')
  head.writeUInt32BE(body.length + 8, 4)
  return Buffer.concat([head, body])
}

/** Pull the optional 'info' chunk out of an existing icns so the metadata survives. */
function readIcnsInfo(file) {
  let buf
  try {
    buf = readFileSync(file)
  } catch {
    return null
  }
  if (buf.slice(0, 4).toString() !== 'icns') return null
  let off = 8
  while (off + 8 <= buf.length) {
    const type = buf.slice(off, off + 4).toString('latin1')
    const len = buf.readUInt32BE(off + 4)
    if (len < 8 || off + len > buf.length) break
    if (type === 'info') return buf.slice(off + 8, off + len)
    off += len
  }
  return null
}

/** Rasterize the badge onto a transparent square canvas. */
async function renderPng(browser, dataUrl, canvasSize, contentSize) {
  const page = await browser.newPage({
    deviceScaleFactor: 1,
    viewport: { width: canvasSize, height: canvasSize },
  })
  await page.setContent(
    `<body style="margin:0"><div style="width:${canvasSize}px;height:${canvasSize}px;display:flex;align-items:center;justify-content:center">` +
      `<img src="${dataUrl}" style="width:${contentSize}px;height:${contentSize}px"></div></body>`,
  )
  try {
    return await page.screenshot({ omitBackground: true })
  } finally {
    await page.close()
  }
}

const badge = readFileSync(badgePath)
const dataUrl = `data:image/svg+xml;base64,${badge.toString('base64')}`

const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  mkdirSync(iconsDir, { recursive: true })

  // Full-bleed source icon + the renderer's copy of it.
  const full = await renderPng(browser, dataUrl, 1024, 1024)
  writeFileSync(join(buildDir, 'icon.png'), full)
  writeFileSync(rendererIcon, full)

  // macOS variant with the grid margin.
  const mac = await renderPng(browser, dataUrl, 1024, Math.round(1024 * MAC_CONTENT_RATIO))
  writeFileSync(join(buildDir, 'icon-mac.png'), mac)

  // linux hicolor set.
  for (const size of HICOLOR_SIZES) {
    writeFileSync(
      join(iconsDir, `${size}x${size}.png`),
      await renderPng(browser, dataUrl, size, size),
    )
  }

  // Windows ICO.
  const winEntries = []
  for (const size of WIN_SIZES) {
    winEntries.push({ size, png: await renderPng(browser, dataUrl, size, size) })
  }
  writeFileSync(join(buildDir, 'icon.ico'), buildIco(winEntries))

  // macOS ICNS.
  const info = readIcnsInfo(join(buildDir, 'icon.icns'))
  const icnsChunks = []
  for (const [type, size] of ICNS_SLOTS) {
    icnsChunks.push({ type, png: await renderPng(browser, dataUrl, size, size) })
  }
  writeFileSync(join(buildDir, 'icon.icns'), buildIcns(icnsChunks, info))

  console.log('regenerated brand icons from huan-cat.svg')
} finally {
  await browser.close()
}
