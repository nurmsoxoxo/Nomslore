'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { sb, useUser } from '@/lib/sb'
import { Logo } from './ui'
import { LogOut, Settings, Search } from 'lucide-react'
const MAP: any = { 'autumn-light': 'light', 'autumn-dark': 'dark', 'autumn-cream': 'cream' }
export default function Shell({ children }: { children: React.ReactNode }) {
  const u = useUser()
  const [adm, setAdm] = useState(false), [n, setN] = useState(0), [th, setTh] = useState('light'), [q, setQ] = useState('')
  const pick = (t: string, save = true) => { setTh(t); document.documentElement.dataset.theme = t; localStorage.setItem('theme', t); if (save && u) sb.from('profiles').update({ theme: 'autumn-' + t }).eq('id', u.id).then(() => {}) }
  useEffect(() => { pick(localStorage.getItem('theme') || 'light', false) }, [])
  useEffect(() => {
    if (!u) { setAdm(false); setN(0); return }
    sb.rpc('admin_dashboard_stats').then(r => setAdm(!!r.data))
    sb.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false).then(r => setN(r.count || 0))
    sb.from('profiles').select('theme').eq('id', u.id).single().then(r => { if (r.data && MAP[r.data.theme]) pick(MAP[r.data.theme], false) })
  }, [u?.id])
  return (
    <>
      <header className="topbar">
        <div className="max-w-6xl mx-auto px-4 pt-3 pb-2 flex items-center gap-3">
          <Link href="/" aria-label="NOMSLORE home" className="mr-auto"><Logo /></Link>
          <select className="input !w-auto !py-1.5 text-sm" value={th} onChange={e => pick(e.target.value)} aria-label="Theme">
            <option value="light">Autumn Light</option><option value="dark">Autumn Dark</option><option value="cream">Autumn Cream</option>
          </select>
          {u ? <button className="btn2" onClick={() => sb.auth.signOut()} aria-label="Log out"><LogOut size={15} className="inline" /></button> : <Link className="btn !py-1.5" href="/auth">Log in</Link>}
        </div>
        <nav className="max-w-6xl mx-auto px-4 pb-3 flex items-center gap-5 overflow-x-auto text-[15px]">
          <Link className="navlink" href="/explore">Explore</Link>
          {u && <Link className="navlink" href="/submit">Submit a book</Link>}
          {u && <Link className="navlink" href="/me">My shelf{n > 0 && <span className="badge">{n}</span>}</Link>}
          {u && <Link className="navlink flex items-center gap-1" href="/settings"><Settings size={14} />Settings</Link>}
          {adm && <Link className="navlink" href="/admin">Admin</Link>}
          <form className="ml-auto relative shrink-0" onSubmit={e => { e.preventDefault(); location.href = '/explore?q=' + encodeURIComponent(q) }}>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mu" />
            <input className="input !w-44 !pl-9 !py-1.5 !rounded-full text-sm" placeholder="Search books…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search" />
          </form>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 min-h-[70vh]">{children}</main>
      <footer className="mt-10 border-t border-bd bg-bg2 text-mu text-sm py-10 text-center space-y-2">
        <div className="flex justify-center"><Logo full /></div>
        <p className="font-serif italic text-lg text-tx">Discover. Read. Rate. Review.</p>
        <p><Link href="/guidelines" className="underline">Community guidelines</Link></p>
      </footer>
    </>
  )
}
