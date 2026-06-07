const fs = require('fs');
const ADMIN_PASSWORD = '821760';
const DB_PATH = '/tmp/leads.json';

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function writeDb(leads) {
  fs.writeFileSync(DB_PATH, JSON.stringify(leads, null, 2));
}

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
    if (event.httpMethod === 'POST') {
      const params = new URLSearchParams(event.body || '');
      const action = params.get('action');

      if (action === 'update_status') {
        const password = params.get('password') || '';
        if (password !== ADMIN_PASSWORD) {
          return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: 'Senha invalida.' }) };
        }
        const id = Number(params.get('id'));
        const status = params.get('status');
        if (!id || !status) {
          return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'ID e status sao obrigatorios.' }) };
        }
        const leads = readDb();
        const idx = leads.findIndex(l => l.id === id);
        if (idx === -1) {
          return { statusCode: 404, headers, body: JSON.stringify({ ok: false, error: 'Lead nao encontrado.' }) };
        }
        leads[idx].status = status;
        writeDb(leads);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, message: 'Status atualizado.' }) };
      }

      if (action === 'delete') {
        const password = params.get('password') || '';
        if (password !== ADMIN_PASSWORD) {
          return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: 'Senha invalida.' }) };
        }
        const id = Number(params.get('id'));
        if (!id) {
          return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'ID obrigatorio.' }) };
        }
        const leads = readDb();
        const filtered = leads.filter(l => l.id !== id);
        if (filtered.length === leads.length) {
          return { statusCode: 404, headers, body: JSON.stringify({ ok: false, error: 'Lead nao encontrado.' }) };
        }
        writeDb(filtered);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, message: 'Lead excluido.' }) };
      }

      const leads = readDb();
      const nextId = leads.length > 0 ? Math.max(...leads.map(l => l.id)) + 1 : 1;

      const lead = {
        id: nextId,
        nome: (params.get('nome') || '').trim(),
        empresa: (params.get('empresa') || '').trim(),
        email: (params.get('email') || '').trim(),
        telefone: (params.get('telefone') || '').trim(),
        mensagem: (params.get('mensagem') || '').trim(),
        modulo: (params.get('modulo') || '').trim(),
        interesse: (params.get('interesse') || '').trim(),
        origem: 'site',
        ip: getClientIp(event),
        created_at: new Date().toISOString(),
        status: 'novo',
      };

      if (!lead.nome || !lead.empresa || !lead.email || !lead.telefone) {
        return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Preencha todos os campos obrigatorios.' }) };
      }

      leads.push(lead);
      writeDb(leads);

      return { statusCode: 201, headers, body: JSON.stringify({ ok: true, message: 'Lead cadastrado com sucesso.' }) };
    }

    if (event.httpMethod === 'GET') {
      const url = new URL(event.rawUrl);
      const action = url.searchParams.get('action') || 'list';
      const password = url.searchParams.get('password') || event.headers['x-admin-password'] || '';

      if (action === 'export') {
        if (password !== ADMIN_PASSWORD) {
          return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: 'Senha invalida.' }) };
        }

        const leads = readDb();
        const cols = ['id','nome','empresa','email','telefone','mensagem','modulo','interesse','origem','ip','created_at','status'];
        let csv = cols.map(escapeCsv).join(',') + '\n';
        for (const lead of leads) {
          csv += cols.map(c => escapeCsv(lead[c])).join(',') + '\n';
        }

        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename=leads_epiper.csv' },
          body: csv,
        };
      }

      if (password !== ADMIN_PASSWORD) {
        return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: 'Senha invalida.' }) };
      }

      const leads = readDb().reverse();
      return { statusCode: 200, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, leads }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'Metodo nao permitido.' }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'Erro interno do servidor.', detail: err.message }) };
  }
};
