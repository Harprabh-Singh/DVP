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

async function openPage(viewport, name, reducedMotion = 'no-preference') {
  const page = await browser.newPage({ viewport, reducedMotion })
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`${name}: ${message.text()}`) })
  await page.goto('http://127.0.0.1:7100/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  return page
}

async function showContact(page) {
  await page.evaluate(() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'instant' }))
  await page.waitForTimeout(1700)
}

try {
  await waitForServer()
  browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true })

  const desktop = await openPage({ width: 1440, height: 1000 }, 'Desktop')
  await desktop.getByRole('button', { name: 'Contact us' }).click()
  await desktop.waitForTimeout(1900)
  const desktopContactVisible = await desktop.locator('#contact').evaluate((element) => Math.abs(element.getBoundingClientRect().top) < 5)
  await desktop.locator('input[name="name"]').fill('Asha Rao')
  await desktop.locator('input[name="email"]').fill('asha@example.com')
  await desktop.locator('select[name="interest"]').selectOption({ label: 'Booking an artist' })
  await desktop.locator('textarea[name="message"]').fill('I would like to enquire about a folk performance for a cultural evening.')
  await desktop.getByRole('button', { name: 'Prepare email' }).click()
  await desktop.waitForTimeout(500)
  const formStatus = await desktop.locator('.contact-form-status').textContent()
  const emailHref = await desktop.locator('.contact-direct > a').getAttribute('href')
  await desktop.locator('.contact-section').screenshot({ path: path.join(output, 'contact-desktop.png') })
  await desktop.locator('.site-footer').screenshot({ path: path.join(output, 'footer-desktop.png') })

  const mobile = await openPage({ width: 390, height: 844 }, 'Mobile')
  await mobile.getByRole('button', { name: 'Open navigation' }).click()
  const mobileMenuItems = await mobile.locator('.mobile-menu-inner > button').count()
  await mobile.locator('.mobile-menu-inner').getByRole('button', { name: /Contact/ }).click()
  await mobile.waitForTimeout(1800)
  const mobileMenuClosed = await mobile.locator('.mobile-menu').getAttribute('aria-hidden')
  await showContact(mobile)
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  const imageFormats = await mobile.evaluate(() => [...document.images].map((image) => image.getAttribute('src')).filter((src) => src && !src.endsWith('.avif') && !src.endsWith('.svg')))
  await mobile.locator('.contact-section').screenshot({ path: path.join(output, 'contact-mobile.png') })
  await mobile.locator('.site-footer').screenshot({ path: path.join(output, 'footer-mobile.png') })

  const reduced = await openPage({ width: 390, height: 844 }, 'Reduced', 'reduce')
  await showContact(reduced)
  const reducedOpacity = await reduced.locator('.contact-heading').evaluate((element) => getComputedStyle(element).opacity)

  const result = { desktopContactVisible, formStatus, emailHref, mobileMenuItems, mobileMenuClosed, overflow, imageFormats, reducedOpacity, consoleErrors: errors }
  console.log(JSON.stringify(result, null, 2))
  if (!desktopContactVisible || !formStatus?.includes('ready in your email app') || emailHref !== 'mailto:Hello.desertvoice@gmail.com' || mobileMenuItems !== 5 || mobileMenuClosed !== 'true' || overflow || imageFormats.length || reducedOpacity !== '1' || errors.length) process.exitCode = 1
} finally {
  if (browser) await browser.close()
  server.kill('SIGTERM')
}
