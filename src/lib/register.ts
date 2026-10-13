import { IS_DEMO } from '../config'
import { normalizeName, normalizePhone, type RegistrationInput } from './validation'

export type RegistrationResult =
  | { status: 'ok' }
  | { status: 'duplicate' }
  | { status: 'error'; message: string }

export const DUPLICATE_MESSAGE =
  'Este número ya cuenta con un registro para el sorteo de Rincel. No necesitas registrarte otra vez. 💙'

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
 * Envía el registro. En modo demostración NO se transmite ni se guarda ningún dato:
 * solo se simula la respuesta del servidor para revisar el diseño.
 * La conexión real (FASE 2 / FASE 3) reemplazará la rama "live".
 */
export async function submitRegistration(input: RegistrationInput): Promise<RegistrationResult> {
  const payload = {
    nombre: normalizeName(input.nombre),
    telefono: normalizePhone(input.telefono),
    aceptaBases: input.aceptaBases,
    aceptaPromociones: input.aceptaPromociones,
  }

  if (IS_DEMO) {
    await wait(1200)
    if (payload.telefono === DEMO_PHONES.duplicate) return { status: 'duplicate' }
    if (payload.telefono === DEMO_PHONES.networkError) {
      return {
        status: 'error',
        message: 'No pudimos conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.',
      }
    }
    return { status: 'ok' }
  }

  // Modo "live": pendiente de implementar en la FASE 2. Nunca confirmar sin respuesta del servidor.
  return {
    status: 'error',
    message: 'El registro todavía no está disponible. Inténtalo más tarde.',
  }
}
