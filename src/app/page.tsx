'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { sb, useUser } from '@/lib/sb'
import { Row } from '@/components/ui'
export default function Home() {
  const u = useUser()
  const [d, setD] = useState<any>({}), [q, setQ] = useState(''), [sec, setSec] = useState<any>({})
  useEffect(() => {
    sb.from('homepage_sections').select('key,is_enabled').then(r => setSec(Object.fromEntries((r.data || []).map((x: any) => [x.key, x.is_enabled]))))
    const top = (col: string, f?: (x: any) => any) => { let x = sb.from('book_cards').select('*').order(col, { ascending: false, nullsFirst: false }).limit(12); return f ? f(x) : x }
    Promise.all([top('trending_score'), top('avg_rating'), top('approved_at'), top('approved_at', x => x.eq('is_editors_pick', true)), sb.rpc('popular_genres', { p_limit: 8 }), sb.rpc('current_book_of_the_week'), sb.rpc('featured_authors_list')])
      .then(([t, h, r, e, g, w, a]) => setD({ t: t.data, h: h.data, r: r.data, e: e.data, g: g.data, w: w.data, a: a.data }))
  }, [])
  useEffect(() => { if (u) sb.from('recently_viewed').select('book_id').order('viewed_at', { ascending: false }).limit(12).then(async r => { const ids = (r.data || []).map((x: any) => x.book_id); const b = ids.length ? (await sb.from('book_cards').select('*').in('id', ids)).data : []; setD((p: any) => ({ ...p, v: b })) }) }, [u?.id])
  const on = (k: string) => sec[k] !== false
  const surprise = async () => { const { data } = await sb.rpc('random_book'); if (data) location.href = '/book?id=' + data; else alert('No books to discover yet.') }
  return (
    <>
      <section className={'hero ' + (on('hero') ? '' : 'hidden')}>
        <p className="eyebrow">Discover · Read · Rate · Review</p>
        <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] font-semibold">Every Story Deserves to Be <em className="text-pr">Discovered.</em></h1>
        <p className="mt-4 text-mu text-lg">Discover remarkable books, explore new authors, and share your thoughts with a community of readers.</p>
        <form className="mt-6 flex gap-2" onSubmit={e => { e.preventDefault(); location.href = '/explore?q=' + encodeURIComponent(q) }}>
          <input className="input" placeholder="Search by title, author or genre" value={q} onChange={e => setQ(e.target.value)} aria-label="Search books" />
          <button className="btn">Search</button>
        </form>
        <div className="mt-4 flex gap-3"><Link className="btn" href="/explore">Explore Books</Link>{!u && <Link className="btn2 py-2 px-4" href="/auth">Join NOMSLORE</Link>}</div>
      </section>
      {on('trending') && <Row title="Trending Books" books={d.t} />}
      {on('highest_rated') && <Row title="Highest Rated Books" books={d.h} />}
      {on('recently_added') && <Row title="Recently Added" books={d.r} />}
      <section className={'my-8 ' + (on('popular_genres') ? '' : 'hidden')}><h2 className="font-serif text-2xl mb-3">Popular Genres</h2>
        <div className="flex flex-wrap gap-2">{(d.g || []).map((g: any) => <Link key={g.id} className="btn2" href={`/explore?genre=${g.slug}`}>{g.name} ({g.book_count})</Link>)}</div></section>
      <section className={'my-8 ' + (on('featured_authors') ? '' : 'hidden')}><h2 className="font-serif text-2xl mb-3">Featured Authors</h2>
        {d.a && !d.a.length ? <p className="text-mu text-sm">No featured authors yet.</p> : <div className="grid sm:grid-cols-3 gap-3">{(d.a || []).map((a: any) => <Link key={a.author_id} href={`/author?u=${a.username}`} className="card p-3 block"><b className="font-serif">{a.display_name}</b><span className="badge">AUTHOR</span><div className="text-mu text-sm">{a.book_count} books · {a.follower_count} followers</div></Link>)}</div>}</section>
      {on('editors_picks') && <Row title="Editor's Picks" books={d.e} />}
      {u && on('recently_viewed') && <Row title="Recently Viewed" books={d.v} />}
      <section className={'my-8 ' + (on('book_of_the_week') ? '' : 'hidden')}><h2 className="font-serif text-2xl mb-3">Book of the Week</h2>
        {d.w && d.w[0] ? <Row title="" books={d.w} /> : <p className="text-mu text-sm">Not chosen yet.</p>}</section>
      <section className={'my-8 card p-6 text-center ' + (on('surprise_me') ? '' : 'hidden')}><h2 className="font-serif text-2xl">Surprise Me</h2><p className="text-mu mb-3">Let NOMSLORE pick something for you.</p><button className="btn" onClick={surprise}>Surprise me</button></section>
    </>
  )
}
