import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cifrar, codificar, consultaCanonica, decifrar, hashIp, limitar } from '../netlify/lib/seguranca.mjs'
import { bancoDeTeste, CHAVE_CAMPOS } from './ajuda.mjs'

test('cifra: ida e volta, e nunca deixa o texto à vista', () => {
  const c = cifrar('maria@empresa.com.br', CHAVE_CAMPOS)
  assert.ok(c.startsWith('v1.'))
  assert.ok(!c.includes('maria'))
  assert.equal(decifrar(c, CHAVE_CAMPOS), 'maria@empresa.com.br')
  assert.notEqual(cifrar('x', CHAVE_CAMPOS), cifrar('x', CHAVE_CAMPOS), 'cada cifra usa um IV novo')
})

test('cifra: chave errada e valor adulterado falham', () => {
  const c = cifrar('segredo', CHAVE_CAMPOS)
  assert.throws(() => decifrar(c, Buffer.alloc(32, 7).toString('base64')))
  const [v, iv, tag, ct] = c.split('.')
  assert.throws(() => decifrar([v, iv, tag, Buffer.from('adulterado').toString('base64url')].join('.'), CHAVE_CAMPOS))
  assert.throws(() => cifrar('x', 'curta'), /32 bytes/)
})

test('hash de IP: estável no dia, diferente em outro dia e nunca contém o IP', () => {
  const a = hashIp('203.0.113.9', 'sal', new Date('2026-10-17T10:00:00Z'))
  assert.equal(a, hashIp('203.0.113.9', 'sal', new Date('2026-10-17T23:00:00Z')))
  assert.notEqual(a, hashIp('203.0.113.9', 'sal', new Date('2026-10-18T10:00:00Z')))
  assert.notEqual(a, hashIp('203.0.113.10', 'sal', new Date('2026-10-17T10:00:00Z')))
  assert.ok(!a.includes('203'))
})

test('codificação da consulta é RFC 3986 (igual ao rawurlencode do PHP)', () => {
  assert.equal(codificar("a b!'()*/ç"), 'a%20b%21%27%28%29%2A%2F%C3%A7')
  assert.equal(consultaCanonica(new URLSearchParams('z=1&a=2&m=x y')), 'a=2&m=x%20y&z=1')
})

test('limite: conta dentro da janela e libera depois dela', async () => {
  const banco = await bancoDeTeste()
  try {
    for (let i = 0; i < 3; i++) assert.equal(await limitar(banco, 'k', 3, 60, 1_000_000), true)
    assert.equal(await limitar(banco, 'k', 3, 60, 1_000_500), false)
    assert.equal(await limitar(banco, 'k', 3, 60, 1_000_000 + 61_000), true, 'nova janela')
    assert.equal(await limitar(banco, 'outra', 3, 60, 1_000_000), true, 'chaves independentes')
  } finally { banco.limpar() }
})
