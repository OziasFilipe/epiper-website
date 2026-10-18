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
    ['integracoes','Integração com o meu ERP'],
    ['operacao-conectada','Integração com o meu ERP']
  ].find(([key]) => originLower.includes(key));
  if (interest && originInterest && !interest.value) interest.value = originInterest[1];

  const phoneInput = form.elements.telefone;
  phoneInput?.addEventListener('input', () => {
    const digits = phoneInput.value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) phoneInput.value = digits;
    else if (digits.length <= 7) phoneInput.value = `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    else phoneInput.value = `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  });

  const helper = document.getElementById('formHelper');
  const emailTo = 'contato@epiper.com.br';

  const buildLines = () => {
    const d = new FormData(form);
    return [
      'Olá! Quero falar com um especialista da Epiper.',
      '',
      `Nome: ${d.get('nome')}`,
      `Empresa: ${d.get('empresa')}`,
      `WhatsApp: ${d.get('telefone')}`,
      `Interesse: ${d.get('interesse')}`,
      ...(d.get('mensagem') ? [`Contexto: ${d.get('mensagem')}`] : []),
      `Origem: ${d.get('origem') || 'site Epiper'}`
    ].join('\n');
  };

  const validate = () => {
    const phone = phoneInput?.value.replace(/\D/g, '') || '';
    phoneInput?.setCustomValidity(phone.length >= 10 ? '' : 'Informe um WhatsApp válido com DDD.');
    return form.reportValidity();
  };

  // Guarda o contato no painel da Epiper (melhor esforço: se falhar, o WhatsApp abre do mesmo jeito).
  const carregadoEm = Date.now();
  const registrarContato = async () => {
    try {
      const d = new FormData(form);
      let visitante = null;
      try { visitante = localStorage.getItem('epiper_v'); } catch (e) { /* sem armazenamento */ }
      const corpo = {
        nome: d.get('nome'), empresa: d.get('empresa'), telefone: d.get('telefone'), interesse: d.get('interesse'), mensagem: d.get('mensagem'),
        consentimento: d.get('consent') !== null, hp: d.get('website') || '', t0: carregadoEm, visitante, pagina: location.pathname,
      };
      const controle = new AbortController();
      const limite = setTimeout(() => controle.abort(), 4000);
      await fetch('/api/contato', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo), keepalive: true, credentials: 'omit', signal: controle.signal });
      clearTimeout(limite);
    } catch (e) { /* o contato segue pelo WhatsApp mesmo assim */ }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validate()) return;
    if (helper) helper.textContent = 'Abrindo o WhatsApp com sua mensagem pronta…';
    await registrarContato();
    window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildLines())}`;
  });

  document.getElementById('mailFallback')?.addEventListener('click', async (event) => {
    event.preventDefault();
    if (!validate()) return;
    await registrarContato();
    window.location.href = `mailto:${emailTo}?subject=${encodeURIComponent('Contato pelo site - ' + form.elements.empresa.value)}&body=${encodeURIComponent(buildLines())}`;
  });
})();
