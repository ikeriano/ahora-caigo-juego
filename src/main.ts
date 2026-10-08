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
import { CREDITOS, VERSION, creditosFinal } from './credits';
import { cons, RIVALES, PRESENTADOR_DEF } from './concursantes';
import { historia, lineasHistoria } from './historia';
import { lineasPruebas, lineasEleccion, planPruebas } from './pruebas';
import { lineasVoz, VOCES } from './concursantes';
import { L, allLines } from './lines';
import { voice, hashText } from './voice';
import { setupLightsUI } from './lightsui';
import { isMobile } from './engine';
import { gesture } from './people';
import { initCustomAudio, customInfo, setCustomAudio, clearCustomAudio, customReady, CUSTOM } from './customaudio';
import { crowd, estimateBeat } from './crowd';
import { publico, publicoLog } from './publico';

const $ = (id: string) => document.getElementById(id)!;
const q = new URLSearchParams(location.search);
let eng: Engine, hud: Hud, st: Stage2D, panel: Panel;
let session: Session | null = null;
let themeId = (q.get('theme') || localStorage.getItem('ac_theme') || 'normal') as any;
let originales = localStorage.getItem('ac_orig') === '1';
let opts: Opts;

async function boot() {
  await loadManifest(); initAudio(); crowd.init(); await voice.load(); initCustomAudio();
  eng = new Engine($('c3d') as HTMLCanvasElement, imgUrl(costume('Menu', 1).f)); publico.bind(eng);
  { const o0 = loadOpts(isMobile ? 'media' : 'alta'); eng.showAudience = o0.gradas; }
  eng.setTheme(themeById(themeId));
  opts = loadOpts(isMobile ? 'media' : 'alta'); eng.quality = 'x' as any; applyOpts();
  setupControls(eng, $('touch'));
  hud = new Hud(eng); st = new Stage2D($('stage2d'), $('stageBox')); panel = new Panel();
  cons.onChange(() => eng.studio?.refreshNames());
  // todas las frases pregenerables: presentador (allLines + presentaciones + historia) y oponentes (op1..op10)
  (window as any).__voiceLines = () => {
    const out = new Map<string, { t: string; v?: string; h: string }>();
    const add = (t: string, v?: string) => { const h = voice.key(t, v); if (!out.has(h)) out.set(h, { t, v, h }); };
    allLines().forEach(t => add(t)); lineasVoz().forEach(l => add(l.t, l.v)); lineasHistoria().forEach(t => add(t)); lineasPruebas().forEach(t => add(t)); lineasEleccion().forEach(t => add(t));
    return [...out.values()];
  };
  (window as any).__voces = VOCES; (window as any).__planPruebas = planPruebas;
  Object.assign(window as any, { __cons: cons, __eng: eng, __hud: hud, __st: st, __panel: panel, THREE, __startMode: startMode, __menu: showMenu, __allLines: allLines, __voice: voice, __hashText: hashText, __audio: audio, __custom: { setCustomAudio, clearCustomAudio, customInfo, customReady }, __publico: publico, __crowd: crowd, __publicoLog: publicoLog, __estimateBeat: estimateBeat });
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
  ['SomPalavra', 'TrilhaCurta', 'Trilha', 'Moeda', 'DropM.mp3', 'AhoraCaigo - Queda.mp3', 'QuemFicaEmPé-Acerto', 'Erro', 'saltar', 'fairydust'].forEach(n => audio.preload([n]));
  $('loading').classList.add('hidden');
  const m = q.get('mode');
  if (m) startMode(m, q.get('sub') as any); else showMenu((q.get('screen') as Screen) || 'title');
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !q.has('nosw') && !isApk) navigator.serviceWorker.register('sw.js').catch(() => { });
}

// ------------------------------------------------------------------ MENÚS
type Screen = 'title' | 'main' | 'play' | 'train' | 'options' | 'help' | 'credits' | 'concursantes';
const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);
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
    const lc = logoCanvas(560, 500, { variant: themeId }); lc.className = 'tlogo';
    const sub = document.createElement('div'); sub.className = 'tsub'; sub.textContent = 'El juego';
    const tap = document.createElement('div'); tap.className = 'ttap'; tap.textContent = 'Toca para empezar';
    t.append(lc, sub, tap); menu.appendChild(t);
    const go = (e: Event) => { e.stopPropagation(); audio.ctx.resume(); audio.play('TemaCurto'); menu.removeEventListener('pointerup', go); removeEventListener('keydown', go); showMenu('main'); };
    menu.addEventListener('pointerup', go); addEventListener('keydown', go);
    return;
  }
  const box = document.createElement('div'); box.className = 'mbox';
  const logo = document.createElement('div'); logo.className = 'logo';
  const lc = logoCanvas(560, 500, { variant: th.id }); lc.className = 'mlogo'; logo.appendChild(lc);
  const tag = document.createElement('div'); tag.className = 'mtag'; tag.textContent = th.id === 'normal' ? 'EL JUEGO · 3D' : th.emoji + ' ' + (th.banner || 'Especial ' + th.name); logo.appendChild(tag);
  const col = document.createElement('div'); col.className = 'col ui';
  if (sc === 'main') {
    col.append(
      btn('Jugar', 'Programa completo, entrenamiento, clásico…', 'gold', () => showMenu('play')),
      btn('Opciones', 'Sonido, calidad gráfica, pantalla completa', '', () => showMenu('options')),
      btn('La historia de ¡Ahora Caigo!', `${cons.presentador} te cuenta la historia del programa`, 'hist', () => startMode('historia')),
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
      T('duelo', 'Duelo contra un oponente', 'Por turnos, cada uno con su reloj, con PASAR', 'gold'),
      T('pruebas', 'Pruebas con reloj', '30 segundos por pregunta'),
      T('sintiempo', 'Pruebas sin tiempo', 'Tómatelo con calma'),
      T('gallina', 'Palabra gallina', 'Las preguntas especiales del duelo 5'),
      T('entretres', 'Entre tres', 'Tres respuestas y 5 segundos, contra un oponente'),
      T('adivina', 'Adivina', 'Pistas una a una: ¡pulsa «LO SÉ»!'),
      T('dameletra', '¡Dame letra!', 'Pide letras y di la frase entera en 10 segundos'),
      T('sino', '¿Sí o no?', 'Una pregunta cada uno, 5 segundos: ¡SÍ o NO!'),
      T('eleccion', 'Elección del central', 'El más rápido con la tableta'),
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
    const tog = (label: string, k: 'music' | 'sfx' | 'publico', vk: 'musicVol' | 'sfxVol' | 'publicoVol', id = '') => {
      const r = document.createElement('div'); r.className = 'orow'; if (id) r.id = id;
      const b = document.createElement('button'); const upd = () => { b.className = 'tbtn' + (opts[k] ? ' sel' : ''); b.textContent = opts[k] ? 'Sí' : 'No'; };
      b.onclick = (e) => { e.stopPropagation(); opts[k] = !opts[k]; upd(); applyOpts(); audio.play('Tecla'); }; upd();
      const sl = document.createElement('input'); sl.type = 'range'; sl.min = '0'; sl.max = '100'; sl.value = String(Math.round(opts[vk] * 100));
      sl.oninput = () => { opts[vk] = +sl.value / 100; applyOpts(); }; sl.onchange = () => { if (k === 'publico') publico.aplauso(1.5, 0.8); else audio.play('Tecla'); };
      const l = document.createElement('label'); l.textContent = label; r.append(l, b, sl); return r;
    };
    col.append(tog('🎵 Música', 'music', 'musicVol'), musicaCabecera(), tog('🔊 Efectos', 'sfx', 'sfxVol'), opcionesPublico(tog));
    const onoff = (label: string, k: 'voz' | 'chistes') => {
      const r = document.createElement('div'); r.className = 'orow'; const l = document.createElement('label'); l.textContent = label;
      const b = document.createElement('button'); const upd = () => { b.className = 'tbtn' + (opts[k] ? ' sel' : ''); b.textContent = opts[k] ? 'Sí' : 'No'; };
      b.onclick = (e) => { e.stopPropagation(); opts[k] = !opts[k]; upd(); applyOpts(); audio.play('Tecla'); }; upd(); r.append(l, b); return r;
    };
    col.append(onoff('🎤 Voz del presentador', 'voz'), onoff('😄 Chistes del presentador', 'chistes'), opcionesConcursantes());
    const q = document.createElement('div'); q.className = 'orow'; const ql = document.createElement('label'); ql.textContent = '✨ Calidad gráfica'; q.appendChild(ql);
    for (const v of ['baja', 'media', 'alta'] as const) { const b = document.createElement('button'); b.className = 'tbtn' + (opts.quality === v ? ' sel' : ''); b.textContent = v[0].toUpperCase() + v.slice(1); b.onclick = (e) => { e.stopPropagation(); opts.quality = v; applyOpts(); showMenu('options'); }; q.appendChild(b); }
    const f = document.createElement('div'); f.className = 'orow'; const fl = document.createElement('label'); fl.textContent = '⛶ Pantalla completa'; f.appendChild(fl);
    const fb = document.createElement('button'); fb.className = 'tbtn' + (document.fullscreenElement ? ' sel' : ''); fb.textContent = document.fullscreenElement ? 'Salir' : 'Activar';
    fb.onclick = async (e) => { e.stopPropagation(); await toggleFullscreen(); setTimeout(() => showMenu('options'), 300); }; f.appendChild(fb);
    if (isApk) fb.disabled = true, fb.textContent = 'Siempre (app)';
    const info = document.createElement('p'); info.className = 'mtext'; info.textContent = `Rendimiento actual: ${Math.round(eng.fps)} fps. Si el juego va lento en tu móvil, elige calidad «Baja».`;
    col.append(q, f, info, backBtn('main'));
  } else if (sc === 'concursantes') {
    col.classList.add('opts'); col.appendChild(h2('Concursantes')); pantallaConcursantes(col);
  } else if (sc === 'help') {
    col.classList.add('text'); col.append(backBtn('main'), h2('Cómo se juega'));
    const p = document.createElement('div'); p.className = 'mtext';
    p.innerHTML = `<p><b>Objetivo:</b> eres el concursante de la trampilla central. Hay <b>10 oponentes</b> y tienes que tirar a <b>8</b> para llegar al final. ¡Puedes conseguir hasta 600.000 puntos!</p>
<p><b>1. Elige huella.</b> Cada huella esconde a un oponente. Tócala para retarle a un duelo.</p>
<p><b>2. El duelo.</b> Juegas contra el oponente elegido, <b>por turnos</b>: empieza él. Cada uno tiene <b>su reloj de 30 segundos</b> y solo corre el del que tiene el turno. En tu turno escribe <b>las letras que faltan</b> con el teclado del móvil (o del ordenador); si te equivocas puedes volver a intentarlo mientras te quede tiempo. Al acertar, el turno pasa al otro.</p>
<p><b>3. ¡Ahora cae!</b> El primero que se queda sin tiempo cae por su trampilla: si es tu oponente, sigues; si eres tú… ¡adiós!</p>
<p><b>PASAR:</b> empiezas con 2 comodines. Con un comodín, «PASAR» le manda esa pregunta a tu oponente. Sin comodines, te sale otra pregunta pero tu reloj sigue corriendo. En el Juego Final, «PASAR» salta a la siguiente pregunta y los 2 minutos siguen corriendo.</p>
<p><b>4. La moneda.</b> Tras cada duelo ganado eliges un lado de la moneda: puedes ganar puntos, una vida extra… o perderlo todo, el doble o la mitad.</p>
<p><b>5. La decisión.</b> Si tiras a los 8 oponentes puedes <b>plantarte</b> (te llevas la mitad) o jugar el <b>Juego Final</b>: 10 preguntas en 2 minutos. Si las aciertas todas, ¡doblas tu marcador!</p>
<p><b>Controles 3D:</b> joystick a la izquierda para andar, arrastra a la derecha para mirar (PC: WASD + ratón). 👁 cambia entre primera y tercera persona. ☰ vuelve al menú. «Saltar» pasa la cabecera y la despedida.</p>`;
    col.append(p);
  } else if (sc === 'credits') {
    col.classList.add('text'); col.append(backBtn('main'), h2('Créditos'));
    const p = document.createElement('div'); p.className = 'mtext';
    p.innerHTML = creditosFinal().map(([a, b]) => `<p><b>${esc(a)}</b><br>${b.map(esc).join('<br>')}</p>`).join('') + `<p><b>Especial 300 suscriptores</b><br>Dedicado a los suscriptores del canal de YouTube «Ikeriano el campeón 2»</p><p><b>${CREDITOS.produccion}</b></p><p class="small">Versión ${VERSION}</p><p class="small">Juego de fans sin ánimo de lucro. «¡Ahora Caigo!» es un formato de televisión de sus respectivos dueños; este juego no está afiliado a ninguna cadena. El presentador es un personaje virtual inventado.</p>`;
    col.append(p);
  }
  const ver = document.createElement('div'); ver.className = 'mver'; ver.textContent = 'v' + VERSION; box.appendChild(ver);
  box.append(logo, col); menu.appendChild(box);
}

/** Opciones › Música de la cabecera: un audio del propio dispositivo (se queda solo en él) */
let probando: ReturnType<typeof setTimeout> | null = null;
let customMsg = '';
function musicaCabecera() {
  const box = document.createElement('div'); box.className = 'ocustom'; box.id = 'optCustom';
  const t = document.createElement('div'); t.className = 'olabel'; t.textContent = '🎶 Música de la cabecera'; box.appendChild(t);
  const name = document.createElement('div'); name.className = 'oname';
  const ci = customInfo();
  name.innerHTML = ci ? `🎵 <b></b>` : 'Sin audio propio: suena la música del minijuego';
  if (ci) (name.querySelector('b') as HTMLElement).textContent = ci.name;
  const row = document.createElement('div'); row.className = 'orow obtns';
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'audio/*'; inp.id = 'customFile'; inp.style.display = 'none';
  const pick = document.createElement('button'); pick.className = 'tbtn sel'; pick.id = 'btnElegirAudio'; pick.textContent = '📂 Elegir audio de mi dispositivo';
  pick.onclick = (e) => { e.stopPropagation(); audio.play('Tecla'); inp.value = ''; inp.click(); };
  inp.onchange = async () => {
    const f = inp.files?.[0]; if (!f) return;
    name.textContent = '⏳ Cargando «' + f.name + '»…';
    try { await setCustomAudio(f); customMsg = '✅ ¡Audio guardado en este dispositivo!'; }
    catch (err) { customMsg = '⚠️ ' + (err as Error).message; }
    if (screen === 'options') showMenu('options');
  };
  const test = document.createElement('button'); test.className = 'tbtn'; test.id = 'btnProbarAudio'; test.textContent = '▶ Probar';
  const stopTest = () => { if (probando) { clearTimeout(probando); probando = null; } audio.stopMusic(0.6); menuMusic = false; setTimeout(() => { if (!session && audio.musicName() == null) { audio.playMusic('Trilha', true, 0.45); menuMusic = true; } }, 700); test.textContent = '▶ Probar'; };
  test.onclick = (e) => {
    e.stopPropagation(); if (probando) { stopTest(); return; }
    audio.playMusic(CUSTOM, false, 1, 0.5); test.textContent = '⏹ Parar';
    probando = setTimeout(stopTest, 12000);
  };
  const del = document.createElement('button'); del.className = 'tbtn'; del.id = 'btnQuitarAudio'; del.textContent = '🗑 Quitar';
  del.onclick = async (e) => { e.stopPropagation(); audio.play('Tecla'); if (probando) stopTest(); await clearCustomAudio(); customMsg = 'Audio quitado: vuelve la música del minijuego'; showMenu('options'); };
  if (!ci) { test.disabled = true; del.disabled = true; }
  row.append(pick, test, del, inp);
  const note = document.createElement('p'); note.className = 'onote'; note.textContent = 'El audio se queda solo en este dispositivo; no se sube ni se comparte.';
  const note2 = document.createElement('p'); note2.className = 'onote small'; note2.textContent = 'Suena en la cabecera y en la despedida del Programa completo, con los mismos movimientos de cámara.';
  box.append(name, row);
  if (customMsg) { const m = document.createElement('div'); m.className = 'omsg'; m.textContent = customMsg; customMsg = ''; box.appendChild(m); }
  box.append(note, note2);
  // si todavía se está cargando el audio guardado, refrescar cuando esté
  if (!ci) customReady(8000).then(ok => { if (ok && screen === 'options' && document.getElementById('optCustom') === box) showMenu('options'); });
  return box;
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
function applyOpts() { audio.setLevels(opts); crowd.setLevel(opts.publico, opts.publicoVol); voice.enabled = opts.voz; voice.jokes = opts.chistes; if (eng.quality !== opts.quality) eng.setQuality(opts.quality); eng.setAudienceVisible(opts.gradas); saveOpts(opts); }

/** Opciones › Público: sonido (sí/no + volumen) y si se ve el público en las gradas */
function opcionesPublico(tog: (label: string, k: 'publico', vk: 'publicoVol', id?: string) => HTMLElement) {
  const box = document.createElement('div'); box.className = 'ocustom opub'; box.id = 'optPublico';
  const row = tog('👏 Público', 'publico', 'publicoVol', 'rowPublico'); box.appendChild(row);
  const r2 = document.createElement('div'); r2.className = 'orow'; const l2 = document.createElement('label'); l2.textContent = '👥 Público en las gradas';
  const b2 = document.createElement('button'); b2.id = 'btnGradas'; const upd = () => { b2.className = 'tbtn' + (opts.gradas ? ' sel' : ''); b2.textContent = opts.gradas ? 'Sí' : 'No'; };
  b2.onclick = (e) => { e.stopPropagation(); opts.gradas = !opts.gradas; upd(); applyOpts(); audio.play('Tecla'); }; upd(); r2.append(l2, b2); box.appendChild(r2);
  const n = document.createElement('p'); n.className = 'onote'; n.textContent = 'Aplausos, vítores y «oooh» del público. Son sonidos sintetizados por el propio juego (no son grabaciones). Si tu móvil va justo, quitar el público de las gradas ayuda.'; box.appendChild(n);
  return box;
}
/** Opciones › Concursantes: resumen + botón para editar */
function opcionesConcursantes() {
  const box = document.createElement('div'); box.className = 'ocustom'; box.id = 'optConcursantes';
  const t = document.createElement('div'); t.className = 'olabel'; t.textContent = '👥 Concursantes'; box.appendChild(t);
  const n = document.createElement('div'); n.className = 'oname';
  n.textContent = (cons.central ? `Tú: ${cons.central}${cons.profesion ? ' · ' + cons.profesion : ''}` : 'Tú: sin nombre') + ' · Oponentes: ' + RIVALES.map((_, i) => cons.rival(i + 1)).join(', ');
  const row = document.createElement('div'); row.className = 'orow obtns';
  const b = document.createElement('button'); b.className = 'tbtn sel'; b.id = 'btnConcursantes'; b.textContent = '✏️ Nombres y profesiones';
  b.onclick = (e) => { e.stopPropagation(); audio.play('Tecla'); showMenu('concursantes'); };
  row.appendChild(b); box.append(n, row); return box;
}
const notaCentral = () => cons.presentador + ' te presentará al empezar el Programa completo. Tu nombre sale en el marcador del duelo y en los créditos.';
/** Pantalla de edición de los concursantes (se guarda al escribir, solo en este dispositivo) */
function pantallaConcursantes(col: HTMLElement) {
  const inp = (id: string, val: string, ph: string, max: number, on: (v: string) => void) => {
    const i = document.createElement('input'); i.type = 'text'; i.id = id; i.className = 'otext'; i.value = val; i.placeholder = ph; i.maxLength = max;
    i.autocomplete = 'off'; i.spellcheck = false; i.addEventListener('input', () => on(i.value)); i.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') i.blur(); });
    i.addEventListener('pointerdown', e => e.stopPropagation()); return i;
  };
  // presentador: solo cambia el nombre que se ve (la voz sigue siendo la sintética genérica y el aspecto 3D no cambia)
  const hp = document.createElement('div'); hp.className = 'ocustom'; hp.id = 'optPresentador';
  const ht = document.createElement('div'); ht.className = 'olabel'; ht.textContent = '🎤 El presentador';
  const hr = document.createElement('div'); hr.className = 'orow ofield'; const hl = document.createElement('label'); hl.textContent = 'Nombre del presentador';
  const hin = inp('inPresentador', cons.presentadorPropio ? cons.presentador : '', PRESENTADOR_DEF, 24, v => { cons.setPresentador(v); const e = document.querySelector('#optCentral .onote'); if (e) e.textContent = notaCentral(); });
  const hrs = document.createElement('button'); hrs.className = 'tbtn'; hrs.id = 'btnResetPresentador'; hrs.textContent = '↺ Restablecer';
  hrs.onclick = (e) => { e.stopPropagation(); audio.play('Tecla'); cons.resetPresentador(); hin.value = ''; const n = document.querySelector('#optCentral .onote'); if (n) n.textContent = notaCentral(); };
  hr.append(hl, hin, hrs);
  const hn = document.createElement('p'); hn.className = 'onote small'; hn.textContent = 'Sale en los bocadillos, los subtítulos de la historia, las presentaciones y los créditos. La voz sigue siendo la sintética genérica y no dice el nombre.';
  hp.append(ht, hr, hn);
  const c = document.createElement('div'); c.className = 'ocustom'; c.id = 'optCentral';
  const ct = document.createElement('div'); ct.className = 'olabel'; ct.textContent = '⭐ El central (tú)';
  const r1 = document.createElement('div'); r1.className = 'orow ofield'; const l1 = document.createElement('label'); l1.textContent = 'Nombre';
  r1.append(l1, inp('inCentral', cons.central, 'Tu nombre', 18, v => cons.set('central', v)));
  const r2 = document.createElement('div'); r2.className = 'orow ofield'; const l2 = document.createElement('label'); l2.textContent = 'Profesión';
  r2.append(l2, inp('inProfesion', cons.profesion, 'Ej.: estudiante, youtuber, cocinero…', 60, v => cons.set('profesion', v)));
  const cn = document.createElement('p'); cn.className = 'onote small'; cn.textContent = notaCentral();
  c.append(ct, r1, r2, cn);
  const o = document.createElement('div'); o.className = 'ocustom'; o.id = 'optRivales';
  const ot = document.createElement('div'); ot.className = 'olabel'; ot.textContent = '🎯 Los 10 oponentes';
  const grid = document.createElement('div'); grid.className = 'orivales';
  RIVALES.forEach((r, i) => {
    const row = document.createElement('div'); row.className = 'oriv';
    const num = document.createElement('b'); num.textContent = String(i + 1);
    const box = document.createElement('div'); const job = document.createElement('small'); job.textContent = r.job;
    box.append(inp('inRival' + (i + 1), cons.rival(i + 1), r.def, 18, v => cons.setRival(i + 1, v)), job);
    row.append(num, box); grid.appendChild(row);
  });
  o.append(ot, grid);
  const pr = document.createElement('div'); pr.className = 'orow'; const pl = document.createElement('label'); pl.textContent = '🎙️ Presentaciones con el presentador';
  const pb = document.createElement('button'); pb.id = 'btnPresentaciones'; const upd = () => { pb.className = 'tbtn' + (cons.presentaciones ? ' sel' : ''); pb.textContent = cons.presentaciones ? 'Sí' : 'No'; };
  pb.onclick = (e) => { e.stopPropagation(); cons.setPresentaciones(!cons.presentaciones); upd(); audio.play('Tecla'); }; upd(); pr.append(pl, pb);
  const er = document.createElement('div'); er.className = 'orow'; const el = document.createElement('label'); el.textContent = '📱 Elección del central (tabletas)';
  const eb = document.createElement('button'); eb.id = 'btnEleccion'; const upe = () => { eb.className = 'tbtn' + (cons.eleccion ? ' sel' : ''); eb.textContent = cons.eleccion ? 'Sí' : 'No'; };
  eb.onclick = (e) => { e.stopPropagation(); cons.setEleccion(!cons.eleccion); upe(); audio.play('Tecla'); }; upe(); er.append(el, eb);
  const note = document.createElement('p'); note.className = 'mtext onote2';
  note.textContent = 'Se guarda solo en este dispositivo. Los nombres salen en los rótulos de las trampillas, los bocadillos y los créditos. La voz del presentador es sintética y genérica: las frases con nombres personalizados se leen en el bocadillo; si tu dispositivo tiene voz en español, tu nombre y profesión los dice esa voz.';
  const row = document.createElement('div'); row.className = 'mrow';
  const rs = document.createElement('button'); rs.className = 'tbtn'; rs.id = 'btnResetNombres'; rs.textContent = '↺ Nombres por defecto';
  rs.onclick = (e) => { e.stopPropagation(); audio.play('Tecla'); cons.reset(); showMenu('concursantes'); };
  row.append(rs, backBtn('options'));
  col.append(hp, c, o, pr, er, note, row);
}
/** Botón «atrás» (Android): devuelve false si ya estamos en la portada */
function back(): boolean {
  if (!$('classicWrap').classList.contains('hidden')) { ($('classicBack') as HTMLButtonElement).click(); return true; }
  document.querySelector('#menu .modal')?.remove();
  if (session) { stopMode(); return true; }
  const up: Record<Screen, Screen | null> = { title: null, main: 'title', play: 'main', train: 'play', options: 'main', help: 'main', credits: 'main', concursantes: 'options' };
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
    } else if (mode === 'historia') {
      await historia(c, +(sub || 0));
      if (session === s) { session.alive = false; session = null; menuMusic = false; showMenu('main'); }
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
