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
export const Logo = ({ full }: { full?: boolean }) => (
  <img src={full ? '/logo-full.png' : '/logo.png'} alt="NOMSLORE" className={'logo-img w-auto ' + (full ? 'h-28 md:h-32' : 'h-12 md:h-14')} />
)
