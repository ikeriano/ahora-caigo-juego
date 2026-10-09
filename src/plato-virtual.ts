// Plató virtual (v1.6): anillo de 10 trampillas negras alrededor de una tarima central elevada,
// barandilla metálica, banda de luz LED, gradas blancas a los lados, pantalla vertical al fondo,
// paredes con tubos blancos, pantallas laterales grises y parrilla de techo con focos.
// Tres looks de luz: blanco, morado y morado + cian.
import * as THREE from 'three';
import type { Studio, Hole } from './set3d';
import { TOP, RING_Y, ROWS, TIER_A } from './set3d';
import type { Theme } from './themes';
import { canvasTex, radialTex, numberNameTex } from './tex';
import { cons } from './concursantes';
import { drawWordmark, palFor } from './logo';

export type LookId = 'blanco' | 'morado' | 'cian';
export const LOOKS: { id: LookId; name: string }[] = [{ id: 'blanco', name: 'Blanco' }, { id: 'morado', name: 'Morado' }, { id: 'cian', name: 'Morado y cian' }];

const D = THREE.MathUtils.degToRad;
// medidas (m)
export const V = {
  DAIS_R: 3.0, MOAT_OUT: 3.8, RING_OUT: 6.6, RAIL_R: 6.45, BAND_R0: 6.95, BAND_R1: 7.3, BAND_H: 1.25,
  GR_R0: 7.6, GR_R1: 11.4, WALL_R: 12.4, HOLE_R: 5.2, RUN_Y: 0.25,
  FRONT: D(25), BACK_GAP: D(12), GR_A0: D(21), GR_A1: D(148), BAND_A0: D(22), BAND_A1: D(165),
  STAIR_Z0: -7.4, STAIR_Z1: -9.9, STAIR_W: 1.7, NSTAIR: 8,
  SIDE_BRIDGES: [D(100), D(-100), D(180)],
};
/** ángulos de las 10 trampillas de los oponentes (5 por lado) */
const HOLE_ANGS = [0, 1, 2, 3, 4].map(k => D(40) + (D(158) - D(40)) * k / 4);
const polar = (r: number, a: number, y = 0) => new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);

/** sector de corona extruido (ángulos desde el frente +Z, positivos hacia +X); materiales [tapa, lados] */
function sector(r0: number, r1: number, a0: number, a1: number, y0: number, y1: number, mats: THREE.Material[] | THREE.Material, step = 0.05) {
  const sh = new THREE.Shape(); const N = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step));
  for (let i = 0; i <= N; i++) { const a = a0 + (a1 - a0) * i / N; const x = Math.sin(a) * r1, y = -Math.cos(a) * r1; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  for (let i = N; i >= 0; i--) { const a = a0 + (a1 - a0) * i / N; sh.lineTo(Math.sin(a) * r0, -Math.cos(a) * r0); }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: false, curveSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, mats); m.position.y = y0; return m;
}
function arcCurve(r: number, a0: number, a1: number, y: number, n = 40) { const pts: THREE.Vector3[] = []; for (let i = 0; i <= n; i++) pts.push(polar(r, a0 + (a1 - a0) * i / n, y)); return new THREE.CatmullRomCurve3(pts); }

/** puerta de trampilla: negra con aro rojo-naranja y dos placas (amarillas en la central) */
function trampillaTex(central: boolean) {
  return canvasTex(256, 256, (g, w) => {
    const c = w / 2; g.fillStyle = '#060608'; g.fillRect(0, 0, w, w);
    const ring = central ? '#ffd21a' : '#ff5a3c', plate = central ? '#ffcc12' : '#e2681c', plate2 = central ? '#a88200' : '#8a3208';
    g.strokeStyle = 'rgba(120,120,130,.55)'; g.lineWidth = 3; g.beginPath(); g.arc(c, c, c - 3, 0, 7); g.stroke();
    g.strokeStyle = ring; g.lineWidth = 7; g.beginPath(); g.arc(c, c, c * 0.74, 0, 7); g.stroke();
    g.strokeStyle = central ? 'rgba(255,210,26,.35)' : 'rgba(255,90,60,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(c, c, c * 0.6, 0, 7); g.stroke();
    // junta central de las dos hojas
    g.strokeStyle = 'rgba(90,90,100,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(c, 6); g.lineTo(c, w - 6); g.stroke();
    const s = w * 0.12, gap = w * 0.025;
    for (const dx of [-1, 1]) {
      const x = dx < 0 ? c - gap / 2 - s : c + gap / 2, y = c - s / 2;
      const lg = g.createLinearGradient(x, y, x + s, y + s); lg.addColorStop(0, plate); lg.addColorStop(1, plate2);
      g.fillStyle = lg; g.fillRect(x, y, s, s); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 2; g.strokeRect(x, y, s, s);
    }
  });
}
function marbleTex() {
  return canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#9ea3ad'; g.fillRect(0, 0, w, h);
    let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 900; i++) { const x = r() * w, y = r() * h, rr = 8 + r() * 46; const v = Math.floor(120 + r() * 120); g.fillStyle = `rgba(${v},${v},${v + 6},${0.08 + r() * 0.12})`; g.beginPath(); g.ellipse(x, y, rr * 1.8, rr, r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(70,74,84,${0.15 + r() * 0.2})`; g.lineWidth = 1 + r() * 2; g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.3) * 90; y += (r() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); }
  });
}
function capsuleTex(txt: string) {
  return canvasTex(512, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const rr = (x: number, y: number, ww: number, hh: number, r: number) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); };
    const gold = g.createLinearGradient(0, 0, 0, h); gold.addColorStop(0, '#fff2a0'); gold.addColorStop(0.45, '#f2b318'); gold.addColorStop(1, '#8a5a06');
    rr(6, 10, w - 12, h - 20, (h - 20) / 2); g.fillStyle = gold; g.fill(); g.lineWidth = 6; g.strokeStyle = '#4a2c00'; g.stroke();
    const win = g.createLinearGradient(0, 30, 0, h - 30); win.addColorStop(0, '#ffb43a'); win.addColorStop(0.5, '#e5501a'); win.addColorStop(1, '#a8300c');
    rr(70, 34, w - 140, h - 68, (h - 68) / 2); g.fillStyle = win; g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(60,20,0,.8)'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.35)'; rr(84, 38, w - 168, 16, 8); g.fill();
    g.font = '900 78px "Arial Black", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1a0a00'; g.fillText(txt, w / 2, h / 2 + 4);
  });
}
function louverTex() {
  return canvasTex(128, 256, (g, w, h) => { g.fillStyle = '#0c0d14'; g.fillRect(0, 0, w, h); for (let y = 6; y < h; y += 16) { g.fillStyle = '#2a2d3a'; g.fillRect(0, y, w, 6); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, y, w, 1.5); } });
}

type Tint = { m: THREE.MeshLambertMaterial | THREE.MeshBasicMaterial | THREE.MeshPhongMaterial; c: Record<LookId, number>; e?: number };

export function buildVirtual(st: Studio, th: Theme, mobile: boolean) {
  const R = st.root; const gold = !!(th as any).gold;
  const tints: Tint[] = [];
  const T = (c: Record<LookId, number>, e = 0.0, basic = false, extra: any = {}) => {
    const m = basic ? new THREE.MeshBasicMaterial({ color: 0xffffff, ...extra }) : new THREE.MeshLambertMaterial({ color: 0xffffff, ...extra });
    tints.push({ m, c, e }); return m;
  };
  const L = (c: number, e = 0) => new THREE.MeshLambertMaterial({ color: c, emissive: e });
  const black = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const additive = (c: number, op = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const GOLD = (c: Record<LookId, number>, g: number) => gold ? { blanco: g, morado: g, cian: g } : c;

  // ---------- paleta por look ----------
  // suelos del anillo y de la tarima: sin iluminación (colores exactos del look) con un degradado suave
  const ringGrad = canvasTex(512, 512, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(3.8 / 13, '#ffffff'); gr.addColorStop(5.2 / 13, '#f0f0f0'); gr.addColorStop(6.6 / 13, '#c8c8c8'); gr.addColorStop(1, '#a0a0a0'); g.fillStyle = gr; g.fillRect(0, 0, w, w); }, { srgb: false });
  ringGrad.repeat.set(1 / 26, 1 / 26); ringGrad.offset.set(0.5, 0.5);
  const daisGrad = canvasTex(256, 256, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.75, '#f2f2f2'); gr.addColorStop(1, '#d6d6d6'); g.fillStyle = gr; g.fillRect(0, 0, w, w); }, { srgb: false });
  const ringTop = T(GOLD({ blanco: 0xe6e7ee, morado: 0x8a6cff, cian: 0xd448f0 }, 0xffb84a), 0, true, { map: ringGrad, toneMapped: false });
  const daisTop = T(GOLD({ blanco: 0xf4f5fa, morado: 0x8e7cff, cian: 0xf6e4ff }, 0xffe6a8), 0, true, { map: daisGrad, toneMapped: false });
  const darkSide = L(0x050508);
  const stairM = T(GOLD({ blanco: 0xf4f4f8, morado: 0xc4b8ff, cian: 0xf0e0ff }, 0xfff0c8), 0.35);
  const bandM = T(GOLD({ blanco: 0xe8e8f6, morado: 0xf040ff, cian: 0xff30d8 }, 0xffb21a), 0, true, { toneMapped: false });
  const bandTop = T(GOLD({ blanco: 0xffffff, morado: 0xffa0ff, cian: 0xffa8f0 }, 0xffe08a), 0, true, { toneMapped: false });
  const grTop = T({ blanco: 0xdfe2ea, morado: 0x5a4cc8, cian: 0x8a48d0 }, 0.25);
  const grSide = T({ blanco: 0x2a3042, morado: 0x1c1640, cian: 0x24123e }, 0.2);
  const wallM = T({ blanco: 0x0d1430, morado: 0x0b0a24, cian: 0x0a0a26 }, 0.3, false, { side: THREE.BackSide });
  const backWallM = T({ blanco: 0x0b1028, morado: 0x09081e, cian: 0x080822 }, 0.3);
  const tubeM = T({ blanco: 0xeef1f8, morado: 0xc8c0f0, cian: 0xd8d4f4 }, 0.35);
  const barM = T({ blanco: 0x9aa4c0, morado: 0x3048d8, cian: 0x10f0ff }, 0, true, { toneMapped: false });
  const hexM = T({ blanco: 0xb4bac8, morado: 0x4446b0, cian: 0x10eeff }, 0, true, { toneMapped: false });
  const screenSideM = T({ blanco: 0xc9ccd4, morado: 0xa89cd8, cian: 0xc8c4dc }, 0, true, { map: marbleTex() });
  const shelfLed = T({ blanco: 0x3a6cff, morado: 0x3a50ff, cian: 0x20e8ff }, 0, true);
  const trussM = T({ blanco: 0xb8bfcc, morado: 0x6a6a90, cian: 0x8a8ab0 }, 0.25);

  // ---------- suelo general ----------
  const floor = new THREE.Mesh(new THREE.CircleGeometry(26, 64), new THREE.MeshPhongMaterial({ color: 0x0a0b14, specular: 0x222233, shininess: 40 }));
  floor.rotation.x = -Math.PI / 2; R.add(floor);
  const voidRing = (r0: number, r1: number) => { const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 96), black); m.rotation.x = -Math.PI / 2; m.position.y = 0.004; R.add(m); };
  voidRing(V.DAIS_R - 0.02, V.MOAT_OUT + 0.02); voidRing(V.RING_OUT - 0.02, V.BAND_R0 + 0.02);

  // ---------- tarima central ----------
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(V.DAIS_R, V.DAIS_R, TOP, 72), [darkSide, daisTop, darkSide]);
  dais.position.y = TOP / 2; R.add(dais);
  const daisRim = new THREE.Mesh(new THREE.TorusGeometry(V.DAIS_R - 0.03, 0.035, 6, 96), new THREE.MeshBasicMaterial({ color: 0xffffff })); daisRim.rotation.x = Math.PI / 2; daisRim.position.y = TOP; R.add(daisRim);

  // ---------- anillo de los oponentes (dos lados unidos por detrás) ----------
  for (const s of [-1, 1]) {
    const a0 = s > 0 ? V.FRONT : -Math.PI, a1 = s > 0 ? Math.PI : -V.FRONT;
    R.add(sector(V.MOAT_OUT, V.RING_OUT, a0, a1, 0, RING_Y, [ringTop, darkSide], 0.04));
  }
  const ringEdge = new THREE.Mesh(new THREE.TorusGeometry(V.RING_OUT - 0.02, 0.02, 4, 120), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })); ringEdge.rotation.x = Math.PI / 2; ringEdge.position.y = RING_Y + 0.005; R.add(ringEdge);

  // ---------- pasarela frontal negra + escalera blanca a la tarima ----------
  R.add(sector(V.DAIS_R - 0.3, V.BAND_R1 - 0.3, -V.FRONT, V.FRONT, 0, V.RUN_Y, [new THREE.MeshBasicMaterial({ color: 0x07070b }), darkSide]));
  const stepEdge = additive(0xffffff, 0.8);
  for (let k = 0; k < 3; k++) {
    const top = TOP - (k + 1) * (TOP - V.RUN_Y) / 4; const z0 = k ? V.DAIS_R + k * 0.32 : 2.6, z1 = V.DAIS_R + (k + 1) * 0.32;
    const b = new THREE.Mesh(new THREE.BoxGeometry(2.0, top - V.RUN_Y, z1 - z0), stairM); b.position.set(0, V.RUN_Y + (top - V.RUN_Y) / 2, (z0 + z1) / 2); R.add(b);
    const e = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.025), stepEdge); e.position.set(0, top - 0.015, z1 + 0.003); R.add(e);
  }
  // escalones laterales y trasero entre la tarima y el anillo
  for (const a of V.SIDE_BRIDGES) {
    for (const [r0, r1, top] of [[2.75, 3.4, TOP - 0.2], [3.4, 3.82, TOP - 0.4]] as const) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.3, top, r1 - r0), stairM); b.position.copy(polar((r0 + r1) / 2, a, top / 2)); b.rotation.y = a; R.add(b);
    }
  }

  // ---------- barandilla metálica ----------
  const metal = new THREE.MeshPhongMaterial({ color: 0xaab2c0, specular: 0xffffff, shininess: 90, emissive: 0x15161c });
  const railTop = RING_Y + 1.0, railMid = RING_Y + 0.55;
  for (const s of [-1, 1]) {
    const a0 = s * (V.FRONT + D(0.6)), a1 = s * (Math.PI - V.BACK_GAP);
    for (const y of [railTop, railMid]) R.add(new THREE.Mesh(new THREE.TubeGeometry(arcCurve(V.RAIL_R, a0, a1, y, 60), 80, y === railTop ? 0.03 : 0.018, 5), metal));
    const n = Math.round(Math.abs(a1 - a0) / D(9));
    for (let k = 0; k <= n; k++) { const p = polar(V.RAIL_R, a0 + (a1 - a0) * k / n, RING_Y + 0.5); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.0, 5), metal); post.position.copy(p); R.add(post); }
    // barandilla radial junto a la pasarela
    const ar = s * (V.FRONT + D(0.6));
    for (const y of [railTop, railMid]) { const c = new THREE.LineCurve3(polar(V.MOAT_OUT + 0.08, ar, y), polar(V.RAIL_R, ar, y)); R.add(new THREE.Mesh(new THREE.TubeGeometry(c, 4, y === railTop ? 0.03 : 0.018, 5), metal)); }
    for (const r of [V.MOAT_OUT + 0.08, (V.MOAT_OUT + V.RAIL_R) / 2]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.0, 5), metal); post.position.copy(polar(r, ar, RING_Y + 0.5)); R.add(post); }
  }

  // ---------- trampillas ----------
  const texO = trampillaTex(false), texC = trampillaTex(true);
  st.holes.push(makeHoleV(st, new THREE.Vector3(0, TOP, 0), 0.75, texC, th));
  const pos: THREE.Vector3[] = [];
  for (let k = 0; k < 5; k++) pos.push(polar(V.HOLE_R, -HOLE_ANGS[k], RING_Y));
  for (let k = 4; k >= 0; k--) pos.push(polar(V.HOLE_R, HOLE_ANGS[k], RING_Y));
  const poleM = new THREE.MeshPhongMaterial({ color: 0xc8ced8, specular: 0xffffff, shininess: 80 });
  const redRing = new THREE.MeshBasicMaterial({ color: 0xff2a3a });
  pos.forEach((p, i) => {
    const h = makeHoleV(st, p, 0.62, texO, th);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: numberNameTex(String(i + 1), cons.rival(i + 1)), depthWrite: false, transparent: true }));
    spr.scale.set(1.0, 0.78, 1); spr.center.set(0.5, 0.68); spr.position.set(p.x, p.y + 2.25, p.z); R.add(spr); h.label = spr;
    // poste con aro rojo (detrás de la trampilla, hacia la barandilla)
    const out = new THREE.Vector3(p.x, 0, p.z).normalize(); const pp = p.clone().addScaledVector(out, 0.86);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.0, 5), poleM); pole.position.set(pp.x, RING_Y + 0.5, pp.z); R.add(pole);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 6, 20), redRing); ring.position.set(pp.x, RING_Y + 1.08, pp.z); ring.lookAt(0, RING_Y + 1.08, 0); R.add(ring);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.085, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })); disc.position.copy(ring.position); disc.quaternion.copy(ring.quaternion); R.add(disc);
    st.holes.push(h);
  });

  // ---------- banda de luz LED (parapeto exterior facetado) ----------
  for (const s of [-1, 1]) {
    const a0 = s > 0 ? V.BAND_A0 : -V.BAND_A1, a1 = s > 0 ? V.BAND_A1 : -V.BAND_A0;
    R.add(sector(V.BAND_R0, V.BAND_R1, a0, a1, 0, V.BAND_H, [bandTop, bandM], D(7.5)));
  }

  // ---------- gradas blancas escalonadas ----------
  const steps: [number, number, number][] = [[V.GR_R0, 0, 0.6], [V.GR_R0 + 0.35, 0.6, ROWS[0].y]];
  for (let i = 1; i < ROWS.length; i++) steps.push([ROWS[i].r - 0.35, ROWS[i - 1].y, ROWS[i].y]);
  for (const s of [-1, 1]) {
    const a0 = s > 0 ? TIER_A[0] - D(1) : -(TIER_A[1] + D(2)), a1 = s > 0 ? TIER_A[1] + D(2) : -(TIER_A[0] - D(1));
    for (const [r0, y0, y1] of steps) R.add(sector(r0, V.GR_R1, a0, a1, y0, y1, [grTop, grSide], 0.04));
    // borde luminoso de cada escalón
    for (const [r0, , y1] of steps) R.add(new THREE.Mesh(new THREE.TubeGeometry(arcCurve(r0 + 0.01, a0, a1, y1 + 0.005, 50), 60, 0.012, 3), additive(0xffffff, 0.45)));
  }

  // ---------- paredes ----------
  for (const s of [-1, 1]) {
    const a0 = D(14), span = D(136);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(V.WALL_R, V.WALL_R, 10.5, 48, 1, true, 0, span), wallM);
    w.position.y = 5.25; w.rotation.y = s > 0 ? a0 : -(a0 + span); R.add(w);
    // pantallas laterales grises
    const scr = new THREE.Mesh(new THREE.CylinderGeometry(V.WALL_R - 0.08, V.WALL_R - 0.08, 2.3, 32, 1, true, 0, D(92)), screenSideM);
    (scr.material as THREE.Material).side = THREE.BackSide; scr.position.y = 3.85; scr.rotation.y = s > 0 ? D(38) : -D(130); R.add(scr);
    const frame = new THREE.Mesh(new THREE.CylinderGeometry(V.WALL_R - 0.04, V.WALL_R - 0.04, 2.5, 32, 1, true, 0, D(93)), L(0x14161e)); (frame.material as THREE.Material).side = THREE.BackSide;
    frame.position.y = 3.85; frame.rotation.y = s > 0 ? D(37.5) : -D(130.5); R.add(frame);
    // barras horizontales (cian en el look morado+cian)
    for (const y of [5.6, 6.5, 8.3]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(V.WALL_R - 0.15, V.WALL_R - 0.15, y === 8.3 ? 0.16 : 0.1, 48, 1, true, 0, span), barM); (b.material as THREE.Material).side = THREE.DoubleSide; b.position.y = y; b.rotation.y = w.rotation.y; R.add(b); }
  }
  // pared del fondo (plana) con tubos blancos curvos
  const bw = new THREE.Mesh(new THREE.PlaneGeometry(12.8, 10.5), backWallM); bw.position.set(0, 5.25, -10.75); R.add(bw);
  for (const s of [-1, 1]) {
    for (const [ri, y] of [3.3, 4.5, 5.7].entries()) {
      let x = 2.55; let k = ri;
      while (x < 6.0) {
        const len = 0.55 + ((k * 37) % 5) * 0.18; const cshape = (k % 3) === 1;
        const g = cshape ? new THREE.CylinderGeometry(0.34, 0.34, 0.5, 16, 1, true, Math.PI * 0.15, Math.PI * 1.3) : new THREE.CylinderGeometry(0.26, 0.26, len, 14);
        const m = new THREE.Mesh(g, tubeM); (tubeM as any).side = THREE.DoubleSide;
        m.rotation.z = Math.PI / 2; if (cshape) m.rotation.x = Math.PI / 2;
        const L2 = cshape ? 0.5 : len; m.position.set(s * (x + L2 / 2), y + (cshape ? 0.05 : 0), -10.45 + (k % 2) * 0.12); R.add(m);
        x += L2 + 0.12 + ((k * 13) % 3) * 0.1; k++;
      }
      const led = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.04, 0.05), shelfLed); led.position.set(s * 4.3, y - 0.42, -10.5); R.add(led);
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.06, 0.5), L(0x1a1c26)); shelf.position.set(s * 4.3, y - 0.36, -10.5); R.add(shelf);
    }
  }

  // ---------- pantalla vertical del fondo ----------
  const SZ = -10.1, SW = 3.8, SH = 5.4, SY = 5.3;
  const tower = new THREE.Mesh(new THREE.BoxGeometry(SW + 0.5, SH + 0.5, 0.5), L(0x0b0d18, 0x020308)); tower.position.set(0, SY, SZ - 0.3); R.add(tower);
  const scrBg = canvasTex(256, 384, (g, w, h) => { const bg = g.createLinearGradient(0, 0, 0, h); const a = th.id === 'normal' ? '#1830c8' : th.wallA, b = th.id === 'normal' ? '#2f4cf0' : th.wallB; bg.addColorStop(0, a); bg.addColorStop(0.5, b); bg.addColorStop(1, a); g.fillStyle = bg; g.fillRect(0, 0, w, h); const rg = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, h * 0.7); rg.addColorStop(0, 'rgba(255,255,255,.12)'); rg.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = rg; g.fillRect(0, 0, w, h); });
  const scrBack = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: scrBg })); scrBack.position.set(0, SY, SZ); R.add(scrBack);
  const edgeM = new THREE.MeshBasicMaterial({ color: 0x2f62ff, toneMapped: false });
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.16, SH + 0.6, 0.12), edgeM); e.position.set(sx * (SW / 2 + 0.22), SY, SZ + 0.02); R.add(e); }
  { const e = new THREE.Mesh(new THREE.BoxGeometry(SW + 0.6, 0.16, 0.12), edgeM); e.position.set(0, SY + SH / 2 + 0.25, SZ + 0.02); R.add(e); }
  // logo (zona central: es la que cambian las tarjetas de prueba)
  const lcv = document.createElement('canvas'); lcv.width = 640; lcv.height = 430;
  { const g = lcv.getContext('2d')!; g.drawImage(scrBg.image as HTMLCanvasElement, 0, 120, 256, 172, 0, 0, 640, 430); drawWordmark(g, 320, 60, 600, 310, palFor(th.id)); }
  const logoTex = new THREE.CanvasTexture(lcv); logoTex.colorSpace = THREE.SRGBColorSpace;
  const scrMat = new THREE.MeshBasicMaterial({ map: logoTex }); st.screenMats.push(scrMat);
  const LW = SW, LH = SW * 430 / 640;
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(LW, LH), scrMat); logo.position.set(0, SY - 0.05, SZ + 0.01); R.add(logo);
  const cap0 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.75), new THREE.MeshBasicMaterial({ map: capsuleTex('0'), transparent: true })); cap0.position.set(0, SY + SH / 2 - 0.62, SZ + 0.02); R.add(cap0);
  const cap30 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.47), new THREE.MeshBasicMaterial({ map: capsuleTex('30'), transparent: true })); cap30.position.set(0, SY - SH / 2 + 0.5, SZ + 0.02); R.add(cap30);
  st.screenFocus = new THREE.Vector3(0, SY - 0.05, SZ);

  // ---------- escaleras bajo la pantalla + bloques con lamas ----------
  const sd = (V.STAIR_Z0 - V.STAIR_Z1) / V.NSTAIR, sh = (SY - SH / 2 - 0.25 - RING_Y) / V.NSTAIR;
  const stairDark = L(0x15161f, 0x040408);
  const ledCols = [0xff38e0, 0x18e8ff];
  { const b = new THREE.Mesh(new THREE.BoxGeometry(V.STAIR_W * 2, RING_Y, -V.STAIR_Z0 - 6.3), stairDark); b.position.set(0, RING_Y / 2, (V.STAIR_Z0 - 6.3) / 2); R.add(b); }
  for (let k = 0; k < V.NSTAIR; k++) {
    const top = RING_Y + (k + 1) * sh, z0 = V.STAIR_Z0 - k * sd;
    const b = new THREE.Mesh(new THREE.BoxGeometry(V.STAIR_W * 2, top, sd + 0.02), stairDark); b.position.set(0, top / 2, z0 - sd / 2); R.add(b);
    const e = new THREE.Mesh(new THREE.PlaneGeometry(V.STAIR_W * 2, 0.03), new THREE.MeshBasicMaterial({ color: k >= V.NSTAIR - 3 ? ledCols[k % 2] : 0xffffff, transparent: true, opacity: 0.85 })); e.position.set(0, top - 0.02, z0 + 0.012); R.add(e);
  }
  const louv = louverTex(); louv.wrapS = louv.wrapT = THREE.RepeatWrapping; louv.repeat.set(2, 3);
  for (const s of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.7, 3.2), [L(0x0c0d14), L(0x0c0d14), L(0x1a1c26), L(0x0c0d14), new THREE.MeshLambertMaterial({ map: louv, emissive: 0x111118 }), L(0x0c0d14)]);
    b.position.set(s * (V.STAIR_W + 0.85), 1.35, -8.9); R.add(b);
  }

  // ---------- techo: parrilla, aros de focos, hexágonos cian ----------
  const gridY = 9.9;
  for (let k = -7; k <= 7; k++) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(24, 0.1, 0.1), trussM); a.position.set(0, gridY, k * 1.6); R.add(a);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 24), trussM); b.position.set(k * 1.6, gridY, 0); R.add(b);
  }
  const ceil = new THREE.Mesh(new THREE.CircleGeometry(16, 32), new THREE.MeshBasicMaterial({ color: 0x05060c })); ceil.rotation.x = Math.PI / 2; ceil.position.y = gridY + 0.4; R.add(ceil);
  for (const [r, y, t] of [[10.2, 8.45, 0.16], [10.2, 8.95, 0.09], [6.4, 9.2, 0.12]] as const) { const tr = new THREE.Mesh(new THREE.TorusGeometry(r, t, 4, 64), trussM); tr.rotation.x = Math.PI / 2; tr.position.y = y; R.add(tr); }
  const hexTruss = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.1, 4, 6), trussM); hexTruss.rotation.x = Math.PI / 2; hexTruss.position.y = 7.25; R.add(hexTruss);
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const c = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, gridY - 7.25, 4), trussM); c.position.set(Math.cos(a) * 3.2, (gridY + 7.25) / 2, Math.sin(a) * 3.2); R.add(c); }
  // focos de colores en el aro (verde, magenta, cian, rojo)
  const lampCols = [0x2bff5a, 0xff2bd8, 0x22e8ff, 0xff3030, 0xffffff];
  const glowT = radialTex([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,.6)'], [1, 'rgba(255,255,255,0)']], 64);
  const lampBody = L(0x1a1b22);
  for (let k = 0; k < 28; k++) {
    const a = (k + 0.25) / 28 * Math.PI * 2; const p = polar(10.2, a, 8.2);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.3, 8), lampBody); body.position.copy(p); R.add(body);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: lampCols[k % lampCols.length], blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); sp.position.set(p.x, p.y - 0.18, p.z); sp.scale.setScalar(0.55); R.add(sp);
  }
  // hexágonos alargados
  const hexShape = new THREE.Shape(); const HW = 2.2, HH = 0.62; [[-HW, 0], [-HW + 0.6, HH], [HW - 0.6, HH], [HW, 0], [HW - 0.6, -HH], [-HW + 0.6, -HH]].forEach(([x, y], i) => i ? hexShape.lineTo(x, y) : hexShape.moveTo(x, y));
  const hexGeo = new THREE.ExtrudeGeometry(hexShape, { depth: 0.18, bevelEnabled: false }); hexGeo.rotateX(-Math.PI / 2);
  for (const [x, z, ry] of [[-4.6, -7.6, 0.35], [4.6, -7.6, -0.35], [-8.3, -2.4, 1.2], [8.3, -2.4, -1.2], [-7.6, 4.2, 2.0], [7.6, 4.2, -2.0]] as const) {
    const m = new THREE.Mesh(hexGeo, hexM); m.position.set(x, 7.9, z); m.rotation.y = ry; R.add(m);
    const e = new THREE.Mesh(new THREE.EdgesGeometry(hexGeo), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })); e.position.copy(m.position); e.rotation.copy(m.rotation); R.add(e);
  }
  // columnas cian a los lados de la pantalla
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.2, 0.22), barM); c.position.set(s * 2.75, 6.1, -10.0); R.add(c); }
  { const c = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.18, 0.18), barM); c.position.set(0, 8.3, -10.6); R.add(c); }

  // ---------- luces ----------
  const hemi = new THREE.HemisphereLight(0xdfe6ff, 0x141020, 1.2); R.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(3, 10, 9); R.add(key);
  const p1 = new THREE.PointLight(0xffffff, 18, 16, 1.6); p1.position.set(0, 5.5, 0); R.add(p1);
  st.lights.push(hemi, key, p1);

  const LIGHTS: Record<LookId, { hemi: number; hi: number; key: number; p: number; pi: number }> = gold
    ? { blanco: { hemi: 0xffe6b0, hi: 1.2, key: 0xffffff, p: 0xffb21a, pi: 16 }, morado: { hemi: 0xffd890, hi: 1.1, key: 0xfff0d0, p: 0xffa020, pi: 18 }, cian: { hemi: 0xffd890, hi: 1.1, key: 0xfff0d0, p: 0xffa020, pi: 18 } }
    : { blanco: { hemi: 0xe4eaff, hi: 1.0, key: 0xffffff, p: 0xffffff, pi: 10 }, morado: { hemi: 0x9a84ff, hi: 0.9, key: 0xc8b8ff, p: 0x8a5cff, pi: 14 }, cian: { hemi: 0xd080ff, hi: 0.9, key: 0xf0d0ff, p: 0xe040ff, pi: 14 } };
  st.setLook = (l: LookId) => {
    st.look = l;
    for (const t of tints) {
      const c = t.c[l]; t.m.color.setHex(c);
      if ('emissive' in t.m && t.e) (t.m as THREE.MeshLambertMaterial).emissive.setHex(c).multiplyScalar(t.e);
    }
    const P = LIGHTS[l]; hemi.color.setHex(P.hemi); hemi.intensity = P.hi; key.color.setHex(P.key); p1.color.setHex(P.p); p1.intensity = P.pi;
  };
  st.setLook(st.look);
  void mobile;
}

function makeHoleV(st: Studio, p: THREE.Vector3, r: number, tex: THREE.Texture, th: Theme): Hole {
  const g = new THREE.Group(); g.position.copy(p); st.root.add(g);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.22, r * 1.26, 0.05, 40), new THREE.MeshLambertMaterial({ color: 0x0a0a0e, emissive: 0x050507 })); rim.position.y = 0.0; g.add(rim);
  const rimEdge = new THREE.Mesh(new THREE.RingGeometry(r * 1.17, r * 1.22, 48), new THREE.MeshBasicMaterial({ color: 0x3a3a46 })); rimEdge.rotation.x = -Math.PI / 2; rimEdge.position.y = 0.027; g.add(rimEdge);
  const blackM = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshBasicMaterial({ color: 0x000000 })); blackM.rotation.x = -Math.PI / 2; blackM.position.y = 0.028; g.add(blackM);
  const innerGlow = new THREE.Mesh(new THREE.RingGeometry(r * 0.75, r, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 1, map: radialTex([[0, '#000'], [0.75, '#000'], [0.9, '#ff5a10'], [1, '#000']]) }));
  innerGlow.rotation.x = -Math.PI / 2; innerGlow.position.y = 0.029; g.add(innerGlow);
  const doorMat = new THREE.MeshBasicMaterial({ map: tex, color: 0xffffff });
  const mkDoor = (s: number) => {
    const pivot = new THREE.Group(); pivot.position.set(s * r, 0.034, 0); g.add(pivot);
    const half = new THREE.Mesh(new THREE.CircleGeometry(r, 24, s > 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI), doorMat);
    half.rotation.x = -Math.PI / 2; half.position.x = -s * r; pivot.add(half); return pivot;
  };
  const doorA = mkDoor(-1), doorB = mkDoor(1);
  const activeMat = new THREE.MeshBasicMaterial({ color: th.glow, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(r * 1.0, r * 1.07, 40), activeMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.036; g.add(ring);
  const halo = new THREE.Mesh(new THREE.RingGeometry(r * 1.22, r * 1.6, 40), new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(255,255,255,0)'], [0.68, 'rgba(255,255,255,0)'], [0.72, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']]), color: th.glow, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  (halo.material as THREE.MeshBasicMaterial).opacity = 0.15; halo.rotation.x = -Math.PI / 2; halo.position.y = 0.03; g.add(halo);
  return { pos: p.clone(), r, doorA, doorB, ring, halo, open: 0, target: 0, activeMat };
}

/** Altura del suelo del plató virtual en (x,z) o null si no se puede pasar */
export function heightAtVirtual(x: number, z: number): number | null {
  const r = Math.hypot(x, z), a = Math.abs(Math.atan2(x, z));
  if (r > 11.5) return null;
  if (r < V.DAIS_R - 0.05) return TOP;
  // escalera frontal (tarima -> pasarela)
  if (z > 0 && Math.abs(x) < 1.0 && z < V.DAIS_R + 0.96) { const k = Math.min(2, Math.max(0, Math.floor((z - V.DAIS_R) / 0.32))); return TOP - (k + 1) * (TOP - V.RUN_Y) / 4; }
  // pasarela frontal negra
  if (a < V.FRONT - D(0.8) && r < V.BAND_R1 - 0.3) return r < V.DAIS_R + 0.05 ? null : V.RUN_Y;
  if (a < V.FRONT + D(1.4) && r >= V.DAIS_R && r < V.RAIL_R + 0.1) return null; // barandilla radial
  // foso: solo por los escalones laterales y trasero
  if (r < V.MOAT_OUT) {
    for (const ba of V.SIDE_BRIDGES) { let d = Math.atan2(x, z) - ba; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d * r) < 0.6) return r < 3.4 ? TOP - 0.2 : TOP - 0.4; }
    return null;
  }
  // anillo de los oponentes
  if (r < V.RAIL_R - 0.08) return RING_Y;
  // salida trasera hacia la escalera de la pantalla
  if (a > Math.PI - V.BACK_GAP - D(1) && Math.abs(x) < V.STAIR_W - 0.1) {
    if (z > V.STAIR_Z0) return RING_Y;
    if (z > V.STAIR_Z1) { const k = Math.min(V.NSTAIR - 1, Math.floor((V.STAIR_Z0 - z) / ((V.STAIR_Z0 - V.STAIR_Z1) / V.NSTAIR))); return RING_Y + (k + 1) * (5.3 - 2.7 - 0.25 - RING_Y) / V.NSTAIR; }
    return null;
  }
  // pasillo frontal del público
  if (a < V.GR_A0 - D(1) && r >= V.BAND_R1 - 0.3) return 0;
  return null;
}
