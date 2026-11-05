import { spawn } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.dirname(fileURLToPath(import.meta.url))
const output = path.resolve(root, '../validation')
const baseUrl = 'http://127.0.0.1:7100'
await mkdir(output, { recursive: true })
const server = spawn(process.execPath, [path.join(root, 'scripts/dev.mjs'), '--host', '127.0.0.1', '--port', '7100', '--strictPort'], { cwd: root, stdio: 'pipe' })
let browser
const errors = []

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const [site, api] = await Promise.all([fetch(baseUrl), fetch(`${baseUrl}/api/health`)])
      if (site.ok && api.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('Preview server did not start')
}

try {
  await waitForServer()
  browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  page.on('console', (message) => {
    if (message.type() === 'error' && !/status of (400|401)/.test(message.text())) errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Welcome back.' }).waitFor()
  const loginVisible = await page.getByRole('button', { name: 'Sign in to Image Studio' }).isVisible()
  await page.screenshot({ path: path.join(output, 'image-studio-login-desktop.png'), fullPage: true })

  const validAvif = await readFile(path.join(root, 'public/images/artist-dancer.avif'))
  const unauthorisedUpload = await page.request.put(`${baseUrl}/api/images/artistVocalist`, {
    multipart: { image: { name: 'unauthorised.avif', mimeType: 'image/avif', buffer: validAvif } },
  })

  await page.getByLabel('Password', { exact: true }).fill('definitely-wrong')
  await page.getByRole('button', { name: 'Sign in to Image Studio' }).click()
  const wrongPasswordMessage = await page.getByRole('alert').textContent()
  await page.getByLabel('Password', { exact: true }).fill('abc123456')
  await page.getByRole('button', { name: 'Sign in to Image Studio' }).click()
  await page.locator('.admin-image-card').first().waitFor()
  const totalCards = await page.locator('.admin-image-card').count()
  const cookies = await context.cookies(baseUrl)
  const sessionCookie = cookies.find((cookie) => cookie.name === 'dvp_admin')

  const invalidServerUpload = await page.request.put(`${baseUrl}/api/images/artistVocalist`, {
    multipart: { image: { name: 'fake.avif', mimeType: 'image/avif', buffer: Buffer.from('not an avif image') } },
  })

  await page.locator('.admin-sidebar nav button').filter({ hasText: /^Artists/ }).click()
  const artistCards = await page.locator('.admin-image-card').count()
  await page.getByRole('textbox', { name: 'Search image placements' }).fill('dancer')
  const searchCards = await page.locator('.admin-image-card').count()
  const searchTitle = await page.locator('.admin-image-card h2').textContent()
  await page.getByRole('textbox', { name: 'Search image placements' }).fill('')
  await page.locator('.admin-sidebar nav button').filter({ hasText: /^All images/ }).click()

  await page.getByRole('button', { name: 'Replace Manganiyar voices image' }).click()
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(path.join(root, 'package.json'))
  const invalidMessage = await page.getByRole('alert').textContent()
  await fileInput.setInputFiles(path.join(root, 'public/images/artist-dancer.avif'))
  const previewVisible = await page.getByAltText('New upload preview').isVisible()
  await page.getByRole('button', { name: 'Publish change' }).click()
  await page.locator('.admin-modal').waitFor({ state: 'detached' })

  const vocalistCard = page.locator('.admin-image-card').filter({ has: page.getByRole('heading', { name: 'Manganiyar voices', exact: true }) })
  const customisedBadge = await vocalistCard.locator('.admin-custom-badge').textContent()
  const customisedSrc = await vocalistCard.locator('.admin-image-preview img').getAttribute('src')
  await page.getByRole('link', { name: 'View website' }).click()
  await page.waitForURL(`${baseUrl}/`)
  const publicSrc = await page.locator('.artist-portrait-image').getAttribute('src')

  await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' })
  await page.locator('.admin-image-card').first().waitFor()
  const persistedCard = page.locator('.admin-image-card').filter({ has: page.getByRole('heading', { name: 'Manganiyar voices', exact: true }) })
  const persistedSrc = await persistedCard.locator('.admin-image-preview img').getAttribute('src')

  const secondContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const secondPage = await secondContext.newPage()
  await secondPage.goto(baseUrl, { waitUntil: 'networkidle' })
  const secondBrowserSrc = await secondPage.locator('.artist-portrait-image').getAttribute('src')
  await secondPage.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' })
  const secondBrowserNeedsLogin = await secondPage.getByRole('heading', { name: 'Welcome back.' }).isVisible()
  await secondContext.close()

  await page.getByRole('button', { name: 'Restore original Manganiyar voices image' }).click()
  await persistedCard.locator('.admin-custom-badge').waitFor({ state: 'detached' })
  const restoredSrc = await persistedCard.locator('.admin-image-preview img').getAttribute('src')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: path.join(output, 'image-studio-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(300)
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  await page.screenshot({ path: path.join(output, 'image-studio-mobile.png'), fullPage: true })

  await page.getByRole('button', { name: 'Sign out of Image Studio' }).click()
  await page.getByRole('heading', { name: 'Welcome back.' }).waitFor()
  const loggedOut = await page.getByRole('button', { name: 'Sign in to Image Studio' }).isVisible()
  const mobileLoginOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  await page.screenshot({ path: path.join(output, 'image-studio-login-mobile.png'), fullPage: true })

  const result = {
    loginVisible,
    unauthorisedUploadStatus: unauthorisedUpload.status(),
    wrongPasswordMessage,
    totalCards,
    sessionCookie: sessionCookie ? { httpOnly: sessionCookie.httpOnly, sameSite: sessionCookie.sameSite, secure: sessionCookie.secure } : null,
    invalidServerUploadStatus: invalidServerUpload.status(),
    artistCards,
    searchCards,
    searchTitle,
    invalidMessage,
    previewVisible,
    customisedBadge,
    customisedSrc,
    publicSrc,
    persistedSrc,
    secondBrowserSrc,
    secondBrowserNeedsLogin,
    restoredSrc,
    mobileOverflow,
    loggedOut,
    mobileLoginOverflow,
    consoleErrors: errors,
  }
  console.log(JSON.stringify(result, null, 2))

  const valid = loginVisible
    && unauthorisedUpload.status() === 401
    && wrongPasswordMessage?.includes('incorrect')
    && totalCards === 15
    && sessionCookie?.httpOnly
    && sessionCookie?.sameSite === 'Strict'
    && invalidServerUpload.status() === 400
    && artistCards === 4
    && searchCards === 1
    && searchTitle === 'Folk dancers'
    && invalidMessage?.includes('AVIF files only')
    && previewVisible
    && customisedBadge === 'Customised'
    && customisedSrc?.startsWith('/uploads/')
    && publicSrc === customisedSrc
    && persistedSrc === customisedSrc
    && secondBrowserSrc === customisedSrc
    && secondBrowserNeedsLogin
    && restoredSrc === '/images/artist-vocalist.avif'
    && !mobileOverflow
    && loggedOut
    && !mobileLoginOverflow
    && errors.length === 0
  if (!valid) process.exitCode = 1
} finally {
  if (browser) await browser.close()
  server.kill('SIGTERM')
}
