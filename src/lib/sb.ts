'use client'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
export const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!)
export const cover = (p: string) => sb.storage.from('covers').getPublicUrl(p).data.publicUrl
export function useUser() {
  const [u, setU] = useState<any>(undefined)
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setU(data.session?.user ?? null))
    const { data } = sb.auth.onAuthStateChange((_e, s) => setU(s?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])
  return u
}
export const qs = (k: string) => (typeof window === 'undefined' ? null : new URLSearchParams(location.search).get(k))
