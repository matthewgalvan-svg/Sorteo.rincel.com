import small from '../assets/campaign/rincelito-celulares-440.webp'
import large from '../assets/campaign/rincelito-celulares-780.webp'

interface RincelitoProps {
  className?: string
  priority?: boolean
  sizes?: string
}

/** Rincelito con lentes sosteniendo los tres celulares (recorte del encabezado oficial de la campaña). */
export function Rincelito({ className = '', priority = false, sizes = '(min-width: 1024px) 520px, 90vw' }: RincelitoProps) {
  return (
    <img
      src={large}
      srcSet={`${small} 440w, ${large} 780w`}
      sizes={sizes}
      width={780}
      height={667}
      alt="Rincelito, la mascota de Rincel, con lentes y sosteniendo tres celulares"
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
    />
  )
}
