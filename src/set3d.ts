import * as THREE from 'three';
import { chevronTex, huellaTex, radialTex, vertFadeTex, canvasTex, numberTex } from './tex';
import { Theme } from './themes';
import { buildDecor } from './decor';

export const TABLE_R = 3.3, TOP = 1.1, RING_IN = 5.2, RING_OUT = 8.4, TIER_OUT = 10.2, WALL_R = 12.5;
export const A0 = THREE.MathUtils.degToRad(34), A1 = THREE.MathUtils.degToRad(166);
const STEP_A = THREE.MathUtils.degToRad(2.2);

export interface Hole { pos: THREE.Vector3; r: number; doorA: THREE.Object3D; doorB: THREE.Object3D; ring: THREE.Mesh; halo: THREE.Mesh; open: number; target: number; activeMat: THREE.MeshBasicMaterial; label?: THREE.Sprite }

/** ángulo 0 = frente (+Z), positivo hacia +X */
const polar = (r: number, a: number, y = 0) => new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);

export class Studio {
  root = new THREE.Group();
  holes: Hole[] = [];
  anim: ((dt: number, t: number) => void)[] = [];
  screenMats: THREE.MeshBasicMaterial[] = [];
  lights: THREE.Light[] = [];
  t = 0;
  constructor(public theme: Theme, logoUrl: string, mobile: boolean) {
    const R = this.root, th = theme;
    const L = (c: number, e = 0) => new THREE.MeshLambertMaterial({ color: c, emissive: e });
    const glowCol = new THREE.Color(th.glow), accCol = new THREE.Color(th.accent);
    const additive = (c: THREE.ColorRepresentation, op = 1, map?: THREE.Texture) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, ...(map ? { map } : {}), side: THREE.DoubleSide });

    // ---------- Suelo oscuro brillante con líneas de luz radiales ----------
    const floorTex = canvasTex(1024, 1024, (g, w) => {
      g.fillStyle = '#04060d'; g.fillRect(0, 0, w, w);
      const gr = g.createRadialGradient(w / 2, w / 2, 40, w / 2, w / 2, w / 2);
      gr.addColorStop(0, '#' + glowCol.clone().multiplyScalar(0.35).getHexString()); gr.addColorStop(0.35, '#0a1430'); gr.addColorStop(1, '#020309');
      g.fillStyle = gr; g.fillRect(0, 0, w, w);
      g.strokeStyle = 'rgba(80,140,255,0.10)'; g.lineWidth = 2;
      for (let r = 60; r < w / 2; r += 46) { g.beginPath(); g.arc(w / 2, w / 2, r, 0, 7); g.stroke(); }
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(26, 64), new THREE.MeshPhongMaterial({ map: floorTex, color: 0xffffff, specular: 0x334466, shininess: 60 }));
    floor.rotation.x = -Math.PI / 2; R.add(floor);
    // líneas de luz desde la mesa hacia el frente (pasarela)
    const lineMat = additive(th.glow, 0.85);
    for (let i = -3; i <= 3; i++) {
      const a = i * THREE.MathUtils.degToRad(8.5);
      const len = 9;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.06, len), lineMat);
      m.rotation.x = -Math.PI / 2; m.rotation.z = -a;
      const c = polar(TABLE_R + 1.9 + len / 2, a, 0.01); m.position.copy(c); R.add(m);
    }
    // anillos de luz en el suelo
    const ringFloor = new THREE.Mesh(new THREE.RingGeometry(TABLE_R + 0.15, TABLE_R + 0.22, 96), additive(th.glow, 0.9)); ringFloor.rotation.x = -Math.PI / 2; ringFloor.position.y = 0.012; R.add(ringFloor);
    const ringFloor2 = new THREE.Mesh(new THREE.RingGeometry(RING_IN - 0.25, RING_IN - 0.2, 96), additive(th.glow, 0.5)); ringFloor2.rotation.x = -Math.PI / 2; ringFloor2.position.y = 0.012; R.add(ringFloor2);

    // ---------- Mesa central ----------
    const tableTop = canvasTex(1024, 1024, (g, w) => {
      const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      gr.addColorStop(0, '#f4f6fa'); gr.addColorStop(0.7, '#d8dee8'); gr.addColorStop(0.97, '#b9c2d0'); gr.addColorStop(1, '#8c96a8');
      g.fillStyle = gr; g.fillRect(0, 0, w, w);
      g.strokeStyle = 'rgba(90,110,140,0.25)'; g.lineWidth = 3;
      for (const r of [0.42, 0.62, 0.9]) { g.beginPath(); g.arc(w / 2, w / 2, r * w / 2, 0, 7); g.stroke(); }
    });
    const side = canvasTex(1024, 64, (g, w, h) => {
      g.fillStyle = '#0d1426'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#' + glowCol.getHexString(); g.fillRect(0, h * 0.42, w, h * 0.14);
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(0, 0, w, 3);
    }, { repeat: [6, 1] });
    const tableSide = new THREE.Mesh(new THREE.CylinderGeometry(TABLE_R, TABLE_R * 0.97, TOP, 72, 1, true), new THREE.MeshBasicMaterial({ map: side }));
    tableSide.position.y = TOP / 2; R.add(tableSide);
    const top = new THREE.Mesh(new THREE.CircleGeometry(TABLE_R, 72), new THREE.MeshPhongMaterial({ map: tableTop, shininess: 80, specular: 0x666666 }));
    top.rotation.x = -Math.PI / 2; top.position.y = TOP; R.add(top);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(TABLE_R, 0.03, 6, 96), additive(0xffffff, 0.8)); rim.rotation.x = Math.PI / 2; rim.position.y = TOP; R.add(rim);

    // ---------- Escaleras de la pasarela frontal ----------
    const stepM = L(0xd7dde8, 0x101418), stepEdge = additive(th.glow, 0.7);
    const NS = 5;
    for (let i = 0; i < NS; i++) {
      const h = TOP * (i + 1) / (NS + 0.0);
      const z0 = TABLE_R - 0.35 + (NS - 1 - i) * 0.38;
      const b = new THREE.Mesh(new THREE.BoxGeometry(2.8, h, 0.38 + 0.02), stepM);
      b.position.set(0, h / 2, z0 + 0.19); R.add(b);
      const e = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.03), stepEdge); e.position.set(0, h - 0.02, z0 + 0.385); R.add(e);
    }

    // ---------- Anillo de atriles (dos arcos con 5 trampillas cada uno) ----------
    const chev = chevronTex(3, false, th); chev.repeat.set(9, 1);
    const chevL = chevronTex(3, false, th); chevL.repeat.set(-9, 1);
    this.anim.push((dt) => { chev.offset.x -= dt * 0.12; chevL.offset.x += dt * 0.12; });
    const capM = new THREE.MeshPhongMaterial({ color: 0xdfe4ee, specular: 0x777777, shininess: 70, emissive: 0x0b0f18 });
    const darkM = L(0x0b1224);
    for (const sgn of [-1, 1]) {
      const a0 = A0, a1 = A1;
      // cuerpo principal (de a0+4 escalones hasta a1)
      const s0 = a0 + STEP_A * 4;
      R.add(this.arcBlock(RING_IN, RING_OUT, s0, a1, 0, TOP, sgn, capM, darkM));
      // escalones al final de cada arco
      for (let k = 0; k < 4; k++) R.add(this.arcBlock(RING_IN, RING_OUT, a0 + STEP_A * k, a0 + STEP_A * (k + 1), 0, TOP * (k + 1) / 5, sgn, capM, darkM));
      // frontal interior con flechas
      const inner = new THREE.Mesh(new THREE.CylinderGeometry(RING_IN - 0.01, RING_IN - 0.01, TOP, 48, 1, true, 0, a1 - s0), new THREE.MeshBasicMaterial({ map: sgn > 0 ? chev : chevL, side: THREE.BackSide }));
      inner.position.y = TOP / 2;
      inner.rotation.y = sgn > 0 ? s0 : -a1; R.add(inner);
      // tira de luz superior
      const strip = new THREE.Mesh(new THREE.CylinderGeometry(RING_IN, RING_IN, 0.04, 48, 1, true, 0, a1 - a0), additive(th.glow, 0.95));
      strip.position.y = TOP + 0.01; strip.rotation.y = sgn > 0 ? a0 : -a1; R.add(strip);
      // grada trasera blanca
      R.add(this.arcBlock(RING_OUT, TIER_OUT, a0 + 0.12, a1, 0, 1.7, sgn, capM, darkM));
      const tierFront = new THREE.Mesh(new THREE.CylinderGeometry(RING_OUT + 0.01, RING_OUT + 0.01, 0.6, 48, 1, true, 0, a1 - a0 - 0.12), new THREE.MeshBasicMaterial({ map: sgn > 0 ? chev : chevL, side: THREE.BackSide }));
      tierFront.position.y = TOP + 0.3; tierFront.rotation.y = sgn > 0 ? a0 + 0.12 : -a1; R.add(tierFront);
      // barandilla de cristal
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(RING_OUT - 0.15, RING_OUT - 0.15, 0.95, 48, 1, true, 0, a1 - a0 - 0.05), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.10, side: THREE.DoubleSide, depthWrite: false }));
      glass.position.y = TOP + 0.48; glass.rotation.y = sgn > 0 ? a0 + 0.05 : -a1; R.add(glass);
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(RING_OUT - 0.15, RING_OUT - 0.15, 0.03, 48, 1, true, 0, a1 - a0 - 0.05), additive(0xcfe8ff, 0.7));
      rail.position.y = TOP + 0.96; rail.rotation.y = sgn > 0 ? a0 + 0.05 : -a1; R.add(rail);
      // discos de cristal sobre postes (decoración de los atriles traseros)
      const discM = new THREE.MeshBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide });
      const discRim = additive(th.glow, 0.6);
      for (let k = 0; k < 9; k++) {
        const a = a0 + 0.25 + (a1 - a0 - 0.35) * k / 8;
        for (const [rr, hh] of [[RING_OUT + 0.6, 2.25], [TIER_OUT - 0.4, 2.55]] as const) {
          const aa = a + (rr > 9 ? 0.06 : 0);
          const p = polar(rr, sgn * aa);
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, hh - 1.7, 5), L(0x99aabb)); post.position.set(p.x, 1.7 + (hh - 1.7) / 2, p.z); R.add(post);
          const d = new THREE.Mesh(new THREE.CircleGeometry(0.2, 18), discM); d.position.set(p.x, hh + 0.18, p.z); d.lookAt(0, hh + 0.18, 0); R.add(d);
          const dr = new THREE.Mesh(new THREE.RingGeometry(0.19, 0.22, 18), discRim); dr.position.copy(d.position); dr.quaternion.copy(d.quaternion); R.add(dr);
        }
      }
    }

    // ---------- Trampillas ----------
    const hTex = huellaTex(false);
    this.holes.push(this.makeHole(new THREE.Vector3(0, TOP, 0), 0.8, hTex, th));
    // 1-5 a la izquierda (x<0) de delante hacia atrás, 6-10 a la derecha de atrás hacia delante
    const angs: number[] = []; for (let k = 0; k < 5; k++) angs.push(A0 + STEP_A * 4 + 0.22 + (A1 - A0 - STEP_A * 4 - 0.4) * k / 4);
    const pos: THREE.Vector3[] = [];
    for (let k = 0; k < 5; k++) pos.push(polar(6.75, -angs[k], TOP));
    for (let k = 4; k >= 0; k--) pos.push(polar(6.75, angs[k], TOP));
    pos.forEach((p, i) => {
      const h = this.makeHole(p, 0.58, hTex, th);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: numberTex(String(i + 1)), depthWrite: false, transparent: true }));
      spr.scale.set(0.42, 0.42, 1); spr.position.set(p.x, TOP + 2.25, p.z); R.add(spr); h.label = spr;
      // micro con pie delante de cada trampilla
      const dir = new THREE.Vector3(-p.x, 0, -p.z).normalize();
      const mp = p.clone().addScaledVector(dir, 0.75);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.25, 5), L(0x333a44)); st.position.set(mp.x, TOP + 0.62, mp.z); R.add(st);
      const mh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), L(0x888888, 0x222222)); mh.position.set(mp.x, TOP + 1.28, mp.z); R.add(mh);
      this.holes.push(h);
    });

    // ---------- Paredes curvas con flechas + pantallas ----------
    const wallTex = chevronTex(2, true, th); wallTex.repeat.set(6, 1);
    const wallTexL = chevronTex(2, true, th); wallTexL.repeat.set(-6, 1);
    const wallSpan = THREE.MathUtils.degToRad(66);
    for (const sgn of [-1, 1]) {
      const start = THREE.MathUtils.degToRad(100);
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(WALL_R, WALL_R, 2.4, 48, 1, true, 0, wallSpan), new THREE.MeshBasicMaterial({ map: sgn > 0 ? wallTex : wallTexL, side: THREE.BackSide }));
      wall.position.y = 3.0; wall.rotation.y = sgn > 0 ? start : -(start + wallSpan); R.add(wall);
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(WALL_R, WALL_R, 1.8, 48, 1, true, 0, THREE.MathUtils.degToRad(130)), new THREE.MeshLambertMaterial({ color: 0x0a0f1e, side: THREE.BackSide }));
      lower.position.y = 0.9; lower.rotation.y = sgn > 0 ? THREE.MathUtils.degToRad(50) : -THREE.MathUtils.degToRad(180); R.add(lower);
      for (const yy of [1.8, 4.2]) {
        const ls = new THREE.Mesh(new THREE.CylinderGeometry(WALL_R - 0.05, WALL_R - 0.05, 0.05, 48, 1, true, 0, wallSpan), additive(th.glow, 0.9));
        ls.position.y = yy; ls.rotation.y = wall.rotation.y; R.add(ls);
      }
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(WALL_R, WALL_R, 3.2, 48, 1, true, 0, THREE.MathUtils.degToRad(130)), new THREE.MeshLambertMaterial({ color: 0x060914, side: THREE.BackSide }));
      upper.position.y = 5.8; upper.rotation.y = lower.rotation.y; R.add(upper);
    }
    // pantallas con el logo
    // recorte del logo del menú del Scratch (sin los sellos de las esquinas)
    const lcv = document.createElement('canvas'); lcv.width = 640; lcv.height = 430;
    const logoTex = new THREE.CanvasTexture(lcv); logoTex.colorSpace = THREE.SRGBColorSpace;
    const limg = new Image(); limg.onload = () => {
      const g = lcv.getContext('2d')!; g.drawImage(limg, 160, 45, 640, 430, 0, 0, 640, 430);
      g.filter = 'blur(10px)';
      g.drawImage(limg, 160, 150, 130, 95, -10, -10, 130, 95);
      g.drawImage(limg, 650, 150, 160, 120, 590, -15, 160, 120);
      g.filter = 'none'; logoTex.needsUpdate = true;
    }; limg.src = logoUrl;
    const scrMat = new THREE.MeshBasicMaterial({ map: logoTex, color: 0xffffff }); this.screenMats.push(scrMat);
    const frameM = L(0x10182c, 0x05070c);
    const mkScreen = (w: number, h: number, p: THREE.Vector3, look: THREE.Vector3) => {
      const g = new THREE.Group();
      const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), scrMat); g.add(s);
      const fr = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, h + 0.3, 0.2), frameM); fr.position.z = -0.12; g.add(fr);
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.36, h + 0.36), additive(th.glow, 0.35)); edge.position.z = -0.02; g.add(edge);
      g.position.copy(p); g.lookAt(look); R.add(g); return g;
    };
    mkScreen(5.4, 3.6, new THREE.Vector3(0, 3.55, -11.6), new THREE.Vector3(0, 3.0, 0));
    for (const sgn of [-1, 1]) { const p = polar(WALL_R - 0.4, sgn * THREE.MathUtils.degToRad(122), 3.35); mkScreen(3.0, 2.6, p, new THREE.Vector3(0, 3.0, 0)); }
    // estructura del fondo: columnas con luces
    for (const sgn of [-1, 1]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6.2, 0.7), L(0x1a2440, 0x05070c)); col.position.set(sgn * 3.3, 3.1, -11.4); R.add(col);
      for (let k = 0; k < 6; k++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.06), additive(th.glow, 0.9)); l.position.set(sgn * 3.3, 0.8 + k * 0.9, -11.04); R.add(l); }
    }
    // escalones del fondo bajo la pantalla
    for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(5.6 - k * 0.6, 0.3, 0.5), stepM); b.position.set(0, 0.15 + k * 0.3, -10.6 - k * 0.3); R.add(b); }

    // ---------- Techo: anillo de focos y disco central ----------
    const truss = new THREE.Mesh(new THREE.TorusGeometry(10.5, 0.22, 6, 64), L(0x55606e, 0x0a0c10)); truss.rotation.x = Math.PI / 2; truss.position.y = 8.6; R.add(truss);
    const truss2 = new THREE.Mesh(new THREE.TorusGeometry(10.5, 0.12, 6, 64), L(0x55606e)); truss2.rotation.x = Math.PI / 2; truss2.position.y = 9.1; R.add(truss2);
    const ceilGlow = new THREE.Mesh(new THREE.CircleGeometry(9.6, 64), new THREE.MeshBasicMaterial({ map: radialTex([[0, '#' + glowCol.clone().lerp(new THREE.Color(0xffffff), 0.3).getHexString()], [0.55, '#' + glowCol.clone().multiplyScalar(0.8).getHexString()], [0.9, '#0a1840'], [1, '#02040c']]) }));
    ceilGlow.rotation.x = Math.PI / 2; ceilGlow.position.y = 10.2; R.add(ceilGlow);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.5, 0.45, 48), L(0x0d1428, 0x03050a)); disc.position.y = 7.4; R.add(disc);
    const discBottom = new THREE.Mesh(new THREE.CircleGeometry(3.3, 48), new THREE.MeshBasicMaterial({ map: radialTex([[0, '#1a2a50'], [0.7, '#2a3c70'], [0.9, '#' + accCol.getHexString()], [1, '#' + glowCol.getHexString()]]) }));
    discBottom.rotation.x = Math.PI / 2; discBottom.position.y = 7.17; R.add(discBottom);
    const discRim = new THREE.Mesh(new THREE.TorusGeometry(3.45, 0.04, 6, 64), additive(th.glow, 1)); discRim.rotation.x = Math.PI / 2; discRim.position.y = 7.2; R.add(discRim);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 2.8, 4), L(0x333333)); cab.position.set(Math.cos(a) * 3, 9, Math.sin(a) * 3); R.add(cab); }
    // focos del anillo
    const lampM = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const beamTex = vertFadeTex();
    const beams: THREE.Mesh[] = [];
    for (let k = 0; k < 24; k++) {
      const a = k / 24 * Math.PI * 2;
      const lp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), lampM); lp.position.set(Math.cos(a) * 10.5, 8.35, Math.sin(a) * 10.5); R.add(lp);
      if (k % 3 === 0) {
        const len = 10;
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 1.3, len, 12, 1, true), additive(k % 2 ? th.accent : 0xbfdcff, mobile ? 0.07 : 0.09, beamTex));
        beam.geometry.translate(0, -len / 2, 0);
        beam.position.copy(lp.position); beam.lookAt(0, 0, 0); beam.rotateX(-Math.PI / 2);
        // apuntar hacia el centro del plató
        const target = new THREE.Vector3(Math.cos(a) * 4, 0, Math.sin(a) * 4);
        const dir = target.clone().sub(lp.position).normalize();
        beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
        R.add(beam); beams.push(beam);
      }
    }
    this.anim.push((dt, t) => { beams.forEach((b, i) => { (b.material as THREE.MeshBasicMaterial).opacity = (mobile ? 0.06 : 0.08) + 0.03 * Math.sin(t * 0.8 + i); }); });

    // ---------- Luces ----------
    const hemi = new THREE.HemisphereLight(0x9fc0ff, 0x101020, 1.1); R.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(3, 10, 9); R.add(key);
    const p1 = new THREE.PointLight(th.glow, 25, 18, 1.6); p1.position.set(0, 5, 0); R.add(p1);
    const p2 = new THREE.PointLight(th.accent, 14, 16, 1.6); p2.position.set(0, 3, -9); R.add(p2);
    this.lights.push(hemi, key, p1, p2);

    // niebla y fondo
    buildDecor(this, th);
  }

  /** Bloque de arco (sector de corona) extruido */
  arcBlock(r0: number, r1: number, a0: number, a1: number, y0: number, y1: number, sgn: number, cap: THREE.Material, side: THREE.Material) {
    const sh = new THREE.Shape();
    const N = Math.max(4, Math.ceil((a1 - a0) / 0.06));
    // Shape en XY donde (x, y) = (sin a * r, cos a * r) -> luego girar a XZ
    for (let i = 0; i <= N; i++) { const a = a0 + (a1 - a0) * i / N; const x = Math.sin(a) * r1 * sgn, y = -Math.cos(a) * r1; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
    for (let i = N; i >= 0; i--) { const a = a0 + (a1 - a0) * i / N; sh.lineTo(Math.sin(a) * r0 * sgn, -Math.cos(a) * r0); }
    const geo = new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: false, curveSegments: 1 });
    // extruye en +Z de la shape; girar para que la altura sea +Y y (x,y)->(x,z)
    geo.rotateX(-Math.PI / 2); // (x,y,z) -> (x, z, -y)
    if (sgn < 0) { /* espejo invierte caras */ }
    const m = new THREE.Mesh(geo, [cap, side]); m.position.y = y0;
    (cap as any).side = THREE.DoubleSide; (side as any).side = THREE.DoubleSide;
    return m;
  }

  makeHole(p: THREE.Vector3, r: number, tex: THREE.Texture, th: Theme): Hole {
    const g = new THREE.Group(); g.position.copy(p); this.root.add(g);
    const black = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    black.rotation.x = -Math.PI / 2; black.position.y = 0.004; g.add(black);
    // interior: anillo naranja que se ve al abrir
    const innerGlow = new THREE.Mesh(new THREE.RingGeometry(r * 0.75, r, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 1, map: radialTex([[0, '#000'], [0.75, '#000'], [0.9, '#ff5a10'], [1, '#000']]) }));
    innerGlow.rotation.x = -Math.PI / 2; innerGlow.position.y = 0.005; g.add(innerGlow);
    const doorMat = new THREE.MeshBasicMaterial({ map: tex, color: 0xffffff });
    const mkDoor = (s: number) => {
      const pivot = new THREE.Group(); pivot.position.set(s * r, 0.012, 0); g.add(pivot);
      const half = new THREE.Mesh(new THREE.CircleGeometry(r, 24, s > 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI), doorMat);
      // UV: CircleGeometry ya asigna uv del círculo completo
      half.rotation.x = -Math.PI / 2; half.position.x = -s * r; pivot.add(half); return pivot;
    };
    const doorA = mkDoor(-1), doorB = mkDoor(1);
    const activeMat = new THREE.MeshBasicMaterial({ color: th.glow, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(r, r * 1.16, 40), activeMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.014; g.add(ring);
    const halo = new THREE.Mesh(new THREE.RingGeometry(r * 1.1, r * 1.6, 40), new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(255,255,255,0)'], [0.68, 'rgba(255,255,255,0)'], [0.72, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']]), color: th.glow, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.rotation.x = -Math.PI / 2; halo.position.y = 0.016; g.add(halo);
    // cilindro de luz (aro lateral)
    return { pos: p.clone(), r, doorA, doorB, ring, halo, open: 0, target: 0, activeMat };
  }

  setHoleColor(i: number, c: number) { const h = this.holes[i]; h.activeMat.color.setHex(c); (h.halo.material as THREE.MeshBasicMaterial).color.setHex(c); }

  update(dt: number) {
    this.t += dt;
    for (const f of this.anim) f(dt, this.t);
    for (const h of this.holes) {
      h.open += (h.target - h.open) * Math.min(1, dt * 9);
      h.doorA.rotation.z = -h.open * Math.PI * 0.5;
      h.doorB.rotation.z = h.open * Math.PI * 0.5;
    }
  }

  /** Altura del suelo en (x,z) o null si no se puede pasar */
  heightAt(x: number, z: number): number | null {
    const r = Math.hypot(x, z), a = Math.abs(Math.atan2(x, z));
    if (r > WALL_R - 1.0) return null;
    if (z < -10.2 && Math.abs(x) < 3.8) return null; // pantalla del fondo
    if (r < TABLE_R - 0.05) return TOP;
    // escalera frontal
    if (Math.abs(x) < 1.35 && z > 0 && z < TABLE_R - 0.35 + 5 * 0.38 && r >= TABLE_R - 0.05) {
      const k = Math.floor((TABLE_R - 0.35 + 5 * 0.38 - z) / 0.38) + 1; return Math.min(TOP, TOP * k / 5);
    }
    if (Math.abs(x) < 1.6 && z > 0 && z < TABLE_R + 1.6 && r >= TABLE_R - 0.05) return null;
    if (a >= A0 && a <= A1) {
      if (r >= RING_IN && r <= RING_OUT - 0.25) {
        const k = Math.floor((a - A0) / STEP_A);
        return k < 4 ? TOP * (k + 1) / 5 : TOP;
      }
      if (r > RING_OUT - 0.25 && r < TIER_OUT && a > A0 + 0.12) return null; // barandilla / grada
    }
    return 0;
  }
}
