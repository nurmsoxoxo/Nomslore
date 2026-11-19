'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { sb, useUser } from '@/lib/sb'
import { Logo } from './ui'
import { LogOut, Settings } from 'lucide-react'
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
      <header className="bg-bg2 border-b border-bd">
        <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/" aria-label="NOMSLORE home"><Logo /></Link>
          <Link href="/explore">Explore</Link>
          {u && <Link href="/submit">Submit a book</Link>}
          {u && <Link href="/me">My shelf{n > 0 && <span className="badge">{n}</span>}</Link>}
          {u && <Link href="/settings" className="flex items-center gap-1"><Settings size={15} />Settings</Link>}{adm && <Link href="/admin">Admin</Link>}
          <form className="ml-auto flex gap-2" onSubmit={e => { e.preventDefault(); location.href = '/explore?q=' + encodeURIComponent(q) }}>
            <input className="input !w-40" placeholder="Search books, authors…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search" />
          </form>
          <select className="input !w-auto" value={th} onChange={e => pick(e.target.value)} aria-label="Theme">
            <option value="light">Autumn Light</option><option value="dark">Autumn Dark</option><option value="cream">Autumn Cream</option>
          </select>
          {u ? <button className="btn2" onClick={() => sb.auth.signOut()}><LogOut size={14} className="inline mr-1" />Log out</button> : <Link className="btn" href="/auth">Log in</Link>}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 min-h-[70vh]">{children}</main>
      <footer className="border-t border-bd text-mu text-sm py-6 text-center">
        <Logo /> <div>Discover. Read. Rate. Review. · <Link href="/guidelines" className="underline">Community guidelines</Link></div>
      </footer>
    </>
  )
}
