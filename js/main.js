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

// Adiciona uma entrada clara para contato dentro do menu de Soluções no desktop.
const solutionMenuGrid = document.querySelector('[data-menu-panel="solucoes"] .solution-menu-grid');
if (solutionMenuGrid && !solutionMenuGrid.querySelector('[data-specialist-card]')) {
  const specialistCard = document.createElement('a');
  specialistCard.href = 'fale-com-especialista.html';
  specialistCard.className = 'solution-menu-card';
  specialistCard.dataset.specialistCard = '1';
  specialistCard.innerHTML = '<div class="solution-menu-card__head"><span class="solution-menu-card__icon"><img alt="" src="assets/icons/menu/clientes.svg"/></span><h5>Falar com especialista</h5></div><p>Conte seu cenário e receba uma orientação objetiva sobre produtos, integrações e implantação.</p><strong>Preencher formulário →</strong>';
  solutionMenuGrid.appendChild(specialistCard);
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
  const a=document.createElement('a'); a.className='whatsapp-float'; a.href=`https://wa.me/${EPIPER_WHATSAPP_NUMBER}?text=${encodeURIComponent(EPIPER_WHATSAPP_TEXT)}`; a.target='_blank'; a.rel='noopener'; a.setAttribute('aria-label','Falar com a Epiper no WhatsApp');
  a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.6A11.8 11.8 0 0 0 1.9 17.8L.3 23.7l6-1.6A11.8 11.8 0 0 0 12 23.5h.1A11.8 11.8 0 0 0 20.5 3.6Zm-8.4 17.9h-.1a9.7 9.7 0 0 1-4.9-1.3l-.4-.2-3.6 1 1-3.5-.2-.4A9.8 9.8 0 1 1 12.1 21.5Zm5.4-7.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.5c.2.2 2.5 3.8 6 5.3.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4Z"/></svg>';
  document.body.appendChild(a);
}

document.addEventListener('keydown', e => { if(e.key==='Escape') { closeMegaMenus(); closeMobileAccordions(); header?.classList.remove('is-open','mobile-menu-surface'); hamburger?.setAttribute('aria-expanded','false'); document.documentElement.classList.remove('mobile-nav-open'); } });
document.querySelectorAll('.mega-menu-wrap a,.nav-pill>a,.mobile-accordion-panel a').forEach(link => link.addEventListener('click', () => { closeMegaMenus(); closeMobileAccordions(); if(isMobile()) { header?.classList.remove('is-open','mobile-menu-surface'); hamburger?.setAttribute('aria-expanded','false'); document.documentElement.classList.remove('mobile-nav-open'); } }));

const syncStickyHeader=() => { if(header) header.classList.toggle('is-scrolled',window.scrollY>18); };
syncStickyHeader(); window.addEventListener('scroll',syncStickyHeader,{passive:true});

// Hub Epiper: apresenta uma captura real da central do sistema na página dedicada.
if ((document.body && location.pathname.endsWith('/hub-epiper.html')) || location.pathname.endsWith('hub-epiper.html')) {
  const detailsSection = document.getElementById('detalhes');
  if (detailsSection && !document.querySelector('.hub-real-showcase')) {
    const style = document.createElement('style');
    style.textContent = `
      .hub-real-showcase{padding:78px 0 86px;background:linear-gradient(180deg,#fff 0%,#fbf9ff 100%);overflow:hidden}
      .hub-real-showcase__intro{max-width:820px;margin:0 auto 34px;text-align:center}
      .hub-real-showcase__intro h2{margin:13px 0 10px;font-size:clamp(29px,3.5vw,44px);line-height:1.08;letter-spacing:-.045em;color:#2b2054}
      .hub-real-showcase__intro p{margin:0 auto;max-width:760px;color:#756e89;font-size:13px;line-height:1.75}
      .hub-real-showcase__frame{position:relative;margin:0;padding:11px;border-radius:28px;background:#fff;box-shadow:0 26px 70px rgba(69,46,134,.14),0 0 0 1px rgba(98,72,178,.08);overflow:hidden}
      .hub-real-showcase__bar{display:flex;align-items:center;gap:6px;padding:3px 4px 12px}.hub-real-showcase__bar span{width:8px;height:8px;border-radius:50%;background:#d8cff0}
      .hub-real-showcase__frame img{display:block;width:100%;height:auto;border-radius:18px;background:#f6f3fb}
      .hub-real-showcase__chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:22px}
      .hub-real-showcase__chip{display:flex;align-items:center;justify-content:center;min-height:50px;padding:12px 14px;border-radius:15px;background:#f6f2ff;color:#554b73;font-size:11px;font-weight:750;text-align:center;box-shadow:inset 0 0 0 1px rgba(98,72,178,.06)}
      @media(max-width:720px){.hub-real-showcase{padding:56px 0 60px}.hub-real-showcase__intro{text-align:left}.hub-real-showcase__frame{padding:7px;border-radius:20px}.hub-real-showcase__frame img{border-radius:14px}.hub-real-showcase__chips{grid-template-columns:1fr}.hub-real-showcase__chip{justify-content:flex-start;text-align:left}}
    `;
    document.head.appendChild(style);

    const section = document.createElement('section');
    section.className = 'hub-real-showcase';
    section.setAttribute('aria-labelledby','hub-real-title');
    section.innerHTML = `
      <div class="container">
        <div class="hub-real-showcase__intro">
          <span class="platform-kicker">O Hub na prática</span>
          <h2 id="hub-real-title">A central da operação Epiper em uma única tela.</h2>
          <p>Veja o ambiente real do Hub Epiper, onde produtos, canais de venda, clientes, pedidos, indicadores e integrações ficam organizados para a equipe acessar cada solução com mais contexto.</p>
        </div>
        <figure class="hub-real-showcase__frame">
          <div class="hub-real-showcase__bar" aria-hidden="true"><span></span><span></span><span></span></div>
          <img src="assets/images/hub-epiper-dashboard.webp" alt="Tela real do Hub Epiper com acesso ao Pedido Eletrônico, E-commerce, Televendas, Inteligência de Vendas, clientes, pedidos, produtos e integrações." loading="lazy" width="900" height="477" />
        </figure>
        <div class="hub-real-showcase__chips" aria-label="Benefícios do Hub Epiper">
          <div class="hub-real-showcase__chip">Soluções em um só lugar</div>
          <div class="hub-real-showcase__chip">Visão centralizada da operação</div>
          <div class="hub-real-showcase__chip">Integração com o ERP</div>
        </div>
      </div>`;
    detailsSection.insertAdjacentElement('afterend', section);
  }
}
