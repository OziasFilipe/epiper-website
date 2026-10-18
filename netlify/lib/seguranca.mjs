// Segurança das funções: cifra dos dados pessoais, assinatura do Hub, limite de tentativas e hash de IP.
// Nada aqui grava segredo em log nem devolve segredo ao navegador.
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

// ---------------------------------------------------------------- configuração (variáveis do Netlify, nunca no repositório)
export function ambiente(env = process.env) {
  return {
    chaveCampos: env.EPIPER_CHAVE_CAMPOS || '', // 32 bytes em base64: cifra os dados pessoais dos contatos
    segredoIp: env.EPIPER_SEGREDO_IP || '', // sal do hash de IP
    segredoHub: env.EPIPER_HUB_SEGREDO || '', // chave compartilhada com o Hub (assinatura HMAC das leituras)
    segredoHubAnterior: env.EPIPER_HUB_SEGREDO_ANTERIOR || '', // aceita a chave antiga durante a troca
    ipsDoHub: (env.EPIPER_HUB_IPS || '').split(',').map((s) => s.trim()).filter(Boolean), // opcional: só estes IPs leem
    origens: (env.EPIPER_ORIGENS || 'https://epiper.com.br,https://www.epiper.com.br').split(',').map((s) => s.trim()).filter(Boolean),
    retencaoDias: Math.min(Math.max(parseInt(env.EPIPER_RETENCAO_DIAS || '400', 10) || 400, 30), 1100),
  }
}

// ---------------------------------------------------------------- cifra de campos (AES-256-GCM)
function chaveDe(b64) {
  const k = Buffer.from(b64 || '', 'base64')
  if (k.length !== 32) throw new Error('EPIPER_CHAVE_CAMPOS precisa ter 32 bytes em base64.')
  return k
}

export function cifrar(texto, chaveB64) {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', chaveDe(chaveB64), iv)
  const ct = Buffer.concat([c.update(String(texto), 'utf8'), c.final()])
  return ['v1', iv.toString('base64url'), c.getAuthTag().toString('base64url'), ct.toString('base64url')].join('.')
}

export function decifrar(valor, chaveB64) {
  const [v, iv, tag, ct] = String(valor).split('.')
  if (v !== 'v1' || !iv || !tag || !ct) throw new Error('valor cifrado inválido')
  const d = createDecipheriv('aes-256-gcm', chaveDe(chaveB64), Buffer.from(iv, 'base64url'))
  d.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([d.update(Buffer.from(ct, 'base64url')), d.final()]).toString('utf8')
}

// ---------------------------------------------------------------- IP: nunca guardamos o IP, só um hash que muda todo dia
export function hashIp(ip, segredo, agora = new Date()) {
  const dia = agora.toISOString().slice(0, 10)
  return createHmac('sha256', `${segredo}:${dia}`).update(String(ip || 'desconhecido')).digest('hex').slice(0, 20)
}

// ---------------------------------------------------------------- assinatura do Hub
export const JANELA_SEGUNDOS = 60

/** RFC 3986: igual ao rawurlencode do PHP, para o Hub e o site montarem a mesma string. */
export function codificar(s) {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

export function consultaCanonica(urlSearchParams) {
  return [...urlSearchParams.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${codificar(k)}=${codificar(v)}`)
    .join('&')
}

export function sha256Hex(texto) {
  return createHash('sha256').update(texto).digest('hex')
}

export function textoAssinado({ metodo, caminho, consulta, data, nonce, corpo }) {
  return [metodo.toUpperCase(), caminho, consulta, String(data), nonce, sha256Hex(corpo || '')].join('\n')
}

export function assinar(segredo, partes) {
  return createHmac('sha256', segredo).update(textoAssinado(partes)).digest('hex')
}

function iguais(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b))
  return x.length === y.length && timingSafeEqual(x, y)
}

/**
 * Confere uma leitura do Hub. Devolve { ok: true } ou { ok: false, motivo } (o motivo vai só para o log interno;
 * quem chamou recebe sempre a mesma resposta genérica).
 */
export async function verificarHub({ req, corpo, ip, ipHash, banco, amb, agora = Date.now() }) {
  if (!amb.segredoHub || amb.segredoHub.length < 32) return { ok: false, motivo: 'segredo_nao_configurado' }
  if (amb.ipsDoHub.length && !amb.ipsDoHub.includes(ip)) return { ok: false, motivo: 'ip_fora_da_lista' }

  const bloqueio = await banco.execute({ sql: 'SELECT n, inicio FROM limites WHERE chave = ?', args: [`authfalha:${ipHash}`] })
  const b = bloqueio.rows[0]
  if (b && Number(b.n) >= 10 && Math.floor(agora / 1000) - Number(b.inicio) < 900) return { ok: false, motivo: 'bloqueado' }

  const h = (n) => req.headers.get(n) || ''
  const data = parseInt(h('x-epiper-data'), 10)
  const nonce = h('x-epiper-nonce')
  const assinatura = h('x-epiper-assinatura')
  const falhar = async (motivo) => {
    await registrarFalha(banco, ipHash, agora)
    return { ok: false, motivo }
  }
  if (!data || !/^[A-Za-z0-9_-]{16,64}$/.test(nonce) || !/^[0-9a-f]{64}$/.test(assinatura)) return falhar('cabecalhos_invalidos')
  if (Math.abs(Math.floor(agora / 1000) - data) > JANELA_SEGUNDOS) return falhar('fora_da_janela')

  const url = new URL(req.url)
  const partes = { metodo: req.method, caminho: url.pathname, consulta: consultaCanonica(url.searchParams), data, nonce, corpo }
  const confere = [amb.segredoHub, amb.segredoHubAnterior].filter(Boolean).some((s) => iguais(assinar(s, partes), assinatura))
  if (!confere) return falhar('assinatura_invalida')

  // anti-repetição: o mesmo nonce nunca vale duas vezes
  try {
    await banco.execute({ sql: 'INSERT INTO nonces (nonce, em) VALUES (?, ?)', args: [nonce, Math.floor(agora / 1000)] })
  } catch {
    return falhar('nonce_repetido')
  }
  await banco.execute({ sql: 'DELETE FROM limites WHERE chave = ?', args: [`authfalha:${ipHash}`] })
  return { ok: true }
}

async function registrarFalha(banco, ipHash, agora) {
  const s = Math.floor(agora / 1000)
  await banco.execute({
    sql: `INSERT INTO limites (chave, inicio, n) VALUES (?, ?, 1)
          ON CONFLICT(chave) DO UPDATE SET n = CASE WHEN ? - inicio > 900 THEN 1 ELSE n + 1 END, inicio = CASE WHEN ? - inicio > 900 THEN ? ELSE inicio END`,
    args: [`authfalha:${ipHash}`, s, s, s, s],
  })
}

// ---------------------------------------------------------------- limite de requisições por janela (contador no banco)
export async function limitar(banco, chave, maximo, janelaSegundos, agora = Date.now()) {
  const s = Math.floor(agora / 1000)
  const r = await banco.execute({
    sql: `INSERT INTO limites (chave, inicio, n) VALUES (?, ?, 1)
          ON CONFLICT(chave) DO UPDATE SET n = CASE WHEN ? - inicio > ? THEN 1 ELSE n + 1 END, inicio = CASE WHEN ? - inicio > ? THEN ? ELSE inicio END
          RETURNING n`,
    args: [chave, s, s, janelaSegundos, s, janelaSegundos, s],
  })
  return Number(r.rows[0].n) <= maximo
}
