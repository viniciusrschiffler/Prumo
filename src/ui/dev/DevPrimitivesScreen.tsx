import { ScreenShell } from '@/ui/screens/ScreenShell'
import { BadgesSection } from './BadgesSection'
import { ButtonsSection } from './ButtonsSection'
import { FeedbackSection } from './FeedbackSection'
import { FormSection } from './FormSection'
import { SurfacesSection } from './SurfacesSection'
import { TableSection } from './TableSection'

export function DevPrimitivesScreen() {
  return (
    <ScreenShell title="Primitivos" subhead="catálogo de desenvolvimento · compare com o Sistema de Design">
      <div className="grid gap-8 pb-8">
        <ButtonsSection />
        <FormSection />
        <BadgesSection />
        <TableSection />
        <FeedbackSection />
        <SurfacesSection />
      </div>
    </ScreenShell>
  )
}
