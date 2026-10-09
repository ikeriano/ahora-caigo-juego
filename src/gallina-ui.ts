// Opciones › «Palabra gallina: mis canciones» (v1.6): subir canciones del dispositivo, pegar la letra,
// marcar el fragmento a adivinar y el segundo del corte, con vista previa. Todo se queda en este dispositivo.
import { audio } from './assets';
import { canciones, guardarCancion, borrarCancion, errorCancion, cancionQ, contexto, validarAudio, sonarCancion, blobCancion, type Cancion } from './gallina';
import type { Lectura } from './lectura';

const esc = (t: string) => t.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[ch]);
const stop = (e: Event) => e.stopPropagation();
const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
let sonando: Lectura | null = null;
const parar = () => { sonando?.stop(); sonando = null; };

/** resumen para la pantalla de Opciones */
export function opcionesGallina(abrir: () => void) {
  const box = document.createElement('div'); box.className = 'ocustom'; box.id = 'optGallina';
  const t = document.createElement('div'); t.className = 'olabel'; t.textContent = '🐔 Palabra gallina: mis canciones';
  const n = document.createElement('div'); n.className = 'oname'; const l = canciones();
  n.textContent = l.length ? `${l.length} canción${l.length > 1 ? 'es' : ''}: ${l.map(c => c.titulo).join(', ')}` : 'Sin canciones propias: salen las «Palabra gallina» del minijuego';
  const row = document.createElement('div'); row.className = 'orow obtns';
  const b = document.createElement('button'); b.className = 'tbtn sel'; b.id = 'btnGallina'; b.textContent = '🎵 Gestionar mis canciones';
  b.onclick = (e) => { stop(e); audio.play('Tecla'); abrir(); };
  const nt = document.createElement('p'); nt.className = 'onote small'; nt.textContent = 'Sube canciones desde tu dispositivo (se quedan solo en él), marca el trozo de letra que hay que adivinar y el segundo en el que se corta la música.';
  row.appendChild(b); box.append(t, n, row, nt); return box;
}

/** pantalla completa: lista + editor */
export function pantallaGallina(col: HTMLElement, back: HTMLElement, refrescar: () => void, editar: Partial<Cancion> | null = null) {
  parar();
  if (editar) { col.append(editor(editar, refrescar), back); return; }
  const lista = document.createElement('div'); lista.className = 'ocustom'; lista.id = 'gallinaLista';
  const t = document.createElement('div'); t.className = 'olabel'; t.textContent = '🐔 Mis canciones para «Palabra gallina»'; lista.appendChild(t);
  const l = canciones();
  if (!l.length) { const p = document.createElement('div'); p.className = 'oname'; p.textContent = 'Todavía no hay canciones. Mientras tanto salen las «Palabra gallina» del minijuego.'; lista.appendChild(p); }
  for (const c of l) {
    const r = document.createElement('div'); r.className = 'gcan';
    const { frag } = contexto(c);
    r.innerHTML = `<div class="gtit"><b>${esc(c.titulo)}</b><small>Hueco: «${esc(frag)}» · corte en ${fmt(c.corte)}</small></div>`;
    const bp = document.createElement('button'); bp.className = 'tbtn'; bp.textContent = '▶'; bp.title = 'Probar';
    bp.onclick = (e) => { stop(e); if (sonando) { parar(); bp.textContent = '▶'; return; } audio.stopMusic(0.3); bp.textContent = '⏹'; sonando = sonarCancion(c.id, c.desde, c.corte, () => { bp.textContent = '▶'; }); };
    const be = document.createElement('button'); be.className = 'tbtn'; be.textContent = '✏️'; be.title = 'Editar';
    be.onclick = (e) => { stop(e); audio.play('Tecla'); col.innerHTML = ''; pantallaGallina(col, back, refrescar, { ...c }); };
    const bd = document.createElement('button'); bd.className = 'tbtn'; bd.textContent = '🗑'; bd.title = 'Quitar';
    bd.onclick = async (e) => { stop(e); audio.play('Tecla'); if (!confirm(`¿Quitar «${c.titulo}»?`)) return; await borrarCancion(c.id); refrescar(); };
    r.append(bp, be, bd); lista.appendChild(r);
  }
  const row = document.createElement('div'); row.className = 'orow obtns';
  const add = document.createElement('button'); add.className = 'tbtn sel'; add.id = 'btnAddCancion'; add.textContent = '➕ Añadir canción';
  add.onclick = (e) => { stop(e); audio.play('Tecla'); col.innerHTML = ''; pantallaGallina(col, back, refrescar, { titulo: '', letra: '', corte: 0, desde: 0 }); };
  row.appendChild(add); lista.appendChild(row);
  const nt = document.createElement('p'); nt.className = 'onote small';
  nt.textContent = 'Las canciones y letras son tuyas y se quedan solo en este dispositivo: no se suben a ningún servidor ni se comparten. En el duelo suena la canción hasta el corte y luego hay que completar la letra que falta.';
  lista.appendChild(nt);
  col.append(lista, back);
}

function editor(c: Partial<Cancion>, refrescar: () => void) {
  const box = document.createElement('div'); box.className = 'ocustom gedit'; box.id = 'gallinaEditor';
  let file: File | null = null; let dur = 0;
  box.innerHTML = `<div class="olabel">${c.id ? '✏️ Editar canción' : '➕ Nueva canción'}</div>
  <div class="orow ofield"><label>1. Audio</label><button class="tbtn sel" id="gFile">📂 Elegir audio de mi dispositivo</button><input type="file" accept="audio/*" id="gInp" style="display:none"></div>
  <div class="oname" id="gFileName">${c.id ? '🎵 audio guardado' : 'Ningún audio elegido'}</div>
  <audio id="gAudio" controls preload="metadata" style="width:100%;height:36px"></audio>
  <div class="orow ofield"><label>2. Título</label><input class="otext" id="gTitulo" maxlength="40" placeholder="Título de la canción"></div>
  <label class="glab">3. Pega la letra y <b>selecciona con el dedo o el ratón el trozo que hay que adivinar</b>:</label>
  <textarea id="gLetra" rows="5" placeholder="Pega aquí la letra (o al menos las líneas que rodean al hueco)"></textarea>
  <div class="orow obtns"><button class="tbtn sel" id="gMarcar">🎯 Marcar el trozo seleccionado</button></div>
  <div class="oname" id="gFrag"></div>
  <div class="orow ofield"><label>4. Corte (s)</label><input class="otext" id="gCorte" type="number" step="0.1" min="0"><button class="tbtn" id="gCorteAqui">⏸ Aquí (posición actual)</button></div>
  <div class="orow ofield"><label>Empieza en (s)</label><input class="otext" id="gDesde" type="number" step="0.1" min="0"></div>
  <div class="orow obtns"><button class="tbtn" id="gPrev">👁 Vista previa</button><button class="tbtn sel" id="gSave">💾 Guardar</button></div>
  <div class="gprev" id="gPrevBox"></div>
  <div class="omsg" id="gMsg"></div>`;
  const $ = <T extends HTMLElement>(id: string) => box.querySelector('#' + id) as T;
  const inp = $<HTMLInputElement>('gInp'), au = $<HTMLAudioElement>('gAudio'), tit = $<HTMLInputElement>('gTitulo'), letra = $<HTMLTextAreaElement>('gLetra');
  const corte = $<HTMLInputElement>('gCorte'), desde = $<HTMLInputElement>('gDesde'), msg = $('gMsg');
  tit.value = c.titulo || ''; letra.value = c.letra || ''; corte.value = c.corte ? String(c.corte) : ''; desde.value = c.desde != null ? String(c.desde) : '';
  box.querySelectorAll('input,textarea').forEach(i => { i.addEventListener('pointerdown', stop); i.addEventListener('keydown', stop); });
  au.addEventListener('pointerdown', stop);
  au.onloadedmetadata = () => { dur = au.duration || 0; };
  if (c.id) void blobCancion(c.id).then(b => { if (b) au.src = URL.createObjectURL(b); });
  const fragTxt = () => { const f = $('gFrag'); if (c.ini != null && c.fin != null && c.fin > c.ini) { f.innerHTML = '🎯 Trozo a adivinar: <b></b>'; (f.querySelector('b') as HTMLElement).textContent = '«' + letra.value.slice(c.ini, c.fin).trim() + '»'; } else f.textContent = 'Todavía no has marcado el trozo.'; };
  fragTxt();
  letra.addEventListener('input', () => { c.ini = c.fin = undefined; fragTxt(); });
  $('gFile').onclick = (e) => { stop(e); audio.play('Tecla'); inp.value = ''; inp.click(); };
  inp.onchange = () => {
    const f = inp.files?.[0]; if (!f) return;
    try { validarAudio(f); } catch (err) { msg.textContent = '⚠️ ' + (err as Error).message; return; }
    file = f; $('gFileName').textContent = '🎵 ' + f.name; au.src = URL.createObjectURL(f);
    if (!tit.value) tit.value = f.name.replace(/\.[^.]+$/, '').slice(0, 40);
  };
  $('gMarcar').onclick = (e) => {
    stop(e); let a = letra.selectionStart, b = letra.selectionEnd;
    // ajusta a palabras completas
    while (a < b && /\s/.test(letra.value[a])) a++; while (b > a && /\s/.test(letra.value[b - 1])) b--;
    while (a > 0 && /\p{L}/u.test(letra.value[a - 1])) a--; while (b < letra.value.length && /\p{L}/u.test(letra.value[b])) b++;
    if (b <= a) { msg.textContent = '⚠️ Selecciona primero en la letra el trozo que hay que adivinar.'; return; }
    c.ini = a; c.fin = b; msg.textContent = ''; fragTxt(); audio.play('Tecla');
  };
  $('gCorteAqui').onclick = (e) => { stop(e); corte.value = au.currentTime.toFixed(1); if (!desde.value || +desde.value >= +corte.value) desde.value = String(Math.max(0, Math.round((au.currentTime - 15) * 10) / 10)); audio.play('Tecla'); };
  const datos = (): Partial<Cancion> => ({ ...c, titulo: tit.value.trim(), letra: letra.value, corte: +corte.value, desde: desde.value === '' ? Math.max(0, +corte.value - 15) : +desde.value });
  $('gPrev').onclick = (e) => {
    stop(e); const d = datos(); const err = errorCancion(d, dur); if (err) { msg.textContent = '⚠️ ' + err; return; }
    msg.textContent = ''; const q = cancionQ(d as Cancion); const pv = $('gPrevBox');
    pv.innerHTML = `<p class="gq"></p><div class="gb">${[...q.word!].map((ch, i) => ch === ' ' ? '<i class="sp"></i>' : `<i>${q.hidden![i] ? '' : esc(ch)}</i>`).join('')}</div>`;
    (pv.querySelector('.gq') as HTMLElement).textContent = q.text!;
    pv.classList.add('escuchando'); au.pause();
    // suena desde «desde» hasta el corte y luego enseña la frase
    au.currentTime = d.desde!; void au.play().catch(() => { });
    const iv = setInterval(() => { if (au.currentTime >= d.corte! || au.paused) { clearInterval(iv); au.pause(); pv.classList.remove('escuchando'); } }, 30);
  };
  $('gSave').onclick = async (e) => {
    stop(e); const d = datos(); const err = errorCancion(d, dur) || (!file && !c.id ? 'Elige el audio de la canción.' : null);
    if (err) { msg.textContent = '⚠️ ' + err; return; }
    try { au.pause(); await guardarCancion(d as any, file, file?.name); audio.play('Tecla'); refrescar(); }
    catch (er) { msg.textContent = '⚠️ ' + (er as Error).message; }
  };
  return box;
}
