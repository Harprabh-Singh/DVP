import type { SiteImageKey } from './imageCatalog'

async function responseJson(response: Response, fallback: string) {
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('dvp:session-expired'))
    throw new Error(data?.error?.message || data?.error || fallback)
  }
  return data
}

export async function publishCloudinaryImage(key: SiteImageKey, file: File) {
  const signature = await responseJson(await fetch('/api/cloudinary/signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  }), 'The secure upload could not be started.')

  const body = new FormData()
  body.append('file', file)
  body.append('api_key', signature.apiKey)
  body.append('timestamp', String(signature.timestamp))
  body.append('public_id', signature.publicId)
  body.append('signature', signature.signature)
  const uploaded = await responseJson(await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
    method: 'POST',
    body,
  }), 'Cloudinary could not upload this image.')

  const finalized = await responseJson(await fetch(`/api/images/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: uploaded.secure_url, publicId: uploaded.public_id, format: uploaded.format }),
  }), 'The image was uploaded but could not be published.')
  return finalized.url as string
}
