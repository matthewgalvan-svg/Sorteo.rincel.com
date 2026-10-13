import { IS_DEMO } from '../config'

export function DemoBanner() {
  if (!IS_DEMO) return null
  return (
    <div role="note" className="bg-rincel-dark px-4 py-2 text-center text-xs font-bold text-white sm:text-sm">
      <span className="mr-2 inline-block rounded-full bg-rincel-orange px-2 py-0.5 text-[0.7rem] uppercase tracking-wider text-rincel-dark">
        Modo demostración
      </span>
      Vista previa: el registro todavía no está activo y no se guarda ningún dato.
    </div>
  )
}
