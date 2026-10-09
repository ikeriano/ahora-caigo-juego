// Plató virtual en todos los modos: entrenamiento (juego final), decorado dorado, historia, explorar (caminar) y Opciones › Plató
import puppeteer from 'puppeteer-core'
const [,, base = 'http://127.0.0.1:4190/', prefix = 'previews/plato-privado/'] = process.argv
const sleep = ms => new Promise(r => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p = await b.newPage()
await p.setViewport({ width: 1024, height: 640, deviceScaleFactor: 1 })
const errs = []; let fails = 0
const check = (ok, msg) => { console.log((ok ? '  ✅ ' : '  ❌ ') + msg); if (!ok) fails++ }
p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERROR', e.message) })
p.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) { errs.push(m.text()); console.log('CONSOLE', m.text()) } })
const until = async (fn, ms = 60000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await p.evaluate(fn).catch(() => false)) return true; await sleep(150) } console.log('ESTADO', await p.evaluate(() => [location.href, !!window.__eng, document.getElementById('loading')?.className, document.getElementById('loading')?.textContent]).catch(e => e.message)); throw new Error('timeout ' + fn) }
const ev = (fn, ...a) => p.evaluate(fn, ...a)
const shot = async n => { await p.screenshot({ path: prefix + n }); console.log('📸', prefix + n) }

// --- Opciones › Plató: por defecto Clásico; elegir «Plató virtual» se guarda y reconstruye el plató
await p.goto(base + '?nosw&screen=options', { waitUntil: 'load' })
await until(() => document.getElementById('rowPlato'))
check(await ev(() => document.querySelector('#rowPlato .sel')?.dataset.v === 'clasico'), 'Opciones › Plató: «Clásico» por defecto')
await ev(() => document.querySelector('#rowPlato button[data-v="virtual"]').click())
await until(() => document.getElementById('rowPlatoLuz'))
check(await ev(() => JSON.parse(localStorage.getItem('ac3d_opts')).plato === 'virtual'), 'el plató elegido se guarda en localStorage')
check(await ev(() => window.__eng.studio.holes.length === 11 && Math.abs(window.__eng.studio.holes[1].pos.y - 0.5) < 0.01), 'plató virtual construido: 11 trampillas (anillo a 0,5 m)')
await ev(() => document.getElementById('rowPlato').scrollIntoView({ block: 'center' }))
await sleep(1200); await shot('opciones-plato.png')
await ev(() => document.querySelector('#rowPlatoLuz button[data-v="cian"]').click())
check(await ev(() => window.__eng.studio.look === 'cian' && JSON.parse(localStorage.getItem('ac3d_opts')).platoLuz === 'cian'), 'luces del plató virtual: «Morado y cian» fijo')
await ev(() => document.querySelector('#rowPlatoLuz button[data-v="auto"]').click())
// --- recarga: sigue en virtual
await p.goto(base + '?nosw&screen=play', { waitUntil: 'load' })
await until(() => !!(window.__eng && window.__eng.studio))
check(await ev(() => window.__eng.studio.holes[1].pos.y < 0.6), 'tras recargar sigue el plató virtual')

// --- explorar: caminar desde el pasillo hasta la tarima central (escalera frontal)
await ev(() => { void window.__startMode('explorar') }); await sleep(1500)
const y0 = await ev(() => window.__eng.player.root.position.toArray())
console.log('fps', await ev(() => Math.round(window.__eng.fps)))
await p.keyboard.down('KeyW'); { const t = Date.now(); while (Date.now() - t < 40000 && await ev(() => window.__eng.player.root.position.z > 1.5)) await sleep(200) } await p.keyboard.up('KeyW')
const y1 = await ev(() => window.__eng.player.root.position.toArray())
console.log('explorar', y0.map(v => v.toFixed(2)), '->', y1.map(v => v.toFixed(2)))
check(y1[2] < 1.6 && y1[1] > 1.0, 'caminando se sube por la escalera frontal a la tarima central')
await sleep(600); await shot('explorar-tarima.png')
// bajar al anillo por el escalón lateral derecho (+X) y llegar junto a la trampilla 8
await ev(() => { const e = window.__eng; e.player.root.position.set(0.0, 1.1, 0); e.yaw = -1.396; })
await p.keyboard.down('KeyW'); { const t = Date.now(); while (Date.now() - t < 30000 && await ev(() => Math.hypot(window.__eng.player.root.position.x, window.__eng.player.root.position.z) < 4.6)) await sleep(150) } await p.keyboard.up('KeyW')
const y2 = await ev(() => window.__eng.player.root.position.toArray()); console.log('lateral', y2.map(v => v.toFixed(2)))
check(Math.hypot(y2[0], y2[2]) > 3.9 && Math.abs(y2[1] - 0.5) < 0.1, 'por el escalón lateral se baja al anillo de los oponentes')
await p.keyboard.down('KeyW'); await sleep(12000); await p.keyboard.up('KeyW')
const y3 = await ev(() => window.__eng.player.root.position.toArray()); console.log('barandilla', y3.map(v => v.toFixed(2)))
check(Math.hypot(y3[0], y3[2]) < 6.45, 'la barandilla no deja salir del anillo')

// --- entrenamiento: Juego Final con el decorado dorado
await p.goto(base + '?nosw&mode=entrenamiento&sub=final', { waitUntil: 'load' })
await until(() => window.__panel?.active, 60000); await sleep(1500)
await shot('juego-final.png')
await ev(() => window.__eng.setGoldSet(true)); await sleep(600)
check(await ev(() => window.__eng.gold && window.__eng.studio.holes.length === 11), 'decorado dorado del Juego Final en el plató virtual')
await ev(() => { const T = window.THREE, e = window.__eng; e.cut(new T.Vector3(0, 9.2, 9.6), new T.Vector3(0, 0.2, -1.2)) }); await sleep(800)
await shot('juego-final-dorado-picado.png')

// --- entrenamiento: duelo
await p.goto(base + '?nosw&mode=entrenamiento&sub=duelo', { waitUntil: 'load' })
await until(() => window.__panel?.active || document.getElementById('duelBar'), 60000); await sleep(2500)
check(await ev(() => window.__eng.studio.look === 'blanco'), 'entrenamiento: look blanco automático')
await shot('entrenamiento-duelo.png')

// --- historia
await p.goto(base + '?nosw&mode=historia', { waitUntil: 'load' })
await until(() => !!(window.__eng && window.__eng.studio), 30000); await sleep(9000)
await shot('historia.png')

// --- especial (tema) en el plató virtual
await p.goto(base + '?nosw&screen=play&theme=halloween', { waitUntil: 'load' })
await until(() => !!(window.__eng && window.__eng.studio && document.querySelector('.mbtn'))); await ev(() => document.getElementById('menu').classList.add('hidden')); await sleep(1500)
await ev(() => { const T = window.THREE, e = window.__eng; e.cut(new T.Vector3(0.3, 5.6, 11.2), new T.Vector3(0, 2.2, -4)) }); await sleep(900)
await shot('especial-halloween.png')
check(errs.length === 0, 'sin errores de consola (' + errs.length + ')')
console.log(fails ? `❌ ${fails} fallos` : '✅ todo bien')
await b.close()
