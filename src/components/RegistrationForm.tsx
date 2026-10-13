import { useRef, useState, type FormEvent } from 'react'
import { IS_DEMO, LINKS, TURNSTILE_SITE_KEY } from '../config'
import { DEMO_PHONES, DUPLICATE_MESSAGE, submitRegistration } from '../lib/register'
import { normalizeName, validateRegistration, type FieldErrors, type RegistrationInput } from '../lib/validation'
import { Button } from './Button'
import { CheckboxField, TextField } from './FormFields'
import { Turnstile, type TurnstileHandle } from './Turnstile'

const linkClass = 'font-extrabold text-rincel-blue underline underline-offset-2 hover:text-rincel-purple'

type Notice = { kind: 'duplicate' | 'error'; message: string } | null

export function RegistrationForm({ onSuccess }: { onSuccess: () => void }) {
  const [values, setValues] = useState<RegistrationInput>({
    nombre: '',
    telefono: '',
    aceptaBases: false,
    aceptaPromociones: false,
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [attempted, setAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const inFlight = useRef(false)
  const honeypot = useRef<HTMLInputElement>(null)
  const startedAt = useRef(performance.now())
  const turnstile = useRef<TurnstileHandle>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileFailed, setTurnstileFailed] = useState(false)
  const needsTurnstile = !IS_DEMO

  function update<K extends keyof RegistrationInput>(key: K, value: RegistrationInput[K]) {
    const next = { ...values, [key]: value }
    setValues(next)
    setNotice(null)
    if (attempted) setErrors(validateRegistration(next))
  }

  function validateField(key: keyof FieldErrors) {
    const fieldError = validateRegistration(values)[key]
    setErrors((prev) => ({ ...prev, [key]: fieldError }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return // evita doble envío por doble clic o doble toque

    setAttempted(true)
    const found = validateRegistration(values)
    setErrors(found)
    const firstInvalid = (['nombre', 'telefono', 'aceptaBases'] as const).find((k) => found[k])
    if (firstInvalid) {
      document.getElementById(`campo-${firstInvalid}`)?.focus()
      return
    }

    if (needsTurnstile && !TURNSTILE_SITE_KEY) {
      setNotice({ kind: 'error', message: 'El registro todavía no está disponible. Inténtalo más tarde.' })
      return
    }
    if (needsTurnstile && !turnstileToken) {
      setNotice({
        kind: 'error',
        message: turnstileFailed
          ? 'No se pudo cargar la verificación de seguridad. Revisa tu conexión y recarga la página.'
          : 'Espera a que termine la verificación de seguridad e inténtalo de nuevo.',
      })
      return
    }

    inFlight.current = true
    setSubmitting(true)
    setNotice(null)
    try {
      const result = await submitRegistration(values, {
        turnstileToken,
        // Campo trampa: los bots suelen llenarlo; el servidor rechaza el envío si trae algo.
        honeypot: honeypot.current?.value ?? '',
        elapsedMs: performance.now() - startedAt.current,
      })
      if (result.status === 'ok') {
        onSuccess()
        return
      }
      if (result.status === 'duplicate') setNotice({ kind: 'duplicate', message: DUPLICATE_MESSAGE })
      else {
        if (result.status === 'invalid') setErrors(result.errors)
        setNotice({ kind: 'error', message: result.message })
      }
      // Los tokens de Turnstile son de un solo uso: se solicita uno nuevo para el siguiente intento.
      if (needsTurnstile) turnstile.current?.reset()
    } catch {
      setNotice({
        kind: 'error',
        message: 'Ocurrió un problema al enviar tu registro. Revisa tu conexión e inténtalo de nuevo.',
      })
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} aria-busy={submitting} className="space-y-5">
      <TextField
        id="campo-nombre"
        name="nombre"
        label="Nombre completo"
        placeholder="Nombre y apellidos"
        autoComplete="name"
        autoCapitalize="words"
        enterKeyHint="next"
        maxLength={80}
        value={values.nombre}
        error={errors.nombre}
        onChange={(e) => update('nombre', e.target.value)}
        onBlur={() => {
          if (!values.nombre) return
          update('nombre', normalizeName(values.nombre))
          validateField('nombre')
        }}
        disabled={submitting}
        required
      />

      <TextField
        id="campo-telefono"
        name="telefono"
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        label="Número celular"
        placeholder="10 dígitos"
        hint="Escribe los 10 dígitos, sin lada internacional."
        autoComplete="tel-national"
        enterKeyHint="done"
        maxLength={16}
        value={values.telefono}
        error={errors.telefono}
        onChange={(e) => update('telefono', e.target.value)}
        onBlur={() => values.telefono && validateField('telefono')}
        disabled={submitting}
        required
      />

      {/* Campo trampa anti-spam (oculto para personas y lectores de pantalla) */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="campo-hp">Deja este campo vacío</label>
        <input ref={honeypot} id="campo-hp" name="hp_no_llenar" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="rounded-2xl bg-rincel-light-blue/60 p-4 text-sm font-semibold leading-relaxed text-rincel-dark">
        <p className="mb-1 flex items-center gap-2 font-black text-rincel-blue">
          <span aria-hidden="true">🔒</span> Aviso de privacidad
        </p>
        Solo te pedimos nombre y número celular. Rincel tratará tus datos conforme a su{' '}
        <a href={LINKS.privacidad} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Aviso de privacidad
        </a>
        . Este registro no solicita INE, CURP, dirección ni correo electrónico.
      </div>

      <CheckboxField
        id="campo-aceptaBases"
        name="aceptaBases"
        checked={values.aceptaBases}
        error={errors.aceptaBases}
        onChange={(e) => update('aceptaBases', e.target.checked)}
        disabled={submitting}
        required
      >
        He leído y acepto las{' '}
        <a href={LINKS.bases} target="_blank" rel="noopener noreferrer" className={linkClass}>
          bases del sorteo
        </a>{' '}
        y conozco el{' '}
        <a href={LINKS.privacidad} target="_blank" rel="noopener noreferrer" className={linkClass}>
          aviso de privacidad
        </a>
        . <span className="text-rincel-blue" aria-hidden="true">*</span>
      </CheckboxField>

      <CheckboxField
        id="campo-aceptaPromociones"
        name="aceptaPromociones"
        checked={values.aceptaPromociones}
        onChange={(e) => update('aceptaPromociones', e.target.checked)}
        disabled={submitting}
        optional
      >
        Deseo recibir promociones y novedades de Rincel por WhatsApp o SMS
      </CheckboxField>

      {needsTurnstile && TURNSTILE_SITE_KEY && (
        <Turnstile
          ref={turnstile}
          siteKey={TURNSTILE_SITE_KEY}
          onToken={(token) => {
            setTurnstileToken(token)
            if (token) setTurnstileFailed(false)
          }}
          onError={() => setTurnstileFailed(true)}
        />
      )}

      <div aria-live="polite" aria-atomic="true">
        {notice && (
          <div
            role={notice.kind === 'error' ? 'alert' : 'status'}
            className={
              'rounded-2xl p-4 text-base font-bold ' +
              (notice.kind === 'duplicate'
                ? 'bg-rincel-light-blue text-rincel-blue ring-2 ring-rincel-blue/30'
                : 'bg-rincel-error/8 text-rincel-error ring-2 ring-rincel-error/30')
            }
          >
            {notice.message}
          </div>
        )}
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? (
          <>
            <span aria-hidden="true" className="size-5 animate-spin rounded-full border-3 border-rincel-dark/30 border-t-rincel-dark" />
            Enviando registro…
          </>
        ) : (
          '¡Registrar mi participación!'
        )}
      </Button>

      <p className="text-center text-xs font-semibold text-rincel-dark/55">
        <span aria-hidden="true">*</span> Campos obligatorios. Participación gratuita, sin compra.
      </p>

      {IS_DEMO && (
        <details className="rounded-2xl border-2 border-dashed border-rincel-orange/70 p-4 text-sm font-semibold text-rincel-dark/80">
          <summary className="cursor-pointer font-black text-rincel-dark">Modo demostración: cómo probar los mensajes</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Cualquier número válido muestra la pantalla de confirmación (no se guarda nada).</li>
            <li>
              <code className="font-mono">{DEMO_PHONES.duplicate}</code> simula un número ya registrado.
            </li>
            <li>
              <code className="font-mono">{DEMO_PHONES.networkError}</code> simula un error de conexión.
            </li>
          </ul>
        </details>
      )}
    </form>
  )
}
