import * as THREE from 'three';
import { canvasTex } from './tex';

export interface Person {
  root: THREE.Group; body: THREE.Group; legL: THREE.Object3D; legR: THREE.Object3D; armL: THREE.Object3D; armR: THREE.Object3D; head: THREE.Object3D;
  walkPhase: number; gesture: number; gestureType: string; t: number;
}

function limb(r: number, len: number, mat: THREE.Material) {
  const pivot = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 3, 8), mat);
  m.position.y = -len / 2 - r * 0.5; pivot.add(m); return pivot;
}

/** Maniquí blanco como los del Scratch (concursantes) */
export function makeMannequin(opts: { color?: number; shirt?: number; skin?: number } = {}): Person {
  const white = new THREE.MeshLambertMaterial({ color: opts.color ?? 0xe8eef8, emissive: 0x1a2440 });
  const shirtM = opts.shirt != null ? new THREE.MeshLambertMaterial({ color: opts.shirt, emissive: 0x111111 }) : white;
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const legL = limb(0.085, 0.62, white); legL.position.set(-0.11, 0.86, 0); body.add(legL);
  const legR = limb(0.085, 0.62, white); legR.position.set(0.11, 0.86, 0); body.add(legR);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.42, 4, 10), shirtM); torso.position.y = 1.15; torso.scale.set(1, 1, 0.7); body.add(torso);
  const armL = limb(0.065, 0.5, shirtM); armL.position.set(-0.27, 1.42, 0); armL.rotation.z = -0.12; body.add(armL);
  const armR = limb(0.065, 0.5, shirtM); armR.position.set(0.27, 1.42, 0); armR.rotation.z = 0.12; body.add(armR);
  const head = new THREE.Group(); head.position.y = 1.66; body.add(head);
  const hm = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), white); hm.scale.set(0.95, 1.1, 1); head.add(hm);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 8), white); neck.position.y = 1.5; body.add(neck);
  return { root, body, legL, legR, armL, armR, head, walkPhase: 0, gesture: 0, gestureType: '', t: Math.random() * 10 };
}

/** El Presentador: personaje original estilizado (traje, pelo de cómic, sonrisa). No representa a ninguna persona real. */
export function makeHost(o: { suit: number; shirt: number; tie: number; bowtie?: boolean; hat?: string; glasses?: boolean; cape?: number }): Person {
  const skinM = new THREE.MeshLambertMaterial({ color: 0xf2c6a0, emissive: 0x2a1408 });
  const suitM = new THREE.MeshLambertMaterial({ color: o.suit, emissive: 0x05070f });
  const shirtM = new THREE.MeshLambertMaterial({ color: o.shirt });
  const tieM = new THREE.MeshLambertMaterial({ color: o.tie, emissive: 0x221100 });
  const shoeM = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const hairM = new THREE.MeshLambertMaterial({ color: 0x3a2414 });
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const legL = limb(0.09, 0.62, suitM); legL.position.set(-0.11, 0.88, 0); body.add(legL);
  const legR = limb(0.09, 0.62, suitM); legR.position.set(0.11, 0.88, 0); body.add(legR);
  for (const l of [legL, legR]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.26), shoeM); sh.position.set(0, -0.84, 0.05); l.add(sh); }
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.42, 4, 12), suitM); torso.position.y = 1.17; torso.scale.set(1, 1, 0.72); body.add(torso);
  const shirt = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.36), shirtM); shirt.position.set(0, 1.3, 0.155); body.add(shirt);
  if (o.bowtie) {
    for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.08, 4), tieM); b.rotation.z = s * Math.PI / 2; b.position.set(s * 0.04, 1.46, 0.165); body.add(b); }
  } else { const tie = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.3), tieM); tie.position.set(0, 1.29, 0.158); body.add(tie); }
  // solapas
  for (const s of [-1, 1]) { const lap = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.3), suitM); lap.position.set(s * 0.075, 1.3, 0.16); lap.rotation.z = s * 0.25; body.add(lap); }
  const armL = limb(0.07, 0.5, suitM); armL.position.set(-0.29, 1.44, 0); armL.rotation.z = -0.12; body.add(armL);
  const armR = limb(0.07, 0.5, suitM); armR.position.set(0.29, 1.44, 0); armR.rotation.z = 0.12; body.add(armR);
  for (const a of [armL, armR]) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), skinM); h.position.y = -0.66; a.add(h); }
  if (o.cape != null) { const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.0), new THREE.MeshLambertMaterial({ color: o.cape, side: THREE.DoubleSide })); cape.position.set(0, 1.0, -0.17); cape.rotation.x = 0.08; body.add(cape); }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 8), skinM); neck.position.y = 1.52; body.add(neck);
  const head = new THREE.Group(); head.position.y = 1.7; body.add(head);
  const hm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), skinM); hm.scale.set(0.92, 1.08, 0.98); head.add(hm);
  // cara de dibujo (textura)
  const face = canvasTex(128, 128, (g) => {
    g.fillStyle = '#1a1a1a';
    g.beginPath(); g.ellipse(42, 54, 9, 12, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(86, 54, 9, 12, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(45, 50, 3.5, 0, 7); g.fill(); g.beginPath(); g.arc(89, 50, 3.5, 0, 7); g.fill();
    g.strokeStyle = '#3a2414'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(30, 34); g.lineTo(54, 30); g.stroke(); g.beginPath(); g.moveTo(74, 30); g.lineTo(98, 34); g.stroke();
    g.fillStyle = '#8a1c1c'; g.beginPath(); g.moveTo(38, 82); g.quadraticCurveTo(64, 112, 90, 82); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.fillRect(44, 82, 40, 7);
  });
  const fm = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20), new THREE.MeshBasicMaterial({ map: face, transparent: true }));
  fm.position.set(0, -0.01, 0.152); head.add(fm);
  // tupé de cómic
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.165, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM); hair.position.y = 0.03; hair.scale.set(1, 1.05, 1.02); head.add(hair);
  const quiff = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 8), hairM); quiff.position.set(0.02, 0.17, 0.08); quiff.rotation.set(0.9, 0, -0.3); head.add(quiff);
  const ears = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), skinM); ears.scale.set(0.6, 1, 1); ears.position.set(0.15, -0.01, 0); head.add(ears);
  const ear2 = ears.clone(); ear2.position.x = -0.15; head.add(ear2);
  if (o.glasses) {
    const gm = new THREE.MeshBasicMaterial({ color: 0x111111 });
    for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), gm); l.position.set(s * 0.055, 0.02, 0.158); head.add(l); }
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.01), gm); br.position.set(0, 0.03, 0.16); head.add(br);
  }
  // micrófono de mano
  const mic = new THREE.Group();
  const mh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.016, 0.2, 8), new THREE.MeshLambertMaterial({ color: 0x222222 }));
  const mb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshLambertMaterial({ color: 0x999999, emissive: 0x222222 })); mb.position.y = 0.12;
  mic.add(mh, mb); mic.position.set(0, -0.68, 0.06); mic.rotation.x = -0.6; armR.add(mic);
  addHat(head, o.hat);
  return { root, body, legL, legR, armL, armR, head, walkPhase: 0, gesture: 0, gestureType: '', t: 0 };
}

function addHat(head: THREE.Object3D, hat?: string) {
  if (!hat) return;
  const L = (c: number, e = 0) => new THREE.MeshLambertMaterial({ color: c, emissive: e });
  const g = new THREE.Group(); g.position.y = 0.14; head.add(g);
  if (hat === 'bruja') {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 20), L(0x150820)); g.add(b);
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.42, 16), L(0x150820)); c.position.y = 0.21; c.rotation.z = 0.15; g.add(c);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.05, 16), L(0xff7a18, 0x401800)); band.position.y = 0.04; g.add(band);
  } else if (hat === 'papanoel') {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 16), L(0xd01020)); c.position.set(0, 0.17, -0.02); c.rotation.x = -0.35; g.add(c);
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.04, 8, 20), L(0xffffff, 0x333333)); r.rotation.x = Math.PI / 2; g.add(r);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), L(0xffffff, 0x333333)); p.position.set(0, 0.32, -0.14); g.add(p);
  } else if (hat === 'fiesta') {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 16), L(0xffd23a, 0x332200)); c.position.y = 0.15; g.add(c);
  } else if (hat === 'chistera') {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 20), L(0x0a0a0a)); g.add(b);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.3, 20), L(0x0a0a0a)); c.position.y = 0.15; g.add(c);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.142, 0.142, 0.05, 20), L(0xd4a017, 0x302000)); band.position.y = 0.04; g.add(band);
  } else if (hat === 'paja') {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.02, 20), L(0xe8c870)); g.add(b);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.13, 20), L(0xe8c870)); c.position.y = 0.06; g.add(c);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.162, 0.162, 0.04, 20), L(0xff6a3a)); band.position.y = 0.02; g.add(band);
  } else if (hat === 'helice') {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), L(0xff4fa0)); c.position.y = -0.05; g.add(c);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 6), L(0x333333)); st.position.y = 0.15; g.add(st);
    const pr = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.01, 0.05), L(0x2fd0ff)); pr.position.y = 0.2; pr.name = 'helice'; g.add(pr);
  } else if (hat === 'corona') {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.12, 8, 1, true), L(0xffd23a, 0x443300)); c.position.y = 0.0; (c.material as any).side = THREE.DoubleSide; g.add(c);
    for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 6), L(0xffd23a, 0x443300)); const a = i / 8 * Math.PI * 2; s.position.set(Math.cos(a) * 0.14, 0.09, Math.sin(a) * 0.14); g.add(s); }
  }
}

/** Animación de andar / reposo / gestos. speed en m/s */
export function animatePerson(p: Person, dt: number, speed: number) {
  p.t += dt;
  if (speed > 0.05) {
    p.walkPhase += dt * (4 + speed * 2.2);
    const s = Math.sin(p.walkPhase) * Math.min(0.75, 0.25 + speed * 0.25);
    p.legL.rotation.x = s; p.legR.rotation.x = -s;
    if (!p.gesture) { p.armL.rotation.x = -s * 0.8; p.armR.rotation.x = s * 0.8; }
    p.body.position.y = Math.abs(Math.cos(p.walkPhase)) * 0.04;
  } else {
    p.legL.rotation.x *= 0.8; p.legR.rotation.x *= 0.8;
    p.body.position.y = Math.sin(p.t * 2) * 0.008;
    if (!p.gesture) { p.armL.rotation.x *= 0.85; p.armR.rotation.x *= 0.85; }
  }
  if (p.gesture > 0) {
    p.gesture = Math.max(0, p.gesture - dt);
    const k = Math.sin(Math.min(1, p.gesture) * Math.PI);
    const w = Math.sin(p.t * 9) * 0.25;
    if (p.gestureType === 'arriba') { p.armR.rotation.x = -2.6 * k; p.armR.rotation.z = 0.12 + w * k; p.armL.rotation.x = -2.4 * k; p.armL.rotation.z = -0.12 - w * k; }
    else if (p.gestureType === 'senala') { p.armR.rotation.x = -1.5 * k; p.armR.rotation.z = 0.12; }
    else if (p.gestureType === 'saluda') { p.armR.rotation.x = -2.7 * k; p.armR.rotation.z = 0.3 + w * 1.4 * k; }
    else if (p.gestureType === 'habla') { p.armL.rotation.x = -0.9 * k + w * 0.3; p.armR.rotation.x = -1.0 * k - w * 0.3; }
    else if (p.gestureType === 'aplaude') { const c = Math.abs(Math.sin(p.t * 14)); p.armL.rotation.x = -1.3 * k; p.armR.rotation.x = -1.3 * k; p.armL.rotation.z = (0.5 + c * 0.35) * k - 0.12; p.armR.rotation.z = -(0.5 + c * 0.35) * k + 0.12; }
    else if (p.gestureType === 'gracias') { p.armL.rotation.x = -1.1 * k; p.armR.rotation.x = -1.1 * k; p.armL.rotation.z = 0.75 * k; p.armR.rotation.z = -0.75 * k; p.body.rotation.x = 0.25 * k; }
    else if (p.gestureType === 'beso') { const ph = 1 - p.gesture / 1.6; p.armR.rotation.x = ph < 0.5 ? -2.2 * k : -1.6 * k; p.armR.rotation.z = ph < 0.5 ? -0.5 : 0.5 * k; }
    // v1.6 (monólogos): gestos largos con su propia envolvente (entran y salen en 0,3 s)
    else if (p.gestureType === 'telefono' || p.gestureType === 'baila' || p.gestureType === 'tropieza' || p.gestureType === 'gira' || p.gestureType === 'encoge') {
      const tot = (p as any).gDur || 1; const e = Math.min(1, p.gesture * 3.3, (tot - p.gesture) * 3.3);
      if (p.gestureType === 'telefono') { p.armL.rotation.x = -2.25 * e; p.armL.rotation.z = -0.12 + 0.95 * e; p.head.rotation.z = -0.18 * e; }
      else if (p.gestureType === 'baila') { const b = Math.sin(p.t * 7); p.armL.rotation.x = (-2.4 + b * 0.5) * e; p.armR.rotation.x = (-2.4 - b * 0.5) * e; p.armL.rotation.z = (-0.12 - 0.4 * Math.max(0, b)) * e; p.armR.rotation.z = (0.12 + 0.4 * Math.max(0, -b)) * e; p.body.rotation.y = 0.35 * b * e; p.body.position.y = Math.abs(Math.sin(p.t * 7)) * 0.08 * e; p.legL.rotation.x = 0.35 * Math.max(0, b) * e; p.legR.rotation.x = 0.35 * Math.max(0, -b) * e; }
      else if (p.gestureType === 'tropieza') { const ph = 1 - p.gesture / tot; const f = ph < 0.35 ? ph / 0.35 : Math.max(0, 1 - (ph - 0.35) / 0.65); p.body.rotation.x = 0.55 * f; p.armL.rotation.x = -1.6 * f + Math.sin(p.t * 20) * 0.5 * f; p.armR.rotation.x = -1.6 * f - Math.sin(p.t * 20) * 0.5 * f; p.armL.rotation.z = -0.12 - 0.6 * f; p.armR.rotation.z = 0.12 + 0.6 * f; p.legR.rotation.x = -0.6 * f; }
      else if (p.gestureType === 'gira') { const ph = 1 - p.gesture / tot; p.body.rotation.y = ph * Math.PI * 2; p.armL.rotation.z = -0.12 - 1.2 * e; p.armR.rotation.z = 0.12 + 1.2 * e; }
      else { p.armL.rotation.x = -0.6 * e; p.armR.rotation.x = -0.6 * e; p.armL.rotation.z = -0.12 - 0.5 * e; p.armR.rotation.z = 0.12 + 0.5 * e; p.head.rotation.z = 0.2 * Math.sin(p.t * 3) * e; }
    }
    else if (p.gestureType === 'lamenta') { p.armL.rotation.x = -2.2 * k; p.armR.rotation.x = -2.2 * k; p.armL.rotation.z = 0.9 * k; p.armR.rotation.z = -0.9 * k; p.head.rotation.x = 0.3 * k; }
    if (p.gesture === 0) { p.armL.rotation.z = -0.12; p.armR.rotation.z = 0.12; p.head.rotation.x = 0; p.head.rotation.z = 0; p.body.rotation.x = 0; p.body.rotation.y = 0; }
  }
  const hel = p.head.getObjectByName('helice'); if (hel) hel.rotation.y += dt * 12;
}
export function gesture(p: Person, type: string, dur = 1.6) { p.gestureType = type; p.gesture = dur; (p as any).gDur = dur; }
