import { Stage2D } from './stage2d';
import { audio, costume, imgUrl } from './assets';
import { Q, norm } from './questions';
import { publico } from './publico';

const AndroidKb: any = (window as any).AndroidKb;

/** Panel de la pregunta (franja inferior del escenario Scratch: y 390..720 px) con teclado del móvil */
export class Panel {
  st: Stage2D; wrap: HTMLElement; box: HTMLElement; input: HTMLInputElement;
  slots: HTMLElement; txt: HTMLElement | null = null; hint: HTMLElement;
  q: Q | null = null; active = false; final = false;
  private resolve: ((ok: boolean) => void) | null = null;
  maxH = innerHeight; kbOpen = false;
  onFocusNeed = () => { };
  constructor() {
    this.wrap = document.getElementById('panel')!; this.box = document.getElementById('panelBox')!;
    this.st = new Stage2D(this.wrap, this.box, 960, 330, 195);
    this.st.fit = () => this.fit();
    this.input = document.getElementById('kb') as HTMLInputElement;
    this.slots = document.createElement('div'); this.slots.className = 'pslots'; this.slots.style.top = '246px'; this.slots.style.zIndex = '20'; this.box.appendChild(this.slots);
    this.hint = document.createElement('div'); this.hint.className = 'phint'; this.box.appendChild(this.hint);
    this.box.style.pointerEvents = 'none';
    this.slots.addEventListener('pointerdown', (e) => { e.preventDefault(); this.focus(); });
    this.input.addEventListener('input', () => this.onInput());
    this.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
    // teclado físico sin foco
    addEventListener('keydown', (e) => {
      if (!this.active || e.target === this.input || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1 && /\p{L}/u.test(e.key)) { this.input.value += e.key; this.onInput(); e.preventDefault(); }
      else if (e.key === 'Backspace') { this.input.value = this.input.value.slice(0, -1); this.onInput(); }
    });
    addEventListener('resize', () => this.fit()); visualViewport?.addEventListener('resize', () => this.fit());
    this.hideAll(); this.fit();
  }
  fit() {
    const vw = innerWidth, vh = visualViewport ? visualViewport.height : innerHeight;
    if (innerHeight > this.maxH) this.maxH = innerHeight;
    this.kbOpen = this.active && (vh < this.maxH * 0.72);
    const s = Math.min(vw / 960, (this.kbOpen ? vh * 0.98 : vh * 0.5) / 330);
    const top = (visualViewport ? visualViewport.offsetTop : 0) + vh - 330 * s;
    this.box.style.transform = `translate(${(vw - 960 * s) / 2}px,${top}px) scale(${s})`;
    document.body.classList.toggle('kb-open', this.kbOpen);
  }
  showBg(final: boolean) {
    this.final = final; this.wrap.style.display = 'block';
    this.st.show('Gcpgt1', final ? 'Final' : 'Principal', { fade: 300, z: 1 });
    this.fit();
  }
  showClock(on: boolean) {
    if (!on) { ['Relogio2', 'd1', 'd2', 'd3', 'd4'].forEach(k => this.st.hide(k, 200)); return; }
    this.st.show('Relogio2', 1, { z: 2, fade: 200 });
  }
  setTime(sec: number, frac = 0) {
    let a: string, b: string;
    if (this.final) { const m = Math.floor(sec / 60), s = sec % 60; a = '0' + m; b = String(s).padStart(2, '0'); }
    else { a = String(Math.max(0, sec)).padStart(2, '0'); const c = Math.floor(frac * 100); b = String(c).padStart(2, '0'); }
    const d = [a[0], a[1], b[0], b[1]];
    const xs = [137, 155, 180, 198];
    d.forEach((ch, i) => this.st.show(`RelogioDig${i + 1}`, ch, { key: 'd' + (i + 1), x: xs[i], y: -41, z: 3 }));
  }
  setQuestion(q: Q) {
    this.q = q; this.clearText();
    if (q.kind === 'img') {
      this.st.show('Pergunta', q.costume!, { z: 4, fade: 200 });
      this.st.show('Resposta', q.costume!, { z: 5, fade: 200 });
    } else {
      this.st.hide('Pergunta'); this.st.hide('Resposta');
      const t = document.createElement('div'); t.className = 'ptxt';
      const p = document.createElement('div'); p.className = 'pq'; p.style.top = '72px'; p.textContent = q.text!;
      const bx = document.createElement('div'); bx.className = 'pboxes'; bx.style.top = '160px';
      const n = q.word!.length; const bw = Math.min(50, Math.floor(900 / n) - 6);
      [...q.word!].forEach((ch, i) => {
        const b = document.createElement('div'); b.className = 'b' + (ch === ' ' ? ' sp' : '') + (q.hidden![i] ? ' h' : '');
        b.textContent = ch === ' ' ? '' : ch; if (ch !== ' ') { b.style.width = bw + 'px'; b.style.fontSize = Math.round(bw * 0.9) + 'px'; }
        bx.appendChild(b);
      });
      t.append(p, bx); t.style.zIndex = '4'; t.style.position = 'absolute'; t.style.inset = '0';
      this.box.appendChild(t); this.txt = t;
    }
    this.hint.textContent = '';
  }
  clearText() { this.txt?.remove(); this.txt = null; }
  /** "acerto": la casilla parpadea y se descubre la palabra */
  async reveal(flashMs = 200) {
    if (this.q?.kind === 'img') { this.st.hide('Resposta'); await sleep(100); this.st.show('Resposta', this.q.costume!, { z: 5 }); await sleep(100); this.st.hide('Resposta'); }
    else this.txt?.querySelector('.pboxes')?.classList.add('reveal');
    await sleep(flashMs);
  }
  /** Activa el teclado y espera a que se escriban tantas letras como faltan. true = correcto */
  ask(): Promise<boolean> {
    this.active = true; this.renderSlots('');
    this.input.value = ''; this.focus();
    this.hint.textContent = '';
    return new Promise(r => { this.resolve = r; });
  }
  focus() {
    if (!this.active) return;
    try { this.input.focus({ preventScroll: true }); } catch { this.input.focus(); }
    if (AndroidKb) try { AndroidKb.show(); } catch { }
    setTimeout(() => this.fit(), 350);
  }
  stopInput() {
    this.active = false; this.resolve = null; this.input.blur(); this.slots.innerHTML = ''; this.pasaCb = null;
    if (AndroidKb) try { AndroidKb.hide(); } catch { }
    setTimeout(() => this.fit(), 350);
  }
  renderSlots(v: string, cls = '') {
    const n = this.q?.missing.length || 0;
    this.slots.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div'); s.className = 'slot' + (cls ? ' ' + cls : '') + (!cls && i === v.length ? ' cur' : '');
      s.textContent = v[i] || ''; this.slots.appendChild(s);
    }
    const tip = document.createElement('div'); tip.className = 'slot'; tip.style.cssText = 'width:auto;padding:0 12px;font-size:20px;background:linear-gradient(#ffe27a,#f39a12);color:#3a1a00';
    tip.textContent = '⌨'; tip.title = 'Abrir teclado'; this.slots.appendChild(tip);
    this.addPasar();
  }
  /** Botón PASAR al lado de las casillas: queda justo encima del teclado del móvil cuando está abierto */
  private pasaCb: (() => void) | null = null; private pasaLabel = 'PASAR';
  private addPasar() {
    if (!this.pasaCb) return;
    const b = document.createElement('div'); b.className = 'slot pasar'; b.id = 'btnPasar'; b.innerHTML = this.pasaLabel; b.setAttribute('role', 'button');
    // pointerdown sin foco: así el teclado del móvil no se cierra al tocarlo
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });
    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const cb = this.pasaCb; if (cb) { audio.play('Tecla'); cb(); } });
    this.slots.appendChild(b);
  }
  /** Casillas del turno del oponente-bot (sin teclado): letras que va escribiendo, o «pensando…» */
  botSlots(v: string, cls: 'bot' | 'bad' | 'ok' = 'bot', thinking = '') {
    const n = this.q?.missing.length || 0;
    this.slots.innerHTML = '';
    for (let i = 0; i < n; i++) { const s = document.createElement('div'); s.className = 'slot ' + cls + (cls === 'bot' && i === v.length ? ' cur' : ''); s.textContent = v[i] || ''; this.slots.appendChild(s); }
    if (thinking) { const t = document.createElement('div'); t.className = 'slot think'; t.textContent = thinking; this.slots.appendChild(t); }
  }
  private evaluating = false;
  onInput() {
    if (!this.active || !this.q || this.evaluating) { this.input.value = ''; return; }
    const v = norm(this.input.value).slice(0, this.q.missing.length);
    if (v.length) audio.play('saltar', 0.5);
    this.renderSlots(v);
    if (v.length === this.q.missing.length) {
      // Comprobación igual que el Scratch: cada letra escrita debe estar en "Painel"
      const ok = [...v].every(ch => this.q!.missing.includes(ch));
      this.input.value = '';
      if (ok) { this.renderSlots(v, 'ok'); const r = this.resolve; this.active = false; r?.(true); }
      else {
        this.evaluating = true; this.renderSlots(v, 'bad'); audio.play('Erro'); publico.oohSuave();
        setTimeout(() => { this.evaluating = false; if (this.active) this.renderSlots(''); }, 450);
      }
    }
  }
  /** PASAR (duelos, Juego Final y entrenamiento). label: texto del botón */
  showPasa(on: boolean, cb?: () => void, label = 'PASAR ⏭') {
    this.st.hide('Teclado27');
    this.pasaCb = on && cb ? cb : null; this.pasaLabel = label;
    const old = this.slots.querySelector('#btnPasar'); old?.remove();
    if (this.pasaCb && this.active) this.addPasar();
  }
  hideQuestion(fade = 300) { this.st.hide('Pergunta', fade); this.st.hide('Resposta', fade); if (this.txt) { const t = this.txt; t.style.transition = `opacity ${fade}ms`; t.style.opacity = '0'; setTimeout(() => t.remove(), fade); this.txt = null; } }
  hideAll(fade = 0) {
    this.stopInput(); this.hideQuestion(fade);
    for (const k of ['Gcpgt1', 'Relogio2', 'd1', 'd2', 'd3', 'd4', 'Teclado27']) this.st.hide(k, fade);
  }
}

/** Imagen de los comodines (Vidas) arriba a la izquierda */
export function showVidas(vidas: number, extra: boolean) {
  const el = document.getElementById('vidas')!;
  if (vidas < 0) { el.innerHTML = ''; return; }
  const name = String(Math.min(3, vidas)) + (extra && vidas < 3 ? 'b' : '');
  const c = costume('Vidas', name);
  el.innerHTML = `<img src="${imgUrl(c.f)}" style="width:${c.w * 0.5}px;filter:drop-shadow(0 2px 4px #000)">`;
}
export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
