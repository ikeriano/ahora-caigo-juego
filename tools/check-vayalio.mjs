// Comprueba que todos los pares de «¡Vaya lío!» son anagramas exactos (sin tener en cuenta las tildes)
import { build } from 'esbuild'
const r = await build({ entryPoints: ['src/vayalio.ts'], bundle: true, write: false, format: 'esm', platform: 'node', external: ['./assets'], plugins: [{ name: 'stub', setup(b) { b.onResolve({ filter: /^\.\/questions$/ }, () => ({ path: 'q', namespace: 'stub' })); b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: "export const norm = (s) => s.toUpperCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^A-Z]/g, '');" })) } }] })
const m = await import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'))
let bad = 0; const seen = new Set()
for (const [d, t, a] of m.VAYA_LIO) {
  const ok = m.esAnagrama(t, a); if (!ok) { bad++; console.log('❌', t, '→', a) }
  if (seen.has(a)) { bad++; console.log('❌ repetida', a) } seen.add(a)
  if (!d.trim()) { bad++; console.log('❌ sin definición', a) }
}
console.log(`${m.VAYA_LIO.length} pares, ${bad} errores`); process.exit(bad || m.VAYA_LIO.length < 40 ? 1 : 0)
