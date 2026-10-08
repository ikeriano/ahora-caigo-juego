// Presentaciones como en el programa: el presentador charla con el oponente elegido (tras ELIGE)
// y presenta al concursante central al empezar el Programa completo. Se pueden saltar («Saltar» o tocando el bocadillo).
import * as THREE from 'three';
import type { Ctx } from './show';
import type { Person } from './people';
import { gesture } from './people';
import { cons, guionRival, guionCentral, Linea } from './concursantes';
import { publico } from './publico';
import { voice } from './voice';
import { TOP } from './set3d';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const W = window as any;

async function correr(c: Ctx, lineas: Linea[], quien: (l: Linea) => { p: Person; name: string }, cam: (l: Linea, i: number) => void, rotulo?: string) {
  const { hud, s, eng } = c;
  let skip = false;
  hud.skip(() => { skip = true; voice.stop(); hud.hideBubble(); });
  W.__pres = { lineas: lineas.map(l => `${l.who}: ${l.bubble}`), i: -1, skipped: false, done: false };
  try {
    for (const [i, l] of lineas.entries()) {
      if (skip || W.__presSkip) break;
      W.__pres.i = i;
      const q = quien(l); cam(l, i);
      gesture(q.p, l.who === 'host' ? 'habla' : 'habla', 2.4);
      let done = false;
      hud.say(l.bubble, 2000, q.p.head, q.name, { audio: l.audio, voz: l.voz, tts: l.tts }).then(() => { done = true; });
      if (i === 0 && rotulo) hud.lowerThird(rotulo, 4500, s).catch(() => { });
      await s.until(() => done || skip);
      if (l.react === 'risas') { publico.risas(); setTimeout(() => publico.aplauso(1.6, 0.45), 600); gesture(eng.host, 'aplaude', 1); }
      else if (l.react === 'aplauso') publico.aplauso(2.2, 0.6);
      else if (l.react === 'vitores') publico.vitores(2.8);
      if (!skip) await s.w(220);
    }
  } finally {
    hud.skip(null); W.__pres.skipped = skip; W.__pres.done = true;
    if (skip) { hud.hideBubble(); hud.clearLowerThirds(); }
  }
}

/** Plano del presentador mirando hacia `to` (contraplano) */
function camHost(c: Ctx, to: THREE.Vector3) {
  const { eng } = c; const hp = eng.host.root.position;
  const d = to.clone().sub(hp).setY(0).normalize(); const side = V(-d.z, 0, d.x);
  const p = hp.clone().addScaledVector(d, 2.6).addScaledVector(side, 0.7).setY(hp.y + 1.55);
  eng.cut(p, hp.clone().setY(hp.y + 1.3));
}

/** Charla con el oponente n (3-5 frases) */
export async function presentarRival(c: Ctx, n: number) {
  const { eng } = c; const o = eng.opps[n - 1]; const op = o.root.position.clone();
  eng.face(eng.host, op); eng.face(o, eng.host.root.position);
  const lineas = guionRival(n, W.__presArg);
  const nombre = cons.rival(n);
  await correr(c, lineas,
    l => l.who === 'host' ? { p: eng.host, name: cons.presentador } : { p: o, name: nombre },
    (l) => {
      if (l.who === 'host') camHost(c, op);
      else { // plano del oponente desde el lado del presentador
        const hp = eng.host.root.position; const d = hp.clone().sub(op).setY(0).normalize(); const side = V(-d.z, 0, d.x);
        eng.cut(op.clone().addScaledVector(d, 3.4).addScaledVector(side, -0.7).setY(TOP + 2.0), op.clone().setY(TOP + 1.55));
      }
    }, `${nombre} · ${cons.job(n)}`);
  eng.face(eng.host, V(0, 0, 8));
}

/** Presentación del concursante central (tras la cabecera) */
export async function presentarCentral(c: Ctx) {
  const { eng } = c; const pl = eng.player;
  pl.root.visible = true; pl.root.position.set(0.4, 0, 6.6); eng.face(pl, eng.host.root.position);
  eng.face(eng.host, pl.root.position);
  const lineas = guionCentral();
  const nombre = cons.central;
  await correr(c, lineas,
    l => l.who === 'central' ? { p: pl, name: nombre || 'Concursante' } : { p: eng.host, name: cons.presentador },
    (l, i) => {
      if (l.who === 'central' || i === 0) {
        const pp = pl.root.position, hp = eng.host.root.position; const d = hp.clone().sub(pp).setY(0).normalize(); const side = V(-d.z, 0, d.x);
        eng.cut(pp.clone().addScaledVector(d, 3.3).addScaledVector(side, 1.0).setY(1.9), pp.clone().setY(1.55));
      } else camHost(c, pl.root.position);
    }, nombre ? (cons.profesion ? `${nombre} · ${cons.profesion}` : nombre) : undefined);
  eng.face(eng.host, V(0, 0, 8));
}
