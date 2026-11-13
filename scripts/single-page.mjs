// Crea publish/mahjong-romagnolo.html: un'unica pagina con CSS e JS incorporati,
// pronta per essere pubblicata come pagina online (claude.ai) o su qualsiasi hosting statico.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'dist'
const html = readFileSync(join(dist, 'index.html'), 'utf8')

const cssHref = html.match(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"/)?.[1]
const jsSrc = html.match(/<script type="module"[^>]*src="\.\/(assets\/[^"]+\.js)"/)?.[1]
if (!cssHref || !jsSrc) throw new Error('Build non trovata: esegui prima npm run build')

const css = readFileSync(join(dist, cssHref), 'utf8')
const js = readFileSync(join(dist, jsSrc), 'utf8').replace(/<\/script/gi, '<\\/script')
const fonts = [...html.matchAll(/<link href="(https:\/\/fonts\.googleapis\.com[^"]+)" rel="stylesheet" \/>/g)].map((m) => m[1])

const page = `<title>Mahjong Romagnolo</title>
<meta name="theme-color" content="#0f5b4a">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fonts.map((f) => `<link rel="stylesheet" href="${f}">`).join('\n')}
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`
mkdirSync('publish', { recursive: true })
writeFileSync('publish/mahjong-romagnolo.html', page)
console.log(`publish/mahjong-romagnolo.html: ${(page.length / 1024).toFixed(0)} KB, ${fonts.length} font`)
