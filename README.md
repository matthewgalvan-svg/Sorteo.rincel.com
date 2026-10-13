# Rincel — Gran Sorteo de Inauguración

Página oficial de registro para el sorteo de inauguración de Rincel (React + TypeScript + Vite + Tailwind CSS).

> **Estado: FASE 2 (funcionalidad) — MODO DEMOSTRACIÓN.** El backend está construido y probado, pero no está conectado a la hoja real ni publicado. Ningún dato se envía ni se guarda.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # VITE_REGISTRATION_MODE=demo
npm run dev                  # http://localhost:5173
npm run build && npm run preview
npm run typecheck            # frontend + Pages Function
npm test                     # pruebas unitarias (validación, servidor, Apps Script con hoja falsa)
npm run test:e2e             # pruebas en navegador (iPhone, Android, escritorio) con API simulada
```

Todas las pruebas usan datos ficticios. Ninguna prueba se conecta a Google ni a Cloudflare.

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
src/components/Turnstile.tsx Verificación anti-bots (solo en modo live)
functions/api/registro.ts    Cloudflare Pages Function: POST /api/registro
server/                      Lógica del backend (validación, anti-spam, límite de solicitudes, envío a Apps Script)
apps-script/                 Código de Google Apps Script para la hoja (se instala en la FASE 3)
tests/unit, tests/e2e        Pruebas automatizadas
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

## Arquitectura (FASE 2 implementada; conexión a la hoja pendiente de la FASE 3)

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
- La confirmación solo se muestra si el Apps Script confirma que la fila se guardó (lo verifica releyéndola).

### Protecciones implementadas

| Riesgo | Protección |
| --- | --- |
| Datos inválidos | Validación en navegador, en la Pages Function y otra vez en el Apps Script |
| Bots / envíos automatizados | Cloudflare Turnstile, campo trampa oculto, tiempo mínimo de llenado (2.5 s) |
| Abuso / spam | Límite de 5 intentos por minuto por IP (binding de Cloudflare si existe; respaldo en memoria) |
| Peticiones desde otros sitios | Solo se aceptan orígenes de `ALLOWED_ORIGINS`, solo `POST` con JSON, máximo 4 KB |
| Duplicados | Búsqueda del número en ambas pestañas (formatos con espacios, guiones o +52 incluidos) |
| Registros simultáneos | `LockService` en Apps Script: la búsqueda y la escritura ocurren dentro del mismo bloqueo |
| Doble clic | El botón se bloquea durante el envío y una sola petición puede estar en curso |
| Sobrescribir datos | Solo se escribe en la fila siguiente a la última; la pestaña del Form nunca se escribe |
| Inyección de fórmulas | Celdas con formato de texto y nombres que solo admiten letras |
| Fuga de datos | No hay ruta de lectura; los logs no incluyen nombres, teléfonos ni IP; errores genéricos |
| Secretos | URL del Apps Script, secreto compartido y clave de Turnstile solo como secretos de Cloudflare |
| Registro antes de tiempo | Doble candado: `VITE_REGISTRATION_MODE=live` en el sitio y `REGISTRATION_ENABLED=true` en el servidor |

### Variables de Cloudflare Pages (FASE 3/4)

| Variable | Tipo | Valor |
| --- | --- | --- |
| `VITE_REGISTRATION_MODE` | Variable de compilación | `demo` hasta el lanzamiento, después `live` |
| `VITE_SITE_URL` | Variable de compilación | URL pública del sitio |
| `VITE_TURNSTILE_SITE_KEY` | Variable de compilación | Clave pública de Turnstile |
| `REGISTRATION_ENABLED` | Variable | `true` solo al lanzar |
| `ALLOWED_ORIGINS` | Variable | p. ej. `https://sorteo-rincel.pages.dev,https://sorteo.rincel.com.mx` |
| `APPS_SCRIPT_URL` | **Secreto** | URL `/exec` del despliegue del Apps Script |
| `APPS_SCRIPT_SECRET` | **Secreto** | Cadena aleatoria de 32+ caracteres (la misma que `SHARED_SECRET` en Apps Script) |
| `TURNSTILE_SECRET_KEY` | **Secreto** | Clave secreta de Turnstile |

**Google Form:** el Form no puede revisar los registros web. Al activar la página, conviene cerrar el Form
(«No aceptar respuestas») para que no se creen duplicados por ese lado. Sus registros históricos se siguen consultando.

### Pestaña nueva: `Registros Web` (no se crea sin autorización; la crea `setupRegistrosWeb()` en la FASE 3)

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
