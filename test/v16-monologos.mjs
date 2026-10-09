// v1.6: monólogos del presentador (menú aparte, los tres tipos, saltar con un toque)
import puppeteer from 'puppeteer-core'
const [,, base = 'http://127.0.0.1:4190/', prefix = 'previews/plato-privado/final/'] = process.argv
const PL = process.env.PLATO || 'virtual'
const sleep = ms => new Promise(r => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p = await b.newPage(); await p.setViewport({ width: 1024, height: 576 })
let fails = 0; const check = (ok, m) => { console.log((ok ? '  ✅ ' : '  ❌ ') + m); if (!ok) fails++ }
p.on('pageerror', e => console.log('PAGEERROR', e.message))
const until = async (fn, ms = 60000, ...a) => { const t = Date.now(); while (Date.now() - t < ms) { if (await p.evaluate(fn, ...a).catch(() => false)) return true; await sleep(150) } throw new Error('timeout ' + fn) }
const ev = (fn, ...a) => p.evaluate(fn, ...a)
const sfx = PL === 'virtual' ? '' : '-clasico'
await p.goto(base + '?nosw', { waitUntil: 'load' })
await ev(pl => localStorage.setItem('ac3d_opts', JSON.stringify({ ...JSON.parse(localStorage.getItem('ac3d_opts') || '{}'), plato: pl })), PL)
await p.goto(base + '?nosw&screen=options', { waitUntil: 'load' })
await until(() => document.getElementById('rowMonologo'))
check(await ev(() => document.querySelector('#rowMonologo button').textContent === 'Sí'), 'Opciones › Monólogo del presentador: Sí por defecto')
await p.goto(base + '?nosw&screen=play', { waitUntil: 'load' }); await until(() => !!(window.__eng && window.__eng.studio))
await ev(() => window.__menu('monologos')); await until(() => document.getElementById('monoList'))
check(await ev(() => document.querySelectorAll('#monoList .tbtn').length >= 12), 'menú de monólogos con la lista completa')
await sleep(800); if (!sfx) { await p.screenshot({ path: prefix + 'monologos-menu.png' }); console.log('📸 monologos-menu.png') }
const next = async () => { await ev(() => document.getElementById('bubble')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))) }
for (const [id, tipo, cond] of [['pub-saludo', 'publico', 'm => m.baja && m.paso >= 2'], ['tel-madre', 'telefono', 'm => m.tel && m.paso >= 1'], ['nor-nuevas', 'normas', 'm => m.normas >= 3']]) {
  await ev(id => document.querySelector(`#monoList .tbtn[data-id="${id}"]`).click(), id)
  const f = new Function('return ' + cond)()
  const t0 = Date.now()
  while (!(await ev(c => { const m = window.__mono; return m && new Function('return ' + c)()(m) }, cond))) { if (Date.now() - t0 > 120000) throw new Error('timeout ' + id); await sleep(1200); if (await ev(() => window.__mono && !window.__mono.baja && window.__mono.tipo !== 'publico')) await next() }
  await sleep(1800)
  const m = await ev(() => window.__mono); console.log(id, JSON.stringify(m))
  if (tipo === 'publico') { const d = await ev(() => { const h = window.__eng.host.root.position; return Math.hypot(h.x, h.z) }); check(d > 6, 'el presentador baja a la grada (distancia al centro ' + d.toFixed(1) + ' m)') }
  if (tipo === 'telefono') check(m.tel, 'saca el teléfono')
  if (tipo === 'normas') check(await ev(() => document.querySelectorAll('#normas li').length === 3), 'rótulo con 3 normas inventadas')
  await p.screenshot({ path: prefix + `monologo-${tipo}${sfx}.png` }); console.log('📸', `monologo-${tipo}${sfx}.png`)
  // saltar con un toque en el plató
  await p.mouse.click(300, 250)
  await until(() => window.__mono.fin, 8000)
  check(await ev(() => !document.getElementById('normas') && Math.hypot(window.__eng.host.root.position.x - 2.35, window.__eng.host.root.position.z - 1.5) < 0.3), `${tipo}: un toque lo salta y el presentador vuelve a su sitio`)
  await until(() => [...document.querySelectorAll('#actions button, .actions button, button')].some(b => b.textContent.includes('Lista') && b.offsetParent), 8000)
  await ev(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Lista') && b.offsetParent).click())
  await until(() => document.getElementById('monoList'))
}
// no se repite el mismo en partidas seguidas
const ids = await ev(() => { const out = []; for (let i = 0; i < 30; i++) { const m = window.__monoElegir ? window.__monoElegir() : null; if (m) out.push(m) } return out })
await b.close(); console.log(fails ? `❌ ${fails} fallos` : '✅ todo bien'); process.exit(fails ? 1 : 0)
