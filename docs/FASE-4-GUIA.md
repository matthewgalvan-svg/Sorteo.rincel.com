# FASE 4 — Publicación en Cloudflare Pages (guía paso a paso)

Resultado: la página publicada en `https://sorteo-rincel.pages.dev` (gratis, HTTPS automático),
**en modo demostración**. El registro real solo se activa al final, con tu autorización.

> El panel de Cloudflare cambia de vez en cuando; si un botón tiene otro nombre, busca el equivalente.

---

## Paso 1 — Cuenta de Cloudflare
1. Entra a https://dash.cloudflare.com/sign-up y crea una cuenta gratuita (puedes usar el correo de Rincel).
2. Verifica tu correo.

## Paso 2 — Crear el proyecto de Pages conectado a GitHub
1. En el menú izquierdo: **Workers & Pages** (o **Compute → Workers & Pages**) → **Create** → pestaña **Pages** →
   **Import an existing Git repository** (o **Connect to Git**).
2. **Connect GitHub** → autoriza a Cloudflare. Puedes darle acceso solo al repositorio `Sorteo.rincel.com`.
3. Elige el repositorio **`matthewgalvan-svg/Sorteo.rincel.com`** → **Begin setup**.
4. Configura:
   | Campo | Valor |
   | --- | --- |
   | Project name | `sorteo-rincel` (define la URL `sorteo-rincel.pages.dev`; si está ocupado, usa otro y avísame) |
   | Production branch | `claude/rincel-sorteo-inauguracion-2lpphu` |
   | Framework preset | `None` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | *(vacío)* |
5. **Environment variables (advanced)** → agrega:
   | Nombre | Valor |
   | --- | --- |
   | `VITE_REGISTRATION_MODE` | `demo` |
   | `VITE_SITE_URL` | `https://sorteo-rincel.pages.dev` |
6. **Save and Deploy**. Tarda 1–2 minutos. Al terminar abre la URL: debe verse la página con la franja
   «Modo demostración».

## Paso 3 — Turnstile (anti-bots)
1. Menú izquierdo: **Turnstile** → **Add widget** (o **Add site**).
2. Nombre: `Sorteo Rincel`. Hostname: `sorteo-rincel.pages.dev` (más adelante se agrega `sorteo.rincel.com.mx`).
3. Widget mode: **Managed**. **Create**.
4. Copia la **Site Key** (pública) y la **Secret Key** (privada; no la compartas).

## Paso 4 — Variables y secretos
En el proyecto `sorteo-rincel` → **Settings** → **Variables and Secrets** (entorno **Production**) → **Add**:

| Nombre | Tipo | Valor |
| --- | --- | --- |
| `VITE_TURNSTILE_SITE_KEY` | Text | Site Key del paso 3 |
| `ALLOWED_ORIGINS` | Text | `https://sorteo-rincel.pages.dev` |
| `REGISTRATION_ENABLED` | Text | `false` |
| `TURNSTILE_SECRET_KEY` | **Secret** | Secret Key del paso 3 |
| `APPS_SCRIPT_URL` | **Secret** | URL `/exec` (ver paso 5) |
| `APPS_SCRIPT_SECRET` | **Secret** | Clave del Apps Script (ver paso 5) |

Después: **Deployments** → en el último despliegue **⋯ → Retry deployment** (las variables `VITE_…` se aplican al compilar).

## Paso 5 — Prueba real de punta a punta (con la COPIA)
Para probar el registro real sin tocar la hoja original:
1. Usa en `APPS_SCRIPT_URL` y `APPS_SCRIPT_SECRET` los valores de la **copia**.
2. Cambia temporalmente `VITE_REGISTRATION_MODE` = `live` y `REGISTRATION_ENABLED` = `true` → **Retry deployment**.
3. Desde tu celular (iPhone y/o Android), con datos ficticios (`Persona Ficticia Prueba`, `5500002xxx`):
   - registro nuevo → «¡Registro recibido!» y aparece la fila en «Registros Web» de la **copia**;
   - mismo número → mensaje de número ya registrado;
   - activa modo avión y envía → mensaje de error de conexión, sin confirmación.
4. Al terminar, deja la configuración de espera (paso 6).

## Paso 6 — Configuración de espera hasta el lanzamiento
| Variable | Valor |
| --- | --- |
| `VITE_REGISTRATION_MODE` | `demo` |
| `REGISTRATION_ENABLED` | `false` |
| `APPS_SCRIPT_URL` / `APPS_SCRIPT_SECRET` | valores de **PRODUCCIÓN** (archivo original) |

→ **Retry deployment**. La página queda pública en modo demostración y sin aceptar registros.

## Lanzamiento (solo con tu autorización, cuando las condiciones previas estén listas)
1. `VITE_REGISTRATION_MODE` = `live`, `REGISTRATION_ENABLED` = `true` → **Retry deployment**.
2. En Google Forms: **Respuestas → desactivar «Aceptando respuestas»**.
3. Generar el QR definitivo con la URL final.

## Dominio `sorteo.rincel.com.mx` (cuando se decida)
1. Proyecto → **Custom domains** → **Set up a custom domain** → `sorteo.rincel.com.mx`.
2. Cloudflare indica un registro **CNAME** (`sorteo` → `sorteo-rincel.pages.dev`) que se agrega en el DNS de `rincel.com.mx`.
   Esto **no** modifica el sitio `rincel.com.mx`.
3. Actualiza `VITE_SITE_URL`, agrega el dominio a `ALLOWED_ORIGINS` (separado por coma) y al widget de Turnstile → **Retry deployment**.
