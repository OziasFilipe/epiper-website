// Consultas de leitura para o Hub (só agregados e listas curtas; nunca IP, nunca texto livre do visitante além de título/rótulos limpos).
import { agora, inteiro, normalizarPagina } from './util.mjs'

const BRT = 3 * 3600 // horário de Brasília (sem horário de verão desde 2019): o dia do gráfico é o dia do Brasil
export const PERIODOS = [1, 7, 30, 90, 365]

export function desde(dias) {
  const d = PERIODOS.includes(Number(dias)) ? Number(dias) : 7
  return { dias: d, desde: agora() - d * 86400 }
}

const n = (v) => Number(v ?? 0)
const todas = async (banco, sql, args = []) => (await banco.execute({ sql, args })).rows
const uma = async (banco, sql, args = []) => (await banco.execute({ sql, args })).rows[0] || {}

export async function resumo(banco, diasEntrada) {
  const { dias, desde: d } = desde(diasEntrada)
  const s = await uma(banco, `SELECT COUNT(*) sessoes, COUNT(DISTINCT visitante_id) visitantes, COALESCE(AVG(NULLIF(tempo_s, 0)), 0) tempo_medio,
      SUM(CASE WHEN paginas <= 1 AND tempo_s < 10 THEN 1 ELSE 0 END) rejeicoes FROM sessoes WHERE inicio >= ?`, [d])
  const v = await uma(banco, 'SELECT COUNT(*) total FROM visualizacoes WHERE entrou_em >= ?', [d])
  const novos = await uma(banco, 'SELECT COUNT(*) total FROM visitantes WHERE primeiro_em >= ?', [d])
  const contatos = await uma(banco, 'SELECT COUNT(*) total, SUM(CASE WHEN lido = 0 THEN 1 ELSE 0 END) novos FROM formularios WHERE criado_em >= ?', [d])
  const converteram = await uma(banco, 'SELECT COUNT(DISTINCT visitante_id) total FROM formularios WHERE criado_em >= ? AND visitante_id IS NOT NULL', [d])
  const agoraOnline = await uma(banco, 'SELECT COUNT(DISTINCT visitante_id) total FROM visualizacoes WHERE atualizou_em >= ?', [agora() - 90])

  const serie = await todas(banco, `SELECT date(inicio - ${BRT}, 'unixepoch') dia, COUNT(*) sessoes, COUNT(DISTINCT visitante_id) visitantes FROM sessoes WHERE inicio >= ? GROUP BY dia ORDER BY dia`, [d])
  const views = await todas(banco, `SELECT date(entrou_em - ${BRT}, 'unixepoch') dia, COUNT(*) visualizacoes FROM visualizacoes WHERE entrou_em >= ? GROUP BY dia`, [d])
  const mapaViews = new Map(views.map((r) => [String(r.dia), n(r.visualizacoes)]))

  const grupo = async (coluna, limite = 8) => (await todas(banco, `SELECT COALESCE(NULLIF(${coluna}, ''), 'desconhecido') nome, COUNT(*) total FROM sessoes WHERE inicio >= ? GROUP BY nome ORDER BY total DESC LIMIT ${limite}`, [d])).map((r) => ({ nome: String(r.nome), total: n(r.total) }))
  const topPaginas = (await todas(banco, 'SELECT pagina, COUNT(*) visualizacoes, COUNT(DISTINCT visitante_id) visitantes, COALESCE(AVG(NULLIF(tempo_s,0)),0) tempo_medio FROM visualizacoes WHERE entrou_em >= ? GROUP BY pagina ORDER BY visualizacoes DESC LIMIT 10', [d]))
    .map((r) => ({ pagina: String(r.pagina), visualizacoes: n(r.visualizacoes), visitantes: n(r.visitantes), tempo_medio: Math.round(n(r.tempo_medio)) }))

  return {
    dias,
    totais: {
      visitantes: n(s.visitantes), sessoes: n(s.sessoes), visualizacoes: n(v.total), novos: n(novos.total),
      tempo_medio_s: Math.round(n(s.tempo_medio)), taxa_rejeicao: n(s.sessoes) ? Math.round((n(s.rejeicoes) / n(s.sessoes)) * 100) : 0,
      contatos: n(contatos.total), contatos_novos: n(contatos.novos), online_agora: n(agoraOnline.total),
      conversao: n(s.visitantes) ? Math.min(100, Math.round((n(converteram.total) / n(s.visitantes)) * 1000) / 10) : 0, // % de visitantes que enviaram contato
    },
    serie: serie.map((r) => ({ dia: String(r.dia), sessoes: n(r.sessoes), visitantes: n(r.visitantes), visualizacoes: mapaViews.get(String(r.dia)) || 0 })),
    origens: await grupo('origem'),
    dispositivos: await grupo('dispositivo'),
    navegadores: await grupo('navegador'),
    sistemas: await grupo('so'),
    cidades: (await todas(banco, `SELECT COALESCE(NULLIF(cidade,''),'desconhecida') cidade, COALESCE(NULLIF(regiao,''),'') regiao, COUNT(*) total FROM sessoes WHERE inicio >= ? GROUP BY cidade, regiao ORDER BY total DESC LIMIT 8`, [d])).map((r) => ({ nome: String(r.cidade), regiao: String(r.regiao), total: n(r.total) })),
    paginas: topPaginas,
  }
}

export async function paginas(banco, diasEntrada) {
  const { dias, desde: d } = desde(diasEntrada)
  const linhas = await todas(banco, `
    SELECT v.pagina, COUNT(*) visualizacoes, COUNT(DISTINCT v.visitante_id) visitantes, COALESCE(AVG(NULLIF(v.tempo_s,0)),0) tempo_medio,
           COALESCE(AVG(v.rolagem),0) rolagem_media,
           (SELECT COUNT(*) FROM cliques c WHERE c.pagina = v.pagina AND c.em >= ?) cliques,
           (SELECT COUNT(*) FROM sessoes s WHERE s.entrada = v.pagina AND s.inicio >= ?) entradas
    FROM visualizacoes v WHERE v.entrou_em >= ? GROUP BY v.pagina ORDER BY visualizacoes DESC`, [d, d, d])
  return {
    dias,
    paginas: linhas.map((r) => ({ pagina: String(r.pagina), visualizacoes: n(r.visualizacoes), visitantes: n(r.visitantes), tempo_medio_s: Math.round(n(r.tempo_medio)), rolagem_media: Math.round(n(r.rolagem_media)), cliques: n(r.cliques), entradas: n(r.entradas) })),
  }
}

export async function visitantes(banco, diasEntrada, { limite = 30, deslocamento = 0, pagina = '' } = {}) {
  const { dias, desde: d } = desde(diasEntrada)
  const lim = inteiro(limite, 1, 100, 30)
  const off = inteiro(deslocamento, 0, 100000, 0)
  const filtro = normalizarPagina(pagina)
  const where = filtro ? 'AND EXISTS (SELECT 1 FROM visualizacoes x WHERE x.sessao_id = s.id AND x.pagina = ?)' : ''
  const args = filtro ? [d, filtro, lim, off] : [d, lim, off]
  const linhas = await todas(banco, `
    SELECT s.id, s.visitante_id, s.inicio, s.fim, s.paginas, s.tempo_s, s.entrada, s.origem, s.dispositivo, s.navegador, s.so, s.pais, s.regiao, s.cidade,
           (SELECT sessoes FROM visitantes WHERE id = s.visitante_id) visitas,
           (SELECT GROUP_CONCAT(pagina, ' > ') FROM (SELECT pagina FROM visualizacoes WHERE sessao_id = s.id ORDER BY entrou_em LIMIT 15)) trilha,
           EXISTS (SELECT 1 FROM formularios f WHERE f.visitante_id = s.visitante_id) enviou_contato
    FROM sessoes s WHERE s.inicio >= ? ${where} ORDER BY s.inicio DESC LIMIT ? OFFSET ?`, args)
  const total = await uma(banco, `SELECT COUNT(*) total FROM sessoes s WHERE s.inicio >= ? ${where}`, filtro ? [d, filtro] : [d])
  return {
    dias, total: n(total.total),
    sessoes: linhas.map((r) => ({
      id: String(r.id), visitante: String(r.visitante_id), rotulo: 'Visitante ' + String(r.visitante_id).slice(0, 6).toUpperCase(),
      inicio: n(r.inicio), fim: n(r.fim), paginas: n(r.paginas), tempo_s: n(r.tempo_s), entrada: String(r.entrada || ''), origem: String(r.origem || ''),
      dispositivo: String(r.dispositivo || ''), navegador: String(r.navegador || ''), so: String(r.so || ''),
      local: [r.cidade, r.regiao, r.pais].filter(Boolean).join(', '), visitas: n(r.visitas), trilha: String(r.trilha || '').split(' > ').filter(Boolean),
      enviou_contato: n(r.enviou_contato) === 1,
    })),
  }
}

export async function visitante(banco, id) {
  if (typeof id !== 'string' || !/^[a-z0-9]{10,32}$/.test(id)) return null
  const v = await uma(banco, 'SELECT * FROM visitantes WHERE id = ?', [id])
  if (!v.id) return null
  const sessoes = await todas(banco, 'SELECT id, inicio, fim, paginas, tempo_s, entrada, origem FROM sessoes WHERE visitante_id = ? ORDER BY inicio DESC LIMIT 20', [id])
  const out = []
  for (const s of sessoes) {
    const vs = await todas(banco, 'SELECT pagina, titulo, entrou_em, tempo_s, rolagem FROM visualizacoes WHERE sessao_id = ? ORDER BY entrou_em LIMIT 50', [String(s.id)])
    const cl = await todas(banco, 'SELECT c.pagina, c.zona, c.alvo, c.destino, c.em FROM cliques c JOIN visualizacoes w ON w.id = c.visualizacao_id WHERE w.sessao_id = ? ORDER BY c.em LIMIT 60', [String(s.id)])
    out.push({
      id: String(s.id), inicio: n(s.inicio), fim: n(s.fim), paginas: n(s.paginas), tempo_s: n(s.tempo_s), entrada: String(s.entrada || ''), origem: String(s.origem || ''),
      visualizacoes: vs.map((x) => ({ pagina: String(x.pagina), titulo: String(x.titulo || ''), em: n(x.entrou_em), tempo_s: n(x.tempo_s), rolagem: n(x.rolagem) })),
      cliques: cl.map((x) => ({ pagina: String(x.pagina), zona: String(x.zona || ''), alvo: String(x.alvo || ''), destino: String(x.destino || ''), em: n(x.em) })),
    })
  }
  return {
    id, rotulo: 'Visitante ' + id.slice(0, 6).toUpperCase(), primeiro_em: n(v.primeiro_em), ultimo_em: n(v.ultimo_em), sessoes_total: n(v.sessoes),
    dispositivo: String(v.dispositivo || ''), navegador: String(v.navegador || ''), so: String(v.so || ''), local: [v.cidade, v.regiao, v.pais].filter(Boolean).join(', '), origem: String(v.origem || ''),
    sessoes: out,
  }
}

export async function calor(banco, paginaEntrada, diasEntrada) {
  const { dias, desde: d } = desde(diasEntrada)
  const pagina = normalizarPagina(paginaEntrada)
  if (!pagina) return null
  const base = await uma(banco, `SELECT COUNT(*) vistas, COUNT(DISTINCT visitante_id) visitantes, COALESCE(AVG(NULLIF(tempo_s,0)),0) tempo_medio, COALESCE(AVG(NULLIF(altura,0)),0) altura,
      SUM(CASE WHEN rolagem >= 25 THEN 1 ELSE 0 END) r25, SUM(CASE WHEN rolagem >= 50 THEN 1 ELSE 0 END) r50, SUM(CASE WHEN rolagem >= 75 THEN 1 ELSE 0 END) r75, SUM(CASE WHEN rolagem >= 95 THEN 1 ELSE 0 END) r100
      FROM visualizacoes WHERE pagina = ? AND entrou_em >= ?`, [pagina, d])
  const grade = await todas(banco, `SELECT MIN(CAST(x * 20 AS INTEGER), 19) c, MIN(CAST(yr * 50 AS INTEGER), 49) l, COUNT(*) total FROM cliques WHERE pagina = ? AND em >= ? GROUP BY c, l`, [pagina, d])
  const zonas = await todas(banco, `SELECT c.zona zona, COALESCE(NULLIF(z.rotulo,''), c.zona) rotulo, COUNT(*) total, AVG(c.yr) posicao
      FROM cliques c LEFT JOIN zonas z ON z.pagina = c.pagina AND z.zona = c.zona WHERE c.pagina = ? AND c.em >= ? GROUP BY c.zona ORDER BY total DESC LIMIT 12`, [pagina, d])
  const alvos = await todas(banco, `SELECT alvo, destino, COUNT(*) total FROM cliques WHERE pagina = ? AND em >= ? AND (alvo <> '' OR destino <> '') GROUP BY alvo, destino ORDER BY total DESC LIMIT 10`, [pagina, d])
  const totalCliques = grade.reduce((a, r) => a + n(r.total), 0)
  const vistas = n(base.vistas)
  const pct = (x) => (vistas ? Math.round((n(x) / vistas) * 100) : 0)
  return {
    pagina, dias, visualizacoes: vistas, visitantes: n(base.visitantes), tempo_medio_s: Math.round(n(base.tempo_medio)), altura_media: Math.round(n(base.altura)),
    rolagem: { r25: pct(base.r25), r50: pct(base.r50), r75: pct(base.r75), r100: pct(base.r100) },
    cliques_total: totalCliques,
    grade: grade.map((r) => ({ c: n(r.c), l: n(r.l), total: n(r.total) })),
    zonas: zonas.map((r) => ({ zona: String(r.zona || ''), rotulo: String(r.rotulo || ''), total: n(r.total), parte: totalCliques ? Math.round((n(r.total) / totalCliques) * 100) : 0, posicao: Math.round(n(r.posicao) * 100) })),
    alvos: alvos.map((r) => ({ alvo: String(r.alvo || ''), destino: String(r.destino || ''), total: n(r.total) })),
  }
}
