// Função do Netlify: /api/contato. A lógica fica em netlify/lib/manipuladores.mjs (testada sem o Netlify).
import { banco } from '../lib/banco.mjs'
import { ambiente } from '../lib/seguranca.mjs'
import { contato } from '../lib/manipuladores.mjs'
import { resposta } from '../lib/util.mjs'

export default async (req, context) => {
  try {
    return await contato(req, context, { banco: await banco(), amb: ambiente() })
  } catch (e) {
    console.error('contato: falha:', e && e.message ? String(e.message).slice(0, 200) : 'desconhecida')
    return resposta(503, { erro: 'indisponivel' })
  }
}

export const config = { path: '/api/contato' }
