# Prumo

Aplicativo desktop pessoal de organização de projetos, para uso de um Tech Lead.
Tauri v2 com frontend React. Roda 100% local.

## Restrições inegociáveis

- **Zero rede.** Nenhuma requisição em tempo de execução, nenhuma telemetria, nenhum
  auto-update. A CSP em `tauri.conf.json` bloqueia toda origem remota e
  `scripts/checkOfflineBundle.js` quebra a build se uma URL externa aparecer no bundle.
- **Sem conta, sem login, sem sincronização.** Não existe usuário remoto.
- **Janela desktop de largura mínima 1280.** Não é web responsiva; não escreva breakpoints
  de mobile.
- **Temas claro, escuro e sistema** desde sempre. Nenhuma cor pode ser escrita fora dos
  tokens.
- **Capabilities mínimas.** Sem escopo estático de filesystem: o acesso a arquivo existe
  apenas para a pasta que o usuário escolhe pelo diálogo. Não adicione permissão sem
  necessidade demonstrada.
- **O Rust é host mínimo.** Ele registra plugins e expõe `execute_batch`. Toda lógica fica
  em TypeScript. Se parecer que algo precisa de Rust, pare e pergunte.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run tauri dev` | Sobe o app desktop com recarga automática |
| `npm run build` | Checa tipos, gera o bundle e roda o guard offline |
| `npm run test` | Vitest, uma passada |
| `npm run lint` | oxlint |
| `npm run tauri build -- --no-bundle` | Build de produção sem gerar instalador |

## Arquitetura

```
src/
  ui/       componentes, telas, layout, tema, sistema de atalhos
  app/      stores Zustand, roteador, bootstrap
  domain/   schemas Zod, tipos, funções derivadas, contratos de repositório, erros
  infra/    SQLite, migrações, repositórios, configuração
src-tauri/  host Rust
design/     design de referência em .dc.html, material de consulta, fora do build
```

**`domain/` não importa React, Tauri, Zustand nem as outras camadas.** A regra é aplicada
por `no-restricted-imports` no `.oxlintrc.json` — não a relaxe.

O acesso a dados passa pelo contrato `SqlGateway` (`select` e `executeBatch`). Em produção
ele é servido pelo plugin Tauri; nos testes, por `node:sqlite`. Repositório novo depende do
gateway, nunca do `Database` do plugin.

## Convenções

- **Inglês** em identificadores, tipos, nomes de arquivo, colunas do banco e valores de
  enum. **Português** em comentário, mensagem exibida ao usuário, mensagem pública de erro
  e mensagem de commit.
- Commit em português, gerúndio, com prefixo do tipo: `feature: Adicionando ...`.
- Rótulo em português para valor de enum é responsabilidade da camada de UI. O banco guarda
  `active`, a tela mostra "Ativo".
- **Datas**: `isoDate` (`2026-03-12`) para data de planejamento, `isoDateTime` em UTC para
  carimbo de tempo. Aritmética de data fica em `domain/dates/isoDateMath.ts`, sem
  biblioteca. O date-fns entra apenas para formatação de exibição.
- **Erros**: `PrumoError` com código do `errorCatalog`. Mensagem interna vai para o log,
  `publicMessage` vai para a tela. Nenhum catch engole erro.
- **Comentário é exceção.** Só existe para explicar um porquê que o código não mostra, como
  um comportamento externo inesperado. Nada de JSDoc.

## Armadilhas verificadas neste projeto

Cada item abaixo custou tempo e está documentado para não custar de novo.

**`cargo build --release` não é build de produção do Tauri.** O binário sai otimizado mas
continua apontando para `localhost:1420` e sem a CSP. Quem troca o `devUrl` pelo bundle
embutido é o CLI. Use `npm run tauri build`.

**A CSP de dev não é a de produção.** `security.csp` só vale em produção; em dev o Tauri usa
`devCsp`, que está nulo de propósito porque o Vite injeta script inline para o Fast Refresh.
Validar a CSP exige build de produção.

**Transação exige `execute_batch`.** O pool do `tauri-plugin-sql` abre até 10 conexões e
devolve a conexão ao pool a cada chamada, então `BEGIN` e `ROLLBACK` vindos do TypeScript
caem em conexões diferentes e **não têm efeito** — verificado, a linha sobrevive ao
rollback. Toda escrita multi-tabela vai por `executeBatch`.

**`execute` do plugin prepara uma instrução por chamada.** Por isso as migrações passam por
`splitSqlStatements`, que também entende corpo de trigger com ponto e vírgula interno.

**`select<T>` do plugin devolve `Promise<T>`, não `Promise<T[]>`.** Passe o tipo do array:
`select<PersonRow[]>(...)`.

**Chave estrangeira funciona por sorte controlada.** `PRAGMA foreign_keys` é por conexão e o
pool tem várias, então o pragma do boot pega só uma. O que garante a restrição é o
`-DSQLITE_DEFAULT_FOREIGN_KEYS=1` com que o `libsqlite3-sys` compila o SQLite embutido. FTS5
vem pela mesma cadeia. Não troque o driver sem reverificar os dois.

**Tema de janela não funciona aqui.** `setTheme` e `"theme": "Dark"` na config não afetam a
barra de título nem o `prefers-color-scheme` nesta combinação Windows 11 + Tauri 2.11.
Testado e revertido. A saída real é barra de título própria com `decorations: false`.

**O guard offline tem allowlist com motivo.** React e React Router embutem URL de
documentação no *texto* de mensagens de erro; URL em comentário CSS também não faz
requisição. Antes de acrescentar uma entrada, confirme o contexto no bundle.

**Testes têm projeto TypeScript próprio** (`tsconfig.test.json`), para que os tipos do Node
não fiquem visíveis ao código do app, que roda no webview.

## Design

`design/` tem o Sistema de Design e as 9 telas em `.dc.html`. É a fonte de verdade visual,
com quatro correções já aplicadas:

1. O design chama o app de "Plano". O nome é **Prumo**.
2. O design carrega IBM Plex do fonts.googleapis.com. As fontes são empacotadas com
   `@fontsource`.
3. O design fala em `projetos.json`, `pessoas.json` e `todos.json`. Os dados ficam em
   SQLite (`prumo.db`), mais a pasta `notas/` e uma pasta `export/` com o dump JSON.
4. Os tokens `--ph-*` são apenas seed das fases padrão. Fase é configurável e a cor real vem
   do banco. **Nunca hardcode fase no código.**

O catálogo tipográfico define título de tela em 28px, mas todas as 9 telas renderizam o
`h1` em 20px. As telas ganham.

## Modelagem que precisa ser respeitada

- **"Atrasado" e "Risco" não são status.** Atrasado é derivado do fim atual contra a
  baseline vigente; risco é derivado da existência de evento com `risk_open = 1`.
- **Alocação é entidade própria**, nunca array dentro de tarefa.
- **Alocação encerrada nunca é deletada**: preenche `ended_at` e `ended_reason`.
- **Pessoa inativa** some de novas alocações mas mantém o histórico. Remover pessoa com
  alocação é recusado com `PERSON_HAS_HISTORY`.
- **Fase com tarefa não pode ser excluída** (`ON DELETE RESTRICT`).
- **Baseline é versionada por projeto.** v1 nasce com o projeto, com motivo "plano inicial".
- Tarefa cancelada não conta em esforço, progresso nem período do projeto.
- Progresso é ponderado por **horas**, e conta apenas tarefa concluída, porque o schema não
  guarda percentual por tarefa.

## Decisões já tomadas, não reabra sem motivo

- **SQL à mão com Zod validando a linha**, não ORM. O schema está fechado e o que mais se
  usa (FTS5, agregação por período, transação multi-tabela) é onde o driver proxy atrapalha.
- **Renderizador próprio para a Timeline**, em CSS com posicionamento absoluto, não
  vis-timeline. A hachura, a barra fantasma da baseline e o zoom discreto são exatamente o
  que dá trabalho customizar na biblioteca, e já estão prontos como CSS no design.

## Pendências conhecidas

- A pasta de dados ainda é a de configuração do app; falta a tela de Configurações escolher
  a pasta e gravar em `setting`.
- A preferência de tema vive em memória; falta persistir em `setting`.
- `phase.color` é uma coluna só e o design tem variante clara e escura. A intenção é derivar
  a variante escura em CSS com `oklch(from ...)`, mantendo a coluna única.
- O rodapé mostra estado de gravação; vira carimbo de hora quando houver escrita real.
- Só existem três contratos de repositório. Cada novo entra junto com a feature que o usa.
