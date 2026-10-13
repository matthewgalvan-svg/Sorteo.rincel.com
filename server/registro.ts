import {
  normalizeName,
  normalizePhone,
  validateRegistration,
  type FieldErrors,
} from '../src/lib/validation'
import { MemoryRateLimiter, type RateLimitBinding } from './rateLimit'

export interface Env {
  /** "true" para aceptar registros reales. Cualquier otro valor mantiene el registro cerrado. */
  REGISTRATION_ENABLED?: string
  /** URL de despliegue del Apps Script (secreto de Cloudflare; nunca llega al navegador). */
  APPS_SCRIPT_URL?: string
  /** Secreto compartido con el Apps Script (secreto de Cloudflare). */
  APPS_SCRIPT_SECRET?: string
  /** Clave secreta de Cloudflare Turnstile. */
  TURNSTILE_SECRET_KEY?: string
  /** Orígenes permitidos separados por coma, p. ej. "https://sorteo-rincel.pages.dev,https://sorteo.rincel.com.mx". */
  ALLOWED_ORIGINS?: string
  /** Binding opcional de Rate Limiting de Cloudflare. */
  RATE_LIMITER?: RateLimitBinding
}

export interface Deps {
  fetch: typeof fetch
  now: () => number
  memoryLimiter: MemoryRateLimiter
  log: (event: string, detail?: Record<string, unknown>) => void
}

export const MIN_FILL_MS = 2500
const MAX_BODY_BYTES = 4 * 1024
const UPSTREAM_TIMEOUT_MS = 15000

// 5 intentos por minuto por IP (respaldo en memoria)
export const defaultMemoryLimiter = new MemoryRateLimiter(5, 60_000)

export const MESSAGES = {
  disabled: 'El registro todavía no está disponible. Mantente pendiente de nuestros canales oficiales.',
  invalid: 'Revisa los datos marcados e inténtalo de nuevo.',
  bot: 'No pudimos verificar que eres una persona. Recarga la página e inténtalo de nuevo.',
  rateLimited: 'Recibimos demasiados intentos desde tu conexión. Espera un minuto e inténtalo de nuevo.',
  busy: 'Estamos recibiendo muchos registros en este momento. Espera unos segundos e inténtalo de nuevo.',
  upstream: 'No pudimos guardar tu registro en este momento. Inténtalo de nuevo en unos minutos.',
  badRequest: 'La solicitud no es válida. Recarga la página e inténtalo de nuevo.',
} as const

type Body =
  | { status: 'ok' }
  | { status: 'duplicate' }
  | { status: 'invalid'; message: string; errors: FieldErrors }
  | { status: 'error'; message: string }

function json(body: Body, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  })
}

const error = (message: string, status: number, headers?: Record<string, string>) =>
  json({ status: 'error', message }, status, headers)

function allowedOrigins(env: Env): string[] {
  return (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

interface RegistroPayload {
  nombre: string
  telefono: string
  aceptaBases: boolean
  aceptaPromociones: boolean
  turnstileToken: string
  empresa: string
  elapsedMs: number
}

function parsePayload(raw: unknown): RegistroPayload | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  if (typeof r.nombre !== 'string' || typeof r.telefono !== 'string') return null
  if (typeof r.aceptaBases !== 'boolean' || typeof r.aceptaPromociones !== 'boolean') return null
  if (typeof r.turnstileToken !== 'string' || r.turnstileToken.length > 4096) return null
  if (r.empresa !== undefined && typeof r.empresa !== 'string') return null
  if (typeof r.elapsedMs !== 'number' || !Number.isFinite(r.elapsedMs)) return null
  if (r.nombre.length > 200 || r.telefono.length > 40) return null
  return {
    nombre: r.nombre,
    telefono: r.telefono,
    aceptaBases: r.aceptaBases,
    aceptaPromociones: r.aceptaPromociones,
    turnstileToken: r.turnstileToken,
    empresa: (r.empresa as string | undefined) ?? '',
    elapsedMs: r.elapsedMs,
  }
}

async function verifyTurnstile(token: string, ip: string, env: Env, deps: Deps): Promise<boolean> {
  if (!token) return false
  const form = new FormData()
  form.append('secret', env.TURNSTILE_SECRET_KEY ?? '')
  form.append('response', token)
  if (ip) form.append('remoteip', ip)
  try {
    const res = await deps.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    })
    const data = (await res.json()) as { success?: boolean; action?: string }
    return data.success === true && (data.action === undefined || data.action === 'registro')
  } catch {
    deps.log('turnstile_unreachable')
    return false
  }
}

async function underRateLimit(ip: string, env: Env, deps: Deps): Promise<boolean> {
  const key = ip || 'sin-ip'
  if (env.RATE_LIMITER) {
    try {
      const { success } = await env.RATE_LIMITER.limit({ key })
      return success
    } catch {
      deps.log('rate_limiter_binding_error')
    }
  }
  return deps.memoryLimiter.check(key, deps.now())
}

type UpstreamResult = { ok: true; code: 'created' } | { ok: false; code: string }

async function forwardToAppsScript(
  data: { nombre: string; telefono: string; aceptaBases: boolean; aceptaPromociones: boolean },
  env: Env,
  deps: Deps,
): Promise<UpstreamResult | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)
  try {
    // Apps Script no expone las cabeceras en doPost, por eso el secreto viaja en el cuerpo (siempre por HTTPS).
    const res = await deps.fetch(env.APPS_SCRIPT_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.APPS_SCRIPT_SECRET, ...data }),
      redirect: 'follow',
      signal: controller.signal,
    })
    if (!res.ok) {
      deps.log('upstream_http_error', { status: res.status })
      return null
    }
    const body = (await res.json()) as { ok?: unknown; code?: unknown }
    if (body.ok === true && body.code === 'created') return { ok: true, code: 'created' }
    if (body.ok === false && typeof body.code === 'string') return { ok: false, code: body.code }
    deps.log('upstream_unexpected_body')
    return null
  } catch (e) {
    deps.log(controller.signal.aborted ? 'upstream_timeout' : 'upstream_fetch_error')
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Maneja POST /api/registro. Nunca responde "ok" si el Apps Script no confirmó que la fila se guardó.
 * No registra nombres ni teléfonos en los logs.
 */
export async function handleRegistro(request: Request, env: Env, deps: Deps): Promise<Response> {
  if (request.method !== 'POST') return error(MESSAGES.badRequest, 405, { Allow: 'POST' })

  if (env.REGISTRATION_ENABLED !== 'true') return error(MESSAGES.disabled, 503)
  if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_SECRET || !env.TURNSTILE_SECRET_KEY) {
    deps.log('misconfigured')
    return error(MESSAGES.disabled, 503)
  }

  const origin = request.headers.get('Origin')?.replace(/\/$/, '')
  if (!origin || !allowedOrigins(env).includes(origin)) return error(MESSAGES.badRequest, 403)

  if (!(request.headers.get('Content-Type') ?? '').toLowerCase().startsWith('application/json')) {
    return error(MESSAGES.badRequest, 415)
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? ''
  if (!(await underRateLimit(ip, env, deps))) {
    deps.log('rate_limited')
    return error(MESSAGES.rateLimited, 429, { 'Retry-After': '60' })
  }

  let text: string
  try {
    text = await request.text()
  } catch {
    return error(MESSAGES.badRequest, 400)
  }
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return error(MESSAGES.badRequest, 413)

  let payload: RegistroPayload | null
  try {
    payload = parsePayload(JSON.parse(text))
  } catch {
    payload = null
  }
  if (!payload) return error(MESSAGES.badRequest, 400)

  // Señales de envío automatizado: campo trampa lleno o formulario completado demasiado rápido.
  if (payload.empresa.trim() !== '' || payload.elapsedMs < MIN_FILL_MS) {
    deps.log('bot_signal', { honeypot: payload.empresa.trim() !== '', fast: payload.elapsedMs < MIN_FILL_MS })
    return error(MESSAGES.bot, 400)
  }

  const errors = validateRegistration(payload)
  if (Object.keys(errors).length > 0) {
    return json({ status: 'invalid', message: MESSAGES.invalid, errors }, 422)
  }

  if (!(await verifyTurnstile(payload.turnstileToken, ip, env, deps))) {
    deps.log('turnstile_failed')
    return error(MESSAGES.bot, 403)
  }

  const result = await forwardToAppsScript(
    {
      nombre: normalizeName(payload.nombre),
      telefono: normalizePhone(payload.telefono),
      aceptaBases: true,
      aceptaPromociones: payload.aceptaPromociones,
    },
    env,
    deps,
  )

  if (!result) return error(MESSAGES.upstream, 502)
  if (result.ok) {
    deps.log('created')
    return json({ status: 'ok' }, 201)
  }
  switch (result.code) {
    case 'duplicate':
      deps.log('duplicate')
      return json({ status: 'duplicate' }, 409)
    case 'busy':
      return error(MESSAGES.busy, 503, { 'Retry-After': '5' })
    case 'invalid':
      return error(MESSAGES.invalid, 422)
    default:
      deps.log('upstream_rejected', { code: result.code })
      return error(MESSAGES.upstream, 502)
  }
}
