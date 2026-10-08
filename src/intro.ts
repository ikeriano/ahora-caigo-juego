import * as THREE from 'three';
import type { Engine } from './engine';
import { Hud, Session, ABORT } from './hud';
import { audio } from './assets';
import { canvasTex } from './tex';
import { drawLogo, logoCanvas } from './logo';
import { CREDITOS } from './credits';
import { TOP } from './set3d';
import { gesture } from './people';
import { confettiBurst } from './decor';

/** Ejecuta una escena que se puede saltar con el botón "Saltar" */
export async function skippable(main: Session, hud: Hud, fn: (s: Session) => Promise<void>) {
  const s = new Session();
  hud.skip(() => { s.alive = false; });
  const watch = setInterval(() => { if (!main.alive) s.alive = false; }, 100);
  try { await fn(s); } catch (e) { if (e !== ABORT) throw e; } finally { clearInterval(watch); hud.skip(null); }
  main.check();
}

// ------------------------------------------------------------------ CABECERA
export async function cabecera(eng: Engine, hud: Hud, main: Session, extraDramatic = false) {
  audio.playMusic('AhoraCaigo - Intro.mp3');
  try {
    await skippable(main, hud, async (s) => {
      await logoReveal(eng, s, extraDramatic);
      // --- vuelo por el plató con rótulos ---
      hud.hashtag(eng.theme.hashtag || CREDITOS.hashtag);
      eng.startOrbit(new THREE.Vector3(0, 0, 0), 10.8, 5.4, 0.9, -0.13, 1.5);
      const lines = [...CREDITOS.cabecera, 'Modo: ' + eng.theme.name];
      if (eng.theme.banner) lines.unshift(eng.theme.banner);
      const shots: [THREE.Vector3, THREE.Vector3][] = [
        [new THREE.Vector3(-7.5, 3.4, 4.5), new THREE.Vector3(-5.5, 1.8, -2)],
        [new THREE.Vector3(7.5, 3.4, 4.5), new THREE.Vector3(5.5, 1.8, -2)],
        [new THREE.Vector3(0, 3.2, 3.5), new THREE.Vector3(0, 3.5, -11.6)],
      ];
      for (let i = 0; i < lines.length; i++) {
        hud.lowerThird(lines[i], 2300, s).catch(() => { });
        if (i === 2) eng.glide(shots[0][0], shots[0][1], 2.2);
        if (i === 3) eng.glide(shots[1][0], shots[1][1], 2.2);
        if (i === 4) eng.glide(shots[2][0], shots[2][1], 2.0);
        if (extraDramatic && i % 2 === 0) confettiBurst(eng.studio, new THREE.Vector3((Math.random() - .5) * 8, 1.5, (Math.random() - .5) * 6));
        await s.w(1700);
      }
      await s.w(900);
    });
  } finally { eng.override = null; hud.clearLowerThirds(); document.getElementById('introFlash')?.remove(); }
}

/** 0-6 s: túnel rojo con confeti dorado, letras que caen y forman ¡AHORA CAIGO! */
async function logoReveal(eng: Engine, s: Session, dramatic: boolean) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x120002);
  const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);
  const tunTex = canvasTex(512, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#3a0006'); gr.addColorStop(0.5, '#8a0a12'); gr.addColorStop(1, '#3a0006');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,90,60,0.35)'; g.lineWidth = 18;
    for (let i = -8; i < 16; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64 + 260, h); g.stroke(); }
  }, { repeat: [3, 6] });
  const tunMat = new THREE.MeshBasicMaterial({ map: tunTex, side: THREE.BackSide, transparent: true });
  const tunnel = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 140, 32, 1, true), tunMat); tunnel.rotation.x = Math.PI / 2; tunnel.position.z = -60; scene.add(tunnel);
  // confeti dorado
  const N = 260; const conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.34, 0.16), new THREE.MeshBasicMaterial({ color: 0xffd04a, side: THREE.DoubleSide }), N);
  const cdat = Array.from({ length: N }, () => ({ p: new THREE.Vector3((Math.random() - .5) * 11, (Math.random() - .5) * 11, -Math.random() * 90), r: new THREE.Euler(Math.random() * 6, Math.random() * 6, 0), s: 0.5 + Math.random() }));
  const col = new THREE.Color(); cdat.forEach((_, i) => conf.setColorAt(i, col.setHSL(0.12 + Math.random() * 0.03, 0.9, 0.45 + Math.random() * 0.3)));
  scene.add(conf);
  // fondo multicolor final
  const bgTex = canvasTex(1024, 512, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h * 0.45, 20, w / 2, h / 2, w * 0.6);
    gr.addColorStop(0, '#fff6b0'); gr.addColorStop(0.25, '#ffc21a'); gr.addColorStop(0.55, '#2a6aff'); gr.addColorStop(1, '#5a1aa8');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.translate(w / 2, h * 0.45);
    for (let i = 0; i < 24; i++) { g.rotate(Math.PI / 12); g.fillStyle = i % 2 ? 'rgba(255,255,255,0.10)' : 'rgba(120,40,200,0.10)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, -60); g.lineTo(w, 60); g.fill(); }
  });
  const bgMat = new THREE.MeshBasicMaterial({ map: bgTex, transparent: true, opacity: 0 });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), bgMat); bg.position.z = -20; scene.add(bg);
  // círculo metálico con huellas
  const disc = new THREE.Group();
  const faceTex = canvasTex(512, 512, (g, w, h) => drawLogo(g, w, h * 1.4, { text: false }));
  faceTex.center.set(0.5, 0.5);
  const dm = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.25, 48), [new THREE.MeshStandardMaterial({ color: 0xb8c0cc, metalness: 0.9, roughness: 0.25 }), new THREE.MeshBasicMaterial({ map: faceTex }), new THREE.MeshBasicMaterial({ map: faceTex })]);
  dm.rotation.x = Math.PI / 2; disc.add(dm);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.12, 12, 48), new THREE.MeshStandardMaterial({ color: 0xdfe6f0, metalness: 1, roughness: 0.2 })); disc.add(rim);
  disc.position.set(0, 0, -40); scene.add(disc);
  scene.add(new THREE.AmbientLight(0xffffff, 1.2)); const dl = new THREE.DirectionalLight(0xffeedd, 2.5); dl.position.set(2, 3, 5); scene.add(dl);
  // letras 3D (capas apiladas)
  const words = ['¡AHORA', '¡CAIGO!'];
  const letters: { g: THREE.Group; from: THREE.Vector3; to: THREE.Vector3; rot: THREE.Euler; delay: number }[] = [];
  const letterTex = (ch: string, front: boolean) => canvasTex(128, 160, (g, w, h) => {
    g.font = '900 140px "Arial Black", Arial, Roboto, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (front) { const lg = g.createLinearGradient(0, 10, 0, h - 10); lg.addColorStop(0, '#ffffff'); lg.addColorStop(0.6, '#e6ebf3'); lg.addColorStop(1, '#a8b2c4'); g.fillStyle = lg; g.lineWidth = 8; g.strokeStyle = '#1a2a6a'; g.strokeText(ch, w / 2, h / 2 + 6); }
    else g.fillStyle = '#6a7488';
    g.fillText(ch, w / 2, h / 2 + 6);
  });
  words.forEach((wd, li) => {
    const n = wd.length; const sp = 1.05;
    [...wd].forEach((ch, i) => {
      const g = new THREE.Group();
      const back = new THREE.MeshBasicMaterial({ map: letterTex(ch, false), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
      for (let k = 1; k <= 6; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.375), back); m.position.z = -k * 0.045; g.add(m); }
      const f = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.375), new THREE.MeshBasicMaterial({ map: letterTex(ch, true), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide })); g.add(f);
      const to = new THREE.Vector3((i - (n - 1) / 2) * sp * (ch === '¡' || ch === '!' ? 0.9 : 1), li === 0 ? -0.55 : -2.0, -9);
      const from = new THREE.Vector3((Math.random() - .5) * 8, 4 + Math.random() * 4, -70 - Math.random() * 30);
      g.position.copy(from); scene.add(g);
      letters.push({ g, from, to, rot: new THREE.Euler(Math.random() * 12, Math.random() * 12, Math.random() * 12), delay: 0.6 + (li * 6 + i) * 0.12 });
    });
  });
  let t = 0; const D = dramatic ? 7 : 6;
  const flash = document.createElement('div'); flash.id = 'introFlash'; flash.style.cssText = 'position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:9;transition:opacity .25s'; document.getElementById('app')!.appendChild(flash);
  eng.override = {
    scene, camera: cam, update: (dt) => {
      t += dt; cam.aspect = innerWidth / innerHeight; cam.fov = cam.aspect < 1.4 ? 70 : 60; cam.updateProjectionMatrix();
      tunTex.offset.y -= dt * 0.6; tunnel.rotation.y += dt * 0.6;
      const assembled = t > 4.2;
      tunMat.opacity = assembled ? Math.max(0, 1 - (t - 4.2) * 2) : 1;
      bgMat.opacity = assembled ? Math.min(1, (t - 4.2) * 2) : 0;
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      cdat.forEach((c, i) => { c.p.z += dt * (assembled ? 4 : 18) * c.s; if (c.p.z > 2) c.p.z -= 90; c.r.x += dt * 3 * c.s; c.r.y += dt * 2; q.setFromEuler(c.r); m4.compose(c.p, q, new THREE.Vector3(1, 1, 1)); conf.setMatrixAt(i, m4); });
      conf.instanceMatrix.needsUpdate = true;
      for (const L of letters) {
        const k = THREE.MathUtils.clamp((t - L.delay) / 2.6, 0, 1); const e = 1 - Math.pow(1 - k, 3);
        L.g.position.lerpVectors(L.from, L.to, e);
        // pasan cerca de la cámara antes de colocarse
        L.g.position.z += Math.sin(e * Math.PI) * 9;
        L.g.rotation.set(L.rot.x * (1 - e), L.rot.y * (1 - e), L.rot.z * (1 - e));
      }
      const dk = THREE.MathUtils.clamp((t - 1.0) / 3.4, 0, 1);
      disc.position.set(0, 1.85 * dk, -40 + 30.5 * (1 - Math.pow(1 - dk, 2)));
      disc.rotation.y = t * (assembled ? 1.2 : 5); disc.rotation.x = Math.sin(t) * 0.2;
      cam.position.set(Math.sin(t * 0.6) * (assembled ? 0.3 : 1.2), Math.cos(t * 0.5) * 0.4, 2); cam.lookAt(0, -0.3, -10);
      if (dramatic) cam.rotation.z = assembled ? 0 : Math.sin(t * 1.3) * 0.25;
    }
  };
  await s.w(4150); flash.style.opacity = '0.9'; audio.play('Intro2'); await s.w(220); flash.style.opacity = '0';
  await s.w((D - 4.4) * 1000);
  eng.override = null; flash.remove();
  scene.traverse((o: any) => { o.geometry?.dispose?.(); });
}

// ------------------------------------------------------------------ FINAL
export async function despedida(eng: Engine, hud: Hud, main: Session, resultLine: string) {
  const th = eng.theme;
  const texto = th.despedida || `Y hasta aquí el programa de hoy${th.id === 'normal' ? '' : ', el especial ' + th.name}. ¡Muchas gracias por jugar a ¡Ahora Caigo! Ha sido un placer, ¡sois los mejores! ¡Hasta la próxima!`;
  document.body.classList.add('outro');
  try { await skippable(main, hud, async (s) => {
    hud.hideBubble();
    audio.playMusic('AhoraCaigo - Fim.mp3'); audio.applause(6);
    // plano general de los atriles
    eng.opps.forEach(o => { if (o.root.visible) gesture(o, 'arriba', 3); });
    eng.cut(new THREE.Vector3(-9, 4.5, 6), new THREE.Vector3(3, 1.6, -2)); eng.glide(new THREE.Vector3(9, 4.5, 6), new THREE.Vector3(-3, 1.6, -2), 3.5);
    if (th.id === 'primetime') { confettiBurst(eng.studio, new THREE.Vector3(-5, 2, -3)); confettiBurst(eng.studio, new THREE.Vector3(5, 2, -3)); }
    // el presentador en el centro
    eng.player.root.position.set(-1.6, TOP, 2.3); eng.face(eng.player, new THREE.Vector3(0, 0, 8));
    eng.host.root.position.set(0, TOP, 0); eng.face(eng.host, new THREE.Vector3(0, 1, 8));
    await s.w(3200);
    eng.cut(new THREE.Vector3(0.6, TOP + 1.7, 3.6), new THREE.Vector3(0, TOP + 1.3, 0));
    hud.credits([...CREDITOS.final.map(([a, b]) => [a, b] as [string, string[]]), resultLine], 16);
    gesture(eng.host, 'aplaude', 2.4); hud.say(texto, 9000);
    await s.w(2400); gesture(eng.host, 'gracias', 1.8); await s.w(1800);
    gesture(eng.host, 'beso', 1.6); await s.w(1600); gesture(eng.host, 'saluda', 2.2); await s.w(2400);
    hud.hideBubble();
    // plano cenital girando y caída del presentador (los créditos se van antes del logo)
    document.getElementById('credits')!.classList.add('fadeout');
    eng.startOrbit(new THREE.Vector3(0, 0, 0), 9.5, 11, 0, 0.35, 0);
    await s.w(1500);
    audio.play('AhoraCaigo - Queda.mp3'); audio.play('DropM.mp3');
    await eng.fall(eng.host, 0);
    hud.hideCredits();
    const fin = document.createElement('div'); fin.id = 'finCard';
    fin.style.cssText = 'position:absolute;inset:0;z-index:14;pointer-events:none';
    const lc = logoCanvas(520, 460); lc.style.cssText = 'position:absolute;right:4vw;top:50%;height:58vh;transform:translate(130%,-50%);transition:transform .8s cubic-bezier(.2,1.3,.4,1)';
    const tx = document.createElement('div'); tx.textContent = CREDITOS.produccion;
    tx.style.cssText = 'position:absolute;left:4vw;top:50%;font:900 clamp(18px,4vw,40px) Arial,Roboto,sans-serif;text-shadow:0 0 14px #39c8ff,0 3px 4px #000;transform:translate(-130%,-50%);transition:transform .8s cubic-bezier(.2,1.3,.4,1) .3s';
    fin.append(lc, tx); document.getElementById('hud')!.appendChild(fin);
    requestAnimationFrame(() => { lc.style.transform = 'translate(0,-50%)'; tx.style.transform = 'translate(0,-50%)'; });
    await s.w(4200);
  }); } finally { document.body.classList.remove('outro'); document.getElementById('credits')?.classList.remove('fadeout'); }
  document.getElementById('finCard')?.remove(); hud.hideCredits(); eng.studio.holes[0].target = 0;
}
