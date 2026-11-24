'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { sb, useUser, qs } from '@/lib/sb'
import { Row } from '@/components/ui'
const pub = (path: string) => sb.storage.from('avatars').getPublicUrl(path).data.publicUrl
export default function Author() {
  const me = useUser()
  const [p, setP] = useState<any>(), [books, setBooks] = useState<any[]>(), [top, setTop] = useState<any[]>(), [s, setS] = useState<any>({}), [fol, setFol] = useState(false), [fav, setFav] = useState<any[]>([]), [rat, setRat] = useState<any[]>([]), [msg, setMsg] = useState('')
  const load = async () => {
    const r = await sb.from('profiles').select('*').eq('username', (qs('u') || '').toLowerCase()).maybeSingle(); setP(r.data || null); if (!r.data) return
    const id = r.data.id
    sb.from('book_cards').select('*').eq('author_id', id).order('approved_at', { ascending: false }).then(x => setBooks(x.data || []))
    sb.from('book_cards').select('*').eq('author_id', id).order('rating_count', { ascending: false }).order('like_count', { ascending: false }).order('view_count', { ascending: false }).limit(8).then(x => setTop(x.data || []))
    sb.rpc('get_author_stats', { p_author: id }).then(x => setS(x.data?.[0] || {}))
    sb.from('favourites').select('books:books!favourites_book_id_fkey(id,title)').eq('user_id', id).then(x => setFav(x.data || []))
    sb.from('ratings').select('score,books:books!ratings_book_id_fkey(id,title)').eq('user_id', id).order('created_at', { ascending: false }).limit(30).then(x => setRat(x.data || []))
  }
  useEffect(() => { load() }, [])
  useEffect(() => { if (me && p) sb.from('author_follows').select('author_id').eq('follower_id', me.id).eq('author_id', p.id).maybeSingle().then(x => setFol(!!x.data)) }, [me?.id, p?.id])
  const toggle = async () => {
    if (!me) return (location.href = '/auth')
    const { error } = await (fol ? sb.from('author_follows').delete().eq('follower_id', me.id).eq('author_id', p.id) : sb.from('author_follows').insert({ follower_id: me.id, author_id: p.id }))
    if (error) return setMsg(error.message); setMsg(''); setFol(!fol); sb.rpc('get_author_stats', { p_author: p.id }).then(x => setS(x.data?.[0] || {}))
  }
  if (p === undefined) return <p className="text-mu">Loading…</p>
  if (!p) return <p>Profile not found.</p>
  const L = ({ x }: { x: any }) => x ? <Link className="underline" href={`/book?id=${x.id}`}>{x.title}</Link> : null
  return (
    <>
      {p.banner_path ? <img src={pub(p.banner_path)} alt="" className="w-full aspect-[3.4/1] object-cover rounded-lg border border-bd" /> : <div className="w-full aspect-[3.4/1] rounded-lg border border-bd" style={{ background: 'linear-gradient(120deg,var(--ac),var(--sand))' }} />}
      <div className="flex gap-4 items-start mt-4">
        {p.avatar_path ? <img src={pub(p.avatar_path)} alt="" className="w-24 h-24 md:w-28 md:h-28 shrink-0 aspect-square rounded-full object-cover border-2 border-sand" /> : <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 aspect-square rounded-full bg-ac border-2 border-sand grid place-items-center font-serif text-3xl">{p.display_name[0]}</div>}
        <div className="min-w-0 pt-1"><h1 className="font-serif text-3xl">{p.display_name}{p.is_author && <span className="badge">AUTHOR</span>}</h1><p className="text-mu">@{p.username}</p>
          {p.is_author && <p className="text-sm mt-1">{s.follower_count ?? 0} followers · {s.book_count ?? 0} books · ★ {s.avg_rating ?? '–'} avg ({s.rating_count ?? 0} ratings)</p>}</div>
        {p.is_author && me?.id !== p.id && <button className="btn ml-auto mt-1 shrink-0" onClick={toggle}>{fol ? 'Following' : 'Follow'}</button>}
      </div>
      {msg && <p role="alert" className="text-sm mt-2">{msg}</p>}{p.bio && <p className="mt-4 max-w-2xl whitespace-pre-line">{p.bio}</p>}
      {p.is_author && <Row title="Published books" books={books} />}
      {p.is_author && (top?.length || 0) > 1 && <Row title="Catalogue · most reviewed & popular" books={top} />}
      <div className="grid md:grid-cols-2 gap-6 mt-6"><section><h2 className="font-serif text-xl mb-2">Favourite books</h2>{!fav.length && <p className="text-mu text-sm">None yet.</p>}{fav.map((x, i) => <div key={i} className="text-sm"><L x={x.books} /></div>)}</section>
        <section><h2 className="font-serif text-xl mb-2">Books rated</h2>{!rat.length && <p className="text-mu text-sm">None yet.</p>}{rat.map((x, i) => <div key={i} className="text-sm">★ {x.score} <L x={x.books} /></div>)}</section></div>
    </>
  )
}
