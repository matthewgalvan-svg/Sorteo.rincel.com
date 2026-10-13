import logoColor from '../assets/brand/rincel-logo.svg'
import logoWhite from '../assets/brand/rincel-logo-white.svg'

interface LogoProps {
  variant?: 'color' | 'white'
  className?: string
}

/** Logotipo oficial extraído del PDF "Logo RINCEL ITC 2025" (vectorial, sin modificaciones de forma). */
export function Logo({ variant = 'color', className = '' }: LogoProps) {
  return (
    <img
      src={variant === 'white' ? logoWhite : logoColor}
      alt="Rincel — Internet, Telefonía, Celulares"
      width={1287}
      height={535}
      className={className}
      decoding="async"
    />
  )
}
