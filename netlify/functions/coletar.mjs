// Função do Netlify: /api/coletar. A lógica fica em netlify/lib/manipuladores.mjs (testada sem o Netlify).
import { banco } from '../lib/banco.mjs'
import { ambiente } from '../lib/seguranca.mjs'
import { coletar } from '../lib/manipuladores.mjs'
import { resposta } from '../lib/util.mjs'

export default async (req, context) => {
  try {
    return await coletar(req, context, { banco: await banco(), amb: ambiente() })
  } catch (e) {
    console.error('coletar: falha:', e && e.message ? String(e.message).slice(0, 200) : 'desconhecida')
    return resposta(503, { erro: 'indisponivel' })
  }
}

export const config = { path: '/api/coletar' }
