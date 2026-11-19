import JSZip from 'jszip'
export type Chapter = { title: string; content: string }
const txt = (t: string): Chapter[] => t.split(/^#\s+/m).slice(1).map(p => { const i = p.indexOf('\n'); return { title: p.slice(0, i < 0 ? p.length : i).trim(), content: (i < 0 ? '' : p.slice(i + 1)).trim() } }).filter(c => c.title && c.content)
const xml = (s: string, t: any = 'application/xml') => new DOMParser().parseFromString(s, t)
async function docx(f: File): Promise<Chapter[]> {
  const z = await JSZip.loadAsync(await f.arrayBuffer()); const x = z.file('word/document.xml'); if (!x) return []
  const d = xml(await x.async('string')); const out: Chapter[] = []; let cur: Chapter | null = null
  for (const p of Array.from(d.getElementsByTagName('w:p'))) {
    const st = p.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val') || ''
    const t = Array.from(p.getElementsByTagName('w:t')).map(n => n.textContent).join('').trim()
    if (/^heading ?1$/i.test(st)) { if (t) { cur = { title: t, content: '' }; out.push(cur) } } else if (cur && t) cur.content += (cur.content ? '\n\n' : '') + t
  }
  return out.filter(c => c.content)
}
async function epub(f: File): Promise<Chapter[]> {
  const z = await JSZip.loadAsync(await f.arrayBuffer()); const c = z.file('META-INF/container.xml'); if (!c) return []
  const opfPath = xml(await c.async('string')).getElementsByTagName('rootfile')[0]?.getAttribute('full-path'); const of = opfPath && z.file(opfPath); if (!opfPath || !of) return []
  const opf = xml(await of.async('string')); const base = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : ''
  const man: any = {}; Array.from(opf.getElementsByTagName('item')).forEach(i => { man[i.getAttribute('id') || ''] = i.getAttribute('href') })
  const out: Chapter[] = []
  for (const r of Array.from(opf.getElementsByTagName('itemref'))) {
    const href = man[r.getAttribute('idref') || '']; const file = href && z.file(decodeURIComponent(base + href.split('#')[0])); if (!file) continue
    const body = xml(await file.async('string'), 'application/xhtml+xml').getElementsByTagName('body')[0]; if (!body) continue
    const lines = Array.from(body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,blockquote')).map(e => (e.textContent || '').trim()).filter(Boolean)
    const head = body.querySelector('h1,h2,h3')?.textContent?.trim()
    const content = lines.filter((l, i) => !(i === 0 && l === head)).join('\n\n')
    if (content) out.push({ title: head || `Chapter ${out.length + 1}`, content })
  }
  return out
}
export async function parseManuscript(f: File): Promise<Chapter[]> {
  const n = f.name.toLowerCase()
  return n.endsWith('.docx') ? docx(f) : n.endsWith('.epub') ? epub(f) : txt(await f.text())
}
