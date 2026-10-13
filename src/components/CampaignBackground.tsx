/** Fondo decorativo con los colores corporativos: degradado azul, arcos de luz y círculos de acento. */
export function CampaignBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_80%_10%,#4ec2d1_0%,#1e76ba_38%,#1a5d9c_62%,#212044_100%)]" />
      <div className="animate-drift absolute -right-28 -top-28 size-56 rounded-full bg-rincel-orange/90 blur-[2px] sm:size-96" />
      <div className="animate-drift absolute -bottom-32 -left-20 size-72 rounded-full bg-rincel-cyan/40 blur-2xl [animation-delay:-6s]" />
      <div className="absolute -bottom-16 left-1/3 size-40 rounded-full bg-rincel-orange/80 blur-[1px]" />
      <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 1200 700" preserveAspectRatio="none">
        <defs>
          <linearGradient id="arc" x1="0" x2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#4ec2d1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M-50 560 C 300 420, 700 720, 1250 470" fill="none" stroke="url(#arc)" strokeWidth="3" />
        <path d="M-50 620 C 360 500, 760 760, 1250 560" fill="none" stroke="url(#arc)" strokeWidth="1.5" />
        <path d="M200 -20 C 420 160, 380 420, 760 720" fill="none" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="60" />
      </svg>
      <div className="absolute right-[8%] top-[18%] grid grid-cols-5 gap-2 opacity-40">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="size-1.5 rounded-full bg-rincel-cyan" />
        ))}
      </div>
    </div>
  )
}
