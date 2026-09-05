import { access, readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const BUNDLE_DIRECTORY = fileURLToPath(new URL('../dist', import.meta.url))
const SCANNED_EXTENSIONS = new Set(['.js', '.mjs', '.css', '.html', '.json', '.svg'])
const URL_PATTERN = /\bhttps?:\/\/[^\s"'`)<>]+/g
const CSS_COMMENT_PATTERN = /\/\*[\s\S]*?\*\//g
const ALLOWED_URL_PREFIXES = [
  'http://localhost',
  'https://localhost',
  'http://127.0.0.1',
  'http://ipc.localhost',
  'http://asset.localhost',
  'https://tauri.localhost',
  'http://www.w3.org/',
  // React e React Router concatenam estas URLs no texto de mensagens de erro; são string, nunca requisição.
  'https://reactjs.org/docs/error-decoder.html',
  'https://reactrouter.com/en/main/routers/picking-a-router',
  // O Zod valida IPv6 parseando com new URL('http://[...]'); parse, nunca requisição.
  'http://[',
  // Identificadores de dialeto do conversor JSON Schema do Zod; são valores de objeto.
  'https://json-schema.org/draft/',
  'http://json-schema.org/draft-',
]

async function collectScannableFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectScannableFiles(fullPath)))
      continue
    }

    if (SCANNED_EXTENSIONS.has(extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

function findExternalUrls(content, extension) {
  const scannable = extension === '.css' ? content.replaceAll(CSS_COMMENT_PATTERN, '') : content
  const matches = scannable.match(URL_PATTERN) ?? []
  const unique = [...new Set(matches)]

  return unique.filter((url) => !ALLOWED_URL_PREFIXES.some((prefix) => url.startsWith(prefix)))
}

export async function checkOfflineBundle() {
  try {
    await access(BUNDLE_DIRECTORY)
  } catch {
    console.error(`Bundle não encontrado em ${BUNDLE_DIRECTORY}. Rode a build antes desta verificação.`)
    process.exitCode = 1
    return
  }

  const files = await collectScannableFiles(BUNDLE_DIRECTORY)
  const offenders = []

  for (const file of files) {
    const urls = findExternalUrls(await readFile(file, 'utf8'), extname(file))

    if (urls.length > 0) {
      offenders.push({ file: relative(BUNDLE_DIRECTORY, file), urls })
    }
  }

  if (offenders.length === 0) {
    console.log(`Bundle offline verificado: ${files.length} arquivos, nenhuma URL externa.`)
    return
  }

  console.error('O bundle contém URLs externas. O Prumo precisa funcionar sem nenhuma requisição de rede.')
  for (const offender of offenders) {
    console.error(`  ${offender.file}`)
    for (const url of offender.urls) {
      console.error(`    ${url}`)
    }
  }
  process.exitCode = 1
}

await checkOfflineBundle()
