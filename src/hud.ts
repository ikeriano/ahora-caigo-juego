import * as THREE from 'three';
import type { Engine } from './engine';

const $ = (id: string) => document.getElementById(id)!;
export const ABORT = new Error('abort');
/** Sesión cancelable: al volver al menú todas las esperas lanzan ABORT */
export class Session {
  alive = true; skipFlag = false;
  async w(ms: number) { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (!this.alive) throw ABORT; if (this.skipFlag) return; await new Promise(r => setTimeout(r, Math.min(50, ms))); } if (!this.alive) throw ABORT; }
  async until(fn: () => boolean) { while (!fn()) { if (!this.alive) throw ABORT; await new Promise(r => setTimeout(r, 50)); } }
  check() { if (!this.alive) throw ABORT; }
  async race<T>(p: Promise<T>): Promise<T> { let done = false, val: any; p.then(v => { done = true; val = v; }); await this.until(() => done); return val; }
}

export class Hud {
  bubbleTarget: THREE.Object3D | null = null; bubbleUntil = 0;
  constructor(public eng: Engine) {
    eng.onFrame.push(() => this.placeBubble());
  }
  toast(text: string, ms = 2200) { const t = $('toast'); t.innerHTML = text; t.classList.remove('hidden'); clearTimeout((t as any)._h); if (ms) (t as any)._h = setTimeout(() => t.classList.add('hidden'), ms); }
  hideToast() { $('toast').classList.add('hidden'); }
  hint(text: string | null) { const h = $('hint'); if (!text) h.classList.add('hidden'); else { h.innerHTML = text; h.classList.remove('hidden'); } }
  /** Bocadillo del Presentador sobre su cabeza */
  say(text: string, ms = 3200, who: THREE.Object3D | null = this.eng.host?.head || null, name = 'El Presentador') {
    const b = $('bubble'); b.querySelector('span')!.textContent = text; (b.querySelector('b') as HTMLElement).textContent = name;
    b.classList.remove('hidden'); this.bubbleTarget = who; this.bubbleUntil = performance.now() + ms; this.placeBubble();
  }
  hideBubble() { $('bubble').classList.add('hidden'); this.bubbleTarget = null; }
  placeBubble() {
    const b = $('bubble'); if (b.classList.contains('hidden')) return;
    if (performance.now() > this.bubbleUntil) { this.hideBubble(); return; }
    let x = innerWidth * 0.3, y = innerHeight * 0.3;
    if (this.bubbleTarget && this.bubbleTarget.parent) {
      const v = new THREE.Vector3(); this.bubbleTarget.getWorldPosition(v); v.y += 0.35; v.project(this.eng.camera);
      if (v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1) { x = (v.x + 1) / 2 * innerWidth; y = (1 - v.y) / 2 * innerHeight; }
    }
    const w = b.offsetWidth, h = b.offsetHeight;
    x = Math.max(w / 2 + 8, Math.min(innerWidth - w / 2 - 8, x)); y = Math.max(h + 50, Math.min(innerHeight * 0.55, y));
    b.style.left = x + 'px'; b.style.top = y + 'px';
  }
  hashtag(t: string | null) { const h = $('hashtag'); if (!t) h.classList.remove('on'); else { h.textContent = t; h.classList.add('on'); } }
  /** Rótulos azules con huellas (abajo a la izquierda) */
  async lowerThird(text: string, ms: number, s: Session) {
    const l = $('lower3'); l.classList.remove('hidden');
    const p = document.createElement('div'); p.className = 'pill'; p.innerHTML = `<i class="fp"></i><span>${text}</span><i class="fp"></i>`;
    l.appendChild(p); await s.w(ms); p.classList.add('out'); await s.w(400); p.remove();
  }
  clearLowerThirds() { $('lower3').innerHTML = ''; }
  credits(lines: (string | [string, string[]])[], seconds: number) {
    const c = $('credits'), r = $('creditsRoll'); c.classList.remove('hidden');
    r.innerHTML = lines.map(l => typeof l === 'string' ? `<div>${l}</div>` : `<h4>${l[0]}</h4>${l[1].map(x => `<div>${x}</div>`).join('')}`).join('');
    r.style.transition = 'none'; r.style.transform = 'translateY(0)'; void r.offsetWidth;
    r.style.transition = `transform ${seconds}s linear`; r.style.transform = `translateY(-${r.scrollHeight + innerHeight}px)`;
  }
  hideCredits() { $('credits').classList.add('hidden'); }
  actions(btns: { label: string; cls?: string; fn: () => void }[]) {
    const a = $('actions'); a.innerHTML = '';
    for (const b of btns) { const e = document.createElement('button'); e.className = 'btn ' + (b.cls || ''); e.innerHTML = b.label; e.onclick = (ev) => { ev.stopPropagation(); b.fn(); }; a.appendChild(e); }
  }
  score(html: string | null, big = false) {
    let e = document.getElementById('scorebox');
    if (!html) { e?.remove(); return; }
    if (!e) { e = document.createElement('div'); e.id = 'scorebox'; e.className = 'score'; $('hud').appendChild(e); }
    e.className = 'score' + (big ? ' bigprize' : ''); e.innerHTML = html;
  }
  skip(fn: (() => void) | null) { const b = $('btnSkip'); if (!fn) b.classList.add('hidden'); else { b.classList.remove('hidden'); b.onclick = (e) => { e.stopPropagation(); fn(); }; } }
  reset() { this.hideBubble(); this.hideToast(); this.hint(null); this.hashtag(null); this.clearLowerThirds(); this.hideCredits(); this.actions([]); this.score(null); this.skip(null); $('vidas').innerHTML = ''; }
}
export const fmt = (n: number) => Math.floor(n).toLocaleString('es-ES');
