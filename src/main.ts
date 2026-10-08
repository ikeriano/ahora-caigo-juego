import './style.css';
import * as THREE from 'three';
import { loadManifest, initAudio, imgUrl, costume, audio, preloadImages, M } from './assets';
import { Engine } from './engine';
import { setupControls } from './controls';
import { THEMES, themeById } from './themes';
import { Hud, Session, ABORT } from './hud';
import { Stage2D } from './stage2d';
import { Panel, showVidas } from './prueba';
import { Programa, Ctx } from './show';
import { entrenamiento, TrainKind } from './training';
import { logoCanvas } from './logo';
import { TOP } from './set3d';
import { loadOpts, saveOpts, Opts } from './options';
import { CREDITOS } from './credits';
import { L, allLines } from './lines';
import { voice, hashText } from './voice';
import { setupLightsUI } from './lightsui';
import { isMobile } from './engine';
import { gesture } from './people';

const $ = (id: string) => document.getElementById(id)!;
const q = new URLSearchParams(location.search);
let eng: Engine, hud: Hud, st: Stage2D, panel: Panel;
let session: Session | null = null;
let themeId = (q.get('theme') || localStorage.getItem('ac_theme') || 'normal') as any;
let originales = localStorage.getItem('ac_orig') === '1';
let opts: Opts;

async function boot() {
  await loadManifest(); initAudio(); await voice.load();
  eng = new Engine($('c3d') as HTMLCanvasElement, imgUrl(costume('Menu', 1).f));
  eng.setTheme(themeById(themeId));
  opts = loadOpts(isMobile ? 'media' : 'alta'); eng.quality = 'x' as any; applyOpts();
  setupControls(eng, $('touch'));
  hud = new Hud(eng); st = new Stage2D($('stage2d'), $('stageBox')); panel = new Panel();
  Object.assign(window as any, { __eng: eng, __hud: hud, __st: st, __panel: panel, THREE, __startMode: startMode, __menu: showMenu, __allLines: allLines, __voice: voice, __hashText: hashText });
  $('btnMenu').onclick = (e) => { e.stopPropagation(); if (session) { if (confirm('¿Volver al menú? Se perderá la partida.')) stopMode(); } else showMenu('main'); };
  const lui = setupLightsUI(eng);
  $('btnLuces').onclick = (e) => { e.stopPropagation(); lui.toggle(); };
  (window as any).__lui = lui;
  $('btnCam').onclick = (e) => { e.stopPropagation(); eng.firstPerson = !eng.firstPerson; hud.toast(eng.firstPerson ? 'Primera persona' : 'Tercera persona', 1000); };
  $('classicBack').onclick = () => { $('classicWrap').classList.add('hidden'); ($('classic') as HTMLIFrameElement).src = 'about:blank'; menuMusic = false; showMenu('play'); };
  // precarga de imágenes que se usan durante el juego
  const pre: string[] = [];
  for (const n of ['MenuEscolha', 'MenuEscolha2', 'Gcpgt1', 'Relogio2', 'Valores', 'Moeda1', 'Moeda2', 'ContagemDuelos', 'Painel', 'Gc', 'Teclado27', 'Vidas'])
    M.sprites[n]?.c.forEach(c => pre.push(imgUrl(c.f)));
  for (let i = 1; i <= 10; i++) M.sprites['MenuEscolhaop' + i]?.c.forEach(c => pre.push(imgUrl(c.f)));
  preloadImages(pre.slice(0, 200));
  ['SomPalavra', 'TrilhaCurta', 'AhoraCaigo - Intro.mp3', 'Moeda', 'DropM.mp3', 'AhoraCaigo - Queda.mp3', 'QuemFicaEmPé-Acerto', 'Erro', 'saltar', 'fairydust'].forEach(n => audio.preload([n]));
  $('loading').classList.add('hidden');
  const m = q.get('mode');
  if (m) startMode(m, q.get('sub') as any); else showMenu((q.get('screen') as Screen) || 'title');
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !q.has('nosw') && !isApk) navigator.serviceWorker.register('sw.js').catch(() => { });
}

// ------------------------------------------------------------------ MENÚS
type Screen = 'title' | 'main' | 'play' | 'train' | 'options' | 'help' | 'credits';
let screen: Screen = 'title';
const isApk = !!(window as any).AndroidKb || /; wv\)/.test(navigator.userAgent);
let installEvt: any = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; });
const APK_URL = 'descargas/AhoraCaigo3D.apk';

function btn(label: string, sub: string, cls: string, fn: () => void) {
  const b = document.createElement('button'); b.className = 'mbtn ' + cls; b.innerHTML = `<span class="fp"></span><span>${label}${sub ? `<small>${sub}</small>` : ''}</span>`;
  b.onclick = (e) => { e.stopPropagation(); audio.play('Tecla'); fn(); }; return b;
}
function backBtn(to: Screen) { const b = document.createElement('button'); b.className = 'tbtn back'; b.innerHTML = '⟵ Volver'; b.onclick = (e) => { e.stopPropagation(); audio.play('Tecla'); showMenu(to); }; return b; }
function h2(t: string) { const h = document.createElement('h2'); h.textContent = t; return h; }

let menuMusic = false;
function menuBackdrop() {
  if (session) { session.alive = false; session = null; }
  if (!menuMusic) { resetScene(); eng.startOrbit(new THREE.Vector3(0, 0, 0), 10.8, 4.8, 0.5, 0.06, 1.2); audio.playMusic('Trilha', true, 0.45); menuMusic = true; }
}

function showMenu(sc: Screen = 'main') {
  screen = sc; menuBackdrop();
  $('topbar').classList.add('hidden');
  const menu = $('menu'); menu.classList.remove('hidden'); menu.innerHTML = ''; menu.style.background = 'transparent';
  const th = themeById(themeId);
  if (sc === 'title') {
    const t = document.createElement('div'); t.className = 'title';
    const lc = logoCanvas(560, 500); lc.className = 'tlogo';
    const sub = document.createElement('div'); sub.className = 'tsub'; sub.textContent = 'El juego';
    const tap = document.createElement('div'); tap.className = 'ttap'; tap.textContent = 'Toca para empezar';
    t.append(lc, sub, tap); menu.appendChild(t);
    const go = (e: Event) => { e.stopPropagation(); audio.ctx.resume(); audio.play('TemaCurto'); menu.removeEventListener('pointerup', go); removeEventListener('keydown', go); showMenu('main'); };
    menu.addEventListener('pointerup', go); addEventListener('keydown', go);
    return;
  }
  const box = document.createElement('div'); box.className = 'mbox';
  const logo = document.createElement('div'); logo.className = 'logo';
  const lc = logoCanvas(560, 500); lc.className = 'mlogo'; logo.appendChild(lc);
  const tag = document.createElement('div'); tag.className = 'mtag'; tag.textContent = th.id === 'normal' ? 'EL JUEGO · 3D' : th.emoji + ' ' + (th.banner || 'Especial ' + th.name); logo.appendChild(tag);
  const col = document.createElement('div'); col.className = 'col ui';
  if (sc === 'main') {
    col.append(
      btn('Jugar', 'Programa completo, entrenamiento, clásico…', 'gold', () => showMenu('play')),
      btn('Opciones', 'Sonido, calidad gráfica, pantalla completa', '', () => showMenu('options')),
      btn('Cómo se juega', 'Las reglas del concurso', '', () => showMenu('help')),
      btn('Créditos', '', '', () => showMenu('credits')),
    );
    if (!isApk) col.append(btn('Instalar app', 'Juega sin conexión desde tu pantalla de inicio', 'inst', () => instalar()));
  } else if (sc === 'play') {
    col.append(
      btn('Programa completo', 'Cabecera, 8 duelos, moneda, juego final y despedida', 'gold', () => startMode('programa')),
      btn('Entrenamiento', 'Practica pruebas y la elección de huellas', '', () => showMenu('train')),
      btn('Clásico', 'El minijuego original de Scratch', '', () => startMode('clasico')),
      btn('Explorar el plató', 'Pasea libremente por el plató 3D', '', () => startMode('explorar')),
    );
    col.appendChild(h2('Programa especial'));
    const g = document.createElement('div'); g.className = 'themes';
    for (const t of THEMES) {
      const b = document.createElement('button'); b.className = 'tbtn' + (t.id === themeId ? ' sel' : '');
      b.innerHTML = `<span>${t.emoji}</span>${t.name}`;
      b.onclick = (e) => { e.stopPropagation(); audio.play('Tecla'); themeId = t.id; localStorage.setItem('ac_theme', t.id); eng.setTheme(t); applyOpts(); eng.resetPositions(); showMenu('play'); };
      g.appendChild(b);
    }
    col.append(g, backBtn('main'));
  } else if (sc === 'train') {
    col.appendChild(h2('Entrenamiento (sin caídas)'));
    const T = (k: TrainKind, a: string, b: string, cls = '') => btn(a, b, cls, () => startMode('entrenamiento', k));
    col.append(
      T('pruebas', 'Pruebas con reloj', '30 segundos por pregunta, como en el duelo', 'gold'),
      T('sintiempo', 'Pruebas sin tiempo', 'Tómatelo con calma'),
      T('gallina', 'Palabra gallina', 'Las preguntas especiales del duelo 5'),
      T('final', 'Juego final', '10 preguntas en 2 minutos'),
      T('huellas', 'Huellas y moneda', 'Elige huellas y prueba la moneda'),
    );
    const row = document.createElement('div'); row.className = 'mrow';
    const o = document.createElement('button');
    const setO = () => { o.innerHTML = originales ? '<span>📜</span>Preguntas: solo las del Scratch' : `<span>${th.emoji}</span>Preguntas: del tema ${th.name}`; o.className = 'tbtn' + (originales ? '' : ' sel'); };
    o.onclick = (e) => { e.stopPropagation(); originales = !originales; localStorage.setItem('ac_orig', originales ? '1' : '0'); setO(); }; setO();
    row.append(o, backBtn('play')); col.appendChild(row);
  } else if (sc === 'options') {
    col.classList.add('opts'); col.appendChild(h2('Opciones'));
    const tog = (label: string, k: 'music' | 'sfx', vk: 'musicVol' | 'sfxVol') => {
      const r = document.createElement('div'); r.className = 'orow';
      const b = document.createElement('button'); const upd = () => { b.className = 'tbtn' + (opts[k] ? ' sel' : ''); b.textContent = opts[k] ? 'Sí' : 'No'; };
      b.onclick = (e) => { e.stopPropagation(); opts[k] = !opts[k]; upd(); applyOpts(); audio.play('Tecla'); }; upd();
      const sl = document.createElement('input'); sl.type = 'range'; sl.min = '0'; sl.max = '100'; sl.value = String(Math.round(opts[vk] * 100));
      sl.oninput = () => { opts[vk] = +sl.value / 100; applyOpts(); }; sl.onchange = () => audio.play('Tecla');
      const l = document.createElement('label'); l.textContent = label; r.append(l, b, sl); return r;
    };
    col.append(tog('🎵 Música', 'music', 'musicVol'), tog('🔊 Efectos', 'sfx', 'sfxVol'));
    const onoff = (label: string, k: 'voz' | 'chistes') => {
      const r = document.createElement('div'); r.className = 'orow'; const l = document.createElement('label'); l.textContent = label;
      const b = document.createElement('button'); const upd = () => { b.className = 'tbtn' + (opts[k] ? ' sel' : ''); b.textContent = opts[k] ? 'Sí' : 'No'; };
      b.onclick = (e) => { e.stopPropagation(); opts[k] = !opts[k]; upd(); applyOpts(); audio.play('Tecla'); }; upd(); r.append(l, b); return r;
    };
    col.append(onoff('🎤 Voz del presentador', 'voz'), onoff('😄 Chistes del presentador', 'chistes'));
    const q = document.createElement('div'); q.className = 'orow'; const ql = document.createElement('label'); ql.textContent = '✨ Calidad gráfica'; q.appendChild(ql);
    for (const v of ['baja', 'media', 'alta'] as const) { const b = document.createElement('button'); b.className = 'tbtn' + (opts.quality === v ? ' sel' : ''); b.textContent = v[0].toUpperCase() + v.slice(1); b.onclick = (e) => { e.stopPropagation(); opts.quality = v; applyOpts(); showMenu('options'); }; q.appendChild(b); }
    const f = document.createElement('div'); f.className = 'orow'; const fl = document.createElement('label'); fl.textContent = '⛶ Pantalla completa'; f.appendChild(fl);
    const fb = document.createElement('button'); fb.className = 'tbtn' + (document.fullscreenElement ? ' sel' : ''); fb.textContent = document.fullscreenElement ? 'Salir' : 'Activar';
    fb.onclick = async (e) => { e.stopPropagation(); await toggleFullscreen(); setTimeout(() => showMenu('options'), 300); }; f.appendChild(fb);
    if (isApk) fb.disabled = true, fb.textContent = 'Siempre (app)';
    const info = document.createElement('p'); info.className = 'mtext'; info.textContent = `Rendimiento actual: ${Math.round(eng.fps)} fps. Si el juego va lento en tu móvil, elige calidad «Baja».`;
    col.append(q, f, info, backBtn('main'));
  } else if (sc === 'help') {
    col.classList.add('text'); col.append(backBtn('main'), h2('Cómo se juega'));
    const p = document.createElement('div'); p.className = 'mtext';
    p.innerHTML = `<p><b>Objetivo:</b> eres el concursante de la trampilla central. Hay <b>10 oponentes</b> y tienes que tirar a <b>8</b> para llegar al final. ¡Puedes conseguir hasta 600.000 puntos!</p>
<p><b>1. Elige huella.</b> Cada huella esconde a un oponente. Tócala para retarle a un duelo.</p>
<p><b>2. El duelo.</b> Aparece una pregunta con casillas vacías: escribe <b>las letras que faltan</b> con el teclado del móvil (o del ordenador). Tienes <b>30 segundos</b>. Si te equivocas puedes volver a intentarlo mientras quede tiempo.</p>
<p><b>3. ¡Ahora cae!</b> Si aciertas, tu oponente cae por su trampilla. Si se acaba el tiempo… ¡caes tú!</p>
<p><b>PASA:</b> empiezas con 2 comodines. Con «PASA» le das el turno a tu oponente y te sale otra pregunta, pero gastas un comodín.</p>
<p><b>4. La moneda.</b> Tras cada duelo ganado eliges un lado de la moneda: puedes ganar puntos, una vida extra… o perderlo todo, el doble o la mitad.</p>
<p><b>5. La decisión.</b> Si tiras a los 8 oponentes puedes <b>plantarte</b> (te llevas la mitad) o jugar el <b>Juego Final</b>: 10 preguntas en 2 minutos. Si las aciertas todas, ¡doblas tu marcador!</p>
<p><b>Controles 3D:</b> joystick a la izquierda para andar, arrastra a la derecha para mirar (PC: WASD + ratón). 👁 cambia entre primera y tercera persona. ☰ vuelve al menú. «Saltar» pasa la cabecera y la despedida.</p>`;
    col.append(p);
  } else if (sc === 'credits') {
    col.classList.add('text'); col.append(backBtn('main'), h2('Créditos'));
    const p = document.createElement('div'); p.className = 'mtext';
    p.innerHTML = CREDITOS.final.map(([a, b]) => `<p><b>${a}</b><br>${b.join('<br>')}</p>`).join('') + `<p><b>${CREDITOS.produccion}</b></p><p class="small">Juego de fans sin ánimo de lucro. «¡Ahora Caigo!» es un formato de televisión de sus respectivos dueños; este juego no está afiliado a ninguna cadena. El presentador es un personaje virtual inventado.</p>`;
    col.append(p);
  }
  box.append(logo, col); menu.appendChild(box);
}

async function instalar() {
  const m = $('menu'); const d = document.createElement('div'); d.className = 'modal ui';
  const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
  d.innerHTML = `<div class="mcard"><h2>Instalar ¡Ahora Caigo!</h2>
  ${standalone ? '<p>✅ Ya estás usando la app instalada.</p>' : (installEvt ? '<p><button class="mbtn gold" id="instNow">📲 Instalar ahora</button></p>' : '') + `<p><b>Android (Chrome):</b> menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».</p><p><b>iPhone/iPad (Safari):</b> botón Compartir → «Añadir a pantalla de inicio».</p><p><b>PC (Chrome/Edge):</b> icono de instalar ⊕ en la barra de direcciones.</p>`}
  <p>Una vez instalada funciona <b>sin conexión</b>.</p>
  <p><a class="mbtn" href="${APK_URL}" download>⬇️ Descargar APK para Android</a></p>
  <button class="tbtn back" id="instClose">Cerrar</button></div>`;
  m.appendChild(d);
  (d.querySelector('#instClose') as HTMLButtonElement).onclick = (e) => { e.stopPropagation(); d.remove(); };
  const now = d.querySelector('#instNow') as HTMLButtonElement | null;
  if (now) now.onclick = async (e) => { e.stopPropagation(); const ev = installEvt; installEvt = null; ev.prompt(); const r = await ev.userChoice.catch(() => null); d.remove(); if (r?.outcome === 'accepted') hud.toast('¡Instalada! Búscala en tu pantalla de inicio', 3000); };
}
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else { await document.documentElement.requestFullscreen({ navigationUI: 'hide' } as any); try { await (screen as any).orientation?.lock?.('landscape'); } catch { } }
  } catch { hud.toast('Tu navegador no permite pantalla completa aquí', 2500); }
}
function applyOpts() { audio.setLevels(opts); voice.enabled = opts.voz; voice.jokes = opts.chistes; if (eng.quality !== opts.quality) eng.setQuality(opts.quality); saveOpts(opts); }
/** Botón «atrás» (Android): devuelve false si ya estamos en la portada */
function back(): boolean {
  if (!$('classicWrap').classList.contains('hidden')) { ($('classicBack') as HTMLButtonElement).click(); return true; }
  document.querySelector('#menu .modal')?.remove();
  if (session) { stopMode(); return true; }
  const up: Record<Screen, Screen | null> = { title: null, main: 'title', play: 'main', train: 'play', options: 'main', help: 'main', credits: 'main' };
  const to = up[screen]; if (!to) return false; showMenu(to); return true;
}
(window as any).__back = back;
(window as any).__sessionAlive = () => !!session && session.alive;
addEventListener('keydown', (e) => { if (e.key === 'Escape') back(); });

function resetScene() {
  audio.stopAll(); st.clear(); panel.hideAll(); hud.reset(); showVidas(-1, false);
  eng.override = null; eng.walkMode(false); eng.firstPerson = false; eng.setGoldSet(false);
  document.getElementById('finCard')?.remove(); document.getElementById('introFlash')?.remove();
  eng.resetPositions();
  eng.studio.holes.forEach((_, i) => eng.studio.setHoleColor(i, i === 0 ? 0xffffff : 0xffffff));
}
function stopMode() { if (session) session.alive = false; session = null; menuMusic = false; showMenu('play'); }

// ------------------------------------------------------------------ MODOS
async function startMode(mode: string, sub?: any) {
  if (mode === 'clasico') {
    const f = $('classic') as HTMLIFrameElement; $('menu').classList.add('hidden'); audio.stopAll(); menuMusic = false;
    $('classicWrap').classList.remove('hidden'); f.src = 'clasico/index.html'; return;
  }
  if (session) session.alive = false;
  const s = new Session(); session = s;
  menuMusic = false; resetScene(); $('menu').classList.add('hidden'); $('topbar').classList.remove('hidden');
  const c: Ctx = { eng, hud, st, panel, s };
  try {
    if (mode === 'programa') {
      const r = await new Programa(c).run();
      hud.score(`${r.line}<br><small>Duelos ganados: ${r.res === 'perdido' ? Math.max(0, r.rodadas - 1) : 8} de 8</small>`, true);
      hud.actions([{ label: 'Jugar otra vez', cls: 'gold', fn: () => startMode('programa') }, { label: 'Menú', fn: () => stopMode() }]);
      eng.startOrbit(new THREE.Vector3(0, 0, 0), 10.8, 5, 0, 0.08, 1);
      audio.playMusic('Trilha', true, 0.5);
      await s.until(() => false);
    } else if (mode === 'entrenamiento') {
      await entrenamiento(c, sub || 'pruebas', originales);
      hud.actions([{ label: 'Repetir', cls: 'gold', fn: () => startMode('entrenamiento', sub) }, { label: 'Entrenamiento', fn: () => { if (session) session.alive = false; session = null; menuMusic = false; showMenu('train'); } }]);
      await s.until(() => false);
    } else if (mode === 'explorar') {
      eng.player.root.position.set(0, 0, 10.5); eng.player.root.rotation.y = Math.PI; eng.walkMode(true);
      hud.hint('🕹️ Joystick / WASD para andar · arrastra para mirar · 👁 cambia de cámara');
      setTimeout(() => hud.hint(null), 6000);
      hud.say(L.explBienvenida, 4500);
      gesture(eng.host, 'saluda', 2);
      // los oponentes saludan cuando te acercas
      const near = new Set<number>();
      while (true) {
        await s.w(300);
        eng.opps.forEach((o, i) => { const d = o.root.position.distanceTo(eng.player.root.position); if (d < 2 && !near.has(i)) { near.add(i); eng.face(o, eng.player.root.position); gesture(o, 'saluda', 1.4); } if (d > 3) near.delete(i); });
        if (eng.host.root.position.distanceTo(eng.player.root.position) < 1.8 && !near.has(99)) { near.add(99); eng.face(eng.host, eng.player.root.position); gesture(eng.host, 'habla', 2); hud.say(L.explReto, 3500); }
        if (eng.host.root.position.distanceTo(eng.player.root.position) > 3) near.delete(99);
      }
    }
  } catch (e) { if (e !== ABORT) { console.error(e); hud.toast('Error: ' + (e as Error).message, 5000); } }
}

boot().catch(e => { console.error(e); $('loading').innerHTML = '<p>No se pudo cargar el juego 😢<br>' + e.message + '</p>'; });
