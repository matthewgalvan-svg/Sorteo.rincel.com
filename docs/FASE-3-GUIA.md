# FASE 3 — Conexión con Google Sheets (guía paso a paso)

Archivo: **RINCEL | REGISTRO SORTEO INAUGURACIÓN 2026**. Todo se prueba primero en una **copia**.
Ningún paso publica la página ni abre el registro al público.

---

## Parte A — Copia de prueba

### A1. Hacer la copia
1. Abre la hoja original → **Archivo → Hacer una copia**.
2. Deja el nombre que propone Google (**«Copia de RINCEL | REGISTRO…»**). La palabra «Copia» es importante:
   la función de prueba se niega a correr en cualquier archivo que no la tenga.
3. Si Google también crea una copia del formulario («Copia de …»), puedes borrar **esa copia** del formulario.
   No toques el formulario original.

### A2. Instalar el script en la copia
1. En la **copia**: **Extensiones → Apps Script**.
2. En `Código.gs` borra todo y pega el contenido de [`apps-script/Code.gs`](../apps-script/Code.gs). Guarda (💾).
3. **Configuración del proyecto** (⚙️) → activa **«Mostrar el archivo de manifiesto "appsscript.json"»**.
   Vuelve al editor, abre `appsscript.json` y reemplázalo con [`apps-script/appsscript.json`](../apps-script/appsscript.json). Guarda.
   Esto limita el permiso del script a **solo esta hoja**.

### A3. Crear el secreto
1. Arriba, en el selector de funciones, elige **`generarSecreto`** → **Ejecutar**.
2. Google pedirá autorización: **Revisar permisos** → elige tu cuenta.
   Si aparece «Google no verificó esta app», es normal porque el script es tuyo:
   **Configuración avanzada → Ir a … (no seguro) → Permitir**.
3. En el **Registro de ejecución** aparece `APPS_SCRIPT_SECRET = …`. Guárdalo en un lugar privado
   (lo necesitaremos en Cloudflare). **No lo envíes por chat ni lo subas a GitHub.**

### A4. Prueba automática
1. Elige **`pruebaEnCopia`** → **Ejecutar**.
2. Debe terminar con **`TODAS LAS PRUEBAS PASARON`** y crear la pestaña **Registros Web** en la copia.
3. Elige **`diagnostico`** → **Ejecutar**. Solo muestra conteos (sin nombres ni teléfonos).
4. Copia el registro de ejecución de ambas funciones y compártelo para revisarlo.

### A5. Publicar el script de la copia como aplicación web
1. **Implementar → Nueva implementación** → ⚙️ **Aplicación web**.
2. Descripción: `Prueba copia`. **Ejecutar como: Yo**. **Quién tiene acceso: Cualquier usuario**.
   (Es necesario para que Cloudflare pueda enviar registros. Sin el secreto, el script rechaza todo y
   no existe ninguna forma de leer datos.)
3. **Implementar** → copia la **URL de la aplicación web** (termina en `/exec`).

### A6. Prueba de envíos simultáneos (opcional, recomendada)
Desde tu computadora, con Node 18 o superior, en la carpeta del proyecto:

```bash
CONFIRMO_COPIA=1 APPS_SCRIPT_URL="https://script.google.com/macros/s/…/exec" \
APPS_SCRIPT_SECRET="(el secreto de A3)" node scripts/prueba-concurrencia.mjs
```

Debe decir **«✅ Correcto: solo se guardó un registro.»**

Cuando termines, puedes borrar la copia completa.

---

## Parte B — Borrar los datos de prueba del archivo original (autorizado)

Hazlo **después** de la Parte A (así la copia conserva filas para probar duplicados).

1. En el archivo **original**, pestaña **Respuestas de formulario 1**.
2. Selecciona desde la **fila 2** hasta la última fila con datos (haz clic en el número 2, luego Mayús + clic en el último).
3. Clic derecho → **Eliminar filas**. **No borres la fila 1** (encabezados) ni la pestaña.
4. Opcional, para limpiar también el resumen del formulario: en **Google Forms → Respuestas → ⋮ →
   Eliminar todas las respuestas**.

---

## Parte C — Instalar en el archivo original (después de aprobar la Parte A)

1. Repite **A2** y **A3** en el archivo original. Usa un secreto nuevo, distinto al de la copia.
2. Ejecuta **`setupRegistrosWeb`**: crea la pestaña **Registros Web** con encabezados y no toca nada más.
3. Ejecuta **`diagnostico`** para confirmar.
4. Repite **A5** con la descripción `Producción`.
5. **No** ejecutes `pruebaEnCopia` en el original (de todas formas se niega a correr).

## Parte D — Cloudflare Turnstile (anti-bots)
Se hará junto con la publicación (FASE 4): crear el widget en Cloudflare y guardar las claves como variables y secretos.
