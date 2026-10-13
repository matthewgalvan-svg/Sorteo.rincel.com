/**
 * Reglas de validación del registro. Este módulo no depende del navegador para que
 * el backend (FASE 2) aplique exactamente las mismas reglas del lado del servidor.
 */

export const NAME_MIN = 5
export const NAME_MAX = 80

// Letras (incluye acentos, ñ y ü), espacios, apóstrofo, guion y punto.
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u

/** Quita espacios sobrantes al inicio, final y entre palabras. */
export function normalizeName(raw: string): string {
  return raw.normalize('NFC').replace(/\s+/g, ' ').trim()
}

export function validateName(raw: string): string | null {
  const name = normalizeName(raw)
  if (!name) return 'Escribe tu nombre completo.'
  if (!NAME_PATTERN.test(name)) return 'Usa solo letras, espacios y acentos (sin números ni símbolos).'
  if (name.length < NAME_MIN || name.split(' ').filter((w) => /\p{L}/u.test(w)).length < 2) {
    return 'Escribe tu nombre y al menos un apellido.'
  }
  if (name.length > NAME_MAX) return `El nombre no debe superar ${NAME_MAX} caracteres.`
  return null
}

/** Elimina separadores comunes (espacios, guiones, paréntesis, puntos) y la lada +52 si se escribió. */
export function normalizePhone(raw: string): string {
  let phone = raw.replace(/[\s\-().]/g, '')
  if (/^\+?52\d{10}$/.test(phone)) phone = phone.replace(/^\+?52/, '')
  return phone
}

export function validatePhone(raw: string): string | null {
  const phone = normalizePhone(raw)
  if (!phone) return 'Escribe tu número celular.'
  if (!/^\d+$/.test(phone)) return 'El número solo puede contener dígitos.'
  if (phone.length !== 10) return `El número debe tener exactamente 10 dígitos (llevas ${phone.length}).`
  return null
}

export interface RegistrationInput {
  nombre: string
  telefono: string
  aceptaBases: boolean
  aceptaPromociones: boolean
}

export type FieldErrors = Partial<Record<'nombre' | 'telefono' | 'aceptaBases', string>>

export function validateRegistration(input: RegistrationInput): FieldErrors {
  const errors: FieldErrors = {}
  const nombre = validateName(input.nombre)
  const telefono = validatePhone(input.telefono)
  if (nombre) errors.nombre = nombre
  if (telefono) errors.telefono = telefono
  if (!input.aceptaBases) errors.aceptaBases = 'Debes aceptar las bases del sorteo para participar.'
  return errors
}
