import { API_ENDPOINT, IS_DEMO } from '../config'
import { normalizeName, normalizePhone, type FieldErrors, type RegistrationInput } from './validation'

export type RegistrationResult =
  | { status: 'ok' }
  | { status: 'duplicate' }
  | { status: 'invalid'; message: string; errors: FieldErrors }
  | { status: 'error'; message: string }

export interface SubmitExtras {
  /** Token de Cloudflare Turnstile (vacío en demo). */
  turnstileToken: string
  /** Valor del campo trampa anti-spam. */
  honeypot: string
  /** Milisegundos desde que se mostró el formulario. */
  elapsedMs: number
}

export const DUPLICATE_MESSAGE =
  'Este número ya cuenta con un registro para el sorteo de Rincel. No necesitas registrarte otra vez. 💙'

export const NETWORK_ERROR_MESSAGE =
  'No pudimos conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.'

const GENERIC_ERROR_MESSAGE = 'No pudimos guardar tu registro en este momento. Inténtalo de nuevo en unos minutos.'
const TIMEOUT_MS = 25000

/**
 * Números ficticios para revisar los estados de la interfaz en modo demostración.
 * No corresponden a personas reales.
 */
export const DEMO_PHONES = {
  duplicate: '5500000000',
  networkError: '5599999999',
} as const

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Envía el registro. Solo devuelve { status: 'ok' } cuando el servidor confirma (HTTP 201) que
 * el registro se guardó. En modo demostración NO se transmite ningún dato.
 */
export async function submitRegistration(
  input: RegistrationInput,
  extras: SubmitExtras,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
): Promise<RegistrationResult> {
  const payload = {
    nombre: normalizeName(input.nombre),
    telefono: normalizePhone(input.telefono),
    aceptaBases: input.aceptaBases,
    aceptaPromociones: input.aceptaPromociones,
  }

  if (IS_DEMO) {
    await wait(1200)
    if (payload.telefono === DEMO_PHONES.duplicate) return { status: 'duplicate' }
    if (payload.telefono === DEMO_PHONES.networkError) return { status: 'error', message: NETWORK_ERROR_MESSAGE }
    return { status: 'ok' }
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { status: 'error', message: NETWORK_ERROR_MESSAGE }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let res: Response
  try {
    res = await fetchImpl(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        turnstileToken: extras.turnstileToken,
        empresa: extras.honeypot,
        elapsedMs: Math.round(extras.elapsedMs),
      }),
      signal: controller.signal,
      credentials: 'same-origin',
    })
  } catch {
    return { status: 'error', message: NETWORK_ERROR_MESSAGE }
  } finally {
    clearTimeout(timer)
  }

  let body: { status?: string; message?: unknown; errors?: unknown } = {}
  try {
    body = await res.json()
  } catch {
    // respuesta sin JSON (p. ej. error del proveedor): se trata como error genérico
  }

  if (res.status === 201 && body.status === 'ok') return { status: 'ok' }
  if (res.status === 409 && body.status === 'duplicate') return { status: 'duplicate' }

  const message = typeof body.message === 'string' && body.message ? body.message : GENERIC_ERROR_MESSAGE
  if (body.status === 'invalid' && body.errors && typeof body.errors === 'object') {
    return { status: 'invalid', message, errors: body.errors as FieldErrors }
  }
  return { status: 'error', message }
}
