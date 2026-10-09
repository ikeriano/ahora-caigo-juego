import * as THREE from 'three';
import { LightRig } from './lights';
import { Studio, TOP, PLATO } from './set3d';
import type { LookId } from './plato-virtual';
import { Theme } from './themes';
import { Person, makeMannequin, makeHost, animatePerson } from './people';
import { Audience } from './audience';

export const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || (matchMedia('(pointer:coarse)').matches);

interface Mover { p: Person; target: THREE.Vector3; speed: number; resolve: () => void }
interface Faller { p: Person; v: number; y0: number; resolve: () => void; t: number }
type Shot = { pos: THREE.Vector3; look: THREE.Vector3 };

export class Engine {
  renderer: THREE.WebGLRenderer; scene = new THREE.Scene(); camera: THREE.PerspectiveCamera;
  studio!: Studio; theme!: Theme; lights: LightRig | null = null;
  /** público de las gradas (v1.3); null si está desactivado en Opciones */
  audience: Audience | null = null; showAudience = true; audienceMs = 0;
  player!: Person; host!: Person; opps: Person[] = [];
  clock = new THREE.Clock();
  // control de cámara
  mode: 'walk' | 'cine' = 'cine';
  yaw = Math.PI; pitch = 0.18; dist = 3.6; firstPerson = false;
  move = new THREE.Vector2(); keys = new Set<string>(); canWalk = false; running = false;
  cineFrom: Shot = { pos: new THREE.Vector3(), look: new THREE.Vector3() }; cineTo: Shot = { pos: new THREE.Vector3(0, 6, 14), look: new THREE.Vector3(0, 1, 0) };
  cineT = 1; cineDur = 1; orbit: { c: THREE.Vector3; r: number; h: number; a: number; speed: number; lookY: number } | null = null;
  shake = 0; freeLook = { yaw: 0, pitch: 0 };
  movers: Mover[] = []; fallers: Faller[] = [];
  onFrame: ((dt: number) => void)[] = [];
  /** Pantalla partida (pruebas Entre tres / Adivina): dos planos [posición, mirada] lado a lado */
  split: { a: [THREE.Vector3, THREE.Vector3]; b: [THREE.Vector3, THREE.Vector3] } | null = null;
  private camB = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  fps = 60; private fpsAcc = 0; private fpsN = 0;
  logoUrl: string;
  override: { scene: THREE.Scene; camera: THREE.Camera; update: (dt: number) => void } | null = null;

  constructor(canvas: HTMLCanvasElement, logoUrl: string) {
    this.logoUrl = logoUrl;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.15;
    this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 80);
    this.camera.position.set(0, 6, 15);
    addEventListener('resize', () => this.resize()); this.resize();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  quality: 'baja' | 'media' | 'alta' = isMobile ? 'media' : 'alta';
  onLights: ((r: LightRig) => void) | null = null;
  buildLights() {
    const prev = this.lights; const q = this.quality === 'baja' || this.quality === 'media' || this.quality === 'alta' ? this.quality : 'media';
    const r = new LightRig(this.theme, q, prev || undefined); prev?.dispose();
    r.onEvent = (e) => this.lookEvent(e);
    r.followTarget = () => this.player ? this.player.root.position.clone().setY(this.player.root.position.y + 1.2) : null;
    this.lights = r; this.scene.add(r.root); this.onLights?.(r);
  }
  setQuality(q: 'baja' | 'media' | 'alta') {
    const changed = this.quality !== q;
    this.quality = q; if (changed && this.theme) { this.buildLights(); this.buildAudience(); }
    const dpr = devicePixelRatio || 1;
    this.renderer.setPixelRatio(q === 'baja' ? Math.min(dpr, 1) * 0.7 : q === 'media' ? Math.min(dpr, 1.25) : Math.min(dpr, 2));
    this.resize();
  }
  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h;
    this.camera.fov = w / h < 1.4 ? 68 : 58; this.camera.updateProjectionMatrix();
  }

  setTheme(th: Theme) {
    this.gold = false;
    if (this.studio) { this.scene.remove(this.studio.root); dispose(this.studio.root); }
    for (const o of this.opps) this.scene.remove(o.root);
    if (this.player) this.scene.remove(this.player.root);
    if (this.host) this.scene.remove(this.host.root);
    this.theme = th;
    this.studio = new Studio(th, this.logoUrl, isMobile);
    this.scene.add(this.studio.root); this.applyLook();
    this.scene.background = new THREE.Color(th.bg);
    this.scene.fog = new THREE.FogExp2(th.fog, this.fogDensity());
    this.player = makeMannequin({ shirt: 0xf3b21a }); this.scene.add(this.player.root);
    this.buildLights();
    this.buildAudience();
    this.host = makeHost(th.host); this.scene.add(this.host.root);
    this.opps = [];
    for (let i = 1; i <= 10; i++) { const p = makeMannequin(); this.opps.push(p); this.scene.add(p.root); }
    this.resetPositions();
  }

  buildAudience() {
    this.audience?.dispose(); this.audience = null;
    if (!this.showAudience || !this.theme) return;
    const q = this.quality === 'baja' || this.quality === 'media' || this.quality === 'alta' ? this.quality : 'media';
    this.audience = new Audience(this.theme, q); this.scene.add(this.audience.root);
  }
  setAudienceVisible(on: boolean) { if (on === this.showAudience && (!!this.audience === on)) return; this.showAudience = on; this.buildAudience(); }

  /** Decorado dorado del Juego Final (como el 'decdesafiofinal' del Scratch). Solo cambia el plató, no los personajes. */
  gold = false;
  /** se llama tras mover la cámara (efectos de la cabecera) */
  extraUpdate: ((dt: number) => void) | null = null;
  setGoldSet(on: boolean) {
    if (on === this.gold || !this.studio) return;
    this.gold = on;
    const th: Theme = on ? { ...this.theme, wallA: '#5a2200', wallB: '#e0820c', chevA: '#fff0a8', chevB: '#ffb21a', glow: 0xffb21a, accent: 0xffe08a, fog: 0x140800, bg: 0x0a0400, gold: true } : this.theme;
    const cols = this.studio.holes.map(h => h.activeMat.color.getHex()); const st = this.studio.holes.map(h => [h.open, h.target]);
    this.scene.remove(this.studio.root); dispose(this.studio.root);
    this.studio = new Studio(th, this.logoUrl, isMobile); this.scene.add(this.studio.root); this.applyLook();
    this.studio.holes.forEach((h, i) => { this.studio.setHoleColor(i, cols[i] ?? 0xffffff); h.open = st[i]?.[0] ?? 0; h.target = st[i]?.[1] ?? 0; });
    this.scene.background = new THREE.Color(th.bg); this.scene.fog = new THREE.FogExp2(th.fog, this.fogDensity());
  }

  /** Luces del plató virtual: 'auto' (cambian con el programa) o un look fijo elegido en Opciones */
  platoLuz: 'auto' | LookId = 'auto'; autoLook: LookId = 'morado';
  fogDensity() { return PLATO === 'virtual' ? 0.008 : 0.028; }
  applyLook() { this.studio?.setLook(this.platoLuz === 'auto' ? this.autoLook : this.platoLuz); }
  /** look automático según el momento del programa (lo llaman los eventos de luces) */
  lookEvent(e: string) {
    const m: Record<string, LookId> = { intro: 'cian', final: 'cian', ganador: 'cian', outro: 'blanco', eleccion: 'morado', duelo: 'morado', menu: 'cian', entrenamiento: 'blanco', blanco: 'blanco', normal: 'morado' };
    const l = m[e]; if (!l || l === this.autoLook) return; this.autoLook = l; this.applyLook();
  }

  resetPositions() {
    this.studio.holes.forEach(h => { h.target = 0; h.open = 0; });
    this.opps.forEach((p, i) => { const h = this.studio.holes[i + 1]; p.root.visible = true; p.root.position.copy(h.pos); this.face(p, new THREE.Vector3(0, 0, 0)); });
    this.player.root.visible = true; this.player.root.position.set(0, 0, 10); this.player.root.rotation.y = Math.PI;
    this.host.root.visible = true; this.host.root.position.set(2.35, TOP, 1.5); this.face(this.host, new THREE.Vector3(0, 0, 8));
    this.fallers = []; this.movers = [];
  }

  face(p: Person, at: THREE.Vector3) { const d = at.clone().sub(p.root.position); p.root.rotation.y = Math.atan2(d.x, d.z); }

  walkTo(p: Person, target: THREE.Vector3, speed = 1.6): Promise<void> {
    this.movers = this.movers.filter(m => m.p !== p);
    return new Promise(res => this.movers.push({ p, target: target.clone(), speed, resolve: res }));
  }

  fall(p: Person, holeIdx: number): Promise<void> {
    const h = this.studio.holes[holeIdx]; h.target = 1;
    return new Promise(res => this.fallers.push({ p, v: 0, y0: p.root.position.y, resolve: res, t: -0.12 }));
  }

  // ---------- cámara ----------
  cut(pos: THREE.Vector3, look: THREE.Vector3) { this.mode = 'cine'; this.orbit = null; this.cineTo = { pos: pos.clone(), look: look.clone() }; this.cineT = 1; this.cineDur = 0.001; this.camera.position.copy(pos); this.camera.lookAt(look); this.freeLook = { yaw: 0, pitch: 0 }; }
  glide(pos: THREE.Vector3, look: THREE.Vector3, dur = 1.5) {
    this.mode = 'cine'; this.orbit = null;
    const curLook = new THREE.Vector3(); this.camera.getWorldDirection(curLook);
    this.cineFrom = { pos: this.camera.position.clone(), look: this.camera.position.clone().add(curLook.multiplyScalar(this.camera.position.distanceTo(look))) };
    this.cineTo = { pos: pos.clone(), look: look.clone() }; this.cineT = 0; this.cineDur = dur;
    return wait(dur * 1000);
  }
  startOrbit(c: THREE.Vector3, r: number, h: number, a: number, speed: number, lookY = 1) { this.mode = 'cine'; this.orbit = { c: c.clone(), r, h, a, speed, lookY }; }
  walkMode(on: boolean) {
    this.canWalk = on;
    if (on) { this.mode = 'walk'; this.orbit = null; this.yaw = this.player.root.rotation.y + Math.PI; }
  }

  tick() {
    const dt = Math.min(0.05, this.clock.getDelta());
    this.fpsAcc += dt; this.fpsN++; if (this.fpsAcc > 1) { this.fps = this.fpsN / this.fpsAcc; this.fpsAcc = 0; this.fpsN = 0; }
    if (this.override) { this.override.update(dt); this.renderer.render(this.override.scene, this.override.camera); return; }
    if (!this.studio) return;
    this.studio.update(dt);
    this.lights?.update(dt);
    // movimiento del jugador
    let pSpeed = 0;
    if (this.mode === 'walk' && this.canWalk) pSpeed = this.updateWalk(dt);
    animatePerson(this.player, dt, pSpeed);
    // NPCs que caminan
    const speeds = new Map<Person, number>();
    for (const m of [...this.movers]) {
      const pos = m.p.root.position; const d = m.target.clone().sub(pos); d.y = 0; const dist = d.length();
      if (dist < 0.05) { this.movers.splice(this.movers.indexOf(m), 1); m.resolve(); continue; }
      const step = Math.min(dist, m.speed * dt); d.normalize();
      pos.addScaledVector(d, step);
      const h = this.studio.heightAt(pos.x, pos.z); if (h != null) pos.y += (h - pos.y) * Math.min(1, dt * 12);
      m.p.root.rotation.y = lerpAngle(m.p.root.rotation.y, Math.atan2(d.x, d.z), Math.min(1, dt * 10));
      speeds.set(m.p, m.speed);
    }
    for (const p of [this.host, ...this.opps]) animatePerson(p, dt, speeds.get(p) || 0);
    // caídas
    for (const f of [...this.fallers]) {
      f.t += dt; if (f.t < 0) continue;
      f.v += 14 * dt; f.p.root.position.y -= f.v * dt; f.p.body.rotation.x += dt * 0.8;
      f.p.armL.rotation.x = -2.6; f.p.armR.rotation.x = -2.6;
      if (f.p.root.position.y < f.y0 - 4) { f.p.root.visible = false; f.p.body.rotation.x = 0; this.fallers.splice(this.fallers.indexOf(f), 1); f.resolve(); }
    }
    for (const f of this.onFrame) f(dt);
    this.updateCamera(dt);
    this.extraUpdate?.(dt);
    if (this.audience) { const t0 = performance.now(); this.camera.updateMatrixWorld(); this.audience.update(dt, this.lights, this.camera, !!this.split); this.audienceMs = this.audienceMs * 0.95 + (performance.now() - t0) * 0.05; }
    if (this.split) { this.renderSplit(); return; }
    this.renderer.render(this.scene, this.camera);
  }
  private renderSplit() {
    const w = innerWidth, h = innerHeight, r = this.renderer, cam = this.camera, sp = this.split!;
    const fov = cam.fov, asp = cam.aspect;
    r.setScissorTest(true);
    const one = (c: THREE.PerspectiveCamera, v: [THREE.Vector3, THREE.Vector3], x: number) => {
      c.position.copy(v[0]); c.lookAt(v[1]); c.fov = 50; c.aspect = (w / 2) / h; c.updateProjectionMatrix(); c.updateMatrixWorld();
      r.setViewport(x, 0, w / 2, h); r.setScissor(x, 0, w / 2, h); r.render(this.scene, c);
    };
    const keep = cam.position.clone(), q = cam.quaternion.clone();
    one(cam, sp.a, 0); one(this.camB, sp.b, w / 2);
    cam.position.copy(keep); cam.quaternion.copy(q); cam.fov = fov; cam.aspect = asp; cam.updateProjectionMatrix();
    r.setScissorTest(false); r.setViewport(0, 0, w, h);
  }

  updateWalk(dt: number) {
    const k = this.keys; const mv = this.move.clone();
    if (k.has('KeyW') || k.has('ArrowUp')) mv.y += 1; if (k.has('KeyS') || k.has('ArrowDown')) mv.y -= 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) mv.x -= 1; if (k.has('KeyD') || k.has('ArrowRight')) mv.x += 1;
    if (mv.lengthSq() < 0.01) return 0;
    if (mv.length() > 1) mv.normalize();
    const speed = (k.has('ShiftLeft') || this.running ? 4.2 : 2.6) * mv.length();
    // dirección relativa a la cámara
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const dir = fwd.multiplyScalar(mv.y).add(right.multiplyScalar(mv.x)).normalize();
    const pos = this.player.root.position; const cur = pos.y;
    const tryMove = (dx: number, dz: number) => {
      const nx = pos.x + dx, nz = pos.z + dz; const h = this.studio.heightAt(nx, nz);
      if (h == null || h - cur > 0.3 || cur - h > 0.6) return false;
      // no atravesar a los demás personajes
      for (const o of [...this.opps, this.host]) { if (!o.root.visible) continue; const ox = o.root.position.x - nx, oz = o.root.position.z - nz; if (ox * ox + oz * oz < 0.25 && Math.abs(o.root.position.y - cur) < 1) return false; }
      pos.x = nx; pos.z = nz; return true;
    };
    const s = speed * dt;
    if (!tryMove(dir.x * s, dir.z * s)) { tryMove(dir.x * s, 0) || tryMove(0, dir.z * s); }
    const h = this.studio.heightAt(pos.x, pos.z) ?? cur; pos.y += (h - pos.y) * Math.min(1, dt * 14);
    this.player.root.rotation.y = lerpAngle(this.player.root.rotation.y, Math.atan2(dir.x, dir.z), Math.min(1, dt * 10));
    return speed;
  }

  updateCamera(dt: number) {
    const cam = this.camera;
    if (this.mode === 'walk') {
      const p = this.player.root.position;
      this.player.root.visible = !this.firstPerson || this.player.root.visible;
      const head = new THREE.Vector3(p.x, p.y + (this.firstPerson ? 1.62 : 1.55), p.z);
      const dir = new THREE.Vector3(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(-this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch));
      if (this.firstPerson) {
        this.player.body.visible = false;
        cam.position.copy(head); cam.lookAt(head.clone().add(dir));
      } else {
        this.player.body.visible = true;
        let d = this.dist;
        // evitar que la cámara atraviese las paredes
        for (let k = d; k > 0.8; k -= 0.2) { const c = head.clone().addScaledVector(dir, -k); if (Math.hypot(c.x, c.z) < 11.6 && c.y > 0.2) { d = k; break; } d = k; }
        const target = head.clone().addScaledVector(dir, -d);
        cam.position.lerp(target, Math.min(1, dt * 10)); cam.lookAt(head);
      }
    } else {
      this.player.body.visible = true;
      if (this.orbit) {
        const o = this.orbit; o.a += o.speed * dt;
        cam.position.set(o.c.x + Math.sin(o.a) * o.r, o.c.y + o.h, o.c.z + Math.cos(o.a) * o.r);
        cam.lookAt(o.c.x, o.c.y + o.lookY, o.c.z);
      } else {
        this.cineT = Math.min(1, this.cineT + dt / this.cineDur);
        const e = easeInOut(this.cineT);
        const pos = this.cineFrom.pos.clone().lerp(this.cineTo.pos, e), look = this.cineFrom.look.clone().lerp(this.cineTo.look, e);
        cam.position.copy(pos); cam.lookAt(look);
        if (this.freeLook.yaw || this.freeLook.pitch) { cam.rotateY(this.freeLook.yaw); cam.rotateX(this.freeLook.pitch); }
      }
    }
    if (this.shake > 0) { this.shake = Math.max(0, this.shake - dt); const s = this.shake * 0.15; cam.position.x += (Math.random() - 0.5) * s; cam.position.y += (Math.random() - 0.5) * s; }
  }
}

export const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function lerpAngle(a: number, b: number, t: number) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * t; }
function dispose(o: THREE.Object3D) { o.traverse((c: any) => { c.geometry?.dispose?.(); const m = c.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x: any) => { x.map?.dispose?.(); x.dispose?.(); }); }); }
