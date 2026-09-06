import { z } from 'zod'
import {
  BLOCKED_ALLOCATION_REASON,
  type ProjectBlock,
} from '@/domain/projects/blockProjects'
import type { NewProject } from '@/domain/projects/newProject'
import type { ResumePostponement } from '@/domain/projects/postponeResume'
import type { ProjectResume } from '@/domain/projects/resumeProjects'
import type { ProjectUnblock } from '@/domain/projects/unblockProjects'
import type {
  NewProjectTag,
  ProjectRepository,
} from '@/domain/repositories/ProjectRepository'
import type { EntityId, Priority } from '@/domain/schemas/primitives'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import { projectSchema, type Project } from '@/domain/schemas/projectSchema'
import { parseRows } from '@/infra/database/parseRow'
import type { BatchStatement, SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_ALL = `
  SELECT id, name, description, status, priority, owner_person_id,
         planned_start, planned_end, created_at, archived_at, paused_at
  FROM project
  ORDER BY name
`

const INSERT_PROJECT = `
  INSERT INTO project (id, name, description, status, priority, owner_person_id,
                       planned_start, planned_end, created_at, archived_at, paused_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
`

const INSERT_BASELINE = `
  INSERT INTO baseline (id, project_id, version, created_at, reason)
  VALUES (?, ?, ?, ?, ?)
`

const INSERT_TAG = 'INSERT INTO tag (id, name) VALUES (?, ?) ON CONFLICT (name) DO NOTHING'

const UPDATE_PRIORITY = 'UPDATE project SET priority = ? WHERE id = ?'

const BLOCK_PROJECT = "UPDATE project SET status = 'blocked' WHERE id = ?"

const ACTIVATE_PROJECT = "UPDATE project SET status = 'active' WHERE id = ?"

const RESUME_PROJECT = "UPDATE project SET status = 'active', paused_at = NULL WHERE id = ?"

const POSTPONE_RESUME = 'UPDATE project_event SET expected_resume_at = ? WHERE id = ?'

const END_ALLOCATION = 'UPDATE allocation SET ended_at = ?, ended_reason = ? WHERE id = ?'

const INSERT_ALLOCATION = `
  INSERT INTO allocation (id, task_id, person_id, start_date, end_date, percentage,
                          ended_at, ended_reason)
  VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)
`

const INSERT_EVENT = `
  INSERT INTO project_event (id, project_id, type, event_date, title, body_md,
                             reverts_event_id, risk_open, expected_resume_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, NULL, 0, ?, ?)
`

const LINK_TAG = `
  INSERT INTO project_tag (project_id, tag_id)
  SELECT ?, id FROM tag WHERE name = ?
`

const projectRowSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    status: z.string(),
    priority: z.string(),
    owner_person_id: z.string().nullable(),
    planned_start: z.string().nullable(),
    planned_end: z.string().nullable(),
    created_at: z.string(),
    archived_at: z.string().nullable(),
    paused_at: z.string().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    priority: row.priority,
    ownerPersonId: row.owner_person_id,
    plannedStart: row.planned_start,
    plannedEnd: row.planned_end,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
    pausedAt: row.paused_at,
  }))
  .pipe(projectSchema)

function toCreateStatements(
  newProject: NewProject,
  tags: readonly NewProjectTag[],
): BatchStatement[] {
  const { project, baseline } = newProject

  return [
    {
      query: INSERT_PROJECT,
      values: [
        project.id,
        project.name,
        project.description,
        project.status,
        project.priority,
        project.ownerPersonId,
        project.plannedStart,
        project.plannedEnd,
        project.createdAt,
      ],
    },
    {
      query: INSERT_BASELINE,
      values: [baseline.id, baseline.projectId, baseline.version, baseline.createdAt, baseline.reason],
    },
    ...tags.flatMap((tag) => [
      { query: INSERT_TAG, values: [tag.id, tag.name] },
      { query: LINK_TAG, values: [project.id, tag.name] },
    ]),
  ]
}

function toBlockStatements(block: ProjectBlock): BatchStatement[] {
  const { event } = block

  return [
    { query: BLOCK_PROJECT, values: [block.projectId] },
    {
      query: INSERT_EVENT,
      values: [
        event.id,
        event.projectId,
        event.type,
        event.eventDate,
        event.title,
        event.bodyMarkdown,
        event.expectedResumeAt,
        event.createdAt,
      ],
    },
    ...block.endedAllocationIds.map((allocationId) => ({
      query: END_ALLOCATION,
      values: [block.endedAt, BLOCKED_ALLOCATION_REASON, allocationId],
    })),
  ]
}

function toEventStatement(event: ProjectEvent): BatchStatement {
  return {
    query: INSERT_EVENT,
    values: [
      event.id,
      event.projectId,
      event.type,
      event.eventDate,
      event.title,
      event.bodyMarkdown,
      event.expectedResumeAt,
      event.createdAt,
    ],
  }
}

function toUnblockStatements(unblock: ProjectUnblock): BatchStatement[] {
  return [
    { query: ACTIVATE_PROJECT, values: [unblock.projectId] },
    toEventStatement(unblock.event),
    ...unblock.resumedAllocations.map((allocation) => ({
      query: INSERT_ALLOCATION,
      values: [
        allocation.id,
        allocation.taskId,
        allocation.personId,
        allocation.startDate,
        allocation.endDate,
        allocation.percentage,
      ],
    })),
  ]
}

export class SqliteProjectRepository implements ProjectRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async listAll(): Promise<Project[]> {
    return parseRows(projectRowSchema, 'project', await this.#gateway.select<unknown[]>(SELECT_ALL))
  }

  async create(newProject: NewProject, tags: readonly NewProjectTag[]): Promise<void> {
    await this.#gateway.executeBatch(toCreateStatements(newProject, tags))
  }

  async setPriority(projectIds: readonly EntityId[], priority: Priority): Promise<void> {
    await this.#gateway.executeBatch(
      projectIds.map((projectId) => ({ query: UPDATE_PRIORITY, values: [priority, projectId] })),
    )
  }

  // Status, evento e encerramento das alocações vão no mesmo lote: um bloqueio gravado pela
  // metade deixaria o projeto bloqueado sem registro de por quê.
  async blockMany(blocks: readonly ProjectBlock[]): Promise<void> {
    await this.#gateway.executeBatch(blocks.flatMap(toBlockStatements))
  }

  // O desbloqueio recria as alocações que o bloqueio encerrou no mesmo lote do evento: sem
  // isso o projeto voltaria a andar com o time que o bloqueio tirou dele.
  async unblock(unblock: ProjectUnblock): Promise<void> {
    await this.#gateway.executeBatch(toUnblockStatements(unblock))
  }

  async resume(resume: ProjectResume): Promise<void> {
    await this.#gateway.executeBatch([
      { query: RESUME_PROJECT, values: [resume.projectId] },
      toEventStatement(resume.event),
    ])
  }

  async postponeResume(postponement: ResumePostponement): Promise<void> {
    await this.#gateway.executeBatch([
      {
        query: POSTPONE_RESUME,
        values: [postponement.expectedResumeAt, postponement.blockEventId],
      },
    ])
  }
}
