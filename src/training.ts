import * as THREE from 'three';
import { Ctx, Programa, eleccion, moneda, marcador, cams } from './show';
import { Bank, Q } from './questions';
import { audio } from './assets';
import { TOP } from './set3d';
import { gesture } from './people';
import { fmt } from './hud';
import { L, fill } from './lines';
import { duelo1v1 } from './duelo';
import { showVidas } from './prueba';
import { publico } from './publico';
import { lector, textoPregunta } from './lectura';
import { PruebaId, tarjetaPrueba, jugarPrueba, eleccionCentral } from './pruebas';

export type TrainKind = 'pruebas' | 'sintiempo' | 'gallina' | 'final' | 'huellas' | 'duelo' | 'entretres' | 'adivina' | 'dameletra' | 'sino' | 'eleccion';

async function colocar(c: Ctx) {
  const e = c.eng; e.resetPositions(); e.walkMode(false);
  e.player.root.position.set(0, TOP, 0); e.face(e.player, new THREE.Vector3(0, 0, 10));
}

export async function entrenamiento(c: Ctx, kind: TrainKind, originales: boolean) {
  const { eng, hud, s, panel } = c;
  await colocar(c);
  hud.hashtag('#AhoraCaigoEntrena');
  const P = new Programa(c); P.noVidas = true; P.bank = new Bank(eng.theme.id, originales);
  let ok = 0, ko = 0, pas = 0;
  const upd = () => hud.score(`✔ ${ok} &nbsp; ✘ ${ko} &nbsp; ⏭ ${pas}`);
  if (kind === 'huellas') return huellas(c);
  if (kind === 'duelo') return dueloEntreno(c, P);
  if (kind === 'entretres' || kind === 'adivina' || kind === 'dameletra' || kind === 'sino') return dueloEntreno(c, P, kind);
  if (kind === 'eleccion') {
    eng.player.root.position.set(0.4, 0, 6.6); eng.face(eng.player, eng.host.root.position);
    const r = await eleccionCentral(c);
    hud.score(r.ganador === 0 ? '🏆 ¡Has sido el más rápido!' : r.ganador > 0 ? '⏱ Esta vez te han ganado' : '🤷 Nadie acertó', true); return;
  }
  cams.player(eng); eng.cut(new THREE.Vector3(1.2, TOP + 2.4, 4.4), new THREE.Vector3(0, TOP + 0.7, 0));
  audio.playMusic('SuspenseDuelo', true, 0.6);
  upd();
  if (kind === 'final') {
    hud.say(L.trFinal, 3500); await s.w(3000);
    const list: Q[] = []; for (let i = 0; i < 10; i++) list.push(P.bank.next('normal'));
    const clock = { left: 120 }; const t0 = performance.now() + 2300; (window as any).__jfClock = clock;
    panel.showBg(true); panel.showClock(true); panel.setTime(120);
    const iv = setInterval(() => { const el = (performance.now() - t0) / 980; const nl = el < 0 ? 120 : Math.max(0, 120 - Math.floor(el)); if (nl !== clock.left) { clock.left = nl; if (nl === 10) audio.play('10', 1, 'clock'); } panel.setTime(clock.left); }, 100);
    let ac = 0;
    try {
      while (ac < 10) {
        c.st.show('PlacarFinal', String(ac), { z: 8 });
        const r = await P.pregunta('FINAL' as any, true, list[0], () => { }, clock);
        if (r === 'ok') { ac++; ok++; list.shift(); } else if (r === 'pasa') { pas++; list.push(list.shift()!); } else { ko++; break; }
        upd(); await s.w(r === 'ok' ? 900 : 200);
      }
    } finally { clearInterval(iv); audio.stopTag('clock'); }
    c.st.hide('PlacarFinal'); panel.hideAll(300);
    hud.say(ac === 10 ? L.trFinalOk : fill(L.trFinalT, ac), 5000);
    gesture(eng.host, ac === 10 ? 'aplaude' : 'habla', 2.5);
    await s.w(5000); return;
  }
  hud.say(kind === 'gallina' ? L.trGallina : L.trPruebas, 3500);
  while (true) {
    let r: 'ok' | 'pasa' | 'tiempo';
    if (kind === 'sintiempo') {
      // misma pregunta sin reloj
      panel.stopInput(); audio.play('SomPalavra@Gcpgt1'); panel.showBg(false); panel.showClock(false);
      await s.w(800);
      const q = P.bank.next('normal'); panel.setQuestion(q);
      let res: any = null; panel.showPasa(true, () => { res = res || 'pasa'; });
      panel.ask().then(v => { if (v) res = res || 'ok'; });
      lector.leer(textoPregunta(q), { delay: 300 });
      await s.until(() => !!res); lector.stop(); panel.showPasa(false); panel.stopInput();
      if (res === 'ok') { audio.play('QuemFicaEmPé-Acerto'); publico.aplauso(2, 0.6); hud.toast('¡CORRECTO!', 1100); }
      await panel.reveal(); r = res;
    } else {
      P.vidas = 99; r = await P.pregunta(kind === 'gallina' ? 'gallina' as any : 'normal' as any, false);
    }
    if (r === 'ok') { ok++; gesture(eng.player, 'arriba', 1.2); }
    else { r === 'pasa' ? pas++ : ko++; await panel.reveal(); hud.toast(r === 'pasa' ? 'Pasada. La respuesta era la que ves en rojo/descubierta' : '¡Tiempo! Mira la respuesta correcta', 2000); }
    upd(); await s.w(r === 'ok' ? 1200 : 2400);
    panel.hideQuestion(250); await s.w(260);
  }
}

async function huellas(c: Ctx) {
  const { eng, hud, s } = c;
  const state = { placar: 0, vidas: 2, vidaExtra: 0, moedas: [] as number[] };
  const used = new Set<number>();
  hud.say(L.trHuellas, 3000);
  for (let r = 1; r <= 8; r++) {
    hud.score(`Ronda ${r}/8 · ${fmt(state.placar)} puntos`);
    const n = await eleccion(c, used); used.add(n);
    cams.opp(eng, n, 1.0); gesture(eng.opps[n - 1], 'saluda', 1.5); hud.say(fill(L.trHuellaT, n), 1800); await s.w(2000);
    await moneda(c, n, state, true);
    await marcador(c, state.placar, 2200);
  }
  hud.score(`Total: ${fmt(state.placar)} puntos`, true);
  hud.say(L.trHuellasFin, 5000); await s.w(5000);
}

/** Duelo contra un oponente-bot (turnos, dos relojes, PASAR con comodín) sin caídas */
async function dueloEntreno(c: Ctx, P: Programa, tipo: PruebaId = 'clasico') {
  const { eng, hud, s, panel } = c;
  const opp = (window as any).__trOpp || 1 + Math.floor(Math.random() * 10);
  P.noVidas = false; P.vidas = 2; P.vidaExtra = 0; P.rodadas = (window as any).__trRonda || 4;
  const o = eng.opps[opp - 1];
  eng.face(eng.player, o.root.position); eng.face(o, eng.player.root.position);
  eng.studio.setHoleColor(opp, eng.theme.accent);
  cams.opp(eng, opp); gesture(o, 'saluda', 1.4);
  if (tipo === 'clasico') { hud.say(L.trDuelo, 3500); await s.w(3200); } else await tarjetaPrueba(c, tipo);
  audio.play('AhoraCaigo - ComeceDuelo.mp3'); hud.subs('AhoraCaigo - ComeceDuelo.mp3', false);
  cams.duel(eng, opp, 1.4); await s.w(1800);
  audio.playMusic('SuspenseDuelo', true, 0.6);
  const r = await jugarPrueba(P, opp, tipo, { training: true });
  panel.hideAll(400); showVidas(-1, false); audio.stopMusic(0.6);
  hud.score(r === 'win' ? '🏆 ¡Duelo ganado!' : '⏱ Duelo perdido', true);
  gesture(r === 'win' ? eng.player : o, 'arriba', 2.5); gesture(eng.host, r === 'win' ? 'aplaude' : 'habla', 2.5);
  cams.duel(eng, opp, 1.2);
  hud.say(r === 'win' ? L.trDueloWin : L.trDueloLose, 4500); await s.w(4500);
  eng.studio.setHoleColor(opp, 0xffffff);
}
