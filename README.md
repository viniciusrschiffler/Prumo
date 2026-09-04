# Prumo

Aplicativo desktop de organização de projetos. Roda 100% local e offline: sem
conta, sem sincronização, sem telemetria e sem nenhuma requisição de rede em
tempo de execução.

## Pré-requisitos de ambiente

O frontend precisa apenas de Node. O empacotamento desktop é compilado em Rust
e exige mais duas coisas no Windows.

### 1. Node.js 20 ou superior

Verificar com `node -v`.

### 2. Ferramentas de build C++ da Microsoft

O compilador Rust usa o linker da Microsoft (`link.exe`) e o Windows SDK. No
Visual Studio Installer, marque a carga de trabalho **"Desenvolvimento para
desktop com C++"**. Se preferir não instalar o Visual Studio completo, baixe o
[Build Tools para Visual Studio](https://visualstudio.microsoft.com/downloads/)
e selecione a mesma carga de trabalho.

### 3. Rust

Instale pelo [rustup](https://rustup.rs/) e reabra o terminal em seguida:

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
| `npm run dev` | Sobe só o frontend no navegador, em `localhost:1420` |
| `npm run build` | Checa os tipos e gera o bundle de produção |
| `npm run tauri build` | Gera o executável distribuível |
| `npm run test` | Roda os testes uma vez |
| `npm run test:watch` | Roda os testes em modo observador |
| `npm run lint` | Roda o oxlint |

A primeira compilação Rust baixa e compila todas as dependências e leva vários
minutos. As seguintes são incrementais.

## Documentação

A arquitetura, as convenções e as restrições do projeto estão em `CLAUDE.md`.
A pasta `design/` guarda o design de referência em arquivos `.dc.html`; ela é
material de consulta e não entra no build.
