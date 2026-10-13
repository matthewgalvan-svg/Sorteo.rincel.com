import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/config', () => ({ IS_DEMO: false, API_ENDPOINT: '/api/registro' }))
const { submitRegistration, NETWORK_ERROR_MESSAGE } = await import('../../src/lib/register')

const input = { nombre: '  Ana   López ', telefono: '55 1234 5678', aceptaBases: true, aceptaPromociones: true }
const extras = { turnstileToken: 'tok', honeypot: '', elapsedMs: 5000 }
const reply = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))

describe('submitRegistration (modo live)', () => {
  it('envía datos normalizados y confirma solo con 201 + ok', async () => {
    const f = reply(201, { status: 'ok' })
    expect(await submitRegistration(input, extras, f)).toEqual({ status: 'ok' })
    const [, init] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({
      nombre: 'Ana López',
      telefono: '5512345678',
      aceptaBases: true,
      aceptaPromociones: true,
      turnstileToken: 'tok',
      empresa: '',
      elapsedMs: 5000,
    })
  })
  it('no confirma si el servidor responde 200 sin status ok', async () => {
    expect((await submitRegistration(input, extras, reply(200, {}))).status).toBe('error')
  })
  it('no confirma si el cuerpo dice ok pero el código no es 201', async () => {
    expect((await submitRegistration(input, extras, reply(502, { status: 'ok' }))).status).toBe('error')
  })
  it('reconoce duplicados', async () => {
    expect(await submitRegistration(input, extras, reply(409, { status: 'duplicate' }))).toEqual({ status: 'duplicate' })
  })
  it('muestra el mensaje del servidor en errores', async () => {
    expect(await submitRegistration(input, extras, reply(429, { status: 'error', message: 'Espera' }))).toEqual({
      status: 'error',
      message: 'Espera',
    })
  })
  it('devuelve errores por campo', async () => {
    const r = await submitRegistration(input, extras, reply(422, { status: 'invalid', message: 'x', errors: { telefono: 'mal' } }))
    expect(r).toEqual({ status: 'invalid', message: 'x', errors: { telefono: 'mal' } })
  })
  it('maneja error de conexión', async () => {
    const f = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    expect(await submitRegistration(input, extras, f)).toEqual({ status: 'error', message: NETWORK_ERROR_MESSAGE })
  })
  it('maneja respuestas que no son JSON', async () => {
    const f = vi.fn(async () => new Response('<html>502</html>', { status: 502 }))
    expect((await submitRegistration(input, extras, f)).status).toBe('error')
  })
})
