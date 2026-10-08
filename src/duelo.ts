// Duelo 1 contra 1 como en el programa: el concursante central contra el oponente elegido (un bot que también juega).
//  - Turnos alternos; empieza siempre el oponente (como en el programa).
//  - Cada uno tiene SU reloj (Tempo = 30 s, como el Scratch) y solo corre el del que tiene el turno.
//  - Al acertar, el turno pasa al otro. Quien se queda sin tiempo, pierde y cae por su trampilla.
//  - PASAR (concursante): con comodín, la pregunta pasa al oponente (gasta un comodín, como el «PASA» del Scratch);
//    sin comodines, te sale otra pregunta pero tu reloj sigue corriendo (no se devuelve el tiempo).
//  - El bot piensa, escribe letra a letra, a veces se equivoca, a veces pasa y a veces se queda en blanco.
//    Su nivel depende del oponente y sube con cada duelo.
import type { Programa } from './show';
import type { Q } from './questions';
import { cams } from './show';
import { audio } from './assets';
import { showVidas } from './prueba';
import { gesture } from './people';
import { L, pick, fraseNum } from './lines';
import { cons } from './concursantes';
import { publico } from './publico';

export type DuelResult = 'win' | 'lose';
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** Personalidad de cada oponente (más rápido / más lento que la media) */
const PERS = [0.05, -0.08, 0.10, -0.04, 0.12, -0.10, 0.0, 0.08, -0.06, 0.03];
/** Nivel del bot (0 = flojo, 1 = muy bueno): sube con la ronda (1..8) y depende del oponente */
export function botSkill(opp: number, ronda: number) { return clamp(0.10 + (clamp(ronda, 1, 8) - 1) / 7 * 0.62 + (PERS[(opp - 1) % 10] || 0), 0.05, 0.85); }

interface Bar { el: HTMLElement; set(turn: 'me' | 'bot', me: number, bot: number): void; out(who: 'me' | 'bot'): void; remove(): void }
function duelBar(opp: number): Bar {
  document.getElementById('duelBar')?.remove();
  const el = document.createElement('div'); el.id = 'duelBar';
  el.innerHTML = `<div class="dc" data-k="me"><b>${cons.tu}</b><span>30,00</span><i></i></div><div class="vs">VS</div><div class="dc" data-k="bot"><b>${cons.rival(opp)}</b><span>30,00</span><i></i></div>`;
  document.getElementById('hud')!.appendChild(el);
  const me = el.querySelector('[data-k=me]') as HTMLElement, bo = el.querySelector('[data-k=bot]') as HTMLElement;
  const f = (t: number) => { const s = Math.max(0, t); return String(Math.floor(s)).padStart(2, '0') + ',' + String(Math.floor((s % 1) * 100)).padStart(2, '0'); };
  return {
    el,
    set(turn, a, b) {
      (me.querySelector('span') as HTMLElement).textContent = f(a); (bo.querySelector('span') as HTMLElement).textContent = f(b);
      me.classList.toggle('on', turn === 'me'); bo.classList.toggle('on', turn === 'bot');
      me.classList.toggle('low', a <= 5); bo.classList.toggle('low', b <= 5);
      if (!me.classList.contains('out')) (me.querySelector('i') as HTMLElement).textContent = turn === 'me' ? 'TU TURNO' : '';
      if (!bo.classList.contains('out')) (bo.querySelector('i') as HTMLElement).textContent = turn === 'bot' ? 'SU TURNO' : '';
    },
    out(who) { const d = who === 'me' ? me : bo; d.classList.remove('on'); d.classList.add('out'); (d.querySelector('i') as HTMLElement).textContent = '¡SIN TIEMPO!'; },
    remove() { el.remove(); },
  };
}

/** Juega el duelo y devuelve quién gana. No hace las caídas (las hace Programa.duelo) */
export async function duelo1v1(P: Programa, opp: number, o: { training?: boolean } = {}): Promise<DuelResult> {
  const { eng, hud, panel, st, s } = P.c;
  const bot = eng.opps[opp - 1];
  const W = window as any;
  const k = W.__botSkill ?? botSkill(opp, P.rodadas || 1);
  const T = W.__duelClock || 30;
  const clocks = { me: T, bot: W.__botClock || T };
  let turn: 'me' | 'bot' = W.__meFirst ? 'me' : 'bot';
  let running = false;
  const bar = duelBar(opp); bar.set(turn, clocks.me, clocks.bot);
  W.__duel = { clocks, get turn() { return turn; }, get running() { return running; }, skill: k, opp, log: [] as string[] };
  const log = (t: string) => W.__duel.log.push(t);
  panel.showBg(false); panel.showClock(true); panel.setTime(Math.floor(clocks[turn]), clocks[turn] % 1);
  let last = performance.now(); const warned = { me: 99, bot: 99 };
  const iv = setInterval(() => {
    const now = performance.now(), dt = Math.min(0.25, (now - last) / 1000); last = now;
    if (running) {
      clocks[turn] = Math.max(0, clocks[turn] - dt);
      const c = Math.ceil(clocks[turn]);
      if (c <= 10 && warned[turn] > 10) { warned[turn] = 10; audio.play('10', 1, 'clock'); }
      if (c <= 5 && warned[turn] > 5) { warned[turn] = 5; audio.play('5', 1, 'clock'); }
    }
    bar.set(turn, clocks.me, clocks.bot); panel.setTime(Math.floor(clocks[turn]), clocks[turn] % 1);
  }, 50);
  /** espera sec segundos de juego mientras corre el reloj del bot; false si se le acaba el tiempo */
  const botWait = async (sec: number) => { const t0 = performance.now(); await s.until(() => clocks.bot <= 0 || performance.now() - t0 >= sec * 1000); return clocks.bot > 0; };
  const newQ = (): Q => P.bank.next(o.training ? 'normal' : (P.rodadas || 'normal') as any);

  /** Turno del bot. ok = acierta; tiempo = se le acaba el reloj */
  const botTurn = async (q: Q): Promise<'ok' | 'tiempo'> => {
    cams.opp(eng, opp, 0.9); eng.face(bot, eng.player.root.position);
    while (true) {
      panel.stopInput(); audio.play('SomPalavra@Gcpgt1'); panel.setQuestion(q); panel.botSlots('', 'bot', '💭 Pensando…');
      if (!running) { await s.w(700); running = true; }
      const stuck = Math.random() < (W.__botForce === 'fail' ? 1 : W.__botForce === 'win' ? 0 : lerp(0.30, 0.08, k));
      const wrong = W.__botForce ? false : Math.random() < lerp(0.35, 0.08, k);
      const think = lerp(7.5, 2.8, k) * rnd(0.7, 1.35) * (W.__botForce === 'win' ? 0.4 : 1);
      const per = lerp(0.65, 0.3, k);
      gesture(bot, 'habla', 1.6);
      hud.say(pick(['Mmm…', 'A ver, a ver…', 'Lo tengo en la punta de la lengua…', '¡Esta me la sé!', 'Déjame pensar…']), 1800, bot.head, cons.rival(opp), { voice: false });
      if (stuck) {
        log('bot-stuck');
        if (!await botWait(lerp(9, 5, k) * rnd(0.8, 1.2))) return 'tiempo';
        if (W.__botForce !== 'fail' && Math.random() < 0.7) {
          // el bot PASA: otra pregunta y su reloj sigue corriendo
          log('bot-pasa'); audio.play('SomPalavra@Teclado27'); gesture(bot, 'lamenta', 1.2);
          hud.say('¡Paso!', 1400, bot.head, cons.rival(opp), { voice: false });
          panel.botSlots('', 'bot', '⏭ ¡PASA!'); await botWait(0.9);
          q = newQ(); continue;
        }
        gesture(bot, 'lamenta', 2);
        panel.botSlots('', 'bot', '😰 …'); await botWait(9999); return 'tiempo';
      }
      if (!await botWait(think)) return 'tiempo';
      const ans = q.missing.join('');
      const type = async (word: string, cls: 'bot' = 'bot') => { for (let i = 1; i <= word.length; i++) { if (!await botWait(per * rnd(0.7, 1.3))) return false; audio.play('saltar', 0.5); panel.botSlots(word.slice(0, i), cls); } return true; };
      if (wrong) {
        // se equivoca: una letra mal, «Erro», y vuelve a pensar
        const AB = 'ABCDEFGHIJLMNOPRSTUVZ'.split('').filter(c => !q.missing.includes(c));
        const bad = [...ans]; bad[Math.floor(Math.random() * bad.length)] = AB[Math.floor(Math.random() * AB.length)];
        log('bot-error');
        if (!await type(bad.join(''))) return 'tiempo';
        panel.botSlots(bad.join(''), 'bad'); audio.play('Erro'); gesture(bot, 'lamenta', 1); publico.oohSuave();
        if (!await botWait(0.6)) return 'tiempo';
        panel.botSlots('', 'bot', '💭 …');
        if (!await botWait(think * 0.5)) return 'tiempo';
      }
      if (!await type(ans)) return 'tiempo';
      running = false; log('bot-ok');
      panel.botSlots(ans, 'ok'); audio.play('QuemFicaEmPé-Acerto'); publico.aplauso(1.6, 0.45); await panel.reveal(); gesture(bot, 'arriba', 1.2);
      hud.toast(`${cons.rival(opp)} acierta`, 1100);
      await s.w(1100); panel.hideQuestion(250); return 'ok';
    }
  };

  /** Turno del concursante */
  const meTurn = async (q: Q): Promise<'ok' | 'pasaCom' | 'pasa' | 'tiempo'> => {
    cams.duel(eng, opp, 0.9);
    panel.stopInput(); audio.play('SomPalavra@Gcpgt1'); panel.setQuestion(q);
    if (!o.training || P.vidas > 0) showVidas(P.vidas, !!P.vidaExtra);
    let res: 'ok' | 'pasaCom' | 'pasa' | null = null;
    const com = P.vidas > 0;
    panel.showPasa(true, () => { if (!res) res = P.vidas > 0 ? 'pasaCom' : 'pasa'; }, com ? 'PASAR <small>(comodín)</small>' : 'PASAR ⏭');
    panel.ask().then(ok => { if (ok && !res) res = 'ok'; });
    if (!running) { await s.w(600); running = true; }
    await s.until(() => !!res || clocks.me <= 0);
    panel.showPasa(false);
    if (!res) { running = false; panel.stopInput(); audio.play('DropM.mp3'); publico.ooh(0.8); await panel.reveal(); return 'tiempo'; }
    if (res === 'ok') {
      running = false; log('me-ok'); panel.stopInput(); audio.play('QuemFicaEmPé-Acerto'); publico.aplauso(2.4, 0.7); await panel.reveal(); hud.toast('¡CORRECTO!', 1100);
      gesture(eng.player, 'arriba', 1.2); await s.w(1000); panel.hideQuestion(250); return 'ok';
    }
    if (res === 'pasaCom') {
      // como el Scratch: gasta un comodín y el oponente tiene que contestar ESA pregunta
      running = false; log('me-pasa-comodin'); panel.stopInput();
      audio.play('SomPalavra@Teclado27'); P.vidas--; if (P.vidaExtra && P.vidas < 1) P.vidaExtra = 0;
      st.show('Painel', 1, { z: 46, fade: 330, from: 1.5 }); hud.say(pick(L.pasa), 2200);
      showVidas(P.vidas, !!P.vidaExtra); gesture(bot, 'habla', 2);
      await s.w(1800); st.hide('Painel', 330); await s.w(350); return 'pasaCom';
    }
    // sin comodines: otra pregunta y el reloj NO se para
    log('me-pasa'); panel.stopInput(); audio.play('SomPalavra@Teclado27');
    hud.say(pick(L.pasaSin), 1600);
    await panel.reveal(); await s.w(500); return 'pasa';
  };

  try {
    // empieza el oponente (como en el programa)
    { const f = turn === 'bot' ? fraseNum('turnoBot', opp) : { bubble: pick(L.turnoTu), audio: undefined }; hud.say(f.bubble, 2200, eng.host.head, cons.presentador, { audio: f.audio }); }
    await s.w(1200);
    let carry: Q | null = null;
    while (true) {
      bar.set(turn, clocks.me, clocks.bot);
      const q = carry || newQ(); carry = null;
      if (turn === 'bot') {
        const r = await botTurn(q);
        if (r === 'tiempo') { running = false; bar.out('bot'); log('bot-tiempo'); audio.stopTag('clock'); panel.stopInput(); audio.play('DropM.mp3'); await panel.reveal(); { const f = fraseNum('botTiempo', opp); hud.say(f.bubble, 2200, eng.host.head, cons.presentador, { audio: f.audio }); } await s.w(1200); return 'win'; }
        turn = 'me';
      } else {
        const r = await meTurn(q);
        if (r === 'tiempo') { bar.out('me'); log('me-tiempo'); return 'lose'; }
        if (r === 'pasaCom') { carry = q; turn = 'bot'; }
        else if (r === 'ok') turn = 'bot';
      }
    }
  } finally {
    running = false; clearInterval(iv); audio.stopTag('clock'); panel.showPasa(false);
    setTimeout(() => bar.remove(), 1200);
  }
}
