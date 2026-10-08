// «La historia de ¡Ahora Caigo!»: el Presentador virtual (voz sintética genérica) narra la historia del programa
// en capítulos cortos con subtítulos, planos del plató 3D y tarjetas/gráficos sencillos.
// Texto resumido con nuestras propias palabras a partir del artículo «¡Ahora caigo!» de Wikipedia en español (CC BY-SA 4.0).
// Sin logotipos de cadenas, sin fotos reales y sin nombres de concursantes (personas particulares).
import * as THREE from 'three';
import type { Ctx } from './show';
import { gesture } from './people';
import { voice } from './voice';
import { audio } from './assets';
import { publico } from './publico';
import { TOP } from './set3d';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
type Card =
  | { k: 'text'; items: [string, string][] }
  | { k: 'timeline'; items: [string, string][] }
  | { k: 'chips'; items: string[]; note?: string }
  | { k: 'cols'; cols: [string, string[]][] }
  | { k: 'tiles'; items: [string, string, string][] }
  | { k: 'stats'; items: [string, string][]; note?: string }
  | { k: 'world'; items: [string, string, string][] }
  | { k: 'bars'; items: [string, number, string][]; unit: string }
  | { k: 'end'; big: string; text: string; fuente: string };
export interface Capitulo { id: string; titulo: string; emoji: string; narr: string[]; card: Card; cam: (c: Ctx) => void; luces?: 'intro' | 'final' | 'eleccion' | 'acierto' | 'outro' | 'duelo' }

const host = (c: Ctx) => c.eng.host.root.position;
const camHost = (c: Ctx) => { const h = host(c); c.eng.glide(V(h.x - 1.4, TOP + 1.6, h.z + 3.0), V(h.x + 0.2, TOP + 1.25, h.z), 1.6); };

export const CAPITULOS: Capitulo[] = [
  { id: 'origen', titulo: 'El origen', emoji: '🌍',
    narr: ['¡Hola! Bienvenidos a la historia de ¡Ahora Caigo! Empecemos por el principio.',
      'El concurso nació en Israel, en 2010. Allí se llamaba «La\'uf al HaMillion», que quiere decir «volar hacia el millón».',
      'En España lo adaptó la productora Gestmusic para Antena 3, con un presentador titular y varios suplentes a lo largo de los años.'],
    card: { k: 'text', items: [['Formato original', 'La\'uf al HaMillion («Volar hacia el millón») · Canal 10, Israel, 2010'], ['Adaptación española', 'Gestmusic (grupo Banijay) para Antena 3'], ['Presentador', 'Arturo Valls'], ['Suplentes', 'Carlos Sobera, Jorge Fernández, Juanra Bonet, Silvia Abril, Eugeni Alemany y El Monaguillo']] },
    cam: c => c.eng.startOrbit(V(0, 0, 0), 11.5, 6.2, 0.4, 0.05, 1), luces: 'intro' },
  { id: 'estreno', titulo: 'El estreno', emoji: '📺',
    narr: ['El estreno fue el 6 de julio de 2011, en horario de máxima audiencia.',
      'Unas semanas después, el 22 de agosto, el concurso pasó a emitirse cada tarde, de lunes a viernes, con cien mil euros en juego.',
      'Aquella primera temporada terminó con más de dos millones de espectadores de media y casi un catorce por ciento de cuota de pantalla.'],
    card: { k: 'timeline', items: [['6 jul 2011', 'Estreno en prime time'], ['22 ago 2011', 'Pasa a ser diario · 100.000 € en juego'], ['1.ª temporada', 'Más de 2 millones de espectadores · ≈14 % de cuota']] },
    cam: camHost },
  { id: 'especiales', titulo: 'Los especiales', emoji: '🎃',
    narr: ['Con los años llegaron muchísimos programas especiales.',
      'En septiembre de 2012, un especial «Vuelta al cole» llenó el plató de concursantes colegiales.',
      'También hubo especiales de Halloween, con niños y con famosos, que jugaban para donar el premio a una ONG. ¡Como los modos especiales de este juego!'],
    card: { k: 'chips', items: ['🎒 Vuelta al cole (2012)', '🎃 Halloween', '🧒 Niños', '⭐ Famosos (premio para una ONG)'], note: 'En los especiales con famosos, el premio se donaba a la ONG que elegía el ganador.' },
    cam: c => { c.eng.cut(V(-7.6, 3.4, 6.6), V(-2, 1.6, -2)); c.eng.glide(V(-4.2, 3.0, 8.8), V(1, 1.6, -3), 9); }, luces: 'eleccion' },
  { id: 'remodelacion', titulo: 'Las remodelaciones', emoji: '🔧',
    narr: ['El 23 de noviembre de 2015, el formato se renovó.',
      'Desde entonces, si el central perdía, el oponente que le ganaba ocupaba su sitio y se quedaba con el dinero acumulado.',
      'El oponente también podía quedarse con el comodín del central, y llegaron dos pruebas nuevas: «Entre tres» y «Adivina».',
      'En 2017 se sumaron «Palabra gallina» y «Vaya lío», y el central pasó a elegirse con una pregunta rápida en una tableta.'],
    card: { k: 'cols', cols: [['2015', ['Quien gana al central ocupa su sitio (y hereda el dinero)', 'El oponente puede quedarse con el comodín', 'Pruebas nuevas: Entre tres y Adivina']], ['2017', ['Pruebas nuevas: Palabra gallina y Vaya lío', 'El central se elige con una pregunta rápida en una tableta']]] },
    cam: c => { c.eng.cut(V(0, 3.2, 4.2), V(0, TOP, 0)); c.eng.glide(V(2.4, 4.4, 5.4), V(0, TOP, -0.5), 8); }, luces: 'duelo' },
  { id: 'pruebas', titulo: 'Las pruebas', emoji: '🧩',
    narr: ['Repasemos las pruebas del concurso.',
      'En el «Clásico» hay que completar la palabra que falta, como en el ahorcado. En «Entre tres», elegir una de tres respuestas.',
      'En «Adivina» se acierta con pistas; en «Palabra gallina», hay que descubrir la letra de una canción tapada por un cacareo; y en «Vaya lío», ordenar un anagrama.',
      'Y como traca final, el «Duelo Final»: diez preguntas en dos minutos.'],
    card: { k: 'tiles', items: [['🔤', 'Clásico', 'Completa la palabra (como el ahorcado)'], ['3️⃣', 'Entre tres', 'Elige una de tres respuestas'], ['🔍', 'Adivina', 'Acierta con pistas'], ['🐔', 'Palabra gallina', 'La letra tapada por un cacareo'], ['🌀', 'Vaya lío', 'Ordena el anagrama'], ['🏁', 'Duelo Final', '10 preguntas en 2 minutos']] },
    cam: c => { const o = c.eng.studio.holes[3].pos; c.eng.cut(o.clone().multiplyScalar(0.55).setY(TOP + 2.0), o.clone().setY(TOP + 1.0)); c.eng.startOrbit(V(0, 0, 0), 8.6, 3.4, -1.2, 0.07, 1.2); } },
  { id: 'mecanica2021', titulo: 'La mecánica de 2021', emoji: '🪙',
    narr: ['El 15 de febrero de 2021 llegó una gran novedad: el central que acababa el programa volvía al día siguiente.',
      'Las monedas se duplicaron hasta veinte: en cada trampilla, la de la huella blanca y la de la huella negra. Con la combinación perfecta se podían sumar trescientos mil euros.',
      'Tras ocho duelos, el central se jugaba el bote en el Duelo Final, con un mínimo garantizado de cinco mil euros.',
      'El récord de esta etapa: treinta y dos programas seguidos y más de ciento treinta y un mil euros.'],
    card: { k: 'stats', items: [['20', 'monedas (huella blanca y huella negra)'], ['300.000 €', 'máximo posible'], ['8', 'duelos y después el Duelo Final'], ['10 / 2 min', 'preguntas del Duelo Final'], ['5.000 €', 'mínimo en el Duelo Final'], ['32', 'programas seguidos: el récord (más de 131.000 €)']], note: 'Desde el 15 de febrero de 2021' },
    cam: c => { c.eng.cut(V(0, TOP + 1.9, 2.6), V(0, TOP + 0.4, 0)); c.eng.glide(V(-1.6, TOP + 2.6, 3.4), V(0, TOP + 0.6, 0), 9); }, luces: 'final' },
  { id: 'final', titulo: 'La despedida', emoji: '👋',
    narr: ['La última emisión diaria fue el 2 de julio de 2021. En su lugar llegó la serie «Tierra amarga».',
      'Los programas que quedaban se emitieron los fines de semana, y el 1 de agosto de 2021 el concurso se despidió con un especial por su décimo aniversario.',
      'En total: diez temporadas y dos mil ciento sesenta y ocho programas.'],
    card: { k: 'stats', items: [['2 jul 2021', 'último programa diario'], ['1 ago 2021', 'despedida: especial 10.º aniversario'], ['10', 'temporadas'], ['2.168', 'programas']] },
    cam: c => c.eng.startOrbit(V(0, 0, 0), 12.5, 7.5, 2.2, -0.04, 1), luces: 'outro' },
  { id: 'mundo', titulo: 'Por el mundo', emoji: '🗺️',
    narr: ['El formato ha viajado por medio mundo.',
      'En Estados Unidos se llamó «Who\'s Still Standing?» y se estrenó en 2011. En Italia, «Caduta libera», desde 2015.',
      'Y hay versiones en Hungría, Turquía, Alemania, Brasil, Argentina, Chile, Ecuador… ¡y muchos países más!'],
    card: { k: 'world', items: [['🇮🇱', 'Israel', 'La\'uf al HaMillion (2010, el original)'], ['🇺🇸', 'EE. UU.', 'Who\'s Still Standing? (NBC, 2011)'], ['🇭🇺', 'Hungría', 'Maradj talpon! (2011)'], ['🇹🇷', 'Turquía', 'Eyvah Düşüyorum (2012)'], ['🇧🇷', 'Brasil', 'Quem Fica em Pé? (2012) · Acerte ou Caia! (2024)'], ['🇩🇪', 'Alemania', 'Ab durch die Mitte (2012)'], ['🇮🇹', 'Italia', 'Caduta libera (2015)'], ['🇦🇷', 'Argentina', '¡Ahora caigo! (2023)'], ['🇨🇱 🇪🇨', 'Chile y Ecuador', '¡Ahora caigo! (2024)']] },
    cam: c => { c.eng.cut(V(0, 9.5, 12.5), V(0, 0, -2)); c.eng.startOrbit(V(0, 0, 0), 13, 9, 0, 0.05, 0); } },
  { id: 'audiencias', titulo: 'Las audiencias', emoji: '📊',
    narr: ['¿Y cuánta gente lo veía? En el gráfico tienes la cuota de pantalla media de cada temporada.',
      'El mejor dato llegó en la segunda temporada, con un dieciséis coma dos por ciento.',
      'Tras adelantar su horario en 2020, las dos últimas temporadas bajaron, hasta un nueve coma nueve por ciento.'],
    card: { k: 'bars', unit: '%', items: [['2011 PT', 13.8, '2.039.000'], ['11/12', 15.0, '1.455.000'], ['12/13', 16.2, '1.593.000'], ['13/14', 15.0, '1.444.000'], ['14/15', 14.5, '1.403.000'], ['15/16', 14.8, '1.431.000'], ['16/17', 14.2, '1.378.000'], ['17/18', 14.5, '1.510.000'], ['18/19', 15.2, '1.496.000'], ['19/20', 10.7, '1.097.000'], ['20/21', 9.9, '985.000']] },
    cam: c => { c.eng.cut(V(6.5, 2.6, 7.5), V(-1, 1.8, -1)); c.eng.glide(V(3.5, 2.2, 9.5), V(-2, 1.8, -1), 9); }, luces: 'acierto' },
  { id: 'vuelta', titulo: 'La vuelta', emoji: '✨',
    narr: ['Y la historia no termina aquí.',
      'Según el anuncio del 31 de agosto de 2026, ¡Ahora Caigo! vuelve con cuatro especiales en prime time en la temporada 2026-2027.',
      'Mientras tanto, ¡aquí puedes seguir jugando! Gracias por ver la historia de ¡Ahora Caigo!'],
    card: { k: 'end', big: '¡Vuelve!', text: 'Según el anuncio del 31 de agosto de 2026: 4 especiales en prime time en la temporada 2026-27.', fuente: 'Fuente: Wikipedia, artículo «¡Ahora caigo!» (CC BY-SA 4.0). Resumen con nuestras propias palabras. Juego de fans sin afiliación con la cadena ni la productora.' },
    cam: camHost, luces: 'intro' },
];
/** frases para pregenerar con la voz del presentador */
export const lineasHistoria = () => CAPITULOS.flatMap(c => c.narr);

const esc = (t: string) => t.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[ch]);
function cardHtml(c: Capitulo, i: number) {
  const k = c.card; let body = '';
  if (k.k === 'text') body = k.items.map(([a, b]) => `<div class="hrow"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('');
  else if (k.k === 'timeline') body = `<div class="htl">${k.items.map(([a, b]) => `<div class="hstep"><i></i><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}</div>`;
  else if (k.k === 'chips') body = `<div class="hchips">${k.items.map(x => `<span>${esc(x)}</span>`).join('')}</div>` + (k.note ? `<p class="hnote">${esc(k.note)}</p>` : '');
  else if (k.k === 'cols') body = `<div class="hcols">${k.cols.map(([a, b]) => `<div><h4>${esc(a)}</h4><ul>${b.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>`;
  else if (k.k === 'tiles') body = `<div class="htiles">${k.items.map(([e, a, b]) => `<div><em>${e}</em><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}</div>`;
  else if (k.k === 'stats') body = `<div class="hstats">${k.items.map(([a, b]) => `<div><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}</div>` + (k.note ? `<p class="hnote">${esc(k.note)}</p>` : '');
  else if (k.k === 'world') body = `<div class="hworld">${k.items.map(([f, a, b]) => `<div><em>${f}</em><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}</div>`;
  else if (k.k === 'bars') {
    const max = Math.max(...k.items.map(x => x[1]));
    body = `<div class="hbars">${k.items.map(([a, v, s], j) => `<div class="hbar${v === max ? ' top' : ''}" title="${esc(s)} espectadores"><span class="hv">${String(v).replace('.', ',')}${k.unit}</span><i style="--h:${(v / 18 * 100).toFixed(1)}%;--d:${j * 70}ms"></i><small>${esc(a)}</small></div>`).join('')}</div><p class="hnote">Cuota de pantalla media por temporada (PT = prime time)</p>`;
  } else if (k.k === 'end') body = `<div class="hend"><b>${esc(k.big)}</b><p>${esc(k.text)}</p></div><p class="hfuente">${esc(k.fuente)}</p>`;
  return `<div class="hhead"><span class="hnum">${i + 1}/${CAPITULOS.length}</span><h3>${c.emoji} ${esc(c.titulo)}</h3></div>${body}`;
}

/** Modo historia. Devuelve cuando el jugador pulsa «Terminar» */
export async function historia(c: Ctx, desde = 0) {
  const { eng, hud, s } = c;
  document.getElementById('historia')?.remove();
  const root = document.createElement('div'); root.id = 'historia'; root.className = 'ui';
  root.innerHTML = `<div class="hcard" id="hCard"></div><div class="hsub" id="hSub"></div>
    <div class="hctl"><button class="tbtn" id="hPrev">◀ Anterior</button><button class="tbtn" id="hSkip">⏭ Saltar</button><button class="tbtn sel" id="hNext">Siguiente ▶</button></div>
    <div class="hdots" id="hDots">${CAPITULOS.map((_, i) => `<i data-i="${i}"></i>`).join('')}</div>`;
  document.getElementById('hud')!.appendChild(root);
  const $ = (id: string) => root.querySelector('#' + id) as HTMLElement;
  let cap = Math.max(0, Math.min(CAPITULOS.length - 1, desde)), go: number | null = null, skipLine = false, terminar = false;
  const W = window as any; W.__historia = { cap, linea: -1, total: CAPITULOS.length, terminado: false };
  $('hPrev').onclick = e => { e.stopPropagation(); audio.play('Tecla'); go = Math.max(0, cap - 1); };
  $('hNext').onclick = e => { e.stopPropagation(); audio.play('Tecla'); if (cap === CAPITULOS.length - 1) terminar = true; else go = cap + 1; };
  $('hSkip').onclick = e => { e.stopPropagation(); skipLine = true; };
  $('hSub').onclick = e => { e.stopPropagation(); skipLine = true; };
  root.querySelectorAll('#hDots i').forEach(d => (d as HTMLElement).onclick = e => { e.stopPropagation(); go = +(d as HTMLElement).dataset.i!; });
  audio.playMusic('Trilha', true, 0.18);
  eng.face(eng.host, V(0, 0, 8));
  try {
    while (!terminar) {
      const C = CAPITULOS[cap]; W.__historia.cap = cap; W.__historia.linea = -1;
      $('hCard').innerHTML = cardHtml(C, cap); $('hCard').className = 'hcard in hk-' + C.card.k; void $('hCard').offsetWidth;
      root.querySelectorAll('#hDots i').forEach((d, j) => d.classList.toggle('on', j === cap));
      ($('hPrev') as HTMLButtonElement).disabled = cap === 0;
      $('hNext').textContent = cap === CAPITULOS.length - 1 ? 'Terminar ✓' : 'Siguiente ▶';
      C.cam(c); if (C.luces) eng.lights?.event(C.luces);
      if (cap === 0 || cap === CAPITULOS.length - 1) publico.aplauso(2.2, 0.5);
      go = null;
      for (let j = 0; j < C.narr.length && go == null && !terminar; j++) {
        W.__historia.linea = j; skipLine = false;
        const t = C.narr[j]; $('hSub').innerHTML = `<b>El Presentador</b><span>${esc(t)}</span>`; $('hSub').classList.add('on');
        gesture(eng.host, 'habla', 2.5);
        const v = voice.speak(t); const t0 = performance.now(); let fin = false; v.done.then(() => { fin = true; });
        const read = 1200 + t.length * 45;
        await s.until(() => skipLine || go != null || terminar || (fin && (v.ms > 0 || performance.now() - t0 > read)) || performance.now() - t0 > Math.max(v.ms, read) + 2500);
        voice.stop(); if (!skipLine && go == null) await s.w(350);
      }
      if (go == null && !terminar) {
        if (cap === CAPITULOS.length - 1) { W.__historia.terminado = true; await s.until(() => terminar || go != null); }
        else { await s.w(900); if (go == null && !terminar) go = cap + 1; }
      }
      if (go != null) cap = go;
    }
  } finally { voice.stop(); root.remove(); hud.hideBubble(); }
}
