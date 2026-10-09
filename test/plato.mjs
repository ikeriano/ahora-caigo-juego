// Capturas del plató virtual: node test/plato.mjs [base] [prefijo] [looks]
import puppeteer from 'puppeteer-core'
const [,, base = 'http://127.0.0.1:4190/', prefix = 'previews/plato-privado/', which = 'all'] = process.argv
const sleep = ms => new Promise(r => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p = await b.newPage()
await p.setViewport({ width: 1024, height: 640, deviceScaleFactor: 1 })
const errs = []
p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERROR', e.message) })
p.on('console', m => { if (m.type() === 'error') { errs.push(m.text()); console.log('CONSOLE', m.text()) } })
const until = async (fn, ms = 60000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await p.evaluate(fn).catch(() => false)) return true; await sleep(150) } throw new Error('timeout ' + fn) }
const VIEWS = {
  aerea: [[0, 6.7, 0.7], [0, 0, -0.25]],
  picado: [[0, 9.2, 9.6], [0, 0.2, -1.2]],
  grada: [[0.3, 5.6, 11.2], [0, 2.2, -4]],
  frontal: [[0, 2.7, 4.6], [0, 4.6, -10]],
  lateral: [[-9.6, 4.6, 4.2], [1.5, 1.6, -3.5]],
}
const LOOKS = which === 'all' ? ['morado', 'blanco', 'cian'] : which.split(',')
for (const look of LOOKS) {
  await p.goto(base + `?nosw&plato=virtual&luz=${look}&screen=play`, { waitUntil: 'load' })
  await until(() => window.__eng && window.__eng.studio && document.querySelector('.mbtn'))
  await p.evaluate(() => { document.getElementById('menu').classList.add('hidden'); window.__eng.lights.auto = false })
  await sleep(1500)
  for (const [name, [pos, look2]] of Object.entries(VIEWS)) {
    if (look !== 'morado' && !['picado', 'grada', 'frontal'].includes(name)) continue
    await p.evaluate((a, l, fov) => { const T = window.THREE, e = window.__eng; e.cut(new T.Vector3(...a), new T.Vector3(...l)); e.camera.fov = fov; e.camera.updateProjectionMatrix() }, pos, look2, name === 'aerea' ? 100 : 58)
    await sleep(900)
    const f = `${prefix}${name}-${look}.png`; await p.screenshot({ path: f }); console.log('shot', f)
  }
}
console.log('errores:', errs.length)
await b.close()
