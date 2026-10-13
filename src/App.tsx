import { useCallback, useState } from 'react'
import { IS_DEMO } from './config'
import { BasesSummary } from './components/BasesSummary'
import { CampaignBackground } from './components/CampaignBackground'
import { DemoBanner } from './components/DemoBanner'
import { Hero } from './components/Hero'
import { HowToParticipate } from './components/HowToParticipate'
import { PrizeStrip } from './components/PrizeStrip'
import { RegistrationSection } from './components/RegistrationSection'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'

// Solo en demostración: ?vista=confirmacion abre directamente la pantalla de confirmación para revisarla.
const previewConfirmation = IS_DEMO && new URLSearchParams(window.location.search).get('vista') === 'confirmacion'

export default function App() {
  const [registered, setRegistered] = useState(previewConfirmation)

  const goToForm = useCallback(() => {
    document.getElementById('registro')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Enfoca el primer campo sin interrumpir el desplazamiento suave
    window.setTimeout(() => document.getElementById('campo-nombre')?.focus({ preventScroll: true }), 600)
  }, [])

  const handleSuccess = useCallback(() => {
    setRegistered(true)
    requestAnimationFrame(() =>
      document.getElementById('registro')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }, [])

  return (
    <>
      <a
        href="#registro"
        className="sr-only z-50 rounded-full bg-white px-4 py-2 font-bold text-rincel-blue focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Ir al formulario de registro
      </a>
      <DemoBanner />
      <div className="relative overflow-hidden">
        <CampaignBackground />
        <SiteHeader />
        <main>
          <Hero onParticipate={goToForm} />
        </main>
      </div>
      <div className="relative">
        <PrizeStrip />
        <HowToParticipate />
        <RegistrationSection registered={registered} onSuccess={handleSuccess} onReset={() => setRegistered(false)} />
        <BasesSummary />
      </div>
      <SiteFooter />
    </>
  )
}
