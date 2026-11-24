'use client'
import { useEffect, useState } from 'react'
import { sb, useUser } from '@/lib/sb'
import { Deco } from '@/components/ui'
import { parseManuscript } from '@/lib/manuscript'
export default function Submit() {
  const u = useUser()
  const [g, setG] = useState<any[]>([]), [sel, setSel] = useState<string[]>([]), [type, setType] = useState('external'), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const [f, setF] = useState({ title: '', synopsis: '', date: '', url: '' }), [cv, setCv] = useState<File | null>(null), [ms, setMs] = useState<File | null>(null)
  useEffect(() => { sb.from('genres').select('id,name').eq('is_active', true).order('sort_order').then(r => setG(r.data || [])) }, [])
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  const go = async (e: any) => {
    e.preventDefault(); setMsg('')
    if (!sel.length || sel.length > 5) return setMsg('Choose 1 to 5 genres.')
    if (!cv || !['image/jpeg', 'image/png', 'image/webp'].includes(cv.type) || cv.size > 5e6) return setMsg('Cover must be a JPG, PNG or WebP under 5 MB.')
    if (f.synopsis.length < 10) return setMsg('Synopsis is too short.')
    let chapters: any[] = []
    if (type === 'external') { if (!/^https:\/\/\S+$/.test(f.url)) return setMsg('Enter a full https:// link.') }
    else {
      if (!ms || ms.size > 25e6) return setMsg('Please choose a manuscript file under 25 MB.')
      chapters = await parseManuscript(ms, f.title.trim() || 'Chapter 1'); if (!chapters.length) return setMsg('We could not read any text from that file. If it is a scanned PDF (pictures of pages) or an old .doc, save it as .docx, PDF or plain text and try again.')
    }
    setBusy(true)
    const cp = `${u.id}/${crypto.randomUUID()}.${cv.type.split('/')[1]}`
    let r: any = await sb.storage.from('covers').upload(cp, cv, { contentType: cv.type }); if (r.error) { setBusy(false); return setMsg(r.error.message) }
    r = await sb.from('books').insert({ author_id: u.id, title: f.title.trim(), synopsis: f.synopsis.trim(), cover_path: cp, publication_date: f.date, source_type: type, external_url: type === 'external' ? f.url : null }).select('id').single()
    if (r.error) { setBusy(false); return setMsg(r.error.message) }
    const bid = r.data.id
    const fail = async (m: string) => { await sb.from('books').delete().eq('id', bid); setBusy(false); setMsg(m) }
    try {
    r = await sb.from('book_genres').insert(sel.map(x => ({ book_id: bid, genre_id: x }))); if (r.error) return fail(r.error.message)
    if (type === 'upload' && ms) {
      setMsg('Uploading your manuscript. Please keep this page open until it finishes…')
      const mime = ({ docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', epub: 'application/epub+zip', pdf: 'application/pdf', md: 'text/markdown', txt: 'text/plain', rtf: 'application/rtf', odt: 'application/vnd.oasis.opendocument.text', html: 'text/html', htm: 'text/html' } as any)[(ms.name.split('.').pop() || '').toLowerCase()] || 'application/octet-stream'
      const mp = `${u.id}/${bid}/${crypto.randomUUID()}-${ms.name.replace(/[^\w.-]/g, '_')}`
      r = await sb.storage.from('manuscripts').upload(mp, ms, { contentType: mime }); if (r.error) return fail(r.error.message)
      r = await sb.from('book_private').insert({ book_id: bid, manuscript_path: mp, manuscript_filename: ms.name, manuscript_mime: mime, manuscript_size_bytes: ms.size }); if (r.error) return fail(r.error.message)
      r = await sb.from('chapters').insert(chapters.map((c, i) => ({ book_id: bid, chapter_number: i + 1, ...c }))); if (r.error) return fail(r.error.message)
    }
    } catch (e: any) { return fail(e?.message || 'Upload failed. Please try again.') }
    location.href = '/me'
  }
  if (u === undefined) return <p className="text-mu">Loading…</p>
  if (!u) return <p>Please <a className="underline" href="/auth">log in</a> to submit a book.</p>
  return (
    <form onSubmit={go} className="card max-w-xl mx-auto p-6 space-y-3 relative overflow-hidden">
      <h1 className="font-serif text-2xl">Submit a book</h1><p className="text-mu text-sm">Every submission is reviewed before it appears publicly.</p>
      <input className="input" placeholder="Title" maxLength={200} value={f.title} onChange={set('title')} required />
      <textarea className="input" rows={5} placeholder="Synopsis" value={f.synopsis} onChange={set('synopsis')} required />
      <fieldset><legend className="text-sm text-mu">Genres (up to 5)</legend><div className="flex flex-wrap gap-2">{g.map(x => <label key={x.id} className="btn2 text-sm"><input type="checkbox" disabled={!sel.includes(x.id) && sel.length >= 5} checked={sel.includes(x.id)} onChange={e => setSel(e.target.checked ? [...sel, x.id] : sel.filter(i => i !== x.id))} /> {x.name}</label>)}</div></fieldset>
      <label className="text-sm text-mu block">Publication date<input type="date" className="input" value={f.date} onChange={set('date')} required /></label>
      <label className="text-sm text-mu block">Cover image (JPG, PNG, WebP, max 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setCv(e.target.files?.[0] || null)} required /></label>
      <select className="input" value={type} onChange={e => setType(e.target.value)}><option value="external">Link to where it is sold or read (Selar, Amazon…)</option><option value="upload">Upload a free book to read on NOMSLORE</option></select>
      {type === 'external' ? <input className="input" placeholder="https://…" value={f.url} onChange={set('url')} required /> :
        <label className="text-sm text-mu block">Manuscript: PDF, Word, EPUB, text or almost any document (max 25 MB). Chapters are found from headings or lines like "Chapter 1". If there are none, your whole text is saved as one chapter, exactly as written.<input type="file" onChange={e => setMs(e.target.files?.[0] || null)} required /></label>}
      <button className="btn w-full" disabled={busy}>{busy ? 'Submitting…' : 'Submit for review'}</button>{msg && <p role="alert" className="text-sm">{msg}</p>}
      <Deco name="feather" className="-right-4 -top-4" />
    </form>
  )
}
