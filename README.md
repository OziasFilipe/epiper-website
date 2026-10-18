# Site da Epiper (epiper.com.br)

Site institucional estático (HTML/CSS/JS) hospedado no **Netlify**, mais três **funções do Netlify** que coletam as visitas e os contatos do formulário num banco **SQLite hospedado (Turso)**. O **Epiper Hub** (outro sistema, em outra hospedagem) consulta esses dados no menu **SEO Site**, só para o usuário master.

```
visitante ──► epiper.com.br (Netlify)  ──► /api/coletar, /api/contato ──► Turso (SQLite)
                                                    ▲
Epiper Hub (outra hospedagem) ──── leitura assinada ┘   /api/hub/*   (o site NUNCA chama o Hub)
```

## Páginas
`index`, `plataforma`, `hub-epiper`, `televendas`, `pedido-eletronico`, `integracoes`, `operacao-conectada`, `implantacao-guiada`, `evolucao-modulos`, `duvidas`, `fale-com-especialista`, `privacidade`, `termos`, `404`.

## SEO (título, descrição, palavras-chave, dados estruturados)
Tudo é controlado em **um arquivo só**: `seo/seo.config.json`.

```bash
python seo/seo.py aplicar      # reescreve o <head> de todas as páginas, sitemap.xml, robots.txt e llms.txt
python seo/seo.py verificar    # relatório: tamanho do título/descrição, palavra-chave, h1, imagens sem alt, links quebrados
```
Para mudar o texto que aparece no Google, edite título/descrição/palavras-chave da página no JSON e rode `aplicar`. Limites: título até 60 caracteres, descrição de 110 a 160.

## Medição de visitas e contatos: como funciona e como é protegido
| Peça | O que faz | Proteção |
|---|---|---|
| `js/rastreio.js` | Envia página, tempo, rolagem e cliques (nunca o que a pessoa digita) | Sem cookies; respeita "Não rastrear" e "Global Privacy Control"; só roda em epiper.com.br |
| `POST /api/coletar` | Grava a medição | Só do nosso site (Origin), ignora robôs, corpo máximo de 6 KB, só páginas do site, limite por IP (hash), tempo e cliques com teto, IP nunca guardado |
| `POST /api/contato` | Recebe o formulário | Consentimento obrigatório, campo-isca e tempo mínimo contra robôs, 5 por hora por IP, **dados pessoais criptografados (AES-256-GCM)** antes de ir ao banco |
| `GET /api/hub/*` | O Hub lê os dados | **Assinatura HMAC-SHA256** com chave de 256 bits, janela de 60 s, código de uso único (anti-repetição), bloqueio após 10 erros, comparação em tempo constante, lista de IPs opcional; respostas de erro todas iguais |
| Banco | SQLite (Turso/libSQL) | Acesso só com token (a "senha" do banco), cifrado em repouso pelo Turso. O SQLite sozinho não tem senha; por isso o token + a criptografia dos campos |
| `_headers` | Cabeçalhos | CSP estrita (`script-src 'self'`), HSTS, sem iframe, sem sniffing |

Privacidade (LGPD): o visitante é um código aleatório do navegador; o IP vira um hash que muda todo dia; dados de medição são apagados após 400 dias; a Política de Privacidade (`privacidade.html`) descreve isso. **Peça revisão jurídica do texto antes de divulgar.**

## Colocar no ar (uma vez)
1. **Turso** (https://turso.tech, o plano gratuito serve): crie um banco, por exemplo `epiper-site`.
   ```bash
   turso db create epiper-site
   turso db show epiper-site --url        # → EPIPER_BANCO_URL  (começa com libsql://)
   turso db tokens create epiper-site     # → EPIPER_BANCO_TOKEN
   ```
2. **Netlify** → Site configuration → Environment variables. Crie (veja `.env.example`):
   `EPIPER_BANCO_URL`, `EPIPER_BANCO_TOKEN`, `EPIPER_CHAVE_CAMPOS`, `EPIPER_SEGREDO_IP` e, no passo 4, `EPIPER_HUB_SEGREDO`.
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"   # EPIPER_CHAVE_CAMPOS
   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"      # EPIPER_SEGREDO_IP
   ```
   **Guarde a `EPIPER_CHAVE_CAMPOS` num cofre de senhas:** sem ela, os contatos já gravados não podem mais ser lidos.
3. Faça o deploy (push no GitHub). O Netlify instala `@libsql/client` e publica as funções; as tabelas são criadas sozinhas na primeira chamada.
4. **No Hub** (master → SEO Site → Conexão): salve o endereço `https://epiper.com.br`, clique em **Gerar chave**, copie a chave (aparece uma vez) para `EPIPER_HUB_SEGREDO` no Netlify, refaça o deploy e clique em **Testar conexão**.
5. (Recomendado) Coloque em `EPIPER_HUB_IPS` o IP do servidor do Hub: só ele passa a conseguir ler.

### Trocar a chave do Hub sem parar
No Hub gere a chave nova → no Netlify coloque a antiga em `EPIPER_HUB_SEGREDO_ANTERIOR` e a nova em `EPIPER_HUB_SEGREDO` → deploy → teste → apague a `…_ANTERIOR`.

## Testes
```bash
npm install
npm test                 # 30 testes: criptografia, assinatura, repetição, bloqueio, robôs, limites, contatos, consultas
npm run dev              # site + funções na sua máquina (http://127.0.0.1:8787), com SQLite em .data/ (nunca vai para produção)
node seo/semear-demo.mjs # (com o dev rodando) popula dados fictícios para ver as telas do Hub
```
Para o Hub local falar com o `npm run dev`: `HUB_SEO_SITE_PERMITIR_LOCAL=true` no `.env` do Hub (só em desenvolvimento) e endereço `http://127.0.0.1:8787`.

## Antes de publicar (checklist)
- Número de WhatsApp e e-mail em `js/main.js`.
- Revisão jurídica de `privacidade.html` e `termos.html`.
- Confirmar que os logos de ERPs podem ser exibidos.
- `python seo/seo.py verificar` sem problemas.
