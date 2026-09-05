import { describe, expect, it } from 'vitest'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import { parseQuickCapture, type QuickCaptureContext } from './quickCapture'

const CONTEXT: QuickCaptureContext = {
  today: '2026-09-03',
  projects: [
    buildProject({ id: 'gateway', name: 'Migração do gateway' }),
    buildProject({ id: 'parceiro', name: 'Portal do parceiro' }),
  ],
}

describe('parseQuickCapture', () => {
  it('separa título, tag, projeto, prioridade e data', () => {
    expect(
      parseQuickCapture('Fechar escopo #arquitetura @gateway !p0 sex', CONTEXT),
    ).toEqual({
      title: 'Fechar escopo',
      tagNames: ['arquitetura'],
      projectId: 'gateway',
      priority: 'P0',
      dueDate: '2026-09-04',
    })
  })

  it('acha o projeto por uma palavra do meio do nome, sem acento', () => {
    expect(parseQuickCapture('Nota @migracao', CONTEXT).projectId).toBe('gateway')
    expect(parseQuickCapture('Nota @portal', CONTEXT).projectId).toBe('parceiro')
  })

  it('devolve o marcador ao título quando nada casa', () => {
    const capture = parseQuickCapture('Ler proposta @gatewai !p9', CONTEXT)

    expect(capture.title).toBe('Ler proposta @gatewai !p9')
    expect(capture.projectId).toBeNull()
    expect(capture.priority).toBeNull()
  })

  it('entende hoje, amanhã e o dia da semana corrente', () => {
    expect(parseQuickCapture('a hoje', CONTEXT).dueDate).toBe('2026-09-03')
    expect(parseQuickCapture('a amanhã', CONTEXT).dueDate).toBe('2026-09-04')
    expect(parseQuickCapture('a qui', CONTEXT).dueDate).toBe('2026-09-03')
    expect(parseQuickCapture('a seg', CONTEXT).dueDate).toBe('2026-09-07')
  })

  it('completa o ano da data curta com a próxima ocorrência', () => {
    expect(parseQuickCapture('a 12/09', CONTEXT).dueDate).toBe('2026-09-12')
    expect(parseQuickCapture('a 12/8', CONTEXT).dueDate).toBe('2027-08-12')
    expect(parseQuickCapture('a 12/09/2028', CONTEXT).dueDate).toBe('2028-09-12')
  })

  it('recusa data que não existe no calendário', () => {
    expect(parseQuickCapture('a 31/02', CONTEXT).dueDate).toBeNull()
    expect(parseQuickCapture('a 31/02', CONTEXT).title).toBe('a 31/02')
  })

  it('aceita mais de uma tag e ignora o marcador vazio', () => {
    const capture = parseQuickCapture('Retro #pessoal #1:1 # fim', CONTEXT)

    expect(capture.tagNames).toEqual(['pessoal', '1:1'])
    expect(capture.title).toBe('Retro # fim')
  })

  it('mantém apenas o primeiro marcador de cada tipo', () => {
    const capture = parseQuickCapture('x @gateway @parceiro !p0 !p3 hoje amanhã', CONTEXT)

    expect(capture.projectId).toBe('gateway')
    expect(capture.priority).toBe('P0')
    expect(capture.dueDate).toBe('2026-09-03')
    expect(capture.title).toBe('x @parceiro !p3 amanhã')
  })

  it('devolve título vazio quando só há marcadores', () => {
    expect(parseQuickCapture('  @gateway  ', CONTEXT).title).toBe('')
  })
})
