const header = document.getElementById('header');
    const hamburger = document.getElementById('hamburger');

    hamburger?.addEventListener('click', () => {
      const open = header.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', String(open));
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  

    const hubTabs = document.querySelectorAll('[data-hub-tab]');
    const hubPanels = document.querySelectorAll('[data-hub-panel]');

    hubTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.hubTab;

        hubTabs.forEach(btn => {
          btn.classList.remove('is-active');
          btn.setAttribute('aria-selected', 'false');
        });
        hubPanels.forEach(panel => panel.classList.remove('is-active'));

        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        document.querySelector(`[data-hub-panel="${target}"]`)?.classList.add('is-active');
      });
    });

  

    const topTriggers = document.querySelectorAll('[data-menu-trigger]');
    const topPanels = document.querySelectorAll('[data-menu-panel]');
    const megaWrap = document.getElementById('megaMenuWrap');
    const megaBackdrop = document.getElementById('megaMenuBackdrop');

    function closeMegaMenus(){
      topTriggers.forEach(btn => {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-expanded', 'false');
      });
      topPanels.forEach(panel => {
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
      });
      megaBackdrop?.classList.remove('is-visible');
      megaBackdrop?.setAttribute('aria-hidden', 'true');
    }

    topTriggers.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = btn.dataset.menuTrigger;
        const panel = document.querySelector(`[data-menu-panel="${target}"]`);
        const willOpen = !btn.classList.contains('is-active');

        closeMegaMenus();

        if (willOpen && panel) {
          btn.classList.add('is-active');
          btn.setAttribute('aria-expanded', 'true');
          panel.classList.add('is-open');
          panel.setAttribute('aria-hidden', 'false');
          megaBackdrop?.classList.add('is-visible');
          megaBackdrop?.setAttribute('aria-hidden', 'false');
        }
      });
    });

    megaBackdrop?.addEventListener('click', closeMegaMenus);

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-pill') && !e.target.closest('.mega-menu-wrap')) {
        closeMegaMenus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth <= 980) closeMegaMenus();
    });


// V17 — contato e acessibilidade
const EPIPER_WHATSAPP_NUMBER = ''; // Informe somente dígitos, ex.: 5527999999999
const EPIPER_CONTACT_EMAIL = 'contato@epiper.com.br';
document.querySelectorAll('[data-whatsapp]').forEach(link => {
  link.addEventListener('click', event => {
    if (!EPIPER_WHATSAPP_NUMBER) return; // mantém o mailto como fallback enquanto o número não estiver configurado
    event.preventDefault();
    const text = encodeURIComponent('Olá! Quero conhecer as soluções da Epiper e entender qual se encaixa na minha operação.');
    window.open(`https://wa.me/${EPIPER_WHATSAPP_NUMBER}?text=${text}`,'_blank','noopener');
  });
});
document.addEventListener('keydown', event => { if(event.key === 'Escape' && typeof closeMegaMenus === 'function') closeMegaMenus(); });
document.querySelectorAll('.mega-menu-wrap a,.nav-pill>a').forEach(link => link.addEventListener('click', () => { if(typeof closeMegaMenus === 'function') closeMegaMenus(); }));


// V24 — header acompanha a rolagem e incorpora a logo na barra
const syncStickyHeader = () => {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 18);
};
syncStickyHeader();
window.addEventListener('scroll', syncStickyHeader, { passive: true });
