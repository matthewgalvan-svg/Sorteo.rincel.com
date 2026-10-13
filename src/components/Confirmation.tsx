import { useEffect, useRef } from 'react'
import { IS_DEMO, LINKS } from '../config'
import { LinkButton } from './Button'
import { Rincelito } from './Rincelito'

const confetti = ['#f4a61d', '#4ec2d1', '#1e76ba', '#4d2c85', '#ffffff']

export function Confirmation({ onReset }: { onReset?: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="animate-pop-in relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-rincel-blue via-[#1a68a5] to-rincel-dark p-6 text-center text-white shadow-[0_24px_60px_rgb(30_118_186/0.35)] sm:p-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="animate-spark absolute block rounded-sm"
            style={{
              left: `${i % 2 ? 90 + ((i * 7) % 8) : 2 + ((i * 7) % 8)}%`,
              top: `${(i * 37) % 90}%`,
              width: 6 + (i % 3) * 3,
              height: 10 + (i % 4) * 3,
              background: confetti[i % confetti.length],
              transform: `rotate(${i * 29}deg)`,
              animationDelay: `${(i % 6) * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative">
        <Rincelito
          sizes="(min-width: 640px) 320px, 70vw"
          className="animate-float mx-auto w-64 rounded-[2rem] ring-4 ring-white/30 sm:w-80"
        />
        <h2 ref={headingRef} tabIndex={-1} className="campaign-title mt-6 text-3xl font-black uppercase outline-none sm:text-4xl">
          <span aria-hidden="true">🎉</span> ¡Registro recibido!
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg font-bold text-rincel-light-blue">
          Gracias por registrarte en el Gran Sorteo de Inauguración Rincel. Mantente pendiente de nuestros canales
          oficiales para conocer la fecha del evento.
        </p>

        {IS_DEMO && (
          <p className="mx-auto mt-4 max-w-md rounded-xl bg-rincel-orange/95 px-4 py-2 text-sm font-extrabold text-rincel-dark">
            Vista de demostración: este registro NO se guardó.
          </p>
        )}

        <div className="mt-7 flex flex-col items-center gap-3">
          <LinkButton href={LINKS.sitioOficial} target="_blank" rel="noopener noreferrer" variant="promo">
            Visitar rincel.com.mx
          </LinkButton>
          {IS_DEMO && onReset && (
            <button type="button" onClick={onReset} className="text-sm font-bold text-white underline underline-offset-4">
              Volver al formulario (demo)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
