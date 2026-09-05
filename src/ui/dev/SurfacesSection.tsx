import { useState } from 'react'
import { useToastStore } from '@/app/stores/useToastStore'
import { Button } from '@/ui/primitives/Button'
import { ColorSwatchPicker } from '@/ui/primitives/ColorSwatchPicker'
import { SectionCard } from '@/ui/primitives/SectionCard'
import { SegmentedControl } from '@/ui/primitives/SegmentedControl'
import { GalleryRow, GallerySection } from './GallerySection'
import { SAMPLE_PHASES } from './samplePhases'

const SAMPLE_COLORS = SAMPLE_PHASES.map((phase) => phase.color)

const UNIT_OPTIONS = [
  { value: 'percentage', label: '%' },
  { value: 'hours', label: 'Horas' },
] as const

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
] as const

export function SurfacesSection() {
  const [unit, setUnit] = useState<(typeof UNIT_OPTIONS)[number]['value']>('percentage')
  const [theme, setTheme] = useState<(typeof THEME_OPTIONS)[number]['value']>('system')
  const [color, setColor] = useState<string>(SAMPLE_COLORS[0] ?? '')
  const notify = useToastStore((state) => state.notify)

  return (
    <GallerySection title="Superfícies e controles" note="card de seção, segmentado, cor, aviso">
      <div className="grid max-w-[720px] gap-2.5">
        <SectionCard
          title="Pessoas"
          note={<span className="font-mono">3 ativas · 1 inativas</span>}
          action={
            <Button variant="primary" size="small">
              Nova pessoa
            </Button>
          }
        >
          <div className="grid gap-3 p-3.5">
            <GalleryRow label="segmentado">
              <SegmentedControl
                options={UNIT_OPTIONS}
                value={unit}
                onChange={setUnit}
                label="Unidade"
              />
              <SegmentedControl
                options={THEME_OPTIONS}
                value={theme}
                onChange={setTheme}
                label="Tema"
                size="wide"
              />
            </GalleryRow>

            <GalleryRow label="cor de fase">
              <ColorSwatchPicker
                colors={SAMPLE_COLORS}
                value={color}
                onChange={setColor}
                label="Cor da fase"
              />
              <span className="text-label font-normal text-text3">setas movem a seleção</span>
            </GalleryRow>

            <GalleryRow label="aviso">
              <Button onClick={() => notify('Gravado nesta pasta.')}>Avisar sucesso</Button>
              <Button
                variant="danger"
                onClick={() => notify('Não foi possível gravar.', 'danger')}
              >
                Avisar falha
              </Button>
            </GalleryRow>
          </div>
        </SectionCard>

        <SectionCard
          title="Integridade dos dados"
          note="verificado 14:22 · sem erros"
          tone="danger"
        >
          <div className="flex items-center gap-2.5 p-3.5">
            <Button>Verificar arquivos</Button>
            <Button variant="danger" className="ml-auto">
              Apagar todos os dados locais
            </Button>
          </div>
        </SectionCard>
      </div>
    </GallerySection>
  )
}
