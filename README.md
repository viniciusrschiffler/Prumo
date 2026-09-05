# Prumo

Aplicativo desktop de organização de projetos. Roda 100% local e offline: sem
conta, sem sincronização, sem telemetria e sem nenhuma requisição de rede em
tempo de execução.

Tauri v2 · React 18 · TypeScript · Vite · SQLite · Tailwind CSS v4 · Zod ·
Zustand · Vitest.

## Pré-requisitos de ambiente

O frontend precisa apenas de Node. O empacotamento desktop é compilado em Rust
e exige mais duas coisas no Windows.

### 1. Node.js 20 ou superior

Verificar com `node -v`. Os testes usam o `node:sqlite`, que existe a partir do
Node 22.

### 2. Ferramentas de build C++ da Microsoft

O compilador Rust usa o linker da Microsoft (`link.exe`) e o Windows SDK. No
Visual Studio Installer, marque a carga de trabalho **"Desenvolvimento para
desktop com C++"** e confirme que o **Windows 11 SDK** está selecionado — a
carga de trabalho nem sempre traz o SDK, e sem ele a compilação falha com
`LNK1181: cannot open input file 'dbghelp.lib'`.

Se preferir não instalar o Visual Studio completo, baixe o
[Build Tools para Visual Studio](https://visualstudio.microsoft.com/downloads/)
e selecione a mesma carga de trabalho.

### 3. Rust

Instale pelo [rustup](https://rustup.rs/) e **reabra o terminal em seguida** —
terminais já abertos não enxergam o novo PATH:

```
winget install Rustlang.Rustup
rustup default stable-msvc
```

Verificar com `rustc --version` e `cargo --version`.

### 4. WebView2

Já vem instalado no Windows 11. Em versões anteriores, baixe o
[runtime do WebView2](https://developer.microsoft.com/microsoft-edge/webview2/).

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run tauri dev` | Sobe o app desktop com recarga automática |
| `npm run build` | Checa os tipos, gera o bundle e roda o guard offline |
| `npm run test` | Roda os testes uma vez |
| `npm run test:watch` | Roda os testes em modo observador |
| `npm run lint` | Roda o oxlint |
| `npm run seed` | Recria o banco com os dados fictícios do design |
| `npm run tauri build` | Gera o executável e os instaladores |
| `npm run tauri build -- --no-bundle` | Gera só o executável de produção |

A primeira compilação Rust baixa e compila todas as dependências e leva vários
minutos. As seguintes são incrementais.

`npm run dev` sozinho abre o frontend no navegador, mas sem o runtime do Tauri o
banco não abre — serve para mexer em layout, não para exercitar o app.

## Dados de desenvolvimento

`npm run seed` apaga e recria o banco com as pessoas, projetos, tarefas, alocações,
baselines, eventos, todos e notas das telas do design, e escreve as notas como
arquivos `.md` de verdade em `notas/`. As datas do design são ancoradas em
03/09/2026 e deslocadas para o hoje real, então a tela Hoje sempre tem conteúdo.

O script recusa apagar um banco que não tenha a marca dele; use `--force` se
quiser mesmo descartar.

## Onde ficam os dados

Enquanto a tela de Configurações não permite escolher a pasta, o banco é criado
em `%APPDATA%\com.prumo.app\prumo.db`, com as migrações aplicadas e as quatro
fases padrão semeadas no primeiro boot. Apagar esse arquivo recria tudo do zero.

## Navegação por teclado

`G` seguido de uma letra troca de tela: `T` Hoje · `P` Projetos · `L` Timeline ·
`C` Capacidade · `D` TodoList · `N` Notas · `G` Painéis. A sequência expira em
1,2 segundos.

## Documentação

A arquitetura, as convenções, as restrições e as armadilhas já mapeadas do
projeto estão em `CLAUDE.md` — leia antes de mexer no código.

A pasta `design/` guarda o design de referência em arquivos `.dc.html`; é
material de consulta e não entra no build.
