// Conexão com o banco SQLite hospedado (Turso/libSQL). A "senha" do banco é o token EPIPER_BANCO_TOKEN, que fica só nas
// variáveis de ambiente do Netlify. Em produção usa o cliente web (só fetch, sem módulo nativo); os testes injetam um banco local.
import { createClient } from '@libsql/client/web'
import { migrar } from './esquema.mjs'

let cliente = null
let pronto = null

export function usarBanco(c) {
  cliente = c
  pronto = migrar(c)
  return pronto
}

export async function banco(env = process.env) {
  if (!cliente) {
    const url = env.EPIPER_BANCO_URL
    const authToken = env.EPIPER_BANCO_TOKEN
    if (!url || !authToken) throw new Error('Banco não configurado (EPIPER_BANCO_URL e EPIPER_BANCO_TOKEN).')
    if (!/^(libsql|https):\/\//.test(url)) throw new Error('EPIPER_BANCO_URL precisa ser libsql:// ou https://.')
    cliente = createClient({ url, authToken })
    pronto = migrar(cliente)
  }
  await pronto
  return cliente
}
