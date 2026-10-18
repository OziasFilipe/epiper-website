// Coleta de visitas: validação estrita do que o navegador envia e gravação em lote. Só entra o que está nas listas permitidas.
import { agora, decimal, ehId, hostDe, inteiro, normalizarPagina, texto } from './util.mjs'

export const MAX_EVENTOS = 25
export const MAX_CLIQUES_POR_PAGINA = 40
export const MAX_ZONAS_POR_PAGINA = 60
const MAX_TEMPO_PAGINA_S = 4 * 3600

const BUSCAS = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|brave)\./i
const SOCIAIS = /(^|\.)(facebook|instagram|linkedin|youtube|whatsapp|t\.co|twitter|x\.com|tiktok)(\.|$)/i

export function classificarOrigem(referenciaHost, utm, hostProprio = 'epiper.com.br') {
  if (utm.fonte) return texto(`campanha:${utm.fonte}${utm.meio ? '/' + utm.meio : ''}`, 60)
  if (!referenciaHost || referenciaHost === hostProprio) return 'direto'
  if (BUSCAS.test(referenciaHost)) return `busca:${referenciaHost.split('.')[0]}`
  if (SOCIAIS.test(referenciaHost)) return `social:${referenciaHost.split('.')[0]}`
  return referenciaHost
}

const slug = (v, max) => texto(String(v ?? ''), max).toLowerCase().replace(/[^a-z0-9_\-:./ ]/g, '')

/**
 * @param {object} corpo  JSON enviado pelo navegador
 * @param {{ipHash: string, ua: object, geo: object}} info
 * @returns {Promise<{aceitos: number}>}
 */
export async function registrarColeta(banco, corpo, info) {
  if (!corpo || !ehId(corpo.v) || !ehId(corpo.s) || !Array.isArray(corpo.e)) return { aceitos: 0 }
  const eventos = corpo.e.slice(0, MAX_EVENTOS)
  const visitante = corpo.v
  const sessao = corpo.s
  const t = agora()
  let aceitos = 0

  for (const ev of eventos) {
    if (!ev || typeof ev !== 'object') continue
    switch (ev.k) {
      case 'pv': aceitos += (await paginaVista(banco, visitante, sessao, ev, info, t)) ? 1 : 0; break
      case 'hb': aceitos += (await batimento(banco, visitante, sessao, ev, t)) ? 1 : 0; break
      case 'cl': aceitos += (await clique(banco, visitante, ev, t)) ? 1 : 0; break
      case 'zn': aceitos += (await zona(banco, ev)) ? 1 : 0; break
      default: break
    }
  }
  return { aceitos }
}

async function paginaVista(banco, visitante, sessao, ev, info, t) {
  const pagina = normalizarPagina(ev.p)
  if (!pagina || !ehId(ev.id)) return false
  const referencia = hostDe(ev.r)
  const utm = { fonte: slug(ev.u?.s, 40), meio: slug(ev.u?.m, 40), campanha: slug(ev.u?.c, 60) }
  const origem = classificarOrigem(referencia, utm)
  const { dispositivo, navegador, so } = info.ua
  const { pais, regiao, cidade } = info.geo
  const idioma = texto(String(ev.i ?? ''), 12)

  const r = await banco.batch([
    {
      sql: `INSERT INTO visitantes (id, primeiro_em, ultimo_em, sessoes, dispositivo, navegador, so, pais, regiao, cidade, idioma, origem, utm_fonte, utm_meio, utm_campanha, ip_hash)
            VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET ultimo_em = excluded.ultimo_em, dispositivo = excluded.dispositivo, navegador = excluded.navegador, so = excluded.so,
              pais = excluded.pais, regiao = excluded.regiao, cidade = excluded.cidade, ip_hash = excluded.ip_hash`,
      args: [visitante, t, t, dispositivo, navegador, so, pais, regiao, cidade, idioma, origem, utm.fonte, utm.meio, utm.campanha, info.ipHash],
    },
    {
      sql: `INSERT OR IGNORE INTO sessoes (id, visitante_id, inicio, fim, paginas, tempo_s, entrada, origem, utm_fonte, utm_meio, utm_campanha, dispositivo, navegador, so, pais, regiao, cidade)
            VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [sessao, visitante, t, t, pagina, origem, utm.fonte, utm.meio, utm.campanha, dispositivo, navegador, so, pais, regiao, cidade],
    },
  ], 'write')

  if (r[1].rowsAffected === 1) await banco.execute({ sql: 'UPDATE visitantes SET sessoes = sessoes + 1 WHERE id = ?', args: [visitante] })

  const nova = await banco.execute({
    sql: `INSERT OR IGNORE INTO visualizacoes (id, sessao_id, visitante_id, pagina, titulo, entrou_em, atualizou_em, tempo_s, rolagem, largura, altura)
          SELECT ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?
          WHERE EXISTS (SELECT 1 FROM sessoes WHERE id = ? AND visitante_id = ?)`,
    args: [ev.id, sessao, visitante, pagina, texto(String(ev.t ?? ''), 120), t, t, inteiro(ev.w, 0, 10000), inteiro(ev.h, 0, 10000), sessao, visitante],
  })
  if (nova.rowsAffected === 1) {
    await banco.execute({ sql: 'UPDATE sessoes SET paginas = paginas + 1, fim = ? WHERE id = ? AND visitante_id = ?', args: [t, sessao, visitante] })
  }
  return true
}

async function batimento(banco, visitante, sessao, ev, t) {
  if (!ehId(ev.id)) return false
  const tempo = inteiro(ev.t, 0, MAX_TEMPO_PAGINA_S)
  const rolagem = inteiro(ev.d, 0, 100)
  const altura = inteiro(ev.H, 0, 200000)
  // o tempo nunca pode passar do que realmente decorreu desde que a página abriu (anti-inflação)
  const r = await banco.execute({
    sql: `UPDATE visualizacoes SET tempo_s = MAX(tempo_s, MIN(?, ? - entrou_em + 10)), rolagem = MAX(rolagem, ?), altura = CASE WHEN ? > 0 THEN ? ELSE altura END, atualizou_em = ?
          WHERE id = ? AND visitante_id = ? AND sessao_id = ?`,
    args: [tempo, t, rolagem, altura, altura, t, ev.id, visitante, sessao],
  })
  if (r.rowsAffected !== 1) return false
  await banco.execute({
    sql: `UPDATE sessoes SET fim = ?, tempo_s = (SELECT COALESCE(SUM(tempo_s), 0) FROM visualizacoes WHERE sessao_id = ?) WHERE id = ? AND visitante_id = ?`,
    args: [t, sessao, sessao, visitante],
  })
  await banco.execute({ sql: 'UPDATE visitantes SET ultimo_em = ? WHERE id = ?', args: [t, visitante] })
  return true
}

async function clique(banco, visitante, ev, t) {
  const pagina = normalizarPagina(ev.p)
  if (!pagina || !ehId(ev.id)) return false
  const x = decimal(ev.x, 0, 1)
  const yr = decimal(ev.yr, 0, 1)
  const y = inteiro(ev.y, 0, 200000)
  const destino = typeof ev.d === 'string' ? texto(ev.d.split('?')[0].split('#')[0], 120) : ''
  const r = await banco.execute({
    sql: `INSERT INTO cliques (visualizacao_id, pagina, x, y, yr, zona, alvo, destino, em)
          SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
          WHERE EXISTS (SELECT 1 FROM visualizacoes WHERE id = ? AND visitante_id = ? AND pagina = ?)
            AND (SELECT COUNT(*) FROM cliques WHERE visualizacao_id = ?) < ?`,
    args: [ev.id, pagina, x, y, yr, slug(ev.z, 40), texto(String(ev.a ?? ''), 60), destino, t, ev.id, visitante, pagina, ev.id, MAX_CLIQUES_POR_PAGINA],
  })
  return r.rowsAffected === 1
}

async function zona(banco, ev) {
  const pagina = normalizarPagina(ev.p)
  const z = slug(ev.z, 40)
  if (!pagina || !z) return false
  const r = await banco.execute({
    sql: `INSERT INTO zonas (pagina, zona, rotulo)
          SELECT ?, ?, ? WHERE (SELECT COUNT(*) FROM zonas WHERE pagina = ?) < ?
          ON CONFLICT(pagina, zona) DO UPDATE SET rotulo = excluded.rotulo`,
    args: [pagina, z, texto(String(ev.r ?? ''), 60), pagina, MAX_ZONAS_POR_PAGINA],
  })
  return r.rowsAffected >= 0
}

/** Limpeza periódica: dados antigos, nonces vencidos e contadores velhos. */
export async function limpar(banco, retencaoDias) {
  const t = agora()
  const corte = t - retencaoDias * 86400
  await banco.batch([
    { sql: 'DELETE FROM nonces WHERE em < ?', args: [t - 600] },
    { sql: 'DELETE FROM limites WHERE inicio < ?', args: [t - 86400] },
    { sql: 'DELETE FROM cliques WHERE em < ?', args: [corte] },
    { sql: 'DELETE FROM visualizacoes WHERE entrou_em < ?', args: [corte] },
    { sql: 'DELETE FROM sessoes WHERE inicio < ?', args: [corte] },
    { sql: 'DELETE FROM visitantes WHERE ultimo_em < ? AND id NOT IN (SELECT visitante_id FROM formularios WHERE visitante_id IS NOT NULL)', args: [corte] },
  ], 'write')
}
