import * as THREE from 'three';
import type { Engine } from './engine';
import { Hud, Session, ABORT } from './hud';
import { audio } from './assets';
import { canvasTex } from './tex';
import { logoCanvas, LOGO_PAL, bangPath, metalFill, drawBadge } from './logo';
import { CREDITOS, creditosFinal, rotulosCabecera } from './credits';
import { TOP } from './set3d';
import { gesture } from './people';
import { confettiBurst } from './decor';
import { despedidaTexto } from './lines';
import { CUSTOM, customReady } from './customaudio';
import { publico } from './publico';
import { crowd } from './crowd';

/** Ejecuta una escena que se puede saltar con el botón "Saltar" */
export async function skippable(main: Session, hud: Hud, fn: (s: Session) => Promise<void>) {
  const s = new Session();
  hud.skip(() => { s.alive = false; });
  const watch = setInterval(() => { if (!main.alive) s.alive = false; }, 100);
  try { await fn(s); } catch (e) { if (e !== ABORT) throw e; } finally { clearInterval(watch); hud.skip(null); }
  main.check();
}

// ------------------------------------------------------------------ CABECERA
/** Música de la cabecera y la despedida: el audio que el jugador haya elegido en Opciones (solo en su dispositivo)
 *  o, si no hay ninguno, la música del propio minijuego (.sb3: «Trilha», la que suena al abrir el Scratch). */
export const DEFAULT_MUSIC = 'Trilha';
export let CAB_MUSIC = DEFAULT_MUSIC;
export const OUT_MUSIC = () => audio.hasBuffer(CUSTOM) ? CUSTOM : DEFAULT_MUSIC;
/** Instantes (s) de cada destello / corte de cámara de la cabecera */
const HIT = { flash: 3.2, corte: 6.4, cuts: [8.0, 9.6, 11.2, 12.8, 14.4, 17.6, 19.2, 22.4, 24.0, 25.6], fin: 27.2 };
const V3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export async function cabecera(eng: Engine, hud: Hud, main: Session, extraDramatic = false) {
  CAB_MUSIC = (await customReady()) ? CUSTOM : DEFAULT_MUSIC;
  await Promise.race([audio.load(CAB_MUSIC), new Promise(r => setTimeout(r, 3000))]);
  audio.playMusic(CAB_MUSIC);
  const t0 = performance.now();
  // reloj de la cabecera = tiempo de la música (si no hay audio, reloj normal)
  const clock = () => { const m = audio.musicTime(CAB_MUSIC); return m >= 0 ? m : (performance.now() - t0) / 1000; };
  const fx = buildIntroFx(eng);
  const hostVis = eng.host.root.visible, playerVis = eng.player.root.visible;
  eng.host.root.visible = false; eng.player.root.visible = false;
  eng.lights?.event('intro');
  try {
    await skippable(main, hud, async (s) => {
      const at = (t: number) => s.until(() => clock() >= t);
      // ---- 0-3,5 s: letras metálicas por un túnel azul de partículas dentro del plató; la cámara retrocede
      fx.phase = 'tunel';
      await at(HIT.flash - 0.12);
      fx.flash();
      await at(HIT.flash);
      // ---- 3,5-6,8 s: ¡AHORA CAIGO! sobre la trampilla central, órbita lenta a la derecha
      fx.phase = 'logo'; publico.vitores(2.8, 0.7);
      await at(HIT.corte);
      // ---- corte seco al plató: dron
      fx.phase = 'off'; eng.lights?.event('ganador');
      // el público da palmas al ritmo de la música durante los planos del dron
      publico.ritmo(CAB_MUSIC, HIT.corte + 0.2, HIT.fin - 0.3, 0.5);
      hud.hashtag(eng.theme.hashtag || CREDITOS.hashtag);
      const lines = [...rotulosCabecera(), 'Modo: ' + eng.theme.name];
      if (eng.theme.banner) lines.unshift(eng.theme.banner);
      const b = eng.studio.prizeBoards[0]; const bp = b ? b.position.clone() : V3(-7, 3.7, -9.5);
      const bIn = bp.clone().multiplyScalar(0.62).setY(3.5), bIn2 = bp.clone().multiplyScalar(0.8).setY(3.6);
      type Shot = () => void;
      const shots: Shot[] = [
        () => { eng.cut(V3(0, 1.6, 8.5), V3(0, 2.4, 0)); eng.glide(V3(0, 2.6, 6.5), V3(0, 9.5, -1), 1.5); },                // panorámica al techo de luces
        () => { eng.cut(V3(0.4, 6.7, 5.2), V3(0, 0, -0.3)); eng.glide(V3(0, 2.4, 6.4), V3(0, 1.2, 0), 1.5); },                 // picado de grúa
        () => { eng.cut(V3(-7.5, 2.3, 3.5), V3(0, 1.4, 0)); eng.glide(V3(7.5, 2.3, 3.5), V3(0, 1.4, 0), 1.6); },             // barrido por la mesa central
        () => { eng.cut(V3(-4.2, 2.8, 0.5), V3(-6.8, 1.6, 3)); eng.glide(V3(-4.2, 2.8, -2.5), V3(-6.5, 1.6, -3), 1.4); },     // atriles izquierda
        () => { eng.cut(V3(4.2, 2.8, -2.5), V3(6.5, 1.6, -3)); eng.glide(V3(4.2, 2.8, 0.5), V3(6.8, 1.6, 3), 1.5); },        // atriles derecha
        () => { eng.cut(bIn, bp); eng.glide(bIn2, bp, 3.2); },                                                                   // marcador de premios
        () => { eng.startOrbit(V3(0, 0, 0), 7.5, 3.4, 0, 2.0, 1.4); },                                                         // latigazo de 180º
        () => { eng.startOrbit(V3(0, 0, 0), 6.2, 3.0, Math.PI, -0.32, 1.4); },                                                  // órbita a la mesa
        () => { eng.cut(V3(-8, 0.35, 6), V3(0, 1.2, 0)); eng.glide(V3(8, 0.35, 6), V3(0, 1.2, 0), 1.6); },                   // pasada a ras de suelo
        () => { eng.cut(V3(0, 0.8, 9.5), V3(0, 1.5, 0)); eng.glide(V3(0, 6.9, 9.6), V3(0, 1.2, 0), 1.6); },                  // subida hasta el techo
        () => { eng.cut(V3(0, 6.6, 15), V3(0, 1.6, 0)); eng.glide(V3(0, 5.4, 12.8), V3(0, 1.6, 0), 1.6); },                  // plano general
      ];
      const times = [HIT.corte, ...HIT.cuts];
      for (let i = 0; i < shots.length; i++) {
        await at(times[i]);
        shots[i]();
        if (i >= 2 && i - 2 < lines.length) hud.lowerThird(lines[i - 2], 2100, s).catch(() => { });
        if (i === 6) eng.lights?.event('acierto');
        if (extraDramatic && i % 2 === 0) confettiBurst(eng.studio, V3((Math.random() - .5) * 8, 1.5, (Math.random() - .5) * 6));
      }
      await at(HIT.fin);
    });
  } finally {
    fx.dispose(); eng.override = null; hud.clearLowerThirds(); document.getElementById('introFlash')?.remove(); crowd.stopBeat(); eng.audience?.react('idle');
    eng.host.root.visible = hostVis; eng.player.root.visible = playerVis;
    eng.lights?.event('intro');
  }
}

/** Efectos de la cabecera DENTRO del plató (el decorado se ve siempre): túnel, partículas, letras y destello */
function buildIntroFx(eng: Engine) {
  const root = new THREE.Group(); eng.scene.add(root);
  const AX = 3.0; // altura del eje del túnel
  // túnel azul semitransparente a lo largo de z
  const tunTex = canvasTex(256, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#0a2a9a'); gr.addColorStop(0.5, '#2a6aff'); gr.addColorStop(1, '#0a2a9a');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(160,210,255,0.55)'; for (let i = 0; i < 10; i++) g.fillRect(0, i * 51, w, 6);
  }, { repeat: [4, 3] });
  const tunMat = new THREE.MeshBasicMaterial({ map: tunTex, side: THREE.BackSide, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false });
  const tunnel = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 26, 40, 1, true), tunMat); tunnel.rotation.x = Math.PI / 2; tunnel.position.set(0, AX, -2); root.add(tunnel);
  // partículas planas cuadradas/rectangulares girando
  const NP = 140; const pm = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshBasicMaterial({ color: 0xbfe0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }), NP);
  const pd = Array.from({ length: NP }, () => { const a = Math.random() * 6.283, r = 0.8 + Math.random() * 2.4; return { p: V3(Math.cos(a) * r, AX + Math.sin(a) * r, -14 + Math.random() * 22), r: new THREE.Euler(Math.random() * 6, Math.random() * 6, 0), s: V3(0.5 + Math.random() * 1.6, 0.4 + Math.random() * 0.9, 1), w: 1 + Math.random() * 3 }; });
  root.add(pm);
  // letras metálicas que se colocan en el logo de DOS líneas: «AHORA» arriba, «CAIGO» abajo,
  // con un «¡» alto a la izquierda y un «!» alto a la derecha que abarcan las dos líneas
  const th = eng.theme; const themed = th.id !== 'normal' && !!LOGO_PAL[th.id]; const pal = LOGO_PAL[th.id] || LOGO_PAL.normal;
  const faceFill = (g: CanvasRenderingContext2D, y0: number, y1: number, idx: number) => {
    if (pal.perLetter) { const c = pal.perLetter[idx % pal.perLetter.length]; const lg = g.createLinearGradient(0, y0, 0, y1); lg.addColorStop(0, '#ffffff'); lg.addColorStop(0.3, c); lg.addColorStop(1, c); return lg; }
    return metalFill(g, pal, y0, y1);
  };
  const letterTex = (ch: string, front: boolean, idx = 0) => canvasTex(128, 160, (g, w, h) => {
    g.font = '900 136px "Arial Black", Arial, Roboto, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (front) { g.lineJoin = 'round'; g.lineWidth = 9; g.strokeStyle = pal.stroke; g.strokeText(ch, w / 2, h / 2 + 6); g.fillStyle = faceFill(g, 30, h - 30, idx); }
    else g.fillStyle = pal.extrude || '#5d6880';
    g.fillText(ch, w / 2, h / 2 + 6);
  });
  const BH = 1.95; // alto de los signos respecto a una letra
  const bangTex = (k: '!' | '¡', front: boolean) => canvasTex(128, Math.round(160 * BH), (g, w, h) => {
    const bw = 62; bangPath(g, k, w / 2, 14, h - 28, bw);
    if (front) { g.lineJoin = 'round'; g.lineWidth = 9; g.strokeStyle = pal.stroke; g.stroke(); g.fillStyle = faceFill(g, 14, h - 14, k === '¡' ? 0 : 99); }
    else g.fillStyle = pal.extrude || '#5d6880';
    g.fill();
  });
  const LH = 0.92, LW = LH * 128 / 160, PX = LW / 128; // unidades de mundo por píxel de la textura
  type Let = { g: THREE.Group; to: THREE.Vector3; seed: number; lane: THREE.Vector2; rz: number; sx: number };
  const lets: Let[] = [];
  const ROW2 = TOP + LH / 2 + 0.04, ROW1 = ROW2 + LH * 0.86;
  // anchura real de cada letra (Arial Black) para que las palabras queden compactas como en el logo
  const mc = document.createElement('canvas').getContext('2d')!; mc.font = '900 136px "Arial Black", Arial, Roboto, sans-serif';
  const wordW = (t: string) => [...t].reduce((a, ch) => a + mc.measureText(ch).width * PX, 0);
  const WW = Math.max(wordW('AHORA'), wordW('CAIGO'));
  const items: { ch: string; x: number; y: number; tall: boolean; rz: number; sx: number }[] = [];
  for (const [t, y] of [['AHORA', ROW1], ['CAIGO', ROW2]] as const) {
    const sx = Math.min(1.12, WW / wordW(t)); let x = -wordW(t) * sx / 2;
    for (const ch of t) { const cw = mc.measureText(ch).width * PX * sx; items.push({ ch, x: x + cw / 2, y, tall: false, rz: 0, sx }); x += cw; }
  }
  const BX = WW / 2 + LW * 0.42;
  items.unshift({ ch: '¡', x: -BX, y: (ROW1 + ROW2) / 2, tall: true, rz: 0.03, sx: 1 });
  items.push({ ch: '!', x: BX, y: (ROW1 + ROW2) / 2, tall: true, rz: -0.09, sx: 1 });
  let idx = 0, li = 0;
  for (const it of items) {
    const g = new THREE.Group();
    const hh = it.tall ? LH * BH : LH;
    const back = new THREE.MeshBasicMaterial({ map: it.tall ? bangTex(it.ch as any, false) : letterTex(it.ch, false), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
    for (let k = 1; k <= 7; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(LW, hh), back); m.position.z = -k * 0.03; g.add(m); }
    const f = new THREE.Mesh(new THREE.PlaneGeometry(LW, hh), new THREE.MeshBasicMaterial({ map: it.tall ? bangTex(it.ch as any, true) : letterTex(it.ch, true, li++), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide })); g.add(f);
    const fb = f.clone(); fb.position.z = -0.215; fb.rotation.y = Math.PI; g.add(fb);
    root.add(g); lets.push({ g, to: V3(it.x, it.y, 0.15), seed: idx++ / items.length, lane: new THREE.Vector2((Math.random() - .5) * 3.2, (Math.random() - .5) * 2.2), rz: it.rz, sx: it.sx });
  }
  // círculo con las huellas detrás de las letras (variante del programa)
  const ec = document.createElement('canvas'); ec.width = ec.height = 512; drawBadge(ec.getContext('2d')!, 256, 256, 170, pal, 512, 512);
  const et = new THREE.CanvasTexture(ec); et.colorSpace = THREE.SRGBColorSpace;
  const emblem = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: et, transparent: true, depthWrite: false }));
  emblem.position.set(0, ROW1 + LH * 0.45, -0.35); emblem.visible = false; root.add(emblem);
  if (themed) tunMat.color = new THREE.Color(th.glow);
  // destello blanco con destello horizontal (lens flare)
  const flashEl = document.createElement('div'); flashEl.id = 'introFlash';
  flashEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:9;opacity:0;transition:opacity .12s;background:radial-gradient(ellipse 60% 40% at 50% 50%,#fff 0%,rgba(255,255,255,.85) 40%,rgba(200,225,255,.4) 70%,rgba(255,255,255,0) 100%)';
  const streak = document.createElement('div'); streak.style.cssText = 'position:absolute;left:-10%;right:-10%;top:calc(50% - 5px);height:10px;background:linear-gradient(90deg,rgba(80,160,255,0),#bfe0ff 30%,#fff 50%,#bfe0ff 70%,rgba(80,160,255,0));filter:blur(2px);box-shadow:0 0 30px 10px rgba(140,200,255,.8)';
  flashEl.appendChild(streak); document.getElementById('app')!.appendChild(flashEl);
  let t = 0, tl = 0, prev: string = 'tunel';
  const fx = {
    phase: 'tunel' as 'tunel' | 'logo' | 'off',
    flash() { flashEl.style.transition = 'opacity .1s'; flashEl.style.opacity = '1'; setTimeout(() => { flashEl.style.transition = 'opacity .5s'; flashEl.style.opacity = '0'; }, 160); },
    dispose() { eng.scene.remove(root); root.traverse((o: any) => { o.geometry?.dispose?.(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: any) => { m.map?.dispose?.(); m.dispose?.(); }); } }); flashEl.remove(); eng.override = null; eng.extraUpdate = null; },
  };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  eng.extraUpdate = (dt: number) => {
    if (fx.phase !== prev) { prev = fx.phase; tl = 0; }
    t += dt; tl += dt;
    const cam = eng.camera;
    root.visible = fx.phase !== 'off';
    tunnel.visible = pm.visible = fx.phase === 'tunel';
    if (fx.phase === 'tunel') {
      // la cámara retrocede por el túnel mirando hacia el fondo del plató
      const z = 1.5 + tl * 2.4; cam.position.set(Math.sin(tl * 1.3) * 0.25, AX + Math.cos(tl) * 0.15, z); cam.lookAt(0, AX - 0.1, z - 10); cam.rotateZ(Math.sin(tl * 0.9) * 0.08);
      tunTex.offset.y -= dt * 0.5; tunnel.rotation.y += dt * 0.25;
      pd.forEach((d, i) => { d.p.z += dt * 3.2 * d.w * 0.6; if (d.p.z > z + 1) d.p.z -= 22; d.r.x += dt * d.w; d.r.y += dt * 1.7; q.setFromEuler(d.r); m4.compose(d.p, q, d.s); pm.setMatrixAt(i, m4); });
      pm.instanceMatrix.needsUpdate = true;
      // letras que vuelan hacia la cámara girando cada una por su lado
      lets.forEach(L => {
        const k = (tl * 0.55 + L.seed) % 1; // 0 = lejos, 1 = pasa por la cámara
        const lz = -12 + k * (z + 1 + 12);
        L.g.position.set(L.lane.x * (0.4 + k), AX + L.lane.y * (0.4 + k), lz);
        L.g.rotation.set(t * (1.3 + L.seed * 2), t * (2.1 - L.seed), t * (0.7 + L.seed));
        L.g.scale.setScalar(1.15);
      });
    } else if (fx.phase === 'logo') {
      // las letras encajan en ¡AHORA CAIGO! sobre la trampilla central
      lets.forEach((L, i) => {
        const k = THREE.MathUtils.clamp((tl - i * 0.025) / 0.35, 0, 1), e = 1 - Math.pow(1 - k, 3);
        const from = V3(L.to.x * 2.5, L.to.y + 2.5, 5);
        L.g.position.lerpVectors(from, L.to, e);
        L.g.rotation.set((1 - e) * 4, (1 - e) * 6, L.rz * e); L.g.scale.set(L.sx, 1, 1);
      });
      { const k = THREE.MathUtils.clamp((tl - 0.25) / 0.5, 0, 1), e = 1 - Math.pow(1 - k, 3); emblem.visible = k > 0; emblem.scale.setScalar(0.2 + 0.8 * e); emblem.rotation.z = (1 - e) * 2; }
      const a = -0.55 + tl * 0.16; // órbita lenta hacia la derecha
      cam.position.set(Math.sin(a) * 5.6, TOP + 1.45 + tl * 0.05, Math.cos(a) * 5.6); cam.lookAt(0, TOP + 1.3, -0.3);
    }
  };
  return fx;
}

// ------------------------------------------------------------------ FINAL
export async function despedida(eng: Engine, hud: Hud, main: Session, resultLine: string) {
  const th = eng.theme;
  const texto = despedidaTexto(th);
  document.body.classList.add('outro');
  try { await skippable(main, hud, async (s) => {
    hud.hideBubble();
    audio.playMusic(OUT_MUSIC(), false, 1, 1.2); publico.ovacion(7);
    // plano general de los atriles
    eng.opps.forEach(o => { if (o.root.visible) gesture(o, 'arriba', 3); });
    eng.cut(new THREE.Vector3(-9, 4.5, 6), new THREE.Vector3(3, 1.6, -2)); eng.glide(new THREE.Vector3(9, 4.5, 6), new THREE.Vector3(-3, 1.6, -2), 3.5);
    if (th.festivo) { confettiBurst(eng.studio, new THREE.Vector3(-5, 2, -3)); confettiBurst(eng.studio, new THREE.Vector3(5, 2, -3)); }
    // el presentador en el centro
    eng.player.root.position.set(-1.6, TOP, 2.3); eng.face(eng.player, new THREE.Vector3(0, 0, 8));
    eng.host.root.position.set(0, TOP, 0); eng.face(eng.host, new THREE.Vector3(0, 1, 8));
    await s.w(3200);
    eng.cut(new THREE.Vector3(0.6, TOP + 1.7, 3.6), new THREE.Vector3(0, TOP + 1.3, 0));
    hud.credits([...(th.credito ? [th.credito] : []), ...creditosFinal().map(([a, b]) => [a, b] as [string, string[]]), resultLine], 16);
    gesture(eng.host, 'aplaude', 2.4); publico.aplauso(3, 0.6);
    await s.w(1200);
    let said = false; hud.say(texto, 6500).then(() => { said = true; });
    gesture(eng.host, 'gracias', 1.8); await s.w(1800);
    gesture(eng.host, 'beso', 1.6); await s.w(1600); gesture(eng.host, 'saluda', 2.2);
    await s.until(() => said);
    hud.hideBubble();
    // plano cenital girando y caída del presentador (los créditos se van antes del logo)
    document.getElementById('credits')!.classList.add('fadeout');
    eng.startOrbit(new THREE.Vector3(0, 0, 0), 9.5, 11, 0, 0.35, 0);
    await s.w(1500);
    audio.play('AhoraCaigo - Queda.mp3'); audio.play('DropM.mp3'); publico.ooh(0.9);
    await eng.fall(eng.host, 0);
    publico.ovacion(4, 0.8);
    hud.hideCredits();
    const fin = document.createElement('div'); fin.id = 'finCard';
    fin.style.cssText = 'position:absolute;inset:0;z-index:14;pointer-events:none';
    const lc = logoCanvas(520, 460, { variant: th.id }); lc.style.cssText = 'position:absolute;right:4vw;top:50%;height:58vh;transform:translate(130%,-50%);transition:transform .8s cubic-bezier(.2,1.3,.4,1)';
    const tx = document.createElement('div'); tx.textContent = CREDITOS.produccion;
    tx.style.cssText = 'position:absolute;left:4vw;top:50%;font:900 clamp(18px,4vw,40px) Arial,Roboto,sans-serif;text-shadow:0 0 14px #39c8ff,0 3px 4px #000;transform:translate(-130%,-50%);transition:transform .8s cubic-bezier(.2,1.3,.4,1) .3s';
    fin.append(lc, tx); document.getElementById('hud')!.appendChild(fin);
    requestAnimationFrame(() => { lc.style.transform = 'translate(0,-50%)'; tx.style.transform = 'translate(0,-50%)'; });
    await s.w(2200); audio.stopMusic(2.0); await s.w(2000);
  }); } finally { audio.stopMusic(0.8); document.body.classList.remove('outro'); document.getElementById('credits')?.classList.remove('fadeout'); }
  document.getElementById('finCard')?.remove(); hud.hideCredits(); eng.studio.holes[0].target = 0;
}

// ------------------------------------------------------------------ CABECERA DE IKER (vídeo, v1.6)
/** Ajustes que vienen de Opciones (los pone main.ts) */
export const cabOpts = { video: true, vol: 0.8, mute: false };
export const CAB_VIDEO = `${import.meta.env.BASE_URL}cabecera/cabecera-iker.mp4`;
/** La cabecera hecha por Iker: vídeo a pantalla completa con su audio. Se salta con un toque.
 *  true = se ha visto (o saltado); false = no se pudo reproducir (entonces va la cabecera 3D) */
export async function cabeceraIker(hud: Hud, main: Session): Promise<boolean> {
  const W = window as any;
  const wrap = document.createElement('div'); wrap.id = 'cabVideo';
  wrap.style.cssText = 'position:fixed;inset:0;z-index:60;background:#000;display:flex;align-items:center;justify-content:center;cursor:pointer';
  const v = document.createElement('video');
  v.src = CAB_VIDEO; v.poster = `${import.meta.env.BASE_URL}cabecera/cabecera-iker.jpg`; v.preload = 'auto'; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
  v.style.cssText = 'width:100%;height:100%;object-fit:contain;background:#000';
  v.volume = Math.max(0, Math.min(1, cabOpts.vol)); v.muted = cabOpts.mute;
  const tip = document.createElement('div'); tip.textContent = 'Toca para saltar ⏭';
  tip.style.cssText = 'position:absolute;right:18px;bottom:16px;padding:6px 14px;border-radius:18px;background:#0008;color:#fff;font:600 15px system-ui;opacity:.85;pointer-events:none';
  wrap.append(v, tip); document.body.appendChild(wrap);
  W.__cabVideo = { estado: 'cargando', el: v };
  let fin: (r: boolean) => void = () => { };
  const done = new Promise<boolean>(r => { fin = r; });
  let shown = false;
  const end = (r: boolean, why: string) => { W.__cabVideo.estado = why; fin(r); };
  wrap.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); end(true, 'saltado'); });
  hud.skip(() => end(true, 'saltado'));
  v.onended = () => end(true, 'terminado');
  v.onerror = () => end(shown, 'error');
  v.onplaying = () => { shown = true; W.__cabVideo.estado = 'reproduciendo'; };
  // si se queda atascado sin arrancar en 6 s, cabecera 3D
  const stall = setTimeout(() => { if (!shown) end(false, 'atascado'); }, 6000);
  const watch = setInterval(() => { if (!main.alive) end(true, 'abort'); }, 100);
  try { if (audio.ctx.state === 'suspended') await audio.ctx.resume(); } catch { }
  v.play().catch(() => { v.muted = true; v.play().catch(() => end(false, 'sin-play')); });
  const r = await done;
  clearTimeout(stall); clearInterval(watch); hud.skip(null);
  try { v.pause(); } catch { }
  wrap.style.transition = 'opacity .35s'; wrap.style.opacity = '0'; setTimeout(() => { v.removeAttribute('src'); v.load(); wrap.remove(); }, 400);
  main.check();
  return r;
}
