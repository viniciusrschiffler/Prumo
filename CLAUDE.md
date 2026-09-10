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

**`grid` sozinho não segura texto longo: a trilha precisa de `minmax(0,1fr)`.** A coluna
implícita é `auto`, que cresce até o max-content do item, então um nome de projeto comprido na
lista contextual da barra lateral esticava a linha e a lista ganhava rolagem horizontal —
verificado com 215px de largura contra 438px de conteúdo. O `truncate` no rótulo não basta; o
que decide é a trilha, mais o `min-w-0` na linha. A lista rola só na vertical, `overflow-y-auto`.

**Input `sr-only` sem pai posicionado estica a página inteira.** O `sr-only` do Tailwind é
`position: absolute`, e sem contêiner posicionado no caminho a caixa de marcar escapa do
`overflow-auto` da tela e vira altura de rolagem no `documentElement` — era a segunda barra
vertical de Configurações, 1180px de `scrollHeight` num viewport de 900. O `Checkbox` leva
`relative` no `label` por isso. Nenhuma barra de rolagem deve existir fora do conteúdo do
`ScreenShell`: se aparecer uma segunda, procure elemento absoluto sem pai posicionado.

**O conteúdo de Configurações é centralizado, e o mockup não é.** O `Configuracoes.dc.html`
escreve `max-width: 1040px` sem `margin: 0 auto`, o que só não desalinha porque ele é desenhado
perto de 1280. Numa janela larga a coluna ficava colada à esquerda com um vazio do tamanho dela
à direita, então o `mx-auto` entrou. É a única das nove telas com coluna de largura máxima.

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

**O preflight do Tailwind v4 não marca mais o botão como clicável.** A v3 punha
`cursor: pointer` no `button`; a v4 tirou, e sem a regra de base em `main.css` a janela
inteira responde com a seta de texto. A regra cobre `button`, `select`, caixa de marcar e
`[role="button"]`, sempre com `:not(:disabled)` — o desabilitado tem a própria utilidade. O
que é clicável sem ser nenhum dos quatro, como a linha de tarefa e a de projeto, leva
`cursor-pointer` na própria className.

**O Lightning CSS descarta seletor que o alvo do build não entende.** Um `label:has(...)`
escrito na regra de cursor sumiu do bundle sem aviso — verificado em `dist`. Antes de
confiar num seletor moderno em `main.css`, procure-o no CSS gerado.

**Data é campo de texto com máscara, não `input[type=date]`.** O passo de dd/mm/aaaa em fonte
mono é do design, e o campo nativo imprime no formato do locale do sistema. O `DateField`
mantém o texto e põe o campo nativo transparente atrás do botão de calendário, só para chamar
o `showPicker`: com `display: none` o Chromium recusa a chamada, porque o elemento precisa
estar de fato renderizado. A máscara vive em `maskDisplayDate` e só insere a barra quando o
grupo seguinte já tem dígito — inseri-la assim que o grupo fecha prenderia o backspace.

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
- **A paleta de comandos existe desde a tela de Hoje**, e o que ela lista é o próprio
  `shortcutRegistry`: os atalhos globais da navegação mais os da tela em foco. O design não a
  desenha em lugar nenhum, então a forma saiu do Sistema de Design; o conteúdo não é
  inventado, e não existe segunda lista de comandos para sair de sincronia com a primeira. O
  botão "Comandos ⌘K" da TodoList ainda não foi ligado nela; o de Painéis já foi.
- **O ⋯ da linha de todo também ficou de fora**, pela mesma razão. Adiar e vincular projeto,
  que seriam o conteúdo natural do menu, já têm atalho de teclado na linha.
- **Recorrente não gera todo.** A tabela `todo_recurrence` é lida e o painel lateral mostra a
  cadência e o último disparo, mas nada agenda a geração — o design não desenha esse gatilho.
- **Pausar projeto não existe como ação, mas retomar existe.** O card de decisão da tela de
  Hoje limpa `project.paused_at` e volta o status para `active`; quem preenche a coluna
  continua sendo só o seed. Desbloquear também nasceu ali, com o par bloquear já na tela de
  Projetos.
- **O "Abrir simulador" do rodapé da Timeline ficou de fora**, pelo mesmo critério do "Simular"
  da tela de Projeto.
- **O ponto vermelho de sobrecarga na navegação não existe.** Os nove mockups o desenham ao
  lado de "Capacidade"; ele mora na Sidebar e pede uma leitura que os contadores da navegação
  ainda não fazem.
- **Editar existe para projeto, tarefa e todo, e não para alocação nem evento.** O design não
  desenha formulário de edição nenhum, então o formulário de edição é o de criação: o mesmo
  componente, com `mode`. Alocação se mexe pelas ações que já têm evento próprio — bloquear,
  desbloquear, realocar —, e evento registrado é histórico, que não se reescreve.

## A edição de projeto, tarefa e todo

O design desenha os três modais de criação e nenhum de edição. Criar e editar preenchem os
mesmos campos, então são o mesmo componente — `ProjectFormModal`, `TaskFormModal` e
`TodoFormModal`, com `mode` decidindo título, rótulo do botão e a dica que só a criação tem.
Os testes estão em `domain/projects/editProject.test.ts`, `domain/projects/editTask.test.ts` e
`domain/todos/editTodo.test.ts`.

**O formulário só mexe no que ele pergunta.** Arquivamento e pausa do projeto, e as datas
reais da tarefa, ficam de fora: cada um tem ação própria com evento no histórico, e
deixá-los cair num formulário apagaria esse rastro. O status do projeto segue a mesma regra.

**O status da tarefa é a exceção, e virou campo do formulário.** A regra acima o mantinha de
fora pela ação própria que ele teria — e essa ação não existe em tela nenhuma, então toda
tarefa nascia e morria em "A fazer". O `Select` de Situação lista os cinco valores do enum,
`cancelled` incluído, porque tarefa cancelada é leitura que o domínio já faz: ela não conta em
esforço, progresso nem período. A troca de status não registra evento: o histórico do projeto
é sobre o plano, e o design não desenha evento para tarefa que anda.

**A descrição da tarefa é coluna nova, `task.description`, aberta pela migração 005.** É um
`ALTER TABLE` simples — o `CHECK` do status não muda e nenhuma tabela referencia `task` por
gatilho, então nada de reconstrução como na 003 e na 004. O `toDescription` trata texto em
branco como ausência, para a coluna anulável não guardar string vazia. A tabela de tarefas não
ganhou coluna: o texto aparece no `title` da linha, junto do nome da tarefa.

**Editar tarefa nunca deleta alocação.** Tirar a pessoa preenche `ended_at` com
`TASK_EDIT_ALLOCATION_REASON`; trocar o percentual encerra a de antes e abre outra sobre a
janela da tarefa; quem ficou igual não é tocado.

**Mudar só a janela da tarefa não mexe em alocação nenhuma.** É a mesma leitura do arrasto da
Timeline, e ela preserva a janela que outra decisão fixou — a alocação que o desbloqueio
recriou começa no dia do desbloqueio, não no início da tarefa, e reescrevê-la desfaria isso.

**Editar tarefa registra o mesmo evento `replan` do arrasto**, pelo mesmo `buildTaskReschedule`,
e no mesmo `executeBatch` da alocação. Título, fase e estimativa mudam sem evento: o histórico
do projeto é sobre o plano, e o design não desenha evento para renomear tarefa.

**A prévia de impacto troca a tarefa editada, não a soma de novo.** O `previewTaskImpact`
recebe `replacedTaskId`; sem ele o "antes" perderia a tarefa e o "depois" contaria duas.

**A prévia de conflito responde pelo formulário, não pelo que a gravação faria.** Ela varre o
mundo sem a tarefa editada e com as pessoas do formulário sobre a janela do formulário. Para a
alocação que a gravação preserva com outra janela — a do desbloqueio — as duas leituras
divergem; o alerta de conflito da própria tela de Projeto continua sendo o que responde pelo
mundo gravado.

**Trocar o projeto de um todo solta a tarefa dele**, a mesma regra do "@" da linha: a tarefa
pertence ao projeto de antes.

**O vínculo com tag é reescrito inteiro**, no projeto e no todo. O formulário devolve a lista
final; comparar nome a nome para achar o que entrou e o que saiu daria o mesmo por mais
caminho. A tag continua sendo resolvida por nome dentro da mesma transação.

**Onde se chega à edição.** No projeto, pelo botão "Editar" do cabeçalho e pelo `E`. Na tarefa,
clicando a linha ou pelo Enter sobre ela. No todo, clicando o título ou pelo `E` sobre a linha —
o título é um botão com `tabIndex={-1}`, porque o foco da linha mora na caixa de marcar e um
segundo destino de Tab por linha desfaria isso.

**A barra lateral alterna claro e escuro; "Sistema" mora nas Configurações.** Um botão de três
estados mostra o tema em vigor e esconde de onde ele veio. O clique grava a preferência pelo
`writeSetting` — antes ele mexia só no store, e a escolha se perdia no próximo boot além de
divergir do controle segmentado das Configurações.

## A tela de Projeto contra o mockup

O `Projeto.dc.html` se contradiz em seis pontos. Em todos vale o valor derivado, e o teste que
prova cada um está em `domain/projects/`. Não "conserte" a tela para bater com o mockup.

| Onde | Mockup | Derivado |
| --- | --- | --- |
| Progresso | 33% | **13%** — 40h concluídas de 320h, o que `calculateProgress` já media |
| Aba Alocações | 4 | **8** — 5 abertas e 3 encerradas, que nunca são deletadas |
| Aba Notas | 6 | **2** — o que a tabela `note` liga a `gateway`, um cartão cada |
| Histórico | 14 | **8** — paginado de sete em sete, então "Carregar 1 evento anterior" |
| Desvio do Cutover | — | **+11d** — o mesmo desvio do projeto, que sai justamente dele |
| Diff do evento de escopo | fim 18/09 → 29/09 | **26/06 → 18/09** — o mockup mistura baseline v1→v2 no esforço com v2→atual no fim; congelar baseline compara v1 com v2 nos dois |

**A aba Notas lista cartão, e o cartão navega.** O mockup só imprime o número, e número que não
leva a lugar nenhum é o mesmo que botão que não faz nada. **O título do cartão é o nome do
arquivo, não o primeiro `#` do documento:** a aba responde pela tabela `note`, e ler cada `.md`
do disco a cada troca de aba custaria uma varredura da pasta. O clique põe o caminho em
`requestNote` e navega para Notas — a rota não carrega o caminho do arquivo, que tem barra e não
caberia num parâmetro —, e o `useNotesScreenData` abre a nota pedida antes de cair no primeiro
arquivo da árvore.

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
| Subtítulo | 11 em aberto · 2 atrasados · 6 vinculados | **7 em aberto · 2 em progresso · 2 bloqueados · 1 atrasado** |
| Concluídos na semana | 1 | **1** — o `td-alertas`, concluído em 01/09 |
| Cartões do painel | Concluídos · Atrasados · Em aberto · Sem projeto | **Concluídos 1 · Bloqueados 2 · Em progresso 2 · Atrasados 1** |
| Colunas do Kanban | 4 fixas de status | **4** — Backlog 3, Em progresso 2, Bloqueado 2, Feito 1 |
| Por projeto | 4 projetos | **4 não arquivados + Sem projeto** — o ERP cancelado tem `archived_at` |
| Recorrentes | 2 cartões fictícios | **1** — "Revisão semanal de capacidade", `semanal-seg` |
| Tags da sidebar | 1:1, contratação, arquitetura, pessoal, reunião | **3** — só as que algum todo carrega |

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
propagação. O cartão do Kanban repete o mesmo arranjo, então `S`, `E`, `@` e as setas
funcionam nas duas visões.

## O Kanban da TodoList

O design ganhou uma segunda visão para esta tela, e com ela o **status de todo virou quatro
valores**: `open` (Backlog), `in_progress`, `blocked` e `done`. A migração 004 reconstrói
`todo` e `todo_tag` para abrir o `CHECK` — mesma técnica da 003, porque dropar `todo` com a
chave estrangeira ligada dispararia o `CASCADE` de `todo_tag`.

**`cancelled` continua no enum e fora do quadro.** Nenhum caminho do app o escreve; ele fica
porque o banco o aceita desde a 001. Todo cancelado não entra em coluna nenhuma, não conta em
"em aberto" e não aparece no formulário.

**"Em aberto" passou a ser "não concluído", não a coluna Backlog.** Quem está em progresso ou
bloqueado continua pedindo trabalho. Vale para o subtítulo, para o painel lateral, para
"Vencem hoje" e para o contador de Notas na navegação — o `COUNT_OPEN_TODOS` conta
`status NOT IN ('done', 'cancelled')`.

**A lista e o quadro partem das mesmas divisões.** `buildTodoGroups` devolve todas elas e
`groupTodos` joga fora a vazia, que é o que a lista quer; `buildTodoBoard` mantém em pé a
coluna vazia **para a qual dá para arrastar** e descarta a outra. Assim toda coluna vazia do
quadro é um destino, e não um buraco.

**O arrasto grava o campo do agrupamento em vigor**, como o rodapé do modal promete: status,
prioridade, projeto ou data. Cada um cai na ação que já existia — o quadro não abriu caminho
de escrita próprio.

**Duas colunas de vencimento não recebem card.** "Atrasados", porque nada torna um item
atrasado por escolha, e "Concluídos antes", porque é uma data que já passou. As duas só
aparecem quando têm o que mostrar. "Concluídos hoje", essa, recebe: soltar ali marca o item
como feito.

**Desmarcar a caixa devolve o item a "Em progresso"**, e não ao Backlog. É o que o mockup do
quadro faz, e o schema não guarda de qual coluna o item saiu.

**Agrupado por status, o concluído sempre aparece.** É a coluna "Feito" que o revela, senão
ela mentiria sobre estar vazia. Nos outros três agrupamentos o botão "Mostrar concluídos"
continua mandando — o mockup também libera o concluído no agrupamento por vencimento, e ali
isso deixaria o botão sem função nenhuma.

**O selo de status some da linha e do cartão quando o agrupamento é por status**, porque o
cabeçalho do grupo já diz o mesmo.

**Status virou filtro na barra lateral, no molde das tags.** O design desenha a lista com
contador e o mesmo hover das tags, que nesta tela já são filtro. É a única das nove telas com
duas listas contextuais, então o `useSidebarLeadContext` publica a de cima e o `screenMeta`
segue nomeando só a de baixo.

**O "+ Novo item" da coluna abre o formulário já preenchido com o campo daquela coluna.** Um
botão por coluna que criasse tudo no mesmo lugar seria pior que um botão só.

**`compareTodos` da tela de Hoje comparava o status cru** para descer o concluído. Com quatro
status o comparador ficou inconsistente e trocou a ordem da lista — passou a comparar só o
"é concluído". Verificado no seed.

**O `v` alterna as duas visões.** O design desenha o controle segmentado e nenhuma tecla; o
atalho entrou porque toda outra troca de modo desta tela já é alcançável pelo teclado, e ele
aparece na paleta de comandos como qualquer outro.

## A tela de Timeline contra o mockup

O `support.js` embutido no `Timeline.dc.html` decifra a geometria e ela bate dia a dia com o
seed: `span` de 245 dias a partir de 01/03/2026, barra em `left = dif(inícioDaJanela, início)`
e `width = dif(início, fim)`. Os offsets 11→26, 29→75, 78→117 e 184→212 são exatamente as
quatro tarefas da Migração do gateway, e 75.92% é o 03/09. O `timelineGeometry.test.ts`
reproduz essas porcentagens casa decimal por casa decimal.

O que o mockup diz e o seed desmente está em `domain/timeline/timelineScreen.seed.test.ts`.
Vale o derivado.

| Onde | Mockup | Derivado |
| --- | --- | --- |
| Janela | 01/03 → 31/10 · 8 meses | **01/02/2026 → 31/10/2026 · 9 meses** — `pp-jur` começa em 02/02 e o mockup a corta |
| Rodapé · Projeto | 4 projetos · 4 tarefas visíveis | **4 projetos · 10 tarefas visíveis** — o ERP tem `archived_at` |
| Rodapé · Pessoa | 3 pessoas · 7 alocações | **3 pessoas ativas · 12 alocações** — a Júlia é inativa |
| Rodapé · Fase | 4 fases · 9 barras | **4 fases · 8 barras** |
| Desenvolvimento | 3 tar · 280h | **4 tar · 320h** |
| Homolog. interna | 2 tar · 176h | **2 tar · 140h** |
| Produção | 2 tar · 160h | **2 tar · 96h** |
| Conflitos | 1 | **2** — Rafael 150% em junho e Ana 150% em março, contra o Portal |
| Botão | "Baseline v2" | **"Baseline"** — a baseline é por projeto, não existe uma v2 da tela |
| Portal do parceiro | barra cobrindo a janela toda | **02/02 → 16/03**, com a hachura de bloqueio separada |
| Abrir simulador | botão no rodapé | **fora** — mesmo critério do "Simular" da tela de Projeto |

Seis leituras que o mockup deixou ambíguas:

- **A hachura de bloqueio tem o comprimento do número que o selo mostra.** Bloqueio fechado vai
  do `block` ao `unblock` — os 22/07 → 30/07 da Migração, idênticos ao mockup; bloqueio aberto
  para em hoje, que é o que dá os 23 dias do Portal. Levá-la até o fim da janela pintaria dias
  que ainda não foram perdidos.
- **O selo conta o presente, a hachura conta o passado.** Um bloqueio já desfeito continua
  desenhado na barra mas sai do selo, senão a Migração mostraria "bloq. 8d" onde o mockup
  mostra o desvio de +11d.
- **O bloqueio do projeto só hachura a linha de fase cujo trabalho ele parou.** A linha de
  projeto responde pela vida inteira dele; a de fase, só por aquele trabalho. Sem o recorte, o
  bloqueio de julho apareceria solto sobre a barra de setembro da Produção.
- **A barra e o fantasma não são centralizados na linha, e é de propósito.** A faixa de baixo
  fica reservada ao fantasma em toda linha, para a barra não pular quando o `B` liga e desliga.
- **Arrastar reescreve o plano, então a borda que a realidade fixou não se move.**
  `canResizeStart` cai com `actual_start` e `canResizeEnd` com `actual_end`; tarefa concluída
  não é arrastável e nem para o Tab. O que vai ao banco é o deslocamento aplicado sobre
  `planned_start`/`planned_end`, nunca a barra desenhada, que pode nascer da data real.
- **Os projetos entram na ordem em que começam**, não em ordem alfabética nem na do mockup, que
  não segue nenhuma das duas.

**O zoom escolhe a granularidade do tick e a largura mínima dele.** Semana usa 56px por tick e
passa da largura da janela, então a grade rola e a coluna de rótulos gruda na esquerda; mês e
trimestre cabem, e as colunas ficam proporcionais aos dias reais como no mockup. Trimestre não
é mais estreito que mês: ele desenha menos linhas de grade, que é o que zoom para fora faz aqui.

**A janela sempre inclui hoje**, mesmo que nenhum projeto passe por perto, senão o "Ir para
hoje" levaria a um ponto fora da grade desenhada.

**O vazio não está no design.** As nove telas não desenham a Timeline sem dado, então o texto
("Nenhuma tarefa com data") foi escrito no mesmo tom dos outros `EmptyState`.

**As fases na barra lateral são legenda, não filtro.** O design desenha a lista com o quadrado
colorido e não diz o que o clique faria, então o `screenMeta` ganhou o `contextVariant: 'legend'`,
que renderiza a linha sem botão — mesmo critério do "Simular".

**`--hatch-neutral` nasceu aqui.** É a hachura da barra pausada, que só o `Timeline.dc.html`
desenha; o valor entrou nos tokens exatamente como o design o escreve, `--text2` com alfa.

**Replanejamento é tipo de evento próprio, `replan`.** Arrastar grava as datas novas e o evento
no mesmo `executeBatch`, com a tarefa ligada em `project_event_task`. A migração 003 abriu o
`CHECK` reconstruindo `project_event` junto com as duas tabelas que a referenciam, porque o
caminho oficial exige desligar a chave estrangeira e o `PRAGMA` é ignorado dentro da transação.

**`project.paused_at` também nasceu aqui**, porque a hachura de pausa precisa saber desde quando.
A ação de pausar ainda não existe em tela nenhuma: quem preenche a coluna hoje é o seed.

## A tela de Capacidade contra o mockup

A janela bate: doze semanas a partir da semana corrente, **S36 → S47**, exatamente o que o
cabeçalho do design imprime. Os números dentro dela não batem, e a diferença muda a tela
inteira — as sobrecargas do seed são de março e junho, e a janela olha para frente. O teste
que prova cada linha está em `domain/capacity/capacityScreen.seed.test.ts`.

| Onde | Mockup | Derivado |
| --- | --- | --- |
| Ana | 80 80 80 80 80 60 60 40 40 20 20 0 | **50 50 50 50** e livre daí em diante |
| Rafael | 100 **150 150 150 150** 100 100 75 75 50 50 25 | **50 50 50 50** e livre daí em diante |
| Marcos | 30 ×5, depois 0 | **30 ×5**, depois 0 |
| Júlia | 0…10 10 10 0 | **—** em toda semana: inativa e sem alocação viva |
| Alerta vermelho | "Rafael acima de 100% em 4 semanas" | **nenhum** — o pico do seed na janela é 50% |
| Semanas com sobrealocação | 4 · "todas concentradas em 1 pessoa" | **0** |
| Folga do time | — | **1115h · 84% da capacidade total** |
| Quem tem mais folga | Marcos Teles · 100% livre a partir de S41 | **Ana Nogueira · 100% livre a partir de S40** |
| Alerta "Júlia inativa com alocação futura" | presente | **fora** — a alocação dela foi encerrada em 11/08 |
| Uso médio do time | — | **16%**, com "Capacidade sobrando de S41 em diante" igual ao mockup |
| Mês no subtítulo | "set a nov 2026" | **"ago a nov 2026"** — a semana S36 começa em 31/08 |

**A semana vale o pico dos dias dela, não a soma do que a cruza.** Duas alocações que se
revezam dentro da mesma semana nunca dividiram um dia, e somá-las pintava de vermelho uma
semana em que ninguém passou da capacidade — verificado no seed deslocado, onde a realocação
do Rafael fecha uma alocação e abre a outra em 31/08 e a matriz inventava 150% em S36. A
varredura de conflito já responde por dia; a matriz precisa dizer a mesma coisa que ela.
`calculateWeeklyCapacity` foi corrigido e passou a ser a única definição de "quando a alocação
para de consumir capacidade", com o `effectiveEndOf` que `allocationConflicts` já usava.

**A capacidade do time só conta pessoa ativa.** A inativa fica na matriz porque o histórico
dela não some, mas emprestar a capacidade dela diluiria o uso médio com horas que ninguém pode
gastar. Dá os mesmos 110h/sem do mockup por outro caminho: lá a Júlia entra com capacidade 0.

**O empate de folga é desempatado por nome.** Ana e Rafael terminam a janela com as mesmas
400h livres e a tela precisa de uma resposta só; por nome ela é estável entre dois
carregamentos da mesma janela.

**"Quem eu consigo tirar" responde ao problema da pessoa selecionada.** Quando ela estoura, o
período é o da sobrecarga dela — os S37–S40 do mockup; quando não estoura, é a semana sob o
cursor. Entra só quem tem hora sobrando *no período*, e o texto de cada cartão é derivado das
alocações, sem a prosa editorial do mockup ("substituto natural em Observabilidade").

**O atraso do simulador sai das horas, não da régua.** Tirar alguém por N semanas custa
`N × percentual × capacidade` horas, que quem fica na tarefa precisa de tempo a mais para
cobrir; sem ninguém para cobrir, o trabalho espera a volta e o atraso é o próprio afastamento.
Isso reduz exatamente aos +21d que o mockup mostra, onde a pessoa está sozinha a 100%.

**A tabela do simulador só lista trabalho que ainda corre.** Alocação já cumprida não tem
plano a deslocar, e listá-la encheria o "o que não se move" de tarefa antiga — verificado na
Ana, que tem duas alocações do gateway terminadas em março e maio.

**Aplicar grava cinco coisas num `executeBatch` só**: encerra a alocação com motivo (nunca
deleta), abre a alocação de volta a partir do dia seguinte ao afastamento, desloca o
`planned_end` da tarefa, registra o evento `reallocation` ligado à tarefa e congela a baseline
seguinte **já com as datas novas** — congelá-la antes do deslocamento faria o desvio nascer
diferente de zero. Quando o afastamento passa do novo fim da tarefa, não há a que voltar e a
alocação nova não nasce.

**Duas leituras que o mockup deixou ambíguas:**

- **"Por" é `Select` de "N semanas"**, não campo de texto livre. O texto na tela fica idêntico
  ao do mockup e some o caminho de interpretar linguagem natural.
- **"Filtrar projeto" abre modal de escolha**, no molde do "Vincular projeto" da TodoList. O
  design desenha o botão e não desenha o que ele abre.

**As pessoas entram por nome, com a inativa por último** — não na ordem do mockup, que não
segue nenhuma regra.

**O vazio não está no design.** As nove telas não desenham a Capacidade sem pessoa, então o
texto ("Nenhuma pessoa cadastrada") foi escrito no mesmo tom dos outros `EmptyState`.

**As três opacidades do mapa de calor viraram classe.** `.heat-light`, `.heat-medium` e
`.heat-heavy` derivam do `--heat-base` com `oklch(from ...)`, a mesma técnica do
`phase-tinted`, mantendo o token único e deixando o tema trocar o verde por baixo.

**A divisória de coluna da célula vai em estilo inline.** A célula pinta a borda inteira pelo
grau de calor, e uma segunda utilidade de cor de borda na mesma string dependeria da ordem na
folha de estilo para decidir quem vence.

**O ponto vermelho da navegação ficou de fora.** Os nove mockups desenham um ponto ao lado de
"Capacidade" como sinal global de que há gente estourada, mas ele mora na Sidebar e depende de
uma leitura que o `useNavigationCountsStore` ainda não faz. Sobre o seed ele ficaria apagado.

## A tela de Hoje contra o mockup

Três blocos batem exatamente com o seed — "Esperando sua decisão" inteiro, a tarefa sem
responsável e os 18 dias sem atualização da Observabilidade. O resto diverge, e vale o
derivado. O teste que prova cada linha está em `domain/today/todayScreen.seed.test.ts`.

| Onde | Mockup | Derivado |
| --- | --- | --- |
| Vencem hoje | 4 | **5** — os 4 de hoje mais o `td-contrato`, vencido em 30/08 |
| Item concluído às 14:02 | presente | **fora** — nenhum todo do seed foi concluído hoje |
| Tarefas de hoje | 5 · 3 começam · 2 terminam | **7 · 2 começam · 5 terminam** |
| Começam | Rewrite do roteador, Roteiro, Cutover | **Roteiro (60h, não 40h) e Cutover (16h, não 8h)** — o Rewrite começou em 30/03 |
| Terminam | 1 fim + 1 atraso | **5, todas em atraso** — nenhuma tarefa do seed termina hoje |
| Alertas de consistência | 3 | **2** — a sobrecarga do Rafael é de S23–S26, já passada |
| Capacidade usada | 94% | **45%** — 49h de 110h |
| Dias bloqueados | 5 | **3** — o Portal, de 31/08 até hoje |
| Eventos registrados | 7 | **1** |
| Todos concluídos | 12 | **1** |
| Contador "Hoje" na navegação | 9 | **12** |

**"Terminam" guarda o que termina hoje e o que já deveria ter terminado.** O mockup põe a
aprovação jurídica, vencida em março, nesse grupo com o selo de atraso: o que passou do fim
previsto pede decisão hoje tanto quanto o que fecha hoje. O selo é `fim` quando o fim previsto
é hoje e `atraso` quando já passou. "Começam" fica exato em hoje — o que deveria ter começado e
não começou já aparece pelo atraso do fim.

**"Vencem hoje" inclui o vencido e o concluído hoje.** Sem o concluído, marcar a caixa faria a
linha sumir debaixo do cursor, e é justamente uma linha marcada que o mockup desenha.

**A sobrecarga só alerta se alcança hoje ou o futuro.** Os outros dois alertas do design falam
do agora, e um vermelho sobre um mês que já passou não tem ação possível. A varredura é o
mesmo `findPersonOverloads` da Timeline, filtrado por `period.end >= hoje`.

**O bloqueio aberto para em hoje na contagem de dias da semana.** Contar até o domingo pintaria
de vermelho dias que ainda não foram perdidos — é a mesma leitura da hachura da Timeline. A
capacidade do time conta só pessoa ativa, como na tela de Capacidade.

**A segunda linha do card pausado sai das alocações vivas.** "Marcos Teles segue 30% alocado" é
derivado; a prosa do evento que pausou o projeto ("decidir se realoca na próxima semana") era
editorial e ficou de fora.

**O placeholder da captura rápida não é o do design.** O mockup promete "vira todo, tarefa ou
nota" e o `parseQuickCapture` só cria todo. Prometer o que o campo não faz é pior que o texto
divergir.

**Desbloquear e Adiar abrem modal; Retomar não.** O desbloqueio precisa de um motivo — o evento
`unblock` tem título obrigatório, e o par bloquear já pergunta o dele. O adiamento precisa da
data nova, que o design não diz qual é. Retomar não precisa de nenhum dado, então age direto.

**Retomar registra um evento `decision`.** O design não pede o registro, e essa foi a única
decisão tomada sem o mockup: num app cujo produto é o histórico, trocar de status sem rastro é
pior que o evento a mais. Pausar é a decisão contrária e o seed a grava como `decision`.

**O desbloqueio recria as alocações que o bloqueio encerrou**, no mesmo `executeBatch` do evento
e do status, começando no dia do desbloqueio e indo até o fim atual da tarefa — quando esse fim
já passou não há a que voltar e a alocação nova não nasce, a mesma regra do `buildResumedAllocation`
da realocação. Só volta o que *aquele* bloqueio encerrou: alocação encerrada antes dele o foi por
outro motivo, e ressuscitá-la desfaria uma decisão que ninguém pediu para desfazer.

**"Realocar", "Abrir capacidade" e "Simular remoção" navegam para a Capacidade**, sem
preseleção de pessoa: o `CapacityScreen` não recebe estado por rota, e abrir esse canal é
escopo de outra tela.

**Quatro variações de aparência viraram prop nesta tela**, pela armadilha já registrada:
`AccentCard` ganhou `spacing`, `Button` ganhou o passo de 26px e a variante `outline` de borda
neutra, e `ProgressBar` ganhou a barra de 12px do bloqueio. O ícone do `Alert` virou o primitivo
`AlertIcon` porque a linha de alerta de Hoje tem forma própria — selo na linha do título e botões
embaixo — e brigaria com o padding do aviso do catálogo.

**O `SectionHeading` e o `QuickCaptureField` nasceram em `primitives/`** porque servem também a
TodoList. O `rule` do primeiro decide o fio *e* o respiro: a coluna principal imprime os dois
juntos, a contextual, nenhum dos dois.

**O ponto do `SidebarContextItem` é sinal sem número.** O `metaDot` desenha o ponto vermelho que
os mockups põem ao lado do projeto com risco em aberto, onde o desvio não tem o que dizer.

## A tela de Notas contra o mockup

**Ela é a única das nove que não usa o `ScreenShell`, e não é descuido.** O cabeçalho de Notas
pertence ao documento aberto, não à tela: o `h1` é o nome do arquivo, o `padding` é `12px 18px`
contra os `12px 20px` das outras oito, e ele não cobre a árvore — vive dentro do painel direito.
O nome "Notas" aparece só na navegação.

Por isso nasceram dois tokens tipográficos. O `--text-doc-title` de 17px é o cabeçalho do
documento e o `--text-article-title` de 22px é o título do preview. O catálogo para em 28/20/15,
como já parou antes do `--text-meta`, do `--text-column` e do `--text-metric`. As telas ganham.

O mockup desenha 9 arquivos em 5 pastas; o seed grava 3 arquivos planos em `notas/`. Vale o
derivado, e o teste que prova cada número está em `domain/notes/notesScreen.seed.test.ts`.

| Onde | Mockup | Derivado |
| --- | --- | --- |
| Árvore | 9 `.md` · 5 pastas | **3 `.md` · nenhuma pasta** — a árvore fica plana até alguém criar uma |
| Filtrar por projeto | Todos 9 · Migração 3 · Portal 2 · Sem projeto 4 | **Todos 3 · Migração do gateway 2 · Portal do parceiro 1** |
| Sem projeto | presente | **fora** — toda nota do seed está vinculada, mesma regra das tags da TodoList |
| Rodapé da barra lateral | `~/Documentos/plano/notas` | **a pasta de dados** — o `SidebarFooter` é das nove telas |
| Preview de `decisao-provedor.md` | tabela, bloco de código e callout | **o conteúdo real do arquivo** — o mockup embute um documento fictício |
| `tipo:: / data:: / projeto::` no corpo | convenção do mockup | **fora** — tipo, data e projeto saem da tabela `note` |

**Quem manda na árvore é o disco, não a tabela.** O `.md` existe na pasta mesmo sem linha em
`note`, e é a linha que acrescenta o vínculo com projeto e com evento. Um arquivo sem linha
aparece como nota pessoal; uma linha sem arquivo é o que o "Verificar arquivos" das Configurações
já sabe acusar.

**O tipo do selo é derivado do vínculo.** Nota ligada a evento é do tipo daquele evento
("decisão"), ligada só a projeto é "nota de projeto", e sem vínculo é "nota pessoal". Não existe
coluna de tipo.

**A `note_search` não tem gatilho**, ao contrário da `project_event_search`. Quem a mantém em dia
é a gravação da nota, no mesmo `executeBatch` da linha. Conteúdo e vínculo entram por caminhos
separados de propósito: gravar o texto não pode apagar o projeto já ligado.

**O arquivo vai ao disco antes da linha ao banco.** O disco é a fonte de verdade da nota; um
índice atrasado é recuperável, um texto perdido não.

**A gravação é automática.** O design não desenha botão de salvar nem cita ⌘S no rodapé — desenha
um indicador de estado. O texto vai ao disco 800ms depois da última tecla, no blur do editor e ao
sair da tela; trocar de arquivo com edição pendente cobra a gravação antes de o próximo entrar.

**O cabeçalho da árvore tem os dois botões, e diz onde vai criar.** Um "+" só, de pasta, não
respondia a "e para criar arquivo dentro dela?". O rótulo do cabeçalho é a pasta de destino, e o
`resolveTargetFolder` a escolhe como o explorador do VS Code: pasta selecionada recebe o item
novo, arquivo selecionado manda para a pasta dele, nada selecionado escreve na raiz. **A lupa
ficou de fora**, pelo critério do "Simular" da tela de Projeto: ela só focaria o campo de busca
uma linha abaixo.

**O botão de criar também abre o destino.** Criar dentro de pasta fechada faria o arquivo novo
nascer invisível, então o mesmo gesto que pede a criação tira a pasta e os ancestrais dela do
conjunto de fechadas. Isso mora no evento, não num efeito que observe a seleção: um efeito
impediria fechar justamente a pasta da nota aberta.

**A árvore fecha pasta, e o filtro abre todas.** Pasta fechada esconde o que mora dentro dela em
qualquer profundidade e continua na lista, com o ▸ trocando pelo ▾. Com filtro de projeto ou
busca em vigor a árvore passa inteira: esconder um resultado atrás de pasta fechada faria a busca
mentir sobre o que encontrou. O rodapé conta a árvore filtrada, não a expandida — o total não
pode mudar porque alguém fechou uma pasta.

**O botão direito abre menu na árvore**, com "Nova nota aqui", "Nova pasta aqui" e o excluir da
linha. O `stopPropagation` da linha é obrigatório: sem ele o menu da área vazia chegaria depois e
trocaria o nó pelo `null` da raiz. Na área vazia da árvore o mesmo menu sai sem o excluir, criando
na raiz.

**Excluir existe para nota e para pasta, com confirmação.** Chega-se por três caminhos: o menu de
contexto, o `Delete` sobre a linha com foco e o ✕ do cabeçalho do documento. O `planNoteDeletion`
varre a pasta antes para dizer quantas notas vão junto e para saber quais linhas tirar da tabela
`note` e da `note_search` — o `removeAll` faz as duas coisas num lote só. **A ordem é a mesma da
gravação, com uma etapa a mais na frente:** o editor fecha primeiro, senão a gravação automática
pendente recriaria no disco o arquivo recém-apagado; depois vai o disco e só então o banco.

**A nova nota pede título em modal, e não nome de arquivo na linha.** É a única divergência
consciente em relação ao VS Code aqui: lá se digita o nome do arquivo na própria árvore, e o
título com acento se perderia no `toNoteSlug`. O modal pergunta o título, que vira o primeiro `#`
do arquivo, mostra o caminho resultante antes de gravar e traz a pasta de destino como `Select`
já preenchido — o mesmo campo no modal de pasta, que antes usava a seleção em silêncio e não
deixava escolher a raiz.

**Vincular evento entra no modal do "Vincular projeto".** O design desenha o callout "Nota
vinculada" e nenhum controle que o crie. Escolhido o projeto, aparece a lista de eventos dele;
trocar de projeto solta o evento, que pertence ao projeto e não à nota.

**O link do preview não navega.** O markdown reconhece `[texto](destino)` e o pinta como link,
mas ele é texto: a janela não tem navegador e abrir origem remota contraria a regra de rede zero.
O destino fica no `title`.

**O leitor de markdown é próprio e mora em `domain/notes/`.** O `parseInlineMarkdown` de
`domain/format/` continua como está — o histórico do projeto mostra o evento numa linha só e
reconhece apenas negrito de propósito; a nota é um documento, com título, lista, tabela, código
cercado e callout `> [!rótulo]`. Nenhuma dependência nova.

**O título grande do preview é o primeiro `#` do arquivo**, e ele sai do corpo para não ser
impresso duas vezes. Sem `#` nenhum, quem dá nome ao documento é o nome do arquivo.

**O ⌘P alterna editor e preview, nunca o dividido.** Voltar ao dividido pela tecla faria a mesma
tecla ter três destinos; o modo dividido é escolha do controle segmentado.

**O contador de Notas na navegação conta arquivo, não linha.** Contá-lo pela tabela `note`
mostraria um número diferente do que a árvore imprime, porque um `.md` largado na pasta ainda não
tem linha. Pasta ilegível não derruba os outros contadores — ela só não soma.

**O vazio não está no design.** As nove telas não desenham a árvore sem nota, então o texto saiu
no tom dos outros `EmptyState`. O texto de pasta vazia, esse, é o do mockup.

**Três variações de aparência viraram prop nesta tela**, pela armadilha já registrada: `Input`
ganhou o passo `dense` de 26px do campo de busca, `IconButton` ganhou o `compact` de 22px que o
`ThemeCycleButton` já desenhava à mão, e `SidebarContextItem` passou a imprimir o quadradinho de
cor que o filtro por projeto pede. O `PhaseStripe` nasceu em `primitives/` porque o traço de 3px
já se repetia nas telas de Projeto e Capacidade.

**O tom de cada tipo de evento virou `PROJECT_EVENT_TONES`**, em `ui/labels/`. Ele servia só ao
cartão do histórico e agora serve também ao modal de vínculo; duas listas sairiam de sincronia na
primeira cor nova.

## A tela de Painéis contra o mockup

A janela bate exatamente: 04/08/2026, 05/06/2026 e 03/09/2025 são as três datas que o
subtítulo do design imprime, e são as que `buildDashboardPeriod` devolve. Os números dentro
dela não batem, e o teste que prova cada linha está em
`domain/dashboards/dashboardsScreen.seed.test.ts`. Vale o derivado.

| Onde | Mockup (90d) | Derivado (90d) |
| --- | --- | --- |
| Projetos entregues | 2 | **0** — e 0 nos três períodos: nenhum projeto do seed tem todas as tarefas contadas concluídas |
| Atraso médio | +9d | **+8d** — média dos quatro projetos, não o +11d da Migração sozinha |
| Esforço planejado | 1.008h | **396h** — 236h em 30d e 604h em 12m |
| Uso de capacidade | 76% | **73%** — 66% em 30d e 36% em 12m |
| Dias bloqueado | 31d | **31d** — bate |
| Pessoas por projeto | Migração 200% · Observ. 150% | **Migração 150% · Observ. 100% · Portal 100% · App 30%** |
| Projetos por fase | 4 · 3 · 2 · 3 | **3 · 0 · 1 · 0** — cada projeto conta uma fase só, a atual |
| Tempo médio | 38 · 24 · 129 · 16 | **43 · 34 · — · 18**; em 12m, **36,75 · 34 · 42 · 18** |
| Gargalo | Homolog. externa · 1,1× o desenvolvimento | **Desenvolvimento · 2,4× o tempo de produção** |
| Bloqueio por mês | jun 0 · jul 8 · ago 20 · set 3 | **jun 0 · jul 8 · ago 21 · set 2** |
| Bloqueio por projeto | Portal 23d · Migração 8d | **igual** — bate |
| Distribuição de carga | Ana 74 · Rafael 121 · Marcos 30 | **Rafael 96 · Ana 89 · Marcos 21** — ninguém estoura no trimestre |
| Alerta de sobrecarga na carga | Rafael em vermelho | **fora** — o vermelho só entra acima de 100% |
| Eventos | 7 tipos · 30 eventos | **8 tipos · 12 eventos** — o `replan` nasceu na migração 003, depois do desenho |
| Bloqueio em 12 meses | 6 colunas escolhidas a dedo | **13 colunas** — todo mês da janela, como o próprio mockup faz com o "jun" zerado dos 90 dias |

Seis leituras que o mockup deixou ambíguas:

- **"N alocações ativas" conta alocação, não pessoa.** O mockup soma o número de pessoas sob um
  rótulo que diz alocações; vale o que o rótulo promete.
- **A barra do projeto mede o pico simultâneo, não a soma da janela.** Somar tudo que passou pelo
  projeto contaria três vezes a mesma pessoa que trocou de alocação duas vezes. É a mesma leitura
  por dia de `calculateWeeklyCapacity` e da varredura de conflito, e é o que faz a Observabilidade
  cair a 0% em 30 dias — o caso "encerradas" que o mockup previu e não produz.
- **O gargalo compara com a fase mais rápida, não com a primeira da lista.** Fase é configurável e
  a primeira pode ser a mais lenta, o que daria "X é 1,0× o tempo de X". Sobre o seed é o próprio
  desenvolvimento que é o gargalo no trimestre.
- **O tom do atraso médio e o dos dias bloqueado são derivados.** O mockup os pinta de vermelho sem
  condição; time adiantado, ou janela sem bloqueio nenhum, não tem o que alarmar.
- **O KPI de bloqueio imprime o número puro** e o cabeçalho do gráfico imprime "31d no período",
  exatamente como o mockup escreve os dois.
- **O bloqueio que atravessa a virada do mês é repartido pela fronteira**, não duplicado nela: a
  soma das colunas devolve o mesmo total que `calculateBlockedDays` mede sobre a janela inteira.

**O cartão de gráfico não é o `SectionCard`.** Ali o cabeçalho é uma faixa com fio embaixo; aqui
ele divide o mesmo respiro de 11px do conteúdo, sem separador, dentro de um padding de 13px. O
`ChartCard` mora na pasta da tela porque só ela o usa.

**Painéis é a única das nove telas que imprime o número do indicador em 20px.** Hoje, Capacidade e
TodoList usam os 18px do `--text-metric`. O passo de 20px já existe como `--text-entity-title`, com
o mesmo peso e o mesmo espacejamento que o design escreve, então o `StatCard` ganhou `size` em vez
de um token novo.

**O seletor de período usa o passo padrão de 10px.** O `Paineis.dc.html` escreve `padding:4px 11px`
e é o único dos oito a fazê-lo: Capacidade, Notas, Projetos e TodoList escrevem 4px 10px, que é o
`size` default do `SegmentedControl`.

**As fases da barra lateral são legenda, não filtro** — o `contextVariant: 'legend'` da Timeline,
pelo mesmo critério: o design desenha a lista com o quadrado colorido e não diz o que o clique faria.

**A exportação sai em um arquivo só, em formato longo** (`secao,item,valor,unidade`), na pasta
`export/` ao lado do dump JSON. O design desenha o botão e não desenha o formato. Uma coluna por
gráfico daria uma tabela esburacada, porque os seis não compartilham eixo; o formato longo carrega
os dois números de um mesmo item em duas linhas, distinguidas pela unidade. O separador é a vírgula
e o decimal é o ponto, como o RFC 4180 os define: trocar por ponto e vírgula agradaria a uma
configuração de planilha e quebraria todas as outras.

**`buildDashboardCsv` recebe os rótulos de tipo de evento de fora.** Nome em português de valor de
enum é da camada de UI, e `domain/` não importa `ui/`.

**O vazio não está no design.** Os nove mockups não desenham os Painéis sem projeto com atividade,
então o texto ("Nenhum projeto com atividade") saiu no tom dos outros `EmptyState`.
