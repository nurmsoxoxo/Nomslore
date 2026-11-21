'use client'
import { useEffect, useState } from 'react'
import { sb, qs } from '@/lib/sb'
import { Card } from '@/components/ui'
const PAGE = 24
export default function Explore() {
  const [f, setF] = useState<any>({ q: '', genre: '', min: '', sort: 'recent', from: '', to: '' })
  const [books, setBooks] = useState<any[]>([]), [genres, setGenres] = useState<any[]>([]), [more, setMore] = useState(false), [busy, setBusy] = useState(true), [sug, setSug] = useState<any[]>([])
  const run = async (x: any, off = 0) => {
    setBusy(true)
    const { data } = await sb.rpc('search_books', { p_query: x.q || null, p_genres: x.genre ? [x.genre] : null, p_min_rating: x.min ? +x.min : null, p_added_from: x.from || null, p_added_to: x.to ? x.to + 'T23:59:59' : null, p_sort: x.sort, p_limit: PAGE, p_offset: off })
    setBooks(off ? p => [...p, ...(data || [])] : data || []); setMore((data || []).length === PAGE); setBusy(false)
  }
  useEffect(() => { sb.from('genres').select('name,slug').eq('is_active', true).order('sort_order').then(r => setGenres(r.data || [])); const x = { ...f, q: qs('q') || '', genre: qs('genre') || '' }; setF(x); run(x) }, [])
  const set = (k: string, v: string) => { const x = { ...f, [k]: v }; setF(x); if (k !== 'q') run(x); else if (v.length > 1) sb.rpc('search_suggestions', { p_query: v }).then(r => setSug(r.data || [])); else setSug([]) }
  return (
    <>
      <h1 className="font-serif text-3xl mb-4">Explore Books</h1>
      <form className="grid sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6" onSubmit={e => { e.preventDefault(); setSug([]); run(f) }}>
        <div className="sm:col-span-2"><input className="input" list="sg" placeholder="Title, author or genre" value={f.q} onChange={e => set('q', e.target.value)} /><datalist id="sg">{sug.map((s, i) => <option key={i} value={s.label} />)}</datalist></div>
        <select className="input" value={f.genre} onChange={e => set('genre', e.target.value)}><option value="">All genres</option>{genres.map(g => <option key={g.slug} value={g.slug}>{g.name}</option>)}</select>
        <select className="input" value={f.min} onChange={e => set('min', e.target.value)}><option value="">Any rating</option>{[9, 8, 7, 6, 5].map(n => <option key={n} value={n}>{n}+ / 10</option>)}</select>
        <select className="input" value={f.sort} onChange={e => set('sort', e.target.value)}><option value="recent">Recently Added</option><option value="trending">Trending</option><option value="rating">Highest Rated</option><option value="popular">Most Popular</option><option value="reviewed">Most Reviewed</option><option value="alpha">Alphabetical</option></select>
        <button className="btn">Search</button>
        <label className="text-sm text-mu">Added from<input type="date" className="input" value={f.from} onChange={e => set('from', e.target.value)} /></label>
        <label className="text-sm text-mu">Added to<input type="date" className="input" value={f.to} onChange={e => set('to', e.target.value)} /></label>
      </form>
      {busy && !books.length ? <p className="text-mu">Loading…</p> : !books.length ? <p className="text-mu">No books match. Try fewer filters.</p> :
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-8">{books.map(b => <div key={b.id} className="flex"><Card b={b} fluid /></div>)}</div>}
      {more && <div className="text-center mt-6"><button className="btn" disabled={busy} onClick={() => run(f, books.length)}>Load more</button></div>}
    </>
  )
}
