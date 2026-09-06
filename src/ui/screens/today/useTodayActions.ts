import { useCallback, useMemo } from 'react'
import { useProjectsStore } from '@/app/stores/useProjectsStore'
import { useToastStore } from '@/app/stores/useToastStore'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import type { NewProjectDraft } from '@/domain/projects/newProject'
import type { NewProjectEventDraft } from '@/domain/projects/newProjectEvent'
import type { PostponeResumeDraft } from '@/domain/projects/postponeResume'
import type { UnblockProjectDraft } from '@/domain/projects/unblockProjects'
import type { EntityId } from '@/domain/schemas/primitives'

export type TodayActions = {
  createProject: (draft: NewProjectDraft) => void
  registerEvent: (draft: NewProjectEventDraft) => void
  unblock: (projectId: EntityId, projectName: string, draft: UnblockProjectDraft) => void
  resume: (projectId: EntityId, projectName: string) => void
  postpone: (draft: PostponeResumeDraft) => void
}

export function useTodayActions(): TodayActions {
  const createProject = useProjectsStore((state) => state.createProject)
  const registerEvent = useProjectsStore((state) => state.registerEvent)
  const unblockProject = useProjectsStore((state) => state.unblockProject)
  const resumeProject = useProjectsStore((state) => state.resumeProject)
  const postponeResume = useProjectsStore((state) => state.postponeResume)
  const notify = useToastStore((state) => state.notify)

  const run = useCallback(
    (action: () => Promise<void>, success: string, failure: string) => {
      void action()
        .then(() => notify(success))
        .catch((cause: unknown) => {
          console.error(failure, cause)
          notify(toPublicMessage(cause), 'danger')
        })
    },
    [notify],
  )

  return useMemo(
    () => ({
      createProject: (draft) =>
        run(
          () => createProject(draft),
          `${draft.name.trim()} entrou na carteira.`,
          'Não foi possível criar o projeto.',
        ),
      registerEvent: (draft) =>
        run(
          () => registerEvent(draft),
          'Evento registrado no histórico.',
          'Não foi possível registrar o evento.',
        ),
      unblock: (projectId, projectName, draft) =>
        run(
          () => unblockProject(projectId, draft),
          `${projectName} voltou a andar.`,
          'Não foi possível desbloquear o projeto.',
        ),
      resume: (projectId, projectName) =>
        run(
          () => resumeProject(projectId),
          `${projectName} saiu da pausa.`,
          'Não foi possível retomar o projeto.',
        ),
      postpone: (draft) =>
        run(
          () => postponeResume(draft),
          'Retomada adiada no evento de bloqueio.',
          'Não foi possível adiar a retomada.',
        ),
    }),
    [run, createProject, registerEvent, unblockProject, resumeProject, postponeResume],
  )
}
