'use client'
import { useEffect, useState } from 'react'
import { sb, useUser } from '@/lib/sb'
import { Deco } from '@/components/ui'
const pub = (path: string) => sb.storage.from('avatars').getPublicUrl(path).data.publicUrl
export default function Settings() {
  const u = useUser()
  const [p, setP] = useState<any>(), [msg, setMsg] = useState(''), [pw, setPw] = useState('')
  useEffect(() => { if (u) sb.from('profiles').select('*').eq('id', u.id).single().then(r => setP(r.data)) }, [u?.id])
  const save = async (e: any) => { e.preventDefault(); const { error } = await sb.from('profiles').update({ display_name: p.display_name.trim(), bio: p.bio?.trim() || null }).eq('id', u.id); setMsg(error ? error.message : 'Profile saved.') }
  const upload = async (e: any, kind: 'avatar' | 'banner') => {
    const f = e.target.files?.[0]; if (!f) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > (kind === 'avatar' ? 2e6 : 3e6)) return setMsg(`Use a JPG, PNG or WebP under ${kind === 'avatar' ? 2 : 3} MB.`)
    setMsg('Uploading…')
    const path = `${u.id}/${kind}-${crypto.randomUUID()}.${f.type.split('/')[1]}`
    const r = await sb.storage.from('avatars').upload(path, f, { contentType: f.type }); if (r.error) return setMsg(r.error.message)
    const col = kind === 'avatar' ? 'avatar_path' : 'banner_path'
    const { error } = await sb.from('profiles').update({ [col]: path }).eq('id', u.id)
    if (!error) setP({ ...p, [col]: path }); setMsg(error ? error.message : kind === 'avatar' ? 'Photo updated.' : 'Banner updated.')
  }
  const chPw = async () => { const { error } = await sb.auth.updateUser({ password: pw }); setMsg(error ? error.message : 'Password changed.'); if (!error) setPw('') }
  if (u === undefined || (u && !p)) return <p className="text-mu">Loading…</p>
  if (!u) return <p>Please <a className="underline" href="/auth">log in</a>.</p>
  return (
    <div className="card max-w-xl mx-auto p-6 space-y-5 relative overflow-hidden"><h1 className="font-serif text-2xl">Account settings</h1>
      <div className="flex items-center gap-4">
        {p.avatar_path ? <img src={pub(p.avatar_path)} alt="" className="w-24 h-24 shrink-0 aspect-square rounded-full object-cover border-2 border-sand" /> : <div className="w-24 h-24 shrink-0 aspect-square rounded-full bg-ac grid place-items-center font-serif text-3xl">{p.display_name[0]}</div>}
        <label className="text-sm text-mu min-w-0">Profile picture (square works best, max 2 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => upload(e, 'avatar')} /></label>
      </div>
      <div className="space-y-2">
        {p.banner_path ? <img src={pub(p.banner_path)} alt="" className="w-full h-28 object-cover rounded-md border border-bd" /> : <div className="w-full h-28 rounded-md border border-dashed border-sand bg-ac/50 grid place-items-center text-sm text-mu">Bookshelf banner (optional)</div>}
        <label className="text-sm text-mu block">Wide banner or bookshelf cover design (JPG, PNG or WebP, max 3 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => upload(e, 'banner')} /></label>
      </div>
      <form onSubmit={save} className="space-y-3"><label className="text-sm text-mu block">Display name<input className="input" maxLength={60} value={p.display_name} onChange={e => setP({ ...p, display_name: e.target.value })} required /></label>
        <label className="text-sm text-mu block">Biography<textarea className="input" rows={4} maxLength={1000} value={p.bio || ''} onChange={e => setP({ ...p, bio: e.target.value })} /></label><button className="btn">Save profile</button></form>
      <div className="space-y-2"><input className="input" type="password" minLength={8} placeholder="New password (8+ characters)" value={pw} onChange={e => setPw(e.target.value)} /><button className="btn2" disabled={pw.length < 8} onClick={chPw}>Change password</button></div>
      {msg && <p role="status" className="text-sm">{msg}</p>}<Deco name="bookmark" className="-right-3 -bottom-5" /></div>
  )
}
