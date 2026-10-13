import { LINKS } from '../config'
import { Section } from './Section'

const bases = [
  'La participación es gratuita.',
  'Solo se permite una participación por persona.',
  'El registro se realiza con nombre y número telefónico.',
  'Los registros duplicados no generan participaciones adicionales.',
  'Es necesario estar presente durante la selección de ganadores.',
  'Los ganadores se anunciarán durante la inauguración.',
  'Para recibir el premio se deberá presentar identificación oficial.',
  'El procedimiento de suplentes se dará a conocer en las bases definitivas.',
  'Se sortearán tres celulares; los modelos se anunciarán posteriormente.',
  'Los datos se tratarán conforme al aviso de privacidad.',
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
