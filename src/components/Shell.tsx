'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { sb, useUser } from '@/lib/sb'
import { Logo } from './ui'
import { LogOut, Menu, Search, X } from 'lucide-react'
const MAP: any = { 'autumn-light': 'light', 'autumn-dark': 'dark', 'autumn-cream': 'cream' }
export default function Shell({ children }: { children: React.ReactNode }) {
  const u = useUser()
  const [adm, setAdm] = useState(false), [n, setN] = useState(0), [th, setTh] = useState('light'), [q, setQ] = useState(''), [open, setOpen] = useState(false)
  const pick = (t: string, save = true) => { setTh(t); document.documentElement.dataset.theme = t; localStorage.setItem('theme', t); if (save && u) sb.from('profiles').update({ theme: 'autumn-' + t }).eq('id', u.id).then(() => {}) }
  useEffect(() => { pick(localStorage.getItem('theme') || 'light', false) }, [])
  useEffect(() => {
    if (!u) { setAdm(false); setN(0); return }
    sb.rpc('admin_dashboard_stats').then(r => setAdm(!!r.data))
    sb.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false).then(r => setN(r.count || 0))
    sb.from('profiles').select('theme').eq('id', u.id).single().then(r => { if (r.data && MAP[r.data.theme]) pick(MAP[r.data.theme], false) })
  }, [u?.id])
  const links: any[] = [['/explore', 'Explore', true], ['/submit', 'Submit a book', !!u], ['/me', 'My shelf', !!u], ['/settings', 'Settings', !!u], ['/admin', 'Admin', adm]].filter(l => l[2])
  const nav = (cls: string) => links.map(l => <Link key={l[0]} className={cls} href={l[0]} onClick={() => setOpen(false)}>{l[1]}{l[0] === '/me' && n > 0 && <span className="badge">{n}</span>}</Link>)
  const search = (
    <form className="relative" onSubmit={e => { e.preventDefault(); location.href = '/explore?q=' + encodeURIComponent(q) }}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mu" />
      <input className="input !pl-9 !py-2 text-sm" placeholder="Search books…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search books" />
    </form>
  )
  const theme = (
    <select className="input !w-auto !py-2 text-sm" value={th} onChange={e => pick(e.target.value)} aria-label="Theme">
      <option value="light">Autumn Light</option><option value="dark">Autumn Dark</option><option value="cream">Autumn Cream</option>
    </select>
  )
  return (
    <>
      <header className="topbar">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" aria-label="Nomslore home" className="shrink-0"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-6 ml-6 text-sm" aria-label="Main">{nav('navlink')}</nav>
          <div className="ml-auto hidden md:flex items-center gap-3">
            <div className="w-48">{search}</div>{theme}
            {u ? <button className="btn2 !p-2.5" onClick={() => sb.auth.signOut()} aria-label="Log out"><LogOut size={16} /></button> : <Link className="btn !py-2" href="/auth">Log in</Link>}
          </div>
          <div className="ml-auto md:hidden flex items-center gap-2">
            {!u && <Link className="btn !py-2 !px-4 text-sm" href="/auth">Log in</Link>}
            <button className="btn2 !p-2.5" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t border-bd bg-bg2 px-4 py-4 space-y-4">
            <nav className="flex flex-col" aria-label="Mobile">{nav('mlink')}</nav>
            {search}
            <div className="flex items-center justify-between">{theme}{u && <button className="btn2" onClick={() => { sb.auth.signOut(); setOpen(false) }}>Log out</button>}</div>
          </div>
        )}
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 min-h-[70vh]">{children}</main>
      <footer className="mt-14 border-t border-bd bg-bg2">
        <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div><Logo full /><p className="font-disc italic text-xl mt-3 text-pr">Discover. Read. Rate. Review.</p></div>
          <div><h3 className="font-serif mb-3">Explore</h3><ul className="space-y-2 text-sm"><li><Link href="/explore">Explore books</Link></li>{u && <li><Link href="/submit">Submit a book</Link></li>}{u && <li><Link href="/me">My shelf</Link></li>}</ul></div>
          <div><h3 className="font-serif mb-3">Community</h3><ul className="space-y-2 text-sm"><li><Link href="/guidelines">Community guidelines</Link></li></ul></div>
        </div>
        <div className="orn" aria-hidden="true">❦</div>
      </footer>
    </>
  )
}
