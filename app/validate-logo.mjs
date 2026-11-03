import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.dirname(fileURLToPath(import.meta.url))
const output = path.resolve(root, '../validation')
await mkdir(output, { recursive: true })
const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '7100', '--strictPort'], { cwd: root, stdio: 'pipe' })
let browser
const errors = []

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch('http://127.0.0.1:7100/')).ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('Preview server did not start')
}

async function inspect(page, name) {
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`${name}: ${message.text()}`) })
  await page.goto('http://127.0.0.1:7100/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(2400)
  const result = await page.evaluate(() => {
    const logo = document.querySelector('.brand-logo')
    if (!(logo instanceof HTMLImageElement)) throw new Error('Logo image missing')
    const bounds = logo.getBoundingClientRect()
    return {
      source: logo.currentSrc,
      loaded: logo.complete && logo.naturalWidth > 0,
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
      favicon: document.querySelector('link[rel="icon"]')?.getAttribute('href'),
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      nonAvifRaster: [...document.images]
        .map((image) => image.currentSrc)
        .filter((source) => source && !source.endsWith('.avif') && !source.endsWith('.svg')),
    }
  })
  await page.screenshot({ path: path.join(output, `logo-${name}-hero.png`) })
  return result
}

try {
  await waitForServer()
  browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true })
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const desktopResult = await inspect(desktop, 'desktop')
  const mobileResult = await inspect(mobile, 'mobile')
  console.log(JSON.stringify({ desktop: desktopResult, mobile: mobileResult, consoleErrors: errors }, null, 2))
  const valid = [desktopResult, mobileResult].every((result) =>
    result.loaded &&
    result.source.endsWith('/images/dvp-logo.svg') &&
    result.favicon === '/favicon.svg' &&
    !result.overflow &&
    result.nonAvifRaster.length === 0
  )
  if (!valid || desktopResult.width !== 66 || mobileResult.width !== 52 || errors.length) process.exitCode = 1
} finally {
  if (browser) await browser.close()
  server.kill('SIGTERM')
}
