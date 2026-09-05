import { useState } from 'react'
import { Checkbox } from '@/ui/primitives/Checkbox'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Input } from '@/ui/primitives/Input'
import { Select } from '@/ui/primitives/Select'
import { StaticField } from '@/ui/primitives/StaticField'
import { Textarea } from '@/ui/primitives/Textarea'
import { GallerySection } from './GallerySection'

export function FormSection() {
  const [closeAllocations, setCloseAllocations] = useState(true)
  const [notifyToday, setNotifyToday] = useState(false)

  return (
    <GallerySection title="Formulário" note="foco com anel de --accent-soft">
      <div className="grid max-w-[720px] gap-3 rounded-card border border-border bg-panel p-3.5">
        <FieldGroup label="Nome do projeto" htmlFor="gallery-name">
          <Input id="gallery-name" defaultValue="Migração do gateway" />
        </FieldGroup>

        <FieldGroup label="Fase" htmlFor="gallery-phase">
          <Select id="gallery-phase" defaultValue="dev">
            <option value="dev">Desenvolvimento</option>
            <option value="hi">Homologação interna</option>
          </Select>
        </FieldGroup>

        <div className="grid grid-cols-2 gap-2.5">
          <FieldGroup label="Início" htmlFor="gallery-start">
            <Input id="gallery-start" numeric defaultValue="12/03/2026" />
          </FieldGroup>
          <FieldGroup label="Estimativa" htmlFor="gallery-effort">
            <Input id="gallery-effort" numeric defaultValue="120h" />
          </FieldGroup>
        </div>

        <FieldGroup label="Data de retomada" htmlFor="gallery-resume" error="Data inválida.">
          <Input id="gallery-resume" numeric invalid defaultValue="30/02/2026" />
        </FieldGroup>

        <FieldGroup label="Motivo do bloqueio" htmlFor="gallery-reason">
          <Textarea
            id="gallery-reason"
            defaultValue="Aguardando validação jurídica do contrato do parceiro."
          />
        </FieldGroup>

        <FieldGroup label="Alocações ativas">
          <StaticField>3 serão encerradas</StaticField>
        </FieldGroup>

        <div className="flex gap-3.5 pt-0.5">
          <Checkbox
            checked={closeAllocations}
            onChange={(event) => setCloseAllocations(event.target.checked)}
          >
            Encerrar alocações
          </Checkbox>
          <Checkbox checked={notifyToday} onChange={(event) => setNotifyToday(event.target.checked)}>
            Notificar no Hoje
          </Checkbox>
          <Checkbox disabled>Desabilitado</Checkbox>
        </div>
      </div>
    </GallerySection>
  )
}
