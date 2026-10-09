// Público en directo en las gradas del plató (v1.3).
// Maniquíes estilizados como los concursantes, dibujados con InstancedMesh (unas pocas llamadas de dibujo
// para ~200 personas). Se animan SOLO con matrices de instancia (sin huesos): balanceo, aplausos, ponerse de pie,
// brazos arriba, manos a la cabeza y carteles. Les iluminan los focos del plató (heads/washes), los LEDs y las LineBars.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Theme } from './themes';
import type { LightRig } from './lights';
import { ROWS, AISLES, TIER_A, PLATO } from './set3d';
import { canvasTex } from './tex';

export type Reaccion = 'idle' | 'aplauso' | 'ritmo' | 'vitores' | 'ovacion' | 'ooh' | 'oohSuave';

// ---------------------------------------------------------------- generador aleatorio con semilla (público estable por tema)
function rng(seed: number) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hashStr = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

// ---------------------------------------------------------------- geometrías (coordenadas locales: mira a +Z, origen en el suelo bajo la cadera)
const HIP = 0.45, NECK = 1.06, SH_Y = 0.98, SH_X = 0.22, STAND_UP = 0.41;
function geoms() {
  const cap = (r: number, l: number, seg = 6) => new THREE.CapsuleGeometry(r, l, 2, seg);
  const torso = cap(0.16, 0.32, 8); torso.scale(1, 1, 0.72); torso.translate(0, HIP + 0.30, 0);
  const neck = new THREE.CylinderGeometry(0.05, 0.055, 0.1, 6); neck.translate(0, 0.03, 0);
  const skull = new THREE.SphereGeometry(0.13, 9, 7); skull.scale(0.95, 1.1, 1); skull.translate(0, 0.15, 0);
  const head = mergeGeometries([neck, skull])!;
  const arm = cap(0.05, 0.34, 5); arm.translate(0, -0.22, 0);
  const hand = new THREE.SphereGeometry(0.052, 6, 4); hand.translate(0, -0.46, 0);
  const armG = mergeGeometries([arm, hand])!;
  const foot = (x: number, z: number) => { const b = new THREE.BoxGeometry(0.1, 0.07, 0.18); b.translate(x, 0.035, z); return b; };
  const parts: THREE.BufferGeometry[] = [];
  for (const x of [-0.09, 0.09]) {
    const th = cap(0.075, 0.24); th.rotateX(Math.PI / 2); th.translate(x, HIP, 0.13); parts.push(th);
    const sh = cap(0.065, 0.3); sh.translate(x, 0.25, 0.3); parts.push(sh); parts.push(foot(x, 0.34));
  }
  const legsSit = mergeGeometries(parts)!;
  const parts2: THREE.BufferGeometry[] = [];
  for (const x of [-0.09, 0.09]) { const l = cap(0.07, 0.68); l.translate(x, 0.47, 0); parts2.push(l, foot(x, 0.04)); }
  const legsStand = mergeGeometries(parts2)!;
  const seat = new THREE.BoxGeometry(0.44, 0.42, 0.36); seat.translate(0, 0.21, -0.03);
  const back = new THREE.BoxGeometry(0.44, 0.34, 0.05); back.translate(0, 0.55, -0.2);
  const seatG = mergeGeometries([seat, back])!;
  // --- accesorios (coordenadas de la cabeza: origen en el cuello; centro del cráneo en y=0.15, radio 0.13)
  const hair = new THREE.SphereGeometry(0.138, 9, 5, 0, Math.PI * 2, 0, Math.PI * 0.55); hair.rotateX(-0.35); hair.translate(0, 0.155, -0.012);
  const hairL = new THREE.SphereGeometry(0.142, 9, 6, 0, Math.PI * 2, 0, Math.PI * 0.72); hairL.rotateX(-0.6); hairL.scale(1.04, 1.08, 1.06); hairL.translate(0, 0.15, -0.02);
  const cone = new THREE.ConeGeometry(0.095, 0.28, 8); cone.translate(0, 0.14, 0); cone.rotateX(-0.15); cone.translate(0, 0.25, 0);
  const wc = new THREE.ConeGeometry(0.11, 0.42, 8); wc.translate(0, 0.21, 0); wc.rotateZ(0.12); const wb = new THREE.CylinderGeometry(0.24, 0.24, 0.012, 14);
  const witch = mergeGeometries([wc, wb])!; witch.translate(0, 0.25, 0);
  const sc = new THREE.ConeGeometry(0.108, 0.3, 8); sc.translate(0, 0.15, 0); sc.rotateX(-0.6); sc.translate(0, 0.25, 0);
  const tr = new THREE.TorusGeometry(0.112, 0.032, 4, 12); tr.rotateX(Math.PI / 2); tr.translate(0, 0.25, 0);
  const pom = new THREE.SphereGeometry(0.045, 6, 4); pom.translate(0, 0.25 + 0.248, -0.169);
  const trim = mergeGeometries([tr, pom])!;
  const ec = new THREE.ConeGeometry(0.09, 0.34, 8); ec.translate(0, 0.17, 0); ec.rotateX(-0.95); const ep = new THREE.SphereGeometry(0.035, 6, 4); ep.translate(0, 0.34 * Math.cos(0.95), -0.34 * Math.sin(0.95));
  const elf = mergeGeometries([ec, ep])!; elf.translate(0, 0.25, 0);
  const tc = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 10); tc.translate(0, 0.1, 0); const tb = new THREE.CylinderGeometry(0.17, 0.17, 0.012, 12);
  const top = mergeGeometries([tc, tb])!; top.translate(0, 0.255, 0);
  const sb = new THREE.CylinderGeometry(0.27, 0.27, 0.012, 14); const scr = new THREE.CylinderGeometry(0.115, 0.13, 0.1, 10); scr.translate(0, 0.05, 0);
  const straw = mergeGeometries([sb, scr])!; straw.translate(0, 0.25, 0);
  const visor = new THREE.BoxGeometry(0.17, 0.014, 0.11); visor.translate(0, 0.2, 0.15);
  const capG = mergeGeometries([hair.clone(), visor])!;
  const mask = new THREE.BoxGeometry(0.25, 0.065, 0.05); mask.translate(0, 0.175, 0.105);
  const stem = new THREE.CylinderGeometry(0.018, 0.026, 0.08, 5); stem.translate(0, 0.3, 0);
  const pair = (g: () => THREE.BufferGeometry, x: number, y: number, rz: number) => { const a = g(); a.rotateZ(-rz); a.translate(x, y, 0); const b = g(); b.rotateZ(rz); b.translate(-x, y, 0); return mergeGeometries([a, b])!; };
  const horns = pair(() => new THREE.ConeGeometry(0.026, 0.09, 5), 0.065, 0.28, 0.35);
  const ears = pair(() => new THREE.ConeGeometry(0.045, 0.085, 4), 0.07, 0.27, 0.3);
  // cartel: caja con solo 2 grupos (cara delantera con el texto + el resto en blanco) = 2 llamadas de dibujo
  const sign = new THREE.BoxGeometry(0.9, 0.5, 0.02);
  { const ix = sign.index!.array as ArrayLike<number>; const faces = [0, 1, 2, 3, 5, 4]; const ni: number[] = [];
    for (const f of faces) for (let k = 0; k < 6; k++) ni.push(ix[f * 6 + k]);
    sign.setIndex(ni); sign.clearGroups(); sign.addGroup(0, 30, 0); sign.addGroup(30, 6, 1); }
  return { torso, head, arm: armG, legsSit, legsStand, seat: seatG, sign, acc: { hair, hairL, cone, witch, santa: sc, trim, elf, top, straw, cap: capG, mask, stem, horns, ears } };
}
type AccKey = keyof ReturnType<typeof geoms>['acc'];

// ---------------------------------------------------------------- aspecto del público según el programa
const SKIN = [0xf6d7b8, 0xeec4a0, 0xe0ac80, 0xc68c5e, 0xa66d45, 0x7d4e30, 0x5a3622, 0xf3cfb0];
const HAIR = [0x1a1210, 0x2e1c12, 0x4a2c18, 0x7a4a24, 0xc89a50, 0xe0c080, 0x8a8a8a, 0xa8402a, 0x1a1210, 0x2e1c12];
interface Outfit { shirt: number; pants: number; skin: number; acc: { k: AccKey; c: number }[]; kid: boolean }
interface Look { shirts: number[]; pants: number[]; pick(r: () => number, o: Outfit): void; signs: [string, number][]; signBg: string; signFg: string; signBg2?: string; signFg2?: string }
const any = <T>(r: () => number, a: T[]) => a[Math.floor(r() * a.length)];
function hairOr(r: () => number, o: Outfit, p = 0.85) { if (r() < p) o.acc.push({ k: r() < 0.62 ? 'hair' : 'hairL', c: any(r, HAIR) }); }
const DARK = [0x1d2a44, 0x2b3550, 0x3a3a3a, 0x1a1a1a, 0x40506a, 0x5a4a3a];
export function lookFor(th: Theme): Look {
  const tag = th.hashtag || '#AhoraCaigo';
  switch (th.id) {
    case 'halloween': return { shirts: [0x111111, 0x3b0a55, 0xff7a18, 0x2a5a12, 0x5a0a0a, 0x6a2a9a, 0x1a1a1a], pants: [0x111111, 0x2a0b45, 0x1a1a1a], signs: [[tag, 4], ['¡BUUU!', 2]], signBg: '#1a0726', signFg: '#ff9a1a',
      pick(r, o) { const x = r();
        if (x < 0.22) o.acc.push({ k: 'witch', c: 0x150820 });
        else if (x < 0.34) { o.skin = 0xff7a12; o.acc.push({ k: 'stem', c: 0x2a6a12 }); }           // cabeza de calabaza
        else if (x < 0.42) { o.shirt = o.pants = o.skin = 0xeef0f8; }                                   // fantasma
        else if (x < 0.54) { hairOr(r, o, 1); o.acc.push({ k: 'horns', c: 0xd01818 }); }               // diablillo
        else if (x < 0.64) { hairOr(r, o, 1); o.acc.push({ k: 'ears', c: 0x111111 }); }                // gato
        else hairOr(r, o); } };
    case 'navidad': return { shirts: [0xc81a22, 0x1a8a30, 0xffffff, 0xb0101a, 0x0f6a2a, 0xe8e0d0], pants: DARK, signs: [[tag, 4], ['¡FELIZ NAVIDAD!', 2]], signBg: '#ffffff', signFg: '#c81a22', signBg2: '#1a8a30', signFg2: '#ffffff',
      pick(r, o) { const x = r(); if (x < 0.45) { o.acc.push({ k: 'santa', c: 0xd01020 }, { k: 'trim', c: 0xffffff }); } else if (x < 0.6) o.acc.push({ k: 'elf', c: 0x1a9a30 }); else hairOr(r, o); } };
    case 'nochebuena': return { shirts: [0x0d1638, 0x5a0a1a, 0xf0e6c8, 0xd4a017, 0x13307e, 0x1a1a1a], pants: DARK, signs: [[tag, 4], ['¡FELIZ NOCHEBUENA!', 2]], signBg: '#0d1638', signFg: '#ffe08a',
      pick(r, o) { if (r() < 0.14) o.acc.push({ k: 'santa', c: 0xd01020 }, { k: 'trim', c: 0xffffff }); else hairOr(r, o, 0.9); } };
    case 'carnaval': { const C = [0xff4fd8, 0x3dff8a, 0xffd23a, 0x39c8ff, 0xb04fff, 0xff5a3a, 0x00e0c0];
      return { shirts: C, pants: [...C, 0x2a0b45], signs: [[tag, 4], ['¡CARNAVAL!', 2]], signBg: '#4b0f8a', signFg: '#3dff8a',
        pick(r, o) { hairOr(r, o, 0.7); if (r() < 0.6) o.acc.push({ k: 'mask', c: any(r, C) }); if (r() < 0.3) o.acc.push({ k: 'cone', c: any(r, C) }); } }; }
    case 'ninos': { const C = [0xff4f4f, 0xffd23a, 0x39c8ff, 0x5fff8a, 0xff5fb0, 0xb07aff, 0xff9a2a];
      return { shirts: C, pants: [0x2a5adb, 0x1d2a44, 0xff4fa0, 0x2fae5a, 0x6b4fc8], signs: [[tag, 4], ['¡HOLA!', 2]], signBg: '#ffffff', signFg: '#ff4fa0', signBg2: '#ffd23a', signFg2: '#1a3a9a',
        pick(r, o) { o.kid = r() < 0.88; const x = r(); if (x < 0.3) o.acc.push({ k: 'cap', c: any(r, C) }); else if (x < 0.5) { hairOr(r, o, 1); o.acc.push({ k: 'cone', c: any(r, C) }); } else hairOr(r, o, 0.95); } }; }
    case 'primetime': return { shirts: [0x0a0a0a, 0x101828, 0xd4a017, 0xc0c6d0, 0x0a0a0a, 0x5a0a1a, 0xf0e6c8, 0x14141c, 0x0a0a0a], pants: [0x0a0a0a, 0x101828, 0x14141c], signs: [[tag, 4], ['¡PRIME TIME!', 2]], signBg: '#050505', signFg: '#ffd23a',
      pick(r, o) { if (r() < 0.07) o.acc.push({ k: 'top', c: 0x0a0a0a }); else hairOr(r, o, 0.92); } };
    case 'findeano': return { shirts: [0x0a0a0a, 0xd4a017, 0xc0c6d0, 0x1a1a1a, 0xf0e6c8, 0x3a3326], pants: [0x0a0a0a, 0x1a1a1a, 0x3a3326], signs: [[tag, 4], ['¡FELIZ AÑO!', 2]], signBg: '#151515', signFg: '#ffe08a',
      pick(r, o) { const x = r(); if (x < 0.15) o.acc.push({ k: 'top', c: 0x0a0a0a }); else if (x < 0.36) o.acc.push({ k: 'cone', c: any(r, [0xffd23a, 0xd0d8ff, 0xffffff]) }); else hairOr(r, o, 0.9); } };
    case 'verano': return { shirts: [0xff6a3a, 0xffd23a, 0x2ad0c0, 0xff4fa0, 0xffffff, 0x39c8ff, 0x7ad04a], pants: [0x2a6adb, 0xf0e0b0, 0xffffff, 0x1d2a44, 0xff9a6a], signs: [[tag, 4], ['¡VERANO!', 2]], signBg: '#33d6d0', signFg: '#ffffff', signBg2: '#ffb02e', signFg2: '#7a2a00',
      pick(r, o) { if (r() < 0.35) o.acc.push({ k: 'straw', c: 0xe8c870 }); else hairOr(r, o); if (r() < 0.35) o.acc.push({ k: 'mask', c: 0x101010 }); } };
    case 'especial300': return { shirts: [0xd4a017, 0xffffff, 0xc81a22, 0x141414, 0xff3b4a, 0xffe08a], pants: DARK, signs: [['300', 8], [tag, 6]], signBg: '#8a0f1c', signFg: '#ffd23a', signBg2: '#ffffff', signFg2: '#8a0f1c',
      pick(r, o) { if (r() < 0.4) { hairOr(r, o, 0.4); o.acc.push({ k: 'cone', c: any(r, [0xffd23a, 0xff3b4a, 0xffffff]) }); } else hairOr(r, o, 0.9); } };
    default: return { shirts: [0x2a6fdb, 0xe23b3b, 0x2fae5a, 0xf2c230, 0xffffff, 0x6b4fc8, 0xff7a2a, 0x1fb5c9, 0x333a48, 0xe85a9a, 0x8fa3b8], pants: DARK, signs: [[tag, 4], ['¡VAMOS!', 2]], signBg: '#ffffff', signFg: '#1b52e6', signBg2: '#ffd23a', signFg2: '#0b2fa8',
      pick(r, o) { hairOr(r, o, 0.88); } };
  }
}
function signTex(txt: string, bg: string, fg: string) {
  return canvasTex(512, 292, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 14; g.strokeRect(12, 12, w - 24, h - 24);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg;
    let fs = txt.length <= 4 ? 200 : 110; g.font = `900 ${fs}px "Arial Black", Arial, Roboto, sans-serif`;
    const tw = g.measureText(txt).width; if (tw > w - 60) { fs = Math.floor(fs * (w - 60) / tw); g.font = `900 ${fs}px "Arial Black", Arial, Roboto, sans-serif`; }
    g.lineWidth = Math.max(4, fs / 14); g.strokeStyle = 'rgba(0,0,0,.35)'; g.strokeText(txt, w / 2, h / 2 + 6); g.fillText(txt, w / 2, h / 2 + 6);
  });
}

// ---------------------------------------------------------------- iluminación del plató en el shader del público
const MAXS = 20;
function makeUniforms() {
  return {
    uN: { value: 0 },
    uSP: { value: Array.from({ length: MAXS }, () => new THREE.Vector3()) },
    uSD: { value: Array.from({ length: MAXS }, () => new THREE.Vector3(0, -1, 0)) },
    uSC: { value: Array.from({ length: MAXS }, () => new THREE.Vector3()) },
    uSA: { value: Array.from({ length: MAXS }, () => new THREE.Vector2(0.99, 1)) },
    uLed: { value: [new THREE.Vector3(), new THREE.Vector3()] },
    uBar: { value: [new THREE.Vector3(), new THREE.Vector3()] },
  };
}
type U = ReturnType<typeof makeUniforms>;
const DECL_V = `uniform int uN; uniform vec3 uSP[${MAXS}]; uniform vec3 uSD[${MAXS}]; uniform vec3 uSC[${MAXS}]; uniform vec2 uSA[${MAXS}];
uniform vec3 uLed[2]; uniform vec3 uBar[2]; varying vec3 vStage;`;
const BODY_V = `{
  vec4 wp = vec4(transformed, 1.0);
  vec3 wn = objectNormal;
  #ifdef USE_INSTANCING
    wp = instanceMatrix * wp; wn = mat3(instanceMatrix) * wn;
  #endif
  wp = modelMatrix * wp; wn = normalize(mat3(modelMatrix) * wn);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < ${MAXS}; i++) {
    if (i >= uN) break;
    vec3 L = uSP[i] - wp.xyz; vec3 l = normalize(L);
    float cone = smoothstep(uSA[i].x, uSA[i].y, dot(-l, uSD[i]));
    acc += uSC[i] * cone * (0.35 + 0.65 * max(dot(wn, l), 0.0));
  }
  vec3 rad = normalize(vec3(wp.x, 0.0, wp.z));
  vec3 led = wp.x < 0.0 ? uLed[0] : uLed[1];
  vec3 bar = wp.x < 0.0 ? uBar[0] : uBar[1];
  float low = clamp(1.0 - (wp.y - 1.6) * 0.45, 0.25, 1.0);
  acc += led * (0.2 + 0.7 * max(dot(wn, -rad), 0.0)) * low;
  acc += bar * (0.1 + 0.9 * max(dot(wn, rad), 0.0));
  vStage = acc;
}`;
function stageLit(m: THREE.Material, u: U) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + DECL_V).replace('#include <fog_vertex>', '#include <fog_vertex>\n' + BODY_V);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vStage;').replace('#include <opaque_fragment>', 'outgoingLight += diffuseColor.rgb * vStage;\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => 'publico-v13';
  return m;
}

// ---------------------------------------------------------------- personas
interface Person {
  base: THREE.Matrix4; sc: number; ph: number; rate: number; jit: number;
  kind: Reaccion; w: number; stand: number; delay: number; join: boolean; variant: number;
  hy: number; hyT: number; lookT: number;
  sign: { mesh: number; idx: number } | null;
  acc: { k: AccKey; idx: number }[];
  row: number; ang: number;
}
interface Pose { rxL: number; rzL: number; rxR: number; rzR: number; stand: number; lean: number; hx: number; bob: number; sway: number }
const lerpPose = (a: Pose, b: Pose, k: number) => { for (const key in a) (a as any)[key] += ((b as any)[key] - (a as any)[key]) * k; return a; };

class Half {
  people: Person[] = [];
  meshes: Record<string, THREE.InstancedMesh> = {};
  signMeshes: THREE.InstancedMesh[] = [];
  sphere = new THREE.Sphere(); visible = true;
  constructor(public root: THREE.Group) { }
}

const _m = new THREE.Matrix4(), _b = new THREE.Matrix4(), _h = new THREE.Matrix4(), _t = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const _c = new THREE.Color(), _frus = new THREE.Frustum(), _pv = new THREE.Matrix4();

export class Audience {
  root = new THREE.Group(); halves: Half[] = []; t = 0; count = 0; signCount = 0;
  private cur: { kind: Reaccion; t0: number; t1: number; beat?: () => number } | null = null;
  private u = makeUniforms();
  private frame = 0;
  constructor(public th: Theme, public quality: 'baja' | 'media' | 'alta') {
    this.root.name = 'publico';
    const G = geoms(); const look = lookFor(th); const r = rng(hashStr(th.id) + 7);
    const mat = stageLit(new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x0b0f1a }), this.u);
    const seatMat = stageLit(new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x05070c }), this.u);
    const signDefs = look.signs.map(([txt], i) => ({ txt, tex: signTex(txt, i && look.signBg2 ? look.signBg2 : look.signBg, i && look.signFg2 ? look.signFg2 : look.signFg) }));
    const signMats = signDefs.map(d => { const white = stageLit(new THREE.MeshLambertMaterial({ color: 0xf2f2f2 }), this.u); const front = stageLit(new THREE.MeshLambertMaterial({ map: d.tex, emissive: 0x222222, emissiveMap: d.tex }), this.u); return [white, front]; });
    const rows = quality === 'baja' ? ROWS.slice(0, 2) : quality === 'media' ? ROWS.slice(0, 3) : ROWS;
    const SP = 0.52; // separación entre asientos (m)
    // ---- asientos: cada lado, cada fila, por tramos entre pasillos
    const seats: { side: number; row: number; x: number; y: number; z: number; yaw: number; ang: number }[] = [];
    for (const side of [-1, 1]) rows.forEach((row, ri) => {
      const cuts = [TIER_A[0], ...AISLES.flatMap(a => [a - 0.42 / row.r, a + 0.42 / row.r]), TIER_A[1]];
      for (let k = 0; k < cuts.length; k += 2) {
        const a0 = cuts[k] + 0.2 / row.r, a1 = cuts[k + 1] - 0.2 / row.r; const len = (a1 - a0) * row.r; const n = Math.max(1, Math.floor(len / SP) + 1);
        for (let j = 0; j < n; j++) {
          const a = side * (n === 1 ? (a0 + a1) / 2 : a0 + (a1 - a0) * j / (n - 1)) + (ri % 2 ? side * 0.012 : 0);
          seats.push({ side, row: ri, x: Math.sin(a) * row.r, y: row.y, z: Math.cos(a) * row.r, yaw: Math.atan2(-Math.sin(a), -Math.cos(a)), ang: Math.abs(a) });
        }
      }
    });
    // ---- carteles: repartidos por las gradas (filas 2 y 3 sobre todo)
    const signHolders = new Map<number, number>(); let totalSigns = 0;
    { const want: number[] = []; look.signs.forEach(([, n], i) => { for (let k = 0; k < n; k++) want.push(i); });
      const cand = seats.map((s, i) => ({ s, i })).filter(o => o.s.row > 0 || seats.length < 80).sort((a, b) => (a.s.side * a.s.ang) - (b.s.side * b.s.ang));
      const step = cand.length / want.length;
      want.forEach((sign, k) => { const o = cand[Math.floor((k + 0.5) * step)]; if (o) { signHolders.set(o.i, sign); totalSigns++; } }); }
    this.signCount = totalSigns;
    // ---- personas
    for (const side of [-1, 1]) {
      const half = new Half(new THREE.Group()); this.root.add(half.root);
      const mine = seats.map((s, i) => ({ s, i })).filter(o => o.s.side === side);
      const outfits: Outfit[] = []; const accCount: Partial<Record<AccKey, number>> = {}; const signCount = signDefs.map(() => 0);
      for (const { s, i } of mine) {
        const o: Outfit = { shirt: any(r, look.shirts), pants: any(r, look.pants), skin: any(r, SKIN), acc: [], kid: false };
        look.pick(r, o); outfits.push(o);
        const sc = o.kid ? 0.66 + r() * 0.12 : 0.94 + r() * 0.12;
        const base = new THREE.Matrix4().compose(_v.set(s.x, s.y + (o.kid ? HIP * (1 - sc) : 0), s.z), _q.setFromEuler(_e.set(0, s.yaw, 0)), _s.setScalar(sc));
        const sg = signHolders.get(i);
        const p: Person = { base, sc, ph: r() * Math.PI * 2, rate: 3.6 + r() * 1.8, jit: (r() - 0.5) * 0.06, kind: 'idle', w: 0, stand: 0, delay: 0, join: true, variant: r(), hy: 0, hyT: 0, lookT: r() * 5, sign: sg == null ? null : { mesh: sg, idx: signCount[sg]++ }, acc: [], row: s.row, ang: s.ang };
        for (const a of o.acc) { p.acc.push({ k: a.k, idx: accCount[a.k] || 0 }); accCount[a.k] = (accCount[a.k] || 0) + 1; }
        half.people.push(p);
      }
      const n = half.people.length; this.count += n;
      const mk = (key: string, g: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], cnt: number) => { const im = new THREE.InstancedMesh(g, m, Math.max(1, cnt)); im.count = cnt; im.name = 'pub-' + key; half.meshes[key] = im; half.root.add(im); return im; };
      const seatsM = mk('seat', G.seat, seatMat, n), torso = mk('torso', G.torso, mat, n), head = mk('head', G.head, mat, n), arms = mk('arm', G.arm, mat, n * 2);
      const lS = mk('legsSit', G.legsSit, mat, n), lT = mk('legsStand', G.legsStand, mat, n);
      for (const k of Object.keys(accCount) as AccKey[]) mk('acc-' + k, G.acc[k], mat, accCount[k]!);
      half.signMeshes = signDefs.map((_, si) => { const im = new THREE.InstancedMesh(G.sign, signMats[si], Math.max(1, signCount[si])); im.count = signCount[si]; im.name = 'pub-sign' + si; half.root.add(im); return im; });
      const seatCol = new THREE.Color(PLATO === 'virtual' ? 0xe6e8ef : th.id === 'normal' ? 0x1b2a5a : 0x1a1d28);
      half.people.forEach((p, i) => {
        const o = outfits[i];
        seatsM.setMatrixAt(i, _m.copy(p.base).multiply(_t.makeScale(1 / p.sc, 1 / p.sc, 1 / p.sc)).setPosition(_v.setFromMatrixPosition(p.base).setY(ROWS[p.row].y))); seatsM.setColorAt(i, seatCol);
        torso.setColorAt(i, _c.setHex(o.shirt)); arms.setColorAt(i * 2, _c); arms.setColorAt(i * 2 + 1, _c);
        head.setColorAt(i, _c.setHex(o.skin)); lS.setColorAt(i, _c.setHex(o.pants)); lT.setColorAt(i, _c);
        o.acc.forEach((a, j) => half.meshes['acc-' + a.k].setColorAt(p.acc[j].idx, _c.setHex(a.c)));
      });
      // esfera envolvente (de pie y con carteles) para descartar el lado que no se ve
      const box = new THREE.Box3(); half.people.forEach(p => box.expandByPoint(_v.setFromMatrixPosition(p.base))); box.expandByVector(_v.set(0.8, 0, 0.8)); box.max.y += 2.6;
      box.getBoundingSphere(half.sphere);
      for (const im of [...Object.values(half.meshes), ...half.signMeshes]) { im.frustumCulled = false; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
      this.halves.push(half);
    }
    this.pose(0, true);
  }

  /** Reacción de todo el público (con retrasos y variaciones por persona) */
  react(kind: Reaccion, dur = 3, beat?: () => number) {
    if (kind === 'idle') { this.cur = null; return; }
    const t0 = this.t;
    this.cur = { kind, t0, t1: t0 + dur, beat };
    const join = kind === 'oohSuave' ? 0.45 : kind === 'aplauso' ? 0.92 : kind === 'ooh' ? 0.9 : 1;
    const maxDelay = kind === 'ooh' || kind === 'oohSuave' ? 0.18 : kind === 'ritmo' ? 0.6 : 0.4;
    for (const h of this.halves) for (const p of h.people) { p.join = Math.random() < join; p.delay = Math.random() * maxDelay; p.variant = Math.random(); }
  }
  get reaction(): Reaccion { return this.cur && this.t < this.cur.t1 + 0.5 ? this.cur.kind : 'idle'; }
  stats() {
    let st = 0, up = 0, n = 0, arms = 0;
    for (const h of this.halves) for (const p of h.people) { n++; st += p.stand; if (p.stand > 0.5) up++; arms += p.w; }
    const draw = this.halves.reduce((a, h) => a + Object.keys(h.meshes).length + h.signMeshes.length, 0);
    return { n, kind: this.reaction, standing: up, avgStand: +(st / Math.max(1, n)).toFixed(3), engaged: +(arms / Math.max(1, n)).toFixed(3), signs: this.signCount, drawCalls: draw, visibleHalves: this.halves.filter(h => h.visible).length };
  }

  private idlePose(p: Person, t: number, out: Pose) {
    out.stand = 0; out.lean = 0.03; out.hx = 0.04; out.bob = Math.sin(t * 1.1 + p.ph) * 0.006; out.sway = Math.sin(t * 0.9 + p.ph) * 0.06;
    if (p.sign) { out.rxL = out.rxR = -2.72 + Math.sin(t * 1.3 + p.ph) * 0.05; out.rzL = 0.3; out.rzR = -0.3; }
    else { out.rxL = -0.62 + Math.sin(t * 0.7 + p.ph) * 0.03; out.rxR = -0.6; out.rzL = 0.12; out.rzR = -0.12; }
    return out;
  }
  private reactPose(p: Person, kind: Reaccion, t: number, out: Pose) {
    this.idlePose(p, t, out);
    const v = p.variant;
    const clapC = () => { const c = 0.5 + 0.5 * Math.cos(Math.PI * 2 * p.rate * t + p.ph); return c * c; };
    const beatC = () => { const b = this.cur?.beat; if (!b) return clapC(); let ph = (b() + p.jit + 1) % 1; return Math.min(1, Math.exp(-ph * 9) + Math.exp(-(1 - ph) * 16)); };
    const clap = (c: number, hi = 0) => { out.rxL = out.rxR = -1.15 - hi; out.rzL = 0.1 + 0.42 * c; out.rzR = -out.rzL; };
    const wave = (k = 1) => { const w = Math.sin(t * 7 + p.ph) * 0.22 * k; out.rxL = -2.75; out.rxR = -2.8; out.rzL = -0.28 + w; out.rzR = 0.28 + w; };
    const signWave = (k: number) => { out.rxL = out.rxR = -2.72; out.rzL = 0.3; out.rzR = -0.3; out.sway = Math.sin(t * 5 + p.ph) * 0.32 * k; out.bob += Math.abs(Math.sin(t * 5 + p.ph)) * 0.04 * k; };
    switch (kind) {
      case 'aplauso': if (p.sign) signWave(0.7); else clap(clapC()); out.bob += 0.004 * Math.sin(t * 9); out.hx = 0; break;
      case 'ritmo': if (p.sign) signWave(0.5); else clap(beatC(), 0.25); out.bob += 0.01 * beatC(); out.hx = -0.02; break;
      case 'vitores': out.stand = v < 0.7 ? 1 : 0; if (p.sign) signWave(1.2); else if (v < 0.5) wave(); else clap(clapC(), 0.9); out.bob += Math.abs(Math.sin(t * 5 + p.ph)) * 0.05 * out.stand; out.hx = -0.12; break;
      case 'ovacion': out.stand = 1; if (p.sign) signWave(1.3); else if (v < 0.55) clap(clapC(), 0.7); else wave(1.2); out.bob += Math.abs(Math.sin(t * 4.5 + p.ph)) * 0.05; out.hx = -0.14; break;
      case 'ooh': out.stand = v < 0.45 ? 0.62 : 0; out.lean = 0.18; out.hx = 0.28;
        if (p.sign) { out.rxL = out.rxR = -2.2; out.sway = 0; }
        else if (v < 0.72) { out.rxL = out.rxR = -2.88; out.rzL = 0.5; out.rzR = -0.5; } // manos a la cabeza
        else { out.rxL = out.rxR = -1.55; out.rzL = -0.12; out.rzR = 0.12; }           // brazos hacia delante, sorprendidos
        break;
      case 'oohSuave': out.lean = 0.12; out.hx = 0.2; if (!p.sign) { if (v < 0.6) { out.rxL = out.rxR = -2.6; out.rzL = 0.45; out.rzR = -0.45; } else { out.rxR = -2.75; out.rzR = -0.48; } } break;
    }
    return out;
  }

  private P1: Pose = { rxL: 0, rzL: 0, rxR: 0, rzR: 0, stand: 0, lean: 0, hx: 0, bob: 0, sway: 0 };
  private P2: Pose = { ...this.P1 };
  private pose(dt: number, all = false) {
    const t = this.t, cur = this.cur;
    for (const h of this.halves) {
      if (!all && !h.visible) continue;
      const M = h.meshes; const arms = M.arm, torso = M.torso, head = M.head, lS = M.legsSit, lT = M.legsStand;
      h.people.forEach((p, i) => {
        // ¿qué reacción toca a esta persona ahora?
        let want: Reaccion = 'idle';
        if (cur && p.join && t >= cur.t0 + p.delay && t < cur.t1 + p.delay * 0.6) want = cur.kind;
        if (want !== p.kind) { p.w = Math.max(0, p.w - dt * 5); if (p.w <= 0.02 || p.kind === 'idle') { p.kind = want; } }
        else if (p.kind !== 'idle') p.w = Math.min(1, p.w + dt * 5);
        else p.w = Math.max(0, p.w - dt * 5);
        const P = this.idlePose(p, t, this.P1);
        if (p.kind !== 'idle' && p.w > 0) lerpPose(P, this.reactPose(p, p.kind, t, this.P2), p.w);
        p.stand += (P.stand - p.stand) * Math.min(1, dt * 4.5); if (all) p.stand = P.stand;
        // mirar a los lados de vez en cuando (en reposo)
        p.lookT -= dt; if (p.lookT < 0) { p.lookT = 2 + Math.random() * 5; p.hyT = Math.random() < 0.6 ? 0 : (Math.random() - 0.5) * 0.9; }
        p.hy += ((p.kind === 'idle' ? p.hyT : 0) - p.hy) * Math.min(1, dt * 2.5);
        // cuerpo
        const up = p.stand * STAND_UP + P.bob;
        _b.copy(p.base).multiply(_t.makeTranslation(0, up + HIP, 0)).multiply(_m.makeRotationX(P.lean)).multiply(_t.makeTranslation(0, -HIP, 0));
        torso.setMatrixAt(i, _b);
        _h.copy(_b).multiply(_t.makeTranslation(0, NECK, 0)).multiply(_m.makeRotationFromEuler(_e.set(P.hx, p.hy, 0, 'YXZ')));
        head.setMatrixAt(i, _h);
        arms.setMatrixAt(i * 2, _m.copy(_b).multiply(_t.makeTranslation(-SH_X, SH_Y, 0)).multiply(_t.makeRotationFromEuler(_e.set(P.rxL, 0, P.rzL, 'XYZ'))));
        arms.setMatrixAt(i * 2 + 1, _m.copy(_b).multiply(_t.makeTranslation(SH_X, SH_Y, 0)).multiply(_t.makeRotationFromEuler(_e.set(P.rxR, 0, P.rzR, 'XYZ'))));
        // piernas: sentadas o de pie
        const standing = p.stand > 0.5;
        lS.setMatrixAt(i, standing ? ZERO : p.base); lT.setMatrixAt(i, standing ? _m.copy(p.base).multiply(_t.makeTranslation(0, (p.stand - 1) * STAND_UP, 0)) : ZERO);
        for (const a of p.acc) M['acc-' + a.k].setMatrixAt(a.idx, _h);
        if (p.sign) {
          const sm = h.signMeshes[p.sign.mesh];
          sm.setMatrixAt(p.sign.idx, _m.copy(_b).multiply(_t.makeTranslation(0, 1.68, 0.17)).multiply(_t.makeRotationZ(P.sway)).multiply(_t.makeRotationX(-0.12)));
        }
      });
      for (const im of Object.values(M)) im.instanceMatrix.needsUpdate = true;
      for (const im of h.signMeshes) im.instanceMatrix.needsUpdate = true;
    }
  }

  /** Copia el estado de los focos (heads/washes), LEDs y LineBars a los uniforms del shader del público */
  private light(rig: LightRig | null) {
    const u = this.u; let n = 0;
    if (rig) {
      for (const id of ['heads', 'washes'] as const) {
        const g = rig.groups[id]; const wash = id === 'washes';
        for (const f of g.fixtures) {
          if (n >= MAXS) break;
          const s = g[f.sub]; const on = !!f.beam?.visible && f.inten > 0.02 && !!f.dirW;
          if (!on) continue;
          const spread = s.spread * (wash ? 2.4 : 1) * Math.sqrt(s.thick);
          const tO = wash ? 0.32 * spread : 0.085 * spread + 0.03, tI = tO * 0.4;
          u.uSP.value[n].copy(f.pos); u.uSD.value[n].copy(f.dirW!);
          u.uSC.value[n].set(f.color.r, f.color.g, f.color.b).multiplyScalar(f.inten * (wash ? 0.55 : 2.4));
          u.uSA.value[n].set(1 / Math.sqrt(1 + tO * tO), 1 / Math.sqrt(1 + tI * tI));
          n++;
        }
      }
      for (let sd = 0; sd < 2; sd++) { const l = rig.ledAvg[sd], b = rig.barAvg[sd]; u.uLed.value[sd].set(l.r, l.g, l.b).multiplyScalar(0.55); u.uBar.value[sd].set(b.r, b.g, b.b).multiplyScalar(0.9); }
    }
    u.uN.value = n;
  }

  update(dt: number, rig: LightRig | null, cam: THREE.Camera, noCull = false) {
    this.t += dt; this.frame++;
    if (this.cur && this.t > this.cur.t1 + 1.2) this.cur = null;
    _pv.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); _frus.setFromProjectionMatrix(_pv);
    for (const h of this.halves) { h.visible = noCull || _frus.intersectsSphere(h.sphere); h.root.visible = h.visible; }
    this.light(rig);
    // calidad baja: la animación del público va a 30 fps
    if (this.quality === 'baja' && this.frame % 2) return;
    this.pose(this.quality === 'baja' ? dt * 2 : dt);
  }
  dispose() {
    this.root.traverse((o: any) => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x: any) => { x.map?.dispose?.(); x.dispose?.(); }); });
    this.root.removeFromParent();
  }
}
