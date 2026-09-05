import { AddButton } from '@/ui/primitives/AddButton'
import { Button } from '@/ui/primitives/Button'
import { IconButton } from '@/ui/primitives/IconButton'
import { KeyHint } from '@/ui/primitives/KeyHint'
import { GalleryRow, GallerySection } from './GallerySection'

export function ButtonsSection() {
  return (
    <GallerySection title="Botões e teclas" note="altura 28 · raio 6">
      <GalleryRow label="28px">
        <Button variant="primary" keys="mod+n">
          Novo projeto
        </Button>
        <Button variant="secondary">Secundário</Button>
        <Button variant="ghost">Fantasma</Button>
        <Button variant="danger">Bloquear</Button>
        <Button disabled>Desabilitado</Button>
        <IconButton label="Adicionar">+</IconButton>
      </GalleryRow>

      <GalleryRow label="24px">
        <Button variant="danger" size="small">
          Escolher pasta
        </Button>
        <Button variant="secondary" size="small">
          Simular
        </Button>
      </GalleryRow>

      <GalleryRow label="inline tracejado">
        <AddButton keys="t">+ Nova tarefa</AddButton>
        <AddButton keys="n">+ Novo item</AddButton>
      </GalleryRow>

      <GalleryRow label="chevron 16px">
        <IconButton label="Expandir" size="small">
          ▼
        </IconButton>
        <IconButton label="Recolher" size="small">
          ►
        </IconButton>
      </GalleryRow>

      <GalleryRow label="KeyHint cap">
        <KeyHint keys="mod+k" />
        <KeyHint keys="g t" />
        <KeyHint keys="mod+enter" />
        <KeyHint keys="space" />
        <KeyHint keys="escape" />
      </GalleryRow>

      <GalleryRow label="KeyHint muted">
        <KeyHint keys="mod+b" variant="muted" />
      </GalleryRow>

      <GalleryRow label="KeyHint nav">
        <KeyHint keys="g p" variant="nav" />
      </GalleryRow>
    </GallerySection>
  )
}
