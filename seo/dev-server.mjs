// Servidor LOCAL de teste: serve o site e simula as funções do Netlify com o mesmo código, usando um SQLite em arquivo (.data/dev.db).
// Uso: node seo/dev-server.mjs [porta]      (nunca vai para produção: o Netlify ignora esta pasta)
import { createClient } from '@libsql/client'
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { usarBanco } from '../netlify/lib/banco.mjs'
import { banco } from '../netlify/lib/banco.mjs'
import { coletar, contato, hub } from '../netlify/lib/manipuladores.mjs'
import { ambiente } from '../netlify/lib/seguranca.mjs'

const raiz = join(fileURLToPath(import.meta.url), '..', '..')
const porta = parseInt(process.argv[2] || process.env.PORT || '8787', 10)
mkdirSync(join(raiz, '.data'), { recursive: true })
const segredoHub = process.env.EPIPER_HUB_SEGREDO || 'dev-' + randomBytes(24).toString('hex')
const env = {
  ...process.env,
  EPIPER_CHAVE_CAMPOS: process.env.EPIPER_CHAVE_CAMPOS || readOuCria('.data/chave-campos.txt', () => randomBytes(32).toString('base64')),
  EPIPER_SEGREDO_IP: process.env.EPIPER_SEGREDO_IP || 'dev-sal-de-ip',
  EPIPER_HUB_SEGREDO: segredoHub,
  EPIPER_ORIGENS: `http://127.0.0.1:${porta},http://localhost:${porta}`,
}
function readOuCria(arq, gerar) {
  const p = join(raiz, arq)
  if (existsSync(p)) return readFileSync(p, 'utf8').trim()
  const v = gerar(); mkdirSync(join(p, '..'), { recursive: true }); writeFileSync(p, v); return v
}
const amb = ambiente(env)
await usarBanco(createClient({ url: 'file:' + join(raiz, '.data', 'dev.db').replace(/\\/g, '/') }))
const bd = await banco()

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.xml': 'application/xml' }
const cabecalhosGlobais = (() => {
  const t = readFileSync(join(raiz, '_headers'), 'utf8').split('\n\n')[0].split('\n').slice(1)
  return Object.fromEntries(t.map((l) => l.trim().split(/:\s(.+)/)).filter((p) => p[0] && p[1]).map(([k, v]) => [k, v]))
})()

createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${porta}`)
  const ip = req.socket.remoteAddress || ''
  if (url.pathname.startsWith('/api/')) {
    const corpo = ['GET', 'HEAD'].includes(req.method) ? undefined : await new Promise((ok) => { const p = []; req.on('data', (d) => p.push(d)); req.on('end', () => ok(Buffer.concat(p))) })
    const pedido = new Request(url, { method: req.method, headers: req.headers, body: corpo })
    const ctx = { ip, geo: { country: { code: 'BR' }, subdivision: { code: 'ES' }, city: 'Vitória' } }
    const f = url.pathname === '/api/coletar' ? coletar : url.pathname === '/api/contato' ? contato : url.pathname.startsWith('/api/hub/') ? hub : null
    if (!f) { res.writeHead(404); return res.end() }
    const r = await f(pedido, ctx, { banco: bd, amb })
    res.writeHead(r.status, Object.fromEntries(r.headers))
    return res.end(Buffer.from(await r.arrayBuffer()))
  }
  let caminho = decodeURIComponent(url.pathname)
  if (caminho.endsWith('/')) caminho += 'index.html'
  if (!extname(caminho)) caminho += '.html'
  const arq = normalize(join(raiz, caminho))
  const bloqueado = /^\/(netlify|test|seo|node_modules|\.data|\.git)\//.test(caminho) || /package(-lock)?\.json$/.test(caminho)
  if (bloqueado || !arq.startsWith(raiz) || !existsSync(arq) || !statSync(arq).isFile()) { res.writeHead(404, { 'content-type': 'text/html' }); return res.end(readFileSync(join(raiz, '404.html'))) }
  res.writeHead(200, { 'content-type': TIPOS[extname(arq)] || 'application/octet-stream', ...cabecalhosGlobais })
  res.end(readFileSync(arq))
}).listen(porta, '127.0.0.1', () => {
  console.log(`Site de teste em http://127.0.0.1:${porta}`)
  console.log(`Chave do Hub (EPIPER_HUB_SEGREDO) deste servidor: ${segredoHub}`)
})
