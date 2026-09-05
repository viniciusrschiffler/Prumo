import { useState } from 'react'
import { AddButton } from '@/ui/primitives/AddButton'
import { Alert } from '@/ui/primitives/Alert'
import { Button } from '@/ui/primitives/Button'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { Modal } from '@/ui/primitives/Modal'
import { PersonAvatar } from '@/ui/primitives/PersonAvatar'
import { ProgressBar } from '@/ui/primitives/ProgressBar'
import { StaticField } from '@/ui/primitives/StaticField'
import { Textarea } from '@/ui/primitives/Textarea'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Input } from '@/ui/primitives/Input'
import { Toast } from '@/ui/primitives/Toast'
import { Tooltip } from '@/ui/primitives/Tooltip'
import { IconButton } from '@/ui/primitives/IconButton'
import { GalleryRow, GallerySection } from './GallerySection'
import { SAMPLE_PHASES } from './samplePhases'

export function FeedbackSection() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <GallerySection title="Alertas e vazio">
        <div className="grid max-w-[720px] gap-2.5">
          <Alert
            level="danger"
            title="Pasta de dados inacessível"
            action={
              <Button variant="danger" size="small">
                Escolher pasta
              </Button>
            }
          >
            ~/Documentos/prumo não respondeu. As alterações não foram gravadas.
          </Alert>

          <Alert
            level="warn"
            title="Conflito de alocação"
            action={
              <Button variant="secondary" size="small">
                Simular
              </Button>
            }
          >
            Rafael Brito fica em 150% entre 01/06 e 26/06.
          </Alert>

          <Alert level="info" title="Baseline criada">
            Motivo: replanejamento após mudança de escopo · 12/03/2026.
          </Alert>

          <EmptyState
            title="Nenhuma tarefa nesta fase"
            description="Crie a primeira tarefa de Homologação externa para começar a planejar datas e alocações."
            action={
              <Button variant="primary" keys="t">
                Nova tarefa
              </Button>
            }
          />
        </div>
      </GallerySection>

      <GallerySection title="Progresso, pessoas e sobreposição">
        <GalleryRow label="progresso">
          <ProgressBar value={0.62} className="w-[200px]" />
          <ProgressBar
            segments={[
              { ratio: 0.34, color: SAMPLE_PHASES[0].color },
              { ratio: 0.18, color: SAMPLE_PHASES[1].color },
              { ratio: 0.1, color: SAMPLE_PHASES[2].color },
            ]}
            className="w-[200px]"
          />
          <ProgressBar value={0.6} hatched className="w-[200px]" />
        </GalleryRow>

        <GalleryRow label="pessoas">
          <PersonAvatar initials="AN" name="Ana Nogueira" />
          <PersonAvatar initials="RB" name="Rafael Brito" tone="danger" />
          <span className="text-label font-normal text-text3">RB em 150% · sobrealocado</span>
        </GalleryRow>

        <GalleryRow label="tooltip">
          <Tooltip label="Bloquear projeto" keys="mod+b">
            <IconButton label="Bloquear">⦸</IconButton>
          </Tooltip>
          <span className="text-label font-normal text-text3">passe o cursor</span>
        </GalleryRow>

        <GalleryRow label="modal">
          <Button variant="danger" onClick={() => setModalOpen(true)}>
            Abrir modal
          </Button>
          <span className="text-label font-normal text-text3">
            esc fecha · ⌘↵ submete · tab fica preso
          </span>
        </GalleryRow>

        <GalleryRow label="toast">
          <Toast>Gravado às 14:22</Toast>
          <Toast tone="danger" action={<AddButton>Tentar de novo</AddButton>}>
            Não foi possível gravar
          </Toast>
        </GalleryRow>
      </GallerySection>

      <Modal
        open={modalOpen}
        title="Bloquear “Portal do parceiro”"
        tone="danger"
        hint="Registra evento de bloqueio no histórico."
        submitLabel="Bloquear"
        submitVariant="danger"
        onClose={() => setModalOpen(false)}
        onSubmit={() => setModalOpen(false)}
      >
        <FieldGroup label="Motivo do bloqueio" htmlFor="modal-reason">
          <Textarea
            id="modal-reason"
            defaultValue="Aguardando validação jurídica do contrato do parceiro."
          />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-2.5">
          <FieldGroup label="Retomada prevista" htmlFor="modal-resume">
            <Input id="modal-resume" numeric defaultValue="27/04/2026" />
          </FieldGroup>
          <FieldGroup label="Alocações ativas">
            <StaticField>3 serão encerradas</StaticField>
          </FieldGroup>
        </div>
      </Modal>
    </>
  )
}
