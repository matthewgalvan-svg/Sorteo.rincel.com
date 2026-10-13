/** Destellos naranjas como los del encabezado oficial. */
export function Sparks({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 60 60"
      className={`animate-spark ${flip ? '-scale-x-100' : ''} ${className}`}
    >
      <g stroke="#f4a61d" strokeWidth="7" strokeLinecap="round">
        <path d="M30 6 L36 26" />
        <path d="M8 22 L28 32" />
        <path d="M10 50 L28 42" />
      </g>
    </svg>
  )
}
