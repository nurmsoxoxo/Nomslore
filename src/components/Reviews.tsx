'use client'
import { useCallback, useEffect, useState } from 'react'
import { sb } from '@/lib/sb'
export default function Reviews({ bookId, authorId, user }: any) {
  const [rv, setRv] = useState<any[]>([]), [sc, setSc] = useState<any>({}), [txt, setTxt] = useState(''), [sp, setSp] = useState(false), [msg, setMsg] = useState(''), [shown, setShown] = useState<any>({})
  const load = useCallback(async () => {
    const [a, b] = await Promise.all([sb.from('reviews').select('*,profiles:profiles!reviews_user_id_fkey(username,display_name,is_author)').eq('book_id', bookId).order('created_at', { ascending: false }), sb.from('ratings').select('user_id,score').eq('book_id', bookId)])
    setRv(a.data || []); setSc(Object.fromEntries((b.data || []).map((x: any) => [x.user_id, x.score])))
  }, [bookId])
  useEffect(() => { load() }, [load])
  const mine = user ? rv.find(r => r.user_id === user.id) : null
  useEffect(() => { if (mine) { setTxt(mine.body); setSp(mine.has_spoilers) } }, [mine?.id])
  const save = async (e: any) => {
    e.preventDefault(); if (!user) return (location.href = '/auth'); if (!txt.trim()) return
    const { error } = mine ? await sb.from('reviews').update({ body: txt.trim(), has_spoilers: sp }).eq('id', mine.id) : await sb.from('reviews').insert({ user_id: user.id, book_id: bookId, body: txt.trim(), has_spoilers: sp })
    setMsg(error ? error.message : 'Review saved.'); load()
  }
  const del = async () => { await sb.from('reviews').delete().eq('id', mine.id); setTxt(''); setSp(false); load() }
  const report = async (id: string) => { if (!user) return (location.href = '/auth'); const { error } = await sb.from('reports').insert({ reporter_id: user.id, kind: 'review', review_id: id, reason: 'inappropriate' }); setMsg(error ? (error.code === '23505' ? 'You already reported this.' : error.message) : 'Report sent.') }
  return (
    <section className="mt-8 max-w-2xl"><h2 className="font-serif text-2xl mb-3">Reviews ({rv.length})</h2>
      {user?.id === authorId ? <p className="text-mu text-sm mb-3">Authors can't review their own books.</p> :
        <form onSubmit={save} className="space-y-2 mb-4"><textarea className="input" rows={4} maxLength={5000} placeholder={user ? 'Write your review…' : 'Log in to write a review'} value={txt} onChange={e => setTxt(e.target.value)} />
          <div className="flex items-center gap-3"><label className="text-sm"><input type="checkbox" checked={sp} onChange={e => setSp(e.target.checked)} /> Contains spoilers</label><button className="btn">{mine ? 'Update review' : 'Post review'}</button>{mine && <button type="button" className="text-sm underline" onClick={del}>Delete</button>}</div></form>}
      {msg && <p role="status" className="text-sm mb-2">{msg}</p>}
      <div className="space-y-3">{!rv.length && <p className="text-mu">No reviews yet. Be the first.</p>}
        {rv.map(r => <div key={r.id} className="card p-3"><div className="text-sm"><b>{r.profiles?.display_name}</b>{r.profiles?.is_author && <span className="badge">AUTHOR</span>} <span className="text-mu">@{r.profiles?.username}{sc[r.user_id] ? ` · ★ ${sc[r.user_id]}` : ''}{r.edited_at ? ' · edited' : ''}</span></div>
          {r.has_spoilers && !shown[r.id] ? <button className="btn2 mt-2" onClick={() => setShown({ ...shown, [r.id]: 1 })}>Spoiler — show</button> : <p className="mt-1 whitespace-pre-line">{r.body}</p>}
          {user && r.user_id !== user.id && <button className="text-xs text-mu mt-2" onClick={() => report(r.id)}>Report</button>}</div>)}</div>
    </section>
  )
}
