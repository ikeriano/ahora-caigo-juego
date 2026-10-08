// Clásico (TurboWarp): vigila que MenuEscolha/MenuEscolhaopN solo estén visibles durante la elección de oponente
import { open, toQuestion, sleep } from '/workspace/scratch-apk/test/lib.mjs'
const url = process.argv[2] || 'file:///workspace/scratch-apk/web/index.html'
const rounds = +(process.argv[3] || 3)
const h = await open(url)
const { p } = h
await p.evaluate(() => {
  window.__cw = { viol: [], segs: 0, on: false }
  const vis = n => { const t = vm.runtime.getSpriteTargetByName(n); return !!(t && t.visible && (t.effects?.ghost ?? 0) < 100) }
  setInterval(() => {
    const W = window.__cw
    const wheel = vis('MenuEscolha') || Array.from({ length: 10 }, (_, i) => vis('MenuEscolhaop' + (i + 1))).some(Boolean)
    if (wheel && !W.on) W.segs++
    W.on = wheel
    if (!wheel) return
    const why = []
    if (vis('Pergunta')) why.push('prueba')
    if (vis('Moeda1') || vis('Moeda2') || vis('Valores')) why.push('moneda')
    if (vis('Gc') || vis('PlacarDig1')) why.push('marcador')
    if (vis('BotãoMenu1')) why.push('menu')
    if (why.length && W.viol.length < 40) W.viol.push(why.join('+') + '@' + Math.round(performance.now()))
  }, 100)
})
await toQuestion(h)
for (let r = 1; r <= rounds; r++) {
  if (r > 1) { await h.waitVisible('MenuEscolhaop1', 90000); await sleep(1500); await h.tap('MenuEscolhaop' + (r + 2)); await h.waitVisible('Pergunta', 30000); await sleep(1500) }
  const v = await h.vars(); await p.keyboard.type(String(v.PalavraPainel).toLowerCase(), { delay: 120 })
  await h.waitVisible('Moeda1', 60000); await sleep(1500); await h.tap('Moeda1'); console.log('ronda', r, 'ok')
}
await sleep(12000)
const w = await p.evaluate(() => window.__cw)
console.log('CLASICO segmentos rueda:', w.segs, 'violaciones:', w.viol.length, w.viol.slice(0, 6).join(' | '))
console.log(w.viol.length ? 'RESULTADO: FALLO' : 'RESULTADO: OK')
await h.b.close(); process.exit(w.viol.length ? 1 : 0)
