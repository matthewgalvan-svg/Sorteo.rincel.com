import { createHash, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

type Cell = string | number | boolean | Date

/** Hoja falsa en memoria con la API mínima de SpreadsheetApp que usa Code.gs. */
export class FakeSheet {
  rows: Cell[][]
  formats: Record<string, string> = {}
  writes = 0
  constructor(
    public name: string,
    rows: Cell[][] = [],
  ) {
    this.rows = rows.map((r) => [...r])
  }
  getLastRow() {
    return this.rows.length
  }
  getMaxRows() {
    return 1000
  }
  setFrozenRows() {}
  getRange(row: number, col: number, numRows = 1, numCols = 1) {
    const sheet = this
    const range = {
      getValues: () =>
        Array.from({ length: numRows }, (_, i) =>
          Array.from({ length: numCols }, (_, j) => sheet.rows[row - 1 + i]?.[col - 1 + j] ?? ''),
        ),
      setValues: (values: Cell[][]) => {
        sheet.writes++
        values.forEach((v, i) => {
          const r = (sheet.rows[row - 1 + i] ??= [])
          v.forEach((cell, j) => (r[col - 1 + j] = cell))
        })
        for (let i = 0; i < sheet.rows.length; i++) sheet.rows[i] ??= []
        return range
      },
      setNumberFormat: (f: string) => {
        sheet.formats[`${row}:${col}`] = f
        return range
      },
      setFontWeight: () => range,
    }
    return range
  }
}

export interface FakeEnv {
  sheets: FakeSheet[]
  secret: string | null
  lockAvailable: boolean
  insertedSheets: string[]
  lockReleased: number
}

export function loadAppsScript(env: FakeEnv) {
  const code = readFileSync(fileURLToPath(new URL('../../apps-script/Code.gs', import.meta.url)), 'utf8')
  const spreadsheet = {
    getSheetByName: (name: string) => env.sheets.find((s) => s.name === name) ?? null,
    getSheets: () => env.sheets,
    insertSheet: (name: string) => {
      const s = new FakeSheet(name)
      env.sheets.push(s)
      env.insertedSheets.push(name)
      return s
    },
  }
  const toSigned = (buf: Buffer) => Array.from(buf).map((b) => (b > 127 ? b - 256 : b))
  const context = vm.createContext({
    console: { log: () => {}, error: () => {} },
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet, flush: () => {} },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => env.lockAvailable,
        releaseLock: () => {
          env.lockReleased++
        },
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: (k: string) => (k === 'SHARED_SECRET' ? env.secret : null) }),
    },
    Utilities: {
      getUuid: () => randomUUID(),
      formatDate: (d: Date) => d.toISOString().replace('T', ' ').slice(0, 19),
      DigestAlgorithm: { SHA_256: 'sha256' },
      computeDigest: (_alg: string, value: string) => toSigned(createHash('sha256').update(value, 'utf8').digest()),
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (content: string) => ({ content, setMimeType() { return this } }),
    },
  })
  vm.runInContext(code, context)
  const call = (fn: string, ...args: unknown[]) => (context as Record<string, (...a: unknown[]) => unknown>)[fn](...args)
  return {
    doPost: (body: unknown) => {
      const out = call('doPost', { postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } }) as {
        content: string
      }
      return JSON.parse(out.content) as { ok: boolean; code: string }
    },
    doGet: () => JSON.parse((call('doGet') as { content: string }).content),
    setup: () => call('setupRegistrosWeb'),
  }
}

export const SECRET = 's'.repeat(40)

export const WEB_HEADERS = [
  'Marca temporal',
  'Nombre completo',
  'Número de celular (10 dígitos)',
  'Acepta bases y aviso de privacidad',
  'Consentimiento promociones WhatsApp/SMS',
  'Estado de participación',
  'Origen',
  'ID de registro',
]

/** Pestaña del Google Form con registros históricos FICTICIOS (incluye un número guardado como Number). */
export function formSheet() {
  return new FakeSheet('Respuestas de formulario 1', [
    ['Marca temporal', 'Nombre completo', 'Número de celular (10 dígitos)', 'Bases', 'Promos', 'Estado'],
    [new Date('2026-09-01'), 'Persona Ficticia Uno', 5500000001, 'Acepto', 'Sí', 'Registrado'],
    [new Date('2026-09-02'), 'Persona Ficticia Dos', '55 0000 0002', 'Acepto', 'No', 'Registrado'],
  ])
}

export function newEnv(overrides: Partial<FakeEnv> = {}): FakeEnv {
  return {
    sheets: [formSheet(), new FakeSheet('Registros Web', [WEB_HEADERS])],
    secret: SECRET,
    lockAvailable: true,
    insertedSheets: [],
    lockReleased: 0,
    ...overrides,
  }
}
