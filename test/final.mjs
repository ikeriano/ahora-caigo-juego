import puppeteer from 'puppeteer-core'
const [,, base='http://127.0.0.1:4180/', W='844', H='390', which='final', prefix='previews/'] = process.argv
const sleep = ms => new Promise(r => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] })
const p = await b.newPage()
await p.setViewport({ width: +W, height: +H, deviceScaleFactor: 1 })
p.on('pageerror', e => console.log('PAGEERROR', e.message))
const log = (...a) => console.log(new Date().toISOString().slice(11,19), ...a)
const shot = async n => { await p.screenshot({ path: prefix + n }); log('shot', n) }
const until = async (fn, ms = 60000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await p.evaluate(fn).catch(() => false)) return true; await sleep(150) } throw new Error('timeout ' + fn) }
const visW = async (k, ms = 60000) => p.waitForFunction(k => { const e = __st.els.get(k); return !!e && e.style.display !== 'none' && e.style.opacity !== '0' }, { timeout: ms, polling: 200 }, k)
const theme = which === 'final' ? 'primetime' : 'halloween'
await p.goto(base + `?nosw&screen=play&theme=${theme}`, { waitUntil: 'load' })
await until(() => window.__eng && document.querySelector('.mbtn.gold'))
await p.evaluate(w => { window.__testRodadas = w === 'final' ? 7 : 0 }, which)
await p.evaluate(() => { window.__startMode('programa') })
await sleep(3000); await shot(`${which}-cabecera.png`)
await p.click('#btnSkip')
await until(() => [...document.querySelectorAll('#actions button')].some(b => b.textContent.includes('centro')), 20000)
await p.evaluate(() => [...document.querySelectorAll('#actions button')].find(b => b.textContent.includes('centro')).click())
await until(() => document.querySelector('img.huella') && getComputedStyle(document.querySelector('img.huella')).display !== 'none', 40000)
await sleep(600); await p.evaluate(() => [...document.querySelectorAll('img.huella')].filter(i => i.classList.contains('click'))[0].click())
await until(() => window.__panel.active, 30000)
if (which === 'lose') {
  await sleep(1500); await shot('lose-prueba.png')
  await until(() => window.__eng.studio.holes[0].target === 1, 50000); await sleep(350); await shot('06b-caida-concursante.png')
  await until(() => document.getElementById('credits') && !document.getElementById('credits').classList.contains('hidden'), 30000)
  await sleep(4000); await shot('19-despedida.png')
  await until(() => !!document.getElementById('finCard'), 40000); await sleep(1500); await shot('20-despedida-fin.png')
  await until(() => [...document.querySelectorAll('#actions button')].length > 0, 30000); await sleep(800); await shot('21-resultado.png')
  await b.close(); process.exit(0)
}
const answer = async () => { const m = await p.evaluate(() => window.__panel.q.missing.join('')); await p.keyboard.type(m) }
await sleep(800); await answer()
await visW('Moeda1', 40000); await sleep(800)
await p.evaluate(() => __st.els.get('Moeda2').click())
await visW('BotãoMenu4', 60000); await sleep(1000); await shot('22-decision.png')
await p.evaluate(() => __st.els.get('BotãoMenu4').click())
for (let i = 0; i < 10; i++) {
  await until(() => window.__panel.active, 40000); await sleep(500)
  if (i === 2) { await shot('23-juego-final.png'); await p.evaluate(() => __panel.st.els.get('Teclado27').click()); await until(() => window.__panel.active, 20000); await sleep(400) }
  await answer(); log('final', i + 1); await sleep(1200)
}
await sleep(3000); await shot('24-ganador.png')
await until(() => document.getElementById('credits') && !document.getElementById('credits').classList.contains('hidden'), 40000)
await sleep(5000); await shot('19-despedida-primetime.png')
await until(() => !!document.getElementById('finCard'), 40000); await sleep(1500); await shot('20-despedida-fin-primetime.png')
await until(() => [...document.querySelectorAll('#actions button')].length > 0, 30000); await sleep(800); await shot('21-resultado-ganador.png')
await b.close()
