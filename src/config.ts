/** Enlaces oficiales y ajustes del sitio. Todo lo que cambia entre entornos vive aquí o en variables VITE_*. */

export const LINKS = {
  bases: 'https://docs.google.com/document/d/1lv0AuR1xd3hhn1vgNMYNLu_1ZYJvWy7oYWPa2slzlS4/edit',
  privacidad: 'https://rincel.com.mx/politicas-privacidad',
  sitioOficial: 'https://rincel.com.mx',
} as const

export type RegistrationMode = 'demo' | 'live'

/**
 * Mientras no estén definidos fecha, premios, mecánica, suplentes, bases definitivas,
 * aviso de privacidad aplicable y autorizaciones, el sitio DEBE operar en "demo".
 * Cualquier valor distinto de "live" se trata como "demo".
 */
export const REGISTRATION_MODE: RegistrationMode =
  import.meta.env.VITE_REGISTRATION_MODE === 'live' ? 'live' : 'demo'

export const IS_DEMO = REGISTRATION_MODE === 'demo'
