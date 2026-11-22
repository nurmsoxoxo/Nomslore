'use client'
import { useState } from 'react'
import { sb } from '@/lib/sb'
import { Deco } from '@/components/ui'
export default function Auth() {
  const [mode, setMode] = useState<'in' | 'up' | 'reset'>('in')
  const [f, setF] = useState({ email: '', password: '', username: '', name: '' }), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  const go = async (e: any) => {
    e.preventDefault(); setBusy(true); setMsg('')
    let err: any
    if (mode === 'in') { err = (await sb.auth.signInWithPassword({ email: f.email, password: f.password })).error; if (!err) location.href = '/' }
    else if (mode === 'up') {
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(f.username)) { setMsg('Username: 3–30 letters, numbers or underscores.'); setBusy(false); return }
      const r = await sb.auth.signUp({ email: f.email, password: f.password, options: { data: { username: f.username.toLowerCase(), display_name: f.name || f.username }, emailRedirectTo: location.origin } })
      err = r.error; if (!err) setMsg(r.data.session ? 'Welcome to NOMSLORE!' : 'Check your email to confirm your account.')
    } else { err = (await sb.auth.resetPasswordForEmail(f.email, { redirectTo: location.origin + '/settings' })).error; if (!err) setMsg('Password reset link sent. Check your email.') }
    if (err) setMsg(err.message); setBusy(false)
  }
  return (
    <form onSubmit={go} className="card max-w-md mx-auto p-6 space-y-3 relative overflow-hidden">
      <h1 className="font-serif text-2xl">{mode === 'in' ? 'Log in' : mode === 'up' ? 'Join NOMSLORE' : 'Reset password'}</h1>
      {mode === 'up' && <><input className="input" placeholder="Username" value={f.username} onChange={set('username')} required /><input className="input" placeholder="Display name" value={f.name} onChange={set('name')} /></>}
      <input className="input" type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
      {mode !== 'reset' && <input className="input" type="password" placeholder="Password (8+ characters)" minLength={8} value={f.password} onChange={set('password')} required />}
      <button className="btn w-full" disabled={busy}>{mode === 'in' ? 'Log in' : mode === 'up' ? 'Create account' : 'Send reset link'}</button>
      {msg && <p role="status" className="text-sm">{msg}</p>}
      <div className="text-sm text-mu flex justify-between"><button type="button" className="underline" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'Create an account' : 'I have an account'}</button><button type="button" className="underline" onClick={() => setMode('reset')}>Forgot password?</button></div>
      <Deco name="book" className="-right-4 -bottom-6" />
    </form>
  )
}
