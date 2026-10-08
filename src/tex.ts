import * as THREE from 'three';

export function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, opts: { repeat?: [number, number]; srgb?: boolean } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d')!; draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (opts.srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opts.repeat[0], opts.repeat[1]); }
  return t;
}

/** Paneles azules con flechas amarillas/naranjas (">>>"), como los frontales y paredes del plató */
export function chevronTex(count = 3, bigPanel = false, col = { wallA: '#0b2fa8', wallB: '#1b52e6', chevA: '#ffd23a', chevB: '#f39a12' }) {
  return canvasTex(512, 256, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, col.wallA); bg.addColorStop(0.5, col.wallB); bg.addColorStop(1, col.wallA);
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    // brillo diagonal
    const sh = g.createLinearGradient(0, 0, w, h);
    sh.addColorStop(0, 'rgba(255,255,255,0.10)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,0.08)');
    g.fillStyle = sh; g.fillRect(0, 0, w, h);
    const cw = w / count;
    for (let i = 0; i < count; i++) {
      const x0 = i * cw + cw * 0.18, th = cw * (bigPanel ? 0.30 : 0.26), tip = cw * 0.42;
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, col.chevA); gr.addColorStop(1, col.chevB);
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(x0, h * 0.06); g.lineTo(x0 + th, h * 0.06); g.lineTo(x0 + th + tip, h * 0.5);
      g.lineTo(x0 + th, h * 0.94); g.lineTo(x0, h * 0.94); g.lineTo(x0 + tip, h * 0.5); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(120,60,0,0.35)'; g.lineWidth = 3; g.stroke();
    }
    // juntas de paneles
    g.fillStyle = 'rgba(0,0,30,0.55)';
    for (let i = 0; i <= count; i++) g.fillRect(i * cw - 2, 0, 4, h);
    g.fillStyle = 'rgba(120,200,255,0.9)'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4);
  }, { repeat: [1, 1] });
}

/** Trampilla: disco oscuro con dos huellas naranjas */
export function huellaTex(active = false) {
  return canvasTex(256, 256, (g, w) => {
    const r = w / 2;
    const bg = g.createRadialGradient(r, r, 10, r, r, r);
    bg.addColorStop(0, active ? '#3a1408' : '#121a33'); bg.addColorStop(0.8, active ? '#1a0804' : '#070b18'); bg.addColorStop(1, '#000');
    g.fillStyle = bg; g.beginPath(); g.arc(r, r, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = active ? '#ff5a1a' : '#f0a020'; g.lineWidth = 5; g.beginPath(); g.arc(r, r, r * 0.78, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(255,170,40,0.35)'; g.lineWidth = 2; g.beginPath(); g.arc(r, r, r * 0.88, 0, Math.PI * 2); g.stroke();
    drawFootprints(g, r, r, r * 0.95, active ? '#ff7a2a' : '#f7b52a');
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(r - 2, 0, 4, w); // junta de las dos puertas
  });
}

export function drawFootprints(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  g.save(); g.fillStyle = color; g.shadowColor = color; g.shadowBlur = s * 0.08;
  for (const dx of [-0.2, 0.2]) {
    const x = cx + dx * s;
    g.beginPath(); g.ellipse(x, cy - s * 0.12, s * 0.12, s * 0.22, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(x, cy + s * 0.27, s * 0.095, s * 0.11, 0, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

export function radialTex(stops: [number, string][], size = 256) {
  return canvasTex(size, size, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    for (const [o, c] of stops) gr.addColorStop(o, c);
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}

export function vertFadeTex() {
  return canvasTex(8, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.15, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
}

export function numberTex(n: string, color = '#f7b52a') {
  return canvasTex(128, 128, (g, w) => {
    g.fillStyle = 'rgba(5,10,30,0.85)'; g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill();
    g.strokeStyle = color; g.lineWidth = 8; g.stroke();
    g.fillStyle = '#fff'; g.font = '900 64px Arial, Roboto, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(n, 64, 68);
  });
}
