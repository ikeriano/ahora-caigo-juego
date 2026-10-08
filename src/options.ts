// Opciones guardadas en localStorage
export interface Opts { music: boolean; musicVol: number; sfx: boolean; sfxVol: number; quality: 'baja' | 'media' | 'alta'; voz: boolean; chistes: boolean;
  /** sonido del público (aplausos, vítores, «oooh») y su volumen */ publico: boolean; publicoVol: number;
  /** público visible en las gradas */ gradas: boolean;
  /** el presentador lee las preguntas en voz alta y su velocidad */ lee: boolean; leeVel: 'normal' | 'rapida' }
const KEY = 'ac3d_opts';
export function loadOpts(def: Opts['quality']): Opts {
  const d: Opts = { music: true, musicVol: 0.8, sfx: true, sfxVol: 1, quality: def, voz: true, chistes: true, publico: true, publicoVol: 0.8, gradas: true, lee: true, leeVel: 'normal' };
  try { return { ...d, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return d; }
}
export function saveOpts(o: Opts) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch { } }
