#!/usr/bin/env node
/**
 * Prueba de envíos simultáneos contra el Apps Script de la COPIA de la hoja (FASE 3).
 * Envía 5 registros al mismo tiempo con el mismo número ficticio: solo 1 debe guardarse.
 *
 * Uso (desde tu computadora, con Node 18+):
 *   CONFIRMO_COPIA=1 APPS_SCRIPT_URL="https://script.google.com/macros/s/.../exec" \
 *   APPS_SCRIPT_SECRET="..." node scripts/prueba-concurrencia.mjs
 */
const { APPS_SCRIPT_URL: url, APPS_SCRIPT_SECRET: secret, CONFIRMO_COPIA } = process.env
if (CONFIRMO_COPIA !== '1') {
  console.error('Esta prueba escribe filas ficticias. Úsala solo con el Apps Script de la COPIA y define CONFIRMO_COPIA=1.')
  process.exit(1)
}
if (!url || !secret) {
  console.error('Faltan APPS_SCRIPT_URL o APPS_SCRIPT_SECRET.')
  process.exit(1)
}

const telefono = '5500001' + String(Math.floor(Math.random() * 1000)).padStart(3, '0')
const N = 5
console.log(`Enviando ${N} registros simultáneos con el número ficticio ${telefono}…`)

const results = await Promise.all(
  Array.from({ length: N }, async (_, i) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, nombre: `Persona Ficticia ${'ABCDE'[i]}`, telefono, aceptaBases: true, aceptaPromociones: false }),
        redirect: 'follow',
      })
      return (await res.json()).code ?? `http_${res.status}`
    } catch (e) {
      return 'error_red'
    }
  }),
)

const created = results.filter((c) => c === 'created').length
console.log('Resultados:', results.join(', '))
if (created === 1 && results.every((c) => c === 'created' || c === 'duplicate')) {
  console.log('✅ Correcto: solo se guardó un registro.')
} else {
  console.log(`❌ Se esperaba exactamente 1 «created» y el resto «duplicate» (se obtuvieron ${created} «created»).`)
  process.exit(1)
}
