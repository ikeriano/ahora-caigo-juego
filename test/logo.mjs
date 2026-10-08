// Previews del logo: menú/portada, momento logo de la cabecera (normal + tema) y primer plano de una pantalla del plató
import puppeteer from 'puppeteer-core'
const [,, base = 'http://127.0.0.1:4180/', themes = 'normal,navidad'] = process.argv
const P = 'previews/logo/'
const sleep = ms => new Promise(r => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p = await b.newPage(); await p.setViewport({ width: 1000, height: 563, deviceScaleFactor: 1 })
p.on('pageerror', e => console.log('PAGEERROR', e.message))
for (const th of themes.split(',')) {
  await p.goto(base + `?nosw&screen=title&theme=${th}`, { waitUntil: 'load' })
  await p.waitForFunction(() => window.__eng && document.querySelector('.tlogo'), { timeout: 30000 }); await sleep(2200)
  await p.screenshot({ path: P + th + '-portada.png' })
  await p.goto(base + `?nosw&screen=main&theme=${th}`, { waitUntil: 'load' })
  await p.waitForFunction(() => window.__eng && document.querySelector('.mbtn'), { timeout: 30000 }); await sleep(1500)
  await p.screenshot({ path: P + th + '-menu.png' })
  // primer plano de la pantalla central del plató
  await p.evaluate(() => { document.getElementById('menu').classList.add('hidden') })
  await p.evaluate(() => { const e = window.__eng; e.cut(new window.THREE.Vector3(0, 3.6, -6.4), new window.THREE.Vector3(0, 3.55, -11.6)) }); await sleep(700)
  await p.screenshot({ path: P + th + '-pantalla-plato.png' })
  await p.goto(base + `?nosw&screen=play&theme=${th}`, { waitUntil: 'load' })
  await p.waitForFunction(() => window.__eng && document.querySelector('.mbtn.gold'), { timeout: 30000 })
  await p.evaluate(() => { void window.__startMode('programa') })
  await p.waitForFunction(() => window.__audio.musicName() != null, { timeout: 15000 })
  const mt = () => p.evaluate(() => { const n = window.__audio.musicName(); return n ? window.__audio.musicTime(n) : 99 })
  while ((await mt()) < 2.0) await sleep(50)
  await p.screenshot({ path: P + th + '-cabecera-tunel.png' })
  while ((await mt()) < 5.6) await sleep(50)
  await p.screenshot({ path: P + th + '-cabecera-logo.png' }); console.log('ok', th)
}
await b.close()
