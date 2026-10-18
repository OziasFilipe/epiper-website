#!/usr/bin/env python3
"""Controle de SEO do site Epiper.

  python seo/seo.py aplicar     reescreve o <head> de todas as páginas (título, descrição, palavras-chave, canonical,
                                Open Graph, Twitter, dados estruturados), a faixa "Assuntos relacionados", o sitemap.xml,
                                o robots.txt e o llms.txt, tudo a partir de seo/seo.config.json
  python seo/seo.py verificar   mostra o que ainda precisa de atenção (tamanhos, palavra-chave, h1, imagens, links)

Pode rodar quantas vezes quiser: o resultado é sempre o mesmo (idempotente).
"""
import json, os, re, subprocess, sys, unicodedata
from datetime import date

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CFG = json.load(open(os.path.join(RAIZ, "seo", "seo.config.json"), encoding="utf-8"))
SITE = CFG["site"]
URL = SITE["url"].rstrip("/")
INI, FIM = "<!-- SEO:INICIO (gerado por seo/seo.py; edite seo/seo.config.json) -->", "<!-- SEO:FIM -->"
LINK_INI, LINK_FIM = "<!-- SEO-LINKS:INICIO -->", "<!-- SEO-LINKS:FIM -->"


def ler(p):
    with open(os.path.join(RAIZ, p), encoding="utf-8", newline="") as f:
        return f.read()


def gravar(p, s):
    with open(os.path.join(RAIZ, p), "w", encoding="utf-8", newline="") as f:
        f.write(s)


def esc(s):
    return s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")


def sem_acento(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")


def canonica(arq):
    return URL + "/" if arq == "index.html" else f"{URL}/{arq}"


def absoluta(caminho):
    return caminho if caminho.startswith("http") else f"{URL}/{caminho.lstrip('/')}"


def faq_do_html(html):
    """Perguntas e respostas visíveis na página (FAQPage precisa refletir o que o visitante vê)."""
    itens = []
    for m in re.finditer(r"<details[^>]*>\s*<summary>(.*?)</summary>(.*?)</details>", html, re.S):
        p = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m.group(1))).strip()
        r = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m.group(2))).strip()
        if p and r:
            itens.append({"@type": "Question", "name": p, "acceptedAnswer": {"@type": "Answer", "text": r}})
    return itens


def grafo(arq, pg, html):
    canon = canonica(arq)
    org_id, site_id = f"{URL}/#organization", f"{URL}/#website"
    og = absoluta(pg.get("og_imagem", SITE["og_padrao"]))
    org = {
        "@type": "Organization", "@id": org_id, "name": SITE["nome_legal"], "alternateName": SITE["nome"], "url": f"{URL}/",
        "logo": {"@type": "ImageObject", "url": absoluta(SITE["logo"])}, "email": SITE["email"], "telephone": SITE["telefone"],
        "description": SITE["descricao_curta"], "knowsAbout": SITE["assuntos"],
        "contactPoint": [{"@type": "ContactPoint", "contactType": "sales", "email": SITE["email"], "telephone": SITE["telefone"], "areaServed": "BR", "availableLanguage": SITE["idioma"]}],
    }
    nos = [org]
    if arq == "index.html":
        nos.append({"@type": "WebSite", "@id": site_id, "url": f"{URL}/", "name": SITE["nome"], "inLanguage": SITE["idioma"], "publisher": {"@id": org_id}})
    tipo_pagina = {"contato": "ContactPage", "faq": "FAQPage"}.get(pg["tipo"], "WebPage")
    pagina = {
        "@type": tipo_pagina, "@id": canon + "#pagina", "url": canon, "name": pg["titulo"], "description": pg["descricao"],
        "inLanguage": SITE["idioma"], "isPartOf": {"@id": site_id}, "publisher": {"@id": org_id},
        "primaryImageOfPage": {"@type": "ImageObject", "url": og}, "keywords": ", ".join(pg["palavras_chave"]),
    }
    if arq != "index.html":
        pagina["breadcrumb"] = {"@id": canon + "#trilha"}
        nos.append({"@type": "BreadcrumbList", "@id": canon + "#trilha", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Início", "item": f"{URL}/"},
            {"@type": "ListItem", "position": 2, "name": pg.get("breadcrumb", pg["titulo"]), "item": canon}]})
    if pg["tipo"] == "software":
        sw = pg["software"]
        nos.append({"@type": "SoftwareApplication", "@id": canon + "#software", "name": sw["nome"], "applicationCategory": sw["categoria"],
                    "operatingSystem": sw["so"], "description": pg["descricao"], "url": canon, "image": og, "inLanguage": SITE["idioma"],
                    "publisher": {"@id": org_id}, "featureList": sw["recursos"]})
        pagina["about"] = {"@id": canon + "#software"}
    if pg["tipo"] == "faq":
        faq = faq_do_html(html)
        if faq:
            pagina["mainEntity"] = faq
    nos.append(pagina)
    return {"@context": "https://schema.org", "@graph": nos}


def bloco_head(arq, pg, html):
    canon = canonica(arq)
    og = absoluta(pg.get("og_imagem", SITE["og_padrao"]))
    t, d = esc(pg["titulo"]), esc(pg["descricao"])
    og_alt = esc(pg.get("og_alt", f"{pg.get('breadcrumb', SITE['nome'])}: {pg['titulo']}"))
    robots = "noindex,follow" if pg.get("noindex") else "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
    L = [INI, f"<title>{t}</title>", f'<meta name="description" content="{d}"/>']
    L.append(f'<meta name="keywords" content="{esc(", ".join(pg["palavras_chave"]))}"/>')
    L.append(f'<meta name="author" content="{esc(SITE["nome_legal"])}"/>')
    L.append(f'<meta name="robots" content="{robots}"/>')
    if not pg.get("noindex"):
        L.append(f'<link rel="canonical" href="{canon}"/>')
        L.append(f'<link rel="alternate" hreflang="{SITE["idioma"]}" href="{canon}"/><link rel="alternate" hreflang="x-default" href="{canon}"/>')
    L.append(f'<meta property="og:site_name" content="{esc(SITE["nome"])}"/><meta property="og:locale" content="{SITE["locale_og"]}"/><meta property="og:type" content="website"/>')
    L.append(f'<meta property="og:title" content="{t}"/><meta property="og:description" content="{d}"/><meta property="og:url" content="{canon}"/>')
    L.append(f'<meta property="og:image" content="{og}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="{og_alt}"/>')
    L.append(f'<meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="{t}"/><meta name="twitter:description" content="{d}"/><meta name="twitter:image" content="{og}"/><meta name="twitter:image:alt" content="{og_alt}"/>')
    if pg.get("preload_imagem"):
        L.append(f'<link rel="preload" as="image" href="{pg["preload_imagem"]}" fetchpriority="high"/>')
    if not pg.get("noindex"):
        L.append('<script type="application/ld+json">' + json.dumps(grafo(arq, pg, html), ensure_ascii=False, separators=(",", ":")) + "</script>")
        L.append('<script src="js/rastreio.js" defer></script>')  # medição de visitas própria, sem cookies (ver privacidade.html)
    L.append(FIM)
    return "\n".join(L)


def limpar_head(head):
    head = re.sub(re.escape(INI) + r".*?" + re.escape(FIM) + r"\s*", "", head, flags=re.S)
    head = re.sub(r"<title>.*?</title>\s*", "", head, flags=re.S)
    head = re.sub(r'<meta[^>]+name="(?:description|robots|keywords|author|twitter:[^"]*)"[^>]*>\s*', "", head)
    head = re.sub(r'<meta[^>]+property="og:[^"]*"[^>]*>\s*', "", head)
    head = re.sub(r'<link[^>]+rel="canonical"[^>]*>\s*', "", head)
    head = re.sub(r'<link[^>]+rel="alternate"[^>]+hreflang[^>]*>\s*', "", head)
    head = re.sub(r'<link[^>]+rel="preload"[^>]+as="image"[^>]*>\s*', "", head)
    head = re.sub(r'<script type="application/ld\+json">.*?</script>\s*', "", head, flags=re.S)
    return head


def faixa_relacionadas(arq, pg):
    resumo = ""
    if pg.get("texto"):
        resumo = f'<section class="seo-resumo"><div class="container"><h2>{esc(pg["texto"][0])}</h2><p>{esc(pg["texto"][1])}</p></div></section>'
    nav = ""
    if not pg.get("sem_relacionadas") and pg.get("relacionadas"):
        itens = "".join(f'<li><a href="{a}">{esc(CFG["ancoras"][a])}</a></li>' for a in pg["relacionadas"] if a != arq)
        nav = (f'<nav class="seo-links" aria-label="Assuntos relacionados"><div class="container"><p class="seo-links__titulo">Assuntos relacionados</p>'
               f'<ul class="seo-links__lista">{itens}</ul></div></nav>')
    return f"{LINK_INI}{resumo}{nav}{LINK_FIM}" if (resumo or nav) else ""


def aplicar():
    for arq, pg in CFG["paginas"].items():
        html = ler(arq)
        m = re.search(r"<head>(.*?)</head>", html, re.S)
        head = limpar_head(m.group(1))
        v = re.search(r'<meta[^>]*name="viewport"[^>]*/?>', head)
        if not v:
            print("SEM VIEWPORT:", arq); sys.exit(1)
        head = head[:v.end()] + "\n" + bloco_head(arq, pg, html) + head[v.end():]
        html = html[:m.start(1)] + head + html[m.end(1):]
        if pg.get("h1"):
            html, n = re.subn(r"(<h1[^>]*>).*?(</h1>)", lambda mm: mm.group(1) + pg["h1"] + mm.group(2), html, count=1, flags=re.S)
            if n != 1:
                print("SEM H1:", arq); sys.exit(1)
        html = re.sub(re.escape(LINK_INI) + r".*?" + re.escape(LINK_FIM) + r"\s*", "", html, flags=re.S)
        faixa = faixa_relacionadas(arq, pg)
        if faixa:
            i = html.rfind("</main>")
            if i < 0:
                print("SEM </main>:", arq); sys.exit(1)
            html = html[:i] + faixa + "\n" + html[i:]
        gravar(arq, html)
        print("ok ", arq)
    sitemap(); robots(); llms()


def data_arquivo(arq):
    try:
        r = subprocess.run(["git", "log", "-1", "--format=%cs", "--", arq], cwd=RAIZ, capture_output=True, text=True, timeout=20)
        if r.stdout.strip():
            return r.stdout.strip()
    except Exception:
        pass
    return date.fromtimestamp(os.path.getmtime(os.path.join(RAIZ, arq))).isoformat()


def sitemap():
    L = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for arq, pg in sorted(CFG["paginas"].items(), key=lambda kv: -float(kv[1].get("prioridade", "0"))):
        if pg.get("noindex"):
            continue
        L.append(f'  <url><loc>{canonica(arq)}</loc><lastmod>{data_arquivo(arq)}</lastmod><changefreq>{pg.get("frequencia", "monthly")}</changefreq><priority>{pg.get("prioridade", "0.5")}</priority></url>')
    L.append("</urlset>")
    gravar("sitemap.xml", "\n".join(L) + "\n")
    print("ok  sitemap.xml")


def robots():
    gravar("robots.txt", f"User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /seo/\nDisallow: /404.html\n\nSitemap: {URL}/sitemap.xml\n")
    print("ok  robots.txt")


def llms():
    P = CFG["paginas"]
    def linha(a): return f"- [{CFG['ancoras'][a]}]({canonica(a)}): {P[a]['descricao']}"
    txt = [f"# {SITE['nome']}", "", f"> {SITE['descricao_curta']}", "",
           "A Epiper atende distribuidoras e atacadistas que já têm ERP (foco em TOTVS WinThor). Não substitui o ERP: conecta canais de venda a ele.", "",
           "## Produtos", linha("pedido-eletronico.html"), linha("televendas.html"), linha("hub-epiper.html"), "",
           "## Integração e implantação", linha("integracoes.html"), linha("operacao-conectada.html"), linha("implantacao-guiada.html"), linha("evolucao-modulos.html"), "",
           "## Visão geral e contato", linha("plataforma.html"), linha("duvidas.html"), linha("fale-com-especialista.html"), "",
           f"Contato: {SITE['email']} · {SITE['telefone']}", ""]
    gravar("llms.txt", "\n".join(txt))
    print("ok  llms.txt")


# ----------------------------------------------------------------------------- verificação
def verificar():
    problemas, avisos = 0, 0
    titulos, descricoes = {}, {}
    print(f"{'página':28} {'título':>6} {'desc':>5}  principal(título/desc/h1/corpo)  h1  img s/alt  links?  palavras-chave ausentes no corpo")
    for arq, pg in CFG["paginas"].items():
        html = ler(arq)
        m = re.search(r"<title>(.*?)</title>", html, re.S)
        titulo = re.sub(r"\s+", " ", m.group(1)).strip() if m else ""
        md = re.search(r'<meta name="description" content="([^"]*)"', html)
        desc = md.group(1) if md else ""
        main = re.search(r"<main.*?</main>", html, re.S)
        corpo_html = main.group(0) if main else html
        corpo = sem_acento(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", re.sub(r"<(script|style).*?</\1>", "", corpo_html, flags=re.S))))
        h1s = re.findall(r"<h1[^>]*>(.*?)</h1>", html, re.S)
        h1 = sem_acento(re.sub(r"<[^>]+>", " ", h1s[0])) if h1s else ""
        pk = sem_acento(pg["principal"])
        in_t, in_d, in_h = pk in sem_acento(titulo), pk in sem_acento(desc), pk in h1
        n_corpo = corpo.count(pk)
        sem_alt = len([i for i in re.findall(r"<img\b[^>]*>", html) if 'alt=' not in i])
        quebrados = []
        for href in set(re.findall(r'href="([^"#:?]+\.html)(?:#[^"]*)?"', html)):
            if not os.path.exists(os.path.join(RAIZ, href)):
                quebrados.append(href)
        ausentes = [k for k in pg["palavras_chave"] if sem_acento(k) not in corpo and sem_acento(k) not in sem_acento(titulo + " " + desc) and k != "Epiper"]
        flags = []
        if len(titulo) > 60: flags.append("título>60"); problemas += 1
        if not 110 <= len(desc) <= 160: flags.append("desc fora de 110-160"); avisos += 1
        if len(h1s) != 1: flags.append(f"h1={len(h1s)}"); problemas += 1
        if sem_alt: flags.append("img sem alt"); problemas += 1
        if quebrados: flags.append("links quebrados " + ",".join(quebrados)); problemas += 1
        if not pg.get("noindex") and not (in_t and in_d): flags.append("principal fora do título/descrição"); avisos += 1
        if titulo in titulos: flags.append("título repetido com " + titulos[titulo]); problemas += 1
        if desc in descricoes: flags.append("descrição repetida com " + descricoes[desc]); problemas += 1
        titulos[titulo] = arq; descricoes[desc] = arq
        for ld in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
            try: json.loads(ld)
            except Exception: flags.append("JSON-LD inválido"); problemas += 1
        og = pg.get("og_imagem", SITE["og_padrao"])
        if not os.path.exists(os.path.join(RAIZ, og)): flags.append("imagem social não existe"); problemas += 1
        marca = lambda b: "sim" if b else "NÃO"
        print(f"{arq:28} {len(titulo):>6} {len(desc):>5}  {marca(in_t):>3}/{marca(in_d):>3}/{marca(in_h):>3}/{n_corpo:>2}x             {len(h1s):>2}  {sem_alt:>9}  {'ok' if not quebrados else 'X':>6}  {', '.join(ausentes) if ausentes else '-'}" + (f"   <-- {'; '.join(flags)}" if flags else ""))
    print(f"\nProblemas: {problemas} · Avisos: {avisos}")
    for f in ("sitemap.xml", "robots.txt", "llms.txt"):
        print(f, "ok" if os.path.exists(os.path.join(RAIZ, f)) else "FALTA")
    return problemas


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "ajuda"
    if cmd == "aplicar": aplicar()
    elif cmd == "verificar": sys.exit(1 if verificar() else 0)
    else: print(__doc__)
