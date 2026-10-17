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
          <article><b>3</b><h3>Prioridade</h3><p>Qual problema deve melhorar primeiro: pedido B2B, atendimento, loja digital, comunicação comercial ou integração.</p></article>
        </div>
        <div class="contact-assurance__note"><strong>Importante:</strong> compatibilidade com ERP, automações e retornos são confirmados depois da análise técnica do ambiente — sem prometer integração automática antes de avaliar APIs, banco, arquivos, permissões e processo.</div>
      </div>`;
    document.querySelector('.contact-hero')?.insertAdjacentElement('afterend',section);
  }

  const helper = document.getElementById('formHelper');
  const emailTo = 'contato@epiper.com.br';

  // Pontuação simples só para o time comercial priorizar o retorno (não é exibida ao visitante).
  const scoreLead = (d) => {
    const pts = {
      vendedores: { 'Até 5': 1, '6 a 20': 2, '21 a 50': 3, 'Mais de 50': 4 },
      volume: { 'Até 200': 1, '201 a 1.000': 2, '1.001 a 5.000': 3, 'Mais de 5.000': 4 },
      prazo: { 'Imediato (até 30 dias)': 4, '1 a 3 meses': 3, 'Mais de 3 meses': 2, 'Apenas pesquisando': 1 }
    };
    const total = ['vendedores','volume','prazo'].reduce((a,k) => a + (pts[k][d.get(k)] || 0), 0);
    return total >= 10 ? 'Alta' : total >= 7 ? 'Média' : 'Inicial';
  };

  const buildLines = () => {
    const d = new FormData(form);
    const canais = d.getAll('canais').join(', ') || 'Não informado';
    const v = (k) => d.get(k) || 'Não informado';
    return [
      'Olá! Quero falar com um especialista da Epiper.',
      '',
      `Nome: ${d.get('nome')}${d.get('cargo') ? ` (${d.get('cargo')})` : ''}`,
      `Empresa: ${d.get('empresa')}`,
      `WhatsApp: ${d.get('telefone')}`,
      `E-mail: ${d.get('email')}`,
      `Segmento: ${v('segmento')}`,
      `ERP atual: ${d.get('erp') || 'Não informado'}`,
      `Vendedores: ${v('vendedores')}`,
      `Pedidos/mês: ${v('volume')}`,
      `Canais de pedido hoje: ${canais}`,
      `Prazo: ${v('prazo')}`,
      `Interesse: ${d.get('interesse')}`,
      `Prioridade estimada: ${scoreLead(d)}`,
      `Origem: ${d.get('origem') || 'site Epiper'}`,
      '',
      `Objetivo / contexto: ${d.get('mensagem') || 'Quero entender qual solução se encaixa melhor na operação.'}`
    ].join('\n');
  };

  const validate = () => {
    const phone = phoneInput?.value.replace(/\D/g, '') || '';
    phoneInput?.setCustomValidity(phone.length >= 10 ? '' : 'Informe um WhatsApp válido com DDD.');
    return form.reportValidity();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validate()) return;
    if (helper) helper.textContent = 'Abrindo o WhatsApp com sua mensagem pronta…';
    window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildLines())}`;
  });

  document.getElementById('mailFallback')?.addEventListener('click', (event) => {
    event.preventDefault();
    if (!validate()) return;
    window.location.href = `mailto:${emailTo}?subject=${encodeURIComponent('Contato pelo site - ' + form.elements.empresa.value)}&body=${encodeURIComponent(buildLines())}`;
  });
})();
