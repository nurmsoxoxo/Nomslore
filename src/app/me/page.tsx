'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { sb, useUser } from '@/lib/sb'
const T: any = { book_liked: 'liked', book_commented: 'commented on', comment_reply: 'replied to your comment on', review_comment: 'responded to your review of', followed_author_published: 'An author you follow published', submission_approved: 'Approved:', submission_rejected: 'Rejected:', changes_requested: 'Changes requested:', book_removed: 'Removed:' }
export default function Me() {
  const u = useUser()
  const [fl, setFl] = useState<any[]>([]), [books, setBooks] = useState<any[]>([]), [why, setWhy] = useState<any>({}), [ns, setNs] = useState<any[]>([]), [fav, setFav] = useState<any[]>([]), [rat, setRat] = useState<any[]>([]), [prog, setProg] = useState<any[]>([])
  const load = async () => {
    const [a, b, c, d, e, f] = await Promise.all([sb.from('books').select('id,title,status,submitted_at,source_type').eq('author_id', u.id).order('submitted_at', { ascending: false }), sb.from('book_private').select('book_id,rejection_reason'), sb.from('notifications').select('*,books(title)').order('created_at', { ascending: false }).limit(30), sb.from('favourites').select('books(id,title)').eq('user_id', u.id), sb.from('ratings').select('score,books(id,title)').eq('user_id', u.id), sb.from('reading_progress').select('progress_percent,completed,books(id,title)').eq('user_id', u.id).order('last_read_at', { ascending: false })])
    setBooks(a.data || []); setWhy(Object.fromEntries((b.data || []).map((x: any) => [x.book_id, x.rejection_reason]))); setNs(c.data || []); setFav(d.data || []); setRat(e.data || []); setProg(f.data || [])
  }
  useEffect(() => { if (u) { load(); sb.from('author_follows').select('profiles:profiles!author_follows_author_id_fkey(username,display_name)').eq('follower_id', u.id).then(r => setFl(r.data || [])) } }, [u?.id])
  if (u === undefined) return <p className="text-mu">Loading…</p>
  if (!u) return <p>Please <Link className="underline" href="/auth">log in</Link>.</p>
  const L = ({ x }: { x: any }) => x ? <Link className="underline" href={`/book?id=${x.id}`}>{x.title}</Link> : <>a book</>
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section><h1 className="font-serif text-2xl mb-3">My submissions</h1>
        {!books.length && <p className="text-mu">You haven't submitted a book yet. <Link className="underline" href="/submit">Submit one</Link>.</p>}
        {books.map(b => <div key={b.id} className="card p-3 mb-2"><L x={b} /> <span className="badge">{b.status.replace('_', ' ')}</span><div className="text-xs text-mu">Submitted {new Date(b.submitted_at).toLocaleString()}</div>{why[b.id] && b.status !== 'approved' && <p className="text-sm mt-1">Reason: {why[b.id]}</p>}</div>)}
        <h2 className="font-serif text-xl mt-6 mb-2">Reading progress</h2>{!prog.length && <p className="text-mu text-sm">Nothing in progress.</p>}{prog.map((p, i) => <div key={i} className="text-sm"><L x={p.books} /> — {p.completed ? 'finished' : p.progress_percent + '%'}</div>)}
        <h2 className="font-serif text-xl mt-6 mb-2">Followed authors</h2>{!fl.length && <p className="text-mu text-sm">You are not following anyone yet.</p>}{fl.map((x, i) => <div key={i} className="text-sm"><Link className="underline" href={`/author?u=${x.profiles?.username}`}>{x.profiles?.display_name}</Link></div>)}
        <h2 className="font-serif text-xl mt-6 mb-2">Favourites</h2>{!fav.length && <p className="text-mu text-sm">No favourites yet.</p>}{fav.map((x, i) => <div key={i} className="text-sm"><L x={x.books} /></div>)}
        <h2 className="font-serif text-xl mt-6 mb-2">My ratings</h2>{!rat.length && <p className="text-mu text-sm">No ratings yet.</p>}{rat.map((x, i) => <div key={i} className="text-sm">★ {x.score} <L x={x.books} /></div>)}</section>
      <section><div className="flex justify-between items-center mb-3"><h2 className="font-serif text-2xl">Notifications</h2><button className="btn2" onClick={async () => { await sb.from('notifications').update({ is_read: true }).eq('user_id', u.id).eq('is_read', false); load() }}>Mark all read</button></div>
        {!ns.length && <p className="text-mu">You're all caught up.</p>}
        {ns.map(n => <div key={n.id} className={'card p-3 mb-2 text-sm ' + (n.is_read ? 'opacity-70' : 'border-pr')}>{!n.is_read && <span className="badge !ml-0 mr-1">NEW</span>}{T[n.type]} <L x={n.book_id ? { id: n.book_id, title: n.books?.title } : null} />{n.message && <p className="text-mu">{n.message}</p>}</div>)}</section>
    </div>
  )
}
