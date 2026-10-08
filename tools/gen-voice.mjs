// Pregenera la voz sintética GENÉRICA (piper, sin clonación) de todas las frases -> public/voz
//  - presentador: es_ES davefx; oponentes: voces genéricas piper distintas (ver VOCES en src/concursantes.ts)
// Uso: npm run build && (servidor en :4180) && node tools/gen-voice.mjs
import puppeteer from '/workspace/shot-tools/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'
import fs from 'fs'; import { execFileSync } from 'child_process'
const url = process.argv[2] || 'http://127.0.0.1:4180/?nosw&screen=main'
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] })
const p = await b.newPage(); await p.goto(url, { waitUntil: 'load' })
await p.waitForFunction(() => window.__voiceLines, { timeout: 60000 })
const data = await p.evaluate(() => ({ lines: window.__voiceLines(), voces: window.__voces }))
await b.close()
fs.writeFileSync('/tmp/voz-lines.json', JSON.stringify(data, null, 1))
console.log(data.lines.length, 'frases')
execFileSync('/workspace/.venv-asr/bin/python', ['tools/gen-voice.py', '/tmp/voz-lines.json', 'public/voz'], { stdio: 'inherit' })
