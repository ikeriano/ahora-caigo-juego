// «Palabra gallina» con canciones del jugador (v1.6).
// Las canciones se eligen desde el propio dispositivo y se guardan SOLO en él (IndexedDB del navegador / de la app):
// no se suben a ningún servidor, no van en la web publicada ni en la APK. El juego no trae canciones ni letras reales.
// En el duelo suena la canción hasta el segundo de corte y luego sale la frase con el hueco en casillas (algunas letras a la vista).
import { tx } from './customaudio';
import { audio } from './assets';
import type { Q } from './questions';
import { norm } from './questions';
import type { Lectura } from './lectura';

const PREFIX = 'gallina:';
const MAX_BYTES = 40 * 1024 * 1024;
export interface Cancion {
  id: string; titulo: string; letra: string;
  /** fragmento a adivinar: posiciones en la letra [ini, fin) */ ini: number; fin: number;
  /** segundo en el que se corta la música (justo antes del fragmento) y desde dónde empieza a sonar */ corte: number; desde: number;
  name: string; size: number; type: string; date: number;
}
interface Rec extends Cancion { blob: Blob }

let lista: Cancion[] = [];
let cargada: Promise<void> | null = null;
export const canciones = () => lista;
export const hayCanciones = () => lista.length > 0;

export function initGallina() {
  return cargada = (async () => {
    try {
      const keys = await tx<IDBValidKey[]>('readonly', s => s.getAllKeys());
      const out: Cancion[] = [];
      for (const k of keys) if (String(k).startsWith(PREFIX)) { const r = await tx<Rec | undefined>('readonly', s => s.get(k)); if (r) { const { blob, ...m } = r; void blob; out.push(m); } }
      lista = out.sort((a, b) => a.date - b.date);
    } catch (e) { console.warn('canciones gallina', e); lista = []; }
  })();
}
export const gallinaLista = () => cargada || initGallina();

export function validarAudio(f: File) {
  if (f.size > MAX_BYTES) throw new Error('El archivo es demasiado grande (máximo 40 MB).');
  if (f.type && !f.type.startsWith('audio/') && !/\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|webm)$/i.test(f.name)) throw new Error('Ese archivo no es de audio.');
}
/** Comprueba los datos de una canción. Devuelve el motivo (en español) si algo no vale */
export function errorCancion(c: Partial<Cancion>, dur?: number): string | null {
  if (!c.titulo?.trim()) return 'Ponle un título a la canción.';
  if (!c.letra?.trim()) return 'Pega la letra (al menos el trozo que rodea al fragmento).';
  if (c.ini == null || c.fin == null || c.fin <= c.ini) return 'Marca el fragmento que hay que adivinar (selecciónalo en la letra).';
  const f = norm(c.letra.slice(c.ini, c.fin)); if (f.length < 2) return 'El fragmento tiene que tener al menos 2 letras.';
  if (f.length > 26) return 'El fragmento es demasiado largo (máximo unas 26 letras).';
  if (!(c.corte! > 0)) return 'Marca el segundo en el que se corta la música.';
  if (dur && c.corte! > dur) return 'El segundo de corte es más largo que la canción.';
  if (c.desde! < 0 || c.desde! >= c.corte!) return 'La música tiene que empezar antes del corte.';
  return null;
}
export async function guardarCancion(c: Omit<Cancion, 'id' | 'date' | 'name' | 'size' | 'type'> & { id?: string }, file: Blob | null, name = ''): Promise<Cancion> {
  let blob = file;
  const id = c.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
  const prev = c.id ? await tx<Rec | undefined>('readonly', s => s.get(PREFIX + id)) : undefined;
  if (!blob) { if (!prev) throw new Error('Elige el audio de la canción.'); blob = prev.blob; name = prev.name; }
  const rec: Rec = { ...c, id, blob, name: name || prev?.name || 'audio', size: blob.size, type: blob.type || 'audio/*', date: prev?.date || Date.now() };
  await tx('readwrite', s => s.put(rec, PREFIX + id));
  await initGallina(); return lista.find(x => x.id === id)!;
}
export async function borrarCancion(id: string) { try { await tx('readwrite', s => s.delete(PREFIX + id)); } catch { } await initGallina(); }
export async function blobCancion(id: string): Promise<Blob | null> { try { return (await tx<Rec | undefined>('readonly', s => s.get(PREFIX + id)))?.blob || null; } catch { return null; } }

// ------------------------------------------------------------------ la pregunta
/** frase que rodea al fragmento (de signo a signo o de línea a línea) */
export function contexto(c: Pick<Cancion, 'letra' | 'ini' | 'fin'>) {
  const L = c.letra; let a = c.ini, b = c.fin;
  // hasta 2 líneas antes / 1 después, cortando en un máximo de ~150 caracteres
  const ls = L.lastIndexOf('\n', a - 1); const ls2 = ls > 0 ? L.lastIndexOf('\n', ls - 1) : -1;
  a = (ls2 >= 0 && a - ls2 < 110 ? ls2 : ls) + 1;
  const le = L.indexOf('\n', b); b = le < 0 ? L.length : le;
  if (b - a > 150) { a = Math.max(a, c.ini - 80); b = Math.min(b, c.fin + 50); }
  const antes = L.slice(a, c.ini).replace(/\s+/g, ' ').trimStart(), despues = L.slice(c.fin, b).replace(/\s+/g, ' ').trimEnd();
  return { antes, frag: L.slice(c.ini, c.fin).replace(/\s+/g, ' ').trim(), despues };
}
/** palabra con huecos: guiones bajos con la longitud de cada palabra */
const rayas = (frag: string) => frag.split(' ').map(w => '_'.repeat(Math.max(2, Math.min(7, norm(w).length)))).join(' ');
export function cancionQ(c: Cancion, semilla = Math.random): Q {
  const { antes, frag, despues } = contexto(c);
  const word = frag.toUpperCase().replace(/[^\p{L} ]/gu, '').replace(/\s+/g, ' ').trim();
  const letras = [...word].map((ch, i) => ch === ' ' ? -1 : i).filter(i => i >= 0);
  // a la vista ~1/3 de las letras (como en el programa), nunca todas
  const ver = new Set<number>(); const nVer = Math.min(letras.length - 1, Math.round(letras.length / 3));
  while (ver.size < nVer) ver.add(letras[Math.floor(semilla() * letras.length)]);
  const hidden = [...word].map((ch, i) => ch !== ' ' && !ver.has(i));
  const miss: string[] = []; [...word].forEach((ch, i) => { if (hidden[i]) { const n = norm(ch); if (n && !miss.includes(n)) miss.push(n); } });
  const text = `${antes}${antes && !/\s$/.test(antes) ? ' ' : ''}${rayas(frag)}${despues && !/^[\s.,;:!?…)]/.test(despues) ? ' ' : ''}${despues}`.trim();
  return { id: 'gal-' + c.id, kind: 'txt', text, word, hidden, missing: miss, gallina: true, cancion: { id: c.id, corte: c.corte, desde: c.desde } };
}
const usadas = new Set<string>();
/** una canción del jugador al azar (sin repetir hasta agotarlas). null si no hay */
export function gallinaQ(): Q | null {
  if (!lista.length) return null;
  let free = lista.filter(c => !usadas.has(c.id)); if (!free.length) { usadas.clear(); free = lista; }
  const c = free[Math.floor(Math.random() * free.length)]; usadas.add(c.id); return cancionQ(c);
}

// ------------------------------------------------------------------ reproducción hasta el corte
let el: HTMLAudioElement | null = null;
function elemento() {
  if (el) return el;
  el = new Audio(); el.preload = 'auto';
  try { const src = audio.ctx.createMediaElementSource(el); src.connect(audio.music); } catch { /* sin Web Audio: suena directo */ }
  return el;
}
/** Suena la canción de «desde» a «corte». Mientras suena, la frase queda tapada («escuchando»). Devuelve una Lectura */
export function sonarCancion(id: string, desde: number, corte: number, onFin?: () => void): Lectura {
  let leyendo = true, stopped = false, fin = () => { };
  const done = new Promise<void>(res => { fin = () => { if (!leyendo) return; leyendo = false; clearInterval(iv); clearTimeout(tm); try { a.pause(); } catch { } onFin?.(); res(); (window as any).__gallina.estado = 'cortada'; }; });
  const a = elemento(); let iv: any = 0, tm: any = 0; let url = '';
  (window as any).__gallina = { estado: 'cargando', id, corte };
  (async () => {
    const b = await blobCancion(id); if (!b || stopped) return fin();
    url = URL.createObjectURL(b); a.src = url;
    try { if (audio.ctx.state === 'suspended') await audio.ctx.resume(); } catch { }
    await new Promise<void>(r => { if (a.readyState >= 1) r(); else { a.onloadedmetadata = () => r(); a.onerror = () => r(); setTimeout(r, 4000); } });
    try { a.currentTime = desde; } catch { }
    tm = setTimeout(fin, (corte - desde) * 1000 + 6000);
    iv = setInterval(() => { if (a.currentTime >= corte || a.ended) fin(); (window as any).__gallina.t = a.currentTime; }, 30);
    try { await a.play(); (window as any).__gallina.estado = 'sonando'; } catch { fin(); }
  })();
  done.then(() => setTimeout(() => url && URL.revokeObjectURL(url), 2000));
  return { done, stop: () => { stopped = true; fin(); }, get leyendo() { return leyendo; } };
}
/** para la pregunta del duelo: suena y al cortar destapa la frase del panel */
export function leerCancion(q: Q): Lectura {
  const c = q.cancion!;
  return sonarCancion(c.id, c.desde, c.corte, () => document.querySelectorAll('.ptxt.gall').forEach(t => t.classList.remove('escuchando')));
}
