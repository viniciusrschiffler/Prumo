import type { DateShifter } from './seedDates.ts'

export type TableSeed = {
  table: string
  columns: string[]
  rows: unknown[][]
}

export function buildSeedData(shift: DateShifter): TableSeed[] {
  const date = shift.date
  const at = shift.timestamp

  return [
    {
      table: 'person',
      columns: ['id', 'name', 'initials', 'role', 'weekly_capacity_hours', 'active'],
      rows: [
        ['ana', 'Ana Nogueira', 'AN', 'Desenvolvimento', 40, 1],
        ['rafael', 'Rafael Brito', 'RB', 'Infraestrutura', 40, 1],
        ['marcos', 'Marcos Teles', 'MT', 'Qualidade', 30, 1],
        ['julia', 'Júlia Farah', 'JF', 'Produto', 40, 0],
      ],
    },
    {
      table: 'tag',
      columns: ['id', 'name'],
      rows: [
        ['pagamentos', 'pagamentos'],
        ['infra', 'infra'],
        ['parceiro', 'parceiro'],
        ['mobile', 'mobile'],
        ['observabilidade', 'observabilidade'],
      ],
    },
    {
      table: 'project',
      columns: [
        'id',
        'name',
        'description',
        'status',
        'priority',
        'owner_person_id',
        'planned_start',
        'planned_end',
        'created_at',
        'archived_at',
        'paused_at',
      ],
      rows: [
        [
          'gateway',
          'Migração do gateway',
          'Troca do gateway de pagamentos, com conciliação automática no mesmo release.',
          'active',
          'P1',
          'ana',
          date('2026-03-12'),
          date('2026-09-29'),
          at('2026-02-20', '09:00:00'),
          null,
          null,
        ],
        [
          'parceiro',
          'Portal do parceiro',
          'Portal de autoatendimento para parceiros, bloqueado no jurídico.',
          'blocked',
          'P0',
          'julia',
          date('2026-02-02'),
          null,
          at('2026-01-15', '09:00:00'),
          null,
          null,
        ],
        [
          'campo',
          'App de campo v2',
          'Segunda versão do aplicativo de campo, pausada para priorizar a migração.',
          'paused',
          'P2',
          'marcos',
          date('2026-07-01'),
          date('2026-10-02'),
          at('2026-06-01', '09:00:00'),
          null,
          at('2026-08-28', '16:00:00'),
        ],
        [
          'observabilidade',
          'Observabilidade',
          'Instrumentação e alertas dos serviços críticos.',
          'active',
          'P2',
          'rafael',
          date('2026-06-01'),
          date('2026-09-11'),
          at('2026-05-10', '09:00:00'),
          null,
          null,
        ],
        [
          'erp',
          'Integração legado ERP',
          'Integração com o ERP legado, cancelada após reavaliação de custo.',
          'cancelled',
          'P3',
          null,
          date('2026-01-20'),
          date('2026-03-31'),
          at('2026-01-05', '09:00:00'),
          at('2026-04-30', '18:00:00'),
          null,
        ],
      ],
    },
    {
      table: 'project_tag',
      columns: ['project_id', 'tag_id'],
      rows: [
        ['gateway', 'pagamentos'],
        ['gateway', 'infra'],
        ['parceiro', 'parceiro'],
        ['campo', 'mobile'],
        ['observabilidade', 'observabilidade'],
        ['observabilidade', 'infra'],
      ],
    },
    {
      table: 'task',
      columns: [
        'id',
        'project_id',
        'phase_id',
        'title',
        'status',
        'planned_start',
        'planned_end',
        'actual_start',
        'actual_end',
        'estimated_hours',
        'sort_order',
      ],
      rows: [
        // Datas vindas dos offsets da tela Timeline, ancorados em 01/03/2026.
        ['gw-prov', 'gateway', 'development', 'Provisionar ambiente de homologação', 'done', date('2026-03-12'), date('2026-03-27'), date('2026-03-12'), date('2026-03-27'), 40, 1],
        ['gw-rew', 'gateway', 'development', 'Rewrite do roteador de pagamentos', 'in_progress', date('2026-03-30'), date('2026-05-15'), date('2026-03-30'), null, 120, 2],
        ['gw-tes', 'gateway', 'internal_homologation', 'Testes de carga', 'todo', date('2026-05-18'), date('2026-06-26'), null, null, 80, 3],
        ['gw-cut', 'gateway', 'production', 'Cutover em produção', 'todo', date('2026-09-01'), date('2026-09-29'), null, null, 80, 4],

        ['pp-jur', 'parceiro', 'external_homologation', 'Aprovação jurídica do contrato', 'blocked', date('2026-02-02'), date('2026-03-16'), date('2026-02-02'), null, 48, 1],
        ['pp-hom', 'parceiro', 'external_homologation', 'Homologação com o parceiro', 'todo', null, null, null, null, 120, 2],

        ['ac-piloto', 'campo', 'development', 'Piloto em campo', 'in_progress', date('2026-07-01'), date('2026-08-31'), date('2026-07-01'), null, 80, 1],
        ['ac-roteiro', 'campo', 'internal_homologation', 'Roteiro de homologação interna', 'todo', date('2026-09-03'), date('2026-10-02'), null, null, 60, 2],

        ['ob-inst', 'observabilidade', 'development', 'Instrumentar serviços críticos', 'in_progress', date('2026-06-01'), date('2026-06-26'), date('2026-06-01'), null, 80, 1],
        ['ob-cut', 'observabilidade', 'production', 'Janela de cutover — comunicar operação', 'todo', date('2026-09-03'), date('2026-09-11'), null, null, 16, 2],

        ['erp-map', 'erp', 'development', 'Mapear integrações do legado', 'cancelled', date('2026-01-20'), date('2026-03-31'), null, null, 120, 1],
      ],
    },
    {
      table: 'task_dependency',
      columns: ['task_id', 'depends_on_task_id'],
      rows: [
        ['gw-tes', 'gw-rew'],
        ['pp-hom', 'pp-jur'],
        ['ac-roteiro', 'ac-piloto'],
      ],
    },
    {
      table: 'allocation',
      columns: [
        'id',
        'task_id',
        'person_id',
        'start_date',
        'end_date',
        'percentage',
        'ended_at',
        'ended_reason',
      ],
      rows: [
        ['al-gw-1', 'gw-prov', 'ana', date('2026-03-12'), date('2026-03-27'), 100, null, null],
        ['al-gw-2', 'gw-rew', 'ana', date('2026-03-30'), date('2026-05-15'), 50, null, null],
        ['al-gw-3', 'gw-rew', 'rafael', date('2026-03-30'), date('2026-05-15'), 100, null, null],
        // As duas encerradas pelo bloqueio de 22/07, nunca deletadas.
        ['al-gw-4', 'gw-tes', 'ana', date('2026-05-18'), date('2026-07-22'), 50, at('2026-07-22', '16:40:00'), 'projeto bloqueado'],
        ['al-gw-5', 'gw-tes', 'rafael', date('2026-05-18'), date('2026-07-22'), 50, at('2026-07-22', '16:40:00'), 'projeto bloqueado'],
        // Recriadas no desbloqueio de 30/07.
        ['al-gw-6', 'gw-tes', 'ana', date('2026-07-30'), date('2026-09-26'), 50, null, null],
        ['al-gw-7', 'gw-tes', 'rafael', date('2026-07-30'), date('2026-08-28'), 100, at('2026-08-28', '11:20:00'), 'realocação para Observabilidade'],
        ['al-gw-8', 'gw-tes', 'rafael', date('2026-08-28'), date('2026-09-26'), 50, null, null],

        ['al-pp-1', 'pp-jur', 'julia', date('2026-02-02'), date('2026-08-11'), 50, at('2026-08-11', '10:05:00'), 'projeto bloqueado'],
        ['al-pp-2', 'pp-jur', 'ana', date('2026-02-02'), date('2026-08-11'), 50, at('2026-08-11', '10:05:00'), 'projeto bloqueado'],

        ['al-ac-1', 'ac-piloto', 'marcos', date('2026-07-01'), date('2026-08-31'), 30, null, null],
        ['al-ac-2', 'ac-roteiro', 'marcos', date('2026-09-03'), date('2026-10-02'), 30, null, null],

        // Junto com al-gw-5 a 50%, coloca Rafael em 150% entre 01/06 e 26/06.
        ['al-ob-1', 'ob-inst', 'rafael', date('2026-06-01'), date('2026-06-26'), 100, null, null],
      ],
    },
    {
      table: 'project_event',
      columns: [
        'id',
        'project_id',
        'type',
        'event_date',
        'title',
        'body_md',
        'reverts_event_id',
        'risk_open',
        'expected_resume_at',
        'created_at',
      ],
      rows: [
        ['ev-gw-dec1', 'gateway', 'decision', date('2026-07-14'), 'Trocar de provedor no piloto', 'Proposta de trocar o provedor de pagamentos antes do piloto.', null, 0, null, at('2026-07-14', '15:30:00')],
        ['ev-gw-block', 'gateway', 'block', date('2026-07-22'), 'Sem ambiente de homologação', 'Infra sem capacidade até 30/07. 2 alocações encerradas no bloqueio.', null, 0, date('2026-07-30'), at('2026-07-22', '16:40:00')],
        ['ev-gw-unblock', 'gateway', 'unblock', date('2026-07-30'), 'Ambiente liberado pela infra', 'Alocações recriadas para Ana e Rafael.', null, 0, null, at('2026-07-30', '09:15:00')],
        ['ev-gw-dec2', 'gateway', 'decision', date('2026-08-05'), 'Manter o provedor atual no piloto', 'Revertida a decisão de 14/07 de trocar de provedor — custo de migração dobrava o prazo.', 'ev-gw-dec1', 0, null, at('2026-08-05', '14:00:00')],
        ['ev-gw-scope', 'gateway', 'scope_change', date('2026-08-12'), 'Conciliação entra no escopo', '**Contexto:** financeiro precisa de conciliação automática no mesmo release.\n\n**Impacto:** +80h e nova tarefa em Produção. Esforço 240h → 320h.', null, 0, null, at('2026-08-12', '10:30:00')],
        ['ev-gw-risk', 'gateway', 'risk', date('2026-08-21'), 'Homologação externa depende de terceiro', 'Se o parceiro não responder até 20/09, o cutover escorrega para outubro.', null, 1, null, at('2026-08-21', '17:05:00')],
        ['ev-gw-realloc', 'gateway', 'reallocation', date('2026-08-28'), 'Rafael Brito 100% → 50%', 'Metade da capacidade foi para Observabilidade por 3 semanas. Rewrite do roteador desloca o fim em 11 dias.', null, 0, null, at('2026-08-28', '11:20:00')],
        ['ev-gw-note', 'gateway', 'note', date('2026-09-03'), 'Janela de cutover confirmada pelo fornecedor', 'Fornecedor confirmou janela de cutover para o fim de setembro. Precisa alinhar com a operação antes de fechar a data.', null, 0, null, at('2026-09-03', '09:12:00')],

        ['ev-pp-block', 'parceiro', 'block', date('2026-08-11'), 'Aguardando validação jurídica do contrato', 'Jurídico do parceiro não devolveu o contrato. Retomada prevista para 26/08.', null, 0, date('2026-08-26'), at('2026-08-11', '10:05:00')],
        ['ev-pp-risk', 'parceiro', 'risk', date('2026-08-27'), 'Retomada prevista venceu', 'A data de retomada passou sem resposta do parceiro.', null, 1, null, at('2026-08-27', '09:40:00')],

        ['ev-ac-pause', 'campo', 'decision', date('2026-08-28'), 'Pausar para priorizar a migração', 'Marcos segue 30% alocado — decidir se realoca na próxima semana.', null, 0, null, at('2026-08-28', '16:00:00')],

        ['ev-ob-note', 'observabilidade', 'note', date('2026-08-16'), 'Instrumentação concluída nos serviços de pagamento', 'Faltam os serviços de cadastro.', null, 0, null, at('2026-08-16', '11:00:00')],

        ['ev-erp-cancel', 'erp', 'decision', date('2026-04-30'), 'Integração cancelada', 'Custo de manutenção do legado não se paga no horizonte de um ano.', null, 0, null, at('2026-04-30', '18:00:00')],
      ],
    },
    {
      table: 'project_event_task',
      columns: ['project_event_id', 'task_id'],
      rows: [
        ['ev-gw-realloc', 'gw-rew'],
        ['ev-gw-realloc', 'gw-tes'],
        ['ev-gw-scope', 'gw-cut'],
        ['ev-pp-block', 'pp-jur'],
      ],
    },
    {
      table: 'baseline',
      columns: ['id', 'project_id', 'version', 'created_at', 'reason'],
      rows: [
        ['bl-gw-1', 'gateway', 1, at('2026-02-20', '09:00:00'), 'plano inicial'],
        ['bl-gw-2', 'gateway', 2, at('2026-08-12', '10:30:00'), 'mudança de escopo'],
        ['bl-pp-1', 'parceiro', 1, at('2026-01-15', '09:00:00'), 'plano inicial'],
        ['bl-ac-1', 'campo', 1, at('2026-06-01', '09:00:00'), 'plano inicial'],
        ['bl-ob-1', 'observabilidade', 1, at('2026-05-10', '09:00:00'), 'plano inicial'],
        ['bl-erp-1', 'erp', 1, at('2026-01-05', '09:00:00'), 'plano inicial'],
      ],
    },
    {
      table: 'baseline_task',
      columns: ['baseline_id', 'task_id', 'planned_start', 'planned_end', 'estimated_hours'],
      rows: [
        // v1 sem o cutover: 240h, exatamente o "240h → 320h" do evento de mudança de escopo.
        ['bl-gw-1', 'gw-prov', date('2026-03-12'), date('2026-03-27'), 40],
        ['bl-gw-1', 'gw-rew', date('2026-03-30'), date('2026-05-04'), 120],
        ['bl-gw-1', 'gw-tes', date('2026-05-18'), date('2026-06-26'), 80],
        // v2 congela o cutover terminando 11 dias antes do atual, o desvio da tela.
        ['bl-gw-2', 'gw-prov', date('2026-03-12'), date('2026-03-27'), 40],
        ['bl-gw-2', 'gw-rew', date('2026-03-30'), date('2026-05-04'), 120],
        ['bl-gw-2', 'gw-tes', date('2026-05-18'), date('2026-06-26'), 80],
        ['bl-gw-2', 'gw-cut', date('2026-08-21'), date('2026-09-18'), 80],

        ['bl-pp-1', 'pp-jur', date('2026-02-02'), date('2026-02-21'), 48],
        ['bl-pp-1', 'pp-hom', null, null, 120],

        ['bl-ac-1', 'ac-piloto', date('2026-07-01'), date('2026-08-31'), 80],
        ['bl-ac-1', 'ac-roteiro', date('2026-09-03'), date('2026-10-04'), 60],

        ['bl-ob-1', 'ob-inst', date('2026-06-01'), date('2026-06-26'), 80],
        ['bl-ob-1', 'ob-cut', date('2026-09-03'), date('2026-09-11'), 16],

        ['bl-erp-1', 'erp-map', date('2026-01-20'), date('2026-03-31'), 120],
      ],
    },
    {
      table: 'todo_recurrence',
      columns: ['id', 'title', 'rule', 'quantity', 'last_generated_at', 'active'],
      rows: [
        ['rec-capacidade', 'Revisão semanal de capacidade', 'semanal-seg', 1, at('2026-08-31', '08:00:00'), 1],
      ],
    },
    {
      table: 'todo',
      columns: [
        'id',
        'title',
        'description',
        'due_date',
        'priority',
        'status',
        'project_id',
        'task_id',
        'completed_at',
        'recurrence_id',
      ],
      rows: [
        ['td-escopo', 'Fechar escopo do módulo de conciliação com o time financeiro', null, date('2026-09-03'), 'P1', 'in_progress', 'gateway', 'gw-cut', null, null],
        ['td-parceiro', 'Responder proposta de replanejamento do parceiro', null, date('2026-09-03'), 'P0', 'blocked', 'parceiro', null, null, null],
        ['td-1a1', '1:1 com Rafael — carga acima de 100%', 'Decidir se tira Observabilidade ou Testes de carga.', date('2026-09-03'), 'P1', 'open', null, null, null, null],
        ['td-baseline', 'Revisar baseline antes do comitê', null, date('2026-09-03'), 'P2', 'open', 'campo', null, null, null],
        ['td-capacidade', 'Revisão semanal de capacidade', null, date('2026-09-07'), 'P2', 'open', null, null, null, 'rec-capacidade'],
        ['td-roteiro', 'Preparar roteiro do cutover', null, date('2026-09-10'), 'P2', 'in_progress', 'gateway', 'gw-cut', null, null],
        ['td-contrato', 'Cobrar o contrato assinado do parceiro', null, date('2026-08-30'), 'P0', 'blocked', 'parceiro', 'pp-jur', null, null],
        ['td-alertas', 'Revisar alertas de observabilidade', null, date('2026-09-01'), 'P3', 'done', 'observabilidade', 'ob-inst', at('2026-09-01', '17:30:00'), null],
      ],
    },
    {
      table: 'todo_tag',
      columns: ['todo_id', 'tag_id'],
      rows: [
        ['td-escopo', 'pagamentos'],
        ['td-contrato', 'parceiro'],
        ['td-alertas', 'observabilidade'],
      ],
    },
    {
      table: 'saved_view',
      columns: ['id', 'name', 'screen', 'filters_json', 'sort_order'],
      rows: [
        ['sv-criticos', 'Críticos P0 e P1', 'projects', '{"priority":["P0","P1"],"status":["active","blocked"]}', 1],
        ['sv-sem-responsavel', 'Sem responsável', 'projects', '{"withoutOwner":true}', 2],
        ['sv-semana', 'Esta semana', 'todos', '{"due":"week"}', 1],
      ],
    },
  ]
}

export type NoteSeed = {
  path: string
  projectId: string | null
  projectEventId: string | null
  content: string
}

export function buildNotes(): NoteSeed[] {
  return [
    {
      path: 'notas/migracao-do-gateway.md',
      projectId: 'gateway',
      projectEventId: null,
      content:
        '# Migração do gateway\n\nTroca do provedor de pagamentos com conciliação automática no mesmo release.\n\n## Pontos abertos\n\n- Janela de cutover depende da operação\n- Conciliação entrou no escopo em 12/08\n',
    },
    {
      path: 'notas/decisao-provedor.md',
      projectId: 'gateway',
      projectEventId: 'ev-gw-dec2',
      content:
        '# Manter o provedor atual no piloto\n\nA decisão de 14/07 de trocar de provedor foi revertida: o custo de migração dobrava o prazo do piloto.\n\nRevisitar depois do cutover.\n',
    },
    {
      path: 'notas/portal-do-parceiro.md',
      projectId: 'parceiro',
      projectEventId: null,
      content:
        '# Portal do parceiro\n\nBloqueado desde 11/08 aguardando validação jurídica do contrato.\n\nA retomada prevista para 26/08 venceu sem resposta.\n',
    },
  ]
}
