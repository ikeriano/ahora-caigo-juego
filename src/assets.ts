// Recursos del .sb3 original (disfraces + sonidos) y motor de audio
export interface Costume { n: string; f: string; w: number; h: number; cx: number; cy: number }
export interface Sprite { x: number; y: number; size: number; c: Costume[]; s?: Record<string, string> }
export interface Manifest { sprites: Record<string, Sprite>; sounds: Record<string, string> }
export let M: Manifest;
export const BASE = import.meta.env.BASE_URL;
export const imgUrl = (f: string) => `${BASE}sb3/img/${f}.webp`;

export async function loadManifest() { M = await (await fetch(`${BASE}sb3/manifest.json`)).json(); return M; }
export function costume(sprite: string, name: string | number): Costume {
  const sp = M.sprites[sprite]; if (!sp) throw new Error('sprite ' + sprite);
  if (typeof name === 'number') return sp.c[(name - 1 + sp.c.length) % sp.c.length];
  return sp.c.find(c => c.n === name) || sp.c[0];
}
export function preloadImages(urls: string[]) { return Promise.all(urls.map(u => new Promise<void>(r => { const i = new Image(); i.onload = i.onerror = () => r(); i.src = u; }))); }

// ---------------- Audio ----------------
class Audio {
  ctx: AudioContext; master: GainNode; music: GainNode; sfx: GainNode; voice: GainNode;
  buffers = new Map<string, Promise<AudioBuffer | null>>();
  musicSrc: { src: AudioBufferSourceNode; gain: GainNode; name: string } | null = null;
  playing = new Set<AudioBufferSourceNode>();
  constructor() {
    const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
    this.music = this.ctx.createGain(); this.music.gain.value = 0.75; this.music.connect(this.master);
    this.sfx = this.ctx.createGain(); this.sfx.connect(this.master);
    this.voice = this.ctx.createGain(); this.voice.connect(this.master);
    const unlock = () => { if (this.ctx.state !== 'running') this.ctx.resume(); };
    ['pointerdown', 'touchstart', 'keydown'].forEach(t => addEventListener(t, unlock, { capture: true, passive: true } as any));
    document.addEventListener('visibilitychange', () => { document.hidden ? this.ctx.suspend() : this.ctx.resume(); });
  }
  /** Opciones: música/efectos activados + volumen (0..1) */
  setLevels(o: { music: boolean; musicVol: number; sfx: boolean; sfxVol: number }) {
    this.music.gain.value = o.music ? 0.75 * o.musicVol : 0; this.sfx.gain.value = o.sfx ? o.sfxVol : 0;
    this.voice.gain.value = o.sfx ? Math.max(0.35, o.sfxVol) * 1.15 : 0;
  }
  /** 'nombre' o 'nombre@Objeto' (el .sb3 tiene sonidos distintos con el mismo nombre en cada objeto) */
  file(name: string) {
    const [n, sp] = name.split('@');
    const f = (sp && M.sprites[sp]?.s?.[n]) || M.sounds[n]; if (!f) console.warn('sonido?', name); return f;
  }
  loadUrl(url: string) {
    if (!this.buffers.has(url)) this.buffers.set(url, fetch(url).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(b => new Promise<AudioBuffer>((res, rej) => this.ctx.decodeAudioData(b, res, rej))).catch(() => null));
    return this.buffers.get(url)!;
  }
  /** Reproduce un fichero (voz del presentador); devuelve la duración o -1 si no existe */
  async playUrl(url: string, vol = 1, tag?: string): Promise<{ dur: number; done: Promise<void> }> {
    const b = await this.loadUrl(url); if (!b) return { dur: -1, done: Promise.resolve() };
    const s = this.ctx.createBufferSource(); s.buffer = b; const g = this.ctx.createGain(); g.gain.value = vol;
    s.connect(g); g.connect(this.voice); s.start(); this.playing.add(s);
    if (tag) { if (!this.tags.has(tag)) this.tags.set(tag, new Set()); this.tags.get(tag)!.add(s); }
    return { dur: b.duration, done: new Promise(r => { s.onended = () => { this.playing.delete(s); r(); }; }) };
  }
  /** segundos desde que empezó la música actual (para sincronizar subtítulos de las voces del .sb3) */
  musicTime(name: string) { return this.musicSrc && this.musicSrc.name === name ? this.ctx.currentTime - this.musicT0 : -1; }
  musicT0 = 0;
  load(name: string) {
    const f = this.file(name); if (!f) return Promise.resolve(null);
    if (!this.buffers.has(f)) this.buffers.set(f, fetch(`${BASE}sb3/snd/${f}.mp3`).then(r => r.arrayBuffer()).then(b => new Promise<AudioBuffer>((res, rej) => this.ctx.decodeAudioData(b, res, rej))).catch(() => null));
    return this.buffers.get(f)!;
  }
  preload(names: string[]) { return Promise.all(names.map(n => this.load(n))); }
  /** Efecto de sonido; devuelve promesa que se resuelve al terminar */
  tags = new Map<string, Set<AudioBufferSourceNode>>();
  stopTag(tag: string) { const t = this.tags.get(tag); if (t) { t.forEach(s => { try { s.stop(); } catch { } }); t.clear(); } }
  async play(name: string, vol = 1, tag?: string): Promise<void> {
    const b = await this.load(name); if (!b) return;
    const s = this.ctx.createBufferSource(); s.buffer = b; const g = this.ctx.createGain(); g.gain.value = vol;
    s.connect(g); g.connect(this.sfx); s.start(); this.playing.add(s);
    if (tag) { if (!this.tags.has(tag)) this.tags.set(tag, new Set()); this.tags.get(tag)!.add(s); }
    return new Promise(r => { s.onended = () => { this.playing.delete(s); r(); }; });
  }
  /** Música de fondo: sustituye a la anterior (como "parar otros programas del escenario") */
  async playMusic(name: string, loop = false, vol = 1) {
    this.stopMusic(0.25);
    const b = await this.load(name); if (!b) return;
    const s = this.ctx.createBufferSource(); s.buffer = b; s.loop = loop; const g = this.ctx.createGain(); g.gain.value = vol;
    s.connect(g); g.connect(this.music); s.start(); this.musicSrc = { src: s, gain: g, name }; this.musicT0 = this.ctx.currentTime;
  }
  stopMusic(fade = 0.2) {
    const m = this.musicSrc; if (!m) return; this.musicSrc = null;
    const t = this.ctx.currentTime; m.gain.gain.setValueAtTime(m.gain.gain.value, t); m.gain.gain.linearRampToValueAtTime(0, t + fade); m.src.stop(t + fade + 0.05);
  }
  stopAll() { this.stopMusic(0.1); for (const s of this.playing) { try { s.stop(); } catch { } } this.playing.clear(); }
  /** Aplausos sintetizados (ruido filtrado a ráfagas): no hay aplausos en el sb3 */
  applause(sec = 5, vol = 0.9) {
    const ctx = this.ctx, len = ctx.sampleRate * sec, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) { const clap = Math.random() < 0.0009 ? 1 : 0; d[i] = (Math.random() * 2 - 1) * (0.25 + 0.75 * clap) * Math.min(1, i / 8000, (len - i) / 30000); } }
    const s = ctx.createBufferSource(); s.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.6;
    const g = ctx.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(this.sfx); s.start(); this.playing.add(s);
  }
}
export let audio: Audio;
export function initAudio() { audio = new Audio(); return audio; }
