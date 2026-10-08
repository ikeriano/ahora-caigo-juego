// Opciones guardadas en localStorage
export interface Opts { music: boolean; musicVol: number; sfx: boolean; sfxVol: number; quality: 'baja' | 'media' | 'alta'; voz: boolean; chistes: boolean }
const KEY = 'ac3d_opts';
export function loadOpts(def: Opts['quality']): Opts {
  const d: Opts = { music: true, musicVol: 0.8, sfx: true, sfxVol: 1, quality: def, voz: true, chistes: true };
  try { return { ...d, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return d; }
}
export function saveOpts(o: Opts) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch { } }
