import * as THREE from 'three';
import type { Engine } from './engine';
import { Hud, Session, fmt } from './hud';
import { Stage2D } from './stage2d';
import { Panel, showVidas } from './prueba';
import { audio } from './assets';
import { Bank, Q } from './questions';
import { TOP } from './set3d';
import { gesture } from './people';
import { cabecera, despedida } from './intro';
import { confettiBurst } from './decor';

export interface Ctx { eng: Engine; hud: Hud; st: Stage2D; panel: Panel; s: Session }
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const rnd = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];

// ---------------- Planos de cámara ----------------
export const cams = {
  wide(e: Engine, glide = 0) { const p = V(0, 6.2, 14.2), l = V(0, 1.0, -1.5); glide ? e.glide(p, l, glide) : e.cut(p, l); },
  player(e: Engine, glide = 0) { const pl = e.player.root.position; const p = V(pl.x - 1.0, TOP + 2.0, pl.z + 3.3), l = V(pl.x, TOP + 0.9, pl.z); glide ? e.glide(p, l, glide) : e.cut(p, l); },
  opp(e: Engine, n: number, glide = 0) {
    const o = e.studio.holes[n].pos; const c = o.clone().setY(0).normalize().negate();
    const side = V(-c.z, 0, c.x);
    const p = o.clone().addScaledVector(c, 3.4).addScaledVector(side, 0.8).setY(TOP + 2.2); const l = o.clone().setY(TOP + 0.9);
    glide ? e.glide(p, l, glide) : e.cut(p, l);
  },
  duel(e: Engine, n: number, glide = 0) {
    const a = e.player.root.position.clone(), b = e.studio.holes[n].pos.clone(); const m = a.clone().add(b).multiplyScalar(0.5);
    const d = b.clone().sub(a); let perp = V(d.z, 0, -d.x).normalize(); if (perp.z < 0) perp.negate();
    const dist = Math.max(5.5, d.length() * 1.05);
    const p = m.clone().addScaledVector(perp, dist).setY(TOP + 3.0); const l = m.clone().setY(TOP + 0.55);
    glide ? e.glide(p, l, glide) : e.cut(p, l);
  },
  hole(e: Engine, n: number) { const o = e.studio.holes[n].pos; const c = n ? o.clone().setY(0).normalize().negate() : V(-0.6, 0, 0.8); e.cut(o.clone().addScaledVector(c, 4.4).setY(o.y + 2.3), o.clone().setY(o.y + 0.5)); },
};

// ---------------- Elementos comunes (también los usa el Entrenamiento) ----------------
/** Pantalla ELIGE con las 10 huellas (MenuEscolha + MenuEscolhaop1..10). Devuelve el nº de huella */
export async function eleccion(c: Ctx, used: Set<number>): Promise<number> {
  const { st, s, eng } = c;
  audio.play('SomPalavra');
  cams.wide(eng); eng.startOrbit(V(0, 0, 0), 10.5, 5.6, 0, 0.05, 1);
  st.show('MenuEscolha', 1, { fade: 330, z: 30 });
  let k = 0; const anim = setInterval(() => st.show('MenuEscolha', (k++ % 2) + 1, { z: 30 }), 400);
  let pick = 0;
  for (let n = 1; n <= 10; n++) st.show('MenuEscolhaop' + n, used.has(n) ? 2 : 1, { z: 31, fade: 170, cls: 'huella', click: used.has(n) ? undefined : () => { if (!pick) pick = n; } });
  // también se puede elegir tocando el número en el plató 3D (atajo de teclado 1-9, 0=10 en PC)
  const key = (e: KeyboardEvent) => { const d = '1234567890'.indexOf(e.key); if (d >= 0 && !used.has(d + 1) && !pick) pick = d + 1; };
  addEventListener('keydown', key);
  try { await s.until(() => pick > 0); } finally { removeEventListener('keydown', key); }
  st.show('MenuEscolhaop' + pick, 2, { z: 31, fade: 330 });
  audio.play('SomPalavra');
  st.show('MenuEscolha2', 1, { z: 35, fade: 330, size: 100, from: 0.5 });
  await s.w(350); audio.play('fairydust'); await s.w(2000);
  clearInterval(anim);
  st.setSize('MenuEscolha2', 0, 330); st.hide('MenuEscolha2', 330);
  for (let n = 1; n <= 10; n++) st.hide('MenuEscolhaop' + n, 170); st.hide('MenuEscolha', 170);
  return pick;
}

const LEFT: Record<number, string> = { 1: '+1000', 2: '+25000', 3: '+15000', 4: '+1000', 5: '+1', 6: '+5000', 7: '+1000', 8: 'vida', 9: '+5000', 10: '+50000', 11: 'cero' };
const RIGHT: Record<number, string> = { 1: '+25000', 2: '+1000', 3: '+1000', 4: '+15000', 5: '+15000', 6: 'mitad', 7: '+5000', 8: '+5000', 9: 'doble', 10: 'cero', 11: '+50000' };
export const valorTexto = (v: string) => v === 'vida' ? 'una VIDA EXTRA (comodín)' : v === 'cero' ? '¡LO PIERDES TODO!' : v === 'mitad' ? 'la MITAD de tus puntos' : v === 'doble' ? '¡el DOBLE de tus puntos!' : v.replace('+', '') === '1' ? '1 punto' : fmt(+v) + ' puntos';
export function aplicar(v: string, st: { placar: number; vidas: number; vidaExtra: number }) {
  if (v === 'vida') { st.vidaExtra = 1; st.vidas++; } else if (v === 'cero') st.placar = 0; else if (v === 'mitad') st.placar = Math.floor(st.placar / 2); else if (v === 'doble') st.placar *= 2; else st.placar += +v;
}

/** La moneda: elegir un lado (Moeda1 izquierda / Moeda2 derecha) */
export async function moneda(c: Ctx, opp: number, state: { placar: number; vidas: number; vidaExtra: number; moedas: number[] }, ensayo = false) {
  const { st, s } = c;
  audio.stopMusic(); audio.play('AhoraCaigo - Moeda.mp3');
  st.show('Valores', 'MoedaCapa', { z: 40, fade: 170 }); audio.play('Moeda');
  st.show('Valores2', String(opp), { z: 42, fade: 170 });
  await s.w(1000);
  let side = 0;
  st.show('Moeda1', 1, { z: 41, click: () => { if (!side) side = 1; } });
  st.show('Moeda2', 1, { z: 41, click: () => { if (!side) side = 2; } });
  c.hud.hint('Elige un lado de la moneda');
  const key = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft' && !side) side = 1; if (e.key === 'ArrowRight' && !side) side = 2; };
  addEventListener('keydown', key);
  try { await s.until(() => side > 0); } finally { removeEventListener('keydown', key); c.hud.hint(null); }
  let v = 0; do { v = 1 + Math.floor(Math.random() * 10); } while (state.moedas.includes(v) && state.moedas.length < 10);
  state.moedas.push(v); let cos = v; if (v === 10) cos = Math.random() < 0.5 ? 10 : 11;
  st.show('Valores', String(cos), { z: 40 });
  audio.play('saltar'); await s.w(500);
  const swing = (k: number) => st.tf('Moeda' + k, k === 1 ? 'translate(-140px,40px) rotate(-35deg)' : 'translate(140px,40px) rotate(35deg)', 330);
  swing(side); audio.play('fairydust'); await s.w(1000);
  const val = (side === 1 ? LEFT : RIGHT)[cos], other = (side === 1 ? RIGHT : LEFT)[cos];
  aplicar(val, state);
  c.hud.toast(`Has ganado ${valorTexto(val)}` + (ensayo ? `<br><small>Al otro lado había: ${valorTexto(other)}</small>` : ''), 2600);
  await s.w(1000); swing(side === 1 ? 2 : 1); await s.w(1000);
  ['Valores', 'Valores2', 'Moeda1', 'Moeda2'].forEach(k => st.hide(k, 170));
  return { val, other };
}

export async function contagem(c: Ctx, rodadas: number) {
  audio.play('Moeda'); audio.stopMusic(); audio.playMusic(`AhoraCaigo - Round${Math.min(8, rodadas + 1)}.mp3`);
  c.st.show('ContagemDuelos', rodadas === 0 ? '0' : String(rodadas), { z: 45, fade: 330 });
  await c.s.w(3500); c.st.hide('ContagemDuelos', 330); await c.s.w(330);
}
export async function banner(c: Ctx, name: string, ms = 2500) { audio.play('Moeda'); c.st.show('ContagemDuelos', name, { z: 45, fade: 330 }); await c.s.w(ms); c.st.hide('ContagemDuelos', 330); await c.s.w(330); }

function showDigits(st: Stage2D, placar: number, z: number) {
  const t = String(Math.floor(placar)); const L = t.length;
  const map: Record<number, (string | null)[]> = {
    6: [t[0], t[1], t[2], t[3], t[4], t[5]], 5: [null, t[0], t[1], t[2], t[3], t[4]], 4: [null, t[0], t[1], t[2], t[3], null],
    3: [null, null, t[0], t[1], t[2], null], 2: [null, null, t[0], t[1], null, null], 1: [null, null, null, t[0], null, null],
  };
  const xs = [-70, -42, -14, 14, 42, 70];
  (map[Math.min(6, L)] || map[6]).forEach((d, i) => d == null ? st.hide('PlacarDig' + (i + 1)) : st.show('PlacarDig' + (i + 1), d, { x: xs[i], y: 0, z }));
}
/** Marcador (Gc + dígitos del Scratch) */
export async function marcador(c: Ctx, placar: number, ms = 3000, big = false) {
  audio.play('Moeda'); c.st.show('Gc', 1, { z: 50, fade: 330, size: 150, from: 0.5 });
  await c.s.w(300); showDigits(c.st, placar, 51);
  if (big) c.hud.score(`🏆 ${fmt(placar)} PUNTOS`, true);
  await c.s.w(ms); c.st.hide('Gc', 330); for (let i = 1; i <= 6; i++) c.st.hide('PlacarDig' + i, 330); if (big) c.hud.score(null);
}
/** Tabla de premios (Placar1T) con las monedas ya usadas + marcador */
export async function telaPlacar(c: Ctx, moedas: number[], placar: number, big = false) {
  c.st.show('Painel', 'Placar1T', { z: 48, fade: 330, size: 100, from: 1.5 });
  await c.s.w(500); moedas.forEach(n => c.st.show('PlacarI' + n, 1, { z: 49 }));
  await c.s.w(1500); c.st.hide('Painel', 330); moedas.forEach(n => c.st.hide('PlacarI' + n, 330));
  await marcador(c, placar, 3000, big);
}
export async function transicao(c: Ctx) {
  c.st.show('Painel', 'Transiçao1', { z: 47, fade: 330, from: 1.5 }); await c.s.w(500);
  c.st.show('Painel', 'Transiçao2', { z: 47 }); await c.s.w(400); c.st.hide('Painel', 330); await c.s.w(330);
}

// ---------------- Frases del Presentador ----------------
const H = {
  sube: ['¡Concursante, sube a la trampilla central!', '¡Adelante! Ponte en el centro del plató, encima de la trampilla.'],
  elige: ['¡Elige una huella! Detrás de cada huella hay un oponente.', 'Muy bien… ¿a quién retas ahora? ¡Elige huella!'],
  elegido: (n: number) => rnd([`¡Has elegido al oponente número ${n}!`, `¡El ${n}! Vamos a ver qué sabe…`, `Oponente ${n}, ¡al duelo!`]),
  ok: ['¡CORRECTO!', '¡Muy bien!', '¡Lo has clavado!'],
  pasa: ['¡Pasa! Turno de tu oponente…', 'Usas un comodín: ¡pasa la pregunta!'],
  cae: ['¡Y… AHORA CAE!', '¡Fuera! ¡Abajo!', '¡Hasta luego!'],
  tiempo: ['¡Se acabó el tiempo…!', '¡Oh, no! ¡Tiempo!'],
  moneda: ['¡Elige un lado de la moneda!', 'Vamos a por la moneda: izquierda o derecha.'],
  decision: '¡Has tirado a 8 oponentes! ¿Te plantas con la mitad o te atreves con el Juego Final?',
  final: '¡Juego Final! 10 preguntas en 2 minutos. Si lo consigues, ¡doblas tu marcador!',
};

// ---------------- El programa completo ----------------
export class Programa {
  vidas = 2; placar = 0; acertos = 0; rodadas = 0; vidaExtra = 0; moedas: number[] = []; used = new Set<number>(); bank: Bank;
  timerStop = () => { }; noVidas = false;
  constructor(public c: Ctx) { this.bank = new Bank(c.eng.theme.id); }

  async run() {
    const { eng, hud, s } = this.c;
    eng.resetPositions(); eng.opps.forEach(o => o.root.visible = true);
    // ---- CABECERA ----
    await cabecera(eng, hud, s, eng.theme.id === 'primetime');
    // ---- el Presentador da la bienvenida ----
    { const hp = eng.host.root.position; eng.cut(V(hp.x + 0.9, TOP + 1.7, hp.z + 3.2), V(hp.x, TOP + 1.3, hp.z)); eng.face(eng.host, V(hp.x + 1.2, 0, hp.z + 6)); }
    gesture(eng.host, 'saluda', 2.2); hud.say(eng.theme.saludo, 3800);
    audio.play('TemaCurto');
    await s.w(3600);
    await this.subirAlCentro();
    audio.playMusic('TrilhaCurta');
    cams.wide(eng); eng.opps.forEach((o, i) => setTimeout(() => gesture(o, 'saluda', 1.2), i * 150));
    hud.say('¡Aquí están nuestros 10 oponentes! Tienes que tirar a 8 de ellos para llegar al final.', 3800);
    eng.glide(V(0, 5.2, 9.5), V(0, 1.2, -3), 3.6);
    await s.w(2000); audio.play('AcerteOuCaia SuspEdit', 0.8, 'susp');
    // (pruebas automáticas: empezar en un duelo concreto)
    const tr = (window as any).__testRodadas; if (tr) { this.rodadas = tr; for (let i = 1; i <= tr; i++) { this.used.add(i); eng.opps[i - 1].root.visible = false; } this.placar = 25000; }
    // ---- 8 duelos ----
    while (this.rodadas < 8) {
      await contagem(this.c, this.rodadas); audio.stopTag('susp');
      showVidas(-1, false);
      this.acertos = 0; this.rodadas++;
      cams.wide(eng, 1.0); gesture(eng.host, 'senala', 1.8); hud.say(rnd(H.elige), 2000, eng.host.head); await s.w(1900); hud.hideBubble();
      const opp = await eleccion(this.c, this.used); this.used.add(opp);
      const r = await this.duelo(opp);
      if (r === 'lose') return this.fin('perdido');
      await moneda(this.c, opp, this);
      audio.playMusic('SuspenseDuelo', true); await transicao(this.c);
      await s.w(1500);
      await telaPlacar(this.c, this.moedas, this.placar, eng.theme.id === 'primetime');
      if (this.rodadas === 8) break;
      await s.w(1000);
    }
    if (this.placar === 0) { audio.stopMusic(); hud.say('Has tirado a los 8… pero tu marcador está a cero. ¡Qué mala suerte!', 3500); await s.w(3600); return this.fin('perdido'); }
    // ---- decisión ----
    const d = await this.decision();
    if (d === 'plantarse') {
      this.placar = Math.floor(this.placar / 2);
      audio.stopAll(); await transicao(this.c); audio.playMusic('Trilha');
      cams.player(eng, 1.5); hud.say('¡Te plantas! Te llevas la mitad de tus puntos.', 3000);
      await s.w(1500); await marcador(this.c, this.placar, 4000, true);
      return this.fin('plantado');
    }
    const ok = await this.juegoFinal();
    return this.fin(ok ? 'ganado' : 'perdido');
  }

  async subirAlCentro() {
    const { eng, hud, s } = this.c;
    eng.player.root.position.set(0, 0, 9.5); eng.player.root.rotation.y = Math.PI; eng.walkMode(true);
    hud.say(rnd(H.sube), 4000);
    hud.hint('🕹️ Camina hasta la trampilla central  ·  PC: WASD + ratón');
    let auto = false;
    hud.actions([{ label: 'Ir al centro ▶', fn: () => { auto = true; } }]);
    const center = () => { const p = eng.player.root.position; return Math.hypot(p.x, p.z) < 0.6 && p.y > TOP - 0.15; };
    await s.until(() => center() || auto);
    hud.actions([]); hud.hint(null);
    if (!center()) {
      eng.walkMode(false); cams.wide(eng, 1.2);
      const p = eng.player.root.position; if (p.z < 3.3 || Math.abs(p.x) > 1.5) await s.race(eng.walkTo(eng.player, V(0, 0, 6.5), 3.2));
      await s.race(eng.walkTo(eng.player, V(0, TOP, 0.0), 2.6));
    }
    eng.walkMode(false); eng.player.root.position.set(0, TOP, 0); eng.face(eng.player, V(0, 0, 10));
    eng.studio.setHoleColor(0, eng.theme.accent);
    audio.play('fairydust');
  }

  /** Un duelo (ObjetivoRodada = 1 acierto como en el Scratch) */
  async duelo(opp: number): Promise<'win' | 'lose'> {
    const { eng, hud, st, panel, s } = this.c;
    const o = eng.opps[opp - 1];
    eng.studio.setHoleColor(opp, eng.theme.accent);
    cams.opp(eng, opp); gesture(o, 'saluda', 1.4); hud.say(H.elegido(opp), 2500);
    eng.face(eng.player, o.root.position); eng.face(o, eng.player.root.position);
    audio.playMusic('TrilhaCurta'); await s.w(1000);
    audio.play('AhoraCaigo - ComeceDuelo.mp3');
    st.show('MenuEscolha2', 1, { z: 35, fade: 170 }); cams.duel(eng, opp, 1.6);
    await s.w(2000); audio.playMusic('SuspenseDuelo', true); await s.w(1000);
    st.hide('MenuEscolha2', 330); await s.w(1000);
    while (true) {
      const r = await this.pregunta(this.rodadas, false);
      if (r === 'ok') {
        this.acertos++;
        await s.w(1000);
        // el oponente cae
        panel.hideAll(500); showVidas(-1, false); await s.w(500);
        audio.playMusic('TrilhaCurta'); gesture(eng.host, 'senala', 2); hud.say(rnd(H.ok), 2000);
        cams.opp(eng, opp, 1.2);
        await s.w(3000); audio.stopMusic(); audio.play('AcerteOuCaia SuspEdit', 1, 'susp');
        await s.w(3000);
        await this.caida(opp, o);
        audio.stopTag('susp'); await s.w(500); audio.playMusic('TrilhaCurta');
        gesture(eng.player, 'arriba', 2); cams.player(eng, 1.2); await s.w(2500);
        if (eng.theme.id === 'primetime') confettiBurst(eng.studio, V(0, TOP + 2, 0));
        await s.w(2000);
        return 'win';
      }
      if (r === 'pasa') {
        audio.play('SomPalavra'); this.vidas--; panel.hideAll(300);
        st.show('Painel', 1, { z: 46, fade: 330, from: 1.5 }); hud.say(rnd(H.pasa), 2200);
        showVidas(this.vidas, !!this.vidaExtra);
        gesture(o, 'habla', 2); await s.w(2000); st.hide('Painel', 330); await s.w(400);
        continue;
      }
      // tiempo agotado: cae el concursante
      return this.perder();
    }
  }

  /** gcpergunta + pergunta + teclado + reloj. Devuelve ok | pasa | tiempo */
  async pregunta(ronda: number, final: boolean, q?: Q, onPasa?: () => void, clock?: { left: number }): Promise<'ok' | 'pasa' | 'tiempo'> {
    const { panel, s, hud } = this.c;
    panel.stopInput(); audio.play('SomPalavra');
    panel.showBg(final);
    if (!clock) { panel.showClock(true); panel.setTime(30); }
    await s.w(1300);
    q = q || this.bank.next(ronda);
    if (q.gallina) { audio.stopMusic(); }
    panel.setQuestion(q);
    if (!final && !this.noVidas) showVidas(this.vidas, !!this.vidaExtra);
    let result = null as any as ('ok' | 'pasa' | 'tiempo' | null);
    panel.showPasa(final || this.vidas > 0, () => { if (!result) { result = 'pasa'; onPasa?.(); } });
    if (q.gallina) audio.playMusic('SuspenseDuelo', true);
    panel.ask().then(ok => { if (ok && !result) result = 'ok'; });
    // reloj (como Relogio2: espera 1 s y resta 1 cada 0,98 s)
    let stopClock = () => { };
    if (!clock) {
      let left = 30; const t0 = performance.now() + 1000;
      const iv = setInterval(() => {
        const el = (performance.now() - t0) / 980; const nl = el < 0 ? 30 : Math.max(0, 30 - Math.floor(el) - 1);
        panel.setTime(nl, el < 0 ? 0 : 1 - (el % 1));
        if (nl !== left) { left = nl; if (left === 10) audio.play('10', 1, 'clock'); if (left === 5) audio.play('5', 1, 'clock'); }
        if (left <= 0 && !result) result = 'tiempo';
      }, 50);
      stopClock = () => { clearInterval(iv); audio.stopTag('clock'); };
    }
    try { await s.until(() => !!result || (!!clock && clock.left <= 0)); } finally { stopClock(); }
    if (!result && clock && clock.left <= 0) result = 'tiempo';
    panel.showPasa(false);
    if (result === 'ok') { panel.stopInput(); audio.play('QuemFicaEmPé-Acerto'); await panel.reveal(); hud.toast('¡CORRECTO!', 1100); }
    else if (result === 'tiempo') { panel.stopInput(); audio.play('DropM.mp3'); await panel.reveal(); }
    else panel.stopInput();
    return result!;
  }

  async caida(n: number, p: import('./people').Person) {
    const { eng, hud, s } = this.c;
    const h = eng.studio.holes[n];
    // la trampilla parpadea en rojo (como Quedatela2) y se abre
    cams.hole(eng, n);
    for (let k = 0; k < 3; k++) { eng.studio.setHoleColor(n, 0xff2020); await s.w(330); eng.studio.setHoleColor(n, 0xffffff); await s.w(330); }
    setTimeout(() => audio.play('AhoraCaigo - Queda.mp3'), 0);
    await s.w(500);
    hud.say(rnd(H.cae), 1800, eng.host.head);
    audio.play('DropM.mp3'); eng.shake = 0.5;
    await eng.fall(p, n);
    eng.studio.setHoleColor(n, 0x222222); h.target = 0;
  }

  async perder(): Promise<'lose'> {
    const { eng, hud, panel, s } = this.c;
    audio.stopMusic(); audio.play('AcerteOuCaia Susp.mp3', 1, 'susp');
    hud.say(rnd(H.tiempo), 3000); gesture(eng.host, 'lamenta', 2.5);
    await s.w(4000); panel.hideAll(500); showVidas(-1, false); await s.w(1000);
    this.placar = 0;
    audio.stopTag('susp');
    await this.caida(0, eng.player);
    await s.w(2000);
    await banner(this.c, 'GcPerdeu', 2500);
    return 'lose';
  }

  async decision(): Promise<'plantarse' | 'final'> {
    const { st, s, hud, eng } = this.c;
    audio.stopMusic(); audio.playMusic('AhoraCaigo - Decisão.mp3');
    cams.player(eng, 1.2); hud.say(H.decision, 5000);
    st.show('Painel', 'DesafioFinal', { z: 46, fade: 330 });
    await s.w(500);
    let ch: 'plantarse' | 'final' | null = null;
    st.show('BotãoMenu3', 1, { z: 47, click: () => { ch = ch || 'plantarse'; } });
    st.show('BotãoMenu4', 1, { z: 47, click: () => { ch = ch || 'final'; } });
    await s.until(() => !!ch);
    audio.play('Tecla');
    const k = ch === 'plantarse' ? 'BotãoMenu3' : 'BotãoMenu4';
    st.show(k, 2, { z: 47, fade: 330 }); await s.w(1100);
    ['Painel', 'BotãoMenu3', 'BotãoMenu4'].forEach(x => st.hide(x, 330));
    return ch!;
  }

  async juegoFinal(): Promise<boolean> {
    const { eng, hud, st, panel, s } = this.c;
    this.acertos = 0; audio.stopAll(); await transicao(this.c); audio.playMusic('TrilhaCurta');
    eng.opps.forEach(o => o.root.visible && gesture(o, 'arriba', 1.5));
    cams.player(eng, 1.5); hud.say(H.final, 4000); await s.w(2000);
    await banner(this.c, 'GcDueloFinal', 2500);
    const list: Q[] = []; for (let i = 0; i < 10; i++) list.push(this.bank.next('normal'));
    await s.w(1500); audio.playMusic('SuspenseDuelo', true);
    this.vidas = 0; showVidas(-1, false); await s.w(1500);
    eng.studio.setHoleColor(0, 0xffd23a);
    // reloj único de 2 minutos para las 10 preguntas
    const clock = { left: 120 }; let started = false; let t0 = 0;
    panel.showBg(true); panel.showClock(true); panel.setTime(120);
    const iv = setInterval(() => {
      if (!started) return; const el = (performance.now() - t0) / 980; const nl = Math.max(0, 120 - Math.floor(el));
      if (nl !== clock.left) { clock.left = nl; if (nl === 10) audio.play('10', 1, 'clock'); if (nl === 5) audio.play('5', 1, 'clock'); }
      panel.setTime(clock.left);
    }, 100);
    try {
      while (this.acertos < 10) {
        st.show('PlacarFinal', String(this.acertos), { z: 8, fade: 170 });
        if (!started) { setTimeout(() => { started = true; t0 = performance.now(); }, 2300); }
        const q = list[0];
        const r = await this.pregunta('FINAL' as any, true, q, () => { }, clock);
        if (r === 'ok') { this.acertos++; list.shift(); st.show('PlacarFinal', String(this.acertos), { z: 8, fade: 170 }); await s.w(1000); }
        else if (r === 'pasa') { list.push(list.shift()!); }
        else { clearInterval(iv); st.hide('PlacarFinal', 300); await this.perder(); return false; }
      }
    } finally { clearInterval(iv); audio.stopTag('clock'); }
    panel.hideAll(500); st.hide('PlacarFinal', 300); await s.w(1000);
    this.placar *= 2;
    audio.stopAll(); audio.playMusic('AhoraCaigo - Fim.mp3');
    confettiBurst(eng.studio, V(0, TOP + 1, 0)); confettiBurst(eng.studio, V(-3, 2, -3)); confettiBurst(eng.studio, V(3, 2, -3));
    gesture(eng.player, 'arriba', 3); gesture(eng.host, 'aplaude', 3); cams.player(eng, 1.2);
    hud.say('¡¡HAS GANADO!! ¡Doblas tu marcador!', 4000);
    await s.w(1500); await marcador(this.c, this.placar, 6000, true);
    return true;
  }

  async fin(res: 'perdido' | 'plantado' | 'ganado') {
    const { eng, hud, s, panel } = this.c;
    panel.hideAll(); showVidas(-1, false);
    const line = res === 'ganado' ? `¡Has ganado ${fmt(this.placar)} puntos!` : res === 'plantado' ? `Te has plantado con ${fmt(this.placar)} puntos` : 'Esta vez has caído… ¡a la próxima!';
    await despedida(eng, hud, s, line);
    audio.stopAll();
    return { res, placar: this.placar, rodadas: this.rodadas, line };
  }
}
