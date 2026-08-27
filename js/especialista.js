(() => {
  const form = document.getElementById('specialistForm');
  if (!form) return;

  const whatsappNumber = '5527996217169';
  const params = new URLSearchParams(window.location.search);
  const originField = document.getElementById('formOrigin');
  const origin = params.get('origem') || document.referrer || 'site Epiper';
  if (originField) originField.value = origin;

  // Usa a página de origem para deixar o formulário mais contextual sem bloquear a escolha do visitante.
  const interest = form.elements.interesse;
  const originLower = String(origin).toLowerCase();
  const originInterest = [
    ['pedido-eletronico','Pedido Eletrônico'],
    ['televendas','Televendas'],
    ['hub-epiper','Hub Epiper'],
    ['integracoes','Integrações com ERP'],
    ['operacao-conectada','Operação conectada'],
    ['implantacao-guiada','Implantação e evolução por módulos'],
    ['evolucao-modulos','Implantação e evolução por módulos']
  ].find(([key]) => originLower.includes(key));
  if (interest && originInterest && !interest.value) interest.value = originInterest[1];

  const phoneInput = form.elements.telefone;
  phoneInput?.addEventListener('input', () => {
    const digits = phoneInput.value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) phoneInput.value = digits;
    else if (digits.length <= 7) phoneInput.value = `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    else phoneInput.value = `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  });

  // Bloco de orientação: reduz formulário “cru” e ajuda o visitante a chegar com as informações certas.
  const grid = document.querySelector('.contact-grid');
  if (grid && !document.querySelector('.contact-assurance')) {
    const section = document.createElement('section');
    section.className = 'contact-assurance';
    section.innerHTML = `
      <div class="contact-container">
        <div class="contact-assurance__head">
          <span>Uma conversa mais objetiva</span>
          <h2>Três informações ajudam a avaliar seu cenário com mais precisão.</h2>
          <p>Não é necessário ter um projeto pronto. Basta trazer o contexto atual para entendermos onde existe mais impacto e quais dependências técnicas precisam ser verificadas.</p>
        </div>
        <div class="contact-assurance__grid">
          <article><b>1</b><h3>ERP e estrutura atual</h3><p>Qual sistema sustenta clientes, produtos, preço, estoque e pedidos hoje.</p></article>
          <article><b>2</b><h3>Fluxo comercial</h3><p>Quem vende, como o pedido é montado e onde aparecem as principais etapas manuais.</p></article>
          <article><b>3</b><h3>Prioridade</h3><p>Qual problema deve melhorar primeiro: canal B2B, atendimento, integração, retorno ou organização do ecossistema.</p></article>
        </div>
        <div class="contact-assurance__note"><strong>Importante:</strong> compatibilidade com ERP, automações e retornos são confirmados depois da análise técnica do ambiente — sem prometer integração automática antes de avaliar APIs, banco, arquivos, permissões e processo.</div>
      </div>`;
    document.querySelector('.contact-hero')?.insertAdjacentElement('afterend',section);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const lines = [
      'Olá! Quero falar com um especialista da Epiper.',
      '',
      `Nome: ${data.get('nome')}`,
      `Empresa: ${data.get('empresa')}`,
      `WhatsApp: ${data.get('telefone')}`,
      `E-mail: ${data.get('email')}`,
      `Segmento: ${data.get('segmento')}`,
      `ERP atual: ${data.get('erp') || 'Não informado'}`,
      `Interesse: ${data.get('interesse')}`,
      `Origem: ${data.get('origem') || 'site Epiper'}`,
      '',
      `Objetivo / contexto: ${data.get('mensagem') || 'Quero entender qual solução se encaixa melhor na operação.'}`
    ];

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.location.href = url;
  });
})();
