import { describe, expect, it, vi } from 'vitest'
import { MemoryRateLimiter } from '../../server/rateLimit'
import { MESSAGES, handleRegistro, type Deps, type Env } from '../../server/registro'
import { SECRET, loadAppsScript, newEnv } from './fakeAppsScript'

const ORIGIN = 'https://sorteo.example.test'
const APPS_URL = 'https://script.example.test/exec'

const env: Env = {
  REGISTRATION_ENABLED: 'true',
  APPS_SCRIPT_URL: APPS_URL,
  APPS_SCRIPT_SECRET: SECRET,
  TURNSTILE_SECRET_KEY: 'turnstile-secret',
  ALLOWED_ORIGINS: `${ORIGIN}, https://otro.example.test`,
}

const body = {
  nombre: '  Persona   De Prueba ',
  telefono: '+52 55 0000 0099',
  aceptaBases: true,
  aceptaPromociones: false,
  turnstileToken: 'tok',
  empresa: '',
  elapsedMs: 8000,
}

function request(payload: unknown = body, headers: Record<string, string> = {}, method = 'POST') {
  return new Request('https://sorteo.example.test/api/registro', {
    method,
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, 'CF-Connecting-IP': '203.0.113.7', ...headers },
    body: method === 'POST' ? (typeof payload === 'string' ? payload : JSON.stringify(payload)) : undefined,
  })
}

/** Conecta el handler con el Apps Script real (Code.gs) corriendo sobre una hoja falsa. */
function setup(opts: { turnstileOk?: boolean; gasEnv?: ReturnType<typeof newEnv>; upstream?: Deps['fetch'] } = {}) {
  const gasEnv = opts.gasEnv ?? newEnv()
  const gas = loadAppsScript(gasEnv)
  const logs: string[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.includes('turnstile')) {
      return Response.json({ success: opts.turnstileOk ?? true, action: 'registro' })
    }
    if (url === APPS_URL) {
      if (opts.upstream) return opts.upstream(input, init)
      return Response.json(gas.doPost(JSON.parse(init!.body as string)))
    }
    throw new Error('URL inesperada ' + url)
  })
  const deps: Deps = {
    fetch: fetchMock as unknown as typeof fetch,
    now: () => Date.now(),
    memoryLimiter: new MemoryRateLimiter(100, 60_000),
    log: (event, detail) => logs.push(JSON.stringify({ event, ...detail })),
  }
  return { gasEnv, deps, fetchMock, logs }
}

describe('POST /api/registro', () => {
  it('registra y responde 201 solo cuando la fila se guardó', async () => {
    const { gasEnv, deps } = setup()
    const res = await handleRegistro(request(), env, deps)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ status: 'ok' })
    expect(gasEnv.sheets[1].rows[1].slice(1, 7)).toEqual(['Persona De Prueba', '5500000099', 'Sí', 'No', 'Registrado', 'Web'])
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('responde 409 con duplicados (históricos y nuevos)', async () => {
    const { deps } = setup()
    expect((await handleRegistro(request({ ...body, telefono: '5500000001' }), env, deps)).status).toBe(409)
    expect((await handleRegistro(request(), env, deps)).status).toBe(201)
    const dup = await handleRegistro(request({ ...body, nombre: 'Otra Persona Distinta' }), env, deps)
    expect(dup.status).toBe(409)
    expect(await dup.json()).toEqual({ status: 'duplicate' })
  })

  it('envíos simultáneos del mismo número: solo uno se guarda', async () => {
    const { gasEnv, deps } = setup()
    const results = await Promise.all(Array.from({ length: 5 }, () => handleRegistro(request(), env, deps)))
    const codes = results.map((r) => r.status).sort()
    expect(codes).toEqual([201, 409, 409, 409, 409])
    expect(gasEnv.sheets[1].rows).toHaveLength(2)
  })

  it('está cerrado (503) mientras REGISTRATION_ENABLED no sea "true" y no llama a nadie', async () => {
    const { deps, fetchMock } = setup()
    const res = await handleRegistro(request(), { ...env, REGISTRATION_ENABLED: undefined }, deps)
    expect(res.status).toBe(503)
    expect((await res.json()).message).toBe(MESSAGES.disabled)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('está cerrado si falta configuración secreta', async () => {
    const { deps } = setup()
    expect((await handleRegistro(request(), { ...env, APPS_SCRIPT_SECRET: '' }, deps)).status).toBe(503)
  })

  it('rechaza otros métodos, orígenes y tipos de contenido', async () => {
    const { deps } = setup()
    expect((await handleRegistro(request(body, {}, 'GET'), env, deps)).status).toBe(405)
    expect((await handleRegistro(request(body, { Origin: 'https://malicioso.test' }), env, deps)).status).toBe(403)
    const noOrigin = new Request('https://x.test/api/registro', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })
    expect((await handleRegistro(noOrigin, env, deps)).status).toBe(403)
    expect((await handleRegistro(request(body, { 'Content-Type': 'text/plain' }), env, deps)).status).toBe(415)
  })

  it('rechaza JSON inválido, tipos incorrectos y cuerpos enormes', async () => {
    const { deps } = setup()
    expect((await handleRegistro(request('{no json'), env, deps)).status).toBe(400)
    expect((await handleRegistro(request({ ...body, aceptaBases: 'true' }), env, deps)).status).toBe(400)
    expect((await handleRegistro(request([body]), env, deps)).status).toBe(400)
    expect((await handleRegistro(request({ ...body, nombre: 'a'.repeat(5000) }), env, deps)).status).toBe(413)
  })

  it('valida del lado del servidor y devuelve errores por campo', async () => {
    const { deps, fetchMock } = setup()
    const res = await handleRegistro(request({ ...body, telefono: '55-12ab', nombre: 'Juan', aceptaBases: false }), env, deps)
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(Object.keys(json.errors).sort()).toEqual(['aceptaBases', 'nombre', 'telefono'])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('bloquea envíos automatizados: campo trampa, envío demasiado rápido y Turnstile inválido', async () => {
    const { deps, gasEnv } = setup()
    expect((await handleRegistro(request({ ...body, empresa: 'Spam SA' }), env, deps)).status).toBe(400)
    expect((await handleRegistro(request({ ...body, elapsedMs: 300 }), env, deps)).status).toBe(400)
    const t = setup({ turnstileOk: false })
    expect((await handleRegistro(request(), env, t.deps)).status).toBe(403)
    expect(gasEnv.sheets[1].rows).toHaveLength(1)
    expect(t.gasEnv.sheets[1].rows).toHaveLength(1)
  })

  it('limita solicitudes por IP (429)', async () => {
    const { deps } = setup()
    deps.memoryLimiter = new MemoryRateLimiter(2, 60_000)
    const ip = { 'CF-Connecting-IP': '198.51.100.1' }
    await handleRegistro(request({ ...body, telefono: '5500000011' }, ip), env, deps)
    await handleRegistro(request({ ...body, telefono: '5500000012' }, ip), env, deps)
    const res = await handleRegistro(request({ ...body, telefono: '5500000013' }, ip), env, deps)
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('60')
    // otra IP no se ve afectada
    expect((await handleRegistro(request({ ...body, telefono: '5500000014' }, { 'CF-Connecting-IP': '198.51.100.2' }), env, deps)).status).toBe(201)
  })

  it('usa el binding de Rate Limiting de Cloudflare si existe', async () => {
    const { deps } = setup()
    const limit = vi.fn(async () => ({ success: false }))
    const res = await handleRegistro(request(), { ...env, RATE_LIMITER: { limit } }, deps)
    expect(res.status).toBe(429)
    expect(limit).toHaveBeenCalledWith({ key: '203.0.113.7' })
  })

  it('nunca confirma si el Apps Script falla, tarda o responde algo inesperado', async () => {
    for (const upstream of [
      async () => new Response('error', { status: 500 }),
      async () => new Response('<html>login</html>', { status: 200 }),
      async () => Response.json({ ok: true }),
      async () => {
        throw new TypeError('network')
      },
    ]) {
      const { deps } = setup({ upstream })
      const res = await handleRegistro(request(), env, deps)
      expect(res.status).toBe(502)
      expect((await res.json()).message).toBe(MESSAGES.upstream)
    }
  })

  it('traduce "busy" del Apps Script a 503', async () => {
    const { deps } = setup({ gasEnv: newEnv({ lockAvailable: false }) })
    expect((await handleRegistro(request(), env, deps)).status).toBe(503)
  })

  it('no escribe datos personales en los logs ni filtra el secreto en las respuestas', async () => {
    const { deps, logs } = setup()
    const responses = [
      await handleRegistro(request(), env, deps),
      await handleRegistro(request(), env, deps),
      await handleRegistro(request({ ...body, empresa: 'x' }), env, deps),
    ]
    const joined = logs.join('\n')
    expect(joined).not.toMatch(/5500000099|Persona|203\.0\.113\.7/)
    for (const r of responses) expect(await r.text()).not.toContain(SECRET)
  })
})
