import { LINKS } from '../config'
import { Section } from './Section'

// Resumen fiel de «RINCEL | BASES Y CONDICIONES DEL SORTEO DE INAUGURACIÓN» (bases provisionales).
const bases = [
  'La participación es completamente gratuita y no requiere realizar ninguna compra.',
  'Cada persona podrá participar una sola vez, utilizando un número telefónico de contacto.',
  'Para participar, es necesario registrar nombre completo y número de celular en el formulario oficial de Rincel.',
  'Los registros duplicados no otorgan participaciones adicionales.',
  'Los participantes deberán encontrarse físicamente en la sucursal durante la selección de ganadores.',
  'Los ganadores se anunciarán durante el evento de inauguración y se les llamará al número registrado.',
  'Para recibir el premio se deberá presentar una identificación oficial vigente que coincida con el nombre registrado.',
  'Si un ganador no está presente o no cumple los requisitos, se aplicará el procedimiento de suplentes de las bases definitivas.',
  'Los premios son tres teléfonos celulares; los modelos se anunciarán antes del inicio de la promoción.',
  'Los datos personales serán tratados conforme al aviso de privacidad de Rincel.',
]

export function BasesSummary() {
  return (
    <Section
      id="bases"
      eyebrow="Reglas claras"
      title="Resumen de las bases"
      intro="Este resumen no sustituye las bases oficiales. Consulta el documento completo antes de registrarte."
      className="bg-white"
    >
      <ol className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
        {bases.map((text, i) => (
          <li key={text} className="flex items-start gap-3 rounded-2xl bg-rincel-light-blue/40 p-4 font-semibold text-rincel-dark">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-rincel-blue text-sm font-black text-white">
              {i + 1}
            </span>
            <span className="pt-1">{text}</span>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
        <a
          href={LINKS.bases}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-rincel-blue px-6 font-extrabold text-white shadow-lg shadow-rincel-blue/30 hover:bg-[#1a68a5]"
        >
          📄 Leer bases completas
        </a>
        <a
          href={LINKS.privacidad}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center gap-2 rounded-full px-6 font-extrabold text-rincel-blue ring-2 ring-rincel-blue hover:bg-rincel-light-blue/50"
        >
          🔒 Aviso de privacidad
        </a>
      </div>
    </Section>
  )
}
