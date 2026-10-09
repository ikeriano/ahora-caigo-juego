// v1.5 — El presentador lee las preguntas en voz alta (voz sintética GENÉRICA piper, pregenerada; nunca clonación).
//  - Audio en public/voz/q/<clave>.mp3 (mono, 32 kbps) con su índice voz/q/index.json; se carga bajo demanda (no se precarga en el SW).
//  - El texto hablado se normaliza (números, siglas, símbolos y nombres extranjeros) para que la voz lo pronuncie bien.
//  - Velocidad normal/rápida con playbackRate conservando el tono (preservesPitch).
import { audio, BASE } from './assets';
import { voice, hashText } from './voice';
import type { Q } from './questions';
import { themeQuestions, hasThemePool } from './questions';
import { ENTRE_TRES, ADIVINA, CENTRAL, DAME_LETRA, SI_NO, E3 } from './bancos';
import { THEMES } from './themes';

// ------------------------------------------------------------------ textos de las preguntas del .sb3 (son imágenes)
/** Transcripción de las preguntas 1–80 del minijuego de Scratch (las 81–90 son «Palabra gallina»: letras de canciones, no se leen) */
export const SB3_TEXTOS: string[] = [
  '¿Con qué cereal se rellenan los tomates y otras verduras para preparar el guemistá, un plato típico griego?',
  '¿Qué edulcorante se suele añadir al vinagre con el que se prepara el arroz para sushi?',
  '¿Con qué sobrenombre de superhéroe es conocido el ciclista colombiano Miguel Ángel López?',
  '¿Qué nacionalidad tiene la mujer que preparó el primer café expreso en el espacio?',
  '¿En qué ciudad nació Maria Callas?',
  '¿Qué figuras aparecen en la bandera de Honduras?',
  'Las siglas PNUD corresponden a Programa de las Naciones Unidas para el...',
  'La protagonista del cuadro «La Libertad guiando al pueblo» de Delacroix va armada con un fusil y una...',
  'Según la revista «Forbes», esta hermana de las Kardashian se convirtió en la multimillonaria más joven del mundo en 2019.',
  '¿Con qué nombre conocemos al artista renacentista Donato di Niccolò di Betto Bardi?',
  'Este filósofo presocrático defendía que todo fluye y nada permanece idéntico a sí mismo.',
  '¿En qué siglo vivió el legendario bandolero Jesse James?',
  '¿En qué deporte destacó la estadounidense Mia Hamm?',
  'El brasileño Ronaldo fue el futbolista más joven en ganar este premio de la revista «France Football» en 1997.',
  'Fiesta valenciana con nombre de grandes grietas de la corteza terrestre que pueden estar causadas por un terremoto.',
  'Así llamamos a los huevos que se han cocido con la cáscara en agua hirviendo.',
  '¿Con qué nombre pasó a la historia la legendaria cantante de jazz Eunice Kathleen Waymon?',
  '¿Qué cereal tiene una variedad con granos multicolor conocida como Glass Gem?',
  '¿En qué guerra española se libró la batalla de Guadalajara?',
  '¿De qué isla española es capital Santa Cruz de la Palma?',
  '¿Cuál es el único parque nacional español eminentemente geológico?',
  '¿Cuál es el primer órgano que se desarrolla en un embrión?',
  'Cuando nos equivocamos decimos que hemos «dado un paso...»',
  '¿De qué país es originario el queso Brighton Blue?',
  'A los llamados puntos verdes, donde se recogen residuos especiales, también se les conoce como puntos...',
  'Trabajo de investigación para recibirse en la facultad.',
  'Es una descarga eléctrica en el cielo.',
  'Es una afirmación o negación de algo poniendo a Dios de testigo, o una calle de Belgrano.',
  'Es un anticipo, puede ser del sueldo o de una peli.',
  'Es un relleno de choclo que puede venir en tartas, empanadas o chala.',
  'Es una persona que se enoja o excita con mucha facilidad.',
  '¿Qué objeto usado para limpiar los dientes servía de apodo a Sophia Loren por su delgadez?',
  'Película de los 90 en la que Sam siempre responde «ídem» cuando Molly le dice «te quiero».',
  '¿De qué extracto de planta se aisló por primera vez la morfina?',
  '¿En qué famoso juego de mesa puedes ir a la cárcel o caer en el parking gratuito?',
  '¿Cómo se titula el disco en que Mónica Naranjo versionó a la diva italiana Mina?',
  '¿A orillas de qué lago italiano está la localidad de Bellagio?',
  '¿De qué gran isla del océano Índico es nativo el camaleón de Parson, uno de los más grandes que existen?',
  '¿Qué organismo acuático es la chlorella, famosa por sus múltiples beneficios para el ser humano?',
  '¿En qué estado norteamericano nació Martin Luther King?',
  '¿En qué siglo se completó la construcción de la catedral gótica de León?',
  '¿En qué estación del año se entrega el trofeo Ramón de Carranza?',
  '¿Qué animal es Church en la novela «Cementerio de animales» de Stephen King?',
  '¿En qué provincia española están las mayores minas de oro que los romanos explotaron en Europa?',
  'Al principio de la serie «Allí abajo», ¿qué profesión ejerce María León?',
  '¿Qué tipo de cuerpo geométrico son las pirámides y los prismas, pero no las esferas?',
  '¿Qué grupo de pop español cantaba «No mires a los ojos de la gente»?',
  '¿De qué institución académica es director Santiago Muñoz Machado?',
  '¿Qué complemento de vestir lleva siempre en la cabeza David, el gnomo?',
  '¿Qué nombre comparten dos antiguos líderes del Partido Popular y de Podemos?',
  '¿Qué profesión aérea ejerce Han Solo en el Halcón Milenario de «La guerra de las galaxias»?',
  '¿Qué ciudad de Ontario coincide con el apellido del piloto de Fórmula 1 llamado Lewis?',
  '¿A qué deporte se dedica la brasileña Maya Gabeira?',
  '¿Qué serie de televisión protagonizada por George Clooney creó Michael Crichton, autor de «Jurassic Park»?',
  'En el cuento «La reina de las nieves» de Andersen, ¿a bordo de qué vehículo se llevan al pequeño Kay?',
  '¿Qué animal es un gocho?',
  '¿Qué prenda de ropa suele llevar Peppa Pig?',
  'Ann Davison fue la primera mujer en cruzar en solitario este océano a bordo de un velero.',
  'En lenguaje coloquial, cuando alguien desaparece sin avisar decimos que ha hecho una bomba de...',
  'Es el único mes que puede comenzar en lunes y terminar en domingo.',
  '¿En qué deporte fue campeón del mundo José Raúl Capablanca?',
  'Según el Sistema Internacional de Unidades, el culombio mide la cantidad de carga...',
  '¿En qué idioma «ohana» significa familia?',
  '¿De qué color es la cruz de la bandera de Dinamarca?',
  'El carnaval de la localidad italiana de Ivrea es famoso por celebrar una batalla en la que se lanzan...',
  '¿Qué insecto que aparece en la película «WALL-E» nace blanco pero se vuelve oscuro en solo unas horas?',
  '¿A qué personaje de «La casa de papel» da vida el actor Miguel Herrán?',
  'San Sebastián es la capital de esta provincia vasca.',
  '¿Qué canción de Bad Bunny y Jhay Cortez alcanzó el número 1 de la lista Billboard Global 200 en 2020?',
  '¿En qué conducto «externo» de nuestro cuerpo se introducen los medicamentos administrados por vía ótica?',
  'Es el nombre de Gollum antes de que el Anillo lo transforme.',
  'Con este nombre en rumano era conocido el conde real que inspiró el Drácula de Bram Stoker.',
  'Insecto volador que tiene una especie que se conoce vulgarmente como búho.',
  '¿En qué ciudad está el aeropuerto Galileo Galilei?',
  '¿Qué legendario futbolista tiene el récord de marcar más goles en una final de la Copa de Europa?',
  'Además de Marco Antonio, ¿con qué otro romano mantuvo una relación Cleopatra?',
  'Este rey francés, llamado el Rey Sol, concedía audiencias desde su retrete.',
  'El nombre en danés de este mamífero marino significa «ballena-caballo».',
  'Película de los 90 en la que Julia Roberts se va de compras por Rodeo Drive.',
  '¿Qué cantante argentina ha escrito el libro «Deja que te combata»?',
];
/** frase genérica para las preguntas «Palabra gallina» (no se leen letras de canciones) */
export const GALLINA_LECTURA = '¡Palabra gallina! Completa la letra de la canción.';

// ------------------------------------------------------------------ normalización para la voz
/** pronunciación aproximada de nombres extranjeros (solo para la voz; en pantalla se ve el original) */
const PRON: [RegExp, string][] = [
  [/¿C, D o B12\?/g, '¿Ce, de o be doce?'], [/¿Ag, Au u Or\?/g, '¿A ge, a u, u o erre?'], [/\bUNESCO\b/g, 'Unesco'],
  [/Agatha Christie/g, 'Ágata Cristi'], [/Sherlock Holmes/g, 'Sérlok Jolms'], [/Conan Doyle/g, 'Conan Doil'], [/Thomas Edison/g, 'Tomas Édison'],
  [/Beethoven/g, 'Bétoven'], [/Mont Blanc/g, 'Mon Blan'], [/Delacroix/g, 'Delacruá'], [/Van Gogh/g, 'Van Gog'], [/\bNewton\b/g, 'Niúton'],
  [/\bOttawa\b/g, 'Ótaua'], [/Peter Parker/g, 'Píter Párker'], [/Spider-Man/g, 'Espáiderman'], [/\bBatman\b/g, 'Bátman'], [/\bSuperman\b/g, 'Súperman'],
  [/Grand Slam/g, 'Grand Eslam'], [/Neil Armstrong/g, 'Nil Ármstrong'], [/\bun tee\b/g, 'un ti'], [/\bWon\b/g, 'Uon'], [/\bYen\b/g, 'Yen'], [/\bMozart\b/g, 'Mózart'],
  [/Jesse James/g, 'Yesi Yeims'], [/Mia Hamm/g, 'Mía Jam'], [/France Football/g, 'Frans Fútbol'], [/Kardashian/g, 'Kardáshian'],
  [/Forbes/g, 'Forbs'], [/Eunice Kathleen Waymon/g, 'Iúnis Kázlin Uéimon'], [/\bjazz\b/g, 'yas'], [/Glass Gem/g, 'Glas Yem'],
  [/Brighton Blue/g, 'Bráiton Blu'], [/\bMolly\b/g, 'Moli'], [/\bChurch\b/g, 'Cherch'], [/Stephen King/g, 'Estíven King'],
  [/Martin Luther King/g, 'Martin Lúter King'], [/\bLewis\b/g, 'Luis'], [/George Clooney/g, 'Yorch Clúni'], [/Michael Crichton/g, 'Máikel Cráiton'],
  [/Jurassic Park/g, 'Yurásic Park'], [/\bKay\b/g, 'Kei'], [/Peppa Pig/g, 'Pepa Pig'], [/Ann Davison/g, 'An Déivison'],
  [/WALL-E/g, 'Guóli'], [/Bad Bunny/g, 'Bad Bani'], [/Jhay Cortez/g, 'Yei Cortez'], [/Billboard/g, 'Bílbord'], [/Gollum/g, 'Gólum'],
  [/Bram Stoker/g, 'Bram Estóker'], [/Rodeo Drive/g, 'Rodeo Dráiv'], [/Julia Roberts/g, 'Yulia Róberts'], [/\bchlorella\b/g, 'clorela'],
  [/Sophia Loren/g, 'Sofía Loren'], [/\bsushi\b/g, 'súshi'], [/\bparking\b/g, 'párkin'], [/Bellagio/g, 'Belayio'], [/Shakespeare/g, 'Shéikspir'],
  [/Mary Shelley/g, 'Meri Shéli'], [/Frankenstein/g, 'Fránkenstein'], [/Samhain/g, 'Sáuin'], [/Halloween/g, 'Jálouin'], [/Santa Claus/g, 'Santa Claus'],
  [/Harry Potter/g, 'Jari Póter'], [/\bWalt Disney\b/g, 'Uolt Dísney'], [/\bDisney\b/g, 'Dísney'], [/Mickey Mouse/g, 'Miki Maus'], [/\bshow\b/gi, 'chou'],
];
const SIGLAS: [RegExp, string][] = [
  [/\bPNUD\b/g, 'pe ene u de'], [/\bADN\b/g, 'a de ene'], [/\bEE\. ?UU\./g, 'Estados Unidos'], [/\bH2O\b/g, 'hache dos o'], [/\bCO2\b/g, 'ce o dos'],
  [/\bOVNI\b/g, 'ovni'], [/\bUE\b/g, 'Unión Europea'], [/\bDNI\b/g, 'de ene i'], [/\bTV\b/g, 'tele'], [/\bPT\b/g, 'prime time'], [/\bDr\./g, 'doctor'], [/\bSr\./g, 'señor'], [/\bSra\./g, 'señora'],
];
const U = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
  'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const D = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const C = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
function menor1000(n: number): string {
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100), r = n % 100; let s = c ? C[c] : '';
  if (r) { const t = r < 30 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? ' y ' + U[r % 10] : ''); s = s ? s + ' ' + t : t; }
  return s;
}
/** número entero en palabras (español de España) */
export function numeroEnLetras(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (n < 0) return 'menos ' + numeroEnLetras(-n);
  if (n < 1000) return n === 0 ? 'cero' : menor1000(n);
  if (n < 1e6) { const m = Math.floor(n / 1000), r = n % 1000; const ms = m === 1 ? 'mil' : apocope(numeroEnLetras(m)) + ' mil'; return r ? ms + ' ' + menor1000(r) : ms; }
  const mm = Math.floor(n / 1e6), r = n % 1e6; const ms = mm === 1 ? 'un millón' : apocope(numeroEnLetras(mm)) + ' millones'; return r ? ms + ' ' + numeroEnLetras(r) : ms;
}
const apocope = (s: string) => s.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');
const ROMANOS: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
function romano(r: string) { let n = 0; for (let i = 0; i < r.length; i++) { const a = ROMANOS[r[i]], b = ROMANOS[r[i + 1]] || 0; n += a < b ? -a : a; } return n; }
const ORD = ['', 'primero', 'segundo', 'tercero', 'cuarto', 'quinto', 'sexto', 'séptimo', 'octavo', 'noveno', 'décimo'];
/** Texto tal como lo dice el presentador */
export function hablado(texto: string): string {
  let t = ' ' + texto.normalize('NFC') + ' ';
  for (const [re, s] of PRON) t = t.replace(re, s);
  for (const [re, s] of SIGLAS) t = t.replace(re, s);
  t = t.replace(/[«»"“”‘’]/g, '').replace(/(\s)'|'(\s|[.,;:?!])/g, '$1$2').replace(/…/g, '...');
  // siglos y reyes con números romanos
  t = t.replace(/\b([Ss]iglos?)\s+([IVXLC]+)(?![\p{L}\d])/gu, (_, s, r) => `${s} ${numeroEnLetras(romano(r))}`);
  t = t.replace(/\b(Luis|Felipe|Carlos|Alfonso|Fernando|Enrique|Isabel|Juan Pablo|Benedicto|León|Pío|Jaime|Pedro|Enrique|Napoleón|Ramsés)\s+([IVX]+)\b/g, (_, s, r) => { const n = romano(r); return `${s} ${n <= 10 ? ORD[n] : numeroEnLetras(n)}`; });
  // ordinales 1.º / 1.ª
  t = t.replace(/\b(\d{1,2})\.?\s?[ºo°]\b/g, (_, n) => ORD[+n] || numeroEnLetras(+n)).replace(/\b(\d{1,2})\.?\s?ª/g, (_, n) => (ORD[+n] || numeroEnLetras(+n)).replace(/o$/, 'a'));
  // símbolos y unidades
  t = t.replace(/(\d)\s*×\s*(\d)/g, '$1 por $2').replace(/×/g, ' por ').replace(/(\d)\s*%/g, '$1 por ciento');
  t = t.replace(/(\d)\s*€/g, '$1 euros').replace(/(\d)\s*[º°]\s*C\b/g, '$1 grados').replace(/(\d)\s*[º°]/g, '$1 grados');
  t = t.replace(/(\d)\s*km\/h\b/g, '$1 kilómetros por hora').replace(/(\d)\s*km\b/g, '$1 kilómetros').replace(/(\d)\s*kg\b/g, '$1 kilos').replace(/(\d)\s*cm\b/g, '$1 centímetros').replace(/(\d)\s*m\b/g, '$1 metros');
  t = t.replace(/\bnº\s*/g, 'número ').replace(/\bFórmula 1\b/g, 'Fórmula uno');
  t = t.replace(/\blos (\d0)\b/g, (_, n) => 'los ' + numeroEnLetras(+n));
  // números: miles con punto, decimales con coma
  t = t.replace(/\b\d{1,3}(?:\.\d{3})+\b/g, m => m.replace(/\./g, ''));
  t = t.replace(/\b(\d+),(\d+)\b/g, (_, a, b) => `${numeroEnLetras(+a)} coma ${b.length > 2 ? [...b].map((d: string) => U[+d]).join(' ') : numeroEnLetras(+b)}`);
  t = t.replace(/\b\d+\b/g, (m, off: number, s: string) => {
    const w = numeroEnLetras(+m); const next = s.slice(off + m.length);
    return /^\s+\p{L}/u.test(next) && !/^\s+(y|o|u|de|mil)\b/.test(next) ? apocope(w) : w;
  });
  return t.replace(/\s+/g, ' ').replace(/\s+([,.;:?!])/g, '$1').trim();
}
/** «A, B o C» (con «u» delante de sonido o) */
function opciones(op: string[]) {
  const h = op.map(o => hablado(o));
  const last = h[h.length - 1]; const conj = /^h?o/i.test(last) ? 'u' : 'o';
  return '¿' + h.slice(0, -1).join(', ') + ' ' + conj + ' ' + last + '?';
}

// ------------------------------------------------------------------ qué se lee
/** Lee una pregunta: si es una «Palabra gallina» con canción del jugador, suena la canción hasta el corte */
export function leerPregunta(q: Q, o: { rapida?: boolean; delay?: number } = {}): Lectura {
  if (q.cancion) { lector.stop(); const L = leerCancion(q); lector.cur = L; return L; }
  return lector.leer(textoPregunta(q), o);
}
export const textoPregunta = (q: Q): string | null => {
  if (q.gallina) return GALLINA_LECTURA;
  if (q.kind === 'img') return SB3_TEXTOS[(q.costume || 0) - 1] || null;
  return q.text || null;
};
export const textoEntreTres = (q: E3) => `${q[0]} ${opciones(q[1])}`;
export const textoCategoria = (cat: string) => `Categoría: ${cat.toLowerCase()}.`;

/** todas las lecturas pregenerables (para tools/gen-voice): texto hablado + clave */
export function lineasLectura(): { t: string; h: string; d: 'q' }[] {
  const raw: string[] = [GALLINA_LECTURA, ...SB3_TEXTOS];
  for (const th of THEMES) if (hasThemePool(th.id)) themeQuestions(th.id).forEach(q => q.text && raw.push(q.text));
  ENTRE_TRES.forEach(q => raw.push(textoEntreTres(q)));
  ADIVINA.forEach(a => { raw.push(textoCategoria(a.cat)); a.pistas.forEach(p => raw.push(p)); });
  VAYA_LIO.forEach(v => raw.push(v[0]));
  SI_NO.forEach(q => raw.push(q[0])); CENTRAL.forEach(q => raw.push(q[0]));
  [...new Set(DAME_LETRA.map(d => d[0]))].forEach(c => raw.push(textoCategoria(c)));
  const out = new Map<string, { t: string; h: string; d: 'q' }>();
  for (const r of raw) { const t = hablado(r); const h = clave(t); if (!out.has(h)) out.set(h, { t, h, d: 'q' }); }
  return [...out.values()];
}
const clave = (habl: string) => hashText('q|' + habl);

// ------------------------------------------------------------------ reproducción
export interface Lectura { /** se resuelve al terminar de leer (o enseguida si no hay lectura) */ done: Promise<void>; stop(): void; readonly leyendo: boolean }
const NADA: Lectura = { done: Promise.resolve(), stop() { }, leyendo: false };
/** indicador discreto «el presentador está leyendo» (el reloj espera) */
function badge(on: boolean) {
  let b = document.getElementById('leyendoBadge');
  if (on && !b) { b = document.createElement('div'); b.id = 'leyendoBadge'; b.textContent = '🎙 El presentador lee…'; (document.getElementById('hud') || document.body).appendChild(b); }
  b?.classList.toggle('on', on);
}
class Lector {
  on = true; rapida = false;
  index: Record<string, number> | null = null; private idxP: Promise<void> | null = null;
  private el: HTMLAudioElement | null = null; private blobs = new Map<string, Promise<string | null>>();
  cur: Lectura | null = null;
  /** log para pruebas */ log: string[] = []; ultimo = '';
  get leyendo() { return !!this.cur?.leyendo; }
  init() { return this.idxP ||= fetch(`${BASE}voz/q/index.json`).then(r => r.json()).then(j => { this.index = j; }).catch(() => { this.index = {}; }); }
  activo() { return this.on && voice.enabled; }
  has(texto: string) { return !!this.index && this.index[clave(hablado(texto))] != null; }
  /** precarga el audio de un texto (bajo demanda) */
  precarga(texto: string | null) {
    if (!texto || !this.activo()) return; void this.init().then(() => { const h = clave(hablado(texto)); if (this.index![h] != null) this.blob(h); });
  }
  private blob(h: string) {
    if (!this.blobs.has(h)) {
      this.blobs.set(h, fetch(`${BASE}voz/q/${h}.mp3`).then(r => r.ok ? r.blob() : null).then(b => b ? URL.createObjectURL(b) : null).catch(() => null));
      if (this.blobs.size > 40) { const [k, p] = this.blobs.entries().next().value!; this.blobs.delete(k); p.then(u => u && URL.revokeObjectURL(u)); }
    }
    return this.blobs.get(h)!;
  }
  private elemento() {
    if (this.el) return this.el;
    const el = new Audio(); el.preload = 'auto'; (el as any).preservesPitch = true; (el as any).webkitPreservesPitch = true;
    try { const src = audio.ctx.createMediaElementSource(el); src.connect((audio as any).voice); } catch { /* sin Web Audio: suena directo */ }
    return this.el = el;
  }
  /** Lee un texto. o.rapida: Juego Final (más deprisa). Devuelve enseguida un objeto Lectura. */
  leer(texto: string | null, o: { rapida?: boolean; delay?: number } = {}): Lectura {
    this.stop();
    if (!texto || !this.activo()) return NADA;
    this.ultimo = texto;
    const h = clave(hablado(texto));
    let stopped = false, leyendo = true, fin = () => { };
    const done = new Promise<void>(res => { fin = () => { leyendo = false; badge(false); res(); }; });
    const L: Lectura = { done, stop: () => { stopped = true; try { this.el?.pause(); } catch { } fin(); }, get leyendo() { return leyendo; } };
    this.cur = L;
    (async () => {
      await this.init(); if (o.delay) await new Promise(r => setTimeout(r, o.delay)); const dur = this.index![h];
      if (dur == null || stopped) { this.log.push('sin-audio:' + texto.slice(0, 30)); return fin(); }
      const url = await this.blob(h); if (!url || stopped) return fin();
      const el = this.elemento(); const rate = (this.rapida ? 1.3 : 1) * (o.rapida ? 1.2 : 1);
      el.src = url; el.playbackRate = rate; el.currentTime = 0;
      const tm = setTimeout(fin, (dur / rate) * 1000 + 1500);
      el.onended = () => { clearTimeout(tm); fin(); }; el.onerror = () => { clearTimeout(tm); fin(); };
      try { if (audio.ctx.state === 'suspended') await audio.ctx.resume(); await el.play(); if (!stopped) badge(true); this.log.push('lee:' + h + '@' + rate); } catch { clearTimeout(tm); fin(); }
    })();
    return L;
  }
  stop() { const c = this.cur; this.cur = null; c?.stop(); }
}
export const lector = new Lector();
import { leerCancion } from './gallina';
import { VAYA_LIO } from './vayalio';
