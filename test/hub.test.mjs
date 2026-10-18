import assert from 'node:assert/strict'
import { test } from 'node:test'
import { coletar, contato, hub } from '../netlify/lib/manipuladores.mjs'
import { ambienteDeTeste, bancoDeTeste, contexto, id, pedidoHub, pedidoSite, SEGREDO_HUB } from './ajuda.mjs'

async function comBanco(fn, extraAmb = {}) {
  const banco = await bancoDeTeste()
  try { await fn(banco, ambienteDeTeste(extraAmb)) } finally { banco.limpar() }
}
const ler = (banco, amb, pedido, ctx) => hub(pedido, ctx || contexto('192.0.2.10'), { banco, amb })

async function popular(banco, amb) {
  const v = id('v'), s = id('s'), p1 = id('p'), p2 = id('p')
  await coletar(pedidoSite('/api/coletar', { v, s, e: [
    { k: 'pv', id: p1, p: '/', t: 'Início', r: 'https://www.google.com/', w: 1440, h: 900 },
    { k: 'zn', p: '/', z: 'hero', r: 'Pedido Eletrônico e Televendas' },
    { k: 'cl', id: p1, p: '/', x: 0.2, y: 300, yr: 0.1, z: 'hero', a: 'Falar com especialista', d: '/fale-com-especialista' },
    { k: 'cl', id: p1, p: '/', x: 0.22, y: 320, yr: 0.1, z: 'hero', a: 'Falar com especialista', d: '/fale-com-especialista' },
    { k: 'hb', id: p1, t: 8, d: 80, H: 5000 },
    { k: 'pv', id: p2, p: '/televendas', t: 'Televendas', w: 1440, h: 900 },
  ] }), contexto('203.0.113.1'), { banco, amb })
  await contato(pedidoSite('/api/contato', {
    nome: 'Maria da Silva', empresa: 'Distribuidora X', telefone: '27999990000', email: 'maria@x.com.br', interesse: 'Televendas', visitante: v, pagina: '/fale-com-especialista',
    consentimento: true, hp: '', t0: Date.now() - 30000,
  }, { extra: { 'content-type': 'application/json' } }), contexto('203.0.113.1'), { banco, amb })
  return { v, s }
}

test('leituras sem assinatura, com assinatura errada, adulterada ou vencida são recusadas com a mesma resposta genérica', () => comBanco(async (banco, amb) => {
  const ok = await ler(banco, amb, pedidoHub('/api/hub/saude'))
  assert.equal(ok.status, 200)

  const semNada = new Request('https://epiper.com.br/api/hub/resumo', { method: 'GET' })
  const errada = pedidoHub('/api/hub/resumo', { segredo: 'outro-segredo-que-tem-mais-de-32-caracteres-aqui' })
  const velha = pedidoHub('/api/hub/resumo', { data: Math.floor(Date.now() / 1000) - 120 })
  const futura = pedidoHub('/api/hub/resumo', { data: Math.floor(Date.now() / 1000) + 120 })
  const outroCaminho = pedidoHub('/api/hub/saude', { consulta: { dias: 7 } })
  // assinou "saude" mas pede "resumo": a assinatura não vale para outro caminho
  const reaproveitada = new Request('https://epiper.com.br/api/hub/resumo?dias=7', { method: 'GET', headers: outroCaminho.headers })
  const consultaTrocada = new Request(outroCaminho.url.replace('dias=7', 'dias=365'), { method: 'GET', headers: outroCaminho.headers })

  const respostas = []
  for (const pedido of [semNada, errada, velha, futura, reaproveitada, consultaTrocada]) {
    const r = await ler(banco, amb, pedido, contexto('192.0.2.11'))
    assert.equal(r.status, 401)
    respostas.push(await r.text())
  }
  assert.equal(new Set(respostas).size, 1, 'todas as recusas têm a mesma resposta (não dá para descobrir o motivo)')
  assert.equal(respostas[0], JSON.stringify({ erro: 'nao_autorizado' }))
}))

test('a mesma assinatura não pode ser repetida (anti-repetição por nonce)', () => comBanco(async (banco, amb) => {
  const nonce = 'abcdef0123456789abcdef0123456789'
  assert.equal((await ler(banco, amb, pedidoHub('/api/hub/saude', { nonce }))).status, 200)
  assert.equal((await ler(banco, amb, pedidoHub('/api/hub/saude', { nonce }))).status, 401)
}))

test('POST: o corpo faz parte da assinatura (trocar o corpo invalida)', () => comBanco(async (banco, amb) => {
  await popular(banco, amb)
  const corpo = JSON.stringify({ id: 1, lido: true })
  const bom = pedidoHub('/api/hub/contatos/lido', { metodo: 'POST', corpo })
  assert.equal((await ler(banco, amb, bom)).status, 200)
  const adulterado = pedidoHub('/api/hub/contatos/lido', { metodo: 'POST', corpo })
  const trocado = new Request(adulterado.url, { method: 'POST', headers: adulterado.headers, body: JSON.stringify({ id: 2, lido: true }) })
  assert.equal((await ler(banco, amb, trocado)).status, 401)
}))

test('sem segredo configurado (ou fraco) ninguém lê nada', () => comBanco(async (banco, amb) => {
  assert.equal((await ler(banco, amb, pedidoHub('/api/hub/saude'))).status, 401)
}, { segredoHub: '' }))

test('depois de 10 tentativas erradas o IP é bloqueado, até com a assinatura certa', () => comBanco(async (banco, amb) => {
  const ctx = contexto('192.0.2.50')
  for (let i = 0; i < 10; i++) assert.equal((await ler(banco, amb, pedidoHub('/api/hub/saude', { segredo: 'errado-errado-errado-errado-errado-errado' }), ctx)).status, 401)
  assert.equal((await ler(banco, amb, pedidoHub('/api/hub/saude'), ctx)).status, 401, 'bloqueado mesmo com a assinatura certa')
  assert.equal((await ler(banco, amb, pedidoHub('/api/hub/saude'), contexto('192.0.2.51'))).status, 200, 'outro IP segue normal')
}))

test('lista de IPs do Hub: quem não está nela é recusado', () => comBanco(async (banco, amb) => {
  assert.equal((await ler(banco, amb, pedidoHub('/api/hub/saude'), contexto('192.0.2.60'))).status, 401)
  assert.equal((await ler(banco, amb, pedidoHub('/api/hub/saude'), contexto('203.0.113.200'))).status, 200)
}, { ipsDoHub: ['203.0.113.200'] }))

test('troca de chave sem parar: a chave anterior continua valendo enquanto configurada', () => comBanco(async (banco, amb) => {
  const velho = 'segredo-antigo-do-hub-com-mais-de-32-caracteres!!'
  assert.equal((await ler(banco, amb, pedidoHub('/api/hub/saude', { segredo: velho }))).status, 200)
  assert.equal((await ler(banco, amb, pedidoHub('/api/hub/saude', { segredo: SEGREDO_HUB }))).status, 200)
  assert.equal((await ler(banco, amb, pedidoHub('/api/hub/saude', { segredo: 'terceiro-segredo-que-nao-esta-configurado-algum' }))).status, 401)
}, { segredoHubAnterior: 'segredo-antigo-do-hub-com-mais-de-32-caracteres!!' }))

test('resumo, páginas, visitantes e mapa de calor devolvem os dados coletados', () => comBanco(async (banco, amb) => {
  const { v } = await popular(banco, amb)
  const r = await (await ler(banco, amb, pedidoHub('/api/hub/resumo', { consulta: { dias: 7 } }))).json()
  assert.equal(r.totais.visitantes, 1)
  assert.equal(r.totais.visualizacoes, 2)
  assert.equal(r.totais.contatos, 1)
  assert.equal(r.totais.contatos_novos, 1)
  assert.equal(r.origens[0].nome, 'busca:google')
  assert.equal(r.cidades[0].nome, 'Vitória')
  assert.ok(r.serie.length >= 1)
  assert.equal(r.paginas.length, 2)

  const pg = await (await ler(banco, amb, pedidoHub('/api/hub/paginas', { consulta: { dias: 7 } }))).json()
  const inicio = pg.paginas.find((x) => x.pagina === '/')
  assert.equal(inicio.cliques, 2)
  assert.equal(inicio.rolagem_media, 80)

  const vs = await (await ler(banco, amb, pedidoHub('/api/hub/visitantes', { consulta: { dias: 7, limite: 10 } }))).json()
  assert.equal(vs.total, 1)
  assert.deepEqual(vs.sessoes[0].trilha, ['/', '/televendas'])
  assert.equal(vs.sessoes[0].enviou_contato, true)
  assert.match(vs.sessoes[0].rotulo, /^Visitante [A-Z0-9]{6}$/)
  assert.ok(!JSON.stringify(vs).includes('203.0.113'), 'nenhuma resposta traz IP')

  const um = await (await ler(banco, amb, pedidoHub('/api/hub/visitante', { consulta: { id: v } }))).json()
  assert.equal(um.sessoes[0].cliques.length, 2)
  assert.equal((await ler(banco, amb, pedidoHub('/api/hub/visitante', { consulta: { id: 'x' } }))).status, 404)

  const c = await (await ler(banco, amb, pedidoHub('/api/hub/calor', { consulta: { pagina: '/', dias: 7 } }))).json()
  assert.equal(c.cliques_total, 2)
  assert.equal(c.zonas[0].zona, 'hero')
  assert.equal(c.zonas[0].rotulo, 'Pedido Eletrônico e Televendas')
  assert.equal(c.rolagem.r75, 100)
  assert.equal(c.alvos[0].alvo, 'Falar com especialista')
  assert.equal((await ler(banco, amb, pedidoHub('/api/hub/calor', { consulta: { pagina: '/inexistente' } }))).status, 404)
}))

test('contatos: o Hub recebe decifrados, em ordem, com a trilha; marcar como lido funciona; dados nunca vazam sem assinatura', () => comBanco(async (banco, amb) => {
  await popular(banco, amb)
  const r = await (await ler(banco, amb, pedidoHub('/api/hub/contatos', { consulta: { apos: 0 } }))).json()
  assert.equal(r.contatos.length, 1)
  const c = r.contatos[0]
  assert.equal(c.nome, 'Maria da Silva')
  assert.equal(c.email, 'maria@x.com.br')
  assert.equal(c.interesse, 'Televendas')
  assert.deepEqual(c.trilha.map((t) => t.pagina), ['/', '/televendas'])
  assert.equal(c.lido, false)
  assert.equal((await (await ler(banco, amb, pedidoHub('/api/hub/contatos', { consulta: { apos: c.id } }))).json()).contatos.length, 0, 'cursor: só os mais novos')

  const corpo = JSON.stringify({ id: c.id, lido: true })
  assert.equal((await (await ler(banco, amb, pedidoHub('/api/hub/contatos/lido', { metodo: 'POST', corpo }))).json()).ok, true)
  assert.equal((await (await ler(banco, amb, pedidoHub('/api/hub/contatos', { consulta: { apos: 0 } }))).json()).contatos[0].lido, true)

  const semAssinar = await hub(new Request('https://epiper.com.br/api/hub/contatos', { method: 'GET' }), contexto('192.0.2.77'), { banco, amb })
  assert.equal(semAssinar.status, 401)
  assert.ok(!(await semAssinar.text()).includes('Maria'))
}))

test('rotas e métodos desconhecidos', () => comBanco(async (banco, amb) => {
  assert.equal((await ler(banco, amb, pedidoHub('/api/hub/naoexiste'))).status, 404)
  const del = new Request('https://epiper.com.br/api/hub/resumo', { method: 'DELETE' })
  assert.equal((await ler(banco, amb, del)).status, 405)
  assert.equal((await ler(banco, amb, pedidoHub('/api/hub/resumo', { metodo: 'POST', corpo: '{}' }))).status, 404, 'POST só existe em contatos/lido')
}))
