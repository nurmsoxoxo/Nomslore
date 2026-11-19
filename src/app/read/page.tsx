'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { sb, useUser, qs } from '@/lib/sb'
import { Minus, Plus, Sun, Moon, Bookmark } from 'lucide-react'
export default function Read() {
  const u = useUser()
  const [id, setId] = useState<string | null>(null), [toc, setToc] = useState<any[]>([]), [n, setN] = useState(0), [ch, setCh] = useState<any>(), [size, setSize] = useState(18), [dark, setDark] = useState(false), [err, setErr] = useState(''), [msg, setMsg] = useState(''), [bm, setBm] = useState<any[]>([])
  useEffect(() => { setId(qs('id')) }, [])
  useEffect(() => {
    if (!id || u === undefined) return
    sb.rpc('book_toc', { p_book_id: id }).then(async r => {
      if (r.error) return setErr('This book is not available for reading.')
      setToc(r.data || [])
      let start = r.data?.[0]?.chapter_number || 1
      if (u) { const p = await sb.from('reading_progress').select('chapter_number').eq('book_id', id).eq('user_id', u.id).maybeSingle(); if (p.data) start = p.data.chapter_number; sb.from('bookmarks').select('*').eq('book_id', id).eq('user_id', u.id).order('created_at').then(x => setBm(x.data || [])) }
      setN(start)
    })
  }, [id, u?.id])
  useEffect(() => {
    if (!id || !n) return
    sb.rpc('read_chapter', { p_book_id: id, p_chapter: n }).then(r => { if (r.error) return setErr(r.error.message); const c = r.data?.[0]; setCh(c); window.scrollTo(0, 0)
      if (u && c) sb.from('reading_progress').upsert({ user_id: u.id, book_id: id, chapter_number: n, progress_percent: Math.round(n / c.total_chapters * 100), completed: n === c.total_chapters && !c.next_chapter, last_read_at: new Date().toISOString() }).then(() => {}) })
  }, [id, n])
  const mark = async () => { if (!u) return (location.href = '/auth'); const h = document.body.scrollHeight - innerHeight; const { error } = await sb.from('bookmarks').insert({ user_id: u.id, book_id: id, chapter_number: n, scroll_percent: h > 0 ? Math.round(scrollY / h * 100) : 0 }); setMsg(error ? error.message : 'Bookmark saved.'); sb.from('bookmarks').select('*').eq('book_id', id).eq('user_id', u.id).then(x => setBm(x.data || [])) }
  const jump = (b: any) => { setN(b.chapter_number); setTimeout(() => { const h = document.body.scrollHeight - innerHeight; scrollTo(0, h * b.scroll_percent / 100) }, 600) }
  if (err) return <p>{err} <Link className="underline" href="/explore">Back to books</Link></p>
  const bg = dark ? { background: '#1f1b18', color: '#eadfcb' } : { background: '#f7f1e6', color: '#3a2a20' }
  return (
    <div className="rounded-lg p-4 md:p-8" style={bg}>
      <div className="flex flex-wrap gap-2 items-center mb-4 text-sm">
        <Link className="btn2" href={`/book?id=${id}`}>← Book page</Link>
        <select className="input !w-auto" value={n} onChange={e => setN(+e.target.value)} aria-label="Table of contents">{toc.map(t => <option key={t.chapter_number} value={t.chapter_number}>{t.chapter_number}. {t.title}</option>)}</select>
        <button className="btn2" onClick={() => setSize(s => Math.max(14, s - 2))} aria-label="Smaller text"><Minus size={14} /></button><button className="btn2" onClick={() => setSize(s => Math.min(32, s + 2))} aria-label="Larger text"><Plus size={14} /></button>
        <button className="btn2" onClick={() => setDark(!dark)}>{dark ? <Sun size={14} className="inline" /> : <Moon size={14} className="inline" />} {dark ? 'Light page' : 'Dark page'}</button><button className="btn2" onClick={mark}><Bookmark size={14} className="inline" /> Bookmark</button>{msg && <span role="status">{msg}</span>}
      </div>
      {!ch ? <p>Loading…</p> : <article className="max-w-2xl mx-auto"><h1 className="font-serif text-3xl mb-6">{ch.title}</h1><div className="font-serif whitespace-pre-wrap" style={{ fontSize: size, lineHeight: 1.75 }}>{ch.content}</div>
        <div className="flex justify-between mt-10"><button className="btn" disabled={!ch.prev_chapter} onClick={() => setN(ch.prev_chapter)}>Previous</button><span className="text-sm opacity-70">Chapter {ch.chapter_number} of {ch.total_chapters}</span><button className="btn" disabled={!ch.next_chapter} onClick={() => setN(ch.next_chapter)}>Next</button></div></article>}
      {bm.length > 0 && <div className="max-w-2xl mx-auto mt-8 text-sm"><b>Your bookmarks:</b> {bm.map(x => <button key={x.id} className="btn2 mr-2 mt-1" onClick={() => jump(x)}>Ch. {x.chapter_number} · {x.scroll_percent}%</button>)}</div>}
    </div>
  )
}
