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
| `npm run seed` | Recria o banco com os dados fictícios do design |

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

**A pasta de dados não pode ser gravada no `setting`.** É ela que localiza o banco onde a
tabela `setting` mora. O caminho escolhido vai num arquivo de uma linha, `data-folder.txt`,
na pasta de configuração do app, lido no boot antes de abrir o banco.

**Trocar de pasta exige fechar a conexão.** O `openInProgress` do `DatabaseConnection` é
memoizado de propósito, então sem o `closeDatabase` o app reabriria o arquivo antigo.

**A capability tem escopo de fs só na pasta de configuração do app.** `appconfig-read-recursive`
e `appconfig-write-recursive` existem porque o card de arquivos e o exportar precisam ler e
escrever na pasta padrão, que ninguém escolheu pelo diálogo e portanto não tem escopo de
runtime. Fora dela nada mudou: o acesso continua vindo só do diálogo, guardado entre
sessões pelo `persisted-scope`.

**O w-full não pode morar na base de campo de formulário.** Entre duas utilidades de width
quem decide é a ordem na folha de estilo, não a ordem na string de classes, então um
`w-full` na base vence qualquer largura que a tela passe. O `FIELD_BASE_CLASSES` não tem
largura; o grid ou o flex ao redor estica o campo.

**O `min-w-0` na base do campo é outra coisa, e é necessário.** Sem ele o input não encolhe
abaixo da largura intrínseca do atributo `size` e vaza de trilha de grid estreita — verificado
na coluna de data de 130px do modal de registrar evento. Não é utilidade de width, não disputa
com nenhuma classe que a tela passe.

**Variação de aparência em primitivo vira prop, nunca className.** Vale para toda propriedade
CSS, não só width: `Tabs` ganhou `bordered`, `Badge` ganhou `weight`, `PriorityBadge` ganhou
`variant` e `ProgressBar` ganhou `track` e `size` exatamente por isso. Passar `font-normal` ou
`border-b-0` por className depende da ordem na folha de estilo e falha em silêncio.

**Avatar tem duas cores de alerta e elas não são sinônimos.** Vermelho é passar da capacidade,
como a tela de Capacidade marca; âmbar é disputar o período com outro projeto, o conflito da
tela de Projeto. A pessoa pode estar num sem estar no outro, então `PersonAvatar` recebe `tone`.

**Peso e espacejamento de um token tipográfico são sobrescrevíveis, tamanho não.** O
Tailwind v4 emite `font-weight: var(--tw-font-weight, 600)`, então `font-medium` e
`tracking-normal` vencem o token sem depender de ordem. Verificado no bundle.

**Testes têm projeto TypeScript próprio** (`tsconfig.test.json`), para que os tipos do Node
não fiquem visíveis ao código do app, que roda no webview.

## Seed de desenvolvimento

`scripts/seed.ts` roda em TypeScript direto no Node e reusa `splitSqlStatements` para
aplicar as migrações. Ele ancora as datas do design em 03/09/2026 e desloca tudo para o
hoje real, preservando as distâncias.

`src/domain/derived/seedMatchesDesign.test.ts` roda as funções derivadas sobre esse seed,
sem deslocamento, e compara com os números impressos nas telas do design: 320h e +11d na
Migração do gateway, 168h e +23d no Portal do parceiro, 23 dias bloqueado, −2d no App de
campo e Rafael em 150% na semana de 01/06. Divergência ali significa seed errado ou função
derivada errada.

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

O catálogo também não cobre três usos que aparecem nas 9 telas, e que por isso viraram
token. O passo de 11px do catálogo é o **título de grupo**, com peso 600 e espacejamento de
0.08em (`--text-label`). O **subtítulo mono do cabeçalho** é 11px com peso 400 e sem
espacejamento (`--text-meta`), e o **rótulo de coluna de tabela densa** é 10px com 0.06em
(`--text-column`). Não confunda os três. O quarto é o **número grande do cartão de
indicador**, 18px com peso 600 (`--text-metric`), que Hoje, Capacidade e TodoList imprimem
no mesmo cartão — não é o `--text-section-title` de 15px da faixa de métricas da tela de
Projeto.

O vazio segue a mesma regra do título de tela: o catálogo desenha 26px de respiro com título
de 13px, as telas imprimem 40 a 44px com título de 15px. O `EmptyState` nasceu pelo catálogo
e ganhou `size="large"` para as telas; as telas de Projeto e Projetos ainda usam o padrão.

O cabeçalho é idêntico nas 9 telas: `padding: 12px 20px`, fundo `--panel` e borda embaixo. É
o que o `ScreenShell` faz.

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

- **Importar de pasta não existe.** O botão está na tela de Configurações e avisa isso ao
  ser clicado. O par dele, o exportar, já grava o dump JSON completo em `export/`.
- **Backup automático não existe.** Mesma situação: o alerta e o botão estão montados como
  no design, e o clique avisa que a funcionalidade ainda não chegou.
- `phase.color` é uma coluna só e o design tem variante clara e escura. A variante escura é
  derivada em CSS pela classe `phase-tinted`, com `oklch(from ...)`, mantendo a coluna única.
- Cada contrato de repositório novo entra junto com a feature que o usa.
- Configurações não tem atalho de navegação: o `screenMeta` dá `navigationKeys: null` e o
  rodapé do design não mostra tecla. Chega-se lá pelo link do rodapé, alcançável por Tab.
- **Simular e ⋯ não existem na tela de Projeto.** O design desenha o botão "Simular" no alerta
  de conflito e um "⋯" no canto do cabeçalho, sem definir o que qualquer um dos dois faz.
  Ficaram de fora: botão que não faz nada é pior que botão ausente.
- **A paleta de comandos não existe.** O botão "Comandos ⌘K" aparece em Hoje, Painéis e
  TodoList sem que o design diga o que ele abre, então ficou de fora pelo mesmo critério do
  "Simular". Entra junto com a tela de Hoje, que é a próxima a pedir ele.
- **O ⋯ da linha de todo também ficou de fora**, pela mesma razão. Adiar e vincular projeto,
  que seriam o conteúdo natural do menu, já têm atalho de teclado na linha.
- **Recorrente não gera todo.** A tabela `todo_recurrence` é lida e o painel lateral mostra a
  cadência e o último disparo, mas nada agenda a geração — o design não desenha esse gatilho.

## A tela de Projeto contra o mockup

O `Projeto.dc.html` se contradiz em seis pontos. Em todos vale o valor derivado, e o teste que
prova cada um está em `domain/projects/`. Não "conserte" a tela para bater com o mockup.

| Onde | Mockup | Derivado |
| --- | --- | --- |
| Progresso | 33% | **13%** — 40h concluídas de 320h, o que `calculateProgress` já media |
| Aba Alocações | 4 | **8** — 5 abertas e 3 encerradas, que nunca são deletadas |
| Aba Notas | 6 | **2** — o que a tabela `note` liga a `gateway` |
| Histórico | 14 | **8** — paginado de sete em sete, então "Carregar 1 evento anterior" |
| Desvio do Cutover | — | **+11d** — o mesmo desvio do projeto, que sai justamente dele |
| Diff do evento de escopo | fim 18/09 → 29/09 | **26/06 → 18/09** — o mockup mistura baseline v1→v2 no esforço com v2→atual no fim; congelar baseline compara v1 com v2 nos dois |

Duas escolhas de leitura que o mockup deixou ambíguas:

- **"Capacidade" na tabela de alocações é o que aquela alocação consome por semana**, percentual
  × capacidade da pessoa — e não a capacidade crua dela. O percentual já está na coluna ao lado.
- **O conflito é varrido por fronteira de data**, não por semana fixa, então o alerta mostra o
  período exato. Uma alocação encerrada num dia para de contar nesse dia: a realocação abre a
  nova na mesma data em que fecha a antiga, e contar as duas inventaria um conflito de 24 horas.

O mockup mostra só o conflito do Rafael porque tem menos alocações que o seed. Sobre o seed a
Ana também estoura, em março, contra o Portal do parceiro — e os dois alertas aparecem.

**Mudança de escopo tem token próprio, `--event-scope`.** É o único tipo de evento sem cor
semântica no catálogo; o design usa `--ph-dev`, que é seed de fase. O valor é o mesmo roxo.

## A tela de TodoList contra o mockup

O mockup tem 12 todos inventados; o seed tem 8. Vale o derivado, e o teste que prova cada
número está em `domain/todos/todoScreen.seed.test.ts`.

| Onde | Mockup | Derivado |
| --- | --- | --- |
| Subtítulo | 11 em aberto · 2 atrasados · 6 vinculados | **7 em aberto · 1 atrasado · 5 vinculados a projeto** |
| Concluídos na semana | 1 | **1** — o `td-alertas`, concluído em 01/09 |
| Atrasados · Em aberto · Sem projeto | 2 · 11 · 5 | **1 · 7 · 2** |
| Por projeto | 4 projetos | **4 não arquivados + Sem projeto** — o ERP cancelado tem `archived_at` |
| Recorrentes | 2 cartões fictícios | **1** — "Revisão semanal de capacidade", `semanal-seg` |
| Tags da sidebar | 1:1, contratação, arquitetura, pessoal, reunião | **as 5 da tabela `tag`** |

Quatro leituras que o mockup deixou ambíguas:

- **"Esta semana" fecha no fim da semana corrente**, não em `hoje + 3`. As duas leituras dão
  06/09 no design, mas só esta respeita o início de semana das Configurações.
- **"Concluídos" no painel lateral é da semana corrente.** O cartão está sob o título "Esta
  semana"; somar todo concluído de qualquer data faria o número só crescer.
- **O grupo de concluídos virou dois.** O mockup só desenha "Concluídos hoje", mas o botão
  revela todo concluído de qualquer data — o de 01/09 do seed cairia num grupo que mente
  sobre ele. Quem foi concluído em outro dia vai para **"Concluídos antes"**.
- **A coluna de data de um item concluído mostra a hora só se ele foi concluído hoje**, a
  mesma razão do `formatModifiedAt` na tela de Notas. Nos outros dias sai a data curta.

**P1 é âmbar aqui e vermelho na tela de Projetos.** Não é descuido de nenhuma das duas: a de
Projetos separa crítico de não crítico, o recorte da visão salva que o próprio produto traz,
e pinta P0 e P1 igual; a de TodoList gradua a urgência. É o que o `scale` do `PriorityBadge`
distingue.

**O foco da linha mora na caixa de marcar.** Ela é um `input` de verdade, então o espaço já
alterna sem `preventDefault` e o Tab alcança toda linha sem tabindex móvel. As setas, o `S`
de adiar e o `@` de vincular projeto saem do `onKeyDown` da linha, que recebe o evento por
propagação.
