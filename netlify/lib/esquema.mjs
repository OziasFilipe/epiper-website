// Estrutura do banco SQLite (Turso/libSQL). Criada sozinha no primeiro uso; mudanças futuras entram como novos itens em MIGRACOES.
// Dados pessoais (contatos) ficam em formularios.dados, SEMPRE cifrados (AES-256-GCM). Nenhuma tabela guarda IP, só o hash do dia.
export const MIGRACOES = [
  {
    versao: 1,
    sql: [
      `CREATE TABLE IF NOT EXISTS meta (chave TEXT PRIMARY KEY, valor TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS visitantes (
         id TEXT PRIMARY KEY, primeiro_em INTEGER NOT NULL, ultimo_em INTEGER NOT NULL, sessoes INTEGER NOT NULL DEFAULT 0,
         dispositivo TEXT, navegador TEXT, so TEXT, pais TEXT, regiao TEXT, cidade TEXT, idioma TEXT, origem TEXT,
         utm_fonte TEXT, utm_meio TEXT, utm_campanha TEXT, ip_hash TEXT)`,
      `CREATE TABLE IF NOT EXISTS sessoes (
         id TEXT PRIMARY KEY, visitante_id TEXT NOT NULL, inicio INTEGER NOT NULL, fim INTEGER NOT NULL, paginas INTEGER NOT NULL DEFAULT 0,
         tempo_s INTEGER NOT NULL DEFAULT 0, entrada TEXT, origem TEXT, utm_fonte TEXT, utm_meio TEXT, utm_campanha TEXT,
         dispositivo TEXT, navegador TEXT, so TEXT, pais TEXT, regiao TEXT, cidade TEXT)`,
      `CREATE TABLE IF NOT EXISTS visualizacoes (
         id TEXT PRIMARY KEY, sessao_id TEXT NOT NULL, visitante_id TEXT NOT NULL, pagina TEXT NOT NULL, titulo TEXT,
         entrou_em INTEGER NOT NULL, atualizou_em INTEGER NOT NULL, tempo_s INTEGER NOT NULL DEFAULT 0, rolagem INTEGER NOT NULL DEFAULT 0,
         largura INTEGER, altura INTEGER)`,
      `CREATE TABLE IF NOT EXISTS cliques (
         id INTEGER PRIMARY KEY AUTOINCREMENT, visualizacao_id TEXT NOT NULL, pagina TEXT NOT NULL, x REAL NOT NULL, y INTEGER NOT NULL, yr REAL NOT NULL,
         zona TEXT, alvo TEXT, destino TEXT, em INTEGER NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS zonas (pagina TEXT NOT NULL, zona TEXT NOT NULL, rotulo TEXT, PRIMARY KEY (pagina, zona))`,
      `CREATE TABLE IF NOT EXISTS formularios (
         id INTEGER PRIMARY KEY AUTOINCREMENT, criado_em INTEGER NOT NULL, visitante_id TEXT, pagina TEXT, interesse TEXT,
         dados TEXT NOT NULL, lido INTEGER NOT NULL DEFAULT 0, ip_hash TEXT)`,
      `CREATE TABLE IF NOT EXISTS nonces (nonce TEXT PRIMARY KEY, em INTEGER NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS limites (chave TEXT PRIMARY KEY, inicio INTEGER NOT NULL, n INTEGER NOT NULL)`,
      `CREATE INDEX IF NOT EXISTS ix_sessoes_inicio ON sessoes (inicio)`,
      `CREATE INDEX IF NOT EXISTS ix_sessoes_visitante ON sessoes (visitante_id)`,
      `CREATE INDEX IF NOT EXISTS ix_vis_sessao ON visualizacoes (sessao_id)`,
      `CREATE INDEX IF NOT EXISTS ix_vis_pagina_data ON visualizacoes (pagina, entrou_em)`,
      `CREATE INDEX IF NOT EXISTS ix_vis_data ON visualizacoes (entrou_em)`,
      `CREATE INDEX IF NOT EXISTS ix_cliques_pagina ON cliques (pagina, em)`,
      `CREATE INDEX IF NOT EXISTS ix_cliques_vis ON cliques (visualizacao_id)`,
      `CREATE INDEX IF NOT EXISTS ix_form_criado ON formularios (criado_em)`,
    ],
  },
]

export async function migrar(banco) {
  await banco.execute('CREATE TABLE IF NOT EXISTS meta (chave TEXT PRIMARY KEY, valor TEXT NOT NULL)')
  const r = await banco.execute({ sql: 'SELECT valor FROM meta WHERE chave = ?', args: ['esquema'] })
  const atual = r.rows.length ? parseInt(r.rows[0].valor, 10) : 0
  for (const m of MIGRACOES.filter((x) => x.versao > atual)) {
    await banco.batch(m.sql.map((sql) => ({ sql, args: [] })), 'write')
    await banco.execute({ sql: 'INSERT INTO meta (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor', args: ['esquema', String(m.versao)] })
  }
}
