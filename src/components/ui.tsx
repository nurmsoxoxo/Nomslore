'use client'
import Link from 'next/link'
import { useRef } from 'react'
import { cover } from '@/lib/sb'
import { ChevronLeft, ChevronRight } from 'lucide-react'
export function Card({ b }: { b: any }) {
  return (
    <Link href={`/book?id=${b.id}`} className="card lift w-40 shrink-0 snap-start overflow-hidden block">
      <img src={cover(b.cover_path)} alt={b.title} className="book-cover aspect-[2/3] w-full object-cover" loading="lazy" />
      <div className="p-2 text-sm">
        <div className="font-serif font-semibold line-clamp-2">{b.title}</div>
        <div className="text-mu">{b.author_name}{b.author_is_author && <span className="badge">AUTHOR</span>}</div>
        <div className="text-mu text-xs">{(b.genres || []).join(', ')}</div>
        <div className="text-xs mt-1">★ {b.avg_rating ?? '–'} ({b.rating_count})</div>
      </div>
    </Link>
  )
}
export function Row({ title, books }: { title: string; books?: any[] }) {
  const r = useRef<HTMLDivElement>(null)
  const go = (d: number) => r.current?.scrollBy({ left: d * 320, behavior: 'smooth' })
  return (
    <section className="my-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-2xl">{title}</h2>
        <div className="flex gap-1"><button className="btn2" aria-label="Scroll left" onClick={() => go(-1)}><ChevronLeft size={18} /></button><button className="btn2" aria-label="Scroll right" onClick={() => go(1)}><ChevronRight size={18} /></button></div>
      </div>
      {!books ? <p className="text-mu text-sm">Loading…</p> : !books.length ? <p className="text-mu text-sm">Nothing here yet. Approved books will appear here.</p> :
        <div ref={r} className="flex gap-3 overflow-x-auto snap-x pb-2">{books.map(b => <Card key={b.id} b={b} />)}</div>}
    </section>
  )
}
export const Logo = () => (
  <span className="inline-flex items-center gap-2.5 select-none">
    <svg width="38" height="32" viewBox="0 0 40 34" fill="none" aria-hidden="true">
      <path d="M20 12C15 9 8 9 3 11v20c5-2 12-2 17 1 5-3 12-3 17-1V11c-5-2-12-2-17 1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="var(--ac)" />
      <path d="M20 12v20" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 16c3-.8 6-.6 10 .8M7 21c3-.8 6-.6 10 .8M33 16c-3-.8-6-.6-10 .8M33 21c-3-.8-6-.6-10 .8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity=".55" />
      <path d="M20 1c5 2.5 6.5 7 3 10.5C18.5 10 16.5 5.5 20 1z" fill="var(--pr)" />
      <path d="M20 3.5v6.5" stroke="var(--bg2)" strokeWidth="1" strokeLinecap="round" />
    </svg>
    <span className="font-serif font-bold uppercase leading-none" style={{ letterSpacing: '.24em', fontSize: '1.55rem' }}>Nomslore</span>
  </span>
)
