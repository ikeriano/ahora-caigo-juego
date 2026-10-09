// Música de la cabecera elegida por el jugador desde SU dispositivo.
// El fichero se guarda SOLO en este dispositivo (IndexedDB del navegador / de la app): no se sube a ningún sitio,
// no va dentro de la web publicada ni de la APK y no se comparte con nadie.
import { audio } from './assets';

export const CUSTOM = 'custom:cabecera';
const DB = 'ac3d_local', STORE = 'audio', KEY = 'cabecera';
const MAX_BYTES = 40 * 1024 * 1024; // 40 MB
const KEEP_SEC = 75;                 // solo se decodifican los primeros 75 s (cabecera ~27 s, despedida ~22 s)

export interface CustomInfo { name: string; size: number; type: string }
interface Rec extends CustomInfo { blob: Blob; date: number }

export function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
export async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((res, rej) => { const t = d.transaction(STORE, mode); const rq = fn(t.objectStore(STORE)); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); });
}

let info: CustomInfo | null = null;
let ready: Promise<boolean> | null = null;

/** Recorta a los primeros KEEP_SEC segundos para no gastar memoria con canciones largas */
function trim(b: AudioBuffer): AudioBuffer {
  const n = Math.min(b.length, Math.floor(KEEP_SEC * b.sampleRate)); if (n === b.length) return b;
  const o = audio.ctx.createBuffer(b.numberOfChannels, n, b.sampleRate);
  for (let c = 0; c < b.numberOfChannels; c++) o.copyToChannel(b.getChannelData(c).subarray(0, n), c);
  return o;
}
async function decode(blob: Blob): Promise<AudioBuffer> {
  const ab = await blob.arrayBuffer();
  return trim(await new Promise<AudioBuffer>((res, rej) => audio.ctx.decodeAudioData(ab, res, rej)));
}

/** Al arrancar: si hay un audio guardado en el dispositivo, se decodifica en segundo plano */
export function initCustomAudio(): Promise<boolean> {
  ready = (async () => {
    try {
      const r = await tx<Rec | undefined>('readonly', s => s.get(KEY));
      if (!r || !r.blob) { info = null; audio.setBuffer(CUSTOM, null); return false; }
      info = { name: r.name, size: r.size, type: r.type };
      audio.setBuffer(CUSTOM, await decode(r.blob)); return true;
    } catch (e) { console.warn('audio propio', e); audio.setBuffer(CUSTOM, null); return false; }
  })();
  return ready;
}
export const customInfo = () => info;
/** ¿Hay audio propio listo para sonar? (espera como mucho ms a que termine de decodificarse) */
export async function customReady(ms = 6000): Promise<boolean> {
  if (!ready) return false;
  return Promise.race([ready, new Promise<boolean>(r => setTimeout(() => r(audio.hasBuffer(CUSTOM)), ms))]);
}

/** Guarda el fichero elegido (solo en este dispositivo). Lanza un Error con el motivo en español si no vale */
export async function setCustomAudio(f: File): Promise<CustomInfo> {
  if (f.size > MAX_BYTES) throw new Error('El archivo es demasiado grande (máximo 40 MB).');
  if (f.type && !f.type.startsWith('audio/') && !/\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|webm)$/i.test(f.name)) throw new Error('Ese archivo no es de audio.');
  let buf: AudioBuffer;
  try { buf = await decode(f); } catch { throw new Error('No se puede reproducir ese audio en este dispositivo. Prueba con un MP3.'); }
  const rec: Rec = { name: f.name, size: f.size, type: f.type || 'audio/*', blob: f, date: Date.now() };
  await tx('readwrite', s => s.put(rec, KEY));
  info = { name: rec.name, size: rec.size, type: rec.type }; audio.setBuffer(CUSTOM, buf); ready = Promise.resolve(true);
  return info;
}
export async function clearCustomAudio() {
  try { await tx('readwrite', s => s.delete(KEY)); } catch { }
  info = null; audio.setBuffer(CUSTOM, null); ready = Promise.resolve(false);
}
