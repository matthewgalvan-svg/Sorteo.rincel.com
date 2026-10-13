import { Logo } from './Logo'

export function SiteHeader() {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="#inicio" className="rounded-lg focus-visible:outline-3 focus-visible:outline-white" aria-label="Inicio — Rincel">
          <Logo variant="white" className="h-12 w-auto sm:h-14" />
        </a>
        <nav aria-label="Secciones" className="flex items-center gap-1 text-sm font-extrabold text-white sm:gap-3">
          <a href="#como-participar" className="hidden rounded-full px-3 py-2 hover:bg-white/10 sm:inline">
            Cómo participar
          </a>
          <a href="#bases" className="hidden rounded-full px-3 py-2 hover:bg-white/10 sm:inline">
            Bases
          </a>
          <a
            href="#registro"
            className="rounded-full bg-white px-4 py-2 text-rincel-blue shadow-md transition hover:bg-rincel-light-blue"
          >
            Participar
          </a>
        </nav>
      </div>
    </header>
  )
}
