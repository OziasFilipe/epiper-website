// Função do Netlify: /api/hub/*. A lógica fica em netlify/lib/manipuladores.mjs (testada sem o Netlify).
import { banco } from '../lib/banco.mjs'
import { ambiente } from '../lib/seguranca.mjs'
import { hub } from '../lib/manipuladores.mjs'
import { resposta } from '../lib/util.mjs'

export default async (req, context) => {
  try {
    return await hub(req, context, { banco: await banco(), amb: ambiente() })
  } catch (e) {
    console.error('hub: falha:', e && e.message ? String(e.message).slice(0, 200) : 'desconhecida')
    return resposta(503, { erro: 'indisponivel' })
  }
}

export const config = { path: '/api/hub/*' }
