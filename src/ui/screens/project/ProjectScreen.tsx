import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { todayIsoDate } from '@/app/clock'
import { useDatabaseStore } from '@/app/stores/useDatabaseStore'
import { useNotesStore } from '@/app/stores/useNotesStore'
import { useProjectsStore } from '@/app/stores/useProjectsStore'
import type { SidebarContextItem } from '@/app/stores/useSidebarContextStore'
import { useToastStore } from '@/app/stores/useToastStore'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import { listOpenAllocationIds, type BlockProjectsDraft } from '@/domain/projects/blockProjects'
import type { NewProjectEventDraft } from '@/domain/projects/newProjectEvent'
import { toProjectDraft } from '@/domain/projects/editProject'
import { toTaskDraft } from '@/domain/projects/editTask'
import type { NewProjectDraft } from '@/domain/projects/newProject'
import { emptyTaskDraft, type NewTaskDraft } from '@/domain/projects/newTask'
import { findProjectDetail } from '@/domain/projects/projectDetail'
import type { TaskFilter } from '@/domain/projects/taskFilters'
import type { EntityId } from '@/domain/schemas/primitives'
import { SCREEN_META } from '@/ui/layout/screenMeta'
import { useSidebarContext } from '@/ui/layout/useSidebarContext'
import { Alert } from '@/ui/primitives/Alert'
import { Breadcrumb } from '@/ui/primitives/Breadcrumb'
import { Button } from '@/ui/primitives/Button'
import { EmptyState } from '@/ui/primitives/EmptyState'
import type { Shortcut } from '@/ui/shortcuts/shortcutRegistry'
import { useShortcuts } from '@/ui/shortcuts/useShortcuts'
import { BlockProjectsModal } from '../projects/BlockProjectsModal'
import { ScreenShell } from '../ScreenShell'
import { AllocationsTab } from './AllocationsTab'
import { ProjectFormModal } from '../projects/ProjectFormModal'
import { TaskFormModal } from './TaskFormModal'
import { NotesTab } from './NotesTab'
import { ProjectHeaderBadges } from './ProjectHeaderBadges'
import { ProjectHistory } from './ProjectHistory'
import { ProjectMetrics } from './ProjectMetrics'
import { ProjectTabs } from './ProjectTabs'
import type { ProjectTab } from './projectTabItems'
import { RegisterEventModal } from './RegisterEventModal'
import { TasksTab } from './TasksTab'

type OpenModal = 'task' | 'event' | 'block' | 'project' | null

export function ProjectScreen() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const databaseStatus = useDatabaseStore((state) => state.status)
  const status = useProjectsStore((state) => state.status)
  const errorMessage = useProjectsStore((state) => state.errorMessage)
  const snapshot = useProjectsStore((state) => state.snapshot)
  const load = useProjectsStore((state) => state.load)
  const createTask = useProjectsStore((state) => state.createTask)
  const updateTask = useProjectsStore((state) => state.updateTask)
  const updateProject = useProjectsStore((state) => state.updateProject)
  const registerEvent = useProjectsStore((state) => state.registerEvent)
  const blockProjects = useProjectsStore((state) => state.blockProjects)
  const requestNote = useNotesStore((state) => state.requestNote)
  const notify = useToastStore((state) => state.notify)

  const [activeTab, setActiveTab] = useState<ProjectTab>('tasks')
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all')
  const [taskSearch, setTaskSearch] = useState('')
  const [selectedBaselineId, setSelectedBaselineId] = useState<EntityId | null>(null)
  const [openModal, setOpenModal] = useState<OpenModal>(null)
  const [editingTaskId, setEditingTaskId] = useState<EntityId | null>(null)

  useEffect(() => {
    if (databaseStatus !== 'ready') {
      return
    }

    void load()
  }, [databaseStatus, load])

  const detail = useMemo(
    () => findProjectDetail(snapshot, projectId, selectedBaselineId),
    [snapshot, projectId, selectedBaselineId],
  )

  const activeProjects = useMemo(
    () => snapshot.projects.filter((project) => project.archivedAt === null),
    [snapshot.projects],
  )

  const sidebarItems = useMemo<SidebarContextItem[]>(
    () => activeProjects.map((project) => ({ id: project.id, label: project.name })),
    [activeProjects],
  )

  useSidebarContext(sidebarItems, projectId, (id) =>
    void navigate(SCREEN_META.project.path.replace(':projectId', id)),
  )

  const shortcuts = useMemo<Shortcut[]>(
    () => [
      {
        id: 'project-new-task',
        keys: 't',
        scope: 'screen',
        description: 'Nova tarefa',
        run: () => setOpenModal('task'),
      },
      {
        id: 'project-edit',
        keys: 'e',
        scope: 'screen',
        description: 'Editar projeto',
        run: () => setOpenModal('project'),
      },
      {
        id: 'project-register-event',
        keys: 'mod+e',
        scope: 'screen',
        description: 'Registrar evento',
        run: () => setOpenModal('event'),
      },
      {
        id: 'project-block',
        keys: 'mod+b',
        scope: 'screen',
        description: 'Bloquear projeto',
        run: () => setOpenModal('block'),
      },
    ],
    [],
  )

  useShortcuts(shortcuts)

  function closeModal() {
    setOpenModal(null)
    setEditingTaskId(null)
  }

  async function run(action: () => Promise<void>, success: string, failure: string) {
    closeModal()

    try {
      await action()
      notify(success)
    } catch (cause) {
      console.error(failure, cause)
      notify(toPublicMessage(cause), 'danger')
    }
  }

  function handleSubmitTask(draft: NewTaskDraft) {
    if (editingTaskId === null) {
      void run(
        () => createTask(draft),
        `${draft.title.trim()} entrou no projeto.`,
        'Não foi possível criar a tarefa.',
      )

      return
    }

    const taskId = editingTaskId

    void run(
      () => updateTask(taskId, draft),
      `${draft.title.trim()} foi atualizada.`,
      'Não foi possível salvar a tarefa.',
    )
  }

  function handleEditTask(taskId: EntityId) {
    setEditingTaskId(taskId)
    setOpenModal('task')
  }

  // A nota mora no editor da tela de Notas, então o cartão pede a nota e navega: a rota não
  // carrega o caminho do arquivo, que tem barra e não caberia num parâmetro.
  function handleOpenNote(path: string) {
    requestNote(path)
    void navigate(SCREEN_META.notes.path)
  }

  function handleUpdateProject(draft: NewProjectDraft) {
    void run(
      () => updateProject(projectId, draft),
      `${draft.name.trim()} foi atualizado.`,
      'Não foi possível salvar o projeto.',
    )
  }

  function handleRegisterEvent(draft: NewProjectEventDraft) {
    void run(
      () => registerEvent(draft),
      'Evento registrado no histórico.',
      'Não foi possível registrar o evento.',
    )
  }

  function handleBlock(draft: BlockProjectsDraft) {
    void run(
      () => blockProjects([projectId], draft),
      'Projeto bloqueado.',
      'Não foi possível bloquear o projeto.',
    )
  }

  if (status === 'error') {
    return (
      <ScreenShell title="Projeto" subhead="detalhe, histórico e alocações">
        <Alert
          level="danger"
          title="Não foi possível abrir o projeto"
          action={
            <Button variant="danger" size="small" onClick={() => void load()}>
              Tentar de novo
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      </ScreenShell>
    )
  }

  if (status !== 'ready') {
    return (
      <ScreenShell title="Projeto" subhead="detalhe, histórico e alocações">
        <p className="text-support text-text3">Carregando o projeto…</p>
      </ScreenShell>
    )
  }

  if (detail === null) {
    return (
      <ScreenShell title="Projeto" subhead="detalhe, histórico e alocações">
        <EmptyState
          title="Projeto não encontrado"
          description="Ele pode ter sido excluído, ou o endereço aponta para um projeto que nunca existiu."
          action={
            <Button onClick={() => void navigate(SCREEN_META.projects.path)}>
              Voltar para Projetos
            </Button>
          }
        />
      </ScreenShell>
    )
  }

  const { row, comparison } = detail
  const activePhases = snapshot.phases.filter((phase) => phase.active)
  const editedTask = snapshot.tasks.find((task) => task.id === editingTaskId) ?? null
  const openAllocationCount = listOpenAllocationIds(
    row.tasks.map((taskRow) => taskRow.task.id),
    snapshot.allocations,
  ).length

  return (
    <ScreenShell
      title={row.project.name}
      breadcrumb={
        <Breadcrumb
          steps={[
            { label: 'Projetos', onNavigate: () => void navigate(SCREEN_META.projects.path) },
            { label: row.project.name },
          ]}
        />
      }
      titleAfter={<ProjectHeaderBadges row={row} />}
      actions={
        <>
          <Button keys="e" onClick={() => setOpenModal('project')}>
            Editar
          </Button>
          <Button keys="mod+e" onClick={() => setOpenModal('event')}>
            Registrar decisão
          </Button>
          <Button
            variant="danger"
            keys="mod+b"
            disabled={row.project.status === 'blocked'}
            onClick={() => setOpenModal('block')}
          >
            Bloquear
          </Button>
          <Button variant="primary" keys="t" onClick={() => setOpenModal('task')}>
            Nova tarefa
          </Button>
        </>
      }
      flushToolbar
      toolbar={
        <>
          <ProjectMetrics row={row} comparison={comparison} />
          <ProjectTabs
            activeTab={activeTab}
            baselineOptions={detail.baselineOptions}
            selectedBaselineId={selectedBaselineId}
            items={[
              { id: 'tasks', label: 'Tarefas', count: row.tasks.length },
              { id: 'allocations', label: 'Alocações', count: detail.allocationRows.length },
              { id: 'notes', label: 'Notas', count: detail.noteCards.length },
            ]}
            onSelectTab={setActiveTab}
            onSelectBaseline={setSelectedBaselineId}
          />
        </>
      }
      contentClassName="grid flex-1 grid-cols-[minmax(0,1fr)_376px] overflow-hidden"
    >
      <div className="overflow-auto px-5 pb-7 pt-3.5">
        {activeTab === 'tasks' && (
          <TasksTab
            rows={row.tasks}
            phases={snapshot.phases}
            allocationRows={detail.allocationRows}
            dependencies={snapshot.taskDependencies}
            filter={taskFilter}
            search={taskSearch}
            onFilterChange={setTaskFilter}
            onSearchChange={setTaskSearch}
            onNewTask={() => setOpenModal('task')}
            onEditTask={handleEditTask}
          />
        )}
        {activeTab === 'allocations' && (
          <AllocationsTab rows={detail.allocationRows} conflicts={detail.conflicts} />
        )}
        {activeTab === 'notes' && <NotesTab cards={detail.noteCards} onOpenNote={handleOpenNote} />}
      </div>

      <ProjectHistory
        feed={detail.feed}
        tasks={snapshot.tasks}
        phases={snapshot.phases}
        onRegisterEvent={() => setOpenModal('event')}
      />

      {openModal === 'task' && (
        <TaskFormModal
          mode={editingTaskId === null ? 'create' : 'edit'}
          taskId={editingTaskId}
          projectId={projectId}
          projectName={row.project.name}
          baselineLabel={
            comparison.baseline === null ? 'sem baseline' : `v${comparison.baseline.version}`
          }
          phases={activePhases}
          snapshot={snapshot}
          initialDraft={
            editedTask === null
              ? emptyTaskDraft(projectId, activePhases[0]?.id ?? null)
              : toTaskDraft({ task: editedTask, allocations: snapshot.allocations })
          }
          onClose={closeModal}
          onSubmit={handleSubmitTask}
        />
      )}

      {openModal === 'project' && (
        <ProjectFormModal
          mode="edit"
          people={snapshot.people}
          initialDraft={toProjectDraft({ project: row.project, tagNames: row.tagNames })}
          onClose={closeModal}
          onSubmit={handleUpdateProject}
        />
      )}

      {openModal === 'event' && (
        <RegisterEventModal
          projectId={projectId}
          projectName={row.project.name}
          today={todayIsoDate()}
          onClose={closeModal}
          onSubmit={handleRegisterEvent}
        />
      )}

      {openModal === 'block' && (
        <BlockProjectsModal
          projectNames={[row.project.name]}
          openAllocationCount={openAllocationCount}
          onClose={closeModal}
          onSubmit={handleBlock}
        />
      )}
    </ScreenShell>
  )
}
