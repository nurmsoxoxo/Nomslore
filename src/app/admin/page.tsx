'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { sb, useUser } from '@/lib/sb'
import AdminExtra from '@/components/AdminExtra'
export default function Admin() {
  const u = useUser()
  const [ok, setOk] = useState<boolean | null>(null), [st, setSt] = useState<any>({}), [q, setQ] = useState<any[]>([]), [pub, setPub] = useState<any[]>([]), [rep, setRep] = useState<any[]>([]), [log, setLog] = useState<any[]>([]), [msg, setMsg] = useState('')
  const load = async () => {
    const s = await sb.rpc('admin_dashboard_stats'); if (s.error) return setOk(false)
    setOk(true); setSt(s.data)
    const [a, b, c, d] = await Promise.all([sb.rpc('admin_pending_queue'), sb.from('books').select('id,title,is_editors_pick,is_featured').eq('status', 'approved').order('approved_at', { ascending: false }).limit(30), sb.from('reports').select('*').in('status', ['open', 'reviewing']).order('created_at').limit(30), sb.from('admin_activity_log').select('*').order('created_at', { ascending: false }).limit(15)])
    setQ(a.data || []); setPub(b.data || []); setRep(c.data || []); setLog(d.data || [])
  }
  useEffect(() => { if (u) load(); else if (u === null) setOk(false) }, [u?.id])
  const run = async (p: any) => { const { error } = await p; setMsg(error ? error.message : 'Done.'); load() }
  const review = (id: string, d: string) => { let r: string | null = null; if (d !== 'approve') { r = prompt('Reason for the author (min 5 characters):'); if (!r) return } run(sb.rpc('admin_review_book', { p_book_id: id, p_decision: d, p_reason: r })) }
  if (ok === null) return <p className="text-mu">Loading…</p>
  if (!ok) return <p>Not authorized.</p>
  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl">Administrator</h1>{msg && <p role="status">{msg}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">{Object.entries(st).map(([k, v]: any) => <div key={k} className="card p-2"><div className="text-mu">{k.replace(/_/g, ' ')}</div><b className="text-lg">{v ?? '–'}</b></div>)}</div>
      <section><h2 className="font-serif text-2xl mb-2">Pending review ({q.length})</h2>{!q.length && <p className="text-mu">Queue is empty.</p>}
        {q.map(b => <div key={b.book_id} className="card p-3 mb-2"><b>{b.title}</b> <span className="text-mu text-sm">by {b.author_name} · {b.source_type} · submitted {new Date(b.submitted_at).toLocaleString()} · pending {b.pending_hours}h / {b.target_hours}h</span>{b.is_overdue && <span className="badge">OVERDUE</span>}
          <div className="flex flex-wrap gap-2 mt-2"><Link className="btn2" href={b.source_type === 'upload' ? `/read?id=${b.book_id}` : `/book?id=${b.book_id}`}>Preview</Link><button className="btn" onClick={() => review(b.book_id, 'approve')}>Approve</button><button className="btn2" onClick={() => review(b.book_id, 'request_changes')}>Request changes</button><button className="btn2" onClick={() => review(b.book_id, 'reject')}>Reject</button></div></div>)}</section>
      <section><h2 className="font-serif text-2xl mb-2">Published books</h2>
        {pub.map(b => <div key={b.id} className="card p-2 mb-2 flex flex-wrap gap-2 items-center"><Link className="underline mr-auto" href={`/book?id=${b.id}`}>{b.title}</Link>
          <button className="btn2" onClick={() => run(sb.rpc('admin_set_book_flags', { p_book_id: b.id, p_editors_pick: !b.is_editors_pick }))}>{b.is_editors_pick ? 'Remove Editor’s Pick' : 'Editor’s Pick'}</button>
          <button className="btn2" onClick={() => run(sb.rpc('admin_set_book_of_week', { p_book_id: b.id }))}>Book of the Week</button>
          <button className="btn2" onClick={() => review(b.id, 'remove')}>Remove</button></div>)}</section>
      <section><h2 className="font-serif text-2xl mb-2">Open reports ({rep.length})</h2>{!rep.length && <p className="text-mu">No open reports.</p>}
        {rep.map(r => <div key={r.id} className="card p-3 mb-2 text-sm"><b>{r.kind}</b> · {r.reason} · {new Date(r.created_at).toLocaleString()}<div className="flex gap-2 mt-2">
          {r.comment_id && <button className="btn2" onClick={async () => { await sb.rpc('admin_moderate_content', { p_type: 'comment', p_id: r.comment_id, p_remove: true, p_reason: r.reason }); run(sb.rpc('admin_resolve_report', { p_report_id: r.id, p_status: 'resolved', p_note: 'Content removed' })) }}>Remove comment</button>}
          <button className="btn2" onClick={() => run(sb.rpc('admin_resolve_report', { p_report_id: r.id, p_status: 'dismissed', p_note: 'No action needed' }))}>Dismiss</button></div></div>)}</section>
      <AdminExtra />
      <section><h2 className="font-serif text-2xl mb-2">Activity log</h2>{log.map(l => <div key={l.id} className="text-sm text-mu">{new Date(l.created_at).toLocaleString()} · {l.action} · {l.target_type}</div>)}</section>
    </div>
  )
}
