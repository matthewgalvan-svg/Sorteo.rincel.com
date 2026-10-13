import { LINKS } from '../config'
import { Logo } from './Logo'

export function SiteFooter() {
  return (
    <footer className="bg-rincel-dark px-4 pb-10 pt-12 text-white sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <Logo variant="white" className="h-14 w-auto" />
        <nav aria-label="Enlaces oficiales" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-bold">
          <a href={LINKS.sitioOficial} target="_blank" rel="noopener noreferrer" className="hover:text-rincel-cyan">
            rincel.com.mx
          </a>
          <a href={LINKS.bases} target="_blank" rel="noopener noreferrer" className="hover:text-rincel-cyan">
            Bases del sorteo
          </a>
          <a href={LINKS.privacidad} target="_blank" rel="noopener noreferrer" className="hover:text-rincel-cyan">
            Aviso de privacidad
          </a>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-5xl border-t border-white/10 pt-6 text-center text-xs font-semibold text-white/60">
        © {new Date().getFullYear()} Rincel · Internet · Telefonía · Celulares. Promoción sin costo y sin compra.
      </p>
    </footer>
  )
}
