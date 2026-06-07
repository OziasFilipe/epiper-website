const fs = require('fs');
const ADMIN_PASSWORD = '821760';
const DB_PATH = '/tmp/leads.json';

const WHATSAPP_TO = '5527996217169';
const WHATSAPP_URL = 'https://whatsapp.conectaped.com/whatsapp/send?sessionId=site';

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'comercial@epiper.com.br';

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

function formatWhatsAppText(lead) {
  let text = `🔔 *Novo Lead ePiper!*\n\n`;
  text += `*Nome:* ${lead.nome}\n`;
  text += `*Empresa:* ${lead.empresa}\n`;
  text += `*Email:* ${lead.email}\n`;
  text += `*Telefone:* ${lead.telefone}\n`;
  text += `*Módulo:* ${lead.modulo}\n`;
  if (lead.interesse) text += `*Interesse:* ${lead.interesse}\n`;
  if (lead.mensagem) text += `*Mensagem:* ${lead.mensagem}\n`;
  text += `\n📅 ${new Date(lead.created_at).toLocaleString('pt-BR')}`;
  return text;
}

function formatEmailHtml(lead) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Inter',sans-serif;background:#f5f6fa;margin:0;padding:24px;">
  <table style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
    <tr><td style="background:linear-gradient(135deg,#089c6a,#067a51);padding:24px;text-align:center;">
      <img src="https://epiper.com.br/assets/epiper.png" alt="ePiper" style="height:40px;" />
      <h1 style="color:#fff;font-size:20px;margin:12px 0 0;">Novo Lead Cadastrado</h1>
    </td></tr>
    <tr><td style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;">
        ${[['Nome', lead.nome], ['Empresa', lead.empresa], ['Email', lead.email], ['Telefone', lead.telefone], ['Módulo', lead.modulo], ['Interesse', lead.interesse], ['Mensagem', lead.mensagem], ['Data', new Date(lead.created_at).toLocaleString('pt-BR')]]
          .filter(([, v]) => v)
          .map(([k, v]) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eef0f6;font-size:12px;color:#a0a3bd;text-transform:uppercase;letter-spacing:0.05em;width:120px;">${k}</td><td style="padding:8px 0;border-bottom:1px solid #eef0f6;font-size:14px;color:#1f1f39;">${v}</td></tr>`).join('')}
      </table>
      <p style="margin-top:24px;font-size:13px;color:#a0a3bd;text-align:center;">
        <a href="https://epiper.com.br/admin" style="color:#089c6a;">Ver no painel</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

async function notifyWhatsApp(lead) {
  try {
    const text = formatWhatsAppText(lead);
    const res = await fetch(WHATSAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: '*/*' },
      body: JSON.stringify({ to: WHATSAPP_TO, text }),
    });
    const body = await res.text();
    console.log('WhatsApp sent:', res.status, body);
  } catch (err) {
    console.error('WhatsApp failed:', err.message);
  }
}

async function notifyEmail(lead) {
  try {
    const nodemailer = require('nodemailer');
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      console.log('Email notification skipped: SMTP_HOST, SMTP_USER, SMTP_PASS not configured');
      return;
    }
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || user,
      to: NOTIFY_EMAIL,
      subject: `Novo Lead: ${lead.nome} - ${lead.empresa}`,
      html: formatEmailHtml(lead),
    });
  } catch (err) {
    console.error('Email notification failed:', err.message);
  }
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

      try { await notifyWhatsApp(lead); } catch (_) {}
      try { await notifyEmail(lead); } catch (_) {}

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
