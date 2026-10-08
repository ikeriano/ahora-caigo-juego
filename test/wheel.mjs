// Partida completa vigilando que la rueda ELIGE (MenuEscolha) SOLO aparezca durante la elección de oponente
import puppeteer from 'puppeteer-core'
const [,, base='http://127.0.0.1:4180/', W='844', H='390'] = process.argv
const sleep = ms => new Promise(r => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] })
const p = await b.newPage()
await p.setViewport({ width: +W, height: +H, deviceScaleFactor: 1 })
p.on('pageerror', e => console.log('PAGEERROR', e.message))
p.on('dialog', d => d.accept())
const log = (...a) => console.log(new Date().toISOString().slice(11,19), ...a)
const until = async (fn, ms = 60000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await p.evaluate(fn).catch(() => false)) return true; await sleep(150) } throw new Error('timeout ' + fn) }
await p.evaluateOnNewDocument(() => {
  window.__wheel = { segs: 0, viol: [], on: false, ticks: 0 }
  setInterval(() => {
    const st = window.__st; if (!st) return
    const W = window.__wheel; W.ticks++
    const sh = k => st.isShown(k)
    const wheel = sh('MenuEscolha') || Array.from({ length: 10 }, (_, i) => sh('MenuEscolhaop' + (i + 1))).some(Boolean)
    if (wheel && !W.on) W.segs++
    W.on = wheel
    if (!wheel) return
    const why = []
    if (window.__panel?.active) why.push('prueba')
    if (sh('Moeda1') || sh('Moeda2') || sh('Valores')) why.push('moneda')
    if (sh('ContagemDuelos') || sh('Painel') || sh('PlacarFinal')) why.push('marcador/panel')
    if (!document.getElementById('menu').classList.contains('hidden')) why.push('menu')
    if ([...document.querySelectorAll('#actions button')].length) why.push('acciones/caminar')
    if (document.body.classList.contains('outro')) why.push('outro')
    if (!document.getElementById('btnSkip')?.classList.contains('hidden')) why.push('intro')
    if (!window.__sessionAlive?.()) why.push('sin-partida')
    if (why.length && W.viol.length < 50) W.viol.push(why.join('+') + '@' + Math.round(performance.now()))
  }, 100)
})
const wheelOn = () => p.evaluate(() => window.__wheel.on)
const report = async tag => { const w = await p.evaluate(() => window.__wheel); log(tag, 'segmentos rueda:', w.segs, 'violaciones:', w.viol.length, w.viol.slice(0, 5).join(' | ')); return w }
const pickWheel = async () => {
  await until(() => [...document.querySelectorAll('img.huella.click')].some(i => getComputedStyle(i).display !== 'none'), 60000)
  await sleep(500)
  await p.evaluate(() => [...document.querySelectorAll('img.huella.click')].filter(i => getComputedStyle(i).display !== 'none')[0].click())
  const t = Date.now(); while (await wheelOn()) { if (Date.now() - t > 3000) throw new Error('la rueda no se oculta tras tocar'); await sleep(50) }
  log('rueda oculta tras tocar en', Date.now() - t, 'ms')
}
let fail = false
// ---- 1) Programa completo: partida entera de 8 duelos + plantarse
await p.goto(base + '?nosw&screen=play', { waitUntil: 'load' })
await until(() => window.__eng && document.querySelector('.mbtn.gold'))
await p.evaluate(() => { window.__startMode('programa') })
await sleep(2500); await p.click('#btnSkip')
await until(() => [...document.querySelectorAll('#actions button')].some(b => b.textContent.includes('centro')), 30000)
await sleep(1500)
await p.evaluate(() => [...document.querySelectorAll('#actions button')].find(b => b.textContent.includes('centro')).click())
for (let r = 1; r <= 8; r++) {
  await pickWheel()
  await until(() => window.__panel.active, 40000); await sleep(600)
  const m = await p.evaluate(() => window.__panel.q.missing.join('')); await p.keyboard.type(m)
  await until(() => { const e = __st.els.get('Moeda1'); return e && __st.isShown('Moeda1') && e.classList.contains('click') }, 90000); await sleep(600)
  await p.evaluate(() => __st.els.get('Moeda1').click())
  log('duelo', r, 'OK')
}
await until(() => __st.isShown('BotãoMenu3'), 90000); await sleep(800)
await p.evaluate(() => __st.els.get('BotãoMenu3').click())
await until(() => [...document.querySelectorAll('#actions button')].some(b => b.textContent.includes('otra')), 120000)
await sleep(2000)
let w = await report('PROGRAMA'); if (w.viol.length || w.segs !== 8) fail = true
// ---- 2) abortar en mitad de la elección y volver a jugar/explorar: la rueda no debe reaparecer
await p.evaluate(() => { window.__wheel.viol = []; window.__wheel.segs = 0 })
await p.evaluate(() => { window.__testRodadas = 3; window.__startMode('programa') })
await sleep(2000); await p.click('#btnSkip')
await until(() => [...document.querySelectorAll('#actions button')].some(b => b.textContent.includes('centro')), 30000); await sleep(1200)
await p.evaluate(() => [...document.querySelectorAll('#actions button')].find(b => b.textContent.includes('centro')).click())
await until(() => [...document.querySelectorAll('img.huella.click')].some(i => getComputedStyle(i).display !== 'none'), 60000)
await sleep(1000); await p.evaluate(() => window.__back()); log('abortado durante ELIGE')
await sleep(1500)
await p.evaluate(() => { window.__testRodadas = 0; window.__startMode('explorar') })
await sleep(6000)
w = await report('ABORTO+EXPLORAR'); if (w.viol.length || await wheelOn()) fail = true
// ---- 3) Entrenamiento de huellas
await p.evaluate(() => { window.__wheel.viol = []; window.__wheel.segs = 0 })
await p.goto(base + '?nosw&mode=entrenamiento&sub=huellas', { waitUntil: 'load' })
for (let r = 1; r <= 2; r++) {
  await pickWheel()
  await until(() => { const e = __st.els.get('Moeda1'); return e && __st.isShown('Moeda1') && e.classList.contains('click') }, 60000); await sleep(500)
  await p.evaluate(() => __st.els.get('Moeda1').click()); log('huellas entrenamiento', r)
}
await sleep(5000)
w = await report('ENTRENAMIENTO'); if (w.viol.length) fail = true
await p.goto(base + '?nosw&mode=entrenamiento&sub=pruebas', { waitUntil: 'load' })
await until(() => window.__panel?.active, 30000); await sleep(4000)
w = await report('ENTRENAMIENTO-PRUEBAS'); if (w.viol.length || w.segs) fail = true
console.log(fail ? 'RESULTADO: FALLO' : 'RESULTADO: OK')
await b.close(); process.exit(fail ? 1 : 0)
