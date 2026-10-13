import type { ReactNode } from 'react'
import { useReveal } from '../hooks/useReveal'

interface SectionProps {
  id: string
  eyebrow?: string
  title: string
  intro?: ReactNode
  children: ReactNode
  className?: string
}

export function Section({ id, eyebrow, title, intro, children, className = '' }: SectionProps) {
  const ref = useReveal<HTMLElement>()
  const titleId = `${id}-title`
  return (
    <section id={id} ref={ref} aria-labelledby={titleId} className={`reveal scroll-mt-4 px-4 py-14 sm:px-6 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          {eyebrow && (
            <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.2em] text-rincel-cyan">{eyebrow}</p>
          )}
          <h2 id={titleId} className="text-3xl font-black text-rincel-dark sm:text-4xl">
            {title}
          </h2>
          {intro && <div className="mt-3 text-base font-semibold text-rincel-dark/70 sm:text-lg">{intro}</div>}
        </div>
        {children}
      </div>
    </section>
  )
}
