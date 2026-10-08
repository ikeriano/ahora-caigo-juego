// Pruebas del duelo (v1.3): marco común para tipos de prueba + Entre tres, Adivina y la Elección del central.
//  - Cada duelo del Programa usa una prueba (mezcladas: no casi todo Clásico) y se anuncia con un rótulo en la pantalla grande.
//  - También «¡Dame letra!» y «¿Sí o no?». Pendiente (se enchufa aquí cuando llegue el vídeo de referencia): «Vaya lío».
import * as THREE from 'three';
import type { Programa, Ctx } from './show';
import { cams } from './show';
import type { DuelResult } from './duelo';
import { duelo1v1, botSkill } from './duelo';
import { audio } from './assets';
import { gesture } from './people';
import { publico } from './publico';
import { showVidas } from './prueba';
import { cons } from './concursantes';
import { TOP } from './set3d';
import { Q, norm } from './questions';
import { ENTRE_TRES, ADIVINA, CENTRAL, DAME_LETRA, SI_NO } from './bancos';
import { canvasTex } from './tex';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const W = window as any;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const esc = (t: string) => t.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[ch]);
const shuffle = <T>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ------------------------------------------------------------------ marco común
export type PruebaId = 'clasico' | 'gallina' | 'entretres' | 'adivina' | 'dameletra' | 'sino' | 'vayalio';
export interface Prueba { titulo: string; lista: boolean; dicho: string; jugar?: (P: Programa, opp: number, o: { training?: boolean }) => Promise<DuelResult> }
export const PRUEBAS: Record<PruebaId, Prueba> = {
  clasico: { titulo: 'CLÁSICO', lista: true, dicho: 'Duelo clásico: completad la palabra antes de que se acabe vuestro reloj.', jugar: (P, opp, o) => duelo1v1(P, opp, o) },
  gallina: { titulo: 'PALABRA GALLINA', lista: true, dicho: '¡Atención, palabra gallina! Escuchad bien la canción.', jugar: (P, opp, o) => duelo1v1(P, opp, o) },
  entretres: { titulo: 'ENTRE TRES', lista: true, dicho: '¡Os toca Entre tres! Tres respuestas y solo cinco segundos para elegir.', jugar: (P, opp, o) => entreTres(P, opp, o) },
  adivina: { titulo: '¡ADIVINA!', lista: true, dicho: '¡Prueba Adivina! Las pistas salen una a una: el primero que lo sepa, que pulse.', jugar: (P, opp, o) => adivina(P, opp, o) },
  dameletra: { titulo: '¡DAME LETRA!', lista: true, dicho: '¡Dame letra! Pedid una letra por turnos y, si sabéis la frase, decidla entera en diez segundos.', jugar: (P, opp, o) => dameLetra(P, opp, o) },
  sino: { titulo: '¿SÍ O NO?', lista: true, dicho: '¿Sí o no? Una pregunta cada uno, cinco segundos y solo dos botones.', jugar: (P, opp, o) => siNo(P, opp, o) },
  // pendiente del vídeo de referencia de Iker (no se elige todavía)
  vayalio: { titulo: '¡VAYA LÍO!', lista: false, dicho: '' },
};
export const lineasPruebas = () => Object.values(PRUEBAS).filter(p => p.lista).map(p => p.dicho);

/** Plan de las 8 pruebas del programa: mezcla variada (máx. 3 Clásicos; ronda 5 = Palabra gallina si hay canciones) */
export function planPruebas(gallina5: boolean): PruebaId[] {
  for (let tries = 0; tries < 50; tries++) {
    const extra: PruebaId[] = ['clasico', 'entretres', 'adivina', 'dameletra', 'sino'];
    const base: PruebaId[] = shuffle(['clasico', 'clasico', 'entretres', 'adivina', 'dameletra', 'sino', extra[Math.floor(Math.random() * 5)], extra[1 + Math.floor(Math.random() * 4)]]);
    if (gallina5) { const i = base.indexOf('clasico'); base.splice(i, 1); base.splice(4, 0, 'gallina'); base.length = 8; }
    let ok = true; for (let i = 2; i < 8; i++) if (base[i] === base[i - 1] && base[i] === base[i - 2]) ok = false;
    if (ok) return base;
  }
  return ['entretres', 'clasico', 'dameletra', 'sino', gallina5 ? 'gallina' : 'clasico', 'adivina', 'clasico', 'entretres'];
}

/** Rótulo de la prueba: cápsula naranja con letras blancas biseladas sobre fondo azul con destellos */
export function pruebaCanvas(titulo: string, w = 640, h = 430) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d')!;
  const bg = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7); bg.addColorStop(0, '#2f7bff'); bg.addColorStop(0.55, '#0a2fa8'); bg.addColorStop(1, '#020a3a');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.save(); g.translate(w / 2, h / 2); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) { // destellos
    const a = (i / 26) * Math.PI * 2 + (i % 3) * 0.07, len = w * (0.45 + (i * 37 % 10) / 20);
    const lg = g.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len); lg.addColorStop(0, 'rgba(160,220,255,0)'); lg.addColorStop(0.35, 'rgba(160,220,255,.35)'); lg.addColorStop(1, 'rgba(160,220,255,0)');
    g.strokeStyle = lg; g.lineWidth = 2 + (i % 4) * 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * len, Math.sin(a) * len); g.stroke();
  }
  g.restore();
  // cápsula
  let fs = Math.round(h * 0.2); g.font = `900 ${fs}px "Arial Black", Arial, sans-serif`;
  while (g.measureText(titulo).width > w * 0.74 && fs > 20) { fs -= 2; g.font = `900 ${fs}px "Arial Black", Arial, sans-serif`; }
  const tw = g.measureText(titulo).width, pw = tw + fs * 1.3, ph = fs * 1.7, px = (w - pw) / 2, py = (h - ph) / 2;
  const rr = (x: number, y: number, ww: number, hh: number, r: number) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); };
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 24; g.shadowOffsetY = 8;
  rr(px - 6, py - 6, pw + 12, ph + 12, ph / 2 + 6); g.fillStyle = '#fff4d0'; g.fill(); g.shadowColor = 'transparent';
  const og = g.createLinearGradient(0, py, 0, py + ph); og.addColorStop(0, '#ffb43a'); og.addColorStop(0.5, '#ff7a00'); og.addColorStop(1, '#e05000');
  rr(px, py, pw, ph, ph / 2); g.fillStyle = og; g.fill();
  const gl = g.createLinearGradient(0, py, 0, py + ph * 0.5); gl.addColorStop(0, 'rgba(255,255,255,.55)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  rr(px + ph * 0.18, py + 5, pw - ph * 0.36, ph * 0.42, ph * 0.21); g.fillStyle = gl; g.fill();
  // texto blanco biselado
  g.textAlign = 'center'; g.textBaseline = 'middle'; const tx = w / 2, ty = h / 2 + fs * 0.04;
  g.lineJoin = 'round'; g.lineWidth = fs * 0.16; g.strokeStyle = '#8a2a00'; g.strokeText(titulo, tx, ty + 3);
  g.fillStyle = '#9a3a00'; g.fillText(titulo, tx, ty + 4);
  const tg = g.createLinearGradient(0, ty - fs / 2, 0, ty + fs / 2); tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.55, '#fff6e6'); tg.addColorStop(1, '#ffd9a8');
  g.fillStyle = tg; g.fillText(titulo, tx, ty);
  return c;
}

/** Anuncia la prueba en la pantalla grande del plató (y en un rótulo en pantalla) */
export async function tarjetaPrueba(c: Ctx, id: PruebaId) {
  const { eng, hud, s } = c; const P = PRUEBAS[id];
  const cv = pruebaCanvas(P.titulo); const tex = canvasTex(640, 430, g => g.drawImage(cv, 0, 0));
  const mats = eng.studio.screenMats; const old = mats.map(m => m.map);
  mats.forEach(m => { m.map = tex; m.needsUpdate = true; });
  eng.cut(V(0, 3.1, -3.2), V(0, 3.4, -11.6)); eng.glide(V(0, 3.3, -5.6), V(0, 3.5, -11.6), 2.6);
  const ov = document.createElement('div'); ov.id = 'pruebaCard'; ov.appendChild(cv); document.getElementById('hud')!.appendChild(ov);
  audio.play('Moeda@ContagemDuelos'); W.__prueba = { id, titulo: P.titulo };
  let done = false; hud.say(P.dicho, 2600).then(() => { done = true; });
  try { await s.w(1500); ov.classList.add('out'); await s.until(() => done); await s.w(300); }
  finally { ov.remove(); const st = eng.studio; if (st.screenMats === mats) mats.forEach((m, i) => { m.map = old[i]; m.needsUpdate = true; }); tex.dispose(); }
}

export async function jugarPrueba(P: Programa, opp: number, id: PruebaId, o: { training?: boolean } = {}): Promise<DuelResult> {
  const pr = PRUEBAS[id]; return (pr.lista && pr.jugar ? pr.jugar : PRUEBAS.clasico.jugar!)(P, opp, o);
}

// ------------------------------------------------------------------ utilidades de los duelos nuevos
const used = { e3: new Set<number>(), adv: new Set<number>(), cen: new Set<number>(), dl: new Set<number>(), sn: new Set<number>() };
function pick<T>(arr: T[], set: Set<number>): [T, number] { if (set.size >= arr.length) set.clear(); let i; do { i = Math.floor(Math.random() * arr.length); } while (set.has(i)); set.add(i); return [arr[i], i]; }
/** plano de cara de una persona (para la pantalla partida) */
function faceCam(p: THREE.Object3D, toward: THREE.Vector3): [THREE.Vector3, THREE.Vector3] {
  const pos = p.position.clone(); const d = toward.clone().sub(pos).setY(0).normalize(); const side = V(-d.z, 0, d.x);
  return [pos.clone().addScaledVector(d, 2.3).addScaledVector(side, 0.35).setY(pos.y + 1.55), pos.clone().setY(pos.y + 1.3)];
}
function splitOn(c: Ctx, opp: number) {
  const { eng } = c; const pl = eng.player.root, ob = eng.opps[opp - 1].root;
  eng.face(eng.player, ob.position); eng.face(eng.opps[opp - 1], pl.position);
  eng.split = { a: faceCam(pl, ob.position), b: faceCam(ob, pl.position) };
  eng.studio.holes.forEach(h => { if (h.label) h.label.visible = false; });
  const d = document.createElement('div'); d.id = 'splitUi';
  d.innerHTML = `<i class="sdiv"></i><span class="stag l">${esc(cons.central || 'Tú')}</span><span class="stag r">${esc(cons.rival(opp))}</span>`;
  document.getElementById('hud')!.appendChild(d);
}
function splitOff(c: Ctx) { c.eng.split = null; c.eng.studio.holes.forEach(h => { if (h.label) h.label.visible = true; }); document.getElementById('splitUi')?.remove(); }
/** reloj pequeño de la prueba (formato del programa 00:00) */
const fmtClock = (t: number) => { const s = Math.max(0, t); return String(Math.floor(s)).padStart(2, '0') + ':' + String(Math.floor((s % 1) * 100)).padStart(2, '0'); };
/** intenta salvar al central con un comodín. true = salvado */
function comodin(P: Programa, c: Ctx, o: { training?: boolean }) {
  if (P.vidas > 0 && !P.noVidas) {
    P.vidas--; if (P.vidaExtra && P.vidas < 1) P.vidaExtra = 0; showVidas(P.vidas, !!P.vidaExtra);
    c.hud.toast('🃏 ¡Te salva un comodín!', 1800); audio.play('SomPalavra@Teclado27'); publico.aplauso(1.6, 0.5); return true;
  }
  return false;
}

// ------------------------------------------------------------------ ENTRE TRES
export async function entreTres(P: Programa, opp: number, o: { training?: boolean } = {}): Promise<DuelResult> {
  const c = P.c; const { eng, hud, s } = c; const bot = eng.opps[opp - 1];
  const k = W.__botSkill ?? botSkill(opp, P.rodadas || 4);
  const ui = document.createElement('div'); ui.id = 'e3'; ui.className = 'ui';
  ui.innerHTML = `<div class="e3clock" id="e3c">05:00</div><div class="e3who" id="e3w"></div><div class="e3q" id="e3q"></div><div class="e3opts" id="e3o"></div>`;
  document.getElementById('hud')!.appendChild(ui);
  const $ = (id: string) => ui.querySelector('#' + id) as HTMLElement;
  splitOn(c, opp); if (!o.training || P.vidas > 0) showVidas(P.vidas, !!P.vidaExtra);
  const log: string[] = []; W.__e3 = { turn: 'me', log, q: null as any, choose: (i: number) => { } };
  let turn: 'me' | 'bot' = W.__meFirst === false ? 'bot' : 'me';
  try {
    for (let n = 0; n < 40; n++) {
      const [q] = pick(ENTRE_TRES, used.e3); W.__e3.q = q; W.__e3.turn = turn;
      $('e3w').textContent = turn === 'me' ? `Responde: ${cons.central || 'Tú'}` : `Responde: ${cons.rival(opp)}`; $('e3w').className = 'e3who ' + turn;
      $('e3q').textContent = q[0];
      $('e3o').innerHTML = q[1].map((t, i) => `<button class="e3b" data-i="${i}"><small>${i + 1}</small>${esc(t)}</button>`).join('');
      ui.classList.remove('in'); void ui.offsetWidth; ui.classList.add('in');
      audio.play('SomPalavra@Gcpgt1');
      let choice = -1; const btns = [...ui.querySelectorAll('.e3b')] as HTMLButtonElement[];
      const choose = (i: number) => { if (choice < 0 && turn === 'me') { choice = i; audio.play('Tecla'); } };
      W.__e3.choose = choose;
      btns.forEach((b, i) => b.onclick = (e) => { e.stopPropagation(); choose(i); });
      const key = (e: KeyboardEvent) => { const d = '123'.indexOf(e.key); if (d >= 0) choose(d); };
      addEventListener('keydown', key);
      await s.w(700);
      const T = W.__e3Clock || 5; const t0 = performance.now();
      // el bot decide
      const botAt = rnd(lerp(3.6, 1.3, k), lerp(4.6, 2.6, k)); const botOk = W.__botForce === 'fail' ? false : W.__botForce === 'win' ? true : Math.random() < lerp(0.62, 0.93, k);
      const botTimeout = !W.__botForce && Math.random() < lerp(0.08, 0.02, k);
      if (turn === 'bot') gesture(bot, 'habla', 2);
      try {
        await s.until(() => {
          const el = (performance.now() - t0) / 1000; $('e3c').textContent = fmtClock(T - el); $('e3c').classList.toggle('low', T - el < 2);
          if (turn === 'bot' && choice < 0 && !botTimeout && el >= botAt) { choice = botOk ? q[2] : (q[2] + 1 + Math.floor(Math.random() * 2)) % 3; }
          return choice >= 0 || el >= T;
        });
      } finally { removeEventListener('keydown', key); }
      const ok = choice === q[2];
      btns.forEach((b, i) => { b.disabled = true; if (i === choice) b.classList.add(ok ? 'ok' : 'bad'); if (i === q[2]) b.classList.add('right'); });
      log.push(`${turn}:${choice < 0 ? 'tiempo' : ok ? 'ok' : 'mal'}`);
      if (ok) { audio.play('QuemFicaEmPé-Acerto'); publico.aplauso(turn === 'me' ? 2.2 : 1.4, turn === 'me' ? 0.7 : 0.45); gesture(turn === 'me' ? eng.player : bot, 'arriba', 1.2); await s.w(1300); turn = turn === 'me' ? 'bot' : 'me'; continue; }
      audio.play(choice < 0 ? 'DropM.mp3' : 'Erro'); publico.ooh(0.8); gesture(turn === 'me' ? eng.player : bot, 'lamenta', 1.5);
      hud.toast(choice < 0 ? '⏱ ¡Se acabó el tiempo!' : '✘ ¡Respuesta incorrecta!', 1400);
      await s.w(1500);
      if (turn === 'bot') return 'win';
      if (comodin(P, c, o)) { await s.w(1200); turn = 'bot'; continue; }
      return 'lose';
    }
    return 'win';
  } finally { ui.remove(); splitOff(c); cams.duel(eng, opp); }
}

// ------------------------------------------------------------------ ADIVINA
/** Q con todas las letras ocultas (se escriben como en el Clásico) */
export function qOculta(id: string, text: string, word: string): Q {
  const hidden = [...word].map(ch => ch !== ' '); const miss: string[] = [];
  [...word].forEach(ch => { const n = norm(ch); if (n && !miss.includes(n)) miss.push(n); });
  return { id, kind: 'txt', text, word, hidden, missing: miss };
}
export async function adivina(P: Programa, opp: number, o: { training?: boolean } = {}): Promise<DuelResult> {
  const c = P.c; const { eng, hud, panel, s } = c; const bot = eng.opps[opp - 1];
  const k = W.__botSkill ?? botSkill(opp, P.rodadas || 4);
  const ui = document.createElement('div'); ui.id = 'adv'; ui.className = 'ui';
  ui.innerHTML = `<div class="advclock" id="advc">00:00</div><div class="advcard"><h4 id="advcat"></h4><ol id="advlist"></ol></div><div class="advbig" id="advbig"></div><button class="advbuzz" id="btnLoSe">🖐 ¡LO SÉ!</button>`;
  document.getElementById('hud')!.appendChild(ui);
  const $ = (id: string) => ui.querySelector('#' + id) as HTMLElement;
  splitOn(c, opp); if (!o.training || P.vidas > 0) showVidas(P.vidas, !!P.vidaExtra);
  const log: string[] = []; W.__adv = { log, item: null as any, clue: -1, buzz: () => { } };
  try {
    for (let n = 0; n < 12; n++) {
      const [it, idx] = pick(ADIVINA, used.adv); W.__adv.item = it; W.__adv.clue = -1;
      $('advcat').textContent = it.cat; $('advlist').innerHTML = ''; $('advbig').textContent = ''; ui.classList.remove('buzzed');
      const PER = W.__advPer || 3.6; const TOTAL = PER * 5 + 6;
      // el bot pulsa en una pista que depende de su nivel
      const ci = clamp(Math.round(lerp(3.7, 1.0, k) + rnd(-0.8, 0.8)), 0, 4);
      const botAt = W.__botForce === 'fail' ? 1e9 : W.__botForce === 'win' ? PER * 0.5 + 1 : PER * ci + rnd(0.9, 2.4);
      const botOk = W.__botForce === 'win' ? true : Math.random() < clamp(lerp(0.55, 0.88, k) + ci * 0.05, 0, 0.97);
      let buzz: 'me' | 'bot' | null = null;
      const meBuzz = () => { if (!buzz) { buzz = 'me'; audio.play('Tecla'); } };
      W.__adv.buzz = meBuzz;
      ($('btnLoSe') as HTMLButtonElement).onclick = (e) => { e.stopPropagation(); meBuzz(); };
      const key = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') meBuzz(); };
      addEventListener('keydown', key);
      audio.play('SomPalavra@Gcpgt1'); await s.w(500);
      const t0 = performance.now(); let shown = -1;
      try {
        await s.until(() => {
          const el = (performance.now() - t0) / 1000; $('advc').textContent = fmtClock(TOTAL - el); $('advc').classList.toggle('low', TOTAL - el < 4);
          const want = Math.min(4, Math.floor(el / PER));
          while (shown < want) { shown++; W.__adv.clue = shown; const li = document.createElement('li'); li.textContent = it.pistas[shown]; $('advlist').appendChild(li); $('advbig').textContent = it.pistas[shown]; $('advbig').classList.remove('pop'); void $('advbig').offsetWidth; $('advbig').classList.add('pop'); audio.play('saltar', 0.6); }
          if (!buzz && el >= botAt) buzz = 'bot';
          if (!buzz && el >= TOTAL) buzz = 'bot'; // nadie pulsa: el oponente tiene que arriesgar
          return !!buzz;
        });
      } finally { removeEventListener('keydown', key); }
      ui.classList.add('buzzed'); const lateGuess = (performance.now() - t0) / 1000 >= TOTAL;
      const q = qOculta('adv-' + idx, `${it.cat}: ${it.pistas.slice(0, shown + 1).join(' · ')}`, it.r);
      log.push(`buzz:${buzz}@${shown}`);
      if (buzz === 'me') {
        hud.say('¡Lo sé!', 1200, eng.player.head, cons.central || 'Tú', { voice: false });
        panel.showBg(false); panel.showClock(false); panel.setQuestion(q);
        let res: boolean | null = null; panel.ask().then(r => { if (r && res == null) res = true; });
        const tA = performance.now(), LIM = W.__advAnswer || 10;
        await s.until(() => { const el = (performance.now() - tA) / 1000; $('advc').textContent = fmtClock(LIM - el); if (el >= LIM && res == null) res = false; return res != null; });
        panel.stopInput();
        if (res) { await panel.reveal(); audio.play('QuemFicaEmPé-Acerto'); publico.aplauso(2.4, 0.7); hud.toast('¡CORRECTO! Era: ' + it.r, 1600); log.push('me:ok'); await s.w(1600); panel.hideAll(300); return 'win'; }
        audio.play('DropM.mp3'); publico.ooh(0.8); hud.toast('✘ Era: ' + it.r, 1800); log.push('me:mal'); await s.w(1800); panel.hideAll(300);
        if (comodin(P, c, o)) { await s.w(1000); continue; }
        return 'lose';
      }
      // el oponente pulsa (o arriesga al final)
      gesture(bot, 'habla', 1.5); hud.say(lateGuess ? '¡Voy a arriesgar!' : '¡Lo sé!', 1300, bot.head, cons.rival(opp), { voice: false });
      panel.showBg(false); panel.showClock(false); panel.setQuestion(q); panel.botSlots('', 'bot', '💭');
      const ok = lateGuess ? botOk && Math.random() < 0.7 : botOk;
      await s.w(900);
      const ans = q.missing.join(''); const wrongAns = [...ans].map((ch, i) => i === ans.length - 1 ? 'XZQ'.replace(ch, '')[0] : ch).join('');
      const typed = ok ? ans : wrongAns;
      for (let i = 1; i <= typed.length; i++) { await s.w(rnd(160, 320)); audio.play('saltar', 0.5); panel.botSlots(typed.slice(0, i), 'bot'); }
      await s.w(300);
      if (ok) {
        panel.botSlots(ans, 'ok'); await panel.reveal(); audio.play('QuemFicaEmPé-Acerto'); publico.aplauso(1.6, 0.45); gesture(bot, 'arriba', 1.2);
        hud.toast(`${cons.rival(opp)} acierta: ${it.r}`, 1600); log.push('bot:ok'); await s.w(1700); panel.hideAll(300);
        if (comodin(P, c, o)) { await s.w(1000); continue; }
        return 'lose';
      }
      panel.botSlots(typed, 'bad'); audio.play('Erro'); publico.ooh(0.8); gesture(bot, 'lamenta', 1.5);
      hud.toast(`✘ ${cons.rival(opp)} falla. Era: ${it.r}`, 1800); log.push('bot:mal'); await s.w(1800); panel.hideAll(300);
      return 'win';
    }
    return 'win';
  } finally { ui.remove(); splitOff(c); panel.hideAll(); cams.duel(eng, opp); }
}

// ------------------------------------------------------------------ comodines dentro de un duelo
/** El central juega con sus comodines (P.vidas). El oponente empieza sin ninguno y solo puede conseguirlos robándolos. */
function marcadorComodines(P: Programa, opp: number) {
  const st = { bot: 0 };
  const tag = () => { const r = document.querySelector('#splitUi .stag.r'); if (r) r.innerHTML = esc(cons.rival(opp)) + (st.bot > 0 ? ` <em class="scom">🃏×${st.bot}</em>` : ''); };
  const get = (w: 'me' | 'bot') => w === 'me' ? (P.noVidas ? 0 : P.vidas) : st.bot;
  const set = (w: 'me' | 'bot', n: number) => {
    if (w === 'bot') { st.bot = Math.max(0, n); tag(); return; }
    if (P.noVidas) return; P.vidas = Math.max(0, n); if (P.vidaExtra && P.vidas < 1) P.vidaExtra = 0; showVidas(P.vidas, !!P.vidaExtra);
  };
  return { get, set, tag, st };
}
const nombreDe = (w: 'me' | 'bot', opp: number) => w === 'me' ? (cons.central || 'Tú') : cons.rival(opp);
const otro = (w: 'me' | 'bot'): 'me' | 'bot' => w === 'me' ? 'bot' : 'me';

// ------------------------------------------------------------------ ¡DAME LETRA!
const FREQ = 'EAOSNRILDTUCMPBGVYQHFZJÑXKW';
/** letra base (las vocales con tilde cuentan como la misma letra; la Ñ es su propia letra) */
const baseL = (ch: string) => { const u = ch.toUpperCase(); if (u === 'Ñ') return 'Ñ'; const n = u.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); return /^[A-Z]$/.test(n) ? n : ''; };
/** frase normalizada para comparar: sin tildes, sin mayúsculas ni signos */
export const normFrase = (t: string) => t.toUpperCase().replace(/Ñ/g, '\u0001').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0001/g, 'Ñ').replace(/[^A-ZÑ ]/g, ' ').replace(/\s+/g, ' ').trim();
const RELLENO = ['casa', 'gato', 'mano', 'luna', 'pan', 'sol', 'mesa', 'río'];
export async function dameLetra(P: Programa, opp: number, o: { training?: boolean } = {}): Promise<DuelResult> {
  const c = P.c; const { eng, hud, s } = c; const bot = eng.opps[opp - 1];
  const k = W.__botSkill ?? botSkill(opp, P.rodadas || 4);
  const ui = document.createElement('div'); ui.id = 'dl'; ui.className = 'ui';
  ui.innerHTML = `<div class="dlcard"><h4 id="dlcat"></h4><div class="dlboard" id="dlb"></div><div class="dlused" id="dlu"></div></div>
    <div class="dlbar"><div class="dlclock" id="dlc">10:00</div><div class="dlwho" id="dlw"></div>
    <div class="dlin"><input id="dlIn" type="text" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go"><button id="dlGo">¡Resolver!</button><button id="dlPaso" class="dlpaso">Paso</button></div></div>`;
  document.getElementById('hud')!.appendChild(ui);
  const $ = (id: string) => ui.querySelector('#' + id) as HTMLElement;
  const inp = $('dlIn') as HTMLInputElement;
  ['keydown', 'keyup', 'pointerdown', 'click'].forEach(ev => ui.addEventListener(ev, e => e.stopPropagation()));
  splitOn(c, opp); hud.actions([]); if (!o.training || P.vidas > 0) showVidas(P.vidas, !!P.vidaExtra);
  const com = marcadorComodines(P, opp); com.tag();
  const log: string[] = [];
  const D = W.__dl = { turn: 'me' as 'me' | 'bot', fase: 'letra', log, frase: '', letra: (_: string) => { }, resolver: (_: string) => { }, paso: () => { }, revelada: 0 };
  let turn: 'me' | 'bot' = W.__meFirst === false ? 'bot' : 'me';
  const LIM = W.__dlLim || 10;
  try {
    for (let fr = 0; fr < 8; fr++) {
      const [it] = pick(DAME_LETRA, used.dl); const frase = it[1]; D.frase = frase;
      const shown = new Set<string>(), tried = new Set<string>();
      const letras = [...frase].map(baseL).filter(Boolean); const total = letras.length;
      $('dlcat').textContent = it[0];
      // tablero: palabras con casillas
      $('dlb').innerHTML = frase.split(' ').map(w => `<span class="dlw">${[...w].map(ch => baseL(ch) ? `<i class="t" data-l="${baseL(ch)}" data-c="${esc(ch.toUpperCase())}"></i>` : `<b>${esc(ch)}</b>`).join('')}</span>`).join('');
      const tiles = [...ui.querySelectorAll('#dlb i.t')] as HTMLElement[];
      const frac = () => letras.filter(l => shown.has(l)).length / total;
      const usedTxt = () => { $('dlu').innerHTML = [...tried].map(l => `<span class="${shown.has(l) ? 'si' : 'no'}">${l}</span>`).join(''); };
      usedTxt(); ui.classList.remove('in'); void ui.offsetWidth; ui.classList.add('in'); audio.play('SomPalavra@Gcpgt1');
      const revelaTodo = () => tiles.forEach(t => { t.textContent = t.dataset.c!; t.classList.add('on'); });
      let ganador: 'me' | 'bot' | null = null;
      // umbral del oponente: con qué parte de la frase descubierta se atreve
      const thr = clamp(lerp(0.86, 0.5, k) + rnd(-0.07, 0.07), 0.4, 0.95);
      for (let t = 0; t < 60 && !ganador; t++) {
        D.turn = turn; D.fase = 'letra';
        $('dlw').textContent = turn === 'me' ? `${cons.central || 'Tú'}: ¡pide una letra!` : `${cons.rival(opp)} pide letra…`; $('dlw').className = 'dlwho ' + turn;
        ui.classList.toggle('mine', turn === 'me'); ui.classList.remove('guess');
        inp.value = ''; inp.placeholder = 'Pulsa una letra'; inp.disabled = turn !== 'me';
        // ---- 1) pedir una letra
        let L = '';
        if (turn === 'me') {
          D.letra = (x: string) => { const b = baseL(x); if (!L && b && !tried.has(b)) L = b; else if (b && tried.has(b)) hud.toast(`La ${b} ya ha salido`, 900); };
          inp.oninput = () => { const v = inp.value; inp.value = ''; if (v) D.letra(v.slice(-1)); };
          inp.onkeydown = (e) => { e.stopPropagation(); if (e.key.length === 1) { e.preventDefault(); D.letra(e.key); } };
          try { inp.focus({ preventScroll: true }); } catch { }
          const t0 = performance.now();
          await s.until(() => { const el = (performance.now() - t0) / 1000; $('dlc').textContent = fmtClock(LIM - el); $('dlc').classList.toggle('low', LIM - el < 3); return !!L || el >= LIM; });
          if (!L) { hud.toast('⏱ ¡Sin letra! Pasa el turno', 1300); log.push('me:sinletra'); audio.play('DropM.mp3'); await s.w(1200); turn = 'bot'; continue; }
        } else {
          gesture(bot, 'habla', 1.6); await s.w(rnd(900, 1700));
          const pend = [...FREQ].filter(l => !tried.has(l));
          L = Math.random() < lerp(0.5, 0.92, k) ? pend[0] : pend[Math.floor(Math.random() * Math.min(14, pend.length))];
          hud.say(`¡La ${L}!`, 1100, bot.head, cons.rival(opp), { voice: false });
        }
        tried.add(L); const hits = tiles.filter(x => x.dataset.l === L);
        log.push(`${turn}:letra ${L}${hits.length ? '+' + hits.length : '-'}`);
        if (hits.length) { shown.add(L); for (const h of hits) { h.textContent = h.dataset.c!; h.classList.add('on', 'pop'); audio.play('saltar', 0.5); await s.w(160); } publico.aplauso(0.8, 0.25); }
        else { audio.play('Erro'); hud.toast(`No hay ninguna ${L}`, 1100); }
        usedTxt(); D.revelada = frac();
        // ---- 2) diez segundos para decir la frase completa
        D.fase = 'resolver'; ui.classList.add('guess');
        $('dlw').textContent = turn === 'me' ? '¿Sabes la frase? ¡Escríbela entera!' : `${cons.rival(opp)} piensa…`;
        let intento: string | null = null, paso = false;
        if (turn === 'me') {
          inp.disabled = false; inp.value = ''; inp.placeholder = 'Escribe la frase completa';
          inp.oninput = null;
          D.resolver = (x: string) => { if (intento == null && x.trim()) intento = x; };
          D.paso = () => { paso = true; };
          inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); D.resolver(inp.value); } };
          ($('dlGo') as HTMLButtonElement).onclick = (e) => { e.stopPropagation(); D.resolver(inp.value); };
          ($('dlPaso') as HTMLButtonElement).onclick = (e) => { e.stopPropagation(); D.paso(); };
          try { inp.focus({ preventScroll: true }); } catch { }
        }
        // decisión del oponente
        const f = frac();
        const seAtreve = turn === 'bot' && W.__botForce !== 'fail' && (W.__botForce === 'win' || f >= thr || f >= 0.999);
        const botAt = seAtreve ? rnd(1.6, 3.6) : rnd(1.8, 3.2);
        const t0 = performance.now();
        await s.until(() => {
          const el = (performance.now() - t0) / 1000; $('dlc').textContent = fmtClock(LIM - el); $('dlc').classList.toggle('low', LIM - el < 3);
          if (turn === 'bot' && el >= botAt && intento == null && !paso) {
            if (seAtreve) { const ok = W.__botForce === 'win' || f >= 0.999 || Math.random() < clamp(lerp(0.72, 0.96, k) + (f - thr), 0.5, 0.99); const ws = frase.split(' '); if (!ok) ws[Math.floor(Math.random() * ws.length)] = RELLENO[Math.floor(Math.random() * RELLENO.length)]; intento = ws.join(' '); }
            else paso = true;
          }
          return intento != null || paso || el >= LIM;
        });
        inp.disabled = true;
        if (intento != null) {
          const ok = normFrase(intento) === normFrase(frase);
          if (turn === 'bot') { gesture(bot, 'habla', 1.6); hud.say(`«${intento}»`, 1600, bot.head, cons.rival(opp), { voice: false }); await s.w(1500); }
          log.push(`${turn}:frase ${ok ? 'ok' : 'mal'}`);
          if (ok) { ganador = turn; break; }
          audio.play('Erro'); publico.ooh(0.6); hud.toast('✘ ¡Esa no es la frase!', 1300); gesture(turn === 'me' ? eng.player : bot, 'lamenta', 1.2); await s.w(1300);
        } else if (turn === 'bot') { hud.say('Paso…', 900, bot.head, cons.rival(opp), { voice: false }); log.push('bot:paso'); await s.w(900); }
        else { log.push(paso ? 'me:paso' : 'me:tiempo'); if (!paso) { audio.play('DropM.mp3'); hud.toast('⏱ ¡Se acabó el tiempo!', 1100); await s.w(900); } }
        turn = otro(turn);
      }
      if (!ganador) ganador = 'me';
      // ---- se resuelve la frase
      revelaTodo(); D.fase = 'fin'; audio.play('QuemFicaEmPé-Acerto');
      const perd = otro(ganador);
      publico.aplauso(ganador === 'me' ? 2.4 : 1.5, ganador === 'me' ? 0.7 : 0.45); gesture(ganador === 'me' ? eng.player : bot, 'arriba', 1.4);
      hud.toast(`${ganador === 'me' ? '¡Correcto!' : '¡' + cons.rival(opp) + ' lo dice!'} «${frase}»`, 2000); await s.w(2200);
      if (com.get(perd) > 0) {
        com.set(perd, com.get(perd) - 1);
        if (com.get(ganador) === 0) { com.set(ganador, 1); hud.toast(ganador === 'me' ? `🃏 ¡Robas un comodín a ${cons.rival(opp)}!` : `🃏 ¡${cons.rival(opp)} te roba un comodín!`, 2000); log.push(`${ganador}:roba`); }
        else { hud.toast(perd === 'me' ? '🃏 Gastas un comodín y sigues' : `🃏 ${cons.rival(opp)} gasta un comodín y sigue`, 1800); log.push(`${perd}:gasta`); }
        audio.play('SomPalavra@Teclado27'); await s.w(2100); turn = perd; continue;
      }
      return ganador === 'me' ? 'win' : 'lose';
    }
    return 'win';
  } finally { ui.remove(); splitOff(c); cams.duel(eng, opp); }
}

// ------------------------------------------------------------------ ¿SÍ O NO?
export async function siNo(P: Programa, opp: number, o: { training?: boolean } = {}): Promise<DuelResult> {
  const c = P.c; const { eng, hud, s } = c; const bot = eng.opps[opp - 1];
  const k = W.__botSkill ?? botSkill(opp, P.rodadas || 4);
  const ui = document.createElement('div'); ui.id = 'sn'; ui.className = 'ui';
  ui.innerHTML = `<div class="e3clock" id="snc">05:00</div><div class="e3who" id="snw"></div><div class="e3q" id="snq"></div>
    <div class="snbtns"><button class="snb si" id="snSi">SÍ</button><button class="snb no" id="snNo">NO</button></div>`;
  document.getElementById('hud')!.appendChild(ui);
  const $ = (id: string) => ui.querySelector('#' + id) as HTMLElement;
  splitOn(c, opp); hud.actions([]); // sin PASAR ni rebote en esta prueba
  if (!o.training || P.vidas > 0) showVidas(P.vidas, !!P.vidaExtra);
  const com = marcadorComodines(P, opp); com.tag();
  const log: string[] = [];
  const S = W.__sn = { turn: 'me' as 'me' | 'bot', log, q: null as any, answer: (_: boolean) => { } };
  let turn: 'me' | 'bot' = W.__meFirst === false ? 'bot' : 'me';
  let robo: 'me' | 'bot' | null = null; // quién puede robar el comodín si acierta su siguiente pregunta
  try {
    for (let n = 0; n < 80; n++) {
      const [q] = pick(SI_NO, used.sn); S.q = q; S.turn = turn;
      $('snw').textContent = `Responde: ${nombreDe(turn, opp)}`; $('snw').className = 'e3who ' + turn;
      $('snq').textContent = q[0];
      const bS = $('snSi') as HTMLButtonElement, bN = $('snNo') as HTMLButtonElement;
      [bS, bN].forEach(b => { b.disabled = turn !== 'me'; b.className = b.className.replace(/ (ok|bad|right)/g, ''); });
      ui.classList.remove('in'); void ui.offsetWidth; ui.classList.add('in'); audio.play('SomPalavra@Gcpgt1');
      let resp: boolean | null = null;
      const answer = (v: boolean) => { if (resp == null && turn === 'me') { resp = v; audio.play('Tecla'); } };
      S.answer = answer;
      bS.onclick = (e) => { e.stopPropagation(); answer(true); }; bN.onclick = (e) => { e.stopPropagation(); answer(false); };
      const key = (e: KeyboardEvent) => { const kk = e.key.toLowerCase(); if (kk === 's' || kk === '1' || e.key === 'ArrowLeft') answer(true); if (kk === 'n' || kk === '2' || e.key === 'ArrowRight') answer(false); };
      addEventListener('keydown', key);
      await s.w(600);
      const T = W.__snClock || 5; const t0 = performance.now();
      const botAt = rnd(lerp(2.8, 1.0, k), lerp(3.8, 2.2, k));
      const botOk = W.__botForce === 'fail' ? false : W.__botForce === 'win' ? true : Math.random() < lerp(0.66, 0.95, k);
      const botTimeout = !W.__botForce && Math.random() < lerp(0.06, 0.01, k);
      if (turn === 'bot') gesture(bot, 'habla', 1.8);
      try {
        await s.until(() => {
          const el = (performance.now() - t0) / 1000; $('snc').textContent = fmtClock(T - el); $('snc').classList.toggle('low', T - el < 2);
          if (turn === 'bot' && resp == null && !botTimeout && el >= botAt) resp = botOk ? q[1] : !q[1];
          return resp != null || el >= T;
        });
      } finally { removeEventListener('keydown', key); }
      const ok = resp === q[1];
      bS.disabled = bN.disabled = true;
      if (resp != null) (resp ? bS : bN).classList.add(ok ? 'ok' : 'bad');
      (q[1] ? bS : bN).classList.add('right');
      log.push(`${turn}:${resp == null ? 'tiempo' : ok ? 'ok' : 'mal'}`);
      if (ok) {
        audio.play('QuemFicaEmPé-Acerto'); publico.aplauso(turn === 'me' ? 2 : 1.3, turn === 'me' ? 0.6 : 0.4); gesture(turn === 'me' ? eng.player : bot, 'arriba', 1.1);
        if (robo === turn) { com.set(turn, com.get(turn) + 1); hud.toast(turn === 'me' ? '🃏 ¡Aciertas y robas el comodín!' : `🃏 ¡${cons.rival(opp)} acierta y te roba el comodín!`, 1800); log.push(`${turn}:roba`); audio.play('SomPalavra@Teclado27'); await s.w(800); }
        robo = null; await s.w(1200); turn = otro(turn); continue;
      }
      robo = null;
      audio.play(resp == null ? 'DropM.mp3' : 'Erro'); publico.ooh(0.8); gesture(turn === 'me' ? eng.player : bot, 'lamenta', 1.4);
      hud.toast(resp == null ? '⏱ ¡Se acabó el tiempo!' : `✘ ¡Era ${q[1] ? 'SÍ' : 'NO'}!`, 1400); await s.w(1500);
      if (com.get(turn) > 0) {
        com.set(turn, com.get(turn) - 1); robo = otro(turn);
        hud.toast(turn === 'me' ? `🃏 Gastas un comodín. Si ${cons.rival(opp)} acierta, ¡se lo queda!` : `🃏 ${cons.rival(opp)} gasta un comodín. Si aciertas, ¡te lo quedas!`, 2000); log.push(`${turn}:gasta`);
        audio.play('SomPalavra@Teclado27'); await s.w(1800); turn = otro(turn); continue;
      }
      return turn === 'me' ? 'lose' : 'win';
    }
    return 'win';
  } finally { ui.remove(); splitOff(c); cams.duel(eng, opp); }
}

// ------------------------------------------------------------------ ELECCIÓN DEL CENTRAL
export const EL = {
  intro: '¡Elección del central! Todos tenéis una tableta: quien acierte primero la pregunta jugará en la trampilla central.',
  tu: '¡Has sido quien más rápido ha acertado! ¡La trampilla central es tuya!',
  bot: ['{nombre} ha sido más rápido… ¡pero el público quiere verte en el centro! Entras por invitación del público.', 'Alguien ha sido más rápido… ¡pero el público quiere verte en el centro! Entras por invitación del público.'] as [string, string],
  nadie: '¡Nadie ha acertado! Pues decide el público… ¡y te elige a ti!',
};
export const lineasEleccion = () => [EL.intro, EL.tu, EL.bot[1], EL.nadie];
const COLORS = ['#e94b3c', '#3c8de9', '#3cbf6a', '#f0a020', '#9b59d0', '#e85aa0', '#20b2aa', '#d35400', '#5d6dde', '#c0392b', '#16a085'];
export async function eleccionCentral(c: Ctx): Promise<{ ganador: number; tiempos: (number | null)[] }> {
  const { eng, hud, panel, s } = c;
  const names = [cons.central || 'Tú', ...Array.from({ length: 10 }, (_, i) => cons.rival(i + 1))];
  const ui = document.createElement('div'); ui.id = 'elec'; ui.className = 'ui';
  const card = (i: number) => `<div class="ecard${i === 0 ? ' me' : ''}" data-i="${i}"><i style="--c:${COLORS[i]}">${esc(names[i].slice(0, 1).toUpperCase())}</i><b>${esc(names[i])}</b><em>—</em></div>`;
  ui.innerHTML = `<div class="ecol l">${[0, 1, 2, 3, 4, 5].map(card).join('')}</div><div class="ecol r">${[6, 7, 8, 9, 10].map(card).join('')}</div><div class="eclock" id="ec">20:00</div>`;
  // tabletas en las manos de todos
  const tabM = new THREE.MeshLambertMaterial({ color: 0x15151c, emissive: 0x2050a0, emissiveIntensity: 0.6 });
  const tabs: THREE.Mesh[] = [];
  for (const p of [eng.player, ...eng.opps]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.015, 0.16), tabM); t.position.set(0, 0.98, 0.28); t.rotation.x = -0.5; p.root.add(t); tabs.push(t); }
  const W2 = W.__elec = { tiempos: [] as (number | null)[], ganador: -1, fase: 'intro' };
  eng.startOrbit(V(0, 0, 0), 9.5, 4.6, 0, 0.05, 1.1);
  try {
    let d = false; hud.say(EL.intro, 3000).then(() => { d = true; }); gesture(eng.host, 'habla', 3); await s.until(() => d);
    document.getElementById('hud')!.appendChild(ui);
    const [cq, idx] = pick(CENTRAL, used.cen);
    const q = W.__elecQ = qOculta('cen-' + idx, cq[0], cq[1]);
    panel.showBg(false); panel.showClock(false); panel.setQuestion(q); audio.play('SomPalavra@Gcpgt1');
    audio.playMusic('SuspenseDuelo', true, 0.5); W2.fase = 'pregunta';
    // bots: aciertan ~70 % con tiempos simulados
    const LIM = W.__elecLim || 20;
    const botT = names.map((_, i) => i === 0 ? null : (W.__elecBots === 'lento' ? null : Math.random() < 0.72 ? +rnd(W.__elecBots === 'rapido' ? 1.2 : 4.0, 16).toFixed(2) : null));
    let mine: number | null = null; let done = false; panel.ask().then(r => { if (r && !done) { mine = +((performance.now() - t0) / 1000).toFixed(2); done = true; } });
    const t0 = performance.now();
    await s.until(() => { const el = (performance.now() - t0) / 1000; (ui.querySelector('#ec') as HTMLElement).textContent = fmtClock(LIM - el); if (el >= LIM) done = true; return done; });
    panel.stopInput(); await panel.reveal().catch(() => { });
    const tiempos = [mine, ...botT.slice(1)]; W2.tiempos = tiempos; W2.fase = 'resultado'; (ui.querySelector('#ec') as HTMLElement).style.display = 'none';
    audio.stopMusic(0.5);
    // se muestran los tiempos
    const order = tiempos.map((t, i) => [t, i] as [number | null, number]).filter(x => x[0] != null).sort((a, b) => a[0]! - b[0]!);
    const ganador = order.length ? order[0][1] : -1; W2.ganador = ganador;
    for (let i = 0; i < 11; i++) {
      const el = ui.querySelector(`.ecard[data-i="${i}"] em`) as HTMLElement; const t = tiempos[i];
      el.textContent = t == null ? '✘' : t.toFixed(2).replace('.', ',') + ' s'; el.parentElement!.classList.add(t == null ? 'fail' : 'okk');
      audio.play('saltar', 0.4); await s.w(110);
    }
    if (ganador >= 0) ui.querySelector(`.ecard[data-i="${ganador}"]`)!.classList.add('win');
    await s.w(800); panel.hideAll(300);
    gesture(eng.host, 'habla', 3);
    if (ganador === 0) { publico.vitores(3); audio.play('QuemFicaEmPé-Acerto'); d = false; hud.say(EL.tu, 3000).then(() => { d = true; }); }
    else if (ganador > 0) { publico.risas(); setTimeout(() => publico.aplauso(3, 0.7), 800); d = false; hud.say(EL.bot[0].replace('{nombre}', names[ganador]), 3500, eng.host.head, 'El Presentador', { audio: [EL.bot[1]] }).then(() => { d = true; }); }
    else { publico.risas(); d = false; hud.say(EL.nadie, 3000).then(() => { d = true; }); }
    await s.until(() => d); await s.w(400);
    return { ganador, tiempos };
  } finally { ui.remove(); panel.hideAll(); tabs.forEach(t => { t.parent?.remove(t); t.geometry.dispose(); }); tabM.dispose(); }
}
