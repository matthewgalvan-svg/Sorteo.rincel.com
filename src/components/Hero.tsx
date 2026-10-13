import { Button } from './Button'
import { Rincelito } from './Rincelito'
import { Sparks } from './Sparks'

export function Hero({ onParticipate }: { onParticipate: () => void }) {
  return (
    <section id="inicio" aria-labelledby="hero-title" className="relative z-10">
      <div className="mx-auto grid max-w-6xl items-center gap-4 px-4 pb-16 pt-2 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:pb-24 lg:pt-6">
        <div className="animate-pop-in text-center lg:text-left">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.2em] text-white ring-1 ring-white/30 backdrop-blur-sm sm:text-sm">
            <span className="size-2 rounded-full bg-rincel-orange" /> Participación gratuita
          </p>

          <h1 id="hero-title" className="campaign-title relative font-black uppercase leading-[0.95] text-white">
            <Sparks className="absolute -left-2 -top-6 hidden size-12 sm:block lg:-left-14 lg:top-2" />
            <span className="block text-[2.6rem] sm:text-6xl lg:text-7xl">¡Gran</span>
            <span className="my-2 inline-block -rotate-2 rounded-[1.6rem] bg-gradient-to-b from-[#ffbe3d] to-rincel-orange px-5 pb-2 pt-1 text-[3.3rem] text-white shadow-[0_8px_0_#c47f06,0_18px_40px_rgb(33_32_68/0.4)] sm:text-7xl lg:text-8xl">
              Sorteo
            </span>
            <span className="block text-[1.65rem] sm:text-4xl lg:text-5xl">de Inauguración Rincel!</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-xl font-extrabold text-white sm:text-2xl lg:mx-0">
            ¡Participa gratis para ganar uno de nuestros <span className="whitespace-nowrap text-rincel-orange">3 celulares</span>!
          </p>
          <p className="mx-auto mt-3 max-w-lg text-base font-semibold text-rincel-light-blue sm:text-lg lg:mx-0">
            Muy pronto inauguramos nuestra nueva sucursal y queremos celebrarlo contigo.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button type="button" onClick={onParticipate} className="w-full max-w-xs sm:w-auto sm:max-w-none">
              ¡Quiero participar!
            </Button>
            <a href="#como-participar" className="rounded-full px-4 py-2 text-sm font-bold text-white underline-offset-4 hover:underline">
              ¿Cómo funciona?
            </a>
          </div>
        </div>

        <div className="relative order-first mx-auto w-full max-w-[17rem] sm:max-w-sm lg:order-none lg:max-w-none">
          <div aria-hidden="true" className="absolute inset-[8%] rounded-full bg-rincel-cyan/50 blur-3xl" />
          <div className="animate-float relative">
            <Rincelito
              priority
              className="relative w-full rounded-[2.5rem] shadow-[0_30px_60px_rgb(33_32_68/0.45)] ring-4 ring-white/25"
            />
          </div>
          <Sparks flip className="absolute -right-6 top-2 size-10 sm:-right-2 sm:size-14" />
        </div>
      </div>

      {/* Onda inferior hacia la sección blanca */}
      <svg aria-hidden="true" viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute -bottom-px left-0 h-10 w-full sm:h-16">
        <path d="M0 40 C 360 90, 720 0, 1080 30 C 1260 45, 1380 60, 1440 50 L1440 80 L0 80 Z" fill="#ffffff" />
      </svg>
    </section>
  )
}
