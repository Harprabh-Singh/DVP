import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Check, Image as ImageIcon, LogOut, RotateCcw, Search, Upload, X } from 'lucide-react'
import { Link } from 'react-router'
import { useSiteImages } from '../content/SiteImagesContext'
import AdminLogin from './AdminLogin'
import { imageCatalog, imageGroups } from '../content/imageCatalog'
import type { ImageDefinition, ImageGroup } from '../content/imageCatalog'
import './Admin.css'

type Filter = 'All images' | ImageGroup

export default function Admin() {
  const { ready, storage, getImage, isCustomised, saveImage, resetImage } = useSiteImages()
  const [auth, setAuth] = useState<'checking' | 'anonymous' | 'authenticated'>('checking')
  const [filter, setFilter] = useState<Filter>('All images')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<ImageDefinition | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => imageCatalog.filter((item) => {
    const matchesGroup = filter === 'All images' || item.group === filter
    const matchesQuery = `${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase())
    return matchesGroup && matchesQuery
  }), [filter, query])

  useEffect(() => {
    let active = true
    const expire = () => { setAuth('anonymous'); setEditing(null) }
    window.addEventListener('dvp:session-expired', expire)
    fetch('/api/auth/status', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => { if (active) setAuth(data.authenticated ? 'authenticated' : 'anonymous') })
      .catch(() => { if (active) setAuth('anonymous') })
    return () => { active = false; window.removeEventListener('dvp:session-expired', expire) }
  }, [])

  useEffect(() => {
    if (!editing) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !saving) setEditing(null) }
    document.addEventListener('keydown', closeOnEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = ''
    }
  }, [editing, saving])

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const openEditor = (item: ImageDefinition) => {
    setEditing(item)
    setFile(null)
    setPreview('')
    setError('')
  }

  const chooseFile = (selected?: File) => {
    if (!selected) return
    if (selected.type !== 'image/avif' && !selected.name.toLowerCase().endsWith('.avif')) {
      setError('AVIF files only. Convert your photograph before uploading.')
      return
    }
    if (selected.size > 15 * 1024 * 1024) {
      setError('Please choose an image smaller than 15 MB.')
      return
    }
    if (preview) URL.revokeObjectURL(preview)
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setError('')
  }

  const publish = async () => {
    if (!editing || !file) return
    setSaving(true)
    setError('')
    try {
      await saveImage(editing.key, file)
      setToast(`${editing.label} updated successfully.`)
      setEditing(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The image could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const restore = async (item: ImageDefinition) => {
    try {
      await resetImage(item.key)
      setToast(`${item.label} restored to the original image.`)
    } catch {
      setToast('The original image could not be restored.')
    }
  }

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    setAuth('anonymous')
  }

  const customisedCount = imageCatalog.filter((item) => isCustomised(item.key)).length

  if (auth === 'checking') return <main className="admin-auth-check"><img src="/images/dvp-logo.svg" alt="" width="64" height="64" /><span>Opening Image Studio…</span></main>
  if (auth === 'anonymous') return <AdminLogin onSuccess={() => setAuth('authenticated')} />

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <Link to="/" className="admin-brand" aria-label="Desert Voice Project home">
          <img src="/images/dvp-logo.svg" alt="" width="52" height="52" />
          <div><strong>Desert Voice</strong><span>Image Studio</span></div>
        </Link>
        <div className="admin-header-actions">
          <span className="admin-save-status"><i />{storage === 'cloud' ? 'Shared cloud library' : 'Shared server library'}</span>
          <Link to="/" className="admin-view-site">View website <ArrowUpRight size={15} strokeWidth={1.4} /></Link>
          <button className="admin-logout" onClick={signOut} aria-label="Sign out of Image Studio" title="Sign out"><LogOut size={16} strokeWidth={1.35} /><span>Sign out</span></button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <span className="admin-sidebar-label">Image library</span>
          <nav aria-label="Filter image placements">
            {(['All images', ...imageGroups] as Filter[]).map((item) => (
              <button key={item} className={filter === item ? 'is-active' : ''} onClick={() => setFilter(item)}>
                <span>{item}</span>
                <small>{item === 'All images' ? imageCatalog.length : imageCatalog.filter((image) => image.group === item).length}</small>
              </button>
            ))}
          </nav>
          <div className="admin-storage-note">
            <ImageIcon size={18} strokeWidth={1.2} />
            <p>{storage === 'cloud' ? 'Images are published to shared cloud storage and appear on every device.' : 'Images are saved on the shared website server and appear on every device connected to it.'}</p>
          </div>
        </aside>

        <section className="admin-content" aria-labelledby="admin-title">
          <div className="admin-title-row">
            <div>
              <span className="admin-eyebrow">Content management / Photography</span>
              <h1 id="admin-title">Website imagery.</h1>
              <p>Curate every visual chapter without touching the code.</p>
            </div>
            <div className="admin-stat"><strong>{customisedCount}</strong><span>of {imageCatalog.length}<br />customised</span></div>
          </div>

          <div className="admin-toolbar">
            <label className="admin-search"><Search size={16} strokeWidth={1.4} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search image placements…" aria-label="Search image placements" /></label>
            <span>AVIF only · Max 15 MB</span>
          </div>

          {!ready ? <div className="admin-loading">Opening the image library…</div> : (
            <div className="admin-grid">
              {filtered.map((item, index) => (
                <article className="admin-image-card" key={item.key}>
                  <button className="admin-image-preview" onClick={() => openEditor(item)} aria-label={`Replace ${item.label} image`}>
                    <img key={getImage(item.key)} src={getImage(item.key)} alt="" loading={index < 4 ? 'eager' : 'lazy'} />
                    <span className="admin-image-action"><Upload size={16} strokeWidth={1.4} />Replace image</span>
                    {isCustomised(item.key) && <span className="admin-custom-badge">Customised</span>}
                  </button>
                  <div className="admin-card-copy">
                    <span>{item.group} · {item.ratio}</span>
                    <h2>{item.label}</h2>
                    <p>{item.description}</p>
                    <div>
                      <button onClick={() => openEditor(item)}>Change image <ArrowUpRight size={13} strokeWidth={1.4} /></button>
                      {isCustomised(item.key) && <button className="admin-restore" onClick={() => restore(item)} aria-label={`Restore original ${item.label} image`}><RotateCcw size={13} strokeWidth={1.4} />Restore</button>}
                    </div>
                  </div>
                </article>
              ))}
              {filtered.length === 0 && <div className="admin-empty">No image placements match your search.</div>}
            </div>
          )}
        </section>
      </div>

      {editing && (
        <div className="admin-modal-backdrop" onMouseDown={() => !saving && setEditing(null)}>
          <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="admin-modal-top">
              <div><span>Replace photograph</span><h2 id="upload-title">{editing.label}</h2></div>
              <button onClick={() => setEditing(null)} disabled={saving} aria-label="Close image editor"><X size={20} strokeWidth={1.3} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-current-image"><span>Current</span><img src={getImage(editing.key)} alt={`Current ${editing.label}`} /></div>
              <div
                className={`admin-dropzone ${preview ? 'has-preview' : ''}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files[0]) }}
              >
                {preview ? <img src={preview} alt="New upload preview" /> : <Upload size={25} strokeWidth={1.15} />}
                <div><strong>{file ? file.name : 'Drop your new AVIF image here'}</strong><span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready to publish` : 'or choose a file from your device'}</span></div>
                <button onClick={() => inputRef.current?.click()}>{file ? 'Choose another' : 'Browse files'}</button>
                <input ref={inputRef} type="file" accept=".avif,image/avif" onChange={(event) => chooseFile(event.target.files?.[0])} hidden />
              </div>
            </div>
            {error && <p className="admin-error" role="alert">{error}</p>}
            <div className="admin-modal-footer">
              <p>The public website updates as soon as you publish.</p>
              <button className="admin-publish" onClick={publish} disabled={!file || saving}>{saving ? 'Publishing…' : <><Check size={15} strokeWidth={1.6} />Publish change</>}</button>
            </div>
          </section>
        </div>
      )}

      {toast && <div className="admin-toast" role="status"><Check size={16} strokeWidth={1.5} />{toast}</div>}
      <Link className="admin-back-mobile" to="/"><ArrowLeft size={15} />Back to website</Link>
    </main>
  )
}
