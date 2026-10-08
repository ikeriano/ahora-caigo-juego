import { drawFootprints } from './tex';
/** Logotipo dibujado (círculo con huellas + "¡AHORA CAIGO!") para cabecera, final e icono */
export function drawLogo(g: CanvasRenderingContext2D, w: number, h: number, opts: { circle?: boolean; text?: boolean } = {}) {
  const cx = w / 2, cy = h * 0.36, R = Math.min(w, h) * 0.26;
  if (opts.circle !== false) {
    g.save();
    g.fillStyle = '#0a2a9a'; g.beginPath(); g.arc(cx, cy, R * 1.12, 0, 7); g.fill();
    const gr = g.createRadialGradient(cx, cy - R * 0.3, R * 0.1, cx, cy, R);
    gr.addColorStop(0, '#3a3f4a'); gr.addColorStop(1, '#14161c'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    g.lineWidth = R * 0.09; g.strokeStyle = '#f07a12'; g.shadowColor = '#ff8a1a'; g.shadowBlur = R * 0.2; g.beginPath(); g.arc(cx, cy, R * 0.94, 0, 7); g.stroke();
    g.shadowBlur = 0; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(cx - 2, cy - R, 4, R * 2);
    drawFootprints(g, cx, cy - R * 0.05, R * 1.6, '#ffc21a');
    g.restore();
  }
  if (opts.text !== false) {
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    const fs = Math.min(w * 0.2, h * 0.24);
    g.font = `900 ${fs}px "Arial Black", Arial, Roboto, sans-serif`;
    for (const [t, y] of [['¡AHORA', h * 0.62], ['¡CAIGO!', h * 0.84]] as const) {
      g.lineJoin = 'round'; g.lineWidth = fs * 0.16; g.strokeStyle = '#0a1a5a'; g.strokeText(t, cx, y);
      const lg = g.createLinearGradient(0, y - fs / 2, 0, y + fs / 2); lg.addColorStop(0, '#ffffff'); lg.addColorStop(0.55, '#e4e9f2'); lg.addColorStop(1, '#9aa6ba');
      g.fillStyle = lg; g.fillText(t, cx, y);
    }
    g.restore();
  }
}
export function logoCanvas(w: number, h: number, opts = {}) { const c = document.createElement('canvas'); c.width = w; c.height = h; drawLogo(c.getContext('2d')!, w, h, opts); return c; }
