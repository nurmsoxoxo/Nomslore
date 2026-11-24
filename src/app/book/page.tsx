'use client'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { sb, cover, useUser, qs } from '@/lib/sb'
import { Row } from '@/components/ui'
import Reviews from '@/components/Reviews'
import { Heart, Star, BookOpen, ExternalLink } from 'lucide-react'
export default function Book() {
  const u = useUser()
  const [id, setId] = useState<string | null>(null), [b, setB] = useState<any>(), [cm, setCm] = useState<any[]>([]), [sim, setSim] = useState<any[]>()
  const [my, setMy] = useState<any>({}), [msg, setMsg] = useState(''), [txt, setTxt] = useState(''), [sp, setSp] = useState(false), [rt, setRt] = useState<string | null>(null), [shown, setShown] = useState<any>({}), [lerr, setLerr] = useState('')
  useEffect(() => { setId(qs('id')) }, [])
  const load = useCallback(async () => {
    if (!id) return
    const r = await sb.from('books').select('*,profiles:profiles!books_author_id_fkey(username,display_name,is_author),book_genres(genres(name))').eq('id', id).maybeSingle()
    setB(r.data || null); setLerr(r.error?.message || '')
    sb.from('comments').select('*,profiles:profiles!comments_user_id_fkey(username,display_name,is_author)').eq('book_id', id).order('created_at').then(x => setCm(x.data || []))
    if (u) {
      const [a, l, f] = await Promise.all([sb.from('ratings').select('score').eq('book_id', id).eq('user_id', u.id).maybeSingle(), sb.from('likes').select('book_id').eq('book_id', id).eq('user_id', u.id).maybeSingle(), sb.from('favourites').select('book_id').eq('book_id', id).eq('user_id', u.id).maybeSingle()])
      setMy({ score: a.data?.score, liked: !!l.data, fav: !!f.data })
    }
  }, [id, u?.id])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (id) { sb.rpc('record_book_view', { p_book_id: id }).then(() => {}); sb.rpc('similar_books', { p_book_id: id, p_limit: 10 }).then(x => setSim(x.data || [])) } }, [id])
  const need = () => { if (!u) { location.href = '/auth'; return true } return false }
  const act = async (p: any) => { const { error } = await p; setMsg(error ? error.message : ''); load() }
  const rate = (v: string) => { if (need() || !v) return; const s = +v; act(my.score != null ? sb.from('ratings').update({ score: s }).eq('book_id', id).eq('user_id', u.id) : sb.from('ratings').insert({ user_id: u.id, book_id: id, score: s })) }
  const toggle = (t: string, on: boolean) => { if (need()) return; act(on ? sb.from(t).delete().eq('book_id', id).eq('user_id', u.id) : sb.from(t).insert({ user_id: u.id, book_id: id })) }
  const post = (e: any) => { e.preventDefault(); if (need() || !txt.trim()) return; act(sb.from('comments').insert({ book_id: id, user_id: u.id, body: txt.trim(), has_spoilers: sp, parent_id: rt })); setTxt(''); setRt(null); setSp(false) }
  const report = async (cid: string) => { if (need()) return; const { error } = await sb.from('reports').insert({ reporter_id: u.id, kind: 'comment', comment_id: cid, reason: 'inappropriate' }); setMsg(error ? (error.code === '23505' ? 'You already reported this.' : error.message) : 'Report sent. Thank you.') }
  if (b === undefined) return <p className="text-mu">Loading…</p>
  if (!b) return <p>This book is not available.{lerr && <span className="block text-sm text-mu mt-1">{lerr}</span>}</p>
  const tops = cm.filter(c => !c.parent_id)
  const Item = ({ c }: { c: any }) => (
    <div className="card p-3">
      <div className="text-sm"><b>{c.profiles?.display_name}</b>{c.profiles?.is_author && <span className="badge">AUTHOR</span>} <span className="text-mu">@{c.profiles?.username}{c.edited_at ? ' · edited' : ''}</span></div>
      {c.has_spoilers && !shown[c.id] ? <button className="btn2 mt-2" onClick={() => setShown({ ...shown, [c.id]: 1 })}>Spoiler — show</button> : <p className="mt-1 whitespace-pre-line">{c.body}</p>}
      <div className="text-xs text-mu mt-2 flex gap-3">{u && <button onClick={() => setRt(c.parent_id || c.id)}>Reply</button>}{u && c.user_id !== u.id && <button onClick={() => report(c.id)}>Report</button>}{u && c.user_id === u.id && <button onClick={() => act(sb.from('comments').delete().eq('id', c.id))}>Delete</button>}</div>
    </div>
  )
  return (
    <>
      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        <div className="relative w-60"><img src={cover(b.cover_path)} alt={b.title} className="book-cover w-full aspect-[2/3] object-cover" /><span className="ribbon" aria-hidden="true" /></div>
        <div>
          <h1 className="font-glow text-3xl md:text-5xl leading-tight">{b.title}</h1>
          <p>by <Link className="underline" href={`/author?u=${b.profiles?.username}`}>{b.profiles?.display_name}</Link>{b.profiles?.is_author && <span className="badge">AUTHOR</span>}</p>
          <p className="text-mu text-sm">{b.book_genres.map((g: any) => g.genres.name).join(', ')} · Published {b.publication_date} · Added {new Date(b.approved_at || b.submitted_at).toLocaleDateString()}</p>
          <p className="my-3 whitespace-pre-line">{b.synopsis}</p>
          <p className="text-lg">★ {b.avg_rating ?? '–'} / 10 <span className="text-mu text-sm">({b.rating_count} ratings) · {b.like_count} likes</span></p>
          {b.status !== 'approved' && <p className="badge !ml-0 inline-block my-2">Not public: {b.status}</p>}
          <div className="flex flex-wrap gap-2 mt-3 items-center">
            {b.source_type === 'external' ? <a className="btn" href={b.external_url} target="_blank" rel="noopener noreferrer nofollow"><ExternalLink size={16} className="inline mr-1" />Get Book</a> : <Link className="btn" href={`/read?id=${b.id}`}><BookOpen size={16} className="inline mr-1" />Read Book</Link>}
            <button className="btn2" onClick={() => toggle('likes', my.liked)}><Heart size={16} className="inline" fill={my.liked ? 'currentColor' : 'none'} /> {my.liked ? 'Liked' : 'Like'}</button>
            <button className="btn2" onClick={() => toggle('favourites', my.fav)}><Star size={16} className="inline" fill={my.fav ? 'currentColor' : 'none'} /> {my.fav ? 'Favourite' : 'Add to favourites'}</button>
            <select className="input !w-auto" value={my.score ?? ''} onChange={e => rate(e.target.value)} aria-label="Your rating"><option value="">Rate…</option>{Array.from({ length: 19 }, (_, i) => (i + 2) / 2).map(n => <option key={n} value={n}>{n.toFixed(1)}</option>)}</select>
          </div>
          {msg && <p role="status" className="text-sm mt-2">{msg}</p>}
        </div>
      </div>
      <Reviews bookId={b.id} authorId={b.author_id} user={u} />
      <section className="mt-8 max-w-2xl"><h2 className="font-serif text-2xl mb-3">Comments ({cm.length})</h2>
        <form onSubmit={post} className="space-y-2 mb-4"><textarea className="input" rows={3} maxLength={2000} placeholder={u ? (rt ? 'Write a reply…' : 'Share your thoughts…') : 'Log in to comment'} value={txt} onChange={e => setTxt(e.target.value)} />
          <div className="flex items-center gap-3"><label className="text-sm"><input type="checkbox" checked={sp} onChange={e => setSp(e.target.checked)} /> Contains spoilers</label><button className="btn">{rt ? 'Reply' : 'Post'}</button>{rt && <button type="button" className="text-sm underline" onClick={() => setRt(null)}>Cancel reply</button>}</div></form>
        <div className="space-y-3">{!tops.length && <p className="text-mu">No comments yet. Start the conversation.</p>}{tops.map(c => <div key={c.id} className="space-y-2"><Item c={c} />{cm.filter(r => r.parent_id === c.id).map(r => <div key={r.id} className="ml-6"><Item c={r} /></div>)}</div>)}</div>
      </section>
      <Row title="Similar books" books={sim} />
    </>
  )
}
