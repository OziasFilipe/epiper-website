/*
  Rastreio de visitas da Epiper (próprio, sem cookies e sem terceiros).
  - Respeita "Não rastrear" (DNT) e "Global Privacy Control": se estiver ligado, nada é enviado.
  - Não lê nem envia o que a pessoa digita em formulários. Só envia: página, tempo na página, até onde rolou e onde clicou.
  - Identifica o visitante por um código aleatório guardado neste navegador (localStorage), não por nome, e-mail ou IP.
  - Só funciona nos endereços do próprio site (epiper.com.br).
*/
(function () {
  'use strict'
  var ENDERECO = '/api/coletar'
  var HOSTS = { 'epiper.com.br': 1, 'www.epiper.com.br': 1 }
  if (!HOSTS[location.hostname] && !window.EPIPER_RASTREIO_TESTE) return
  var nav = navigator
  if (nav.doNotTrack === '1' || window.doNotTrack === '1' || nav.globalPrivacyControl === true) return
  try { if (localStorage.getItem('epiper_nao_rastrear') === '1') return } catch (e) { /* sem armazenamento: segue sem lembrar */ }

  var ALFA = 'abcdefghijklmnopqrstuvwxyz0123456789'
  function aleatorio(n) {
    var s = '', b = new Uint8Array(n)
    ;(window.crypto || window.msCrypto).getRandomValues(b)
    for (var i = 0; i < n; i++) s += ALFA[b[i] % 36]
    return s
  }
  function guardado(armazem, chave, tamanho) {
    try {
      var v = window[armazem].getItem(chave)
      if (v && /^[a-z0-9]{10,32}$/.test(v)) return v
      v = aleatorio(tamanho)
      window[armazem].setItem(chave, v)
      return v
    } catch (e) { return aleatorio(tamanho) }
  }

  var visitante = guardado('localStorage', 'epiper_v', 20)
  var sessao = guardado('sessionStorage', 'epiper_s', 20)
  var vista = aleatorio(16)
  var fila = []
  var inicio = Date.now()
  var visivelMs = 0, ultimoVisivel = document.visibilityState === 'visible' ? Date.now() : 0
  var rolagemMax = 0
  var cliques = 0

  var caminho = location.pathname
  var titulo = document.title || ''

  function altura() {
    var d = document.documentElement, b = document.body
    return Math.max(d.scrollHeight, b ? b.scrollHeight : 0, d.offsetHeight)
  }
  function largura() { return Math.max(document.documentElement.scrollWidth, window.innerWidth || 0) }
  function limpo(t, max) { return String(t || '').replace(/\s+/g, ' ').trim().slice(0, max) }

  function medirRolagem() {
    var h = altura()
    if (!h) return
    var pct = Math.round(((window.pageYOffset || 0) + (window.innerHeight || 0)) / h * 100)
    if (pct > rolagemMax) rolagemMax = Math.min(pct, 100)
  }

  function tempoVisivel() {
    var t = visivelMs + (ultimoVisivel ? Date.now() - ultimoVisivel : 0)
    return Math.min(Math.round(t / 1000), 14400)
  }

  function enviar(usarBeacon) {
    if (!fila.length) return
    var corpo = JSON.stringify({ v: visitante, s: sessao, e: fila.splice(0, 25) })
    try {
      if (usarBeacon && nav.sendBeacon) { nav.sendBeacon(ENDERECO, new Blob([corpo], { type: 'text/plain;charset=UTF-8' })); return }
      fetch(ENDERECO, { method: 'POST', body: corpo, headers: { 'content-type': 'text/plain;charset=UTF-8' }, keepalive: true, credentials: 'omit' }).catch(function () {})
    } catch (e) { /* o site nunca pode quebrar por causa do rastreio */ }
  }

  function batimento() {
    medirRolagem()
    fila.push({ k: 'hb', id: vista, t: tempoVisivel(), d: rolagemMax, H: altura() })
  }

  // ---- zona: a "área" da página onde o clique aconteceu (seção, cabeçalho, rodapé...) e um rótulo legível
  function zonaDe(el) {
    var sec = el.closest('[data-zona], section[id], section[class], header, footer, nav, main > div')
    if (!sec) return null
    var chave = sec.getAttribute('data-zona') || sec.id || (sec.classList && sec.classList[0]) || sec.tagName.toLowerCase()
    chave = limpo(chave, 40).toLowerCase().replace(/[^a-z0-9_\-]/g, '-')
    var h = sec.querySelector('h1, h2, h3')
    return { chave: chave, rotulo: limpo(sec.getAttribute('data-zona') ? '' : (h ? h.textContent : ''), 60) || chave, el: sec }
  }
  var zonasVistas = {}
  function anunciarZona(z) {
    if (!z || zonasVistas[z.chave]) return
    zonasVistas[z.chave] = 1
    fila.push({ k: 'zn', p: caminho, z: z.chave, r: z.rotulo })
  }

  document.addEventListener('click', function (ev) {
    if (cliques >= 40 || !ev.target || !ev.target.closest) return
    cliques++
    var a = ev.target.closest('a, button, [role=button]')
    var z = zonaDe(ev.target)
    anunciarZona(z)
    var destino = ''
    if (a && a.tagName === 'A' && a.getAttribute('href')) {
      try { var u = new URL(a.href, location.href); destino = u.hostname === location.hostname ? u.pathname : u.hostname } catch (e) { destino = '' }
    }
    var h = altura()
    fila.push({
      k: 'cl', id: vista, p: caminho,
      x: Math.round(Math.min(Math.max(ev.pageX / largura(), 0), 1) * 1000) / 1000, y: Math.round(ev.pageY),
      yr: Math.round(Math.min(Math.max(ev.pageY / h, 0), 1) * 1000) / 1000,
      z: z ? z.chave : '', a: a ? limpo(a.getAttribute('aria-label') || a.textContent, 60) : '', d: destino,
    })
    if (a && destino) { batimento(); enviar(true) } // link: envia agora, a página pode sair
  }, true)

  window.addEventListener('scroll', medirRolagem, { passive: true })

  var origem = ''
  try { if (document.referrer) origem = document.referrer } catch (e) { /* ignora */ }
  var params = new URLSearchParams(location.search)
  fila.push({
    k: 'pv', id: vista, p: caminho, t: limpo(titulo, 120), r: origem, w: largura(), h: window.innerHeight || 0, i: nav.language || '',
    u: { s: params.get('utm_source') || '', m: params.get('utm_medium') || '', c: params.get('utm_campaign') || '' },
  })
  // anuncia as zonas principais para o painel mostrar nomes legíveis mesmo sem clique
  document.querySelectorAll('main > section, main > div').forEach(function (s) { anunciarZona(zonaDe(s)) })
  setTimeout(function () { medirRolagem(); batimento(); enviar(false) }, 1500)
  setInterval(function () { if (document.visibilityState === 'visible') { batimento(); enviar(false) } }, 10000)

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      if (ultimoVisivel) { visivelMs += Date.now() - ultimoVisivel; ultimoVisivel = 0 }
      batimento(); enviar(true)
    } else if (!ultimoVisivel) { ultimoVisivel = Date.now() }
  })
  window.addEventListener('pagehide', function () { batimento(); enviar(true) })
})()
