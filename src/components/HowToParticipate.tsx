import { Section } from './Section'

const steps = [
  { icon: '📝', title: 'Regístrate', text: 'Ingresa tu nombre y número celular.' },
  { icon: '🔔', title: 'Mantente pendiente', text: 'Próximamente anunciaremos la fecha de inauguración.' },
  { icon: '🎉', title: 'Acompáñanos', text: 'Asiste al evento y participa conforme a las bases oficiales.' },
]

export function HowToParticipate() {
  return (
    <Section id="como-participar" eyebrow="Así de fácil" title="¿Cómo participar?">
      <ol className="relative grid gap-5 md:grid-cols-3 md:gap-6">
        <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-10 hidden h-1 rounded-full bg-gradient-to-r from-rincel-blue via-rincel-cyan to-rincel-blue md:block" />
        {steps.map((step, i) => (
          <li
            key={step.title}
            className="group relative flex items-start gap-4 rounded-3xl bg-white p-5 shadow-[0_10px_30px_rgb(30_118_186/0.12)] ring-1 ring-rincel-light-blue transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgb(30_118_186/0.2)] md:flex-col md:items-center md:p-7 md:text-center"
          >
            <span className="relative grid size-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rincel-blue to-rincel-cyan text-4xl shadow-lg shadow-rincel-blue/30 ring-4 ring-white">
              <span aria-hidden="true">{step.icon}</span>
              <span className="absolute -right-1 -top-1 grid size-8 place-items-center rounded-full bg-rincel-orange text-sm font-black text-rincel-dark ring-2 ring-white">
                {i + 1}
              </span>
            </span>
            <div>
              <h3 className="text-xl font-black text-rincel-blue">{step.title}</h3>
              <p className="mt-1 font-semibold text-rincel-dark/75">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}
