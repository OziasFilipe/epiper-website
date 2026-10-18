// Semeia DADOS FICTÍCIOS no banco do servidor LOCAL de teste (.data/dev.db), para ver as telas do Hub com movimento.
// Uso: node seo/semear-demo.mjs        (nunca toca o banco de produção: só aceita o arquivo local .data/dev.db)
import { createClient } from '@libsql/client'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { migrar } from '../netlify/lib/esquema.mjs'
import { cifrar } from '../netlify/lib/seguranca.mjs'

const raiz = join(fileURLToPath(import.meta.url), '..', '..')
const banco = createClient({ url: 'file:' + join(raiz, '.data', 'dev.db').replace(/\\/g, '/') })
await migrar(banco)
const chave = readFileSync(join(raiz, '.data', 'chave-campos.txt'), 'utf8').trim()

let semente = 42
const rnd = () => { semente = (semente * 1664525 + 1013904223) % 4294967296; return semente / 4294967296 }
const sorteio = (lista) => { let t = lista.reduce((a, [, p]) => a + p, 0) * rnd(); for (const [v, p] of lista) { t -= p; if (t <= 0) return v } return lista[0][0] }
const id = (n = 20) => Array.from({ length: n }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(rnd() * 36)]).join('')

const PAGINAS = [['/', 30], ['/pedido-eletronico', 20], ['/televendas', 14], ['/integracoes', 10], ['/hub-epiper', 6], ['/plataforma', 6], ['/duvidas', 5], ['/implantacao-guiada', 3], ['/fale-com-especialista', 6]]
const TITULOS = { '/': 'Pedido Eletrônico e Televendas integrados ao ERP', '/pedido-eletronico': 'Pedido Eletrônico B2B para distribuidoras', '/televendas': 'Sistema de Televendas integrado ao ERP', '/integracoes': 'Integração com ERP WinThor TOTVS', '/hub-epiper': 'Hub Epiper', '/plataforma': 'Plataforma de vendas B2B', '/duvidas': 'Dúvidas', '/implantacao-guiada': 'Implantação guiada', '/fale-com-especialista': 'Fale com um especialista' }
const ZONAS = {
  default: [['hero', 'Título e chamada principal', 0.07], ['como-funciona', 'Como funciona', 0.24], ['recursos', 'Recursos', 0.45], ['sistema', 'O sistema por dentro', 0.65], ['contato', 'Chamada final para contato', 0.88], ['rodape', 'Rodapé', 0.97]],
}
const ORIGENS = [['direto', 30], ['busca:google', 38], ['social:linkedin', 10], ['social:whatsapp', 8], ['campanha:google-ads/cpc', 9], ['social:instagram', 5]]
const LOCAIS = [['Vitória', 'ES', 'BR', 22], ['São Paulo', 'SP', 'BR', 20], ['Belo Horizonte', 'MG', 'BR', 12], ['Rio de Janeiro', 'RJ', 'BR', 10], ['Curitiba', 'PR', 'BR', 8], ['Salvador', 'BA', 'BR', 6], ['Goiânia', 'GO', 'BR', 5], ['Recife', 'PE', 'BR', 4]].map(([c, r, p, w]) => [[c, r, p], w])
const APARELHOS = [[['computador', 'Chrome', 'Windows'], 38], [['computador', 'Edge', 'Windows'], 10], [['celular', 'Chrome', 'Android'], 28], [['celular', 'Safari', 'iOS'], 14], [['computador', 'Safari', 'macOS'], 6], [['tablet', 'Safari', 'iOS'], 4]]

const agora = Math.floor(Date.now() / 1000)
const stmts = []
const visitantes = []
const NOMES_CONTATO = [['Mariana Souza', 'Distribuidora Capixaba', 'Televendas', '27999887766'], ['Carlos Eduardo Lima', 'Atacado Norte Sul', 'Pedido Eletrônico', '31988776655'], ['Fernanda Alves', 'Farma Distribuição', 'Integrações com ERP', '11977665544']]

for (let dia = 29; dia >= 0; dia--) {
  const base = 10 + Math.round(rnd() * 14) + (dia < 10 ? 8 : 0)
  for (let i = 0; i < base; i++) {
    const v = visitantes.length && rnd() < 0.22 ? visitantes[Math.floor(rnd() * visitantes.length)] : { id: id(), local: sorteio(LOCAIS), ap: sorteio(APARELHOS), origem: sorteio(ORIGENS), primeiro: agora - dia * 86400 }
    if (!visitantes.includes(v)) visitantes.push(v)
    const inicio = agora - dia * 86400 - Math.floor(rnd() * 43200) - 600
    const sessao = id()
    const npag = 1 + Math.floor(rnd() ** 1.6 * 5)
    let t = inicio, tempoTotal = 0
    const [cidade, regiao, pais] = v.local
    const [disp, nav, so] = v.ap
    const pags = []
    let entrada = sorteio(PAGINAS)
    for (let p = 0; p < npag; p++) {
      const pagina = p === 0 ? entrada : sorteio(PAGINAS)
      const vid = id(16)
      const tempo = Math.round(6 + rnd() ** 1.4 * 140)
      const rolagem = Math.min(100, Math.round(15 + rnd() ** 0.8 * 90))
      tempoTotal += tempo
      pags.push(pagina)
      stmts.push({ sql: 'INSERT INTO visualizacoes (id, sessao_id, visitante_id, pagina, titulo, entrou_em, atualizou_em, tempo_s, rolagem, largura, altura) VALUES (?,?,?,?,?,?,?,?,?,?,?)', args: [vid, sessao, v.id, pagina, TITULOS[pagina], t, t + tempo, tempo, rolagem, disp === 'celular' ? 390 : 1440, 4200 + Math.round(rnd() * 1800)] })
      const cliques = Math.floor(rnd() * 3.2)
      for (let c = 0; c < cliques; c++) {
        const z = sorteio(ZONAS.default.map((x, i) => [x, [30, 12, 10, 14, 26, 8][i]]))
        const x = disp === 'celular' ? 0.2 + rnd() * 0.6 : (z[0] === 'hero' ? 0.12 + rnd() * 0.3 : 0.15 + rnd() * 0.7)
        const alvo = z[0] === 'hero' ? 'Falar com especialista' : z[0] === 'contato' ? 'Falar com especialista' : z[0] === 'sistema' ? 'Ver o sistema' : z[0] === 'rodape' ? 'Política de Privacidade' : 'Conhecer produto'
        stmts.push({ sql: 'INSERT INTO cliques (visualizacao_id, pagina, x, y, yr, zona, alvo, destino, em) VALUES (?,?,?,?,?,?,?,?,?)', args: [vid, pagina, Math.round(x * 1000) / 1000, Math.round(z[2] * 4800), Math.min(1, Math.max(0, z[2] + (rnd() - 0.5) * 0.06)), z[0], alvo, alvo === 'Falar com especialista' ? '/fale-com-especialista' : '', t + Math.round(tempo * rnd())] })
      }
      t += tempo
    }
    stmts.push({ sql: `INSERT INTO sessoes (id, visitante_id, inicio, fim, paginas, tempo_s, entrada, origem, utm_fonte, utm_meio, utm_campanha, dispositivo, navegador, so, pais, regiao, cidade) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, args: [sessao, v.id, inicio, t, npag, tempoTotal, entrada, v.origem, '', '', '', disp, nav, so, pais, regiao, cidade] })
    stmts.push({ sql: `INSERT INTO visitantes (id, primeiro_em, ultimo_em, sessoes, dispositivo, navegador, so, pais, regiao, cidade, idioma, origem, utm_fonte, utm_meio, utm_campanha, ip_hash) VALUES (?,?,?,1,?,?,?,?,?,?,'pt-BR',?,'','','',?)
      ON CONFLICT(id) DO UPDATE SET sessoes = sessoes + 1, ultimo_em = excluded.ultimo_em`, args: [v.id, inicio, t, disp, nav, so, pais, regiao, cidade, v.origem, randomBytes(10).toString('hex')] })
  }
}
for (const pagina of Object.keys(TITULOS)) for (const [z, rotulo] of ZONAS.default) stmts.push({ sql: 'INSERT OR IGNORE INTO zonas (pagina, zona, rotulo) VALUES (?,?,?)', args: [pagina, z, rotulo] })

for (const [i, [nome, empresa, interesse, tel]] of NOMES_CONTATO.entries()) {
  const quem = visitantes[10 + i * 15]
  const dados = { nome, empresa, telefone: tel, email: nome.split(' ')[0].toLowerCase() + '@' + empresa.toLowerCase().replace(/[^a-z]/g, '') + '.com.br', segmento: 'Distribuição', erp: 'WinThor TOTVS', cargo: 'Gerente comercial', vendedores: '6 a 20', volume: '1.001 a 5.000', prazo: '1 a 3 meses', canais: ['WhatsApp', 'Telefone / Televendas'], mensagem: 'Quero entender como conectar o pedido dos clientes ao nosso ERP.' }
  stmts.push({ sql: 'INSERT INTO formularios (criado_em, visitante_id, pagina, interesse, dados, lido, ip_hash) VALUES (?,?,?,?,?,?,?)', args: [agora - (i * 3 + 1) * 3600, quem.id, '/fale-com-especialista', interesse, cifrar(JSON.stringify(dados), chave), i === 2 ? 0 : 1, 'demo'] })
}
for (let i = 0; i < stmts.length; i += 200) await banco.batch(stmts.slice(i, i + 200), 'write')
const total = await banco.execute('SELECT (SELECT COUNT(*) FROM sessoes) s, (SELECT COUNT(*) FROM visitantes) v, (SELECT COUNT(*) FROM cliques) c, (SELECT COUNT(*) FROM formularios) f')
console.log('semeado:', JSON.stringify(total.rows[0]))
