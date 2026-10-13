import { describe, expect, it } from 'vitest'
import { FakeSheet, SECRET, WEB_HEADERS, formSheet, loadAppsScript, newEnv } from './fakeAppsScript'

const valid = { secret: SECRET, nombre: 'Persona De Prueba', telefono: '5500000099', aceptaBases: true, aceptaPromociones: false }

describe('Apps Script doPost', () => {
  it('agrega una fila nueva en «Registros Web» con todas las columnas', () => {
    const env = newEnv()
    const gas = loadAppsScript(env)
    expect(gas.doPost({ ...valid, aceptaPromociones: true })).toEqual({ ok: true, code: 'created' })
    const web = env.sheets[1]
    expect(web.rows).toHaveLength(2)
    const [ts, nombre, tel, bases, promo, estado, origen, id] = web.rows[1]
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    expect([nombre, tel, bases, promo, estado, origen]).toEqual(['Persona De Prueba', '5500000099', 'Sí', 'Sí', 'Registrado', 'Web'])
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
    expect(web.formats['2:1']).toBe('@') // guardado como texto
  })

  it('guarda el consentimiento comercial como "No" cuando no se marca', () => {
    const env = newEnv()
    loadAppsScript(env).doPost(valid)
    expect(env.sheets[1].rows[1][4]).toBe('No')
  })

  it('nunca modifica la pestaña del Google Form ni filas previas', () => {
    const env = newEnv()
    const before = JSON.stringify(env.sheets[0].rows)
    const gas = loadAppsScript(env)
    gas.doPost(valid)
    gas.doPost({ ...valid, telefono: '5500000098' })
    expect(JSON.stringify(env.sheets[0].rows)).toBe(before)
    expect(env.sheets[0].writes).toBe(0)
    expect(env.sheets[1].rows[1][2]).toBe('5500000099')
    expect(env.sheets[1].rows[2][2]).toBe('5500000098')
  })

  it('detecta duplicados de los registros históricos del Google Form (número y texto con espacios)', () => {
    const gas = loadAppsScript(newEnv())
    expect(gas.doPost({ ...valid, telefono: '5500000001' })).toEqual({ ok: false, code: 'duplicate' })
    expect(gas.doPost({ ...valid, telefono: '5500000002' })).toEqual({ ok: false, code: 'duplicate' })
  })

  it('detecta duplicados de registros web anteriores', () => {
    const env = newEnv()
    const gas = loadAppsScript(env)
    expect(gas.doPost(valid).ok).toBe(true)
    expect(gas.doPost({ ...valid, nombre: 'Otra Persona' })).toEqual({ ok: false, code: 'duplicate' })
    expect(env.sheets[1].rows).toHaveLength(2)
  })

  it('rechaza un secreto incorrecto o ausente sin escribir', () => {
    const env = newEnv()
    const gas = loadAppsScript(env)
    expect(gas.doPost({ ...valid, secret: 'x'.repeat(40) })).toEqual({ ok: false, code: 'unauthorized' })
    expect(gas.doPost({ ...valid, secret: undefined })).toEqual({ ok: false, code: 'unauthorized' })
    expect(env.sheets[1].rows).toHaveLength(1)
  })

  it('rechaza si el secreto configurado es demasiado corto', () => {
    const env = newEnv({ secret: 'corto' })
    expect(loadAppsScript(env).doPost({ ...valid, secret: 'corto' })).toEqual({ ok: false, code: 'unauthorized' })
  })

  it('vuelve a validar los datos en el servidor', () => {
    const gas = loadAppsScript(newEnv())
    for (const bad of [
      { telefono: '55000' },
      { telefono: '55000000ab' },
      { nombre: 'Juan' },
      { nombre: '=IMPORTXML("http://x")' },
      { aceptaBases: false },
      { aceptaPromociones: 'sí' },
    ]) {
      expect(gas.doPost({ ...valid, ...bad }), JSON.stringify(bad)).toEqual({ ok: false, code: 'invalid' })
    }
    expect(gas.doPost('no es json')).toEqual({ ok: false, code: 'bad_request' })
  })

  it('responde "busy" si no obtiene el bloqueo y no escribe', () => {
    const env = newEnv({ lockAvailable: false })
    expect(loadAppsScript(env).doPost(valid)).toEqual({ ok: false, code: 'busy' })
    expect(env.sheets[1].rows).toHaveLength(1)
  })

  it('libera el bloqueo incluso si la pestaña no existe', () => {
    const env = newEnv({ sheets: [new FakeSheet('Respuestas de formulario 1')] })
    expect(loadAppsScript(env).doPost(valid)).toEqual({ ok: false, code: 'not_configured' })
    expect(env.lockReleased).toBe(1)
    expect(env.insertedSheets).toEqual([]) // doPost nunca crea pestañas
  })

  it('doGet no expone datos', () => {
    expect(loadAppsScript(newEnv()).doGet()).toEqual({ ok: false, code: 'method_not_allowed' })
  })
})

describe('setupRegistrosWeb', () => {
  it('crea la pestaña con encabezados solo si no existe', () => {
    const env = newEnv({ sheets: [new FakeSheet('Respuestas de formulario 1')] })
    const gas = loadAppsScript(env)
    gas.setup()
    expect(env.insertedSheets).toEqual(['Registros Web'])
    expect(env.sheets[1].rows[0]).toEqual(WEB_HEADERS)
    gas.setup()
    expect(env.insertedSheets).toEqual(['Registros Web'])
  })
})

describe('ayudas de la FASE 3', () => {
  it('pruebaEnCopia se niega a correr en la hoja original', () => {
    const env = newEnv()
    expect(() => loadAppsScript(env).run('pruebaEnCopia')).toThrow(/COPIA/)
    expect(env.sheets[1].rows).toHaveLength(1)
  })

  it('pruebaEnCopia pasa todos sus casos en una copia (incluido un número del Google Form)', () => {
    const env = newEnv({ fileName: 'Copia de RINCEL | REGISTRO SORTEO INAUGURACIÓN 2026', sheets: [formSheet()] })
    loadAppsScript(env).run('pruebaEnCopia')
    expect(env.logs.filter((l) => l.startsWith('❌'))).toEqual([])
    expect(env.logs).toContain('TODAS LAS PRUEBAS PASARON')
    expect(env.logs.some((l) => l.includes('Google Form'))).toBe(true)
    expect(env.sheets.find((s) => s.name === 'Registros Web')!.rows).toHaveLength(2)
  })

  it('generarSecreto crea un secreto largo una sola vez', () => {
    const env = newEnv({ secret: null })
    const gas = loadAppsScript(env)
    gas.run('generarSecreto')
    const first = env.secret
    expect(first).toMatch(/^[0-9a-f]{64}$/)
    gas.run('generarSecreto')
    expect(env.secret).toBe(first)
  })
})

describe('diagnostico', () => {
  it('no cuenta filas vacías como formato distinto', () => {
    const env = newEnv()
    env.sheets[0].rows.push(['', '', '', '', '', ''], ['', '', '', '', '', ''])
    loadAppsScript(env).run('diagnostico')
    expect(env.logs[0]).toBe(
      'Respuestas de formulario 1: 2 registros con teléfono (2 filas vacías), 2 con 10 dígitos, 2 números únicos, 0 con formato distinto.',
    )
  })
})
