import { Confirmation } from './Confirmation'
import { RegistrationForm } from './RegistrationForm'

interface Props {
  registered: boolean
  onSuccess: () => void
  onReset: () => void
}

export function RegistrationSection({ registered, onSuccess, onReset }: Props) {
  return (
    <section id="registro" aria-labelledby="registro-title" className="scroll-mt-4 bg-gradient-to-b from-rincel-light-blue/60 to-white px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-xl">
        {registered ? (
          <Confirmation onReset={onReset} />
        ) : (
          <div className="rounded-[2rem] bg-white p-5 shadow-[0_24px_60px_rgb(30_118_186/0.18)] ring-1 ring-rincel-light-blue sm:p-9">
            <div className="mb-7 text-center">
              <p className="mx-auto mb-3 inline-block rounded-full bg-rincel-orange px-4 py-1 text-xs font-black uppercase tracking-[0.2em] text-rincel-dark">
                Registro gratuito
              </p>
              <h2 id="registro-title" className="text-3xl font-black text-rincel-dark sm:text-4xl">
                Registra tu participación
              </h2>
              <p className="mt-2 font-semibold text-rincel-dark/70">Te toma menos de un minuto.</p>
            </div>
            <RegistrationForm onSuccess={onSuccess} />
          </div>
        )}
      </div>
    </section>
  )
}
