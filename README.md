# Epiper Site — V17 Produção

Versão refinada para publicação.

## Páginas
- `index.html` — Home
- `pedido-eletronico.html` — Pedido Eletrônico
- `televendas.html` — Televendas
- `integracoes.html` — ERPs e Integrações
- `privacidade.html` — política básica de privacidade
- `termos.html` — termos básicos de uso

## Principais melhorias
- Nova identidade visual Epiper aplicada no header/footer.
- Favicon completo com o ícone roxo da folha digital.
- Home mais curta e objetiva; seções redundantes removidas.
- Headline da Home mais clara: Pedido Eletrônico + Televendas conectados ao ERP.
- Campo de e-mail removido; CTAs simplificados.
- Botão falso **Entrar** removido.
- Hub de recursos com ícones semânticos padronizados.
- Nova área técnica de integração e implantação.
- Imagens secundárias próprias para Pedido Eletrônico e Televendas.
- SEO básico, Open Graph, Twitter Card, canonical, sitemap e robots.
- Manifest e ícones para navegador/celular.
- Política de Privacidade e Termos adicionados como modelos básicos.

## WhatsApp
Abra `js/main.js` e configure:

```js
const EPIPER_WHATSAPP_NUMBER = '55DDDNUMERO';
```

Enquanto o número estiver vazio, os botões usam `contato@epiper.com.br` como fallback.

## Antes de publicar
- Confirmar domínio final (`https://epiper.com.br/`).
- Configurar o número oficial de WhatsApp.
- Revisar Política de Privacidade e Termos com assessoria jurídica.
- Confirmar que nomes/logos de ERPs e parceiros podem ser exibidos publicamente.


## V18 — ícones padronizados
Todos os ícones visuais do site foram padronizados no mesmo estilo: fundo roxo circular e símbolo branco central, inspirados na referência enviada.


## V19 — posicionamento de integrações
O site agora apresenta a Epiper como plataforma de integração flexível para diferentes ERPs. WinThor TOTVS permanece em destaque por ser um cenário de integração trabalhado pela Epiper, sem transmitir dependência exclusiva desse ERP. A compatibilidade com outros sistemas é apresentada como sujeita à análise técnica de APIs, banco, arquivos e conectores disponíveis.


## V20 — Hub de recursos
Os ícones do bloco "Hub de recursos Epiper" foram reduzidos para ficarem mais proporcionais: círculo menor, símbolo menor e espaçamento mais equilibrado.


## V21 — Navbar e footer
- Link “Contato” removido do navbar principal.
- Indicador textual `⌄` substituído por um ícone visual de submenu (+ em bloco roxo claro), que gira ao abrir.
- Footer atualizado para exibir folha roxa e palavra “epiper” em branco.


## V22 — Integrações e Dúvidas
- Navbar: `ERPs` passou a `Integrações`.
- Navbar: `Como funciona` passou a `Dúvidas`.
- Criada a página `duvidas.html` com FAQ sobre negócio, produtos, ERPs, implantação e operação.
- Sitemap atualizado com a nova página.


## V23 — Integrações mais visuais
A página `integracoes.html` ganhou uma seção visual de cenários de ERP, destacando WinThor TOTVS e mostrando de forma intuitiva que a Epiper também pode se adaptar a outros ERPs, APIs, sistemas próprios e legados.


## V24 — ERPs oficiais e header sticky
- Logos de referência foram salvas em `assets/images/erps/`: TOTVS, Linx, Sankhya, Omie, Bling e SAP.
- TOTVS/WinThor é apresentado como integração em destaque. Os demais aparecem como ecossistemas cuja viabilidade deve ser validada tecnicamente.
- O header agora acompanha a rolagem. Depois de alguns pixels, a barra branca se expande e incorpora a logo Epiper em uma única navegação compacta.
- Antes de publicar logos de terceiros em produção, valide as regras de uso de marca de cada fornecedor. A exibição no site não deve sugerir parceria ou certificação quando ela não existir.

### Fontes dos arquivos de marca
- TOTVS: repositório público oficial `totvs/totvstec-doc`.
- Linx: domínio oficial `caixarapido.linx.com.br`.
- Sankhya: arquivo público em `sankhya.com.br`.
- Omie: Sala de Imprensa oficial.
- Bling: domínio oficial `bling.com.br`.
- SAP: SAP Digital Design System / domínio oficial `sap.com`.


## V25 — Redesign da área de dados conectados
A seção “O que pode ser conectado” da página de Integrações foi redesenhada com fundo suave, ramificação visual do ERP para os dados, cards compactos e ícones proporcionais, seguindo o conceito visual aprovado.


## V26 — seções visuais suavizadas
Aplicadas três melhorias visuais inspiradas nas referências aprovadas:
1. Seção de plataforma (Home) mais refinada e suave para Pedido Eletrônico e Televendas.
2. Bloco "Uma camada comercial moderna..." redesenhado com aparência mais natural e menos "AI".
3. Bloco de integração pensada para a operação real com logos nativas de ERP, destacando TOTVS WinThor e exemplos de outros ERPs.

Também foram trocados os ícones genéricos de ERP por logos nativas sempre que um ERP específico é citado.


## V27 — correção de bugs visuais
Corrigidos os cards Pedido Eletrônico/Televendas e o bloco WinThor/Outros ERPs. As áreas agora usam HTML/CSS isolado, sem sobreposição de ícone, e as logos nativas de ERP possuem áreas próprias para não quebrar o texto.


## V28 — Logo branca no footer
O footer de todas as páginas agora utiliza a nova logo Epiper com símbolo roxo e wordmark branco, em `assets/branding/logo-epiper-footer-branca.png`, com fundo transparente. A logo do header não foi alterada.


## V29 — Plataforma Epiper com páginas próprias
O menu **Plataforma** agora aponta para páginas dedicadas:
- `plataforma.html` — visão geral
- `hub-epiper.html`
- `operacao-conectada.html`
- `implantacao-guiada.html`
- `evolucao-modulos.html`

O mega menu foi atualizado em todas as páginas e cada página mantém o mesmo header, footer, identidade visual e CTA da Epiper.


## V30 — cards de ERP refinados
Na Home, a seção de integração pensada para a operação real foi atualizada para 4 cards: WinThor TOTVS, Linx, Bling e Outros ERPs. As logos agora aparecem sem card interno e centralizadas dentro do card principal, seguindo a referência aprovada.

## V31 — correção do menu mobile
O header mobile agora mantém fundo branco sólido quando o usuário rola a página ou deixa o menu aberto. O painel de navegação, itens ativos, botão e hamburger permanecem legíveis sem transparência sobre o conteúdo.


## V32 — acabamento de produção
- WhatsApp comercial configurado: +55 27 99621-7169 (`5527996217169`).
- Menu mobile transformado em accordion com fundo branco persistente.
- Footer reorganizado em Plataforma, Produtos, Empresa e Legal.
- Home com mensagens mais orientadas a benefício e seção "A plataforma em prática" usando telas reais do projeto.
- Botão flutuante de WhatsApp adicionado de forma discreta.
- Organization Schema atualizado com telefone e ContactPoint.
- SoftwareApplication Schema enriquecido com featureList.
- Página Dúvidas recebeu FAQPage Schema.
- Não foram adicionados logos/depoimentos de clientes sem autorização.

### Pendente para publicação
Google Analytics e Search Console exigem IDs/códigos da sua conta e verificação externa do domínio; o projeto está pronto para recebê-los, mas nenhum identificador fictício foi inserido.


## V33 — menu corrigido
- Corrigido conflito dos accordions mobile com o menu desktop.
- Painéis mobile ficam totalmente fora do layout acima de 900px.
- Fundo branco persiste no header e no painel enquanto o menu mobile está aberto ou durante scroll.
- Estados do menu são resetados ao alternar entre mobile e desktop.
- Rolagem da página é bloqueada enquanto o menu mobile está aberto, evitando deslocamentos visuais.


## V34 — Soluções com imagens
Na seção Plataforma Epiper da Home, os cards de Pedido Eletrônico e Televendas foram atualizados para usar imagens reais/previews do sistema no lugar do bloco abstrato, com moldura visual e selo contextual.

## V35 — Conteúdo alinhado ao produto real
- A Home preserva a proposta de Pedido Eletrônico + Televendas, mas passa a apresentar o ecossistema completo.
- E-commerce B2B e Inteligência de Vendas entram no portfólio com recursos confirmados no sistema.
- O Hub agora explica os quatro produtos, o núcleo compartilhado, filiais e permissões por usuário.
- Capturas reais do Hub, Televendas, Pedido Eletrônico e Central de Integrações substituem parte dos mockups genéricos.
- Navegação desktop, menu mobile e footer passam a listar o portfólio completo.
- SEO e FAQ foram atualizados para refletir a solução atual.

## V36 — Todas as páginas alinhadas ao ecossistema
- Criadas páginas próprias para `ecommerce.html` e `inteligencia-vendas.html`, com conteúdo e capturas do produto em funcionamento.
- Home, Hub, evolução modular, menus e rodapés agora direcionam corretamente para os quatro produtos.
- Páginas internas receberam conteúdo mais específico sobre uso, integração, implantação e critérios de decisão.
- Integrações passaram a diferenciar o WinThor, já conectado, dos demais ERPs que ainda dependem de avaliação e implementação.
- Formulário comercial ganhou os quatro produtos, contexto automático de origem e link para a Política de Privacidade.
- Política de Privacidade e Termos ganharam resumo e navegação local para melhorar a leitura.
- Sitemap atualizado com as duas novas páginas de produto.
