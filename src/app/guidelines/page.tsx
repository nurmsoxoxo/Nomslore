'use client'
import { useEffect, useState } from 'react'
import { sb } from '@/lib/sb'
export default function Guidelines() {
  const [t, setT] = useState('')
  useEffect(() => { sb.from('platform_settings').select('value').eq('key', 'community_guidelines').single().then(r => setT(r.data?.value || '')) }, [])
  return (<div className="max-w-2xl"><h1 className="font-serif text-3xl mb-4">Community guidelines</h1><p className="whitespace-pre-line leading-relaxed">{t || 'Loading…'}</p></div>)
}
