import { expect, test, type Page, type Route } from '@playwright/test'

// Todos los datos son ficticios.
const DEMO = 'http://localhost:5178/'
const LIVE = 'http://localhost:5179/'
const NOMBRE = 'Persona De Prueba'
const TEL = '5500000099'

/** Sustituye el script de Turnstile por uno falso que entrega un token de prueba. */
async function fakeTurnstile(page: Page) {
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.turnstile = {
        render(el, o) { this.o = o; el.textContent = 'verificación simulada'; setTimeout(() => o.callback('e2e-token'), 50); return 'w1' },
        reset() { setTimeout(() => this.o.callback('e2e-token-2'), 50) }, remove() {}
      };`,
    }),
  )
}

async function fillValid(page: Page, telefono = TEL) {
  await page.fill('#campo-nombre', NOMBRE)
  await page.fill('#campo-telefono', telefono)
  await page.check('#campo-aceptaBases')
  // el servidor rechaza formularios completados en menos de 2.5 s
  await page.waitForTimeout(2600)
}

const submit = (page: Page) => page.getByRole('button', { name: /registrar mi participación/i })

test.describe('diseño y enlaces', () => {
  test('sin desplazamiento horizontal y con contenido principal', async ({ page }) => {
    await page.goto(DEMO)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sorteo')
    await expect(page.getByText('¡Participa gratis para ganar uno de nuestros')).toBeVisible()
    await expect(page.getByAltText(/Rincelito/).first()).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('el botón principal lleva al formulario', async ({ page }) => {
    await page.goto(DEMO)
    await page.getByRole('button', { name: /quiero participar/i }).click()
    await expect(page.locator('#campo-nombre')).toBeFocused({ timeout: 3000 })
    await expect(page.locator('#registro')).toBeInViewport()
  })

  test('enlaces oficiales correctos y seguros', async ({ page }) => {
    await page.goto(DEMO)
    const expected = {
      bases: 'https://docs.google.com/document/d/1lv0AuR1xd3hhn1vgNMYNLu_1ZYJvWy7oYWPa2slzlS4/edit',
      privacidad: 'https://rincel.com.mx/politicas-privacidad',
    }
    const form = page.locator('#registro')
    await expect(form.getByRole('link', { name: 'bases del sorteo' })).toHaveAttribute('href', expected.bases)
    for (const link of await form.getByRole('link', { name: /aviso de privacidad/i }).all()) {
      await expect(link).toHaveAttribute('href', expected.privacidad)
    }
    await expect(page.getByRole('link', { name: /leer bases completas/i })).toHaveAttribute('href', expected.bases)
    for (const link of await page.locator('a[target=_blank]').all()) {
      await expect(link).toHaveAttribute('rel', /noopener/)
      expect(await link.getAttribute('href')).toMatch(/^https:\/\//)
    }
  })

  test('teclado numérico y casilla de promociones desmarcada', async ({ page }) => {
    await page.goto(DEMO)
    await expect(page.locator('#campo-telefono')).toHaveAttribute('inputmode', 'numeric')
    await expect(page.locator('#campo-telefono')).toHaveAttribute('type', 'tel')
    await expect(page.locator('#campo-aceptaPromociones')).not.toBeChecked()
  })

  test('no solicita datos sensibles', async ({ page }) => {
    await page.goto(DEMO)
    const form = page.locator('#registro')
    expect(await form.getByRole('textbox').evaluateAll((els) => els.map((e) => e.id))).toEqual(['campo-nombre', 'campo-telefono'])
    expect(await form.getByRole('checkbox').evaluateAll((els) => els.map((e) => e.id))).toEqual([
      'campo-aceptaBases',
      'campo-aceptaPromociones',
    ])
    await expect(page.locator('input[type=email], input[name*=curp i], input[name*=ine i], input[name*=direcc i]')).toHaveCount(0)
  })
})

test.describe('validación en el navegador', () => {
  test('errores claros y ninguna petición con datos inválidos', async ({ page }) => {
    let calls = 0
    await page.route('**/api/registro', (r) => {
      calls++
      return r.abort()
    })
    await fakeTurnstile(page)
    await page.goto(LIVE)
    await submit(page).click()
    await expect(page.getByText('Escribe tu nombre completo.')).toBeVisible()
    await expect(page.getByText('Escribe tu número celular.')).toBeVisible()
    await expect(page.getByText(/Debes aceptar las bases/)).toBeVisible()
    await expect(page.locator('#campo-nombre')).toBeFocused()

    await page.fill('#campo-nombre', 'Juan')
    await page.fill('#campo-telefono', '55123')
    await expect(page.getByText(/al menos un apellido/)).toBeVisible()
    await expect(page.getByText(/exactamente 10 dígitos \(llevas 5\)/)).toBeVisible()

    await page.fill('#campo-telefono', '55abc45678')
    await expect(page.getByText(/solo puede contener dígitos/)).toBeVisible()
    expect(calls).toBe(0)
  })

  test('el nombre se limpia de espacios sobrantes al salir del campo', async ({ page }) => {
    await page.goto(DEMO)
    await page.fill('#campo-nombre', '   José    Ñúñez   ')
    await page.locator('#campo-telefono').focus()
    await expect(page.locator('#campo-nombre')).toHaveValue('José Ñúñez')
  })
})

test.describe('envío real (API simulada)', () => {
  async function mockApi(page: Page, handler: (route: Route, body: Record<string, unknown>) => Promise<void> | void) {
    const bodies: Record<string, unknown>[] = []
    await page.route('**/api/registro', async (route) => {
      const body = route.request().postDataJSON()
      bodies.push(body)
      await handler(route, body)
    })
    return bodies
  }

  test('registro correcto: envía datos limpios y muestra la confirmación', async ({ page }) => {
    await fakeTurnstile(page)
    const bodies = await mockApi(page, (r) => r.fulfill({ status: 201, json: { status: 'ok' } }))
    await page.goto(LIVE)
    await page.fill('#campo-nombre', '  Persona   De Prueba ')
    await page.fill('#campo-telefono', '55 0000 0099')
    await page.check('#campo-aceptaBases')
    await page.waitForTimeout(2600)
    await submit(page).click()
    await expect(page.getByRole('heading', { name: /registro recibido/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /registro recibido/i })).toBeFocused()
    await expect(page.getByRole('link', { name: /visitar rincel\.com\.mx/i })).toHaveAttribute('href', 'https://rincel.com.mx')
    await expect(page.getByText(/este registro NO se guardó/)).toHaveCount(0)
    expect(bodies).toHaveLength(1)
    expect(bodies[0]).toMatchObject({
      nombre: NOMBRE,
      telefono: TEL,
      aceptaBases: true,
      aceptaPromociones: false,
      turnstileToken: 'e2e-token',
      empresa: '',
    })
  })

  test('consentimiento comercial opcional se envía cuando se marca', async ({ page }) => {
    await fakeTurnstile(page)
    const bodies = await mockApi(page, (r) => r.fulfill({ status: 201, json: { status: 'ok' } }))
    await page.goto(LIVE)
    await fillValid(page)
    await page.check('#campo-aceptaPromociones')
    await submit(page).click()
    await expect(page.getByRole('heading', { name: /registro recibido/i })).toBeVisible()
    expect(bodies[0].aceptaPromociones).toBe(true)
  })

  test('doble clic y doble Enter generan una sola petición', async ({ page }) => {
    await fakeTurnstile(page)
    const bodies = await mockApi(page, async (r) => {
      await new Promise((res) => setTimeout(res, 800))
      await r.fulfill({ status: 201, json: { status: 'ok' } })
    })
    await page.goto(LIVE)
    await fillValid(page)
    await submit(page).dblclick()
    await page.locator('#campo-telefono').press('Enter').catch(() => {})
    await expect(page.getByRole('button', { name: /enviando registro/i })).toBeDisabled()
    await expect(page.getByRole('heading', { name: /registro recibido/i })).toBeVisible()
    expect(bodies).toHaveLength(1)
  })

  test('número duplicado: mensaje amable y sin confirmación', async ({ page }) => {
    await fakeTurnstile(page)
    await mockApi(page, (r) => r.fulfill({ status: 409, json: { status: 'duplicate' } }))
    await page.goto(LIVE)
    await fillValid(page)
    await submit(page).click()
    await expect(
      page.getByText('Este número ya cuenta con un registro para el sorteo de Rincel. No necesitas registrarte otra vez. 💙'),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: /registro recibido/i })).toHaveCount(0)
  })

  test('error de conexión: mensaje claro, sin confirmación y permite reintentar', async ({ page }) => {
    await fakeTurnstile(page)
    let attempt = 0
    await mockApi(page, (r) => (++attempt === 1 ? r.abort('internetdisconnected') : r.fulfill({ status: 201, json: { status: 'ok' } })))
    await page.goto(LIVE)
    await fillValid(page)
    await submit(page).click()
    await expect(page.getByRole('alert')).toContainText('No pudimos conectar con el servidor')
    await expect(page.getByRole('heading', { name: /registro recibido/i })).toHaveCount(0)
    await expect(page.locator('#campo-nombre')).toHaveValue(NOMBRE) // no se pierden los datos
    await page.waitForTimeout(200)
    await submit(page).click()
    await expect(page.getByRole('heading', { name: /registro recibido/i })).toBeVisible()
  })

  test('error del servidor: no muestra confirmación', async ({ page }) => {
    await fakeTurnstile(page)
    await mockApi(page, (r) => r.fulfill({ status: 502, body: '<html>Bad gateway</html>' }))
    await page.goto(LIVE)
    await fillValid(page)
    await submit(page).click()
    await expect(page.getByRole('alert')).toContainText('No pudimos guardar tu registro')
    await expect(page.getByRole('heading', { name: /registro recibido/i })).toHaveCount(0)
  })

  test('errores por campo devueltos por el servidor se muestran en el campo', async ({ page }) => {
    await fakeTurnstile(page)
    await mockApi(page, (r) =>
      r.fulfill({ status: 422, json: { status: 'invalid', message: 'Revisa los datos marcados e inténtalo de nuevo.', errors: { telefono: 'Número rechazado por el servidor.' } } }),
    )
    await page.goto(LIVE)
    await fillValid(page)
    await submit(page).click()
    await expect(page.getByText('Número rechazado por el servidor.')).toBeVisible()
  })

  test('sin verificación anti-bots no se envía nada', async ({ page }) => {
    await page.route('https://challenges.cloudflare.com/**', (r) => r.abort())
    const bodies = await mockApi(page, (r) => r.fulfill({ status: 201, json: { status: 'ok' } }))
    await page.goto(LIVE)
    await fillValid(page)
    await submit(page).click()
    await expect(page.getByRole('alert')).toContainText('verificación de seguridad')
    expect(bodies).toHaveLength(0)
  })
})

test.describe('modo demostración', () => {
  test('no envía ningún dato a la red', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (r) => {
      if (r.method() !== 'GET') requests.push(r.url())
    })
    await page.goto(DEMO)
    await fillValid(page)
    await submit(page).click()
    await expect(page.getByRole('heading', { name: /registro recibido/i })).toBeVisible()
    await expect(page.getByText(/este registro NO se guardó/)).toBeVisible()
    expect(requests).toEqual([])
  })
})
