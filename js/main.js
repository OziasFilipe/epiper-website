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
      ['Pedido Eletrônico','pedido-eletronico.html'],['Televendas','televendas.html'],['Hub Epiper','hub-epiper.html'],['Integrações','integracoes.html']
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

document.querySelectorAll('[data-whatsapp]').forEach(link => {
  link.href=`https://wa.me/${EPIPER_WHATSAPP_NUMBER}?text=${encodeURIComponent(EPIPER_WHATSAPP_TEXT)}`;
  link.target='_blank'; link.rel='noopener';
});

// Botão flutuante discreto de WhatsApp
if(!document.querySelector('.whatsapp-float')) {
  const a=document.createElement('a'); a.className='whatsapp-float'; a.href=`https://wa.me/${EPIPER_WHATSAPP_NUMBER}?text=${encodeURIComponent(EPIPER_WHATSAPP_TEXT)}`; a.target='_blank'; a.rel='noopener'; a.setAttribute('aria-label','Falar com a Epiper no WhatsApp');
  a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.6A11.8 11.8 0 0 0 1.9 17.8L.3 23.7l6-1.6A11.8 11.8 0 0 0 12 23.5h.1A11.8 11.8 0 0 0 20.5 3.6Zm-8.4 17.9h-.1a9.7 9.7 0 0 1-4.9-1.3l-.4-.2-3.6 1 1-3.5-.2-.4A9.8 9.8 0 1 1 12.1 21.5Zm5.4-7.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.5c.2.2 2.5 3.8 6 5.3.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4Z"/></svg>';
  document.body.appendChild(a);
}

document.addEventListener('keydown', e => { if(e.key==='Escape') { closeMegaMenus(); closeMobileAccordions(); header?.classList.remove('is-open','mobile-menu-surface'); hamburger?.setAttribute('aria-expanded','false'); document.documentElement.classList.remove('mobile-nav-open'); } });
document.querySelectorAll('.mega-menu-wrap a,.nav-pill>a,.mobile-accordion-panel a').forEach(link => link.addEventListener('click', () => { closeMegaMenus(); closeMobileAccordions(); if(isMobile()) { header?.classList.remove('is-open','mobile-menu-surface'); hamburger?.setAttribute('aria-expanded','false'); document.documentElement.classList.remove('mobile-nav-open'); } }));

const syncStickyHeader=() => { if(header) header.classList.toggle('is-scrolled',window.scrollY>18); };
syncStickyHeader(); window.addEventListener('scroll',syncStickyHeader,{passive:true});
