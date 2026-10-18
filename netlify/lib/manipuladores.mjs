// Lógica das três funções (coletar, contato, hub), separada para poder ser testada sem o Netlify.
import * as consultas from './consultas.mjs'
import { guardarContato, listarContatos, marcarLido, validarContato } from './contatos.mjs'
import { limpar, registrarColeta } from './rastreio.mjs'
import { hashIp, limitar, verificarHub } from './seguranca.mjs'
import { analisarUA, geoDe, inteiro, ipDe, lerCorpo, lerJson, origemPermitida, resposta } from './util.mjs'

const naoAutorizado = () => resposta(401, { erro: 'nao_autorizado' })

function origemOk(req, amb) {
  return origemPermitida(req, amb.origens) || (!req.headers.get('origin') && req.headers.get('sec-fetch-site') === 'same-origin')
}

// ------------------------------------------------------------------------------------------------------- /api/coletar
export async function coletar(req, context, { banco, amb }) {
  if (req.method !== 'POST') return resposta(405, { erro: 'metodo' }, { allow: 'POST' })
  if (!origemOk(req, amb)) return resposta(403, { erro: 'origem' })
  if (req.headers.get('dnt') === '1' || req.headers.get('sec-gpc') === '1') return resposta(204) // quem pediu para não ser rastreado não é

  const ua = analisarUA(req.headers.get('user-agent') || '')
  if (ua.bot) return resposta(204)

  const ipHash = hashIp(ipDe(req, context), amb.segredoIp)
  if (!(await limitar(banco, `col:${ipHash}`, 400, 600))) return resposta(429, { erro: 'limite' }, { 'retry-after': '120' })

  const lido = await lerCorpo(req, 6 * 1024)
  if (lido.erro) return resposta(413, { erro: 'grande_demais' })
  const corpo = lerJson(lido.texto)
  if (corpo) await registrarColeta(banco, corpo, { ipHash, ua, geo: geoDe(context) })

  if (Math.random() < 0.005) await limpar(banco, amb.retencaoDias) // limpeza oportunista, sem agendador
  return resposta(204)
}

// ------------------------------------------------------------------------------------------------------- /api/contato
export async function contato(req, context, { banco, amb }) {
  if (req.method !== 'POST') return resposta(405, { erro: 'metodo' }, { allow: 'POST' })
  if (!origemOk(req, amb)) return resposta(403, { erro: 'origem' })
  if (!amb.chaveCampos) return resposta(503, { erro: 'indisponivel' })

  const ipHash = hashIp(ipDe(req, context), amb.segredoIp)
  if (!(await limitar(banco, `form:${ipHash}`, 5, 3600)) || !(await limitar(banco, 'formtotal', 300, 86400))) {
    return resposta(429, { erro: 'limite' }, { 'retry-after': '600' })
  }

  const lido = await lerCorpo(req, 8 * 1024)
  if (lido.erro) return resposta(413, { erro: 'grande_demais' })
  const v = validarContato(lerJson(lido.texto))
  if (!v.ok) return resposta(400, { erro: 'invalido', campo: v.erro })
  if (v.robo) return resposta(200, { ok: true }) // finge sucesso: o robô não aprende o que o derrubou

  await guardarContato(banco, v, ipHash, amb.chaveCampos)
  return resposta(200, { ok: true })
}

// ------------------------------------------------------------------------------------------------------- /api/hub/*
export async function hub(req, context, { banco, amb }) {
  if (req.method !== 'GET' && req.method !== 'POST') return resposta(405, { erro: 'metodo' })
  const ip = ipDe(req, context)
  const ipHash = hashIp(ip, amb.segredoIp)

  const lido = req.method === 'POST' ? await lerCorpo(req, 2 * 1024) : { texto: '' }
  if (lido.erro) return resposta(413, { erro: 'grande_demais' })

  const auth = await verificarHub({ req, corpo: lido.texto, ip, ipHash, banco, amb })
  if (!auth.ok) {
    console.warn('hub: acesso recusado:', auth.motivo)
    return naoAutorizado()
  }

  const url = new URL(req.url)
  const acao = url.pathname.replace(/^\/api\/hub\/?/, '').replace(/\/+$/, '')
  const q = url.searchParams
  const dias = q.get('dias')
  try {
    if (req.method === 'GET') {
      switch (acao) {
        case 'saude': await limpar(banco, amb.retencaoDias); return resposta(200, { ok: true, agora: Math.floor(Date.now() / 1000) })
        case 'resumo': return resposta(200, await consultas.resumo(banco, dias))
        case 'paginas': return resposta(200, await consultas.paginas(banco, dias))
        case 'visitantes': return resposta(200, await consultas.visitantes(banco, dias, { limite: q.get('limite'), deslocamento: q.get('deslocamento'), pagina: q.get('pagina') || '' }))
        case 'visitante': {
          const v = await consultas.visitante(banco, q.get('id'))
          return v ? resposta(200, v) : resposta(404, { erro: 'nao_encontrado' })
        }
        case 'calor': {
          const c = await consultas.calor(banco, q.get('pagina'), dias)
          return c ? resposta(200, c) : resposta(404, { erro: 'nao_encontrado' })
        }
        case 'contatos': {
          if (!amb.chaveCampos) return resposta(503, { erro: 'indisponivel' })
          return resposta(200, { contatos: await listarContatos(banco, amb.chaveCampos, { apos: inteiro(q.get('apos'), 0, 2 ** 40, 0), antes: inteiro(q.get('antes'), 0, 2 ** 40, 0), ordem: q.get('ordem') === 'desc' ? 'desc' : 'asc', limite: q.get('limite') }) })
        }
        default: return resposta(404, { erro: 'nao_encontrado' })
      }
    }
    if (acao === 'contatos/lido') {
      const corpo = lerJson(lido.texto)
      if (!corpo || !Number.isInteger(corpo.id)) return resposta(400, { erro: 'invalido' })
      return resposta(200, { ok: await marcarLido(banco, corpo.id, corpo.lido !== false) })
    }
    return resposta(404, { erro: 'nao_encontrado' })
  } catch (e) {
    console.error('hub: erro interno:', e && e.message ? String(e.message).slice(0, 200) : 'desconhecido')
    return resposta(500, { erro: 'interno' })
  }
}
