// Utilitários comuns das funções: respostas JSON seguras, leitura limitada do corpo, validações e análise do navegador.

export const PAGINAS = new Set([
  '/', '/plataforma', '/hub-epiper', '/televendas', '/pedido-eletronico', '/integracoes', '/operacao-conectada',
  '/implantacao-guiada', '/evolucao-modulos', '/duvidas', '/fale-com-especialista', '/privacidade', '/termos',
])

const CABECALHOS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
}

export function resposta(status, corpo = null, extra = {}) {
  if (status === 204) return new Response(null, { status, headers: { ...CABECALHOS, ...extra } })
  return new Response(JSON.stringify(corpo), { status, headers: { ...CABECALHOS, ...extra } })
}

/** Lê o corpo com limite de tamanho (nunca confia no Content-Length sozinho). Devolve { texto } ou { erro }. */
export async function lerCorpo(req, maxBytes) {
  const declarado = parseInt(req.headers.get('content-length') || '0', 10)
  if (declarado > maxBytes) return { erro: 'grande_demais' }
  if (!req.body) return { texto: '' }
  const leitor = req.body.getReader()
  const partes = []
  let total = 0
  for (;;) {
    const { done, value } = await leitor.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) { try { await leitor.cancel() } catch { /* nada a fazer */ } return { erro: 'grande_demais' } }
    partes.push(value)
  }
  return { texto: Buffer.concat(partes.map((p) => Buffer.from(p))).toString('utf8') }
}

export function lerJson(texto) {
  try {
    const v = JSON.parse(texto)
    return v && typeof v === 'object' ? v : null
  } catch {
    return null
  }
}

export function origemPermitida(req, origens) {
  const o = req.headers.get('origin')
  if (!o) return false // navegador sempre manda Origin em POST; sem Origin não é o nosso site
  return origens.includes(o)
}

export function ipDe(req, context) {
  return (context && context.ip) || req.headers.get('x-nf-client-connection-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || ''
}

// ---------------------------------------------------------------- validação e limpeza
export const agora = () => Math.floor(Date.now() / 1000)

export function texto(valor, max) {
  if (typeof valor !== 'string') return ''
  // eslint-disable-next-line no-control-regex
  return valor.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

export function inteiro(valor, min, max, padrao = 0) {
  const n = Math.trunc(Number(valor))
  if (!Number.isFinite(n)) return padrao
  return Math.min(Math.max(n, min), max)
}

export function decimal(valor, min, max, padrao = 0) {
  const n = Number(valor)
  if (!Number.isFinite(n)) return padrao
  return Math.min(Math.max(n, min), max)
}

export const ehId = (v) => typeof v === 'string' && /^[a-z0-9]{10,32}$/.test(v)

/** "/pedido-eletronico.html?x=1#a" → "/pedido-eletronico"; devolve null se não for uma página do site. */
export function normalizarPagina(caminho) {
  if (typeof caminho !== 'string' || caminho.length > 200) return null
  let p = caminho.split('#')[0].split('?')[0].toLowerCase()
  if (!p.startsWith('/')) return null
  p = p.replace(/\/index(\.html)?$/, '/').replace(/\.html$/, '')
  if (p.length > 1) p = p.replace(/\/+$/, '')
  return PAGINAS.has(p) ? p : null
}

export function hostDe(referencia) {
  if (typeof referencia !== 'string' || !referencia) return ''
  try {
    return new URL(referencia).hostname.replace(/^www\./, '').slice(0, 80)
  } catch {
    return /^[a-z0-9.-]{3,80}$/i.test(referencia) ? referencia.replace(/^www\./, '').toLowerCase() : ''
  }
}

// ---------------------------------------------------------------- navegador
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|gtmetrix|curl|wget|python-requests|httpclient|axios|node-fetch|postman|facebookexternalhit|preview|monitor|uptime|scrapy|go-http/i

export function analisarUA(ua = '') {
  const u = String(ua)
  const bot = !u || BOT.test(u)
  const so = /Windows/i.test(u) ? 'Windows' : /Android/i.test(u) ? 'Android' : /iPhone|iPad|iOS/i.test(u) ? 'iOS' : /Mac OS X|Macintosh/i.test(u) ? 'macOS' : /Linux/i.test(u) ? 'Linux' : 'Outro'
  const navegador = /Edg\//i.test(u) ? 'Edge' : /OPR\/|Opera/i.test(u) ? 'Opera' : /Firefox\//i.test(u) ? 'Firefox' : /Chrome\//i.test(u) ? 'Chrome' : /Safari\//i.test(u) ? 'Safari' : 'Outro'
  const dispositivo = /iPad|Tablet/i.test(u) ? 'tablet' : /Mobi|iPhone|Android/i.test(u) ? 'celular' : 'computador'
  return { bot, so, navegador, dispositivo }
}

export function geoDe(context) {
  const g = (context && context.geo) || {}
  return {
    pais: texto(g.country && (g.country.code || g.country.name) ? g.country.code || g.country.name : '', 4),
    regiao: texto(g.subdivision && (g.subdivision.code || g.subdivision.name) ? g.subdivision.code || g.subdivision.name : '', 40),
    cidade: texto(g.city || '', 60),
  }
}
