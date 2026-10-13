// Prueba de envíos simultáneos — pegar en la Consola del navegador (FASE 3, SOLO con el Apps Script de la COPIA).
// Envía 5 registros al mismo tiempo con el mismo número ficticio: solo 1 debe guardarse.
(async () => {
  const url = prompt('URL de la aplicación web de la COPIA (termina en /exec):')
  const secret = prompt('Secreto (APPS_SCRIPT_SECRET de la copia):')
  if (!url || !secret) return console.log('Cancelado.')
  const telefono = '5500001' + String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  console.log('Enviando 5 registros simultáneos con el número ficticio ' + telefono + '…')
  const codes = await Promise.all(
    ['A', 'B', 'C', 'D', 'E'].map((letra) =>
      fetch(url, {
        method: 'POST',
        // text/plain evita la verificación CORS previa; el script lee el cuerpo igual
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ secret, nombre: 'Persona Ficticia ' + letra, telefono, aceptaBases: true, aceptaPromociones: false }),
      })
        .then((r) => r.json())
        .then((b) => b.code)
        .catch(() => 'error_red'),
    ),
  )
  const created = codes.filter((c) => c === 'created').length
  console.log('Resultados: ' + codes.join(', '))
  console.log(
    created === 1 && codes.every((c) => c === 'created' || c === 'duplicate')
      ? '✅ Correcto: solo se guardó un registro.'
      : '❌ Se esperaba 1 «created» y 4 «duplicate». Revisa los resultados.',
  )
})()
