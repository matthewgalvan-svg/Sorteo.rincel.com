import { describe, expect, it } from 'vitest'
import { normalizeName, normalizePhone, validateName, validatePhone, validateRegistration } from '../../src/lib/validation'

// Todos los datos de prueba son ficticios.
describe('nombre', () => {
  it('acepta acentos, ñ, ü, apóstrofos y guiones', () => {
    for (const n of ['José Ñúñez', 'María Fernanda Güémez', "Ana O'Neil", 'Luis Pérez-Treviño', 'Ma. Elena Ríos']) {
      expect(validateName(n), n).toBeNull()
    }
  })
  it('elimina espacios sobrantes', () => {
    expect(normalizeName('   José    Ñúñez  ')).toBe('José Ñúñez')
    expect(normalizeName('Ana\t\nLópez')).toBe('Ana López')
  })
  it('rechaza vacío, solo espacios, números, símbolos y una sola palabra', () => {
    expect(validateName('')).toMatch(/Escribe tu nombre/)
    expect(validateName('     ')).toMatch(/Escribe tu nombre/)
    expect(validateName('Juan 123')).toMatch(/solo letras/)
    expect(validateName('=HYPERLINK("x")')).toMatch(/solo letras/)
    expect(validateName('<script>alert(1)</script>')).toMatch(/solo letras/)
    expect(validateName('Juan')).toMatch(/apellido/)
    expect(validateName('A B')).toMatch(/apellido/)
  })
  it('limita la longitud', () => {
    expect(validateName('Ana ' + 'a'.repeat(90))).toMatch(/no debe superar/)
  })
})

describe('teléfono', () => {
  it('acepta exactamente 10 dígitos, con separadores comunes o lada +52', () => {
    expect(validatePhone('5512345678')).toBeNull()
    expect(normalizePhone('55 1234 5678')).toBe('5512345678')
    expect(normalizePhone('(55) 1234-5678')).toBe('5512345678')
    expect(normalizePhone('+52 55 1234 5678')).toBe('5512345678')
    expect(normalizePhone('525512345678')).toBe('5512345678')
  })
  it('rechaza teléfonos incompletos o demasiado largos', () => {
    expect(validatePhone('551234567')).toMatch(/exactamente 10 dígitos \(llevas 9\)/)
    expect(validatePhone('55123456789')).toMatch(/llevas 11/)
    expect(validatePhone('')).toMatch(/Escribe tu número/)
  })
  it('rechaza caracteres inválidos', () => {
    expect(validatePhone('55a2345678')).toMatch(/solo puede contener dígitos/)
    expect(validatePhone('55123456７8')).toMatch(/solo puede contener dígitos/) // dígito de ancho completo
    expect(validatePhone('+1 5512345678')).toMatch(/solo puede contener dígitos/)
    expect(validatePhone('５５１２３４５６７８')).toMatch(/solo puede contener dígitos/)
  })
})

describe('registro completo', () => {
  const base = { nombre: 'Ana López', telefono: '5512345678', aceptaBases: true, aceptaPromociones: false }
  it('es válido sin consentimiento comercial (opcional)', () => {
    expect(validateRegistration(base)).toEqual({})
  })
  it('exige aceptar las bases', () => {
    expect(validateRegistration({ ...base, aceptaBases: false })).toHaveProperty('aceptaBases')
  })
})
