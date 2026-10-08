import * as THREE from 'three';
import { Ctx, Programa, eleccion, moneda, marcador, cams } from './show';
import { Bank, Q } from './questions';
import { audio } from './assets';
import { TOP } from './set3d';
import { gesture } from './people';
import { fmt } from './hud';

export type TrainKind = 'pruebas' | 'sintiempo' | 'gallina' | 'final' | 'huellas';

async function colocar(c: Ctx) {
  const e = c.eng; e.resetPositions(); e.walkMode(false);
  e.player.root.position.set(0, TOP, 0); e.face(e.player, new THREE.Vector3(0, 0, 10));
}

export async function entrenamiento(c: Ctx, kind: TrainKind, originales: boolean) {
  const { eng, hud, s, panel } = c;
  await colocar(c);
  const P = new Programa(c); P.noVidas = true; P.bank = new Bank(eng.theme.id, originales);
  let ok = 0, ko = 0, pas = 0;
  const upd = () => hud.score(`✔ ${ok} &nbsp; ✘ ${ko} &nbsp; ⏭ ${pas}`);
  if (kind === 'huellas') return huellas(c);
  cams.player(eng); eng.cut(new THREE.Vector3(1.2, TOP + 2.4, 4.4), new THREE.Vector3(0, TOP + 0.7, 0));
  audio.playMusic('SuspenseDuelo', true, 0.6);
  upd();
  if (kind === 'final') {
    hud.say('Entrenamiento del Juego Final: 10 preguntas en 2 minutos. ¡Sin caídas!', 3500); await s.w(3000);
    const list: Q[] = []; for (let i = 0; i < 10; i++) list.push(P.bank.next('normal'));
    const clock = { left: 120 }; const t0 = performance.now() + 2300;
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
    hud.say(ac === 10 ? '¡Perfecto! Has completado el Juego Final.' : `Tiempo: has acertado ${ac} de 10. ¡Sigue practicando!`, 5000);
    gesture(eng.host, ac === 10 ? 'aplaude' : 'habla', 2.5);
    await s.w(5000); return;
  }
  hud.say(kind === 'gallina' ? '¡Palabra gallina! Completa la letra de la canción.' : 'Entrenamiento de pruebas: escribe las letras que faltan. ¡Sin caídas!', 3500);
  while (true) {
    let r: 'ok' | 'pasa' | 'tiempo';
    if (kind === 'sintiempo') {
      // misma pregunta sin reloj
      panel.stopInput(); audio.play('SomPalavra'); panel.showBg(false); panel.showClock(false);
      await s.w(800);
      const q = P.bank.next('normal'); panel.setQuestion(q);
      let res: any = null; panel.showPasa(true, () => { res = res || 'pasa'; });
      panel.ask().then(v => { if (v) res = res || 'ok'; });
      await s.until(() => !!res); panel.showPasa(false); panel.stopInput();
      if (res === 'ok') { audio.play('QuemFicaEmPé-Acerto'); hud.toast('¡CORRECTO!', 1100); }
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
  hud.say('Practica la elección de huellas y la moneda. ¡Nadie cae!', 3000);
  for (let r = 1; r <= 8; r++) {
    hud.score(`Ronda ${r}/8 · ${fmt(state.placar)} puntos`);
    const n = await eleccion(c, used); used.add(n);
    cams.opp(eng, n, 1.0); gesture(eng.opps[n - 1], 'saluda', 1.5); hud.say(`Has elegido la huella ${n}.`, 1800); await s.w(2000);
    await moneda(c, n, state, true);
    await marcador(c, state.placar, 2200);
  }
  hud.score(`Total: ${fmt(state.placar)} puntos`, true);
  hud.say(`¡Has conseguido ${fmt(state.placar)} puntos en el entrenamiento!`, 5000); await s.w(5000);
}
