import type {
  NavigationCounts,
  NavigationCountsRepository,
} from '@/domain/repositories/NavigationCountsRepository'
import type { SqlGateway } from '@/infra/database/SqlGateway'

const COUNT_OPEN_PROJECTS = 'SELECT count(*) AS total FROM project WHERE archived_at IS NULL'
// Em aberto é tudo que ainda pede trabalho: quem está em progresso ou bloqueado conta junto.
const COUNT_OPEN_TODOS = "SELECT count(*) AS total FROM todo WHERE status NOT IN ('done', 'cancelled')"

type CountRow = {
  total: number
}

export class SqliteNavigationCountsRepository implements NavigationCountsRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async read(): Promise<NavigationCounts> {
    const [projectRows, todoRows] = await Promise.all([
      this.#gateway.select<CountRow[]>(COUNT_OPEN_PROJECTS),
      this.#gateway.select<CountRow[]>(COUNT_OPEN_TODOS),
    ])

    return {
      projects: projectRows[0]?.total ?? 0,
      todos: todoRows[0]?.total ?? 0,
    }
  }
}
