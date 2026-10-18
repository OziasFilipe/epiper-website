const header = document.getElementById('header');
const hamburger = document.getElementById('hamburger');
const isMobile = () => window.innerWidth <= 900;
const EPIPER_WHATSAPP_NUMBER = '5527996217169';
const EPIPER_WHATSAPP_TEXT = 'Olá! Quero conhecer as soluções da Epiper e entender qual se encaixa na minha operação.';

function closeMobileAccordions(except = null) {
  document.querySelectorAll('.mobile-accordion-panel.is-open').forEach(panel => { if(panel !== except) panel.classList.remove('is-open'); });
  document.querySelectorAll('.nav-top-trigger.mobile-active').forEach(btn => {
    if (!except || btn.nextElementSibling !== except) { btn.classList.remove('mobile-active'); btn.setAttribute('aria-expanded','false'); }
  });
}

function buildMobileAccordions() {
  const items = {
    plataforma: [
      ['Visão geral da plataforma','plataforma.html'],['Hub Epiper','hub-epiper.html'],['Operação conectada','operacao-conectada.html'],['Implantação guiada','implantacao-guiada.html'],['Evolução por módulos','evolucao-modulos.html']
    ],
    solucoes: [
      ['Pedido Eletrônico','pedido-eletronico.html'],['Televendas','televendas.html'],['Hub Epiper','hub-epiper.html'],['Integrações','integracoes.html'],['Falar com especialista','fale-com-especialista.html']
    ],
    recursos: [
      ['Catálogo e Pedido','pedido-eletronico.html'],['Clientes e atendimento','televendas.html'],['Integração com ERP','integracoes.html'],['Dúvidas frequentes','duvidas.html']
    ]
  };
  document.querySelectorAll('[data-menu-trigger]').forEach(btn => {
    if (btn.nextElementSibling?.classList.contains('mobile-accordion-panel')) return;
    const panel=document.createElement('div'); panel.className='mobile-accordion-panel'; panel.setAttribute('aria-hidden','true');
    (items[btn.dataset.menuTrigger] || []).forEach(([label,href]) => { const a=document.createElement('a'); a.href=href; a.textContent=label; panel.appendChild(a); });
    btn.insertAdjacentElement('afterend',panel);
  });
}
buildMobileAccordions();

const solutionMenuGrid = document.querySelector('[data-menu-panel="solucoes"] .solution-menu-grid');
if (solutionMenuGrid && !solutionMenuGrid.querySelector('[data-specialist-card]')) {
  const specialistCard = document.createElement('a');
  specialistCard.href = 'fale-com-especialista.html';
  specialistCard.className = 'solution-menu-card';
  specialistCard.dataset.specialistCard = '1';
  specialistCard.innerHTML = '<div class="solution-menu-card__head"><span class="solution-menu-card__icon"><img alt="" src="assets/icons/menu/clientes.svg"/></span><h5 role="presentation">Falar com especialista</h5></div><p>Conte seu cenário e receba uma orientação objetiva sobre produtos, integrações e implantação.</p><strong>Preencher formulário →</strong>';
  solutionMenuGrid.appendChild(specialistCard);
}


// Páginas legais: resumo e navegação local para leitura mais rápida, sem alterar o conteúdo jurídico.
const legalWrap = document.querySelector('.legal-page .legal-wrap');
if (legalWrap && !legalWrap.querySelector('.legal-summary')) {
  const sections = [...legalWrap.querySelectorAll(':scope > section')];
  const summary = document.createElement('div');
  summary.className = 'legal-summary';
  summary.innerHTML = `
    <div><small>Documento</small><b>${document.querySelector('.legal-lead')?.textContent || 'Informação institucional'}</b></div>
    <div><small>Contato</small><b>contato@epiper.com.br</b></div>
    <div><small>Leitura</small><b>${sections.length} pontos principais</b></div>`;
  const nav = document.createElement('nav');
  nav.className = 'legal-nav';
  nav.setAttribute('aria-label','Nesta página');
  sections.forEach((section,index) => {
    const title = section.querySelector('h2')?.textContent?.trim();
    if (!title) return;
    section.id ||= `ponto-${index+1}`;
    const link = document.createElement('a');
    link.href = `#${section.id}`;
    link.textContent = title;
    nav.appendChild(link);
  });
  legalWrap.querySelector('.legal-lead')?.insertAdjacentElement('afterend',summary);
  summary.insertAdjacentElement('afterend',nav);
}

hamburger?.addEventListener('click', () => {
  const open = header.classList.toggle('is-open');
  hamburger.setAttribute('aria-expanded', String(open));
  header.classList.toggle('mobile-menu-surface', open && isMobile());
  document.documentElement.classList.toggle('mobile-nav-open', open && isMobile());
  if(!open) closeMobileAccordions();
});

const observer = new IntersectionObserver((entries) => entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('is-visible'); }), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const hubTabs = document.querySelectorAll('[data-hub-tab]');
const hubPanels = document.querySelectorAll('[data-hub-panel]');
hubTabs.forEach(tab => tab.addEventListener('click', () => {
  const target=tab.dataset.hubTab;
  hubTabs.forEach(btn => { btn.classList.remove('is-active'); btn.setAttribute('aria-selected','false'); });
  hubPanels.forEach(panel => panel.classList.remove('is-active'));
  tab.classList.add('is-active'); tab.setAttribute('aria-selected','true');
  document.querySelector(`[data-hub-panel="${target}"]`)?.classList.add('is-active');
}));

const topTriggers = document.querySelectorAll('[data-menu-trigger]');
const topPanels = document.querySelectorAll('[data-menu-panel]');
const megaBackdrop = document.getElementById('megaMenuBackdrop');
function closeMegaMenus() {
  topTriggers.forEach(btn => { if(!btn.classList.contains('mobile-active')) btn.classList.remove('is-active'); if(!btn.classList.contains('mobile-active')) btn.setAttribute('aria-expanded','false'); });
  topPanels.forEach(panel => { panel.classList.remove('is-open'); panel.setAttribute('aria-hidden','true'); });
  megaBackdrop?.classList.remove('is-visible'); megaBackdrop?.setAttribute('aria-hidden','true');
}
topTriggers.forEach(btn => btn.addEventListener('click', e => {
  e.preventDefault();
  if(isMobile()) {
    const panel=btn.nextElementSibling?.classList.contains('mobile-accordion-panel') ? btn.nextElementSibling : null;
    if(!panel) return;
    const willOpen=!panel.classList.contains('is-open');
    closeMobileAccordions(panel); closeMegaMenus();
    panel.classList.toggle('is-open',willOpen); panel.setAttribute('aria-hidden',String(!willOpen));
    btn.classList.toggle('mobile-active',willOpen); btn.setAttribute('aria-expanded',String(willOpen));
    return;
  }
  const target=btn.dataset.menuTrigger; const panel=document.querySelector(`[data-menu-panel="${target}"]`); const willOpen=!btn.classList.contains('is-active');
  closeMegaMenus();
  if(willOpen && panel) { btn.classList.add('is-active'); btn.setAttribute('aria-expanded','true'); panel.classList.add('is-open'); panel.setAttribute('aria-hidden','false'); megaBackdrop?.classList.add('is-visible'); megaBackdrop?.setAttribute('aria-hidden','false'); }
}));
megaBackdrop?.addEventListener('click',closeMegaMenus);
document.addEventListener('click', e => {
  if(!isMobile() && !e.target.closest('.nav-pill') && !e.target.closest('.mega-menu-wrap')) closeMegaMenus();
});
window.addEventListener('resize', () => {
  if(isMobile()) {
    closeMegaMenus();
  } else {
    closeMobileAccordions();
    header?.classList.remove('is-open','mobile-menu-surface');
    hamburger?.setAttribute('aria-expanded','false');
    document.documentElement.classList.remove('mobile-nav-open');
  }
});

// Todos os CTAs "Falar com especialista" passam primeiro pelo formulário.
document.querySelectorAll('[data-whatsapp]').forEach(link => {
  const origin = `${location.pathname}${location.hash || ''}`;
  link.href=`fale-com-especialista.html?origem=${encodeURIComponent(origin)}`;
  link.removeAttribute('target');
  link.removeAttribute('rel');
});

// Botão flutuante discreto de WhatsApp continua como contato rápido direto.
if(!document.querySelector('.whatsapp-float')) {
  const a=document.createElement('a'); a.className='whatsapp-float'; a.href=`https://wa.me/${EPIPER_WHATSAPP_NUMBER}?text=${encodeURIComponent(EPIPER_WHATSAPP_TEXT)}`; a.target='_blank'; a.rel='noopener'; a.setAttribute('aria-label','Falar com o time comercial da Epiper no WhatsApp');
  a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.6A11.8 11.8 0 0 0 1.9 17.8L.3 23.7l6-1.6A11.8 11.8 0 0 0 12 23.5h.1A11.8 11.8 0 0 0 20.5 3.6Zm-8.4 17.9h-.1a9.7 9.7 0 0 1-4.9-1.3l-.4-.2-3.6 1 1-3.5-.2-.4A9.8 9.8 0 1 1 12.1 21.5Zm5.4-7.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.5c.2.2 2.5 3.8 6 5.3.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4Z"/></svg>';
  document.body.appendChild(a);
}

// Balão do botão de WhatsApp: "Nosso time comercial está disponível".
// - Ao carregar a página aparece por 15 segundos, mas só se passaram 20 minutos desde a última vez que este visitante o viu
//   (o horário fica guardado no navegador; navegar para outra página dentro desses 20 minutos não mostra de novo).
// - Passar o mouse (ou focar com o teclado) no botão mostra o balão na hora, para qualquer visitante, a qualquer momento.
(() => {
  const botao = document.querySelector('.whatsapp-float');
  if (!botao || botao.querySelector('.zap-balao')) return;
  const CHAVE = 'epiper_zap_balao';
  const JANELA_MS = 20 * 60 * 1000;
  const DURACAO_MS = 15000;
  const ATRASO_MS = 1200;

  const balao = document.createElement('span');
  balao.className = 'zap-balao';
  balao.setAttribute('aria-hidden', 'true');
  balao.innerHTML = '<span class="zap-balao__linha"><i class="zap-balao__ponto" aria-hidden="true"></i><b>Nosso time comercial está disponível</b></span><span class="zap-balao__sub">Tire suas dúvidas e fale com um especialista agora.</span>';
  botao.appendChild(balao);

  let automatico = false;
  let sobre = false;
  const atualizar = () => {
    const visivel = automatico || sobre;
    botao.classList.toggle('is-balao', visivel);
    balao.setAttribute('aria-hidden', visivel ? 'false' : 'true');
  };
  botao.addEventListener('mouseenter', () => { sobre = true; atualizar(); });
  botao.addEventListener('mouseleave', () => { sobre = false; atualizar(); });
  botao.addEventListener('focus', () => { sobre = true; atualizar(); });
  botao.addEventListener('blur', () => { sobre = false; atualizar(); });

  const ler = () => { try { return parseInt(localStorage.getItem(CHAVE) || '0', 10) || 0; } catch (e) { return 0; } };
  const gravar = () => { try { localStorage.setItem(CHAVE, String(Date.now())); } catch (e) { /* sem armazenamento: aparece a cada página */ } };

  const mostrarSozinho = () => {
    if (Date.now() - ler() < JANELA_MS) return;
    gravar();
    setTimeout(() => {
      automatico = true; atualizar();
      setTimeout(() => { automatico = false; atualizar(); }, DURACAO_MS);
    }, ATRASO_MS);
  };
  if (document.visibilityState === 'visible') mostrarSozinho();
  else document.addEventListener('visibilitychange', function aoVoltar() {
    if (document.visibilityState !== 'visible') return;
    document.removeEventListener('visibilitychange', aoVoltar);
    mostrarSozinho();
  });
})();

document.addEventListener('keydown', e => { if(e.key==='Escape') { closeMegaMenus(); closeMobileAccordions(); header?.classList.remove('is-open','mobile-menu-surface'); hamburger?.setAttribute('aria-expanded','false'); document.documentElement.classList.remove('mobile-nav-open'); } });
document.querySelectorAll('.mega-menu-wrap a,.nav-pill>a,.mobile-accordion-panel a').forEach(link => link.addEventListener('click', () => { closeMegaMenus(); closeMobileAccordions(); if(isMobile()) { header?.classList.remove('is-open','mobile-menu-surface'); hamburger?.setAttribute('aria-expanded','false'); document.documentElement.classList.remove('mobile-nav-open'); } }));

const syncStickyHeader=() => { if(header) header.classList.toggle('is-scrolled',window.scrollY>18); };
syncStickyHeader(); window.addEventListener('scroll',syncStickyHeader,{passive:true});

// Acabamento editorial e conteúdo adicional somente nas páginas internas de produto/plataforma.
const internalPremiumPages = new Set([
  'plataforma.html','hub-epiper.html','operacao-conectada.html','implantacao-guiada.html','evolucao-modulos.html',
  'pedido-eletronico.html','televendas.html','integracoes.html','duvidas.html'
]);
const internalPremiumFile = (() => { const f = (location.pathname.split('/').pop() || 'index.html').toLowerCase(); return f.includes('.') ? f : `${f}.html`; })(); // aceita URLs limpas (/pedido-eletronico)
const platformLayoutPages = new Set(['plataforma.html','hub-epiper.html','operacao-conectada.html','implantacao-guiada.html','evolucao-modulos.html']);
if (platformLayoutPages.has(internalPremiumFile) && !document.querySelector('link[data-platform-v36]')) {
  const platformStyle=document.createElement('link');
  platformStyle.rel='stylesheet'; platformStyle.href='css/plataforma.css?v=37'; platformStyle.dataset.platformV36='1';
  document.head.appendChild(platformStyle);
}
if (internalPremiumPages.has(internalPremiumFile) && !document.querySelector('script[data-internal-premium]')) {
  const premiumScript=document.createElement('script');
  premiumScript.src='js/internal-premium.js?v=39';
  premiumScript.defer=true;
  premiumScript.dataset.internalPremium='1';
  document.body.appendChild(premiumScript);
}
