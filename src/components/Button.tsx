import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'promo' | 'primary' | 'ghost'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-black uppercase tracking-wide transition ' +
  'duration-200 focus-visible:outline-4 focus-visible:outline-offset-2 disabled:cursor-not-allowed min-h-12 px-7 py-3 text-base sm:text-lg'

const variants: Record<Variant, string> = {
  promo:
    'bg-rincel-orange text-rincel-dark shadow-[0_6px_0_#c47f06,0_14px_28px_rgb(33_32_68/0.35)] hover:-translate-y-0.5 ' +
    'hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_#c47f06] focus-visible:outline-white ' +
    'disabled:opacity-70 disabled:hover:translate-y-0',
  primary:
    'bg-rincel-blue text-white shadow-lg shadow-rincel-blue/30 hover:bg-[#1a68a5] active:translate-y-px ' +
    'focus-visible:outline-rincel-cyan',
  ghost: 'border-2 border-white/80 text-white hover:bg-white/10 focus-visible:outline-white',
}

export function Button({
  variant = 'promo',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function LinkButton({
  variant = 'primary',
  className = '',
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <a className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </a>
  )
}
