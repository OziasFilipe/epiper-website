import assert from 'node:assert/strict'
import { test } from 'node:test'
import { coletar } from '../netlify/lib/manipuladores.mjs'
import { ambienteDeTeste, bancoDeTeste, contexto, id, pedidoSite } from './ajuda.mjs'

async function comBanco(fn) {
  const banco = await bancoDeTeste()
  try { await fn(banco, ambienteDeTeste()) } finally { banco.limpar() }
}
const chamar = (banco, amb, corpo, opcoes, ctx) => coletar(pedidoSite('/api/coletar', corpo, opcoes), ctx || contexto(), { banco, amb })
const contar = async (banco, tabela) => Number((await banco.execute(`SELECT COUNT(*) n FROM ${tabela}`)).rows[0].n)

const visita = () => ({ v: id('v'), s: id('s'), vid: id('p') })

test('uma visita completa grava visitante, sessão, página, tempo, rolagem e clique', () => comBanco(async (banco, amb) => {
  const { v, s, vid } = visita()
  const r = await chamar(banco, amb, { v, s, e: [
    { k: 'pv', id: vid, p: '/pedido-eletronico.html?utm=x', t: 'Pedido Eletrônico', r: 'https://www.google.com/search?q=pedido', w: 1440, h: 900, u: { s: '', m: '', c: '' } },
    { k: 'zn', p: '/pedido-eletronico', z: 'hero', r: 'Pedido Eletrônico para distribuidoras' },
    { k: 'cl', id: vid, p: '/pedido-eletronico', x: 0.42, y: 380, yr: 0.08, z: 'hero', a: 'Falar com especialista', d: '/fale-com-especialista.html?x=1' },
    { k: 'hb', id: vid, t: 5, d: 40, H: 4800 },
  ] })
  assert.equal(r.status, 204)
  assert.equal(await contar(banco, 'visitantes'), 1)
  assert.equal(await contar(banco, 'sessoes'), 1)
  const vis = (await banco.execute('SELECT * FROM visualizacoes')).rows[0]
  assert.equal(vis.pagina, '/pedido-eletronico')
  assert.equal(Number(vis.rolagem), 40)
  assert.ok(Number(vis.tempo_s) <= 15, 'tempo limitado ao que de fato decorreu')
  const ses = (await banco.execute('SELECT * FROM sessoes')).rows[0]
  assert.equal(ses.origem, 'busca:google')
  assert.equal(ses.cidade, 'Vitória')
  assert.equal(Number(ses.paginas), 1)
  const cl = (await banco.execute('SELECT * FROM cliques')).rows[0]
  assert.equal(cl.destino, '/fale-com-especialista.html', 'a consulta do destino é descartada')
  assert.equal(Number((await banco.execute('SELECT sessoes FROM visitantes')).rows[0].sessoes), 1)
}))

test('nunca guarda o IP, só o hash', () => comBanco(async (banco, amb) => {
  const { v, s, vid } = visita()
  await chamar(banco, amb, { v, s, e: [{ k: 'pv', id: vid, p: '/', t: 'Início' }] }, {}, contexto('198.51.100.77'))
  const todos = JSON.stringify([...(await banco.execute('SELECT * FROM visitantes')).rows, ...(await banco.execute('SELECT * FROM sessoes')).rows])
  assert.ok(!todos.includes('198.51.100.77'))
  assert.match(String((await banco.execute('SELECT ip_hash FROM visitantes')).rows[0].ip_hash), /^[0-9a-f]{20}$/)
}))

test('rejeita origem estranha, robô, "não rastrear" e método errado', () => comBanco(async (banco, amb) => {
  const { v, s, vid } = visita()
  const corpo = { v, s, e: [{ k: 'pv', id: vid, p: '/', t: 'x' }] }
  assert.equal((await chamar(banco, amb, corpo, { origem: 'https://outro-site.com' })).status, 403)
  assert.equal((await chamar(banco, amb, corpo, { origem: null })).status, 403)
  assert.equal((await chamar(banco, amb, corpo, { ua: 'Googlebot/2.1' })).status, 204)
  assert.equal((await chamar(banco, amb, corpo, { extra: { dnt: '1' } })).status, 204)
  assert.equal((await chamar(banco, amb, corpo, { extra: { 'sec-gpc': '1' } })).status, 204)
  assert.equal((await coletar(pedidoSite('/api/coletar', corpo, { metodo: 'GET' }), contexto(), { banco, amb })).status, 405)
  assert.equal(await contar(banco, 'visualizacoes'), 0, 'nada disso grava')
  assert.equal((await chamar(banco, amb, corpo, { origem: null, extra: { 'sec-fetch-site': 'same-origin' } })).status, 204, 'mesmo site sem Origin é aceito')
  assert.equal(await contar(banco, 'visualizacoes'), 1)
}))

test('só páginas do site entram; lixo e tamanhos absurdos são ignorados', () => comBanco(async (banco, amb) => {
  const { v, s } = visita()
  await chamar(banco, amb, { v, s, e: [
    { k: 'pv', id: id('p'), p: '/admin', t: 'x' },
    { k: 'pv', id: id('p'), p: '//evil.com/x', t: 'x' },
    { k: 'pv', id: id('p'), p: 'javascript:alert(1)', t: 'x' },
    { k: 'pv', id: 'curto', p: '/', t: 'x' },
    { k: 'xx', id: id('p') },
    null, 'texto', 5,
  ] })
  await chamar(banco, amb, { v: 'ID COM ESPAÇO', s, e: [{ k: 'pv', id: id('p'), p: '/', t: 'x' }] })
  await chamar(banco, amb, { v, s, e: 'não é lista' })
  assert.equal(await contar(banco, 'visualizacoes'), 0)
  const longo = await chamar(banco, amb, 'x'.repeat(7000))
  assert.equal(longo.status, 413)
  assert.equal((await chamar(banco, amb, '{json quebrado')).status, 204)
}))

test('título e rótulos longos ou com caracteres de controle são limpos', () => comBanco(async (banco, amb) => {
  const { v, s, vid } = visita()
  await chamar(banco, amb, { v, s, e: [{ k: 'pv', id: vid, p: '/', t: '<script>alert(1)</script>\n\t' + 'a'.repeat(500) }] })
  const t = String((await banco.execute('SELECT titulo FROM visualizacoes')).rows[0].titulo)
  assert.ok(t.length <= 120)
  assert.ok(!/[\n\t]/.test(t))
}))

test('o tempo não pode ser inflado além do que passou, e o clique/batimento de outro visitante é ignorado', () => comBanco(async (banco, amb) => {
  const a = visita(), b = visita()
  await chamar(banco, amb, { v: a.v, s: a.s, e: [{ k: 'pv', id: a.vid, p: '/', t: 'x' }, { k: 'hb', id: a.vid, t: 14400, d: 100, H: 3000 }] })
  const tempo = Number((await banco.execute('SELECT tempo_s FROM visualizacoes')).rows[0].tempo_s)
  assert.ok(tempo <= 12, `tempo ${tempo} deveria ser limitado`)
  // outro visitante tentando mexer na visualização do primeiro
  await chamar(banco, amb, { v: b.v, s: b.s, e: [{ k: 'hb', id: a.vid, t: 10, d: 5, H: 1 }, { k: 'cl', id: a.vid, p: '/', x: 0.5, y: 10, yr: 0.1, z: 'x', a: 'x', d: '' }] })
  assert.equal(await contar(banco, 'cliques'), 0)
  assert.equal(Number((await banco.execute('SELECT rolagem FROM visualizacoes')).rows[0].rolagem), 100)
}))

test('limite de cliques por página e de zonas por página', () => comBanco(async (banco, amb) => {
  const { v, s, vid } = visita()
  await chamar(banco, amb, { v, s, e: [{ k: 'pv', id: vid, p: '/', t: 'x' }] })
  for (let i = 0; i < 4; i++) {
    await chamar(banco, amb, { v, s, e: Array.from({ length: 25 }, (_, j) => ({ k: 'cl', id: vid, p: '/', x: 0.1, y: 10 + j, yr: 0.1, z: 'a', a: 'b', d: '' })) })
  }
  assert.equal(await contar(banco, 'cliques'), 40)
  for (let i = 0; i < 70; i++) await chamar(banco, amb, { v, s, e: [{ k: 'zn', p: '/', z: 'zona' + i, r: 'z' }] })
  assert.equal(await contar(banco, 'zonas'), 60)
}))

test('limite por IP: depois de muitas chamadas devolve 429', () => comBanco(async (banco, amb) => {
  const { v, s } = visita()
  let ultimo
  for (let i = 0; i < 402; i++) ultimo = await chamar(banco, amb, { v, s, e: [] })
  assert.equal(ultimo.status, 429)
  assert.ok(ultimo.headers.get('retry-after'))
}))

test('a mesma visualização enviada duas vezes não duplica', () => comBanco(async (banco, amb) => {
  const { v, s, vid } = visita()
  const corpo = { v, s, e: [{ k: 'pv', id: vid, p: '/', t: 'x' }] }
  await chamar(banco, amb, corpo); await chamar(banco, amb, corpo)
  assert.equal(await contar(banco, 'visualizacoes'), 1)
  assert.equal(Number((await banco.execute('SELECT paginas FROM sessoes')).rows[0].paginas), 1)
  assert.equal(Number((await banco.execute('SELECT sessoes FROM visitantes')).rows[0].sessoes), 1)
}))
