import { drawFootprints } from './tex';
/** Logotipo PROPIO del juego (círculo con huellas + "¡AHORA CAIGO!") para cabecera, menús, pantallas y final.
 *  Tiene una variante de colores y adornos para cada programa especial (no usa logos de ninguna cadena). */
export interface LogoPal {
  outer: string; inner: [string, string]; ring: string | string[]; feet: string;
  text: string[]; stroke: string; extrude?: string; perLetter?: string[]; deco?: 'calabaza' | 'nieve' | 'confeti' | 'brillos' | 'estrellas' | 'sol' | '300' | 'globos';
}
export const LOGO_PAL: Record<string, LogoPal> = {
  normal: { outer: '#0a2a9a', inner: ['#3a3f4a', '#14161c'], ring: '#f07a12', feet: '#ffc21a', text: ['#ffffff', '#f2f5fa', '#b9c3d3', '#eef2f8'], stroke: '#1a2238', extrude: '#5d6880' },
  primetime: { outer: '#2a1d00', inner: ['#2b2b2b', '#080808'], ring: '#ffd23a', feet: '#ffe9a8', text: ['#fff6c8', '#ffd23a', '#a8740a'], stroke: '#2a1800', extrude: '#7a5200', deco: 'brillos' },
  halloween: { outer: '#3b0a55', inner: ['#2a1438', '#0d0414'], ring: '#ff7a18', feet: '#ff9a1a', text: ['#ffe0a0', '#ff9a1a', '#c2410a'], stroke: '#1f0636', extrude: '#6a2400', deco: 'calabaza' },
  ninos: { outer: '#26c2f0', inner: ['#4a5fd0', '#1a2a8a'], ring: ['#ff4f4f', '#ffd23a', '#5fff8a', '#39c8ff', '#b07aff', '#ff5fb0'], feet: '#ffd23a', text: ['#ffffff'], stroke: '#123a8a', extrude: '#1a3a9a', perLetter: ['#ff4f4f', '#ffd23a', '#5fff8a', '#39c8ff', '#ff5fb0', '#b07aff'], deco: 'globos' },
  nochebuena: { outer: '#08154a', inner: ['#1a2a5a', '#050a20'], ring: '#ffe08a', feet: '#ffe08a', text: ['#ffffff', '#fff1c0', '#d4a017'], stroke: '#06103a', extrude: '#7a5a10', deco: 'estrellas' },
  navidad: { outer: '#c81a22', inner: ['#1f6a32', '#0a2a12'], ring: '#2fbf4a', feet: '#ffffff', text: ['#ffffff', '#ffe9e9', '#ff5a5a'], stroke: '#0a4a1a', extrude: '#0a5a22', deco: 'nieve' },
  carnaval: { outer: '#8a1fd0', inner: ['#3a1060', '#12041f'], ring: '#ff4fd8', feet: '#3dff8a', text: ['#ffffff'], stroke: '#2a0650', extrude: '#3a0a6a', perLetter: ['#ff4fd8', '#3dff8a', '#ffd23a', '#39c8ff'], deco: 'confeti' },
  findeano: { outer: '#3a3326', inner: ['#2a2a2a', '#080808'], ring: '#ffe08a', feet: '#e8ecff', text: ['#ffffff', '#ffe28a', '#c9a227'], stroke: '#1a1408', extrude: '#6a5410', deco: 'brillos' },
  verano: { outer: '#0aa6b8', inner: ['#1f7a8a', '#06323a'], ring: '#ffb02e', feet: '#ffe03a', text: ['#ffffff', '#fff0b0', '#ff8a3a'], stroke: '#064a5a', extrude: '#08606a', deco: 'sol' },
  especial300: { outer: '#6a0a14', inner: ['#3a0a10', '#120204'], ring: '#ffd23a', feet: '#ffd23a', text: ['#fff6c8', '#ffd23a', '#a8740a'], stroke: '#2a0606', extrude: '#6a4400', deco: '300' },
};
const palOf = (v?: string) => LOGO_PAL[v || 'normal'] || LOGO_PAL.normal;

function star(g: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) {
  g.save(); g.fillStyle = col; g.shadowColor = col; g.shadowBlur = r; g.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fill(); g.restore();
}
function pumpkin(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.save(); g.fillStyle = '#ff7a18'; g.strokeStyle = '#a33a00'; g.lineWidth = r * 0.08;
  for (const dx of [-0.45, 0.45, 0]) { g.beginPath(); g.ellipse(x + dx * r, y, r * 0.55, r * 0.75, 0, 0, 7); g.fill(); g.stroke(); }
  g.fillStyle = '#2f6a1a'; g.fillRect(x - r * 0.08, y - r * 0.95, r * 0.16, r * 0.3);
  g.fillStyle = '#1a0500'; // cara
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(x + sx * r * 0.42, y - r * 0.2); g.lineTo(x + sx * r * 0.18, y - r * 0.2); g.lineTo(x + sx * r * 0.3, y - r * 0.42); g.fill(); }
  g.beginPath(); g.moveTo(x - r * 0.45, y + r * 0.15); g.quadraticCurveTo(x, y + r * 0.6, x + r * 0.45, y + r * 0.15); g.quadraticCurveTo(x, y + r * 0.35, x - r * 0.45, y + r * 0.15); g.fill();
  g.restore();
}
function snowflake(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.save(); g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(1.5, r * 0.14); g.lineCap = 'round'; g.shadowColor = '#bfe8ff'; g.shadowBlur = r * 0.6;
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); }
  g.restore();
}
function badge300(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 ${s}px "Arial Black", Arial, sans-serif`;
  const lg = g.createLinearGradient(0, y - s / 2, 0, y + s / 2); lg.addColorStop(0, '#fff6c8'); lg.addColorStop(0.5, '#ffd23a'); lg.addColorStop(1, '#a8740a');
  g.lineJoin = 'round'; g.lineWidth = s * 0.14; g.strokeStyle = '#3a0606'; g.strokeText('300', x, y);
  g.shadowColor = '#ffcf40'; g.shadowBlur = s * 0.35; g.fillStyle = lg; g.fillText('300', x, y);
  g.restore();
}
/** Adornos del tema alrededor del círculo (R = radio del círculo) */
function decorate(g: CanvasRenderingContext2D, p: LogoPal, w: number, h: number, cx: number, cy: number, R: number) {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  switch (p.deco) {
    case 'calabaza': pumpkin(g, cx + R * 1.05, cy + R * 0.75, R * 0.42); pumpkin(g, cx - R * 1.12, cy + R * 0.85, R * 0.3);
      g.fillStyle = '#12021c'; for (let i = 0; i < 3; i++) { const bx = cx - R * 1.2 + i * R * 0.5, by = cy - R * 0.95 + (i % 2) * R * 0.2; g.beginPath(); g.ellipse(bx, by, R * 0.16, R * 0.05, 0, 0, 7); g.fill(); } break;
    case 'nieve': for (let i = 0; i < 14; i++) snowflake(g, rnd() * w, rnd() * h * 0.55, R * (0.06 + rnd() * 0.08)); break;
    case 'confeti': { const cols = ['#ff4fd8', '#3dff8a', '#ffd23a', '#39c8ff']; for (let i = 0; i < 60; i++) { g.save(); g.fillStyle = cols[i % 4]; g.translate(rnd() * w, rnd() * h); g.rotate(rnd() * 6); g.fillRect(-R * 0.04, -R * 0.015, R * 0.08, R * 0.03); g.restore(); }
      // antifaz
      g.save(); g.translate(cx + R * 1.0, cy - R * 0.7); g.rotate(-0.3); g.fillStyle = '#ff4fd8'; g.strokeStyle = '#ffd23a'; g.lineWidth = R * 0.03;
      g.beginPath(); g.ellipse(-R * 0.17, 0, R * 0.2, R * 0.13, 0, 0, 7); g.ellipse(R * 0.17, 0, R * 0.2, R * 0.13, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#12041f'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * R * 0.17, 0, R * 0.08, R * 0.05, 0, 0, 7); g.fill(); } g.restore(); break; }
    case 'brillos': for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, d = R * (1.15 + rnd() * 0.35); star(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, R * (0.06 + rnd() * 0.07), '#fff3c0'); } break;
    case 'estrellas': star(g, cx + R * 1.1, cy - R * 0.85, R * 0.18, '#ffe08a'); for (let i = 0; i < 8; i++) star(g, rnd() * w, rnd() * h * 0.5, R * (0.04 + rnd() * 0.04), '#ffffff'); break;
    case 'sol': { g.save(); g.fillStyle = '#ffe03a'; g.shadowColor = '#ffb02e'; g.shadowBlur = R * 0.3; g.beginPath(); g.arc(cx + R * 1.05, cy - R * 0.8, R * 0.24, 0, 7); g.fill();
      g.strokeStyle = '#ffe03a'; g.lineWidth = R * 0.04; for (let i = 0; i < 10; i++) { const a = i * 0.628; g.beginPath(); g.moveTo(cx + R * 1.05 + Math.cos(a) * R * 0.3, cy - R * 0.8 + Math.sin(a) * R * 0.3); g.lineTo(cx + R * 1.05 + Math.cos(a) * R * 0.42, cy - R * 0.8 + Math.sin(a) * R * 0.42); g.stroke(); } g.restore(); break; }
    case 'globos': { const cols = ['#ff4f4f', '#ffd23a', '#5fff8a', '#39c8ff', '#ff5fb0']; for (let i = 0; i < 5; i++) { const bx = (i < 3 ? cx - R * 1.2 : cx + R * 1.05) + (i % 3) * R * 0.12, by = cy - R * 0.6 + (i % 3) * R * 0.35; g.save(); g.fillStyle = cols[i]; g.beginPath(); g.ellipse(bx, by, R * 0.13, R * 0.17, 0, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(bx, by + R * 0.17); g.lineTo(bx, by + R * 0.45); g.stroke(); g.restore(); } break; }
    case '300': { const cols = ['#ffd23a', '#ffffff', '#ff3b4a', '#fff3c0']; for (let i = 0; i < 50; i++) { g.save(); g.fillStyle = cols[i % 4]; g.translate(rnd() * w, rnd() * h * 0.6); g.rotate(rnd() * 6); g.fillRect(-R * 0.04, -R * 0.015, R * 0.08, R * 0.03); g.restore(); }
      for (let i = 0; i < 6; i++) { const a = rnd() * 6.28, d = R * (1.15 + rnd() * 0.3); star(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, R * 0.08, '#fff3c0'); } break; }
  }
}

/** Círculo con las dos huellas amarillas (y adornos del tema) */
export function drawBadge(g: CanvasRenderingContext2D, cx: number, cy: number, R: number, p: LogoPal, w: number, h: number) {
    g.save();
    g.fillStyle = p.outer; g.beginPath(); g.arc(cx, cy, R * 1.12, 0, 7); g.fill();
    const gr = g.createRadialGradient(cx, cy - R * 0.3, R * 0.1, cx, cy, R);
    gr.addColorStop(0, p.inner[0]); gr.addColorStop(1, p.inner[1]); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    g.lineWidth = R * 0.09;
    if (Array.isArray(p.ring)) { const n = p.ring.length; p.ring.forEach((c, i) => { g.strokeStyle = c; g.shadowColor = c; g.shadowBlur = R * 0.15; g.beginPath(); g.arc(cx, cy, R * 0.94, i / n * 6.2832, (i + 1) / n * 6.2832 + 0.02); g.stroke(); }); }
    else { g.strokeStyle = p.ring; g.shadowColor = p.ring; g.shadowBlur = R * 0.2; g.beginPath(); g.arc(cx, cy, R * 0.94, 0, 7); g.stroke(); }
    g.shadowBlur = 0; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(cx - 2, cy - R, 4, R * 2);
    drawFootprints(g, cx, cy - R * 0.05, R * 1.6, p.feet);
    decorate(g, p, w, h, cx, cy, R);
    if (p.deco === 'nieve') { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(cx, cy - R * 1.08, R * 0.75, R * 0.12, 0, Math.PI, 0); g.fill(); }
    if (p.deco === '300') badge300(g, cx + R * 1.12, cy - R * 0.78, R * 0.5);
    g.restore();
}
export const palFor = (v?: string) => palOf(v);
export function drawLogo(g: CanvasRenderingContext2D, w: number, h: number, opts: { circle?: boolean; text?: boolean; variant?: string } = {}) {
  const p = palOf(opts.variant);
  const cx = w / 2, cy = h * 0.36, R = Math.min(w, h) * 0.26;
  if (opts.circle !== false) drawBadge(g, cx, cy, R, p, w, h);
  if (opts.text !== false) drawWordmark(g, w / 2, h * 0.5, w * 0.96, h * 0.45, p);
}

/** Trazo de un signo de exclamación alto ('!' o '¡') que ocupa las dos líneas del logo */
export function bangPath(g: CanvasRenderingContext2D, kind: '!' | '¡', cx: number, y0: number, H: number, bw: number) {
  const r = bw * 0.46, barH = H - r * 2 - bw * 0.22;
  const top = kind === '!' ? y0 : y0 + r * 2 + bw * 0.22, bot = top + barH;
  const wTop = kind === '!' ? bw : bw * 0.66, wBot = kind === '!' ? bw * 0.66 : bw, rr = bw * 0.16;
  g.beginPath();
  g.moveTo(cx - wTop / 2 + rr, top); g.lineTo(cx + wTop / 2 - rr, top); g.quadraticCurveTo(cx + wTop / 2, top, cx + wTop / 2, top + rr);
  g.lineTo(cx + wBot / 2, bot - rr); g.quadraticCurveTo(cx + wBot / 2, bot, cx + wBot / 2 - rr, bot);
  g.lineTo(cx - wBot / 2 + rr, bot); g.quadraticCurveTo(cx - wBot / 2, bot, cx - wBot / 2, bot - rr);
  g.lineTo(cx - wTop / 2, top + rr); g.quadraticCurveTo(cx - wTop / 2, top, cx - wTop / 2 + rr, top); g.closePath();
  const dy = kind === '!' ? y0 + H - r : y0 + r;
  g.moveTo(cx + r, dy); g.arc(cx, dy, r, 0, Math.PI * 2);
}
/** Relleno metálico del tema para una franja vertical [y0, y1] */
export function metalFill(g: CanvasRenderingContext2D, p: LogoPal, y0: number, y1: number) {
  const lg = g.createLinearGradient(0, y0, 0, y1); const t = p.text;
  t.forEach((c, i) => lg.addColorStop(t.length === 1 ? 0 : i / (t.length - 1), c)); return lg;
}
/** Rótulo en DOS líneas: «AHORA» arriba y «CAIGO» abajo, con UN «¡» alto a la izquierda y UN «!» alto a la derecha
 *  que abarcan las dos líneas. Letras gruesas plateadas con relieve (variante de color según el programa). */
export function drawWordmark(g: CanvasRenderingContext2D, cx: number, yTop: number, maxW: number, blockH: number, p: LogoPal) {
  const FONT = (fs: number) => `900 ${fs}px "Arial Black", Arial, Roboto, sans-serif`;
  let cap = blockH / 2.1, fs = cap / 0.72;
  g.save(); g.font = FONT(fs);
  const mA = g.measureText('AHORA').width, mC = g.measureText('CAIGO').width;
  let wordW = Math.max(mA, mC), bw = fs * 0.36, gap = fs * 0.07;
  const total = wordW + 2 * (bw + gap);
  if (total > maxW) { const k = maxW / total; fs *= k; cap *= k; wordW *= k; bw *= k; gap *= k; }
  g.font = FONT(fs); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  const H = cap * 2.1, lines: [string, number][] = [['AHORA', yTop + cap], ['CAIGO', yTop + H]];
  const bangs: ['¡' | '!', number, number][] = [['¡', cx - wordW / 2 - gap - bw / 2, -0.03], ['!', cx + wordW / 2 + gap + bw / 2, 0.09]];
  let li = 0;
  const words = (fill: ((y0: number, y1: number, i: number) => string | CanvasGradient) | null, stroke: string | null, lw: number, dx: number, dy: number) => {
    li = 0;
    for (const [t, base] of lines) {
      const mw = g.measureText(t).width, sx = Math.min(1.12, wordW / mw), w = mw * sx;
      g.save(); g.translate(cx - w / 2 + dx, base + dy); g.scale(sx, 1);
      let x = 0;
      for (const ch of t) {
        const cw = g.measureText(ch).width;
        if (stroke) { g.lineJoin = 'round'; g.lineWidth = lw / sx; g.strokeStyle = stroke; g.strokeText(ch, x, 0); }
        if (fill) { g.fillStyle = fill(-cap, 0, li); g.fillText(ch, x, 0); }
        x += cw; li++;
      }
      g.restore();
    }
    for (const [k, bx, rot] of bangs) {
      g.save(); g.translate(bx + dx, yTop + H / 2 + dy); g.rotate(rot); bangPath(g, k, 0, -H / 2, H, bw);
      if (stroke) { g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); }
      if (fill) { g.fillStyle = fill(-H / 2, H / 2, k === '¡' ? 0 : 99); g.fill(); }
      g.restore();
    }
  };
  // 1) relieve (extrusión hacia abajo a la derecha)
  const depth = Math.max(3, fs * 0.075), step = Math.max(1, depth / 9);
  for (let d = depth; d > 0; d -= step) words(() => p.extrude || '#5d6880', null, 0, d * 0.55, d);
  // 2) contorno oscuro
  words(null, p.stroke, fs * 0.12, 0, 0);
  // 3) cara metálica (o una letra de cada color en Niños/Carnaval)
  words((y0, y1, i) => {
    if (p.perLetter) { const c = p.perLetter[i % p.perLetter.length]; const lg = g.createLinearGradient(0, y0, 0, y1); lg.addColorStop(0, '#ffffff'); lg.addColorStop(0.3, c); lg.addColorStop(1, c); return lg; }
    return metalFill(g, p, y0, y1);
  }, null, 0, 0, 0);
  // 4) brillo del bisel
  words(null, 'rgba(255,255,255,.55)', Math.max(1, fs * 0.018), -fs * 0.006, -fs * 0.01);
  g.restore();
}
export function logoCanvas(w: number, h: number, opts: { circle?: boolean; text?: boolean; variant?: string } = {}) { const c = document.createElement('canvas'); c.width = w; c.height = h; drawLogo(c.getContext('2d')!, w, h, opts); return c; }
