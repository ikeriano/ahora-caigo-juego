import * as THREE from 'three';
import { tierSpots, type Studio } from './set3d';
import type { Theme } from './themes';
import { canvasTex, vertFadeTex } from './tex';

const L = (c: number, e = 0) => new THREE.MeshLambertMaterial({ color: c, emissive: e });
const polar = (r: number, a: number, y = 0) => new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
const D = THREE.MathUtils.degToRad;

/** Partículas que caen (nieve / confeti) */
export function particles(st: Studio, n: number, colors: number[], size: number, speed: number, spin = true) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 22; pos[i * 3 + 1] = Math.random() * 9; pos[i * 3 + 2] = (Math.random() - 0.5) * 22;
    c.setHex(colors[i % colors.length]); col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const tex = canvasTex(32, 32, (g) => { if (spin) { g.fillStyle = '#fff'; g.fillRect(6, 10, 20, 12); } else { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); } });
  const mat = new THREE.PointsMaterial({ size, map: tex, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true });
  const pts = new THREE.Points(geo, mat); st.root.add(pts);
  st.anim.push((dt, t) => {
    const a = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < n; i++) {
      let y = a.getY(i) - dt * speed * (0.6 + (i % 7) / 10);
      if (y < 0) y += 9;
      a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t + i) * dt * 0.15);
    }
    a.needsUpdate = true;
  });
  return pts;
}

/** Ráfaga de confeti (para Prime Time y celebraciones) */
export function confettiBurst(st: Studio, at: THREE.Vector3, colors = [0xffd23a, 0x39c8ff, 0xffffff, 0xff4fd8]) {
  const n = 160; const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), vel: THREE.Vector3[] = [], col = new Float32Array(n * 3); const c = new THREE.Color();
  for (let i = 0; i < n; i++) { pos.set([at.x, at.y, at.z], i * 3); vel.push(new THREE.Vector3((Math.random() - 0.5) * 6, 4 + Math.random() * 6, (Math.random() - 0.5) * 6)); c.setHex(colors[i % colors.length]); col.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, depthWrite: false }));
  st.root.add(pts); let life = 0;
  const f = (dt: number) => {
    life += dt; const a = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < n; i++) { const v = vel[i]; v.y -= 6 * dt; v.multiplyScalar(0.985); a.setXYZ(i, a.getX(i) + v.x * dt, Math.max(0.02, a.getY(i) + v.y * dt), a.getZ(i) + v.z * dt); }
    a.needsUpdate = true; (pts.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - life / 4);
    if (life > 4) { st.root.remove(pts); geo.dispose(); st.anim.splice(st.anim.indexOf(f), 1); }
  };
  st.anim.push(f);
}

function pumpkin(s = 1) {
  const g = new THREE.Group();
  const m = L(0xff7a12, 0x3a1400);
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.28 * s, 10, 8), m); b.scale.set(0.55, 0.8, 1); b.rotation.y = i / 6 * Math.PI; g.add(b); }
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * s, 0.05 * s, 0.14 * s, 6), L(0x2a5a12)); st.position.y = 0.26 * s; g.add(st);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.2 * s, 3), new THREE.MeshBasicMaterial({ color: 0xffd060 })); face.position.set(0, 0.02 * s, 0.285 * s); face.scale.set(1, 0.35, 1); g.add(face);
  for (const x of [-0.09, 0.09]) { const e = new THREE.Mesh(new THREE.CircleGeometry(0.05 * s, 3), new THREE.MeshBasicMaterial({ color: 0xffd060 })); e.position.set(x * s, 0.1 * s, 0.28 * s); g.add(e); }
  g.position.y = 0.22 * s; const w = new THREE.Group(); w.add(g); return w;
}
function tree(h = 2.4) {
  const g = new THREE.Group(); const m = L(0x0f6a2a, 0x02150a);
  for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(h * (0.38 - i * 0.09), h * 0.45, 10), m); c.position.y = h * (0.3 + i * 0.22); g.add(c); }
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, h * 0.2, 6), L(0x5a3010)); tr.position.y = h * 0.08; g.add(tr);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshBasicMaterial({ color: 0xffe060 })); star.position.y = h * 0.98; g.add(star);
  const cols = [0xff3030, 0xffd23a, 0x39c8ff, 0xffffff];
  for (let i = 0; i < 14; i++) { const a = i * 2.4, y = 0.25 + (i / 14) * 0.65; const rr = h * 0.33 * (1 - (y - 0.2) / 0.9) + 0.05; const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), new THREE.MeshBasicMaterial({ color: cols[i % 4] })); b.position.set(Math.cos(a) * rr, h * y, Math.sin(a) * rr); g.add(b); }
  return g;
}
function present(c: number, s = 0.5) {
  const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.8, s), L(c, 0x111111)); b.position.y = s * 0.4; g.add(b);
  const r1 = new THREE.Mesh(new THREE.BoxGeometry(s * 1.02, s * 0.82, s * 0.15), L(0xffd23a, 0x222200)); r1.position.y = s * 0.4; g.add(r1);
  const r2 = r1.clone(); r2.rotation.y = Math.PI / 2; g.add(r2); return g;
}
function balloon(c: number) {
  const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), new THREE.MeshPhongMaterial({ color: c, shininess: 90, emissive: new THREE.Color(c).multiplyScalar(0.15) })); b.scale.set(1, 1.2, 1); b.position.y = 2.6; g.add(b);
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 2.3, 3), L(0xffffff)); s.position.y = 1.15; g.add(s); return g;
}
function candle() {
  const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 10), L(0xfff3d0, 0x222018)); c.position.y = 0.25; g.add(c);
  const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc040 })); f.scale.set(0.7, 1.6, 0.7); f.position.y = 0.58; g.add(f); return g;
}
function palm() {
  const g = new THREE.Group(); const tm = L(0x8a5a2a);
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.12 - i * 0.01, 0.14 - i * 0.01, 0.55, 7), tm); s.position.set(i * 0.04, 0.28 + i * 0.52, 0); g.add(s); }
  const lm = L(0x1f9a3a, 0x041a08);
  for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.6, 4), lm); l.scale.set(1, 1, 0.2); const a = i / 7 * Math.PI * 2; l.position.set(0.24 + Math.cos(a) * 0.6, 3.1, Math.sin(a) * 0.6); l.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2 - 0.0); g.add(l); }
  return g;
}
function umbrella(c: number) {
  const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 5), L(0xeeeeee)); p.position.y = 1.1; g.add(p);
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.45, 8, 1, true), new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide })); top.position.y = 2.2; g.add(top); return g;
}
function mask(c: number) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.scale.set(1.4, 0.6, 1); g.add(m);
  for (const x of [-0.3, 0.3]) { const e = new THREE.Mesh(new THREE.CircleGeometry(0.13, 12), new THREE.MeshBasicMaterial({ color: 0x000000 })); e.position.set(x, 0.02, 0.01); e.scale.set(1.3, 0.8, 1); g.add(e); }
  return g;
}
function textBanner(txt: string, color: string, w = 6, h = 1) {
  const t = canvasTex(1024, 170, (g, W, H) => {
    g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, W, H);
    g.font = '900 120px Arial, Roboto, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const fw = g.measureText(txt).width; if (fw > W - 40) g.font = `900 ${Math.floor(120 * (W - 40) / fw)}px Arial, Roboto, sans-serif`;
    g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,0.8)'; g.strokeText(txt, W / 2, H / 2 + 6);
    g.fillStyle = color; g.shadowColor = color; g.shadowBlur = 24; g.fillText(txt, W / 2, H / 2 + 6);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
}

export function buildDecor(st: Studio, th: Theme) {
  const R = st.root;
  const place = (o: THREE.Object3D, r: number, a: number, y = 0) => { o.position.copy(polar(r, a, y)); o.lookAt(0, o.position.y, 0); R.add(o); return o; };
  const front = [D(20), D(-20), D(28), D(-28)];
  // decoración de la grada: solo en los pasillos y extremos (las filas están ocupadas por el público)
  const spots = tierSpots();
  const onTier = (n: number, mk: (k: number) => THREE.Object3D) => { for (let k = 0; k < Math.min(n, spots.length); k++) { const sp = spots[k]; place(mk(k), sp.r, sp.a, sp.y); } };
  switch (th.decor) {
    case 'halloween': {
      for (const a of [D(24), D(-24), D(30), D(-30), D(175), D(-175)]) place(pumpkin(1.2), 7 + Math.random(), a);
      onTier(10, () => pumpkin(0.5));
      particles(st, 60, [0x9b3cff, 0xff7a18], 0.18, 0.4, false);
      // murciélagos
      const bats: THREE.Object3D[] = [];
      for (let k = 0; k < 8; k++) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.25, 3), new THREE.MeshBasicMaterial({ color: 0x050005, side: THREE.DoubleSide })); b.scale.set(2, 0.6, 1); R.add(b); bats.push(b); }
      st.anim.push((dt, t) => bats.forEach((b, i) => { const a = t * 0.5 + i * 0.8; b.position.set(Math.cos(a) * (6 + i % 3), 5.5 + Math.sin(t * 2 + i) * 0.4, Math.sin(a) * (6 + i % 3)); b.rotation.y = -a; b.scale.y = 0.4 + Math.abs(Math.sin(t * 10 + i)) * 0.5; }));
      break;
    }
    case 'navidad': {
      for (const a of [D(24), D(-24)]) place(tree(3.2), 9.6, a);
      for (const a of [D(176), D(-176)]) place(tree(2.6), 9.5, a);
      const cols = [0xd01020, 0x1a8a30, 0xffd23a, 0x39c8ff];
      for (let k = 0; k < 10; k++) place(present(cols[k % 4], 0.4 + (k % 3) * 0.12), 8.8 + (k % 2) * 0.6, (k % 2 ? 1 : -1) * D(20 + k * 1.8));
      particles(st, 500, [0xffffff], 0.08, 0.6, false);
      break;
    }
    case 'nochebuena': {
      onTier(20, () => candle());
      for (const a of front) place(candle(), 4.4, a, 0);
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.6), new THREE.MeshBasicMaterial({ color: 0xffe08a })); star.position.set(0, 6.2, -11); star.scale.set(1, 1.5, 0.3); R.add(star);
      st.anim.push((dt, t) => { star.rotation.y = Math.sin(t) * 0.3; });
      particles(st, 200, [0xffe08a, 0xffffff], 0.07, 0.15, false);
      break;
    }
    case 'ninos': {
      const cols = [0xff4f4f, 0xffd23a, 0x39c8ff, 0x5fff8a, 0xff5fb0, 0xb07aff];
      onTier(18, (k) => balloon(cols[k % 6]));
      for (const a of front) place(balloon(cols[Math.floor(Math.random() * 6)]), 4.6, a);
      particles(st, 120, cols, 0.1, 0.3, true);
      break;
    }
    case 'carnaval': {
      const cols = [0xff4fd8, 0x3dff8a, 0xffd23a, 0x39c8ff];
      for (let k = 0; k < 6; k++) { const m = mask(cols[k % 4]); m.position.copy(polar(11.8, (k % 2 ? 1 : -1) * D(105 + Math.floor(k / 2) * 22), 6)); m.lookAt(0, 6, 0); R.add(m); }
      particles(st, 400, cols, 0.1, 0.8, true);
      // serpentinas
      for (let k = 0; k < 12; k++) { const s = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 4, 30, Math.PI * 6), new THREE.MeshBasicMaterial({ color: cols[k % 4] })); s.position.copy(polar(10.5, k / 12 * Math.PI * 2, 7.8)); s.scale.set(1, 1, 4); s.rotation.x = Math.PI / 2; R.add(s); }
      break;
    }
    case 'findeano': {
      const clock = new THREE.Group();
      const face = new THREE.Mesh(new THREE.CircleGeometry(1.1, 40), new THREE.MeshBasicMaterial({ color: 0xfff6e0 })); clock.add(face);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.08, 8, 40), L(0xd4a017, 0x302000)); clock.add(rim);
      for (const [l, r] of [[0.75, 0], [0.55, 0.02]] as const) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.06, l, 0.02), new THREE.MeshBasicMaterial({ color: 0x111111 })); h.position.y = l / 2; h.rotation.z = r; clock.add(h); }
      clock.position.set(0, 6.3, -11.3); R.add(clock);
      const b = textBanner('¡FELIZ AÑO NUEVO!', '#ffe08a', 6, 1); b.position.set(0, 1.0, -10.95); R.add(b);
      const cols = [0xffe08a, 0xd0d8ff, 0xffffff];
      onTier(14, (k) => balloon(cols[k % 3]));
      particles(st, 350, cols, 0.09, 0.7, true);
      break;
    }
    case 'verano': {
      for (const a of [D(22), D(-22), D(176), D(-176)]) place(palm(), 9.8, a);
      const cols = [0xff6a3a, 0xffd23a, 0x2ad0c0];
      for (const [i, a] of front.entries()) place(umbrella(cols[i % 3]), 4.9, a);
      for (let k = 0; k < 6; k++) { const ball = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), new THREE.MeshLambertMaterial({ color: cols[k % 3] })); ball.position.copy(polar(4.4, (k % 2 ? 1 : -1) * D(10 + k * 3), 0.25)); R.add(ball); }
      const sun = new THREE.Mesh(new THREE.CircleGeometry(1, 30), new THREE.MeshBasicMaterial({ color: 0xffe060 })); sun.position.set(0, 6.4, -11.2); R.add(sun);
      break;
    }
    case 'especial300': {
      // gráfico dorado «300» sobre la pantalla central + dos «300» girando a los lados, confeti y pancarta de celebración
      const t300 = canvasTex(1024, 512, (g, W, H) => {
        g.clearRect(0, 0, W, H); g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = '900 330px "Arial Black", Arial, sans-serif';
        const lg = g.createLinearGradient(0, 60, 0, 380); lg.addColorStop(0, '#fff6c8'); lg.addColorStop(0.5, '#ffd23a'); lg.addColorStop(1, '#a8740a');
        g.lineJoin = 'round'; g.lineWidth = 26; g.strokeStyle = '#3a0606'; g.strokeText('300', W / 2, 220);
        g.shadowColor = '#ffcf40'; g.shadowBlur = 40; g.fillStyle = lg; g.fillText('300', W / 2, 220);
        g.shadowBlur = 0; g.font = '900 78px Arial, Roboto, sans-serif'; g.lineWidth = 12; g.strokeText('SUSCRIPTORES', W / 2, 440); g.fillStyle = '#ffffff'; g.fillText('SUSCRIPTORES', W / 2, 440);
      });
      const big = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.1), new THREE.MeshBasicMaterial({ map: t300, transparent: true, depthWrite: false })); big.position.set(0, 6.45, -11.3); R.add(big);
      const spin: THREE.Mesh[] = [];
      for (const sgn of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: t300, transparent: true, depthWrite: false, side: THREE.DoubleSide })); m.position.copy(polar(9.2, sgn * D(150), 5.6)); R.add(m); spin.push(m); }
      st.anim.push((dt, t) => { big.scale.setScalar(1 + Math.sin(t * 2.2) * 0.04); spin.forEach((m, i) => { m.rotation.y = t * 0.9 + i * Math.PI; m.position.y = 5.6 + Math.sin(t * 1.5 + i) * 0.2; }); });
      const b = textBanner('ESPECIAL 300 SUSCRIPTORES · Ikeriano el campeón 2', '#ffe08a', 7.2, 0.6); b.position.set(0, 1.0, -10.95); R.add(b);
      const cols = [0xffd23a, 0xffffff, 0xff3b4a, 0xfff3c0];
      onTier(14, (k) => balloon(cols[k % 4]));
      particles(st, 450, cols, 0.1, 0.8, true);
      break;
    }
    case 'primetime': {
      const b = textBanner('ESPECIAL PRIME TIME', '#ffe7a0', 6.5, 1.1); b.position.set(0, 6.25, -11.3); R.add(b);
      // focos móviles (haces de luz que barren el plató)
      const beamTex = vertFadeTex();
      const movers: THREE.Mesh[] = [];
      for (let k = 0; k < 8; k++) {
        const len = 12; const m = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 1.1, len, 12, 1, true), new THREE.MeshBasicMaterial({ color: k % 2 ? 0xffc93a : 0x6fb8ff, map: beamTex, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
        m.geometry.translate(0, -len / 2, 0); const p = polar(9, k / 8 * Math.PI * 2, 8.4); m.position.copy(p); R.add(m); movers.push(m);
      }
      const tmp = new THREE.Vector3();
      st.anim.push((dt, t) => movers.forEach((m, i) => { tmp.set(Math.sin(t * 0.7 + i) * 5, 0, Math.cos(t * 0.5 + i * 1.7) * 5); const dir = tmp.sub(m.position).normalize(); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir); }));
      particles(st, 160, [0xffe7a0, 0xffffff, 0x6fb8ff], 0.07, 0.25, false);
      break;
    }
  }
}
