// Concursantes: nombre y profesión del concursante central (los escribe el jugador) y de los 10 oponentes
// (nombres editables; profesiones inventadas, divertidas y fijas). Se guardan solo en este dispositivo (localStorage).
// También contiene los guiones de las presentaciones (presentador ↔ oponente) con varias variantes.
// Las frases que no llevan el nombre se pregeneran con voces sintéticas GENÉRICAS (piper); el nombre se ve en el bocadillo.

export type Genero = 'm' | 'f';
export interface Rival {
  /** nombre por defecto (editable en Opciones › Concursantes) */ def: string; g: Genero;
  /** profesión corta (rótulos, créditos) */ job: string;
  /** el oponente explica a qué se dedica (1.ª persona, sin su nombre) */ intro: string[];
  /** chascarrillo (1.ª persona, sin su nombre) */ chistes: string[];
}
export const RIVALES: Rival[] = [
  { def: 'Paco', g: 'm', job: 'Probador oficial de colchones',
    intro: ['Soy probador oficial de colchones. Me paso el día durmiendo… ¡y encima me pagan!', 'Pruebo colchones para una fábrica. Es un trabajo muy duro: hay días que tengo que hacer hasta dos siestas.'],
    chistes: ['Mi récord son catorce horas seguidas probando un colchón. Me dieron el premio al empleado del mes… ¡pero no me enteré!', 'Cuando me preguntan si trabajo mucho, digo: ¡qué va, me lo tomo con mucha calma… y con almohada!', 'Mi jefe me dijo que me tomara el trabajo en serio. ¡Y me quedé dormido en la reunión!'] },
  { def: 'Lola', g: 'f', job: 'Peluquera de caniches',
    intro: ['Soy peluquera de caniches. Les hago la permanente, las mechas y, si se portan bien, ¡un lacito!', 'Tengo una peluquería solo para perros. Los caniches son mis clientes favoritos: nunca se quejan del precio.'],
    chistes: ['El otro día un caniche me pidió el mismo corte que su dueña… ¡y le quedó mejor!', 'Mis clientes nunca me cuentan cotilleos. Bueno, alguno me ladra.', 'Un caniche salió tan guapo que su dueño no lo reconoció. ¡Se lo tuve que presentar yo!'] },
  { def: 'Ramón', g: 'm', job: 'Escritor de galletas de la suerte',
    intro: ['Escribo los mensajitos de las galletas de la suerte. Lo de «hoy será un gran día» es mío.', 'Me dedico a escribir las frases de las galletas de la suerte. Hoy he venido a comprobar si funcionan.'],
    chistes: ['Esta mañana abrí una galleta y ponía: «hoy vas a caer». ¡Espero que se refiera a caer bien!', 'Mi madre dice que mis frases no tienen sentido… ¡pero es que ella abre la galleta del revés!', 'Una vez escribí: «una gran sorpresa te espera». Y era otra galleta.'] },
  { def: 'Conchi', g: 'f', job: 'Monitora de zumba para abuelos',
    intro: ['Soy monitora de zumba para abuelos. ¡Tienen más marcha que yo!', 'Doy clases de zumba en un centro de mayores. Empezamos a las nueve… y a las nueve y cuarto ya están pidiendo la merienda.'],
    chistes: ['Tengo un alumno de noventa años que baila mejor que yo. Dice que el secreto es no parar… ¡ni para escuchar a la profe!', 'Un día puse una canción moderna y una alumna me pidió algo más actual… ¡un pasodoble!', 'En mis clases nadie se cansa. Bueno, se cansa el altavoz.'] },
  { def: 'Tomás', g: 'm', job: 'Pastelero de tartas gigantes',
    intro: ['Soy pastelero. Hago tartas de cumpleaños gigantes, de esas que no caben por la puerta.', 'Tengo una pastelería y mi especialidad son las tartas enormes. La última tenía ocho pisos… ¡y ascensor!'],
    chistes: ['Mi médico me ha dicho que deje los dulces. Y le he hecho caso: ¡los he dejado en la nevera!', 'Hice una tarta tan grande que tardamos tres días en soplar las velas.', 'Mi tarta favorita es la de queso. Y la segunda… ¡la de queso también!'] },
  { def: 'Marisa', g: 'f', job: 'Conductora de autobús escolar con karaoke',
    intro: ['Conduzco un autobús escolar… ¡con karaoke! Los niños llegan al cole cantando.', 'Soy conductora de autobús escolar. Llevo a treinta niños cada mañana y, para que no se aburran, ¡ponemos karaoke!'],
    chistes: ['Un día se estropeó el karaoke y los niños tuvieron que hablar entre ellos. ¡Fue un drama!', 'Una vez me equivoqué de ruta y acabamos en la playa. Los niños dicen que fue la mejor excursión del año.', 'Los niños me piden siempre la misma canción. ¡Ya la canto hasta en sueños!'] },
  { def: 'Javi', g: 'm', job: 'Afinador de campanas',
    intro: ['Soy afinador de campanas. Subo a los campanarios y dejo las campanas sonando de maravilla.', 'Me dedico a afinar campanas de iglesia. Es un trabajo muy tranquilo… hasta que dan las doce.'],
    chistes: ['El otro día estaba afinando y dieron las doce. ¡Todavía oigo campanitas!', 'Cuando me preguntan qué tal el trabajo, siempre digo: ¡a mí todo me suena!', 'En casa me piden que hable más bajito. ¡Es que estoy acostumbrado a hablar por encima de las campanas!'] },
  { def: 'Rocío', g: 'f', job: 'Guía de cuevas con murciélagos simpáticos',
    intro: ['Soy guía turística en una cueva. Enseño estalactitas, estalagmitas y murciélagos muy simpáticos.', 'Trabajo de guía en unas cuevas preciosas. Los murciélagos ya me conocen y me saludan al entrar.'],
    chistes: ['Un murciélago me sigue a todas partes. Creo que quiere ser guía.', 'En la cueva hay tanto eco que, si cuentas un chiste, ¡te ríes tres veces!', 'Siempre digo que mi trabajo tiene muchos altibajos… ¡sobre todo las estalactitas!'] },
  { def: 'Manolo', g: 'm', job: 'Fontanero que canta ópera',
    intro: ['Soy fontanero y, mientras arreglo los grifos, canto ópera. ¡Los clientes no saben si llamarme o comprar entradas!', 'Arreglo tuberías y canto ópera a la vez. Dicen que mis notas altas desatascan cualquier cañería.'],
    chistes: ['Una señora me llamó por una fuga y acabé dando un concierto en su cocina. ¡Me pidió un bis!', 'Si un grifo gotea, le canto un do de pecho… ¡y se calla de golpe!', 'Mi canción favorita es la del agua: ¡gota a gota!'] },
  { def: 'Pili', g: 'f', job: 'Catadora oficial de churros',
    intro: ['Soy catadora oficial de churros. Pruebo churros de toda España y les pongo nota.', 'Mi trabajo es probar churros. Los mojo en chocolate, los saboreo… ¡y pido otra ración para asegurarme!'],
    chistes: ['Me preguntan si no me canso de los churros. ¡Qué va! Me canso de las porras, que son más grandes.', 'Tenía un churro de la suerte… ¡pero me lo comí en el desayuno!', 'Dicen que el dinero no da la felicidad… pero da para churros, que es casi lo mismo.'] },
];

/** Voz genérica sintética de cada oponente (modelo piper + locutor + tono), solo para pregenerar el audio */
export const VOCES: Record<string, { model: string; spk?: number; len: number; pitch: number }> = {
  op1: { model: 'es_ES-sharvard-medium', spk: 0, len: 0.92, pitch: 1.0 },
  op2: { model: 'es_ES-sharvard-medium', spk: 1, len: 0.9, pitch: 1.0 },
  op3: { model: 'es_ES-carlfm-x_low', len: 0.95, pitch: 1.0 },
  op4: { model: 'es_AR-daniela-high', len: 0.9, pitch: 1.0 },
  op5: { model: 'es_MX-ald-medium', len: 0.88, pitch: 0.9 },
  op6: { model: 'es_ES-sharvard-medium', spk: 1, len: 0.86, pitch: 1.1 },
  op7: { model: 'es_ES-sharvard-medium', spk: 0, len: 0.86, pitch: 1.13 },
  op8: { model: 'es_AR-daniela-high', len: 0.88, pitch: 1.09 },
  op9: { model: 'es_ES-carlfm-x_low', len: 1.0, pitch: 0.87 },
  op10: { model: 'es_ES-sharvard-medium', spk: 1, len: 0.95, pitch: 0.92 },
};

// ------------------------------------------------------------------ datos guardados
const KEY = 'ac3d_concursantes';
interface Datos { central: string; profesion: string; rivales: string[]; presentaciones: boolean; eleccion: boolean }
const limpia = (s: string, max = 18) => (s || '').replace(/[<>{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
function cargar(): Datos {
  const d: Datos = { central: '', profesion: '', rivales: RIVALES.map(r => r.def), presentaciones: true, eleccion: true };
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (typeof j.central === 'string') d.central = limpia(j.central);
    if (typeof j.profesion === 'string') d.profesion = limpia(j.profesion, 60);
    if (Array.isArray(j.rivales)) j.rivales.slice(0, 10).forEach((n: any, i: number) => { const t = limpia(String(n ?? '')); if (t) d.rivales[i] = t; });
    if (typeof j.presentaciones === 'boolean') d.presentaciones = j.presentaciones;
    if (typeof j.eleccion === 'boolean') d.eleccion = j.eleccion;
  } catch { }
  return d;
}
let D = cargar();
const listeners: (() => void)[] = [];
export const cons = {
  /** nombre del concursante central ('' si no lo ha escrito) */
  get central() { return D.central; },
  get profesion() { return D.profesion; },
  get presentaciones() { return D.presentaciones; },
  get eleccion() { return D.eleccion; },
  setEleccion(on: boolean) { D.eleccion = on; guardar(); },
  /** nombre para el marcador del duelo («Tú» si no hay nombre) */
  get tu() { return D.central || 'Tú'; },
  rival(n: number) { return D.rivales[n - 1] || RIVALES[n - 1]?.def || 'Oponente ' + n; },
  esDef(n: number) { return this.rival(n) === RIVALES[n - 1]?.def; },
  job(n: number) { return RIVALES[n - 1]?.job || ''; },
  set(k: 'central' | 'profesion', v: string) { D[k] = limpia(v, k === 'profesion' ? 60 : 18); guardar(); },
  setRival(n: number, v: string) { D.rivales[n - 1] = limpia(v) || RIVALES[n - 1].def; guardar(); },
  setPresentaciones(on: boolean) { D.presentaciones = on; guardar(); },
  reset() { D = { central: D.central, profesion: D.profesion, rivales: RIVALES.map(r => r.def), presentaciones: D.presentaciones, eleccion: D.eleccion }; guardar(); },
  onChange(f: () => void) { listeners.push(f); },
  /** solo para pruebas */ reload() { D = cargar(); listeners.forEach(f => f()); },
};
function guardar() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch { } listeners.forEach(f => f()); }

// ------------------------------------------------------------------ guiones
/** Una línea del guion: quién habla, texto del bocadillo y textos de audio candidatos (el primero pregenerado que exista) */
export interface Linea { who: 'host' | 'rival' | 'central'; bubble: string; audio: string[]; voz?: string; tts?: boolean; react?: 'aplauso' | 'risas' | 'vitores' }
/** Frases del presentador con nombre: [con nombre, sin nombre] */
const SALUDOS: [string, string][] = [
  ['¡Hola, {nombre}! ¡Qué alegría tenerte aquí! Cuéntanos, ¿a qué te dedicas?', '¡Hola! ¡Qué alegría tenerte aquí! Cuéntanos, ¿a qué te dedicas?'],
  ['Vamos a conocer a nuestro rival. {nombre}, ¿tú a qué te dedicas?', 'Vamos a conocer a nuestro rival. ¿Tú a qué te dedicas?'],
  ['¡Un aplauso para {nombre}! Dime, ¿cuál es tu profesión?', '¡Un aplauso para nuestro rival! Dime, ¿cuál es tu profesión?'],
  ['{nombre}, te damos la bienvenida. ¿Y tú, de qué trabajas?', 'Te damos la bienvenida al programa. ¿Y tú, de qué trabajas?'],
];
export const REACCIONES = ['¡Ja, ja! ¡Qué arte!', '¡Madre mía, qué nivel!', '¡Me lo apunto!', '¡Ja, ja, ja! ¡Qué bueno!', '¡Lo que hay que oír!', '¡Qué personaje! Me encanta.'];
export const CIERRES = ['¡Muy bien! Vamos a ver si sabes tanto como cuentas.', 'Mucha suerte… ¡pero no demasiada!', '¡Pues ahora, a demostrarlo en el duelo!'];
/** El «running gag» cariñoso con Karlos Arguiñano (solo sus recetas y sus frases de la tele) */
type Par = ['h' | 'o', string][];
export const ARGUINANO: Par[] = [
  [['h', 'Y en la cocina, ¿qué tal te defiendes?'], ['o', 'Sigo las recetas de Karlos Arguiñano al pie de la letra. Me quedan regular… ¡pero con mucho perejil!']],
  [['o', 'Antes de venir he hecho una receta de Arguiñano. ¡Rica, rica y con fundamento!'], ['h', '¡Así se viene a un concurso! Con el estómago contento y la cabeza despejada.']],
  [['h', 'Una pregunta muy seria: ¿perejil sí o perejil no?'], ['o', '¡Perejil siempre! Como dice Karlos Arguiñano, le da alegría a cualquier plato.']],
  [['o', 'Para los nervios hago como Arguiñano en la tele: cocino, cuento un chiste y sonrío.'], ['h', '¡Pues aquí tenemos preguntas ricas, ricas y con fundamento!']],
  [['h', 'Si Karlos Arguiñano estuviera aquí, ya te habría dado una receta para los nervios.'], ['o', '¡Seguro que con un buen chorrito de aceite de oliva y una ramita de perejil!']],
  [['o', 'En mi casa vemos las recetas de Arguiñano todos los días. ¡Hasta el perro se relame!'], ['h', '¡Normal! Con esas recetas, todo sale rico, rico y con fundamento.']],
];
export const ARG_CIERRES = ['Como diría Karlos Arguiñano: un poquito de perejil… ¡y al duelo!', '¡Hoy todo el mundo habla de Arguiñano! Al final del programa repartimos perejil.'];

// presentación del concursante central (tras la cabecera)
const C_SALUDO: [string, string][] = [
  ['¡Y ahora, vamos a conocer a quien juega hoy desde la trampilla central! ¡Un fuerte aplauso para {nombre}!', '¡Y ahora, vamos a conocer a quien juega hoy desde la trampilla central! ¡Un fuerte aplauso!'],
  ['¡Y aquí llega quien juega hoy en la trampilla central! ¡Te damos la bienvenida, {nombre}!', '¡Y aquí llega quien juega hoy en la trampilla central! ¡Te damos la bienvenida!'],
];
const C_PREG: [string, string][] = [
  ['{nombre}, cuéntanos: ¿a qué te dedicas?', 'Cuéntanos: ¿a qué te dedicas?'],
  ['Antes de empezar, {nombre}: ¿cuál es tu profesión?', 'Antes de empezar: ¿cuál es tu profesión?'],
];
export const C_CHISTES = [
  '¡Qué interesante! Seguro que eso te ayuda con las preguntas… o por lo menos con los nervios.',
  '¡Anda! Pues con ese trabajo, las trampillas no te darán ningún miedo… espero.',
  '¡Me encanta! Yo de pequeño quería ser eso mismo… o astronauta, o churrero. Al final acabé aquí.',
  '¡Qué maravilla! Pues hoy tu trabajo es tirar a ocho oponentes. ¡Sin presión!',
];
export const C_MISTERIO = '¿No nos lo quieres contar? ¡Un poco de misterio! Me encanta.';
export const C_CIERRE_ARG = 'Y como diría Karlos Arguiñano: ¡esto va a quedar rico, rico y con fundamento!';
/** nombre que probablemente escriba el jugador: también se pregenera con su nombre */
const CENTRAL_PREGEN = ['Iker'];

// frases del programa con el nombre del oponente en el bocadillo (el audio con número sigue disponible)
export const LB = {
  elegidoT: ['¡Has elegido al oponente número {n}: {nombre}!', '¡El {n}! Vamos a ver qué sabe {nombre}…', '{nombre}, oponente {n}, ¡al duelo!'],
  turnoBot: ['Empieza contestando {nombre}. ¡Cada uno con su reloj!', 'Primero contesta {nombre}. ¡Atentos al reloj!'],
  botTiempo: ['¡A {nombre} se le ha acabado el tiempo!', '¡Tiempo para {nombre}!'],
};
export const conNombre = (t: string, nombre: string, n = 0) => t.replace(/\{nombre\}/g, nombre).replace(/\{n\}/g, String(n));

// memoria para no repetir variantes (también entre partidas)
const MEM = 'ac3d_pres_mem';
const mem: Record<string, number> = (() => { try { return JSON.parse(localStorage.getItem(MEM) || '{}'); } catch { return {}; } })();
/** siguiente elemento de una lista en orden barajado-rotatorio estable */
function turno<T>(k: string, arr: T[]): T { const i = (mem[k] ?? Math.floor(Math.random() * arr.length)) % arr.length; mem[k] = i + 1; try { localStorage.setItem(MEM, JSON.stringify(mem)); } catch { } return arr[i]; }
const rnd = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
let argEnPartida = 0;
export function nuevaPartida() { argEnPartida = 0; }

const host = (bubble: string, audio: string[], react?: Linea['react']): Linea => ({ who: 'host', bubble, audio, react });
const rival = (n: number, t: string, react?: Linea['react']): Linea => ({ who: 'rival', bubble: t, audio: [t], voz: 'op' + n, react });
/** frase del presentador con nombre: audio con el nombre si es el pregenerado, si no la versión sin nombre */
function hostNombre(par: [string, string], nombre: string, pregen: boolean, react?: Linea['react']): Linea {
  const con = conNombre(par[0], nombre);
  return host(nombre ? con : par[1], nombre && pregen ? [con, par[1]] : [par[1]], react);
}

/** Guion de 4-5 líneas para presentar al oponente n */
export function guionRival(n: number, forzarArg?: boolean): Linea[] {
  const R = RIVALES[n - 1]; const nombre = cons.rival(n);
  const out: Linea[] = [hostNombre(turno('sal', SALUDOS), nombre, cons.esDef(n), 'aplauso')];
  out.push(rival(n, turno('in' + n, R.intro)));
  const arg = forzarArg ?? (argEnPartida === 0 ? Math.random() < 0.6 : Math.random() < 0.35);
  if (arg) {
    argEnPartida++;
    const par = turno('arg', ARGUINANO);
    par.forEach(([w, t], i) => { const r = i === par.length - 1 ? 'risas' as const : undefined; out.push(w === 'h' ? host(t, [t], r) : rival(n, t, r)); });
    if (argEnPartida > 1 && Math.random() < 0.5) out.push(host(ARG_CIERRES[1], [ARG_CIERRES[1]], 'risas'));
    else if (Math.random() < 0.3) out.push(host(ARG_CIERRES[0], [ARG_CIERRES[0]], 'aplauso'));
  } else {
    out.push(rival(n, turno('ch' + n, R.chistes), 'risas'));
    const re = rnd(REACCIONES); out.push(host(re, [re]));
    if (Math.random() < 0.35) { const c = rnd(CIERRES); out.push(host(c, [c], 'aplauso')); }
  }
  return out.slice(0, 5);
}

const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : s;
/** Guion de la presentación del concursante central */
export function guionCentral(): Linea[] {
  const nombre = cons.central, prof = cons.profesion;
  const pre = !!nombre && CENTRAL_PREGEN.some(x => x.toLowerCase() === nombre.toLowerCase());
  const out: Linea[] = [hostNombre(turno('csal', C_SALUDO), nombre, pre, 'vitores'), hostNombre(turno('cpre', C_PREG), nombre, pre)];
  if (prof) {
    const yo = nombre ? `¡Hola! Soy ${nombre} y me dedico a esto: ${prof}.` : `¡Hola! Me dedico a esto: ${prof}.`;
    out.push({ who: 'central', bubble: yo, audio: [yo], tts: true });
    const ch = turno('cch', C_CHISTES);
    out.push(host(`¿${cap(prof.replace(/[.!¡¿?]+$/g, ''))}? ${ch}`, [ch], 'risas'));
  } else out.push(host(C_MISTERIO, [C_MISTERIO], 'risas'));
  if (Math.random() < 0.4) out.push(host(C_CIERRE_ARG, [C_CIERRE_ARG], 'aplauso'));
  return out;
}

/** Todas las frases pregenerables (voz del presentador = sin voz; oponentes = op1..op10) */
export function lineasVoz(): { t: string; v?: string }[] {
  const out: { t: string; v?: string }[] = [];
  const H = (t: string) => out.push({ t });
  for (const [con, sin] of [...SALUDOS]) { H(sin); RIVALES.forEach(r => H(conNombre(con, r.def))); }
  for (const [con, sin] of [...C_SALUDO, ...C_PREG]) { H(sin); CENTRAL_PREGEN.forEach(nm => H(conNombre(con, nm))); }
  [...REACCIONES, ...CIERRES, ...ARG_CIERRES, ...C_CHISTES, C_MISTERIO, C_CIERRE_ARG].forEach(H);
  for (const par of ARGUINANO) for (const [w, t] of par) { if (w === 'h') H(t); else RIVALES.forEach((_, i) => out.push({ t, v: 'op' + (i + 1) })); }
  RIVALES.forEach((r, i) => [...r.intro, ...r.chistes].forEach(t => out.push({ t, v: 'op' + (i + 1) })));
  for (const arr of Object.values(LB)) for (const t of arr) RIVALES.forEach((r, i) => H(conNombre(t, r.def, i + 1)));
  return out;
}
