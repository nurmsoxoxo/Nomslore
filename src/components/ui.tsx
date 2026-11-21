'use client'
import Link from 'next/link'
import { useRef } from 'react'
import { cover } from '@/lib/sb'
import { ChevronLeft, ChevronRight } from 'lucide-react'
export function Card({ b, fluid }: { b: any; fluid?: boolean }) {
  return (
    <Link href={`/book?id=${b.id}`} className={'bookcard block ' + (fluid ? 'w-full' : 'w-40 sm:w-44 shrink-0 snap-start')}>
      <img src={cover(b.cover_path)} alt={b.title} loading="lazy" className="book-cover aspect-[2/3] w-full object-cover" />
      {b.genres?.[0] && <div className="cat">{b.genres[0]}</div>}
      <div className="gl font-glow text-lg leading-snug line-clamp-2 mt-1 transition-colors">{b.title}</div>
      <div className="text-sm text-mu">{b.author_name}{b.author_is_author && <span className="badge">AUTHOR</span>}</div>
      <div className="text-xs mt-1 text-mu"><b className="text-tx">★ {b.avg_rating ?? '–'}</b> · {b.rating_count} rating{b.rating_count === 1 ? '' : 's'}{b.comment_count > 0 && ` · ${b.comment_count} comment${b.comment_count === 1 ? '' : 's'}`}</div>
    </Link>
  )
}
export function Row({ title, books }: { title: string; books?: any[] }) {
  const r = useRef<HTMLDivElement>(null)
  const go = (d: number) => r.current?.scrollBy({ left: d * 320, behavior: 'smooth' })
  return (
    <section className="my-10">
      <div className="flex items-end justify-between mb-5 pb-3 border-b border-bd">
        {title ? <h2 className="font-serif">{title}</h2> : <span />}
        <div className="flex gap-1"><button className="btn2 !p-2" aria-label="Scroll left" onClick={() => go(-1)}><ChevronLeft size={18} /></button><button className="btn2 !p-2" aria-label="Scroll right" onClick={() => go(1)}><ChevronRight size={18} /></button></div>
      </div>
      {!books ? <p className="text-mu text-sm">Loading…</p> : !books.length ? <p className="empty">Nothing here yet. Approved books will appear here.</p> :
        <div ref={r} className="flex gap-5 overflow-x-auto snap-x pb-3">{books.map(b => <Card key={b.id} b={b} />)}</div>}
    </section>
  )
}
export const Logo = ({ full }: { full?: boolean }) => (
  <img src={full ? '/logo-full.png' : '/logo.png'} alt="Nomslore" className={'logo-img w-auto ' + (full ? 'h-28 md:h-32' : 'h-10 md:h-12')} />
)
