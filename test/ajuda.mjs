// Ajudantes dos testes: banco SQLite local temporário, pedidos de mentira e assinatura do Hub.
import { createClient } from '@libsql/client'
import { randomBytes } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { migrar } from '../netlify/lib/esquema.mjs'
import { assinar, codificar } from '../netlify/lib/seguranca.mjs'

export const SEGREDO_HUB = 'segredo-de-teste-do-hub-com-mais-de-32-caracteres!!'
export const CHAVE_CAMPOS = randomBytes(32).toString('base64')

export function ambienteDeTeste(extra = {}) {
  return {
    chaveCampos: CHAVE_CAMPOS,
    segredoIp: 'sal-de-ip-de-teste',
    segredoHub: SEGREDO_HUB,
    segredoHubAnterior: '',
    ipsDoHub: [],
    origens: ['https://epiper.com.br', 'https://www.epiper.com.br'],
    retencaoDias: 400,
    ...extra,
  }
}

export async function bancoDeTeste() {
  const pasta = mkdtempSync(join(tmpdir(), 'epiper-seo-'))
  const banco = createClient({ url: 'file:' + join(pasta, 'teste.db').replace(/\\/g, '/') })
  await migrar(banco)
  banco.limpar = () => { banco.close(); try { rmSync(pasta, { recursive: true, force: true }) } catch { /* arquivo ainda aberto no Windows */ } }
  return banco
}

export const UA_NAVEGADOR = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
export const contexto = (ip = '203.0.113.9', extra = {}) => ({ ip, geo: { country: { code: 'BR' }, subdivision: { code: 'ES' }, city: 'Vitória' }, ...extra })

export function pedidoSite(caminho, corpo, { origem = 'https://epiper.com.br', ua = UA_NAVEGADOR, metodo = 'POST', extra = {} } = {}) {
  const cab = { 'user-agent': ua, 'content-type': 'text/plain;charset=UTF-8', ...extra }
  if (origem) cab.origin = origem
  return new Request('https://epiper.com.br' + caminho, { method: metodo, headers: cab, body: metodo === 'GET' ? undefined : (typeof corpo === 'string' ? corpo : JSON.stringify(corpo)) })
}

let contador = 0
export const id = (prefixo = 'a') => (prefixo + Date.now().toString(36) + (contador++).toString(36) + randomBytes(6).toString('hex')).slice(0, 24).padEnd(12, '0')

/** Pedido assinado como o Hub assina (mesma regra de netlify/lib/seguranca.mjs, que o Laravel repete em PHP). */
export function pedidoHub(caminho, { consulta = {}, metodo = 'GET', corpo = '', segredo = SEGREDO_HUB, data = Math.floor(Date.now() / 1000), nonce = randomBytes(16).toString('hex'), ua = 'EpiperHub/1.0', ip = undefined } = {}) {
  const ordenado = Object.entries(consulta).sort(([a], [b]) => (a < b ? -1 : 1))
  const q = ordenado.map(([k, v]) => `${codificar(k)}=${codificar(String(v))}`).join('&')
  const assinatura = assinar(segredo, { metodo, caminho, consulta: q, data, nonce, corpo })
  const cab = { 'user-agent': ua, 'x-epiper-data': String(data), 'x-epiper-nonce': nonce, 'x-epiper-assinatura': assinatura }
  if (ip) cab['x-nf-client-connection-ip'] = ip
  return new Request('https://epiper.com.br' + caminho + (q ? '?' + q : ''), { method: metodo, headers: cab, body: metodo === 'GET' ? undefined : corpo })
}
