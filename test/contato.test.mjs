import assert from 'node:assert/strict'
import { test } from 'node:test'
import { contato } from '../netlify/lib/manipuladores.mjs'
import { decifrar } from '../netlify/lib/seguranca.mjs'
import { ambienteDeTeste, bancoDeTeste, CHAVE_CAMPOS, contexto, id, pedidoSite } from './ajuda.mjs'

async function comBanco(fn, amb = ambienteDeTeste()) {
  const banco = await bancoDeTeste()
  try { await fn(banco, amb) } finally { banco.limpar() }
}
const valido = (extra = {}) => ({
  nome: 'Maria da Silva', empresa: 'Distribuidora Modelo', telefone: '(27) 99999-0000', email: 'Maria@Empresa.com.br', interesse: 'Pedido Eletrônico',
  segmento: 'Distribuição', erp: 'WinThor TOTVS', cargo: 'Gerente comercial', vendedores: '6 a 20', volume: '201 a 1.000', prazo: '1 a 3 meses', canais: ['WhatsApp', 'Telefone / Televendas'],
  mensagem: 'Quero reduzir digitação.', pagina: '/fale-com-especialista.html', visitante: id('v'), consentimento: true, hp: '', t0: Date.now() - 20000, ...extra,
})
const enviar = (banco, amb, corpo, opcoes, ctx) => contato(pedidoSite('/api/contato', corpo, { extra: { 'content-type': 'application/json' }, ...opcoes }), ctx || contexto(), { banco, amb })
const total = async (banco) => Number((await banco.execute('SELECT COUNT(*) n FROM formularios')).rows[0].n)

test('contato válido é guardado CIFRADO: nome, e-mail e telefone nunca aparecem em texto no banco', () => comBanco(async (banco, amb) => {
  const r = await enviar(banco, amb, valido())
  assert.equal(r.status, 200)
  assert.deepEqual(await r.json(), { ok: true })
  const linha = (await banco.execute('SELECT * FROM formularios')).rows[0]
  const bruto = JSON.stringify(linha)
  for (const termo of ['Maria', 'maria@empresa', '99999', 'Distribuidora Modelo', 'WinThor']) assert.ok(!bruto.includes(termo), `"${termo}" não pode aparecer em texto`)
  assert.equal(linha.interesse, 'Pedido Eletrônico')
  const dados = JSON.parse(decifrar(String(linha.dados), CHAVE_CAMPOS))
  assert.equal(dados.email, 'maria@empresa.com.br')
  assert.equal(dados.telefone, '27999990000')
  assert.deepEqual(dados.canais, ['WhatsApp', 'Telefone / Televendas'])
}))

test('exige consentimento e campos válidos', () => comBanco(async (banco, amb) => {
  const casos = [
    [{ consentimento: false }, 'consentimento'], [{ consentimento: 'true' }, 'consentimento'], [{ nome: 'Al' }, 'nome'], [{ empresa: '' }, 'empresa'],
    [{ telefone: '123' }, 'telefone'], [{ email: 'sem-arroba' }, 'email'], [{ email: 'a@b' }, 'email'], [{ email: '<x>@b.com' }, 'email'], /* e-mail vazio é permitido */ [{ interesse: '' }, 'interesse'],
  ]
  let n = 0
  for (const [extra, campo] of casos) {
    const r = await enviar(banco, amb, valido(extra), {}, contexto('198.51.100.' + ++n)) // IP diferente: o limite conta toda tentativa
    assert.equal(r.status, 400, JSON.stringify(extra))
    assert.equal((await r.json()).campo, campo)
  }
  assert.equal(await total(banco), 0)
}))

test('formulário enxuto: só nome, WhatsApp, empresa e interesse bastam (e-mail e o resto são opcionais)', () => comBanco(async (banco, amb) => {
  const r = await enviar(banco, amb, { nome: 'João Pereira', empresa: 'Atacado Sul', telefone: '(27) 98888-7777', interesse: 'Televendas', consentimento: true, hp: '', t0: Date.now() - 15000 })
  assert.equal(r.status, 200)
  const dados = JSON.parse(decifrar(String((await banco.execute('SELECT dados FROM formularios')).rows[0].dados), CHAVE_CAMPOS))
  assert.equal(dados.nome, 'João Pereira')
  assert.equal(dados.email, '')
  assert.equal(dados.mensagem, '')
}))

test('"já utiliza alguma solução?": Sim guarda o nome; Não ou lixo descarta o nome', () => comBanco(async (banco, amb) => {
  let n = 0
  const enviarCom = async (extra) => (await enviar(banco, amb, valido(extra), {}, contexto('198.51.100.' + ++n))).status
  assert.equal(await enviarCom({ usa_solucao: 'Sim', nome_solucao: 'WinThor <b>TOTVS</b>' }), 200)
  assert.equal(await enviarCom({ usa_solucao: 'Não', nome_solucao: 'não deveria ficar' }), 200)
  assert.equal(await enviarCom({ usa_solucao: 'talvez', nome_solucao: 'lixo' }), 200)
  assert.equal(await enviarCom({}), 200)
  const linhas = (await banco.execute('SELECT dados FROM formularios ORDER BY id')).rows.map((l) => JSON.parse(decifrar(String(l.dados), CHAVE_CAMPOS)))
  assert.deepEqual(linhas.map((d) => [d.usa_solucao, d.nome_solucao]), [['Sim', 'WinThor <b>TOTVS</b>'], ['Não', ''], ['', ''], ['', '']])
}))

test('robôs: campo-isca preenchido, formulário rápido demais ou sem horário → finge sucesso e não guarda', () => comBanco(async (banco, amb) => {
  for (const extra of [{ hp: 'http://spam' }, { t0: Date.now() - 500 }, { t0: undefined }, { t0: Date.now() + 99999 }]) {
    const r = await enviar(banco, amb, valido(extra))
    assert.equal(r.status, 200)
    assert.deepEqual(await r.json(), { ok: true })
  }
  assert.equal(await total(banco), 0)
}))

test('só aceita do próprio site e só POST; sem chave de cifra o serviço fica indisponível (nunca grava em texto)', () => comBanco(async (banco, amb) => {
  assert.equal((await enviar(banco, amb, valido(), { origem: 'https://outro.com' })).status, 403)
  assert.equal((await enviar(banco, amb, valido(), { origem: null })).status, 403)
  assert.equal((await contato(pedidoSite('/api/contato', '', { metodo: 'GET' }), contexto(), { banco, amb })).status, 405)
  const semChave = await enviar(banco, { ...amb, chaveCampos: '' }, valido())
  assert.equal(semChave.status, 503)
  assert.equal(await total(banco), 0)
}))

test('limite: 5 contatos por hora por IP', () => comBanco(async (banco, amb) => {
  for (let i = 0; i < 5; i++) assert.equal((await enviar(banco, amb, valido())).status, 200)
  const sexto = await enviar(banco, amb, valido())
  assert.equal(sexto.status, 429)
  assert.equal((await enviar(banco, amb, valido(), {}, contexto('198.51.100.5'))).status, 200, 'outro IP não é afetado')
}))

test('texto malicioso vira texto simples limpo e corpo gigante é recusado', () => comBanco(async (banco, amb) => {
  const r = await enviar(banco, amb, valido({ nome: 'Fulano\u0000<img src=x onerror=alert(1)>', mensagem: 'm'.repeat(5000) }))
  assert.equal(r.status, 200)
  const dados = JSON.parse(decifrar(String((await banco.execute('SELECT dados FROM formularios')).rows[0].dados), CHAVE_CAMPOS))
  assert.ok(!dados.nome.includes('\u0000'))
  assert.ok(dados.mensagem.length <= 1000)
  assert.equal((await enviar(banco, amb, 'x'.repeat(9000))).status, 413)
}))
