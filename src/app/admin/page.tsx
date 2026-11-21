'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { sb, useUser } from '@/lib/sb'
import AdminExtra from '@/components/AdminExtra'
const DONE: any = { approve: 'Book approved and published.', reject: 'Book rejected. The author was notified.', request_changes: 'Changes requested. The author was notified.', remove: 'Book removed.' }
export default function Admin() {
  const u = useUser()
  const [ok, setOk] = useState<boolean | null>(null), [st, setSt] = useState<any>({}), [q, setQ] = useState<any[]>([]), [pub, setPub] = useState<any[]>([]), [rep, setRep] = useState<any[]>([]), [log, setLog] = useState<any[]>([]), [chap, setChap] = useState<any>({})
  const [busy, setBusy] = useState<string | null>(null), [toast, setToast] = useState<any>(null), [ask, setAsk] = useState<any>(null), [reason, setReason] = useState(''), [del, setDel] = useState<string | null>(null)
  const say = (type: string, text: string) => { setToast({ type, text }); setTimeout(() => setToast(null), type === 'err' ? 8000 : 3000) }
  const loadQueue = async () => {
    const a = await sb.rpc('admin_pending_queue'); const rows: any[] = a.data || []; setQ(rows)
    const up = rows.filter(b => b.source_type === 'upload').map(b => b.book_id)
    if (!up.length) return setChap({})
    const c = await sb.from('chapters').select('book_id').in('book_id', up); const m: any = {}
    ;(c.data || []).forEach((x: any) => { m[x.book_id] = (m[x.book_id] || 0) + 1 }); setChap(m)
  }
  const loadRest = async () => {
    const [s, b, c, d] = await Promise.all([sb.rpc('admin_dashboard_stats'), sb.from('books').select('id,title,is_editors_pick,is_featured').eq('status', 'approved').order('approved_at', { ascending: false }).limit(30), sb.from('reports').select('*').in('status', ['open', 'reviewing']).order('created_at').limit(30), sb.from('admin_activity_log').select('*').order('created_at', { ascending: false }).limit(15)])
    if (s.error) return setOk(false)
    setOk(true); setSt(s.data); setPub(b.data || []); setRep(c.data || []); setLog(d.data || [])
  }
  useEffect(() => { if (u) { loadQueue(); loadRest() } else if (u === null) setOk(false) }, [u?.id])
  const act = async (id: string, d: string, why?: string) => {
    if (busy) return
    setBusy(id + d)
    const { error } = await sb.rpc('admin_review_book', { p_book_id: id, p_decision: d, p_reason: why || null })
    setBusy(null)
    if (error) return say('err', error.message)
    setAsk(null); setReason(''); setQ(x => x.filter(b => b.book_id !== id)); if (d === 'remove') setPub(x => x.filter(b => b.id !== id))
    say('ok', DONE[d]); loadRest()
  }
  const start = (id: string, d: string) => { if (d === 'approve') return act(id, d); setAsk({ id, d }); setReason('') }
  const run = async (key: string, p: any, okText: string) => { if (busy) return; setBusy(key); const { error } = await p; setBusy(null); if (error) return say('err', error.message); say('ok', okText); loadRest() }
  const delBook = async (id: string) => {
    if (del !== id) { setDel(id); setTimeout(() => setDel(null), 4000); return }
    if (busy) return
    setBusy(id + 'del'); const { error } = await sb.from('books').delete().eq('id', id); setBusy(null); setDel(null)
    if (error) return say('err', error.message)
    setQ(x => x.filter(b => b.book_id !== id)); say('ok', 'Incomplete submission deleted.'); loadRest()
  }
  const box = (id: string) => ask?.id === id ? (
    <div className="mt-3 space-y-2">
      <textarea className="input" rows={3} autoFocus placeholder="Reason for the author (min 5 characters)" value={reason} onChange={e => setReason(e.target.value)} />
      <div className="flex gap-2"><button className="btn min-h-[44px]" disabled={!!busy || reason.trim().length < 5} onClick={() => act(id, ask.d, reason.trim())}>{busy === id + ask.d ? 'Sending…' : 'Confirm'}</button><button className="btn2 min-h-[44px]" onClick={() => setAsk(null)}>Cancel</button></div>
    </div>) : null
  if (ok === null) return <p className="text-mu">Loading…</p>
  if (!ok) return <p>Not authorized.</p>
  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl">Administrator</h1>
      {toast && <div role="status" className={'fixed z-50 left-4 right-4 bottom-4 md:left-auto md:w-96 card p-3 text-sm ' + (toast.type === 'err' ? 'border-pr' : '')}>{toast.type === 'err' ? '⚠ ' : '✓ '}{toast.text}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">{Object.entries(st).map(([k, v]: any) => <div key={k} className="card p-2"><div className="text-mu">{k.replace(/_/g, ' ')}</div><b className="text-lg">{v ?? '–'}</b></div>)}</div>
      <section><h2 className="font-serif text-2xl mb-2">Pending review ({q.length})</h2>{!q.length && <p className="text-mu">Queue is empty.</p>}
        {q.map(b => { const bad = b.source_type === 'upload' && !(chap[b.book_id] > 0); return (
          <div key={b.book_id} className="card p-3 mb-2"><b>{b.title}</b> <span className="text-mu text-sm">by {b.author_name} · {b.source_type} · submitted {new Date(b.submitted_at).toLocaleString()} · pending {b.pending_hours}h / {b.target_hours}h</span>{b.is_overdue && <span className="badge">OVERDUE</span>}
            {bad && <p className="text-sm mt-2">⚠ No chapters were saved for this upload, so it can't be approved. Delete it and ask the author to submit again.</p>}
            <div className="flex flex-wrap gap-2 mt-2"><Link className="btn2 min-h-[44px] grid place-items-center" href={b.source_type === 'upload' ? `/read?id=${b.book_id}` : `/book?id=${b.book_id}`}>Preview</Link>
              <button className="btn min-h-[44px]" disabled={!!busy || bad} onClick={() => start(b.book_id, 'approve')}>{busy === b.book_id + 'approve' ? 'Approving…' : 'Approve'}</button>
              <button className="btn2 min-h-[44px]" disabled={!!busy} onClick={() => start(b.book_id, 'request_changes')}>Request changes</button>
              <button className="btn2 min-h-[44px]" disabled={!!busy} onClick={() => start(b.book_id, 'reject')}>Reject</button>
              {bad && <button className="btn2 min-h-[44px]" disabled={!!busy} onClick={() => delBook(b.book_id)}>{busy === b.book_id + 'del' ? 'Deleting…' : del === b.book_id ? 'Tap again to delete' : 'Delete incomplete'}</button>}</div>
            {box(b.book_id)}</div>) })}</section>
      <section><h2 className="font-serif text-2xl mb-2">Published books</h2>
        {pub.map(b => <div key={b.id} className="card p-2 mb-2"><div className="flex flex-wrap gap-2 items-center"><Link className="underline mr-auto" href={`/book?id=${b.id}`}>{b.title}</Link>
          <button className="btn2 min-h-[44px]" disabled={!!busy} onClick={() => run(b.id + 'pick', sb.rpc('admin_set_book_flags', { p_book_id: b.id, p_editors_pick: !b.is_editors_pick }), 'Updated.')}>{b.is_editors_pick ? 'Remove Editor’s Pick' : 'Editor’s Pick'}</button>
          <button className="btn2 min-h-[44px]" disabled={!!busy} onClick={() => run(b.id + 'week', sb.rpc('admin_set_book_of_week', { p_book_id: b.id }), 'Book of the Week set.')}>Book of the Week</button>
          <button className="btn2 min-h-[44px]" disabled={!!busy} onClick={() => start(b.id, 'remove')}>Remove</button></div>{box(b.id)}</div>)}</section>
      <section><h2 className="font-serif text-2xl mb-2">Open reports ({rep.length})</h2>{!rep.length && <p className="text-mu">No open reports.</p>}
        {rep.map(r => <div key={r.id} className="card p-3 mb-2 text-sm"><b>{r.kind}</b> · {r.reason} · {new Date(r.created_at).toLocaleString()}<div className="flex gap-2 mt-2">
          {r.comment_id && <button className="btn2 min-h-[44px]" disabled={!!busy} onClick={async () => { const x = await sb.rpc('admin_moderate_content', { p_type: 'comment', p_id: r.comment_id, p_remove: true, p_reason: r.reason }); if (x.error) return say('err', x.error.message); run(r.id + 'rm', sb.rpc('admin_resolve_report', { p_report_id: r.id, p_status: 'resolved', p_note: 'Content removed' }), 'Comment removed.') }}>Remove comment</button>}
          <button className="btn2 min-h-[44px]" disabled={!!busy} onClick={() => run(r.id + 'dis', sb.rpc('admin_resolve_report', { p_report_id: r.id, p_status: 'dismissed', p_note: 'No action needed' }), 'Report dismissed.')}>Dismiss</button></div></div>)}</section>
      <AdminExtra />
      <section><h2 className="font-serif text-2xl mb-2">Activity log</h2>{log.map(l => <div key={l.id} className="text-sm text-mu">{new Date(l.created_at).toLocaleString()} · {l.action} · {l.target_type}</div>)}</section>
    </div>
  )
}
