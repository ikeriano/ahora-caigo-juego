// Previews de la cabecera nueva sincronizada con la sintonía (Trilha del .sb3)
import puppeteer from 'puppeteer-core'
const [,, base='http://127.0.0.1:4180/', W='1000', H='563', prefix='previews/'] = process.argv
const sleep = ms => new Promise(r => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] })
const p = await b.newPage()
await p.setViewport({ width: +W, height: +H, deviceScaleFactor: 1 })
p.on('pageerror', e => console.log('PAGEERROR', e.message))
await p.goto(base + '?nosw&screen=play', { waitUntil: 'load' })
await p.waitForFunction(() => window.__eng && document.querySelector('.mbtn.gold'), { timeout: 30000 })
await p.evaluate(() => { void window.__startMode('programa') })
const mt = () => p.evaluate(() => window.__audio.musicTime('music/cabecera.mp3'))
const at = async t => { while ((await mt()) < t) await sleep(40) }
const shots = [[1.8, '27-cabecera-tunel.png'], [5.0, '28-cabecera-logo.png'], [8.6, '29-cabecera-dron.png'], [15.6, '30-marcador-premios.png'], [13.0, 'x'], [20.5, '29b-cabecera-orbita.png'], [24.6, '29c-cabecera-techo.png']].sort((a, b) => a[0] - b[0])
for (const [t, n] of shots) { await at(t); if (n !== 'x') { await p.screenshot({ path: prefix + n }); console.log('shot', n, (await mt()).toFixed(2)) } }
// fin: el presentador da la bienvenida
await p.waitForFunction(() => [...document.querySelectorAll('#actions button')].some(b => b.textContent.includes('centro')), { timeout: 60000 })
await p.screenshot({ path: prefix + '29d-cabecera-bienvenida.png' }); console.log('bienvenida ok')
await b.close()
