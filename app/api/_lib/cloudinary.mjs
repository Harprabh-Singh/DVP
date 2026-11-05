import { createHash } from 'node:crypto'

export function cloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_URL)
}

export function cloudinaryConfig() {
  if (!process.env.CLOUDINARY_URL) throw new Error('CLOUDINARY_URL is not configured.')
  const url = new URL(process.env.CLOUDINARY_URL)
  const config = {
    apiKey: decodeURIComponent(url.username),
    apiSecret: decodeURIComponent(url.password),
    cloudName: url.hostname,
  }
  if (!config.apiKey || !config.apiSecret || !config.cloudName) throw new Error('CLOUDINARY_URL is invalid.')
  return config
}

function signature(parameters, apiSecret) {
  const serialized = Object.keys(parameters).sort().map((key) => `${key}=${parameters[key]}`).join('&')
  return createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex')
}

export function createUploadSignature(key) {
  const config = cloudinaryConfig()
  const timestamp = Math.floor(Date.now() / 1000)
  const publicId = `dvp/${key}-${Date.now()}`
  return {
    apiKey: config.apiKey,
    cloudName: config.cloudName,
    timestamp,
    publicId,
    signature: signature({ public_id: publicId, timestamp }, config.apiSecret),
  }
}

export async function destroyCloudinaryImage(publicId) {
  if (!publicId.startsWith('dvp/')) return
  const config = cloudinaryConfig()
  const timestamp = Math.floor(Date.now() / 1000)
  const parameters = { invalidate: 'true', public_id: publicId, timestamp }
  const body = new URLSearchParams({
    api_key: config.apiKey,
    invalidate: 'true',
    public_id: publicId,
    timestamp: String(timestamp),
    signature: signature(parameters, config.apiSecret),
  })
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const result = await response.json().catch(() => null)
  if (!response.ok || !['ok', 'not found'].includes(result?.result)) throw new Error(result?.error?.message || 'Cloudinary image deletion failed.')
}
