// Espelha o seed de 002_seed_default_phases.sql. A galeria não abre banco;
// nas telas de verdade a cor sempre chega por prop vinda do repositório.
export const SAMPLE_PHASES = [
  { id: 'development', name: 'Desenvolvimento', color: 'oklch(0.545 0.16 292)' },
  { id: 'internal_homologation', name: 'Homolog. interna', color: 'oklch(0.55 0.11 212)' },
  { id: 'external_homologation', name: 'Homolog. externa', color: 'oklch(0.6 0.115 62)' },
  { id: 'production', name: 'Produção', color: 'oklch(0.52 0.115 152)' },
] as const
