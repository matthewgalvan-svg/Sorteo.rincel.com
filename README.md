# Rincel — Gran Sorteo de Inauguración

Página oficial de registro para el sorteo de inauguración de Rincel (React + TypeScript + Vite + Tailwind CSS).

> **Estado: FASE 1 (diseño) — MODO DEMOSTRACIÓN.** El registro real está deshabilitado: ningún dato se envía ni se guarda.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # VITE_REGISTRATION_MODE=demo
npm run dev                  # http://localhost:5173
npm run build && npm run preview
```

En modo demostración puedes revisar todos los estados del formulario:

| Número de prueba (ficticio) | Resultado simulado |
| --- | --- |
| Cualquier número válido de 10 dígitos | Pantalla «¡Registro recibido!» (marcada como demo) |
| `5500000000` | Mensaje de número ya registrado |
| `5599999999` | Error de conexión |

`/?vista=confirmacion` abre directamente la pantalla de confirmación (solo en demo).

## Estructura

```
assets/                      Archivos originales entregados por Rincel (sin modificar)
src/assets/brand/            Logotipo oficial extraído en vectorial (SVG) del PDF
src/assets/campaign/         Rincelito con lentes y los 3 celulares (recorte del encabezado oficial, WebP)
src/components/              Componentes reutilizables (Hero, formulario, confirmación, bases…)
src/lib/validation.ts        Reglas de validación (compartibles con el servidor)
src/lib/register.ts          Envío del registro (simulado en demo)
src/config.ts                Enlaces oficiales y modo demo/live
public/_headers              Cabeceras de seguridad para Cloudflare Pages
```

### Notas sobre los recursos visuales
- **Logotipo:** extraído del PDF como vector, sin alterar formas. Los colores se ajustaron a los HEX oficiales
  de la paleta (el PDF los trae en una conversión CMYK ligeramente distinta). Para fondos azules se usa la
  versión en blanco con los puntos en naranja.
- **Rincelito:** se usa la versión con lentes del encabezado de la campaña (no se dibujó ni rediseñó nada).
- **Fuente:** Nunito (redondeada, similar al estilo del logotipo), alojada en el propio sitio, sin peticiones a terceros.

## Cambio de dominio
Toda la configuración de URL vive en `VITE_SITE_URL`. Para pasar a `sorteo.rincel.com.mx` basta con cambiar esa
variable en Cloudflare Pages y agregar el dominio personalizado (no requiere cambios de código).

## Arquitectura propuesta (FASES 2 y 3 — pendiente de aprobación)

```
Navegador ──HTTPS──▶ Cloudflare Pages Function  /api/registro
                       • Cloudflare Turnstile (anti-bots, gratuito, sin rastreo publicitario)
                       • Limitación de solicitudes por IP
                       • Validación de servidor (mismas reglas de src/lib/validation.ts)
                       • Secreto compartido guardado como secret de Cloudflare
                     ──HTTPS──▶ Google Apps Script (Web App ligada a la hoja)
                       • Verifica el secreto
                       • LockService (bloqueo contra registros simultáneos)
                       • Busca el teléfono en «Respuestas de formulario 1» (col. C) y en «Registros Web»
                       • Solo agrega filas con appendRow (nunca sobrescribe ni borra)
```

- Ninguna credencial de Google ni la URL del Apps Script llegan al navegador.
- La hoja sigue siendo privada; el Apps Script no expone ninguna ruta de lectura de participantes.
- La confirmación solo se muestra si el Apps Script responde que la fila se guardó.

### Pestaña nueva propuesta: `Registros Web` (no se crea sin autorización)

| Col. | Encabezado | Ejemplo |
| --- | --- | --- |
| A | Marca temporal | 2026-10-13 10:42:05 (hora de Monterrey) |
| B | Nombre completo | (normalizado, sin espacios sobrantes) |
| C | Número de celular (10 dígitos) | guardado como texto para conservar ceros |
| D | Acepta bases y aviso de privacidad | Sí |
| E | Consentimiento promociones WhatsApp/SMS | Sí / No |
| F | Estado de participación | Registrado |
| G | Origen | Web |
| H | ID de registro | identificador aleatorio para soporte |

La pestaña `Respuestas de formulario 1` y el Google Form actual no se modifican; solo se leen para detectar duplicados.

## Requisitos antes de activar registros reales
Fecha y ubicación, modelos de los celulares, mecánica de selección, procedimiento de suplentes, bases definitivas,
aviso de privacidad aplicable (o aviso complementario) y autorizaciones legales del sorteo.
