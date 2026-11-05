import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { imageCatalog } from './imageCatalog'
import type { SiteImageKey } from './imageCatalog'

type ImageMap = Partial<Record<SiteImageKey, string>>
type StorageMode = 'local' | 'cloud' | 'unconfigured'

type SiteImagesValue = {
  ready: boolean
  storage: StorageMode
  getImage: (key: SiteImageKey) => string
  getImageBySrc: (src: string) => string
  isCustomised: (key: SiteImageKey) => boolean
  saveImage: (key: SiteImageKey, file: File) => Promise<void>
  resetImage: (key: SiteImageKey) => Promise<void>
}

const SiteImagesContext = createContext<SiteImagesValue | null>(null)
const defaults = Object.fromEntries(imageCatalog.map((item) => [item.key, item.defaultSrc])) as Record<SiteImageKey, string>
const keysBySrc = Object.fromEntries(imageCatalog.map((item) => [item.defaultSrc, item.key])) as Record<string, SiteImageKey>

async function throwApiError(response: Response, fallback: string) {
  const data = await response.json().catch(() => null)
  if (response.status === 401) window.dispatchEvent(new Event('dvp:session-expired'))
  throw new Error(data?.error || fallback)
}

export function SiteImagesProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<ImageMap>({})
  const [ready, setReady] = useState(false)
  const [storage, setStorage] = useState<StorageMode>('local')

  useEffect(() => {
    let active = true
    fetch('/api/images', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) await throwApiError(response, 'The image library could not be loaded.')
        return response.json()
      })
      .then((data) => {
        if (!active) return
        setOverrides(data.images || {})
        setStorage(data.storage === 'cloud' ? 'cloud' : data.storage === 'unconfigured' ? 'unconfigured' : 'local')
        setReady(true)
      })
      .catch(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [])

  const saveImage = async (key: SiteImageKey, file: File) => {
    if (file.type !== 'image/avif' && !file.name.toLowerCase().endsWith('.avif')) throw new Error('Please choose an AVIF image.')
    if (storage === 'unconfigured') throw new Error('Add Neon and Cloudinary to this deployment before publishing images.')
    if (storage === 'cloud') {
      const { publishCloudinaryImage } = await import('./cloudinaryUpload')
      const url = await publishCloudinaryImage(key, file)
      setOverrides((current) => ({ ...current, [key]: url }))
      return
    }
    const body = new FormData()
    body.append('image', file)
    const response = await fetch(`/api/images/${key}`, { method: 'PUT', body })
    if (!response.ok) await throwApiError(response, 'The image could not be published.')
    const data = await response.json()
    setOverrides((current) => ({ ...current, [key]: data.url }))
    setStorage(data.storage === 'cloud' ? 'cloud' : 'local')
  }

  const resetImage = async (key: SiteImageKey) => {
    const response = await fetch(`/api/images/${key}`, { method: 'DELETE' })
    if (!response.ok) await throwApiError(response, 'The original image could not be restored.')
    setOverrides((current) => {
      const updated = { ...current }
      delete updated[key]
      return updated
    })
  }

  const value: SiteImagesValue = {
    ready,
    storage,
    getImage: (key) => overrides[key] ?? defaults[key],
    getImageBySrc: (src) => {
      const key = keysBySrc[src]
      return key ? overrides[key] ?? defaults[key] : src
    },
    isCustomised: (key) => Boolean(overrides[key]),
    saveImage,
    resetImage,
  }

  return <SiteImagesContext.Provider value={value}>{children}</SiteImagesContext.Provider>
}

// The provider and its consumer hook intentionally share this module.
// eslint-disable-next-line react-refresh/only-export-components
export function useSiteImages() {
  const value = useContext(SiteImagesContext)
  if (!value) throw new Error('useSiteImages must be used within SiteImagesProvider')
  return value
}
