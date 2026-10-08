import { costume, imgUrl, M } from './assets';

/** Capa 2D que reproduce el escenario de Scratch (960x720 px = 480x360 a resolución 2) */
export class Stage2D {
  box: HTMLElement; els = new Map<string, HTMLImageElement>();
  constructor(public wrap: HTMLElement, box: HTMLElement, public W = 960, public H = 720, public offY = 0) {
    this.box = box; box.style.width = W + 'px'; box.style.height = H + 'px';
    this.fit(); addEventListener('resize', () => this.fit()); visualViewport?.addEventListener('resize', () => this.fit());
  }
  fit() {
    const vw = innerWidth, vh = innerHeight;
    const s = Math.min(vw / this.W, vh / this.H);
    this.box.style.transform = `translate(${(vw - this.W * s) / 2}px,${(vh - this.H * s) / 2}px) scale(${s})`;
  }
  /** Muestra un disfraz en su posición de Scratch. */
  show(sprite: string, cos: string | number, o: { fade?: number; z?: number; x?: number; y?: number; size?: number; key?: string; click?: () => void; cls?: string; from?: number } = {}) {
    const key = o.key || sprite;
    let el = this.els.get(key);
    if (!el) { el = document.createElement('img'); el.draggable = false; el.className = 'spr'; this.box.appendChild(el); this.els.set(key, el); }
    const c = costume(sprite, cos); const sp = M.sprites[sprite];
    const x = o.x ?? sp.x, y = o.y ?? sp.y, s = (o.size ?? 100) / 100;
    el.src = imgUrl(c.f);
    el.style.left = (this.W / 2 + x * 2 - c.cx) + 'px'; el.style.top = (this.H / 2 - this.offY - y * 2 - c.cy) + 'px';
    el.style.width = c.w + 'px'; el.style.height = c.h + 'px';
    el.style.transformOrigin = `${c.cx}px ${c.cy}px`;
    el.style.transform = `scale(${s})`;
    el.style.zIndex = String(o.z ?? 1);
    el.className = 'spr' + (o.cls ? ' ' + o.cls : '') + (o.click ? ' click' : '');
    el.onclick = o.click ? (e) => { e.stopPropagation(); o.click!(); } : null;
    el.style.pointerEvents = o.click ? 'auto' : 'none';
    const fade = o.fade ?? 0;
    el.style.transition = 'none'; el.style.opacity = fade ? '0' : '1'; el.style.display = 'block';
    if (fade) { void el.offsetWidth; el.style.transition = `opacity ${fade}ms, transform ${fade}ms`; el.style.opacity = '1'; if (o.from != null) { el.style.transform = `scale(${o.from})`; void el.offsetWidth; el.style.transform = `scale(${s})`; } }
    return el;
  }
  tf(key: string, css: string, ms = 300) { const el = this.els.get(key); if (el) { el.style.transition = `opacity ${ms}ms, transform ${ms}ms`; el.style.transform = css; } }
  setSize(key: string, size: number, ms = 300) { const el = this.els.get(key); if (el) { el.style.transition = `opacity ${ms}ms, transform ${ms}ms`; el.style.transform = `scale(${size / 100})`; } }
  hide(key: string, fade = 0) {
    const el = this.els.get(key); if (!el) return;
    if (!fade) { el.style.display = 'none'; return; }
    el.style.transition = `opacity ${fade}ms`; el.style.opacity = '0';
    setTimeout(() => { if (el.style.opacity === '0') el.style.display = 'none'; }, fade);
  }
  clear() { for (const el of this.els.values()) el.remove(); this.els.clear(); }
  isShown(key: string) { const el = this.els.get(key); return !!el && el.style.display !== 'none' && el.style.opacity !== '0'; }
}
