// El público del plató: une la reacción visual (gradas, audience.ts) con su sonido sintetizado (crowd.ts).
import type { Engine } from './engine';
import { crowd, estimateBeat } from './crowd';
import { audio } from './assets';
import type { Reaccion } from './audience';

let eng: Engine | null = null;
let lastSoft = -99;
const now = () => performance.now() / 1000;
const vis = (k: Reaccion, sec: number, beat?: () => number) => eng?.audience?.react(k, sec, beat);
/** registro para las pruebas automáticas */
export const publicoLog: string[] = [];
const note = (s: string) => { publicoLog.push(s); if (publicoLog.length > 200) publicoLog.shift(); };

export const publico = {
  bind(e: Engine) { eng = e; },
  /** aplausos normales (presentador, acierto, saludo…) */
  aplauso(sec = 3, vol = 0.75) { note('aplauso'); vis('aplauso', sec); crowd.clap(sec, vol); },
  /** vítores: se levantan, brazos arriba y aplausos fuertes */
  vitores(sec = 4, vol = 0.9) { note('vitores'); vis('vitores', sec); crowd.cheer(vol); crowd.clap(sec + 0.5, vol * 0.85); },
  /** ovación final: todo el público en pie */
  ovacion(sec = 7, vol = 1) {
    note('ovacion'); vis('ovacion', sec); crowd.cheer(vol); crowd.clap(sec, vol);
    setTimeout(() => crowd.cheer(vol * 0.8), 2300); if (sec > 5) setTimeout(() => crowd.cheer(vol * 0.7), 4600);
  },
  /** «¡Ooooh!» de una caída o de un fallo gordo: manos a la cabeza, algunos se levantan */
  ooh(vol = 0.9) { note('ooh'); vis('ooh', 2.6); crowd.ooh(vol); },
  /** «oh» flojito de una letra equivocada (como mucho uno cada 3 s) */
  oohSuave() { if (now() - lastSoft < 3) return; lastSoft = now(); note('oohSuave'); vis('oohSuave', 1.6); crowd.ooh(0.3); },
  /** risas tras un chiste del presentador */
  risas() { note('risas'); crowd.laugh(0.55); vis('aplauso', 1.6); },
  /** Palmas al ritmo de la música de la cabecera (del instante `desde` a `hasta`, en segundos de la canción) */
  ritmo(music: string, desde: number, hasta: number, vol = 0.5) {
    const t = audio.musicTime(music); if (t < 0) return;
    const start = (audio as any).musicT0 as number;
    const go = (bt: { period: number; phase: number }) => {
      const k = Math.ceil((desde - bt.phase) / bt.period); const first = bt.phase + k * bt.period;
      note('ritmo ' + bt.period.toFixed(3));
      crowd.startBeat(bt.period, start + first, start + hasta, vol);
      vis('ritmo', hasta - audio.musicTime(music), () => { const mt = audio.musicTime(music); return mt < 0 ? 0 : (((mt - first) / bt.period) % 1 + 1) % 1; });
      publico.beat = bt;
    };
    // «Trilha» (música del .sb3): pulso conocido, el mismo de los cortes de la cabecera (0,8 s). Audio propio: se estima.
    if (music === 'Trilha') { go({ period: 0.8, phase: 0 }); return; }
    audio.load(music).then(buf => go(buf ? estimateBeat(buf, desde, hasta) : { period: 0.8, phase: desde })).catch(() => go({ period: 0.8, phase: desde }));
  },
  beat: null as null | { period: number; phase: number },
  calma() { crowd.stopBeat(); vis('idle', 0); },
};
