const fs = require('fs');
const ADMIN_PASSWORD = '821760';
const DB_PATH = '/tmp/leads.json';
const TRACK_PATH = '/tmp/visitors.json';
const SUBS_PATH = '/tmp/push-subs.json';
const WHATSAPP_TO = '5527996217169';
const WHATSAPP_URL = 'https://whatsapp.conectaped.com/whatsapp/send?sessionId=site';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'comercial@epiper.com.br';
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
const webpush = require('web-push');

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BHWWjXKi8ZFn4RhffjvEO9VAboiHncNaB7wixssnitk1buVYRHfbdDq_hhw2Ifm91OBC16SeDbpd9t7DWvTTgPg';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'YRqjwUAOPYacU5JNwOqEI4_I3-tUBguIfrC5PSv8BBI';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:comercial@epiper.com.br';
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

function readSubs() { try { return JSON.parse(fs.readFileSync(SUBS_PATH,'utf-8')); } catch { return []; } }
function writeSubs(d) { fs.writeFileSync(SUBS_PATH, JSON.stringify(d,null,2)); }

async function sendPush(title, body, tag) {
  const subs = readSubs();
  if (!subs.length) return;
  const payload = JSON.stringify({ title, body, tag, icon:'/assets/icon-192.svg', badge:'/assets/icon-192.svg' });
  for (const sub of subs) {
    try { await webpush.sendNotification(sub, payload); }
    catch(e) {
      console.error('sendPush error:', e.statusCode, e.message);
      if (e.statusCode === 410 || e.statusCode === 404) {
        // Subscription expired — remove
        writeSubs(subs.filter(s => JSON.stringify(s) !== JSON.stringify(sub)));
      }
    }
  }
}

// ======== HELPERS ========
function readDb() { try { return JSON.parse(fs.readFileSync(DB_PATH,'utf-8')); } catch { return []; } }
function writeDb(d) { fs.writeFileSync(DB_PATH, JSON.stringify(d,null,2)); }

function readVis() {
  try { return JSON.parse(fs.readFileSync(TRACK_PATH,'utf-8')); }
  catch { return { visitors:[], history:[], lastWppPage:0, lastSummary:0 }; }
}
function writeVis(d) { fs.writeFileSync(TRACK_PATH, JSON.stringify(d,null,2)); }

function getClientIp(e) { return e.headers['x-forwarded-for']?.split(',')[0]?.trim()||e.headers['client-ip']||e.headers['x-real-ip']||'desconhecido'; }
function esc(v) { const s=String(v??''); return s.includes(',')||s.includes('"')||s.includes('\n')?'"'+s.replace(/"/g,'""')+'"':s; }

const geoCache = {};
async function getGeo(ip) {
  if (geoCache[ip]) return geoCache[ip];
  if (ip === 'desconhecido' || !ip) return null;
  if (/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|::1|localhost)/.test(ip)) return null;
  try {
    const r = await fetch(`http://ip-api.com/json/${ip}?fields=city,region,country,status`);
    const d = await r.json();
    if (d.status === 'success') {
      geoCache[ip] = { city:d.city, region:d.region, country:d.country };
      return geoCache[ip];
    }
  } catch(_) {}
  return null;
}

function brHour() { return new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',hour12:false}).padStart(2,'0'); }
function brDate() { return new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric'}).split(',')[0].trim(); }
function now() { return Date.now(); }

function parseUA(ua) {
  const r={ isMobile:false, browser:'Desconhecido', os:'Desconhecido' };
  if (!ua) return r;
  r.isMobile = /mobile|android|iphone|ipad|ipod|opera mini|iemobile|wpdesktop/i.test(ua);
  if (/chrome/i.test(ua) && !/edge|edg|opr/i.test(ua)) r.browser='Chrome';
  else if (/firefox/i.test(ua)) r.browser='Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) r.browser='Safari';
  else if (/edge|edg/i.test(ua)) r.browser='Edge';
  else if (/opr|opera/i.test(ua)) r.browser='Opera';
  else if (/msie|trident/i.test(ua)) r.browser='Internet Explorer';
  if (/windows/i.test(ua)) r.os='Windows';
  else if (/mac os|macintosh/i.test(ua)) r.os='macOS';
  else if (/android/i.test(ua)) r.os='Android';
  else if (/iphone|ipad|ipod/i.test(ua)) r.os='iOS';
  else if (/linux/i.test(ua)) r.os='Linux';
  return r;
}

function fmtSecs(s) {
  if (s < 60) return s+'s';
  const m = Math.floor(s/60); s = Math.floor(s%60);
  return m+'m'+s+'s';
}

// ======== TRACKING ========
async function trackVisit(ip, ua, page) {
  const vis = readVis();
  const today = brDate();
  const info = parseUA(ua);
  const t = now();

  // Reset history if new day
  if (vis.history.length && vis.history[0].date !== today) {
    vis.history.unshift({ date: today, visitors:0, pages:0, mobile:0, desktop:0, browsers:{}, timeTotal:0, entries:0 });
    if (vis.history.length > 31) vis.history.length = 31;
  }
  if (!vis.history.length || vis.history[0].date !== today) {
    vis.history.unshift({ date:today, visitors:0, pages:0, mobile:0, desktop:0, browsers:{}, timeTotal:0, entries:0 });
  }
  const day = vis.history[0];

  // Find or create visitor session
  let v = vis.visitors.find(x => x.ip === ip);
  const isNew = !v;
  if (isNew) {
    const geo = await getGeo(ip);
    v = { ip, ua, isMobile:info.isMobile, browser:info.browser, os:info.os, geo,
          pages:[], firstSeen:t, lastSeen:t, sessionTime:0, pageViews:0, visitDays:[today], totalVisits:1 };
    vis.visitors.push(v);
    day.visitors++;
  } else {
    // Track return visits per day
    if (!v.visitDays) v.visitDays = [];
    if (!v.totalVisits) v.totalVisits = 0;
    if (!v.visitDays.includes(today)) {
      v.visitDays.push(today);
      day.visitors++;
    }
    v.totalVisits++;
  }

  v.pages.push({ url:page, time:new Date().toISOString() });
  v.pageViews++;
  day.pages++;

  // Session time: time since last page view (capped at 30min)
  const gap = t - v.lastSeen;
  if (gap < 1800000 && v.lastSeen !== v.firstSeen) {
    const add = Math.round(gap/1000);
    v.sessionTime += add;
    day.timeTotal += add;
    day.entries++;
  }
  v.lastSeen = t;

  if (info.isMobile) day.mobile++; else day.desktop++;
  day.browsers[info.browser] = (day.browsers[info.browser]||0)+1;

  writeVis(vis);
  return { vis, v, isNew, day };
}

async function sendWpp(text) {
  try {
    const r = await fetch(WHATSAPP_URL, { method:'POST', headers:{'Content-Type':'application/json','accept':'*/*'}, body:JSON.stringify({to:WHATSAPP_TO,text}) });
    console.log('WPP:', r.status, await r.text());
  } catch(e) { console.error('WPP fail:', e.message); }
}

// ======== WHATSAPP NOTIFICATIONS ========
async function notifyNewVisitor(v, page, isNew, day) {
  const nowMs = now();
  const vis = readVis();
  // Throttle: 1 per visitor per 60s
  if (nowMs - (vis.lastWppPage||0) < 30000) return;

  const icon = v.isMobile ? '📱' : '💻';
  const ipLine = v.ip && v.ip !== 'desconhecido' ? `\n🌐 IP: ${v.ip}` : '';
  let txt = isNew
    ? `👤 *Novo visitante!*\n${icon} ${v.browser} - ${v.os}\n📍 ${page}\n🌐 #${day.visitors} hoje${ipLine}`
    : `🔄 ${icon} Visitante acessou: ${page}\n💻 ${v.browser} - ${v.os}${ipLine}`;

  vis.lastWppPage = nowMs;
  writeVis(vis);
  await sendWpp(txt);
}

function getSummaryText(day) {
  const avg = day.entries > 0 ? Math.round(day.timeTotal/day.entries) : 0;
  const pages = {};
  const vv = readVis();
  for (const v of vv.visitors) {
    for (const p of v.pages) {
      const key = p.url || '/';
      pages[key] = (pages[key]||0)+1;
    }
  }
  const topPages = Object.entries(pages).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const browsers = Object.entries(day.browsers).sort((a,b)=>b[1]-a[1]);

  let txt = `📊 *Resumo - ${day.date}*\n\n`;
  txt += `👥 Visitantes únicos: ${day.visitors}\n`;
  txt += `👀 Total de páginas: ${day.pages}\n`;
  txt += `📱 Mobile: ${day.mobile}  |  💻 Desktop: ${day.desktop}\n`;
  if (avg) txt += `⏱ Tempo médio: ${fmtSecs(avg)}\n\n`;
  if (topPages.length) {
    txt += `📄 *Páginas mais acessadas:*\n`;
    for (const [p,n] of topPages) txt += `  ${n}x ${p}\n`;
  }
  txt += `\n🌐 *Navegadores:*\n`;
  for (const [b,n] of browsers) txt += `  ${b}: ${n}\n`;
  return txt;
}

async function checkSummary() {
  const vis = readVis();
  if (!vis.history.length) return;
  const day = vis.history[0];
  const h = parseInt(brHour());
  const nowMs = now();

  // Summary hours: 5 (05:59 → 06:00), 11 (11:59 → 12:00), 17 (17:59 → 18:00), 23 (23:59 → 00:00)
  const summaryHours = [5, 11, 17, 23];
  if (!summaryHours.includes(h)) return;
  if (nowMs - (vis.lastSummary||0) < 21600000) return; // 6h throttle

  vis.lastSummary = nowMs;
  writeVis(vis);
  await sendWpp(getSummaryText(day));
}

// ======== VISITOR STATS (for admin) ========
function getVisitorStats(dateStr) {
  const vis = readVis();
  const targetDate = dateStr || (vis.history[0] ? vis.history[0].date : brDate());

  // Find history entry for target date
  const day = vis.history.find(d => d.date === targetDate)
    || { visitors:0, pages:0, mobile:0, desktop:0, browsers:{}, timeTotal:0, entries:0, date:targetDate };
  const avg = day.entries > 0 ? Math.round(day.timeTotal/day.entries) : 0;

  // Last 7 days
  const week = vis.history.slice(0,7).map(d => ({ date:d.date, visitors:d.visitors, pages:d.pages }));
  const weekVisitors = vis.history.slice(0,7).reduce((s,d)=>s+d.visitors,0);

  // Top pages for target date: filter visitor pages by date
  const pageCount = {};
  for (const v of vis.visitors) {
    for (const p of v.pages) {
      const pageDate = p.time ? p.time.slice(0,10).split('-').reverse().join('/') : '';
      if (pageDate !== targetDate) continue;
      const key = p.url || '/';
      pageCount[key] = (pageCount[key]||0)+1;
    }
  }
  const topPages = Object.entries(pageCount).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([p,n])=>({page:p,views:n}));

  // Browsers for target date
  const browsers = Object.entries(day.browsers).map(([k,v])=>({name:k,count:v})).sort((a,b)=>b.count-a.count);

  // Connected visitors (last 30 min) — only meaningful for today
  const isToday = targetDate === brDate();
  const nowMs = now();
  const online = isToday ? vis.visitors.filter(v => nowMs - v.lastSeen < 1800000).length : 0;

  // Visitors list with details for the date
  const visitorList = [];
  for (const v of vis.visitors) {
    const dayPages = v.pages.filter(p => {
      const pd = p.time ? p.time.slice(0,10).split('-').reverse().join('/') : '';
      return pd === targetDate;
    });
    if (!dayPages.length) continue;
    // Count page views per URL for this visitor today
    const pageCount = {};
    for (const p of dayPages) {
      const key = p.url || '/';
      pageCount[key] = (pageCount[key]||0) + 1;
    }
    const pagesSorted = Object.entries(pageCount)
      .sort((a,b) => b[1]-a[1])
      .map(([url,count]) => ({ url, count }));

    visitorList.push({
      ip: v.ip,
      browser: v.browser,
      os: v.os,
      isMobile: v.isMobile,
      geo: v.geo || null,
      pages: dayPages.length,
      pageBreakdown: pagesSorted,
      totalPages: v.pageViews || 0,
      totalVisits: v.totalVisits || 1,
      visitDays: (v.visitDays||[]).length,
      firstSeen: v.firstSeen ? new Date(v.firstSeen).toLocaleDateString('pt-BR') : '-',
    });
  }

  return {
    today: { visitors:day.visitors, pages:day.pages, mobile:day.mobile, desktop:day.desktop,
             avgSessionTime:avg, browsers, topPages, online, date:day.date, list:visitorList },
    week: { visitors:weekVisitors, days:week },
  };
}

// ======== LEADS HELPERS ========
function formatWppLead(l) {
  let t = `🔔 *Novo Lead ePiper!*\n\n*Nome:* ${l.nome}\n*Empresa:* ${l.empresa}\n*Email:* ${l.email}\n*Telefone:* ${l.telefone}\n*Módulo:* ${l.modulo}`;
  if (l.interesse) t += `\n*Interesse:* ${l.interesse}`;
  if (l.mensagem) t += `\n*Mensagem:* ${l.mensagem}`;
  if (l.ip && l.ip !== 'desconhecido') t += `\n🌐 IP: ${l.ip}`;
  return t+`\n\n📅 ${new Date(l.created_at).toLocaleString('pt-BR')}`;
}

function emailHtml(l) { return `...`; } // kept minimal

async function notifyWppLead(l) {
  try { await sendWpp(formatWppLead(l)); } catch(e) { console.error(e.message); }
}
async function notifyEmailLead(l) {
  try {
    const m = require('nodemailer');
    const h=process.env.SMTP_HOST,u=process.env.SMTP_USER,p=process.env.SMTP_PASS;
    if (!h||!u||!p) return;
    await m.createTransport({host:h,port:Number(process.env.SMTP_PORT)||587,secure:process.env.SMTP_SECURE==='true',auth:{user:u,pass:p}}).sendMail({
      from:process.env.SMTP_FROM||u, to:NOTIFY_EMAIL, subject:`Novo Lead: ${l.nome} - ${l.empresa}`,
      html:`<h2>Novo Lead</h2><p>Nome: ${l.nome}<br>Empresa: ${l.empresa}<br>Email: ${l.email}<br>Tel: ${l.telefone}</p>`,
    });
  } catch(e) { console.error(e.message); }
}

// ======== HANDLER ========
exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'Content-Type, X-Admin-Password', 'Access-Control-Allow-Methods':'GET, POST, OPTIONS' };
  if (event.httpMethod === 'OPTIONS') return { statusCode:204, headers, body:'' };

  try {
    // ===== POST =====
    if (event.httpMethod === 'POST') {
      const params = new URLSearchParams(event.body||'');
      const action = params.get('action');

      if (action === 'update_status' || action === 'delete') {
        const pw = params.get('password')||'';
        if (pw !== ADMIN_PASSWORD) return { statusCode:401, headers, body:JSON.stringify({ok:false,error:'Senha invalida.'}) };
        const id = Number(params.get('id'));
        if (!id) return { statusCode:400, headers, body:JSON.stringify({ok:false,error:'ID obrigatorio.'}) };
        const leads = readDb();
        if (action === 'update_status') {
          const st = params.get('status');
          if (!st) return { statusCode:400, headers, body:JSON.stringify({ok:false,error:'Status obrigatorio.'}) };
          const i = leads.findIndex(l=>l.id===id);
          if (i===-1) return { statusCode:404, headers, body:JSON.stringify({ok:false,error:'Lead nao encontrado.'}) };
          leads[i].status = st; writeDb(leads);
          return { statusCode:200, headers, body:JSON.stringify({ok:true,message:'Status atualizado.'}) };
        }
        const f = leads.filter(l=>l.id!==id);
        if (f.length===leads.length) return { statusCode:404, headers, body:JSON.stringify({ok:false,error:'Lead nao encontrado.'}) };
        writeDb(f);
        return { statusCode:200, headers, body:JSON.stringify({ok:true,message:'Lead excluido.'}) };
      }

      // ---- Push subscription ----
      if (action === 'subscribe') {
        const pw = params.get('password')||'';
        if (pw !== ADMIN_PASSWORD) return { statusCode:401, headers, body:JSON.stringify({ok:false,error:'Senha invalida.'}) };
        try {
          const subRaw = params.get('subscription');
          if (!subRaw) return { statusCode:400, headers, body:JSON.stringify({ok:false,error:'Subscription obrigatoria.'}) };
          const sub = JSON.parse(subRaw);
          const subs = readSubs();
          // Avoid duplicates
          if (!subs.some(s => JSON.stringify(s) === JSON.stringify(sub))) {
            subs.push(sub);
            writeSubs(subs);
          }
          return { statusCode:200, headers, body:JSON.stringify({ok:true,message:'Inscrito.'}) };
        } catch(e) { return { statusCode:400, headers, body:JSON.stringify({ok:false,error:'Subscription invalida.'}) }; }
      }

      if (action === 'unsubscribe') {
        const pw = params.get('password')||'';
        if (pw !== ADMIN_PASSWORD) return { statusCode:401, headers, body:JSON.stringify({ok:false,error:'Senha invalida.'}) };
        try {
          const subRaw = params.get('subscription');
          if (!subRaw) return { statusCode:400, headers, body:JSON.stringify({ok:false,error:'Subscription obrigatoria.'}) };
          const sub = JSON.parse(subRaw);
          const subs = readSubs();
          writeSubs(subs.filter(s => JSON.stringify(s) !== JSON.stringify(sub)));
          return { statusCode:200, headers, body:JSON.stringify({ok:false,message:'Removido.'}) };
        } catch(e) { return { statusCode:400, headers, body:JSON.stringify({ok:false,error:'Subscription invalida.'}) }; }
      }

      // ---- Test push ----
      if (action === 'test-push') {
        const pw = params.get('password')||'';
        if (pw !== ADMIN_PASSWORD) return { statusCode:401, headers, body:JSON.stringify({ok:false,error:'Senha invalida.'}) };
        try { await sendPush('🔔 Teste ePiper', 'Notificação push funcionando! ✅', 'test-'+now()); return { statusCode:200, headers, body:JSON.stringify({ok:true,message:'Notificação enviada.'}) }; }
        catch(e) { return { statusCode:500, headers, body:JSON.stringify({ok:false,error:'Erro ao enviar: '+e.message}) }; }
      }

      // New lead
      const leads = readDb();
      const nid = leads.length > 0 ? Math.max(...leads.map(l=>l.id))+1 : 1;
      const ld = {
        id:nid, nome:(params.get('nome')||'').trim(), empresa:(params.get('empresa')||'').trim(),
        email:(params.get('email')||'').trim(), telefone:(params.get('telefone')||'').trim(),
        mensagem:(params.get('mensagem')||'').trim(), modulo:(params.get('modulo')||'').trim(),
        interesse:(params.get('interesse')||'').trim(), origem:'site', ip:getClientIp(event),
        created_at:new Date().toISOString(), status:'novo',
      };
      if (!ld.nome||!ld.empresa||!ld.email||!ld.telefone) return { statusCode:400, headers, body:JSON.stringify({ok:false,error:'Preencha todos os campos obrigatorios.'}) };
      leads.push(ld); writeDb(leads);
      try { await notifyWppLead(ld); } catch(_) {}
      try { await notifyEmailLead(ld); } catch(_) {}
      try { await sendPush('Novo lead', `${ld.nome} - ${ld.empresa}`, 'lead-'+ld.id); } catch(_) {}
      return { statusCode:201, headers, body:JSON.stringify({ok:true,message:'Lead cadastrado com sucesso.'}) };
    }

    // ===== GET =====
    if (event.httpMethod === 'GET') {
      const url = new URL(event.rawUrl);
      const action = url.searchParams.get('action')||'list';
      const pw = url.searchParams.get('password')||event.headers['x-admin-password']||'';

      // ---- Public: VAPID key ----
      if (action === 'vapid-key') {
        return { statusCode:200, headers:{...headers,'Content-Type':'application/json'}, body:JSON.stringify({ok:true,key:VAPID_PUBLIC}) };
      }

      // ---- Tracking pixel (public) ----
      if (action === 'track') {
        const ip = getClientIp(event);
        const ua = event.headers['user-agent']||'';
        const page = url.searchParams.get('url')||'/';
        const { v, isNew, day } = await trackVisit(ip, ua, page);
        try { await notifyNewVisitor(v, page, isNew, day); } catch(_) {}
        try {
          if (isNew) await sendPush('Novo visitante', `${v.browser} - ${v.os} acessou ${page}`, 'visitor-'+ip);
        } catch(_) {}
        try { await checkSummary(); } catch(_) {}
        return { statusCode:200, headers:{...headers,'Content-Type':'image/gif','Cache-Control':'no-store,no-cache,must-revalidate'}, body:PIXEL.toString('base64'), isBase64Encoded:true };
      }

      // ---- Export CSV ----
      if (action === 'export') {
        if (pw !== ADMIN_PASSWORD) return { statusCode:401, headers, body:JSON.stringify({ok:false,error:'Senha invalida.'}) };
        const leads = readDb();
        const cols = ['id','nome','empresa','email','telefone','mensagem','modulo','interesse','origem','ip','created_at','status'];
        let csv = cols.map(esc).join(',')+'\n';
        for (const l of leads) csv += cols.map(c=>esc(l[c])).join(',')+'\n';
        return { statusCode:200, headers:{...headers,'Content-Type':'text/csv;charset=utf-8','Content-Disposition':'attachment;filename=leads_epiper.csv'}, body:csv };
      }

      // ---- Admin: list leads + stats ----
      if (pw !== ADMIN_PASSWORD) return { statusCode:401, headers, body:JSON.stringify({ok:false,error:'Senha invalida.'}) };
      const leads = readDb().reverse();
      const date = url.searchParams.get('date')||'';
      const stats = getVisitorStats(date);
      return { statusCode:200, headers:{...headers,'Content-Type':'application/json'}, body:JSON.stringify({ok:true,leads,track:stats}) };
    }

    return { statusCode:405, headers, body:JSON.stringify({ok:false,error:'Metodo nao permitido.'}) };

  } catch (err) {
    return { statusCode:500, headers, body:JSON.stringify({ok:false,error:'Erro interno do servidor.',detail:err.message}) };
  }
};
