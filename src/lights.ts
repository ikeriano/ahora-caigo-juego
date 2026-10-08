// Iluminación de plató controlable (estilo mesas "GLights"): Heads, LineBars, Washes y LEDs.
import * as THREE from 'three';
import { TABLE_R, TOP, RING_IN, RING_OUT, WALL_R, A0, A1 } from './set3d';
import type { Theme } from './themes';

export type GroupId = 'heads' | 'linebars' | 'washes' | 'leds';
export type Sub = 'A' | 'B';
export const SWATCHES = [0xff0000, 0xff6a00, 0xffb000, 0xffff00, 0x9dff00, 0x00ff3c, 0x00ffa8, 0x00ffff, 0x00a8ff, 0x0040ff, 0x6a00ff, 0xb000ff, 0xff00d4, 0xff0080, 0xffd9a0, 0xffffff];
export const SPEEDS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 5, 10];
export const FADES = [0.1, 0.25, 0.33, 0.5, 0.66, 0.75, 1, 1.25, 1.5, 2, 3, 5];
export const MOVES = ['WIDE', 'IN', 'CROSS', 'U/D', 'TILT', 'RTILT', 'SMTILT', 'SLTILT', 'PAN', 'RPAN', 'SMPAN', 'SLPAN', 'CIRCLE', 'RANDOM CIRCLE', 'PÚBLICO'] as const;
export const MSPEED = { FREEZE: 0, SSLOW: 0.2, SLOW: 0.45, MEDIUM: 1, FAST: 2 } as const;
export type ColorMode = '' | 'SECOND' | 'SWITCH' | 'SMOOTH' | 'GRADIENT' | 'FLASH';
export type LState = 'O' | 'X' | 'FO' | 'FX' | 'RAND' | 'FRAND' | 'ORAND' | 'BRAND' | 'STROBE' | 'FLASH';

export interface SubState {
  colors: number[]; rainbow: boolean; colorMode: ColorMode; colorCue: number;
  state: LState; stateCue: number; bright: number;
  beam: 'GOBO' | 'BEAM' | 'NO BEAM'; thick: number; spread: number;
  tilt: number; pan: number; tiltNeg: boolean; panNeg: boolean;
  move: string; mspeed: keyof typeof MSPEED; goboRot: boolean; follow: boolean;
  cueSpeed: number; fadeSpeed: number; loop: boolean; groupRandom: boolean; overshoot: boolean;
  t0: number; // inicio del cue (para "LOOP CUES" desactivado)
}
export function defState(th: Theme, g: GroupId, sub: Sub): SubState {
  const c = sub === 'A' ? th.glow : th.accent;
  return {
    colors: [c], rainbow: false, colorMode: '', colorCue: 0, state: 'O', stateCue: 0, bright: g === 'washes' ? 0.8 : 1,
    beam: 'BEAM', thick: 1, spread: 1, tilt: g === 'linebars' ? 20 : 30, pan: 60, tiltNeg: false, panNeg: false,
    move: g === 'leds' ? '' : 'SMTILT', mspeed: 'SLOW', goboRot: false, follow: false,
    cueSpeed: 1, fadeSpeed: 1, loop: true, groupRandom: false, overshoot: false, t0: 0,
  };
}
export interface Group { id: GroupId; A: SubState; B: SubState; sel: 'A' | 'B' | 'ALL'; fixtures: Fixture[] }
interface Fixture {
  sub: Sub; n: number; N: number; pos: THREE.Vector3; inward: THREE.Vector3;
  head?: THREE.Object3D; beam?: THREE.Mesh; mat?: THREE.ShaderMaterial; lens?: THREE.Sprite; pool?: THREE.Mesh;
  pan: number; tilt: number; vp: number; vt: number; inten: number; color: THREE.Color; rndPh: number;
  pix?: number[]; // índices de píxeles (InstancedMesh)
  bar?: THREE.Object3D;
  /** dirección actual del haz (mundo) — la usa el público para iluminarse */
  dirW?: THREE.Vector3;
}

// ---------- materiales ----------
const beamVS = `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.0); vV=-mv.xyz; vN=normalMatrix*normal; gl_Position=projectionMatrix*mv; }`;
const beamFS = `uniform vec3 uColor; uniform float uI; uniform float uGobo; uniform float uRot; uniform float uSoft;
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){
  float along = 1.0 - vUv.y;
  float fade = pow(1.0 - along, 1.7) * smoothstep(0.0, 0.04, along + 0.02);
  float edge = pow(abs(dot(normalize(vN), normalize(vV))), uSoft);
  float g = 1.0;
  if (uGobo > 0.5) { float s = fract(vUv.x * 8.0 + uRot); g = 0.25 + 0.75 * smoothstep(0.35, 0.5, s) * (1.0 - smoothstep(0.75, 0.9, s)); }
  gl_FragColor = vec4(uColor * uI * fade * edge * g, 1.0);
}`;
function beamMat() {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(1, 1, 1) }, uI: { value: 0.3 }, uGobo: { value: 0 }, uRot: { value: 0 }, uSoft: { value: 1.6 } },
    vertexShader: beamVS, fragmentShader: beamFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
}
let glowTex: THREE.Texture | null = null;
function glow() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); glowTex = new THREE.CanvasTexture(c); return glowTex;
}
const hash = (a: number, b: number) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const C = new THREE.Color(), C2 = new THREE.Color();

// ---------- cues predefinidos ----------
const COLOR_CUES: { cols: number[]; mode: ColorMode; rainbow?: boolean }[] = [
  { cols: [0xff0000, 0xffffff], mode: 'SWITCH' }, { cols: [0x0040ff, 0xffb000], mode: 'GRADIENT' }, { cols: [], mode: 'GRADIENT', rainbow: true },
  { cols: [0xff00d4, 0x00ffff], mode: 'SMOOTH' }, { cols: [0xffb000, 0xffffff], mode: 'SECOND' }, { cols: [0x00ff3c, 0x0040ff], mode: 'SWITCH' },
  { cols: [0xff6a00, 0xff0000, 0xffb000], mode: 'SMOOTH' }, { cols: [0xffffff], mode: 'FLASH' }, { cols: [0x6a00ff, 0xff0080, 0x00a8ff], mode: 'GRADIENT' },
  { cols: [0x00ffff, 0xffffff, 0x0040ff], mode: 'SWITCH' }, { cols: [0xffd9a0, 0xffb000], mode: 'SMOOTH' }, { cols: [], mode: 'SWITCH', rainbow: true },
];

export class LightRig {
  root = new THREE.Group(); groups: Record<GroupId, Group>; t = 0; auto = true;
  followTarget: (() => THREE.Vector3 | null) | null = null;
  ledMesh!: THREE.InstancedMesh; barMesh: THREE.InstancedMesh | null = null;
  washLights: THREE.PointLight[] = [];
  eventUntil = 0; nextAuto = 0; onChange: (() => void) | null = null;
  /** color medio de los LEDs y de las LineBars de cada lado (0 = x<0, 1 = x>0): ilumina al público de las gradas */
  ledAvg = [new THREE.Color(), new THREE.Color()]; barAvg = [new THREE.Color(), new THREE.Color()];
  private ledSide: number[][] = [[], []];
  constructor(public th: Theme, public quality: 'baja' | 'media' | 'alta', prev?: LightRig) {
    const ids: GroupId[] = ['heads', 'linebars', 'washes', 'leds'];
    this.groups = {} as any;
    for (const id of ids) {
      const reuse = prev && (prev.th.id === th.id || !prev.auto);
      const g: Group = prev && reuse ? { ...prev.groups[id], fixtures: [] } : { id, A: defState(th, id, 'A'), B: defState(th, id, 'B'), sel: 'ALL', fixtures: [] };
      this.groups[id] = g;
    }
    if (prev) { this.auto = prev.auto; this.followTarget = prev.followTarget; }
    this.build();
  }
  dispose() { this.root.traverse((o: any) => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); this.root.removeFromParent(); }

  private build() {
    const q = this.quality;
    const nHeads = q === 'baja' ? 6 : q === 'media' ? 10 : 14, nWash = q === 'baja' ? 4 : 6, nBars = q === 'baja' ? 4 : q === 'media' ? 6 : 8;
    const pools = q !== 'baja';
    const bodyM = new THREE.MeshLambertMaterial({ color: 0x15171c });
    // --- Heads en el anillo del techo
    for (let i = 0; i < nHeads; i++) {
      const a = (i + 0.5) / nHeads * Math.PI * 2;
      const pos = new THREE.Vector3(Math.sin(a) * 10.2, 8.15, Math.cos(a) * 10.2);
      this.groups.heads.fixtures.push(this.mkMover(pos, i, nHeads, bodyM, 0.16, 0.05, pools, 16));
    }
    // --- Washes: en el disco central del techo (luz amplia y suave)
    for (let i = 0; i < nWash; i++) {
      const a = i / nWash * Math.PI * 2 + 0.3;
      const pos = new THREE.Vector3(Math.sin(a) * 3.0, 6.95, Math.cos(a) * 3.0);
      const f = this.mkMover(pos, i, nWash, bodyM, 0.55, 0.22, pools, 12);
      f.mat!.uniforms.uSoft.value = 2.6; this.groups.washes.fixtures.push(f);
    }
    // luces reales (pocas): tiñen el plató con el color de los washes
    for (let k = 0; k < (q === 'baja' ? 1 : 2); k++) { const l = new THREE.PointLight(0xffffff, 0, 16, 1.5); l.position.set(k ? -3 : 3, 5.5, k ? -2 : 2); this.root.add(l); this.washLights.push(l); }
    // --- LineBars: barras LED en el suelo junto a las paredes, con abanico de haces
    const PIX = 6; const barGeo = new THREE.BoxGeometry(0.16, 0.08, 0.06);
    this.barMesh = new THREE.InstancedMesh(barGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), nBars * PIX);
    this.barMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(nBars * PIX * 3), 3);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < nBars; i++) {
      const side = i % 2 ? 1 : -1, k = Math.floor(i / 2), kn = Math.ceil(nBars / 2);
      const a = side * THREE.MathUtils.lerp(A0 + 0.25, A1 - 0.15, (k + 0.5) / kn);
      const r = WALL_R - 1.25; const pos = new THREE.Vector3(Math.sin(a) * r, 0.12, Math.cos(a) * r);
      const bar = new THREE.Group(); bar.position.copy(pos); bar.lookAt(0, 0.12, 0); this.root.add(bar);
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.1, 0.12), bodyM); bar.add(body);
      const tiltG = new THREE.Group(); bar.add(tiltG);
      const beams: THREE.BufferGeometry[] = []; const pix: number[] = [];
      for (let p = 0; p < PIX; p++) {
        const x = (p - (PIX - 1) / 2) * 0.18;
        const g = new THREE.CylinderGeometry(0.025, 0.22, 7, 8, 1, true); g.translate(0, 3.5, 0); g.translate(x, 0.06, 0); beams.push(g);
        const v = new THREE.Vector3(x, 0.07, 0.02); bar.localToWorld(v);
        m4.compose(v, bar.quaternion, new THREE.Vector3(1, 1, 1)); const idx = i * PIX + p; this.barMesh.setMatrixAt(idx, m4); pix.push(idx);
      }
      // geometría combinada de los 6 haces
      const merged = mergeGeos(beams); const mat = beamMat(); mat.uniforms.uSoft.value = 1.2;
      // cilindro: uv.y = 1 arriba; aquí el origen está abajo -> invertir
      const uv = merged.getAttribute('uv') as THREE.BufferAttribute; for (let j = 0; j < uv.count; j++) uv.setY(j, 1 - uv.getY(j));
      const beam = new THREE.Mesh(merged, mat); tiltG.add(beam);
      this.groups.linebars.fixtures.push({ sub: i % 2 ? 'B' : 'A', n: i, N: nBars, pos, inward: new THREE.Vector3(-pos.x, 0, -pos.z).normalize(), beam, mat, bar: tiltG, pan: 0, tilt: 0, vp: 0, vt: 0, inten: 0, color: new THREE.Color(), rndPh: Math.random() * 6, pix });
    }
    this.barMesh.instanceMatrix.needsUpdate = true; this.root.add(this.barMesh);
    // --- LEDs: tiras de píxeles (mesa central, bordes de los anillos y base de las paredes)
    const ledPts: THREE.Vector3[] = [], ledFix: number[][] = [];
    const strip = (pts: THREE.Vector3[]) => { const ids: number[] = []; for (const p of pts) { ids.push(ledPts.length); ledPts.push(p); } ledFix.push(ids); };
    const nTab = q === 'baja' ? 24 : 40;
    for (let s = 0; s < 4; s++) { const pts: THREE.Vector3[] = []; for (let i = 0; i < nTab / 4; i++) { const a = (s + i / (nTab / 4)) / 4 * Math.PI * 2; pts.push(new THREE.Vector3(Math.sin(a) * (TABLE_R + 0.03), 0.06, Math.cos(a) * (TABLE_R + 0.03))); } strip(pts); }
    for (const sg of [-1, 1]) for (const rr of [RING_IN - 0.03, RING_OUT + 0.05]) {
      const pts: THREE.Vector3[] = []; const n = q === 'baja' ? 12 : 20;
      for (let i = 0; i < n; i++) { const a = sg * THREE.MathUtils.lerp(A0 + 0.05, A1 - 0.05, i / (n - 1)); pts.push(new THREE.Vector3(Math.sin(a) * rr, rr < 6 ? TOP + 0.02 : 0.06, Math.cos(a) * rr)); }
      if (rr > 6) this.ledSide[sg < 0 ? 0 : 1].push(...pts.map((_, i) => ledPts.length + i));
      strip(pts);
    }
    for (const sg of [-1, 1]) { const pts: THREE.Vector3[] = []; const n = q === 'baja' ? 12 : 22; for (let i = 0; i < n; i++) { const a = sg * THREE.MathUtils.lerp(0.5, 2.6, i / (n - 1)); pts.push(new THREE.Vector3(Math.sin(a) * (WALL_R - 0.12), 1.22, Math.cos(a) * (WALL_R - 0.12))); } this.ledSide[sg < 0 ? 0 : 1].push(...pts.map((_, i) => ledPts.length + i)); strip(pts); }
    this.ledMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), ledPts.length);
    this.ledMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(ledPts.length * 3), 3);
    ledPts.forEach((p, i) => { m4.makeTranslation(p.x, p.y, p.z); this.ledMesh.setMatrixAt(i, m4); });
    this.root.add(this.ledMesh);
    ledFix.forEach((ids, i) => this.groups.leds.fixtures.push({ sub: i % 2 ? 'B' : 'A', n: i, N: ledFix.length, pos: ledPts[ids[0]], inward: new THREE.Vector3(), pan: 0, tilt: 0, vp: 0, vt: 0, inten: 0, color: new THREE.Color(), rndPh: Math.random() * 6, pix: ids }));
  }

  private mkMover(pos: THREE.Vector3, i: number, N: number, bodyM: THREE.Material, r0: number, len0: number, pool: boolean, seg: number): Fixture {
    const head = new THREE.Group(); head.position.copy(pos); this.root.add(head);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.34, 10), bodyM); body.position.y = 0.17; head.add(body);
    const g = new THREE.CylinderGeometry(r0 * 0.4, 1, 14, seg, 1, true); g.translate(0, -7, 0);
    const mat = beamMat(); const beam = new THREE.Mesh(g, mat); beam.frustumCulled = false; head.add(beam);
    const lens = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow(), color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    lens.scale.setScalar(0.7); head.add(lens);
    let poolM: THREE.Mesh | undefined;
    if (pool) { poolM = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ map: glow(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, color: 0xffffff })); poolM.rotation.x = -Math.PI / 2; this.root.add(poolM); }
    return { sub: i % 2 ? 'B' : 'A', n: i, N, pos, inward: new THREE.Vector3(-pos.x, 0, -pos.z).normalize(), head, beam, mat, lens, pool: poolM, pan: 0, tilt: 0.5, vp: 0, vt: 0, inten: 0, color: new THREE.Color(), rndPh: Math.random() * 6 };
  }

  // ---------- control ----------
  targets(g: Group): SubState[] { return g.sel === 'ALL' ? [g.A, g.B] : [g[g.sel]]; }
  set(gid: GroupId, fn: (s: SubState) => void, user = true) {
    const g = this.groups[gid]; for (const s of this.targets(g)) { fn(s); s.t0 = this.t; }
    if (user) this.auto = false; this.onChange?.();
  }
  reset(gid: GroupId) { const g = this.groups[gid]; for (const sub of ['A', 'B'] as Sub[]) if (g.sel === 'ALL' || g.sel === sub) g[sub] = defState(this.th, gid, sub); this.onChange?.(); }
  setTheme(th: Theme) { this.th = th; }

  /** Eventos del programa (solo en modo AUTO) */
  event(e: 'eleccion' | 'duelo' | 'acierto' | 'caida' | 'fallo' | 'final' | 'ganador' | 'intro' | 'outro', at?: THREE.Vector3) {
    if (!this.auto) return;
    const all = (fn: (s: SubState, id: GroupId) => void) => { for (const id of Object.keys(this.groups) as GroupId[]) for (const s of [this.groups[id].A, this.groups[id].B]) { fn(s, id); s.t0 = this.t; } };
    const th = this.th; let dur = 3;
    switch (e) {
      case 'eleccion': all((s, id) => { s.colors = [th.glow, th.accent]; s.colorMode = 'GRADIENT'; s.rainbow = false; s.state = 'O'; s.stateCue = id === 'leds' ? 1 : 0; s.move = 'CIRCLE'; s.mspeed = 'MEDIUM'; s.follow = false; }); dur = 4; break;
      case 'duelo': all((s, id) => { s.colors = [0x0040ff, 0xffffff]; s.colorMode = 'SECOND'; s.state = 'O'; s.stateCue = id === 'leds' ? 12 : 0; s.move = 'IN'; s.mspeed = 'SLOW'; s.bright = id === 'washes' ? 0.6 : 0.9; }); dur = 999; break;
      case 'acierto': all((s) => { s.colors = [0x00ff3c, 0xffffff]; s.colorMode = 'SWITCH'; s.state = 'FLASH'; s.stateCue = 0; s.move = 'WIDE'; s.mspeed = 'FAST'; s.bright = 1; }); dur = 2.5; break;
      case 'caida': all((s, id) => { s.colors = [0xff0000]; s.colorMode = ''; s.state = id === 'heads' ? 'O' : 'STROBE'; s.stateCue = 0; s.follow = id === 'heads' && !!at; s.mspeed = 'FAST'; }); this.pointAt = at || null; dur = 2.8; break;
      case 'fallo': all((s) => { s.colors = [0xff0000, 0x400000]; s.colorMode = 'SMOOTH'; s.state = 'O'; s.move = 'U/D'; s.mspeed = 'SLOW'; }); dur = 4; break;
      case 'final': all((s, id) => { s.rainbow = false; s.colorCue = 0; s.colors = id === 'leds' ? [0xffb000, 0xff6a00] : [0xffb000, 0xffd9a0, 0xffffff]; s.colorMode = 'GRADIENT'; s.state = 'O'; s.stateCue = id === 'leds' ? 3 : 0; s.move = 'RANDOM CIRCLE'; s.mspeed = 'MEDIUM'; s.bright = 1; }); dur = 999; break;
      case 'ganador': all((s) => { s.rainbow = true; s.colorMode = 'GRADIENT'; s.state = 'O'; s.stateCue = 1; s.move = 'CIRCLE'; s.mspeed = 'FAST'; }); this.groups.heads.B.move = 'PÚBLICO'; dur = 8; break;
      case 'intro': case 'outro': all((s) => { s.rainbow = true; s.colorMode = 'GRADIENT'; s.state = 'O'; s.stateCue = 0; s.move = 'RANDOM CIRCLE'; s.mspeed = 'MEDIUM'; s.follow = false; }); this.groups.heads.B.move = 'PÚBLICO'; dur = 10; break;
    }
    this.eventUntil = this.t + dur; this.onChange?.();
  }
  pointAt: THREE.Vector3 | null = null;

  /** Programa automático: cambia de "look" cada pocos segundos */
  private autoStep() {
    if (this.t < this.eventUntil || this.t < this.nextAuto) return;
    this.nextAuto = this.t + 7 + Math.random() * 5;
    const th = this.th; const pal = [th.glow, th.accent, 0xffffff, SWATCHES[Math.floor(Math.random() * SWATCHES.length)]];
    const modes: ColorMode[] = ['', 'SECOND', 'SMOOTH', 'GRADIENT', 'SWITCH'];
    const mv = ['SMTILT', 'SMPAN', 'CIRCLE', 'RANDOM CIRCLE', 'WIDE', 'CROSS', 'SLPAN', 'TILT', 'PÚBLICO', 'PÚBLICO'];
    for (const id of Object.keys(this.groups) as GroupId[]) {
      const g = this.groups[id]; const cm = modes[Math.floor(Math.random() * modes.length)]; const m = mv[Math.floor(Math.random() * mv.length)];
      for (const s of [g.A, g.B]) {
        s.colors = [pal[Math.floor(Math.random() * 3)], pal[Math.floor(Math.random() * pal.length)]]; s.rainbow = Math.random() < 0.08;
        s.colorMode = cm; s.state = 'O'; s.stateCue = id === 'leds' ? [0, 1, 4, 12][Math.floor(Math.random() * 4)] : (Math.random() < 0.15 ? 4 : 0);
        s.move = m; s.mspeed = Math.random() < 0.6 ? 'SLOW' : 'MEDIUM'; s.follow = false; s.bright = id === 'washes' ? 0.7 : 1; s.beam = Math.random() < 0.15 && id === 'heads' ? 'GOBO' : 'BEAM'; s.goboRot = s.beam === 'GOBO';
      }
    }
    this.onChange?.();
  }

  // ---------- cálculo por aparato ----------
  private colorOf(s: SubState, f: Fixture, u: number, out: THREE.Color) {
    const t = this.t * s.cueSpeed; let cols = s.colors.length ? s.colors : [0xffffff]; let mode = s.colorMode; let rainbow = s.rainbow;
    if (s.colorCue) { const cc = COLOR_CUES[s.colorCue - 1]; cols = cc.cols.length ? cc.cols : cols; mode = cc.mode; rainbow = !!cc.rainbow; }
    const step = Math.floor(t * 1.5);
    if (rainbow) { out.setHSL(((mode === 'GRADIENT' ? u : 0) + t * 0.08) % 1, 1, 0.5); return; }
    const n = cols.length;
    switch (mode) {
      case 'SECOND': out.setHex(cols[(f.n % 2) % n]); break;
      case 'SWITCH': out.setHex(cols[(step + (s.groupRandom ? Math.floor(hash(f.n, step) * n) : 0)) % n]); break;
      case 'SMOOTH': { const x = t * 0.5; const k = Math.floor(x); out.setHex(cols[k % n]).lerp(C2.setHex(cols[(k + 1) % n]), x - k); break; }
      case 'GRADIENT': { const x = (u * n + t * 0.4) % n; const k = Math.floor(x); out.setHex(cols[k % n]).lerp(C2.setHex(cols[(k + 1) % n]), x - k); break; }
      case 'FLASH': out.setHex(cols[step % n]); break;
      default: out.setHex(cols[0]);
    }
  }
  private intensityOf(s: SubState, f: Fixture, u: number, N: number) {
    const t = (this.t - (s.loop ? 0 : s.t0)) * s.cueSpeed; const step = Math.floor(t * 2);
    let n = f.n; if (s.groupRandom) n = Math.floor(hash(f.n, 7) * 1000) % N;
    let v = 1;
    switch (s.state) {
      case 'O': case 'FO': v = 1; break;
      case 'X': case 'FX': v = 0; break;
      case 'RAND': v = hash(n, step) > 0.5 ? 1 : 0; break;
      case 'FRAND': v = 0.5 + 0.5 * Math.sin(t * 2 + hash(n, 3) * 6.28); break;
      case 'ORAND': v = Math.floor(hash(step, 1) * N) === n ? 1 : 0.05; break;
      case 'BRAND': v = hash(Math.floor(n / Math.max(1, Math.floor(N / 3))), step) > 0.45 ? 1 : 0; break;
      case 'STROBE': v = (t * 12) % 1 < 0.35 ? 1 : 0; break;
      case 'FLASH': v = Math.exp(-((t * 2) % 1) * 5); break;
    }
    if (s.colorMode === 'FLASH' && !s.colorCue) v *= Math.exp(-((t * 1.5) % 1) * 4);
    if (s.stateCue) {
      const k = s.stateCue; let c = 1; const len = s.loop ? Infinity : N * 2;
      const st = Math.min(step, len);
      switch (k) {
        case 1: c = st % N === n ? 1 : 0.08; break; // persecución
        case 2: { const p = st % (2 * N - 2 || 1); c = (p < N ? p : 2 * N - 2 - p) === n ? 1 : 0.08; break; } // ida y vuelta
        case 3: c = Math.abs(n - (N - 1) / 2) <= (st % Math.ceil(N / 2)) + 0.5 ? 1 : 0.1; break; // del centro hacia fuera
        case 4: c = 0.5 + 0.5 * Math.sin(t * 3 - u * 6.28); break; // ola
        case 5: c = (n + st) % 2 ? 1 : 0.05; break; // A/B alternos
        case 6: c = (n + st) % 3 === 0 ? 1 : 0.05; break;
        case 7: c = n <= st % (N + 1) ? 1 : 0.05; break; // llenado
        case 8: c = hash(n, st) > 0.7 ? 1 : 0.15; break; // chispas
        case 9: c = Math.floor(n / 2) % 2 === st % 2 ? 1 : 0.05; break; // parejas
        case 10: c = 0.5 + 0.5 * Math.sin(t * 9 - u * 12); break;
        case 11: c = (n % 2 === 0) ? ((t * 12) % 1 < 0.4 ? 1 : 0) : 1; break;
        case 12: c = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.4)); break; // respiración
      }
      v *= c;
    }
    return v * s.bright;
  }
  private aim(s: SubState, f: Fixture, u: number, dt: number, tiltOnly: boolean) {
    const w = MSPEED[s.mspeed] * 1.4; if (!(f as any).mt) (f as any).mt = 0; (f as any).mt += dt * w; const T = (f as any).mt;
    const sideSign = f.sub === 'B' ? -1 : 1;
    let tilt = (s.tiltNeg ? -1 : 1) * s.tilt, pan = (s.pan - 60) * (s.panNeg ? sideSign : 1); // grados
    const ph = f.n * 0.6, rph = f.rndPh;
    switch (s.move) {
      case 'WIDE': pan += (u - 0.5) * 140; tilt += 15; break;
      case 'IN': pan = 0; tilt = tiltOnly ? 10 : 42; break;
      case 'CROSS': pan += sideSign * 45; break;
      case 'U/D': tilt = f.sub === 'A' ? 8 : 95; break;
      case 'TILT': tilt += Math.sin(T) * 35; break;
      case 'RTILT': tilt += (hash(f.n, Math.floor(T / 1.5)) - 0.5) * 80; break;
      case 'SMTILT': tilt += Math.sin(T + ph) * 30; break;
      case 'SLTILT': tilt += Math.sin(T * 0.6 + (f.sub === 'B' ? Math.PI : 0)) * 40; break;
      case 'PAN': pan += Math.sin(T) * 50; break;
      case 'RPAN': pan += (hash(f.n, Math.floor(T / 1.5) + 9) - 0.5) * 120; break;
      case 'SMPAN': pan += Math.sin(T + ph) * 45; break;
      case 'SLPAN': pan += Math.sin(T * 0.6 + (f.sub === 'B' ? Math.PI : 0)) * 60; break;
      case 'CIRCLE': pan += Math.cos(T) * 35; tilt += Math.sin(T) * 22; break;
      case 'RANDOM CIRCLE': pan += Math.cos(T + rph) * 35; tilt += Math.sin(T + rph) * 22; break;
    }
    let tp = THREE.MathUtils.degToRad(pan), tt = THREE.MathUtils.degToRad(THREE.MathUtils.clamp(tilt, -120, 120));
    if (s.move === 'PÚBLICO' && !tiltOnly) {
      // barrido por las gradas: el haz recorre las filas del público que tiene debajo
      const lat = Math.sin(T * 0.8 + ph) * 3.2, inw = 0.9 + 0.45 * Math.sin(T * 1.3 + rph);
      tp = Math.atan2(lat, inw); tt = Math.atan2(Math.hypot(lat, inw), Math.max(1, f.pos.y - 2.7));
    } else if (s.move === 'PÚBLICO') tt = THREE.MathUtils.degToRad(-10 + Math.sin(T + ph) * 25);
    // seguir al jugador o a un punto
    const tgt = s.follow ? (this.pointAt || this.followTarget?.() || null) : null;
    if (tgt && !tiltOnly) {
      const d = tgt.clone().sub(f.pos); const hd = Math.hypot(d.x, d.z);
      tt = Math.atan2(hd, -d.y); const fwd = f.inward; const ang = Math.atan2(d.x, d.z) - Math.atan2(fwd.x, fwd.z);
      tp = Math.atan2(Math.sin(ang), Math.cos(ang));
    }
    if (s.overshoot) { // muelle con rebote
      const k = 40, damp = 5; f.vp += ((tp - f.pan) * k - f.vp * damp) * dt; f.vt += ((tt - f.tilt) * k - f.vt * damp) * dt; f.pan += f.vp * dt; f.tilt += f.vt * dt;
    } else { const a = Math.min(1, dt * 4.5); f.pan += (tp - f.pan) * a; f.tilt += (tt - f.tilt) * a; f.vp = f.vt = 0; }
  }

  update(dt: number) {
    this.t += dt;
    if (this.auto) this.autoStep();
    const dir = new THREE.Vector3(), q = new THREE.Quaternion(), down = new THREE.Vector3(0, -1, 0);
    const washCol = new THREE.Color(0, 0, 0); let washN = 0;
    for (const id of ['heads', 'washes'] as GroupId[]) {
      const g = this.groups[id]; const N = g.fixtures.length;
      for (const f of g.fixtures) {
        const s = g[f.sub]; const u = N > 1 ? f.n / (N - 1) : 0;
        this.colorOf(s, f, u, f.color);
        const target = this.intensityOf(s, f, u, N);
        const fadeK = (s.state === 'FO' || s.state === 'FX') ? dt / (1.2 * s.fadeSpeed) : Math.min(1, dt * 25 / s.fadeSpeed);
        f.inten += (target - f.inten) * Math.min(1, fadeK * (s.state === 'FO' || s.state === 'FX' ? 3 : 1));
        this.aim(s, f, u, dt, false);
        // dirección: tilt desde la vertical hacia dentro, pan alrededor de Y
        const h = f.inward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), f.pan);
        dir.copy(h).multiplyScalar(Math.sin(f.tilt)).addScaledVector(down, Math.cos(f.tilt)).normalize();
        q.setFromUnitVectors(down, dir); f.beam!.quaternion.copy(q); (f.dirW ||= new THREE.Vector3()).copy(dir);
        const wash = id === 'washes';
        const thick = s.thick, spread = s.spread * (wash ? 2.4 : 1);
        const tw = Math.sqrt(thick); f.beam!.scale.set((wash ? 1.6 : 0.55) * spread * tw, wash ? 0.7 : 1, (wash ? 1.6 : 0.55) * spread * tw);
        (f.beam!.geometry as any).__t = thick;
        f.beam!.visible = s.beam !== 'NO BEAM' && f.inten > 0.01;
        const m = f.mat!; m.uniforms.uColor.value.copy(f.color); m.uniforms.uI.value = f.inten * (wash ? 0.10 : 0.30) * Math.min(2.5, 0.6 + 0.4 * thick);
        m.uniforms.uGobo.value = s.beam === 'GOBO' ? 1 : 0; if (s.goboRot) m.uniforms.uRot.value += dt * 0.6 * s.cueSpeed;
        m.uniforms.uSoft.value = (wash ? 2.6 : 1.6) / Math.max(0.3, thick);
        (f.lens!.material as THREE.SpriteMaterial).color.copy(f.color).multiplyScalar(f.inten); f.lens!.scale.setScalar((wash ? 1.1 : 0.7) * (0.5 + 0.5 * f.inten));
        if (f.pool) {
          // mancha de luz en el suelo
          const yFloor = 0.02; const tHit = (f.pos.y - yFloor) / Math.max(0.05, -dir.y);
          const hit = f.pos.clone().addScaledVector(dir, tHit); const r = Math.hypot(hit.x, hit.z);
          const y = r < TABLE_R ? TOP + 0.02 : yFloor; hit.addScaledVector(dir, (y - hit.y) / (dir.y || -1));
          const ok = dir.y < -0.15 && Math.hypot(hit.x, hit.z) < WALL_R - 0.5;
          f.pool.visible = ok && f.inten > 0.02; f.pool.position.set(hit.x, y + 0.01, hit.z);
          const rad = Math.min(5, tHit * (wash ? 0.16 : 0.05) * spread * 2 + 0.3);
          f.pool.scale.setScalar(rad); (f.pool.material as THREE.MeshBasicMaterial).color.copy(f.color).multiplyScalar(f.inten * (wash ? 0.35 : 0.55));
        }
        if (wash) { washCol.add(C.copy(f.color).multiplyScalar(f.inten)); washN++; }
      }
    }
    if (washN) { washCol.multiplyScalar(1 / washN); this.washLights.forEach(l => { l.color.copy(washCol); l.intensity = 30 * Math.max(washCol.r, washCol.g, washCol.b); }); }
    // LineBars
    { const g = this.groups.linebars; const N = g.fixtures.length; const ic = this.barMesh!.instanceColor!;
      for (const f of g.fixtures) {
        const s = g[f.sub]; const u = N > 1 ? f.n / (N - 1) : 0;
        const target = this.intensityOf(s, f, u, N); f.inten += (target - f.inten) * Math.min(1, dt * 25 / s.fadeSpeed);
        this.aim(s, f, u, dt, true);
        f.bar!.rotation.x = THREE.MathUtils.clamp(f.tilt, -1.4, 1.4) * 0.8 - 0.25;
        this.colorOf(s, f, u, f.color);
        f.pix!.forEach((pi, k) => { this.colorOf(s, f, (f.n * 6 + k) / (N * 6), C); C.multiplyScalar(0.15 + f.inten * 1.6); ic.setXYZ(pi, C.r, C.g, C.b); });
        f.beam!.visible = s.beam !== 'NO BEAM' && f.inten > 0.01; f.beam!.scale.set(s.thick, 1, s.thick);
        f.mat!.uniforms.uColor.value.copy(f.color); f.mat!.uniforms.uI.value = f.inten * 0.22;
      }
      ic.needsUpdate = true; }
    // LEDs
    { const g = this.groups.leds; const ic = this.ledMesh.instanceColor!; const total = this.ledMesh.count; let gi = 0;
      for (const f of g.fixtures) {
        const s = g[f.sub];
        f.pix!.forEach((pi, k) => {
          const u = (gi + k) / total; const pf = { ...f, n: gi + k } as Fixture;
          this.colorOf(s, pf, u, C); const v = this.intensityOf(s, pf, u, total);
          C.multiplyScalar(0.05 + v * 1.5); ic.setXYZ(pi, C.r, C.g, C.b);
        });
        gi += f.pix!.length;
      }
      ic.needsUpdate = true;
      const arr = ic.array as Float32Array;
      for (let sd = 0; sd < 2; sd++) { const ids = this.ledSide[sd]; const o = this.ledAvg[sd].setRGB(0, 0, 0); for (const i of ids) { o.r += arr[i * 3]; o.g += arr[i * 3 + 1]; o.b += arr[i * 3 + 2]; } if (ids.length) o.multiplyScalar(1 / ids.length); } }
    { const bs = this.barAvg; bs[0].setRGB(0, 0, 0); bs[1].setRGB(0, 0, 0); const n = [0, 0];
      for (const f of this.groups.linebars.fixtures) { const sd = f.pos.x < 0 ? 0 : 1; if (f.beam!.visible) bs[sd].add(C.copy(f.color).multiplyScalar(f.inten)); n[sd]++; }
      for (let sd = 0; sd < 2; sd++) if (n[sd]) bs[sd].multiplyScalar(1 / n[sd]); }
  }
}

function mergeGeos(gs: THREE.BufferGeometry[]) {
  // fusión simple (posiciones, normales, uv e índices)
  let vc = 0, ic = 0; for (const g of gs) { vc += g.getAttribute('position').count; ic += g.index!.count; }
  const pos = new Float32Array(vc * 3), nor = new Float32Array(vc * 3), uv = new Float32Array(vc * 2), idx = new Uint32Array(ic);
  let vo = 0, io = 0;
  for (const g of gs) {
    const p = g.getAttribute('position'), n = g.getAttribute('normal'), u = g.getAttribute('uv'), I = g.index!;
    pos.set(p.array as Float32Array, vo * 3); nor.set(n.array as Float32Array, vo * 3); uv.set(u.array as Float32Array, vo * 2);
    for (let i = 0; i < I.count; i++) idx[io + i] = I.getX(i) + vo;
    vo += p.count; io += I.count;
  }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); m.setIndex(new THREE.BufferAttribute(idx, 1));
  return m;
}
