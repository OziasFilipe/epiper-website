const initSqlJs = require('sql.js');
const { getStore } = require('@netlify/blobs');

const ADMIN_PASSWORD = '821760';
const DB_KEY = 'epiper_leads.db';
const STORE_NAME = 'leads-store';

function escapeCsv(val) {
  const s = String(val ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

function getClientIp(event) {
  return event.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || event.headers['client-ip']
    || event.headers['x-real-ip']
    || 'desconhecido';
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  try {
    const SQL = await initSqlJs();
    const store = getStore(STORE_NAME);

    let db;
    const existing = await store.get(DB_KEY, { type: 'arrayBuffer' }).catch(() => null);
    if (existing && existing.byteLength > 0) {
      db = new SQL.Database(new Uint8Array(existing));
    } else {
      db = new SQL.Database();
      db.run(`CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        empresa TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT NOT NULL,
        mensagem TEXT DEFAULT '',
        modulo TEXT DEFAULT '',
        origem TEXT DEFAULT 'site',
        ip TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'novo'
      )`);
    }

    if (event.httpMethod === 'POST') {
      const params = new URLSearchParams(event.body || '');
      const action = params.get('action');

      if (action === 'update_status') {
        const password = params.get('password') || '';
        if (password !== ADMIN_PASSWORD) {
          db.close();
          return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: 'Senha inválida.' }) };
        }
        const id = params.get('id');
        const status = params.get('status');
        if (!id || !status) {
          db.close();
          return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'ID e status sao obrigatorios.' }) };
        }
        db.run(`UPDATE leads SET status = ? WHERE id = ?`, [status, id]);
        const data = db.export();
        await store.set(DB_KEY, Buffer.from(data));
        db.close();
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, message: 'Status atualizado.' }) };
      }

      if (action === 'delete') {
        const password = params.get('password') || '';
        if (password !== ADMIN_PASSWORD) {
          db.close();
          return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: 'Senha inválida.' }) };
        }
        const id = params.get('id');
        if (!id) {
          db.close();
          return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'ID obrigatorio.' }) };
        }
        db.run(`DELETE FROM leads WHERE id = ?`, [id]);
        const data = db.export();
        await store.set(DB_KEY, Buffer.from(data));
        db.close();
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, message: 'Lead excluido.' }) };
      }

      const nome = params.get('nome')?.trim();
      const empresa = params.get('empresa')?.trim();
      const email = params.get('email')?.trim();
      const telefone = params.get('telefone')?.trim();
      const mensagem = params.get('mensagem')?.trim() || '';
      const modulo = params.get('modulo')?.trim() || '';

      if (!nome || !empresa || !email || !telefone) {
        db.close();
        return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Preencha todos os campos obrigatorios.' }) };
      }

      const ip = getClientIp(event);
      db.run(`INSERT INTO leads (nome, empresa, email, telefone, mensagem, modulo, origem, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [nome, empresa, email, telefone, mensagem, modulo, 'site', ip]);

      const data = db.export();
      await store.set(DB_KEY, Buffer.from(data));
      db.close();

      return { statusCode: 201, headers, body: JSON.stringify({ ok: true, message: 'Lead cadastrado com sucesso.' }) };
    }

    if (event.httpMethod === 'GET') {
      const url = new URL(event.rawUrl);
      const action = url.searchParams.get('action') || 'list';
      const password = url.searchParams.get('password') || event.headers['x-admin-password'] || '';

      if (action === 'export') {
        if (password !== ADMIN_PASSWORD) {
          db.close();
          return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: 'Senha inválida.' }) };
        }

        const rows = db.exec(`SELECT * FROM leads ORDER BY created_at DESC`);
        db.close();

        const cols = ['id','nome','empresa','email','telefone','mensagem','modulo','origem','ip','created_at','status'];
        let csv = cols.map(escapeCsv).join(',') + '\n';
        if (rows.length > 0) {
          for (const row of rows[0].values) {
            csv += row.map(escapeCsv).join(',') + '\n';
          }
        }

        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename=leads_epiper.csv' },
          body: csv,
        };
      }

      if (password !== ADMIN_PASSWORD) {
        db.close();
        return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: 'Senha inválida.' }) };
      }

      const rows = db.exec(`SELECT * FROM leads ORDER BY created_at DESC`);
      db.close();

      const cols = ['id','nome','empresa','email','telefone','mensagem','modulo','origem','ip','created_at','status'];
      const leads = rows.length > 0 ? rows[0].values.map(v => {
        const obj = {};
        cols.forEach((c, i) => obj[c] = v[i]);
        return obj;
      }) : [];

      return { statusCode: 200, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, leads }) };
    }

    db.close();
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'Metodo nao permitido.' }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'Erro interno do servidor.' }) };
  }
};
