(() => {
  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const icon = (name) => `assets/icons/menu/${name}.svg`;

  const pages = {
    'plataforma.html': {
      context:[['hub','Ecossistema conectado','Canais, operação e integração na mesma arquitetura.'],['erp','ERP preservado','A Epiper moderniza a camada comercial sem exigir a troca do sistema central.'],['evolucao','Evolução gradual','Comece pelo fluxo prioritário e amplie conforme a operação amadurece.']],
      kicker:'Arquitetura da plataforma',
      title:'Uma plataforma comercial organizada em camadas claras.',
      intro:'A Epiper separa responsabilidades para que cada parte da operação tenha um papel definido: o ERP mantém a base e as regras, os produtos cuidam da experiência de venda e o Hub organiza o acesso ao ecossistema.',
      cards:[
        ['pedido','Quatro produtos','Pedido Eletrônico, Televendas, E-commerce B2B e Inteligência de Vendas atendem jornadas diferentes sobre o mesmo núcleo.','Experiência comercial'],
        ['produto','Dados comerciais','Clientes, produtos, preço, estoque e condições podem abastecer os canais conforme o escopo da integração.','Base operacional'],
        ['erp','Integração com ERP','APIs, banco, arquivos ou conectores são avaliados conforme o ambiente técnico disponível.','Integração'],
        ['hub','Hub e gestão','O Hub aproxima módulos, acessos, indicadores e recursos para reduzir dispersão na rotina.','Governança']
      ],
      visual:['assets/images/plataforma-detalhes.svg','Como as partes trabalham juntas','O desenho ajuda a entender onde cada componente entra na operação e evita a sensação de “mais um sistema” desconectado.',['ERP como base de regras e dados','Canais comerciais voltados à execução da venda','Módulos podem ser adotados em fases diferentes']],
      decision:[
        ['Para quem faz sentido',['Atacado e distribuição com volume recorrente de pedidos','Varejo B2B ou operação com representantes e vendedores','Empresas que já têm ERP e querem melhorar a camada comercial']],
        ['O que precisa estar claro',['Qual ERP sustenta a operação','Como pedidos são feitos e processados hoje','Quais dados e retornos precisam aparecer para a equipe']],
        ['Como começar',['Escolher o fluxo de maior impacto','Definir integração e regras essenciais','Homologar, medir o uso e evoluir por prioridade']]
      ],
      note:['O ERP continua sendo a referência da operação','A Epiper atua como uma camada comercial conectada. Regras, automações e disponibilidade de dados dependem do desenho de integração definido para cada empresa.'],
      related:[['hub-epiper.html','Hub Epiper','Veja como os módulos e recursos ficam organizados.'],['operacao-conectada.html','Operação conectada','Entenda a ida e volta dos dados e pedidos.'],['implantacao-guiada.html','Implantação guiada','Conheça o caminho da análise ao go-live.']]
    },
    'hub-epiper.html': {
      context:[['hub','Central de soluções','Acesso aos módulos e recursos em um único ambiente.'],['clientes','Visão operacional','Clientes, pedidos, produtos e integrações próximos da rotina.'],['status','Indicadores e status','Informações de uso e operação com leitura mais rápida.']],
      kicker:'Papel do Hub',
      title:'O Hub organiza o ecossistema sem substituir os produtos.',
      intro:'Ele funciona como a porta de entrada da experiência Epiper: centraliza acessos, aproxima informações importantes e ajuda a equipe a entender quais soluções estão disponíveis para cada operação ou empresa.',
      cards:[
        ['hub','Soluções e acessos','Pedido Eletrônico, Televendas, E-commerce B2B e Inteligência de Vendas ficam acessíveis a partir da mesma central.','Centralização'],
        ['clientes','Operação comercial','Clientes, pedidos, produtos, títulos e carteiras podem compor a visão operacional conforme o escopo habilitado.','Contexto'],
        ['status','Indicadores','Status dos serviços, utilização e indicadores ajudam a equipe a identificar rapidamente o que merece atenção.','Visibilidade'],
        ['erp','Integrações','O Hub também aproxima o contexto das integrações e conexões que sustentam os módulos comerciais.','Ecossistema']
      ],
      visual:['assets/images/hub-epiper-detalhes.svg','O que a central reúne','A imagem complementa a tela real do Hub e mostra como cada grupo de informação se relaciona com a operação.',['Acesso por empresa ou contexto operacional','Módulos comerciais organizados por finalidade','Cadastros, indicadores e integrações próximos da equipe']],
      decision:[
        ['Uso no dia a dia',['Entrar pelos módulos liberados para a operação','Consultar rapidamente o contexto comercial','Reduzir a troca entre endereços e sistemas paralelos']],
        ['Governança',['Organizar acessos por empresa e usuário','Separar módulos conforme necessidade','Manter uma experiência comum entre soluções Epiper']],
        ['Evolução',['Adicionar novos módulos sem redesenhar toda a navegação','Concentrar novas integrações no mesmo ecossistema','Aumentar a visão operacional conforme a adoção cresce']]
      ],
      note:['Centralização não significa duplicação do ERP','O Hub apresenta a experiência e os recursos da Epiper. Dados e regras continuam respeitando a arquitetura definida com o ERP e as integrações de cada projeto.'],
      related:[['plataforma.html','Visão geral da Plataforma','Entenda onde o Hub entra na arquitetura completa.'],['operacao-conectada.html','Operação conectada','Veja como os dados circulam entre ERP e canais.'],['evolucao-modulos.html','Evolução por módulos','Entenda como ampliar o ecossistema por etapas.']]
    },
    'operacao-conectada.html': {
      context:[['erp','Dados do ERP','Clientes, produtos, estoque, preços e regras alimentam a venda.'],['pedido','Pedido padronizado','O canal comercial registra a venda dentro de um fluxo definido.'],['status','Retorno operacional','Status e processamento podem voltar para acompanhamento conforme a integração.']],
      kicker:'Fluxo operacional',
      title:'Conectar não é apenas enviar o pedido ao ERP.',
      intro:'Uma operação realmente conectada precisa tratar a ida dos dados, a execução da venda, as validações e o retorno do processamento. Esse ciclo reduz consultas paralelas e dá mais contexto para quem atende o cliente.',
      cards:[
        ['erp','Origem dos dados','O ERP ou a estrutura central continua sendo a principal referência para cadastros, condições e regras.','Origem'],
        ['automacao','Sincronização','A atualização pode ocorrer por APIs, banco, arquivos ou conectores, conforme o cenário técnico.','Atualização'],
        ['pedido','Execução comercial','Pedido Eletrônico, Televendas e E-commerce usam os dados disponíveis para vender, enquanto Inteligência de Vendas organiza a comunicação com a equipe.','Canais'],
        ['status','Retorno e acompanhamento','Quando o ERP fornece os retornos necessários, a equipe pode acompanhar validação, processamento e status.','Retorno']
      ],
      visual:['assets/images/operacao-conectada-detalhes.svg','Do dado ao retorno','O fluxo evidencia a responsabilidade de cada camada e mostra por que a integração precisa considerar a jornada completa, não apenas o envio do pedido.',['Dados comerciais chegam aos canais','Pedido segue regras e validações previstas','Retorno melhora acompanhamento e atendimento']],
      decision:[
        ['Principais ganhos',['Menos digitação duplicada','Menos consulta em fontes paralelas','Mais consistência entre venda e processamento']],
        ['Pontos a mapear',['Origem de preço e estoque','Regras de validação do pedido','Status que precisam voltar para o comercial']],
        ['Indicadores úteis',['Pedidos integrados e pendentes','Tempo entre envio e processamento','Ocorrências que exigem ação da equipe']]
      ],
      note:['O fluxo final é definido pelo ambiente da empresa','Nem todo ERP oferece os mesmos pontos de integração ou retornos. Por isso a operação conectada é desenhada a partir do processo real e das interfaces técnicas disponíveis.'],
      related:[['integracoes.html','ERPs e Integrações','Veja os métodos de conexão avaliados pela Epiper.'],['pedido-eletronico.html','Pedido Eletrônico','Conheça o canal B2B de pedidos.'],['televendas.html','Televendas','Veja a jornada de venda assistida.']]
    },
    'implantacao-guiada.html': {
      context:[['implantacao','Mapeamento antes de configurar','Processo, dados e regras são entendidos antes da virada.'],['erp','Integração avaliada','O método depende do ERP e da infraestrutura disponível.'],['status','Homologação e go-live','A entrada em produção acontece após validação do fluxo.']],
      kicker:'Projeto de implantação',
      title:'Implantar bem é reduzir surpresa antes do go-live.',
      intro:'A implantação precisa transformar o cenário comercial da empresa em configuração, integração e critérios de validação claros. O objetivo é chegar à produção com responsabilidades definidas e fluxo homologado.',
      cards:[
        ['clientes','Descoberta','Entendimento dos usuários, canais, regras comerciais e principais gargalos da operação atual.','Etapa 1'],
        ['produto','Mapeamento','Levantamento dos dados necessários, permissões, cadastros e pontos de integração com o ERP.','Etapa 2'],
        ['erp','Configuração e integração','Parametrização do ambiente e construção do fluxo técnico conforme o escopo acordado.','Etapas 3–4'],
        ['status','Homologação e entrada','Testes de ponta a ponta, validação com a empresa e acompanhamento inicial da operação.','Etapas 5–6']
      ],
      visual:['assets/images/implantacao-guiada-detalhes.svg','Uma jornada com critérios de avanço','Cada fase existe para diminuir retrabalho nas etapas seguintes. A homologação deve comprovar o fluxo que será utilizado em produção.',['Escopo técnico e comercial documentado','Testes com cenários reais da operação','Go-live acompanhado para ajustes iniciais']],
      decision:[
        ['O que a empresa fornece',['Acesso técnico necessário para análise','Responsáveis pelo ERP e pela operação comercial','Regras, cadastros e cenários usados no dia a dia']],
        ['O que é validado',['Atualização dos dados essenciais','Criação e processamento do pedido','Retornos e exceções previstas no escopo']],
        ['Critério de go-live',['Fluxo principal homologado','Usuários e permissões preparados','Responsáveis alinhados para acompanhamento inicial']]
      ],
      note:['Implantação não é uma receita idêntica para todos','O produto mantém uma base comum, mas integração, regras, usuários e validações variam conforme o ERP, infraestrutura e processo comercial de cada empresa.'],
      related:[['integracoes.html','Integrações','Entenda o que define a viabilidade técnica.'],['operacao-conectada.html','Operação conectada','Veja o fluxo que precisa ser homologado.'],['evolucao-modulos.html','Evolução por módulos','Planeje o que pode entrar em uma segunda fase.']]
    },
    'evolucao-modulos.html': {
      context:[['evolucao','Comece pelo impacto','A primeira fase pode atacar o gargalo comercial mais importante.'],['hub','Base comum','Novos módulos entram no mesmo ecossistema Epiper.'],['status','Evolução orientada','Uso, prioridade e processo ajudam a definir os próximos passos.']],
      kicker:'Crescimento modular',
      title:'Evoluir por módulos evita transformar melhoria em um projeto interminável.',
      intro:'Nem toda operação precisa ativar tudo no primeiro momento. Uma estratégia modular permite entregar valor mais cedo, estabilizar o fluxo principal e ampliar recursos conforme as prioridades ficam mais claras.',
      cards:[
        ['pedido','Primeiro canal','Pedido Eletrônico pode ser a prioridade quando o objetivo é criar um canal B2B mais organizado.','Exemplo'],
        ['televendas','Venda assistida','Televendas pode entrar primeiro quando o gargalo está na produtividade e no contexto da equipe interna.','Exemplo'],
        ['varejo','Loja B2B','E-commerce pode entrar quando a prioridade é publicar catálogo, receber pedidos e criar campanhas em uma vitrine própria.','Exemplo'],
        ['evolucao','Comunicação comercial','Inteligência de Vendas pode organizar promoções, materiais, treinamentos e leituras no App Comercial.','Exemplo']
      ],
      visual:['assets/images/evolucao-modulos-detalhes.svg','Uma base que pode crescer sem recomeçar','A evolução funciona melhor quando cada fase tem objetivo, escopo e resultado esperado. Assim o próximo módulo entra sobre uma base já validada.',['Prioridade comercial antes de quantidade de recursos','Integração planejada para suportar novas fases','Adoção medida antes da próxima expansão']],
      decision:[
        ['Sinais para evoluir',['Fluxo atual já está estável','Há nova etapa manual relevante para reduzir','Usuários pedem mais contexto ou automação']],
        ['O que medir',['Adoção e frequência de uso','Volume e qualidade dos pedidos','Ocorrências, tempo e retrabalho operacional']],
        ['Como priorizar',['Impacto no cliente e na equipe','Dependências técnicas da integração','Complexidade versus ganho esperado']]
      ],
      note:['Modular não significa improvisado','Mesmo quando a implantação ocorre em fases, arquitetura de integração, dados e permissões devem considerar a evolução futura para evitar retrabalho desnecessário.'],
      related:[['plataforma.html','Plataforma Epiper','Veja a arquitetura que sustenta os módulos.'],['hub-epiper.html','Hub Epiper','Entenda como os módulos ficam organizados.'],['fale-com-especialista.html','Planejar uma evolução','Conte qual etapa da operação você quer melhorar.']]
    },
    'pedido-eletronico.html': {
      context:[['pedido','Canal B2B de pedidos','Clientes, vendedores ou representantes podem operar conforme permissões definidas.'],['estoque','Informação comercial','Preço, estoque e condições podem acompanhar a montagem do pedido.'],['erp','Conectado ao processamento','O pedido segue o fluxo de integração definido com o ERP.']],
      kicker:'Na prática',
      title:'O Pedido Eletrônico precisa facilitar a compra sem ignorar as regras comerciais.',
      intro:'O valor do canal B2B está em aproximar catálogo, informação comercial e fechamento do pedido. A experiência fica mais simples para o usuário, enquanto regras e processamento continuam alinhados ao ambiente da empresa.',
      cards:[
        ['produto','Lista e mix','O canal permite selecionar o cliente, pesquisar produtos e adicionar quantidades em uma jornada objetiva.','Descoberta'],
        ['estoque','Preço e disponibilidade','Informações comerciais podem ser apresentadas conforme dados e regras fornecidos pela integração.','Decisão'],
        ['pedido','Condição e fechamento','Quantidade, itens, condição comercial e prazo formam um pedido padronizado antes do envio.','Conversão'],
        ['status','Acesso por cliente','Links específicos podem simplificar o acesso de cada cliente ao canal autorizado.','Distribuição']
      ],
      visual:['assets/images/pedido-eletronico-detalhes.svg','O que o usuário encontra durante a jornada','A experiência foi organizada em torno das decisões que acontecem antes, durante e depois do fechamento do pedido.',['Catálogo, preço e estoque no mesmo contexto','Condições comerciais aplicadas ao fluxo','Pedido e retorno conectados à operação']],
      decision:[
        ['Perfis de uso',['Clientes B2B com acesso ao canal','Representantes em venda externa','Vendedores que precisam registrar pedidos com mais autonomia']],
        ['Dados importantes',['Cadastro e segmentação de clientes','Produtos, preços, estoque e condições','Regras de pedido e retornos necessários']],
        ['Resultados esperados',['Menos dependência de atendimento manual para pedidos recorrentes','Menos digitação e consulta em fontes separadas','Mais padronização na entrada do pedido']]
      ],
      note:['A experiência depende da integração e das regras comerciais','Preço, estoque, condições, limites e status disponíveis no canal dependem dos dados que o ERP e a arquitetura de integração conseguem fornecer para o projeto.'],
      related:[['integracoes.html','Integração com ERP','Veja como os dados comerciais podem chegar ao canal.'],['operacao-conectada.html','Fluxo do pedido','Entenda o que acontece depois do envio.'],['televendas.html','Televendas','Compare com a jornada de venda assistida.']]
    },
    'televendas.html': {
      context:[['televendas','Venda assistida','A equipe atende com cliente, produtos e pedido mais próximos.'],['clientes','Contexto comercial','Histórico e dados relevantes ajudam a conduzir o atendimento.'],['status','Gestão e acompanhamento','Indicadores e rotina comercial ganham uma estrutura mais organizada.']],
      kicker:'Na prática',
      title:'Televendas é mais do que registrar um pedido durante uma ligação.',
      intro:'A proposta é organizar a venda assistida: trazer contexto antes da abordagem, agilizar a consulta durante o atendimento e manter o registro do pedido dentro do mesmo fluxo comercial.',
      cards:[
        ['clientes','Carteira, agenda e CRM','Cliente, histórico, funil e próximos contatos ficam próximos durante a rotina comercial.','Preparação'],
        ['produto','Consulta comercial','Busca, estoque, preço, títulos e condições ajudam a equipe sem alternar entre várias fontes.','Atendimento'],
        ['pedido','Pedido e conversas','O operador monta a venda e pode organizar contatos por WhatsApp e chat interno no mesmo ambiente.','Execução'],
        ['status','Metas e relatórios','Dashboard, produtividade e relatórios ajudam a liderança a acompanhar a equipe.','Gestão']
      ],
      visual:['assets/images/televendas-detalhes.svg','Uma jornada de atendimento com mais contexto','O fluxo aproxima informação, execução e gestão para que a equipe comercial concentre energia no atendimento em vez de procurar dados espalhados.',['Contexto antes de iniciar a venda','Consulta e pedido durante o atendimento','Indicadores para acompanhar a rotina comercial']],
      decision:[
        ['Onde gera valor',['Equipes com alto volume de atendimento','Operações com muitos pedidos digitados manualmente','Vendas que dependem de consulta frequente ao ERP']],
        ['O que precisa integrar',['Clientes e informações comerciais relevantes','Produtos, preço, estoque e condições','Pedidos e retornos necessários para acompanhamento']],
        ['O que acompanhar',['Atendimentos e pedidos por operador','Conversão, produtividade e valor vendido','Pendências e ocorrências que afetam o cliente']]
      ],
      note:['Televendas não precisa ficar limitado ao telefone','A solução representa venda assistida e pode apoiar outros canais de atendimento quando o processo exige contexto do cliente, consulta comercial e montagem do pedido pela equipe interna.'],
      related:[['pedido-eletronico.html','Pedido Eletrônico','Veja a alternativa de autoatendimento B2B.'],['integracoes.html','Integrações','Entenda como o contexto comercial chega à equipe.'],['hub-epiper.html','Hub Epiper','Veja como os canais convivem no mesmo ecossistema.']]
    },
    'ecommerce.html': {
      context:[['varejo','Vitrine B2B','Um endereço público para o cliente comprar no catálogo autorizado.'],['produto','Catálogo por filial','A empresa decide o mix que será publicado em cada contexto.'],['pedido','Pedidos no núcleo','As compras chegam identificadas pela origem E-commerce.']],
      kicker:'E-commerce na prática',
      title:'Uma vitrine digital só gera valor quando continua ligada à operação.',
      intro:'A Epiper aproxima publicação de produtos, experiência de compra, pedidos e campanhas. O cliente encontra uma loja simples; a empresa administra o canal no mesmo ecossistema comercial.',
      cards:[
        ['produto','Publicação de produtos','Selecione o catálogo que aparece na loja e mantenha o controle por filial.','Catálogo'],
        ['varejo','Vitrine pública','Apresente a marca, os produtos e o carrinho em um endereço próprio para compra.','Experiência'],
        ['pedido','Pedidos recebidos','Acompanhe compras recentes e mantenha o canal de origem identificado no núcleo.','Operação'],
        ['evolucao','Páginas de campanha','Crie landing pages para ofertas e ações comerciais conectadas à mesma gestão.','Campanhas']
      ],
      decision:[
        ['Antes de publicar',['Definir filial, mix e disponibilidade','Validar preços, estoque e regras exibidas','Configurar identidade, contatos e endereço da loja']],
        ['Durante a compra',['Escolher a jornada de identificação do cliente','Definir campos, condições e validações do checkout','Confirmar meios de pagamento previstos no escopo']],
        ['Depois do pedido',['Determinar processamento e retorno no ERP','Acompanhar status e ocorrências necessárias','Medir pedidos, vendas e produtos publicados']]
      ],
      note:['Checkout e pagamento dependem da configuração do projeto','PIX, boleto, faturado, confirmação e retorno de status só devem ser considerados disponíveis depois de validar gateway, ERP, regras comerciais e homologação do fluxo.'],
      related:[['pedido-eletronico.html','Pedido Eletrônico','Compare com a jornada B2B em lista.'],['integracoes.html','Integrações','Entenda como catálogo e pedidos se conectam à operação.'],['hub-epiper.html','Hub Epiper','Veja os quatro produtos no mesmo ecossistema.']]
    },
    'inteligencia-vendas.html': {
      context:[['produto','Conteúdo organizado','Campanhas, promoções, materiais, treinamentos e avisos em uma central.'],['clientes','Público definido','Publicações podem considerar segmentação e vigência.'],['status','Leitura acompanhada','Indicadores mostram visualizações e confirmações no App Comercial.']],
      kicker:'Comunicação comercial na prática',
      title:'A equipe recebe conteúdo útil em um canal criado para a rotina de vendas.',
      intro:'A área administrativa dá controle à empresa e o App Comercial entrega uma experiência direta ao vendedor. Isso reduz a dependência de grupos e mensagens que se perdem ao longo do dia.',
      cards:[
        ['produto','Publicações por tipo','Separe comunicados, campanhas, promoções, treinamentos e materiais.','Organização'],
        ['clientes','Vendedores e públicos','Controle usuários do aplicativo e direcione o que faz sentido para cada grupo.','Segmentação'],
        ['status','Visualizações e confirmações','Acompanhe leitura para identificar conteúdos que ainda precisam de reforço.','Acompanhamento'],
        ['varejo','App Comercial','Ofereça ao vendedor uma central simples para consultar e favoritar conteúdos.','Adoção']
      ],
      decision:[
        ['Conteúdo',['Quem pode publicar e revisar','Quais tipos precisam de validade','Quais materiais devem ficar disponíveis por mais tempo']],
        ['Público',['Quais vendedores e filiais recebem cada comunicação','Como o acesso ao App Comercial será liberado','Quando a segmentação precisa ser atualizada']],
        ['Acompanhamento',['Qual leitura precisa de confirmação','Quais indicadores serão acompanhados','Como reforçar conteúdos pouco visualizados']]
      ],
      note:['A ferramenta organiza a comunicação, mas o processo continua importante','Responsáveis, critérios de publicação, segmentação e rotina de acompanhamento precisam ser definidos para o App Comercial manter conteúdo relevante para a equipe.'],
      related:[['televendas.html','Televendas','Leve o conteúdo para perto da venda assistida.'],['ecommerce.html','E-commerce B2B','Conheça o canal de venda digital.'],['hub-epiper.html','Hub Epiper','Veja os quatro produtos compartilhando a mesma base.']]
    },
    'integracoes.html': {
      context:[['erp','WinThor já conectado','O ambiente atual da Epiper opera conectado ao WinThor TOTVS.'],['api','Outros ERPs sob avaliação','SAP, Bling, Omie, Olist e outros cenários exigem análise e desenvolvimento do conector adequado.'],['status','Ida e volta de dados','Além de enviar pedidos, o projeto pode considerar status e retornos quando disponíveis.']],
      kicker:'Integração bem definida',
      title:'A melhor integração é a que respeita o processo e as limitações reais do ERP.',
      intro:'A Epiper já possui operação conectada ao WinThor TOTVS. Para outros ERPs, a análise técnica considera dados disponíveis, autenticação, frequência de atualização, regras do pedido e o conector que precisa ser implementado ou adaptado.',
      cards:[
        ['api','APIs','Preferíveis quando o ERP disponibiliza endpoints adequados, autenticação e regras compatíveis com o fluxo necessário.','Método'],
        ['erp','Banco de dados','Pode ser considerado quando existe acesso controlado, estrutura conhecida e uma estratégia segura de leitura ou integração.','Método'],
        ['automacao','Arquivos e rotinas','Importação, exportação ou processamento por arquivos pode atender cenários específicos e sistemas legados.','Método'],
        ['fluxo','Conectores específicos','WinThor está conectado; os demais ERPs entram após confirmar viabilidade e implementar ou adaptar a ponte necessária.','Situação real']
      ],
      decision:[
        ['Dados normalmente avaliados',['Clientes e cadastro comercial','Produtos, preços, estoque e condições','Pedidos, status, ocorrências e retornos']],
        ['Critérios técnicos',['Disponibilidade e documentação das interfaces','Permissões, autenticação e segurança','Volume, frequência e tolerância a indisponibilidade']],
        ['Critérios operacionais',['Quem mantém cada dado','Quando a informação precisa estar atualizada','Como tratar rejeições, divergências e reprocessamento']]
      ],
      note:['WinThor é a integração operacional atual','A arquitetura aceita outros conectores, mas disponibilidade no site não significa integração pronta. Cada ERP e infraestrutura precisam ser avaliados antes de confirmar prazo, escopo e automações.'],
      related:[['operacao-conectada.html','Operação conectada','Veja como a integração participa do fluxo completo.'],['implantacao-guiada.html','Implantação guiada','Entenda como a análise técnica entra no projeto.'],['fale-com-especialista.html','Avaliar meu ERP','Informe seu sistema e o fluxo atual para iniciar a análise.']]
    },
    'duvidas.html': {
      context:[['hub','Plataforma','Entenda produtos, Hub e evolução por módulos.'],['erp','Integrações','Veja o que muda conforme ERP, API e infraestrutura.'],['implantacao','Implantação','Saiba o que precisa ser analisado antes do go-live.']],
      kicker:'Antes de decidir',
      title:'As perguntas mais importantes são sobre processo, integração e uso real.',
      intro:'Além das dúvidas sobre funcionalidades, vale entender de onde vêm os dados, como o pedido entra no fluxo da empresa e quais usuários precisam participar. Esses pontos definem boa parte do projeto.',
      cards:[
        ['pedido','Produto certo para a jornada','Pedido Eletrônico atende o pedido B2B, Televendas a venda assistida, E-commerce a vitrine digital e Inteligência de Vendas a comunicação com a equipe.','Escolha'],
        ['erp','ERP e compatibilidade','WinThor TOTVS é um cenário de destaque, mas outros ERPs dependem de avaliação das interfaces e permissões disponíveis.','Viabilidade'],
        ['implantacao','Implantação','Mapeamento, configuração, integração, homologação e acompanhamento ajudam a reduzir risco na entrada em produção.','Projeto'],
        ['evolucao','Evolução','É possível começar por uma prioridade e ampliar o ecossistema conforme a operação ganha maturidade.','Crescimento']
      ],
      decision:[
        ['Para uma conversa objetiva',['Qual ERP a empresa utiliza','Quem faz pedidos hoje e por quais canais','Qual é o principal retrabalho ou gargalo']],
        ['Para avaliar integração',['Quais dados precisam chegar aos canais','Como pedidos entram atualmente no ERP','Quais retornos a equipe precisa acompanhar']],
        ['Para definir prioridade',['Qual problema tem maior impacto agora','Quais usuários participariam da primeira fase','Que resultado indicaria que o projeto funcionou']]
      ],
      note:['Nem toda resposta é igual para todas as empresas','Recursos disponíveis, integrações e automações dependem do cenário técnico e comercial. Quando a resposta exige análise do ERP, a Epiper evita prometer compatibilidade automática.'],
      related:[['plataforma.html','Conhecer a Plataforma','Veja o ecossistema completo.'],['integracoes.html','Entender Integrações','Veja os métodos e critérios técnicos.'],['fale-com-especialista.html','Falar com especialista','Leve seu cenário para uma avaliação objetiva.']]
    }
  };

  const cfg = pages[file];
  if (!cfg || document.querySelector('.ip-section[data-ip-generated]')) return;

  document.body.classList.add('internal-premium',`internal-${file.replace('.html','')}`);
  if (!document.querySelector('link[data-internal-premium]')) {
    const link = document.createElement('link');
    link.rel='stylesheet'; link.href='css/internal-premium.css?v=36'; link.dataset.internalPremium='1';
    document.head.appendChild(link);
  }

  const main = document.querySelector('main');
  if (!main) return;
  const card = ([ico,title,text,tag]) => `<article class="ip-card"><span class="ip-card__icon"><img src="${icon(ico)}" alt=""/></span><h3>${title}</h3><p>${text}</p>${tag?`<span class="ip-card__tag">${tag}</span>`:''}</article>`;
  const list = (items) => items.map(item=>`<li>${item}</li>`).join('');

  const hero = main.querySelector(':scope > section');
  if (hero && !document.querySelector('.ip-context')) {
    const context = document.createElement('section');
    context.className='ip-context';
    context.setAttribute('aria-label','Resumo da página');
    context.innerHTML=`<div class="container ip-context__inner">${cfg.context.map(([ico,title,text])=>`<div class="ip-context__item"><span class="ip-context__icon"><img src="${icon(ico)}" alt=""/></span><div><b>${title}</b><span>${text}</span></div></div>`).join('')}</div>`;
    hero.insertAdjacentElement('afterend',context);
  }

  const overview = document.createElement('section');
  overview.className='ip-section'; overview.dataset.ipGenerated='1';
  overview.innerHTML=`<div class="container"><div class="ip-section__head"><span class="ip-kicker">${cfg.kicker}</span><h2>${cfg.title}</h2><p>${cfg.intro}</p></div><div class="ip-overview">${cfg.cards.map(card).join('')}</div></div>`;

  let anchor = document.querySelector('.hub-real-showcase') || document.getElementById('detalhes') || document.getElementById('recursos') || document.getElementById('como-integra') || main.querySelector('.faq-section') || main.children[1] || hero;
  if (anchor) anchor.insertAdjacentElement('afterend',overview); else main.appendChild(overview);
  let last = overview;

  if (cfg.visual) {
    const [src,title,text,points] = cfg.visual;
    const visual = document.createElement('section');
    visual.className='ip-visual';
    visual.innerHTML=`<div class="container"><div class="ip-visual__wrap"><div class="ip-visual__copy"><span class="ip-kicker">Visão explicativa</span><h2>${title}</h2><p>${text}</p><div class="ip-visual__points">${points.map(p=>`<div>${p}</div>`).join('')}</div></div><figure class="ip-visual__media"><img src="${src}" alt="${title}" loading="lazy"/><figcaption class="ip-visual__caption">Representação funcional para facilitar o entendimento do fluxo.</figcaption></figure></div></div>`;
    last.insertAdjacentElement('afterend',visual); last=visual;
  }

  const decision = document.createElement('section');
  decision.className='ip-section ip-section--soft';
  decision.innerHTML=`<div class="container"><div class="ip-section__head"><span class="ip-kicker">Pontos para avaliar</span><h2>O que precisa estar claro para a solução funcionar bem.</h2><p>Funcionalidade, integração e processo precisam caminhar juntos. Estes são os pontos que mais influenciam a qualidade do projeto e a adoção da equipe.</p></div><div class="ip-decision">${cfg.decision.map(([title,items],i)=>`<article class="ip-decision__card"><small>${String(i+1).padStart(2,'0')}</small><h3>${title}</h3><ul>${list(items)}</ul></article>`).join('')}</div><div class="ip-note"><span class="ip-note__icon">i</span><div><b>${cfg.note[0]}</b><p>${cfg.note[1]}</p></div></div></div>`;
  last.insertAdjacentElement('afterend',decision); last=decision;

  const related = document.createElement('section');
  related.className='ip-related';
  related.innerHTML=`<div class="container"><div class="ip-related__head"><div><span class="ip-kicker">Próximo passo</span><h2>Continue pelo ponto que faz mais sentido para sua operação.</h2></div><p>As páginas se complementam, mas cada uma responde a uma decisão diferente: produto, integração, implantação ou evolução.</p></div><div class="ip-related__grid">${cfg.related.map(([href,title,text])=>`<a class="ip-related__card" href="${href}"><b>${title}</b><span>${text}</span><em>Continuar →</em></a>`).join('')}</div></div>`;
  const ctas = [...main.querySelectorAll('.cta,.platform-cta,.faq-cta,.integration-cta')];
  const finalCta = ctas[ctas.length-1];
  if (finalCta && !finalCta.contains(last)) finalCta.insertAdjacentElement('beforebegin',related); else main.appendChild(related);

  // Acabamento dos componentes já existentes sem reescrever o conteúdo original.
  main.querySelectorAll('.platform-card,.feature,.step,.benefit,.sync-card,.erp-brand-card').forEach((el,i)=>{
    el.dataset.ipCard=String(i+1);
  });

  // Pedido e Televendas já ganham uma seção visual dedicada; remove o antigo pseudo-bloco duplicado.
  if (file==='pedido-eletronico.html' || file==='televendas.html') document.body.classList.add('ip-product-detail-ready');

  // Dúvidas: busca simples nas perguntas existentes.
  if (file==='duvidas.html') {
    const firstList = document.querySelector('.faq-list');
    if (firstList && !document.querySelector('.ip-faq-search')) {
      const search = document.createElement('div');
      search.className='ip-faq-search';
      search.innerHTML='<input type="search" aria-label="Buscar nas dúvidas" placeholder="Busque por ERP, integração, pedido, implantação..."/><span aria-hidden="true">⌕</span>';
      firstList.parentElement.insertBefore(search,firstList);
      const input=search.querySelector('input');
      input.addEventListener('input',()=>{
        const q=input.value.trim().toLocaleLowerCase('pt-BR');
        document.querySelectorAll('.faq-list details').forEach(detail=>{
          const match=!q || detail.textContent.toLocaleLowerCase('pt-BR').includes(q);
          detail.style.display=match?'':'none';
        });
      });
    }
  }
})();
