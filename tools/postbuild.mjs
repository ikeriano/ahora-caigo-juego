// Genera dist/sw.js con la lista de ficheros para jugar sin conexión
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
const dist = path.resolve('dist'); const files = [];
const walk = d => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else files.push(path.relative(dist, p).split(path.sep).join('/')); } };
walk(dist);
const core = files.filter(f => !f.startsWith('clasico/') && !f.startsWith('descargas/') && f !== 'sw.js');
const h = crypto.createHash('md5'); core.forEach(f => h.update(f + fs.statSync(path.join(dist, f)).size)); const V = h.digest('hex').slice(0, 10);
const sw = `// Service worker: precarga el juego 3D; el modo Clásico se guarda la primera vez que se abre
const C='ac3d-${V}';const CORE=${JSON.stringify(['./', ...core])};
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.location.origin))return;
e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>m||fetch(r).then(res=>{if(res.ok&&res.type==='basic'){const cl=res.clone();caches.open(C).then(c=>c.put(r,cl))}return res}).catch(()=>caches.match('./'))))});
`;
fs.writeFileSync(path.join(dist, 'sw.js'), sw);
console.log('sw.js:', core.length, 'ficheros precargados, versión', V);
