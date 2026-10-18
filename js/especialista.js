(() => {
  const form = document.getElementById('specialistForm');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const originField = document.getElementById('formOrigin');
  const origin = params.get('origem') || document.referrer || 'site Epiper';
  if (originField) originField.value = origin;

  // Usa a página de origem para deixar o formulário mais contextual sem bloquear a escolha do visitante.
  const interest = form.elements.interesse;
  const originLower = String(origin).toLowerCase();
  const originInterest = [
    ['pedido-eletronico', 'Pedido Eletrônico'],
    ['televendas', 'Televendas'],
    ['hub-epiper', 'Quero entender qual solução faz sentido'],
    ['integracoes', 'Quero entender qual solução faz sentido'],
    ['operacao-conectada', 'Quero entender qual solução faz sentido']
  ].find(([key]) => originLower.includes(key));
  if (interest && originInterest && !interest.value) interest.value = originInterest[1];

  const phoneInput = form.elements.telefone;
  phoneInput?.addEventListener('input', () => {
    const digits = phoneInput.value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) phoneInput.value = digits;
    else if (digits.length <= 7) phoneInput.value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    else phoneInput.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  });

  // "Já utiliza alguma solução?": a pergunta acompanha o que o visitante procura e só aparece depois dessa escolha.
  // Só com "Sim" aparece o campo do nome; com "Não" (ou sem resposta) nada acontece e o campo fica limpo.
  const perguntas = {
    'Pedido Eletrônico': ['Você já utiliza alguma solução de pedido eletrônico?', 'Qual é o nome da solução de pedido eletrônico?'],
    'Televendas': ['Você já utiliza alguma solução de televendas?', 'Qual é o nome da solução de televendas?'],
    'Quero entender qual solução faz sentido': ['Você já utiliza alguma solução de vendas ou gestão?', 'Qual solução você já utiliza?']
  };
  const campoUsa = document.getElementById('campoUsa');
  const perguntaUsa = document.getElementById('perguntaUsa');
  const perguntaNome = document.getElementById('perguntaNome');
  const usaSolucao = form.querySelectorAll('input[name=usa_solucao]');
  // "Prefiro não informar" conta como sem resposta: só Sim e Não seguem para o Hub.
  const respostaUsa = () => { const v = form.querySelector('input[name=usa_solucao]:checked')?.value; return v === 'Sim' || v === 'Não' ? v : ''; };
  const campoSolucao = document.getElementById('campoSolucao');
  const nomeSolucao = document.getElementById('nomeSolucao');
  const atualizarSolucao = () => {
    const par = perguntas[interest?.value];
    if (campoUsa) campoUsa.hidden = !par;
    if (par) {
      if (perguntaUsa) perguntaUsa.textContent = par[0];
      if (perguntaNome) perguntaNome.textContent = par[1];
    } else usaSolucao.forEach((r) => { r.checked = false; });
    const sim = !!par && respostaUsa() === 'Sim';
    if (campoSolucao) campoSolucao.hidden = !sim;
    if (!sim && nomeSolucao) nomeSolucao.value = '';
  };
  interest?.addEventListener('change', atualizarSolucao);
  usaSolucao.forEach((r) => r.addEventListener('change', atualizarSolucao));
  atualizarSolucao();

  const botao = document.getElementById('botaoEnviar');
  const textoBotao = botao?.querySelector('.submit-btn__txt');
  const helper = document.getElementById('formHelper');
  const erro = document.getElementById('formErro');
  const sucesso = document.getElementById('formSucesso');
  const carregadoEm = Date.now();
  const SEGUNDOS_ATE_INICIO = 5;

  const mostrarErro = (html) => { if (erro) { erro.innerHTML = html; erro.hidden = false; } };
  const limparErro = () => { if (erro) { erro.hidden = true; erro.textContent = ''; } };

  const validate = () => {
    const phone = phoneInput?.value.replace(/\D/g, '') || '';
    phoneInput?.setCustomValidity(phone.length >= 10 ? '' : 'Informe um WhatsApp válido com DDD.');
    return form.reportValidity();
  };

  const mostrarSucesso = () => {
    if (!sucesso) return;
    form.querySelectorAll('.form-grid, .consent, .submit-btn, .form-helper, .form-erro').forEach((el) => { el.style.visibility = 'hidden'; });
    sucesso.hidden = false;
    // Foco no aviso para leitores de tela anunciarem; o redirecionamento é automático.
    sucesso.setAttribute('tabindex', '-1');
    sucesso.focus({ preventScroll: true });
    setTimeout(() => { window.location.href = 'index.html'; }, SEGUNDOS_ATE_INICIO * 1000);
  };

  // Mensagens de erro claras e sem culpar o visitante.
  const mensagemDeErro = async (resposta) => {
    if (resposta.status === 429) return 'Recebemos muitos envios deste aparelho. Aguarde alguns minutos e tente de novo.';
    if (resposta.status === 400) {
      try {
        const campo = (await resposta.json()).campo;
        const nomes = { nome: 'o nome', empresa: 'a empresa', telefone: 'o WhatsApp (com DDD)', interesse: 'o que você procura', consentimento: 'a autorização de envio', email: 'o e-mail' };
        if (nomes[campo]) return `Confira ${nomes[campo]} e tente de novo.`;
      } catch (e) { /* segue com a mensagem padrão */ }
      return 'Confira os campos e tente de novo.';
    }
    return null;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (botao?.disabled || !validate()) return;
    limparErro();
    botao.disabled = true;
    if (textoBotao) textoBotao.textContent = 'Enviando…';

    const d = new FormData(form);
    let visitante = null;
    try { visitante = localStorage.getItem('epiper_v'); } catch (e) { /* sem armazenamento */ }
    const corpo = {
      nome: d.get('nome'), empresa: d.get('empresa'), telefone: d.get('telefone'), interesse: d.get('interesse'), mensagem: d.get('mensagem'),
      usa_solucao: respostaUsa(), nome_solucao: respostaUsa() === 'Sim' ? (d.get('nome_solucao') || '') : '',
      consentimento: d.get('consent') !== null, hp: d.get('website') || '', t0: carregadoEm, visitante, pagina: location.pathname
    };

    try {
      const controle = new AbortController();
      const limite = setTimeout(() => controle.abort(), 12000);
      const resposta = await fetch('/api/contato', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo), credentials: 'omit', signal: controle.signal
      });
      clearTimeout(limite);
      if (resposta.ok) {
        mostrarSucesso();
        return;
      }
      const msg = await mensagemDeErro(resposta);
      mostrarErro(msg || 'Não conseguimos enviar agora. Tente de novo em instantes ou fale com a gente pelo <a href="https://wa.me/5527996217169" rel="noopener" target="_blank">WhatsApp</a>.');
    } catch (e) {
      mostrarErro('Não conseguimos enviar agora. Confira sua conexão e tente de novo, ou fale com a gente pelo <a href="https://wa.me/5527996217169" rel="noopener" target="_blank">WhatsApp</a>.');
    }
    botao.disabled = false;
    if (textoBotao) textoBotao.textContent = 'Enviar';
  });
})();
