// Previews de cada programa especial: logo del menú (HUD), momento logo de la cabecera y plató con hashtag + pantallas
import puppeteer from 'puppeteer-core'
const [,, base = 'http://127.0.0.1:4180/', only = ''] = process.argv
const P = 'previews/temas/'
const sleep = ms => new Promise(r => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p = await b.newPage(); await p.setViewport({ width: 1000, height: 563, deviceScaleFactor: 1 })
const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERROR', e.message) })
const themes = (only ? only.split(',') : ['normal', 'primetime', 'halloween', 'ninos', 'nochebuena', 'navidad', 'carnaval', 'findeano', 'verano', 'especial300'])
for (const [i, th] of themes.entries()) {
  const n = String(i + 1).padStart(2, '0') + '-' + th
  await p.goto(base + `?nosw&screen=main&theme=${th}`, { waitUntil: 'load' })
  await p.waitForFunction(() => window.__eng && document.querySelector('.mbtn'), { timeout: 30000 }); await sleep(1800)
  await p.screenshot({ path: P + n + '-menu.png' })
  await p.evaluate(() => { void window.__startMode('programa') })
  await p.waitForFunction(() => window.__audio.musicName() != null, { timeout: 15000 })
  const mt = () => p.evaluate(() => { const n = window.__audio.musicName(); return n ? window.__audio.musicTime(n) : 99 })
  while ((await mt()) < 5.3) await sleep(50)
  await p.screenshot({ path: P + n + '-cabecera-logo.png' })
  while ((await mt()) < 8.9) await sleep(80)
  await p.screenshot({ path: P + n + '-plato-hashtag.png' })
  const tag = await p.evaluate(() => document.getElementById('hashtag').textContent)
  console.log(n, tag)
}
if (!only || only.includes('entrena')) {
  await p.goto(base + '?nosw&mode=entrenamiento&sub=pruebas', { waitUntil: 'load' })
  await p.waitForFunction(() => window.__panel?.active, { timeout: 30000 }); await sleep(1500)
  await p.screenshot({ path: P + '11-entrenamiento-hashtag.png' }); console.log('entrenamiento', await p.evaluate(() => document.getElementById('hashtag').textContent))
}
console.log(errs.length ? 'ERRORES ' + errs.length : 'sin errores')
await b.close()
