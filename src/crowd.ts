// Sonido del público (v1.3), 100 % sintetizado en el propio juego: no se usa ninguna grabación.
//  · aplausos: cientos de palmadas individuales (ráfagas de ruido por un resonador), cada «persona» a su ritmo
//  · vítores y «oooh»: decenas de voces sintéticas (diente de sierra + filtros de formantes de vocal) con reverberación
//  · palmas al ritmo: palmadas de grupo programadas en el reloj de audio al compás de la música
import { audio } from './assets';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const SR = 22050;

/** Una palmada: ráfaga de ruido corta pasada por un resonador de 2 polos (se suma en d, con vuelta al principio si loop) */
function clap(d: Float32Array, at: number, amp: number, f0: number, q: number, decay: number, wrap: boolean) {
  const n = Math.floor(SR * 0.035), w = 2 * Math.PI * f0 / SR, r = Math.exp(-Math.PI * (f0 / q) / SR);
  const a1 = -2 * r * Math.cos(w), a2 = r * r, gain = (1 - r) * 2.2; let y1 = 0, y2 = 0;
  for (let i = 0; i < n; i++) {
    let j = at + i; if (j >= d.length) { if (!wrap) break; j -= d.length; }
    const t = i / SR; const env = t < 0.0007 ? t / 0.0007 : Math.exp(-(t - 0.0007) / decay);
    const x = (Math.random() * 2 - 1) * env; const y = x - a1 * y1 - a2 * y2; y2 = y1; y1 = y;
    d[j] += (y * gain + x * 0.18) * amp;
  }
}
function normalize(b: AudioBuffer, peak = 0.9) {
  let m = 0; for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i])); }
  if (m > 0) for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= peak / m; }
  return b;
}

class Crowd {
  out: GainNode | null = null;
  applause: AudioBuffer[] = []; group: AudioBuffer[] = []; cheers: AudioBuffer[] = []; oohs: AudioBuffer[] = []; laughs: AudioBuffer[] = [];
  ready = false; private gi = 0; private beat: { period: number; next: number; until: number; vol: number; iv: number } | null = null;
  /** registro para las pruebas automáticas: [tipo, segundos de audio] */
  log: [string, number][] = [];

  init() {
    const ctx = audio.ctx; this.out = ctx.createGain(); this.out.gain.value = 0.85; this.out.connect(audio.master);
    // los aplausos se crean al momento (son rápidos); las voces se renderizan en segundo plano
    this.applause = [this.applauseBuf(5, 46), this.applauseBuf(5, 62)];
    this.group = [0, 1, 2, 3].map(() => this.groupClap());
    setTimeout(() => this.buildVoices().catch(e => console.warn('público: voces no disponibles', e)), 1200);
  }
  setLevel(on: boolean, vol: number) { if (this.out) this.out.gain.value = on ? vol * 1.0 : 0; }
  get enabled() { return !!this.out && this.out.gain.value > 0; }

  // ---------- síntesis
  private ctx() { return audio.ctx; }
  private applauseBuf(sec: number, people: number) {
    const b = this.ctx().createBuffer(2, Math.floor(SR * sec), SR); const L = b.getChannelData(0), R = b.getChannelData(1);
    for (let k = 0; k < people; k++) {
      const pan = rnd(-1, 1), dist = rnd(0.25, 1), f0 = rnd(900, 2600) * (0.75 + 0.25 * dist), q = rnd(1.5, 4.2), dec = rnd(0.004, 0.009), per = 1 / rnd(3.4, 5.6);
      const gl = Math.sqrt((1 - pan) / 2) * dist, gr = Math.sqrt((1 + pan) / 2) * dist;
      for (let t = rnd(0, per); t < sec; t += per * rnd(0.9, 1.1)) { const at = Math.floor(t * SR), a = rnd(0.6, 1); clap(L, at, a * gl, f0, q, dec, true); clap(R, at + Math.floor(rnd(0, 0.0006) * SR), a * gr, f0 * rnd(0.97, 1.03), q, dec, true); }
    }
    return normalize(b, 0.8);
  }
  private groupClap() {
    const b = this.ctx().createBuffer(2, Math.floor(SR * 0.3), SR); const L = b.getChannelData(0), R = b.getChannelData(1);
    for (let k = 0; k < 40; k++) {
      const t = 0.03 + (Math.random() + Math.random() + Math.random() - 1.5) * 0.016; const pan = rnd(-1, 1), at = Math.max(0, Math.floor(t * SR)), f0 = rnd(900, 2400), q = rnd(1.5, 4), dec = rnd(0.004, 0.008), a = rnd(0.4, 1);
      clap(L, at, a * Math.sqrt((1 - pan) / 2), f0, q, dec, false); clap(R, at, a * Math.sqrt((1 + pan) / 2), f0, q, dec, false);
    }
    return normalize(b, 0.85);
  }
  /** Voces del público con OfflineAudioContext: 'cheer' (¡uuuh! ¡eeeh!), 'ooh' (¡ooooh!) y 'laugh' (risas: ¡ja, ja!) */
  private async voices(kind: 'cheer' | 'ooh' | 'laugh', dur: number) {
    const OAC: any = (window as any).OfflineAudioContext || (window as any).webkitOfflineAudioContext; if (!OAC) return null;
    const oc: OfflineAudioContext = new OAC(2, Math.ceil(dur * SR), SR);
    const bus = oc.createGain(); bus.gain.value = 0.5;
    const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3600;
    const conv = oc.createConvolver(); const ir = oc.createBuffer(2, Math.floor(SR * 1.1), SR);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / SR / 0.28); }
    conv.buffer = ir; const wet = oc.createGain(); wet.gain.value = 0.22;
    bus.connect(lp); lp.connect(oc.destination); lp.connect(conv); conv.connect(wet); wet.connect(oc.destination);
    const N = kind === 'laugh' ? 22 : 30;
    for (let v = 0; v < N; v++) {
      const male = Math.random() < 0.5, f0 = male ? rnd(100, 150) : rnd(185, 290);
      const o = oc.createOscillator(); o.type = 'sawtooth';
      const g = oc.createGain(); g.gain.value = 0;
      const f1 = oc.createBiquadFilter(), f2 = oc.createBiquadFilter(); f1.type = f2.type = 'bandpass'; f1.Q.value = 5; f2.Q.value = 7;
      const g2 = oc.createGain(); g2.gain.value = 0.55;
      const pan = (oc as any).createStereoPanner ? oc.createStereoPanner() : null; if (pan) pan.pan.value = rnd(-0.9, 0.9);
      o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g2); g2.connect(g); (pan ? (g.connect(pan), pan) : g).connect(bus);
      const lfo = oc.createOscillator(); lfo.frequency.value = rnd(4.5, 6.5); const lg = oc.createGain(); lg.gain.value = f0 * 0.025; lfo.connect(lg); lg.connect(o.frequency);
      const F = o.frequency, A = g.gain; let t0: number, end: number; const amp = rnd(0.5, 1) * 0.16;
      if (kind === 'ooh') {
        t0 = rnd(0, 0.16); end = t0 + rnd(1.2, 1.8);
        F.setValueAtTime(f0 * 1.2, t0); F.linearRampToValueAtTime(f0 * 1.34, t0 + 0.28); F.exponentialRampToValueAtTime(f0 * 0.8, end);
        f1.frequency.value = rnd(330, 420); f2.frequency.value = rnd(700, 860);
        A.setValueAtTime(0, t0); A.linearRampToValueAtTime(amp, t0 + 0.3); A.setValueAtTime(amp, end - 0.5); A.linearRampToValueAtTime(0, end);
      } else if (kind === 'cheer') {
        t0 = rnd(0, 0.8); end = t0 + rnd(0.8, 1.9); const shape = Math.random();
        if (shape < 0.55) { // «¡uuuuh!» que sube
          F.setValueAtTime(f0 * 0.9, t0); F.exponentialRampToValueAtTime(f0 * 1.6, t0 + 0.3); F.setValueAtTime(f0 * 1.6, end - 0.4); F.exponentialRampToValueAtTime(f0 * 1.15, end);
          f1.frequency.setValueAtTime(360, t0); f1.frequency.linearRampToValueAtTime(rnd(600, 760), t0 + 0.35); f2.frequency.setValueAtTime(800, t0); f2.frequency.linearRampToValueAtTime(rnd(1100, 1400), t0 + 0.35);
        } else { // «¡eeeeh!» que baja
          F.setValueAtTime(f0 * 1.55, t0); F.exponentialRampToValueAtTime(f0 * 1.05, end);
          f1.frequency.value = rnd(480, 620); f2.frequency.value = rnd(1600, 2000);
        }
        A.setValueAtTime(0, t0); A.linearRampToValueAtTime(amp, t0 + 0.07); A.setValueAtTime(amp, end - 0.35); A.linearRampToValueAtTime(0, end);
      } else { // risas: «ja-ja-ja» = sílabas cortas con vocal «a»
        t0 = rnd(0, 0.5); const syl = 4 + Math.floor(rnd(0, 5)), per = rnd(0.13, 0.19); end = t0 + syl * per + 0.1;
        f1.frequency.value = rnd(700, 850); f2.frequency.value = rnd(1150, 1350);
        A.setValueAtTime(0, t0);
        for (let k = 0; k < syl; k++) { const ts = t0 + k * per, ff = f0 * (1.35 - k * 0.04) * rnd(0.97, 1.03); F.setValueAtTime(ff, ts); A.linearRampToValueAtTime(amp * (1 - k * 0.08), ts + 0.03); A.linearRampToValueAtTime(0.0001, ts + per * 0.8); }
      }
      o.start(t0); o.stop(end + 0.05); lfo.start(t0); lfo.stop(end + 0.05);
    }
    // silbidos («¡fiu, fiuuu!») en los vítores
    if (kind === 'cheer') for (let k = 0; k < 3; k++) {
      const o = oc.createOscillator(); o.type = 'sine'; const g = oc.createGain(); g.gain.value = 0; o.connect(g); g.connect(bus);
      const t0 = rnd(0.1, 1.4), f = rnd(1500, 2100);
      o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * 1.5, t0 + 0.18); o.frequency.setValueAtTime(f * 0.95, t0 + 0.26); o.frequency.exponentialRampToValueAtTime(f * 1.6, t0 + 0.6);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.05, t0 + 0.03); g.gain.setValueAtTime(0.05, t0 + 0.18); g.gain.linearRampToValueAtTime(0, t0 + 0.22); g.gain.linearRampToValueAtTime(0.05, t0 + 0.3); g.gain.linearRampToValueAtTime(0, t0 + 0.62);
      o.start(t0); o.stop(t0 + 0.7);
    }
    // murmullo de fondo (ruido filtrado) para empastar
    { const nb = oc.createBuffer(1, Math.ceil(dur * SR), SR); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = oc.createBufferSource(); s.buffer = nb; const f = oc.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = kind === 'ooh' ? 500 : 900; f.Q.value = 0.8;
      const g = oc.createGain(); g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(kind === 'ooh' ? 0.05 : 0.07, 0.3); g.gain.linearRampToValueAtTime(0, dur);
      s.connect(f); f.connect(g); g.connect(bus); s.start(0); }
    const out: AudioBuffer = await new Promise((res, rej) => { const p = oc.startRendering(); if (p && (p as any).then) (p as Promise<AudioBuffer>).then(res, rej); else oc.oncomplete = (e: any) => res(e.renderedBuffer); });
    return normalize(out, 0.85);
  }
  private async buildVoices() {
    for (let k = 0; k < 2; k++) { const c = await this.voices('cheer', 3.2); if (c) this.cheers.push(c); }
    for (let k = 0; k < 2; k++) { const o = await this.voices('ooh', 2.3); if (o) this.oohs.push(o); }
    const l = await this.voices('laugh', 2.0); if (l) this.laughs.push(l);
    this.ready = true;
  }

  // ---------- reproducción
  private play(b: AudioBuffer | undefined, vol: number, opts: { loop?: boolean; dur?: number; fadeIn?: number; fadeOut?: number; when?: number; offset?: number; rate?: number } = {}) {
    if (!b || !this.out) return null;
    const ctx = this.ctx(), t = Math.max(ctx.currentTime, opts.when ?? ctx.currentTime);
    const s = ctx.createBufferSource(); s.buffer = b; s.loop = !!opts.loop; s.playbackRate.value = opts.rate ?? rnd(0.96, 1.04);
    const g = ctx.createGain(); s.connect(g); g.connect(this.out);
    const fi = opts.fadeIn ?? 0.01, fo = opts.fadeOut ?? 0.05, dur = opts.dur ?? b.duration;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + fi);
    g.gain.setValueAtTime(vol, t + Math.max(fi, dur - fo)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    s.start(t, opts.offset ?? 0); s.stop(t + dur + 0.05); audio.playing.add(s); s.onended = () => audio.playing.delete(s);
    return s;
  }
  /** Aplausos de `sec` segundos */
  clap(sec = 3, vol = 0.8) {
    this.log.push(['aplauso', sec]);
    this.play(this.applause[Math.floor(Math.random() * this.applause.length)], vol, { loop: true, dur: sec + 0.9, fadeIn: 0.2, fadeOut: 1.1, offset: rnd(0, 4) });
  }
  cheer(vol = 0.8) { this.log.push(['vitores', 3]); this.play(this.cheers[Math.floor(Math.random() * this.cheers.length)], vol); }
  ooh(vol = 0.8) { this.log.push(['ooh', 2]); this.play(this.oohs[Math.floor(Math.random() * this.oohs.length)], vol, { rate: rnd(0.94, 1.06) }); }
  laugh(vol = 0.6) { this.log.push(['risas', 2]); this.play(this.laughs[0], vol); }
  /** Palmas al ritmo: una palmada de grupo cada `period` s desde el instante `first` (reloj de audio) hasta `until` */
  startBeat(period: number, first: number, until: number, vol = 0.55) {
    this.stopBeat(); this.log.push(['ritmo', until - first]);
    const st = { period, next: first, until, vol, iv: 0 };
    const tick = () => { const now = this.ctx().currentTime; while (st.next < now + 0.25 && st.next < st.until) { if (st.next >= now - 0.02) this.play(this.group[this.gi++ % this.group.length], st.vol * rnd(0.85, 1), { when: st.next, rate: rnd(0.97, 1.03) }); st.next += st.period; } if (st.next >= st.until) this.stopBeat(); };
    st.iv = window.setInterval(tick, 60); tick(); this.beat = st;
  }
  stopBeat() { if (this.beat) { clearInterval(this.beat.iv); this.beat = null; } }
  get beating() { return !!this.beat; }
}
export const crowd = new Crowd();

// ---------------------------------------------------------------- tempo de la música (para las palmas al ritmo)
const beatCache = new Map<AudioBuffer, { period: number; phase: number }>();
/** Estima el pulso de un tramo de la música (envolvente de ataques + autocorrelación). Devuelve periodo (s) y fase (s desde t0) */
export function estimateBeat(b: AudioBuffer, t0 = 6, t1 = 27): { period: number; phase: number } {
  const hit = beatCache.get(b); if (hit) return hit;
  const sr = b.sampleRate, d = b.getChannelData(0), d2 = b.numberOfChannels > 1 ? b.getChannelData(1) : d;
  const hop = Math.floor(sr / 100); const a = Math.floor(Math.min(t0, b.duration) * sr), z = Math.floor(Math.min(t1, b.duration) * sr);
  const env: number[] = []; let prevE = 0, hp = 0, px = 0;
  for (let i = a; i + hop <= z; i += hop) {
    let e = 0; for (let j = i; j < i + hop; j++) { const x = (d[j] + d2[j]) * 0.5; hp = x - px; px = x; e += hp * hp; }
    e = Math.log(1e-6 + e); env.push(Math.max(0, e - prevE)); prevE = e;
  }
  // autocorrelación (sin la media) con refuerzo del doble del periodo: favorece el pulso del compás
  const mean = env.reduce((x, y) => x + y, 0) / Math.max(1, env.length); for (let i = 0; i < env.length; i++) env[i] -= mean;
  const ac = (lag: number) => { let v = 0; for (let i = 0; i + lag < env.length; i++) v += env[i] * env[i + lag]; return v / Math.max(1, env.length - lag); };
  let best = 0.8, bestV = -Infinity;
  if (env.length > 300) for (let lag = 40; lag <= 100; lag++) { const v = ac(lag) + 0.5 * ac(lag * 2); if (v > bestV) { bestV = v; best = lag / 100; } }
  let period = best; while (period < 0.5) period *= 2;
  const lag = Math.round(period * 100); let ph = 0, phV = -1;
  const half = Math.round(lag / 2), at = (i: number) => (env[i] || 0) + 0.5 * (env[i - 1] || 0) + 0.5 * (env[i + 1] || 0);
  // fase: los golpes en el pulso y a medio pulso (negras) pesan más que los contratiempos
  for (let o = 0; o < lag; o++) { let v = 0; for (let i = o; i < env.length; i += lag) v += at(i) + 0.6 * at(i + half) - 0.3 * at(i + Math.round(lag / 4)) - 0.3 * at(i + Math.round(lag * 3 / 4)); if (v > phV) { phV = v; ph = o; } }
  const r = { period, phase: t0 + ph / 100 }; beatCache.set(b, r); return r;
}
