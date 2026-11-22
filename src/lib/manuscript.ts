import JSZip from 'jszip'
export type Chapter = { title: string; content: string }
const WORDS = 'one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty'
const CH = new RegExp('^\\s*((chapter|part|book|section)\\s+([0-9]{1,3}|[ivxlc]{1,6}|' + WORDS + ')\\b[^\\n]{0,70}|(prologue|epilogue|interlude)\\b[^\\n]{0,40})\\s*$', 'i')
// Finds chapters from "# Title" lines or "Chapter 1"-style lines. With none, the whole text becomes one chapter.
function split(text: string, title: string): Chapter[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const md = lines.some(l => /^#\s+\S/.test(l))
  const isHead = (l: string) => (md ? /^#\s+\S/.test(l) : CH.test(l))
  const heads: string[] = [], bodies: string[][] = [[]]
  for (const l of lines) { if (isHead(l)) { heads.push(l.replace(/^#\s+/, '').trim().slice(0, 300)); bodies.push([]) } else bodies[bodies.length - 1].push(l) }
  const pre = bodies[0].join('\n').trim()
  if (!heads.length) return pre ? [{ title, content: pre }] : []
  const out: Chapter[] = []
  if (pre.length > 120) out.push({ title: 'Beginning', content: pre })
  heads.forEach((h, i) => { const c = bodies[i + 1].join('\n').trim(); if (h && c) out.push({ title: h, content: c }) })
  return out
}
const xml = (s: string, t: any = 'application/xml') => new DOMParser().parseFromString(s, t)
async function docx(f: File, title: string): Promise<Chapter[]> {
  const z = await JSZip.loadAsync(await f.arrayBuffer()); const x = z.file('word/document.xml'); if (!x) return []
  const d = xml(await x.async('string')); const paras: { st: string; t: string }[] = []
  for (const p of Array.from(d.getElementsByTagName('w:p'))) {
    const st = p.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val') || ''
    const t = Array.from(p.getElementsByTagName('w:t')).map(n => n.textContent).join('').trim()
    if (t) paras.push({ st, t })
  }
  for (const lvl of ['1', '2']) {
    const re = new RegExp('^heading ?' + lvl + '$', 'i')
    if (!paras.some(p => re.test(p.st))) continue
    const out: Chapter[] = []; let cur: Chapter | null = null
    for (const p of paras) { if (re.test(p.st)) { cur = { title: p.t.slice(0, 300), content: '' }; out.push(cur) } else if (cur) cur.content += (cur.content ? '\n\n' : '') + p.t }
    const r = out.filter(c => c.content); if (r.length) return r
  }
  return split(paras.map(p => p.t).join('\n\n'), title)
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
const loadScript = (src: string) => new Promise<void>((res, rej) => { const el = document.createElement('script'); el.src = src; el.onload = () => res(); el.onerror = () => rej(new Error('Could not load the PDF reader. Check your connection and try again.')); document.head.appendChild(el) })
async function pdf(f: File, title: string): Promise<Chapter[]> {
  const w: any = window, V = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/'
  if (!w.pdfjsLib) await loadScript(V + 'pdf.min.js')
  w.pdfjsLib.GlobalWorkerOptions.workerSrc = V + 'pdf.worker.min.js'
  const doc = await w.pdfjsLib.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise
  const pages: string[] = []
  for (let n = 1; n <= doc.numPages; n++) {
    const tc = await (await doc.getPage(n)).getTextContent(); let last: number | null = null, out = ''
    for (const it of tc.items as any[]) { const y = it.transform[5]; if (last !== null && Math.abs(y - last) > 2) out += Math.abs(y - last) > 20 ? '\n\n' : ' '; out += it.str; last = y }
    pages.push(out)
  }
  return split(pages.join('\n\n'), title)
}
async function odt(f: File, title: string): Promise<Chapter[]> {
  const z = await JSZip.loadAsync(await f.arrayBuffer()); const x = z.file('content.xml'); if (!x) return []
  const d = xml(await x.async('string')); const lines: string[] = []
  for (const e of Array.from(d.getElementsByTagName('*'))) {
    const t = (e.textContent || '').trim(); if (!t) continue
    if (e.nodeName === 'text:h' && Number(e.getAttribute('text:outline-level') || 1) <= 2) lines.push('# ' + t)
    else if (e.nodeName === 'text:p' && !e.closest('table-cell')) lines.push(t)
  }
  return split(lines.join('\n\n'), title)
}
const rtf = (t: string) => t.replace(/\{\\(fonttbl|colortbl|stylesheet|info|pict)[\s\S]*?\}\s*\}/g, '').replace(/\{\\\*[^{}]*\}/g, '').replace(/\\par[d]?/g, '\n').replace(/\\'([0-9a-f]{2})/gi, (_m, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\u(-?\d+)\??/g, (_m, n) => String.fromCharCode(+n < 0 ? +n + 65536 : +n)).replace(/\\[a-z]+-?\d* ?/gi, '').replace(/[{}]/g, '').replace(/\n{3,}/g, '\n\n')
const html = (t: string) => {
  const d = new DOMParser().parseFromString(t, 'text/html'); d.querySelectorAll('script,style').forEach(e => e.remove())
  d.querySelectorAll('h1,h2').forEach(e => { e.textContent = '\n\n# ' + (e.textContent || '').trim() + '\n\n' })
  d.querySelectorAll('p,div,li,br,h3,h4,h5,h6').forEach(e => e.append('\n\n')); return d.body.textContent || ''
}
// Accepts almost anything: PDF, Word, EPUB, ODT, RTF, HTML, Markdown, plain text, or any other readable text file.
export async function parseManuscript(f: File, title = 'Chapter 1'): Promise<Chapter[]> {
  const ext = (f.name.split('.').pop() || '').toLowerCase()
  if (ext === 'docx') return docx(f, title)
  if (ext === 'epub') return epub(f)
  if (ext === 'pdf') return pdf(f, title)
  if (ext === 'odt') return odt(f, title)
  const t = await f.text()
  if (ext === 'rtf') return split(rtf(t), title)
  if (ext === 'html' || ext === 'htm' || ext === 'xhtml') return split(html(t), title)
  const bad = (t.match(/[\u0000-\u0008\u000e-\u001f\ufffd]/g) || []).length
  return bad > t.length * 0.02 ? [] : split(t, title)
}
