// Contatos enviados pelo formulário "Fale com um especialista". Os dados pessoais são cifrados antes de ir ao banco.
import { cifrar, decifrar } from './seguranca.mjs'
import { agora, ehId, inteiro, normalizarPagina, texto } from './util.mjs'

const EMAIL = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[A-Za-z]{2,24}$/
export const TEMPO_MINIMO_MS = 3000

/** Valida e normaliza. Devolve { erro } (campo) ou { ok, dados, interesse, visitante, pagina }. */
export function validarContato(c, agoraMs = Date.now()) {
  if (!c || typeof c !== 'object') return { erro: 'corpo' }
  if (c.consentimento !== true) return { erro: 'consentimento' }
  const nome = texto(c.nome, 80)
  const empresa = texto(c.empresa, 100)
  const telefone = String(c.telefone ?? '').replace(/\D/g, '').slice(0, 15)
  const email = texto(c.email, 120).toLowerCase()
  if (nome.length < 3) return { erro: 'nome' }
  if (empresa.length < 2) return { erro: 'empresa' }
  if (telefone.length < 10 || telefone.length > 15) return { erro: 'telefone' }
  if (!EMAIL.test(email)) return { erro: 'email' }
  const interesse = texto(c.interesse, 60)
  if (!interesse) return { erro: 'interesse' }
  const canais = Array.isArray(c.canais) ? c.canais.slice(0, 8).map((x) => texto(x, 40)).filter(Boolean) : []
  return {
    ok: true,
    interesse,
    visitante: ehId(c.visitante) ? c.visitante : null,
    pagina: normalizarPagina(c.pagina) || '/fale-com-especialista',
    dados: {
      nome, empresa, telefone, email,
      segmento: texto(c.segmento, 40), erp: texto(c.erp, 80), cargo: texto(c.cargo, 40),
      vendedores: texto(c.vendedores, 30), volume: texto(c.volume, 30), prazo: texto(c.prazo, 40), canais,
      mensagem: texto(c.mensagem, 1000),
    },
    // sinais de robô (não validam nada para o visitante; só decidem se guardamos)
    robo: (typeof c.hp === 'string' && c.hp.length > 0) || !(inteiro(c.t0, 0, 4e12, 0) > 0) || agoraMs - inteiro(c.t0, 0, 4e12, 0) < TEMPO_MINIMO_MS,
  }
}

export async function guardarContato(banco, v, ipHash, chaveCampos) {
  await banco.execute({
    sql: 'INSERT INTO formularios (criado_em, visitante_id, pagina, interesse, dados, lido, ip_hash) VALUES (?, ?, ?, ?, ?, 0, ?)',
    args: [agora(), v.visitante, v.pagina, v.interesse, cifrar(JSON.stringify(v.dados), chaveCampos), ipHash],
  })
}

/** Para o Hub: contatos já decifrados, mais o caminho que o visitante percorreu. Em ordem crescente (apos = só os mais novos que o id) ou decrescente (antes = só os mais velhos que o id). */
export async function listarContatos(banco, chaveCampos, { apos = 0, antes = 0, ordem = 'asc', limite = 50 } = {}) {
  const lim = inteiro(limite, 1, 100, 50)
  const desc = ordem === 'desc'
  const r = desc
    ? await banco.execute({ sql: `SELECT id, criado_em, visitante_id, pagina, interesse, dados, lido FROM formularios WHERE (? = 0 OR id < ?) ORDER BY id DESC LIMIT ?`, args: [inteiro(antes, 0, 2 ** 40), inteiro(antes, 0, 2 ** 40), lim] })
    : await banco.execute({ sql: 'SELECT id, criado_em, visitante_id, pagina, interesse, dados, lido FROM formularios WHERE id > ? ORDER BY id ASC LIMIT ?', args: [inteiro(apos, 0, 2 ** 40), lim] })
  const saida = []
  for (const l of r.rows) {
    let dados = {}
    try { dados = JSON.parse(decifrar(l.dados, chaveCampos)) } catch { dados = { nome: '(não foi possível decifrar)' } }
    let trilha = []
    if (l.visitante_id) {
      const t = await banco.execute({ sql: 'SELECT pagina, entrou_em, tempo_s FROM visualizacoes WHERE visitante_id = ? AND entrou_em <= ? ORDER BY entrou_em DESC LIMIT 12', args: [l.visitante_id, Number(l.criado_em)] })
      trilha = t.rows.map((x) => ({ pagina: String(x.pagina), em: Number(x.entrou_em), tempo_s: Number(x.tempo_s) })).reverse()
    }
    saida.push({ id: Number(l.id), criado_em: Number(l.criado_em), pagina: String(l.pagina || ''), interesse: String(l.interesse || ''), lido: Number(l.lido) === 1, visitante: l.visitante_id ? String(l.visitante_id) : null, ...dados, trilha })
  }
  return saida
}

export async function marcarLido(banco, id, lido = true) {
  const r = await banco.execute({ sql: 'UPDATE formularios SET lido = ? WHERE id = ?', args: [lido ? 1 : 0, inteiro(id, 1, 2 ** 40)] })
  return r.rowsAffected === 1
}
