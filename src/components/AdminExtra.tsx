'use client'
import { useEffect, useState } from 'react'
import { sb } from '@/lib/sb'
const slug = (n: string) => n.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export default function AdminExtra() {
  const [users, setUsers] = useState<any[]>([]), [s, setS] = useState(''), [genres, setGenres] = useState<any[]>([]), [sec, setSec] = useState<any[]>([]), [feat, setFeat] = useState<string[]>([]), [ng, setNg] = useState(''), [msg, setMsg] = useState('')
  const load = async (q = s) => {
    const [a, b, c, d] = await Promise.all([sb.rpc('admin_list_users', { p_search: q || null, p_limit: 50, p_offset: 0 }), sb.from('genres').select('*').order('sort_order'), sb.from('homepage_sections').select('*').order('sort_order'), sb.from('featured_authors').select('author_id')])
    setUsers(a.data || []); setGenres(b.data || []); setSec(c.data || []); setFeat((d.data || []).map((x: any) => x.author_id))
  }
  useEffect(() => { load() }, [])
  const run = async (p: any) => { const { error } = await p; setMsg(error ? error.message : 'Saved.'); load() }
  const suspend = (u: any) => { const r = u.status === 'active' ? prompt('Reason for suspension:') : 'Restored'; if (r) run(sb.rpc('admin_set_account_status', { p_user_id: u.id, p_status: u.status === 'active' ? 'suspended' : 'active', p_reason: r })) }
  return (
    <>
      {msg && <p role="status">{msg}</p>}
      <section><h2 className="font-serif text-2xl mb-2">Users</h2>
        <form className="flex gap-2 mb-2" onSubmit={e => { e.preventDefault(); load(s) }}><input className="input" placeholder="Search name, username or email" value={s} onChange={e => setS(e.target.value)} /><button className="btn">Search</button></form>
        {users.map(u => <div key={u.id} className="card p-2 mb-2 text-sm flex flex-wrap gap-2 items-center"><span className="mr-auto"><b>{u.display_name}</b> @{u.username} · {u.email}{u.is_author && <span className="badge">AUTHOR</span>}{u.status === 'suspended' && <span className="badge">SUSPENDED</span>} <span className="text-mu">{u.book_count} books</span></span>
          {u.is_author && <button className="btn2" onClick={() => run(feat.includes(u.id) ? sb.from('featured_authors').delete().eq('author_id', u.id) : sb.from('featured_authors').insert({ author_id: u.id, sort_order: feat.length + 1 }))}>{feat.includes(u.id) ? 'Unfeature' : 'Feature author'}</button>}
          <button className="btn2" onClick={() => suspend(u)}>{u.status === 'active' ? 'Suspend' : 'Restore'}</button></div>)}</section>
      <section><h2 className="font-serif text-2xl mb-2">Genres</h2>
        <form className="flex gap-2 mb-2" onSubmit={e => { e.preventDefault(); if (slug(ng)) { run(sb.from('genres').insert({ name: ng.trim(), slug: slug(ng), sort_order: genres.length + 1 })); setNg('') } }}><input className="input" placeholder="New genre name" value={ng} onChange={e => setNg(e.target.value)} /><button className="btn">Add genre</button></form>
        {genres.map(g => <div key={g.id} className="card p-2 mb-2 text-sm flex flex-wrap gap-2 items-center"><span className="mr-auto">{g.name} <span className="text-mu">/{g.slug}{g.is_active ? '' : ' · hidden'}</span></span>
          <button className="btn2" onClick={() => { const n = prompt('Rename genre', g.name); if (n && n.trim()) run(sb.from('genres').update({ name: n.trim() }).eq('id', g.id)) }}>Rename</button>
          <button className="btn2" onClick={() => run(sb.from('genres').update({ is_active: !g.is_active }).eq('id', g.id))}>{g.is_active ? 'Hide' : 'Show'}</button>
          <button className="btn2" onClick={() => confirm('Delete this genre? This fails if books use it.') && run(sb.from('genres').delete().eq('id', g.id))}>Delete</button></div>)}</section>
      <section><h2 className="font-serif text-2xl mb-2">Homepage sections</h2>
        {sec.map(x => <div key={x.key} className="card p-2 mb-2 text-sm flex gap-2 items-center"><span className="mr-auto">{x.title}</span><button className="btn2" onClick={() => run(sb.from('homepage_sections').update({ is_enabled: !x.is_enabled, updated_at: new Date().toISOString() }).eq('key', x.key))}>{x.is_enabled ? 'Shown — hide' : 'Hidden — show'}</button></div>)}</section>
    </>
  )
}
