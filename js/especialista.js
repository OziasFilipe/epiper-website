(() => {
  const form = document.getElementById('specialistForm');
  if (!form) return;

  const whatsappNumber = '5527996217169';
  const params = new URLSearchParams(window.location.search);
  const originField = document.getElementById('formOrigin');
  if (originField) originField.value = params.get('origem') || document.referrer || 'site Epiper';

  const phoneInput = form.elements.telefone;
  phoneInput?.addEventListener('input', () => {
    const digits = phoneInput.value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) phoneInput.value = digits;
    else if (digits.length <= 7) phoneInput.value = `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    else phoneInput.value = `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  });

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
