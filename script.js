const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const revealElements = document.querySelectorAll('.reveal, .reveal-delay');
const yearEl = document.getElementById('year');
const topbar = document.querySelector('.topbar');
const mockup = document.querySelector('.hero-mockup');
const faqButtons = document.querySelectorAll('.faq-question');
const leadForm = document.getElementById('lead-form');
const navDropdown = document.querySelector('.nav-dropdown');
const navDropdownTrigger = document.querySelector('.nav-dropdown-trigger');
const heroProofs = document.querySelectorAll('.hero-proof-card strong');

const API_BASE = '/.netlify/functions/leads';

if (navDropdown && navDropdownTrigger) {
  navDropdownTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    navDropdown.classList.toggle('open');
    navDropdownTrigger.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!navDropdown.contains(e.target)) {
      navDropdown.classList.remove('open');
      navDropdownTrigger.classList.remove('active');
    }
  });
}

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (menuToggle && nav) {
  function toggleNav(force) {
    const isOpen = force !== undefined ? force : nav.classList.toggle('open');
    nav.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('nav-open', isOpen);
  }

  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNav();
  });
  menuToggle.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleNav();
  }, { passive: false });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (link.closest('.nav-dropdown')) return;
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    });
  });

  document.addEventListener('click', (event) => {
    const clickedInsideNav = nav.contains(event.target);
    const clickedToggle = menuToggle.contains(event.target);
    if (!clickedInsideNav && !clickedToggle) {
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    }
  });
}

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealElements.forEach((el) => revealObserver.observe(el));

window.addEventListener('scroll', () => {
  if (!topbar) return;
  topbar.style.boxShadow = window.scrollY > 10 ? '0 6px 20px rgba(20, 30, 60, 0.08)' : 'none';
}, { passive: true });

window.addEventListener('mousemove', (event) => {
  if (!mockup || window.innerWidth < 980) return;
  const x = (event.clientX / window.innerWidth - 0.5) * 8;
  const y = (event.clientY / window.innerHeight - 0.5) * 8;
  mockup.style.transform = `translate(${x}px, ${y}px)`;
});

faqButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    if (!item) return;
    const isOpen = item.classList.contains('open');
    faqButtons.forEach((otherButton) => {
      const otherItem = otherButton.closest('.faq-item');
      if (!otherItem) return;
      otherItem.classList.remove('open');
      otherButton.setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('open');
      button.setAttribute('aria-expanded', 'true');
    }
  });
});

if (leadForm) {
  leadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!leadForm.checkValidity()) {
      leadForm.reportValidity();
      return;
    }

    const submitButton = document.getElementById('submit-btn');
    const formStatus = document.getElementById('form-status');

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Enviando...';
    }
    if (formStatus) {
      formStatus.textContent = 'Enviando seu contato...';
      formStatus.className = 'form-feedback';
    }

    const formData = new FormData(leadForm);

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      });

      let result = {};
      try { result = await response.json(); } catch (_) {}

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Nao foi possivel enviar sua solicitacao.');
      }

      window.location.href = formData.get('redirect') || 'obrigado.html';
    } catch (error) {
      if (formStatus) {
        formStatus.textContent = error.message || 'Erro ao enviar. Tente novamente.';
        formStatus.className = 'form-feedback error';
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar contato';
      }
    }
  });
}

/* Animated counter for hero proof cards */
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const text = el.textContent.trim();
      const num = parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(num)) {
        const suffix = text.replace(/[\d.,]/g, '').trim();
        const prefix = text.replace(/[\d.,\s]/g, '').trim();
        const isDecimal = text.includes(',') || (num % 1 !== 0);
        const duration = 1500;
        const start = performance.now();
        function update(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = num * eased;
          el.textContent = prefix + (isDecimal ? current.toFixed(1).replace('.', ',') : Math.round(current)) + ' ' + suffix;
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
      }
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

heroProofs.forEach((el) => counterObserver.observe(el));

/* LGPD Cookie Consent */
(function() {
  const KEY = 'epiper_cookie_consent';
  if (localStorage.getItem(KEY)) return;

  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.innerHTML = `
    <p>Utilizamos cookies para melhorar sua experiencia. Ao continuar, voce concorda com nossa <a href="#" style="color:#fff;text-decoration:underline;">Politica de Privacidade</a>.</p>
    <button id="cookie-accept">Aceitar</button>
  `;
  Object.assign(banner.style, {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    background: '#0f1f35',
    color: '#fff',
    padding: '0.85rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
    zIndex: '9999',
    fontSize: '0.85rem',
    fontFamily: "'Inter', sans-serif",
    lineHeight: '1.5',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
  });
  banner.querySelector('p').style.margin = '0';
  const btn = banner.querySelector('#cookie-accept');
  Object.assign(btn.style, {
    background: '#1fb053',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 1.2rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit'
  });
  btn.addEventListener('click', () => {
    localStorage.setItem(KEY, '1');
    banner.style.opacity = '0';
    banner.style.transition = 'opacity 0.3s';
    setTimeout(() => banner.remove(), 300);
  });
  document.body.appendChild(banner);
})();

/* Hero slideshow auto-cycle with dots */
(function() {
  const slideshow = document.getElementById('heroSlideshow');
  if (!slideshow) return;
  const imgs = slideshow.querySelectorAll('img');
  const dots = document.getElementById('heroDots');
  if (imgs.length < 2) return;
  let idx = 0;
  function goTo(index) {
    imgs.forEach(i => i.classList.remove('active'));
    imgs[index].classList.add('active');
    if (dots) {
      dots.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));
      dots.querySelector(`.dot[data-index="${index}"]`).classList.add('active');
    }
    idx = index;
  }
  if (dots) {
    dots.querySelectorAll('.dot').forEach(d => {
      d.addEventListener('click', () => goTo(parseInt(d.dataset.index)));
    });
  }
  setInterval(() => {
    goTo((idx + 1) % imgs.length);
  }, 4000);
})();

/* Close mobile nav when window resizes past breakpoint */
window.addEventListener('resize', () => {
  if (window.innerWidth > 980 && nav) {
    nav.classList.remove('open');
    document.body.classList.remove('nav-open');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
  }
});

/* Lightbox for image gallery */
(function() {
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lightboxImg');
  if (!lb || !lbImg) return;
  document.querySelectorAll('.images-grid .image-card img, .device-thumbs img').forEach(function(img) {
    img.style.cursor = 'pointer';
    img.addEventListener('click', function() {
      lbImg.src = this.src;
      lbImg.alt = this.alt;
      lb.classList.add('open');
    });
  });
})();
