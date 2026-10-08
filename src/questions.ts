import { M } from './assets';
import type { ThemeId } from './themes';

export interface Q {
  id: string; kind: 'img' | 'txt';
  costume?: number;            // nº de disfraz de Pergunta/Resposta (preguntas del sb3)
  text?: string; word?: string; hidden?: boolean[];  // preguntas nuevas (mismo formato)
  missing: string[];           // letras que hay que escribir (como la lista "Painel" del Scratch)
  gallina?: boolean;
}
export const norm = (s: string) => s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z]/g, '');

/** Preguntas originales del Scratch: el nombre del disfraz son las letras ocultas */
export function sb3Question(i: number): Q {
  const c = M.sprites['Pergunta'].c[i - 1];
  return { id: 'sb3-' + i, kind: 'img', costume: i, missing: norm(c.n).split(''), gallina: i > 80 };
}
/** "Pregunta|AR[RO]Z": las letras entre corchetes quedan ocultas */
function parse(id: string, line: string): Q {
  const [text, pat] = line.split('|');
  let word = '', hidden: boolean[] = [], inside = false;
  for (const ch of pat) { if (ch === '[') { inside = true; continue; } if (ch === ']') { inside = false; continue; } word += ch; hidden.push(inside && ch !== ' '); }
  const miss: string[] = [];
  [...word].forEach((ch, i) => { if (hidden[i]) { const n = norm(ch); if (n && !miss.includes(n)) miss.push(n); } });
  return { id, kind: 'txt', text, word, hidden, missing: miss };
}

const RAW: Partial<Record<ThemeId, string[]>> = {
  halloween: [
    '¿Qué hortaliza naranja se vacía y se ilumina por dentro en Halloween?|CA[L]A[B]A[Z]A',
    '¿Cómo se llama el conde vampiro creado por Bram Stoker?|[D]RÁ[C]U[L]A',
    '¿Qué mamífero volador duerme colgado cabeza abajo?|MU[R]CIÉ[L]A[G]O',
    '¿En qué objeto vuelan tradicionalmente las brujas?|E[S]CO[B]A',
    '¿Qué figura vendada sale de los sarcófagos egipcios?|[M]O[M]IA',
    '¿En qué país nació la fiesta celta de Samhain, origen de Halloween?|I[R]LA[N]DA',
    '¿Qué dicen los niños en Halloween al llamar a las puertas?|TRU[C]O O [T]RA[T]O',
    '¿Qué arácnido teje telarañas?|A[R]A[Ñ]A',
    '¿Qué fiesta mexicana honra a los difuntos a principios de noviembre?|DÍA DE [M]UE[R]TOS',
    '¿Qué apellido tiene el doctor que crea un monstruo en la novela de Mary Shelley?|FRAN[K]EN[S]TEI[N]',
    '¿Qué ser se transforma en lobo con la luna llena?|HOM[B]RE [L]O[B]O',
    '¿Qué espíritu atraviesa paredes cubierto con una sábana?|FA[N]TAS[M]A',
    '¿En qué mes se celebra Halloween?|O[C]TU[B]RE',
    '¿Qué hueso forma la cabeza de un esqueleto?|C[R]Á[N]EO',
    '¿Qué condimento ahuyenta a los vampiros según la leyenda?|A[J]O',
    '¿En qué recipiente prepara la bruja sus pócimas?|CA[L]DE[R]O',
    '¿Qué lugar está lleno de tumbas y lápidas?|CE[M]EN[T]E[R]IO',
  ],
  ninos: [
    '¿Qué animal dice "miau"?|GA[T]O', '¿De qué color es el cielo en un día despejado?|A[Z]U[L]', '¿Cuántas patas tiene una araña?|O[C]H[O]',
    '¿Qué fruta alargada y amarilla les encanta a los monos?|PLÁ[T]A[N]O', '¿Qué animal es el rey de la selva?|LE[Ó]N', '¿Qué astro nos da luz y calor durante el día?|[S]O[L]',
    '¿Con qué parte de la cara olemos?|[N]A[R]IZ', '¿Qué animal tiene trompa y orejas muy grandes?|E[L]E[F]ANTE', '¿Cómo se llama la casita que hacen los pájaros?|[N]I[D]O',
    '¿Qué estación del año llega después del invierno?|PRI[M]A[V]ERA', '¿Qué lleva el rey en la cabeza?|CO[R]O[N]A', '¿Qué número va después del nueve?|[D]I[E]Z',
    '¿Qué animal da leche y dice "muu"?|[V]A[C]A', '¿Qué cae del cielo cuando llueve?|A[G]UA', '¿Qué aparece en el cielo con muchos colores después de llover?|AR[C]OÍ[R]IS',
    '¿Cuántos días tiene una semana?|SI[E]T[E]', '¿Qué animal salta y lleva a su cría en una bolsa?|CAN[G]U[R]O', '¿Qué vehículo largo va por las vías?|T[R]E[N]',
    '¿Qué insecto fabrica la miel?|A[B]E[J]A', '¿Qué nos ponemos en los pies antes de los zapatos?|CAL[C]E[T]INES', '¿Qué animal lleva caparazón y camina muy despacio?|TO[R]TU[G]A',
    '¿Con qué se escribe en la pizarra del cole?|TI[Z]A', '¿Cómo se llama el planeta en el que vivimos?|TI[E]R[R]A', '¿Qué fruta roja tiene las semillas por fuera?|FRE[S]A',
    '¿Qué animal ladra y es el mejor amigo de las personas?|PE[R]R[O]', '¿Qué princesa de cuento perdió un zapato de cristal?|CE[N]I[C]IENTA', '¿Qué hortaliza naranja les encanta a los conejos?|ZA[N]A[H]ORIA',
    '¿De qué color es la hierba?|V[E]R[D]E', '¿Cuál es el animal más grande del mar?|BA[L]LE[N]A', '¿Qué animal tiene el cuello más largo?|JI[R]A[F]A',
  ],
  nochebuena: [
    '¿Qué día de diciembre es Nochebuena?|VEINTI[C]UA[T]RO', '¿Qué dulce de almendra y miel es típico de la Navidad española?|TU[R]RÓ[N]', '¿Cómo se llama la misa de medianoche de Nochebuena?|MISA DEL [G]A[L]LO',
    '¿Qué canciones típicas se cantan en Navidad?|VI[L]LAN[C]ICOS', '¿Qué maqueta con figuritas recrea el nacimiento de Jesús?|BE[L]É[N]', '¿Qué guio a los Reyes Magos hasta el portal?|ES[T]RE[L]LA',
    '¿Qué dulce navideño que se deshace en la boca se hace con manteca?|POL[V]O[R]ÓN', '¿Qué animal acompaña al buey en el portal?|[M]U[L]A', '¿Qué instrumento con chapitas se agita en los villancicos?|PAN[D]E[R]ETA',
    '¿Qué marisco rojo suele haber en la cena de Nochebuena?|LAN[G]OS[T]INOS', '¿Qué instrumento de barro con un palo suena en los villancicos?|ZA[M][B]O[M]BA', '¿Qué dirige el Rey a los españoles cada 24 de diciembre por la noche?|DIS[C]UR[S]O',
    '¿Qué planta de hojas rojas adorna las casas en Navidad?|FLOR DE [P]AS[C]UA', '¿Qué carbonero vasco trae regalos en Nochebuena?|OLEN[T]Z[E]RO', '¿Qué vino espumoso se usa para brindar en España?|[C]A[V]A',
  ],
  navidad: [
    '¿Qué personaje vestido de rojo reparte regalos el 25 de diciembre?|PAPÁ [N]O[E]L', '¿Qué animales tiran del trineo de Papá Noel?|[R]E[N]OS', '¿Cómo se llama el reno de la nariz roja?|[R]O[D]OLFO',
    '¿Qué árbol se decora en Navidad?|A[B]E[T]O', '¿Qué tira brillante de colores adorna el árbol de Navidad?|E[S]P[U]MILLÓN', '¿Qué día de diciembre es Navidad?|VEIN[T]IC[I]NCO',
    '¿Cuántos son los Reyes Magos?|T[R]E[S]', '¿Qué Rey Mago lleva la barba blanca?|[M]EL[C]HOR', '¿Qué Rey Mago es el más joven y de piel oscura?|BAL[T]A[S]AR',
    '¿Qué dulce redondo con fruta escarchada se come el 6 de enero?|RO[S]CÓN', '¿Qué prenda se cuelga en la chimenea para recibir regalos?|[C]A[L]CETÍN', '¿Qué figura de nieve tiene nariz de zanahoria?|MU[Ñ]ECO DE NIE[V]E',
    '¿Qué sorteo se celebra en España el 22 de diciembre?|LO[T]E[R]ÍA', '¿Cómo se llama el primer premio de ese sorteo?|[G]OR[D]O', '¿Qué ave grande se asa al horno en muchas cenas navideñas?|PA[V]O',
    '¿Con qué se envuelven los regalos?|PA[P][E]L',
  ],
  carnaval: [
    '¿Qué nos ponemos en la cara para no ser reconocidos?|MÁS[C]A[R]A', '¿Qué ciudad andaluza es famosa por sus chirigotas?|CÁ[D]I[Z]', '¿Qué agrupaciones cantan coplas de humor en el Carnaval de Cádiz?|CHI[R]I[G]OTAS',
    '¿En qué ciudad brasileña desfilan las escuelas de samba?|RÍO DE JA[N]EI[R]O', '¿Qué baile brasileño protagoniza ese carnaval?|SA[M][B]A', '¿Qué ciudad italiana es famosa por sus máscaras y góndolas?|VE[N]E[C]IA',
    '¿Qué ceremonia con un pez pone fin al Carnaval?|EN[T]IE[R]RO DE LA SARDINA', '¿Qué miércoles marca el final del Carnaval?|MIÉRCOLES DE [C]E[N]IZA', '¿Qué papelitos de colores se lanzan en las fiestas?|CON[F]E[T]I',
    '¿Qué tiras de papel enrolladas se lanzan en las fiestas?|SER[P]EN[T]INAS', '¿En qué isla está Santa Cruz, con uno de los carnavales más famosos?|TENE[R]I[F]E', '¿Qué vehículos decorados desfilan en la cabalgata?|CA[R]RO[Z]AS',
    '¿Qué lleva un pirata en un ojo?|PA[R]C[H]E', '¿Qué periodo de cuarenta días empieza tras el Carnaval?|CUA[R]E[S]MA', '¿Qué personaje italiano viste un traje de rombos de colores?|AR[L]E[Q]UÍN',
  ],
  findeano: [
    '¿Cuántas uvas se comen en Nochevieja?|[D]O[C]E', '¿Desde qué plaza de Madrid se retransmiten las campanadas?|PUERTA DEL [S]O[L]', '¿Qué día de diciembre es Nochevieja?|[T]REI[N][T]A Y UNO',
    '¿Qué prenda roja dice la tradición que hay que estrenar?|RO[P]A I[N]TE[R]IOR', '¿Qué espectáculo de luces ilumina el cielo a medianoche?|FUE[G]OS ARTI[F]ICIALES', '¿Qué vino espumoso francés se usa para brindar?|C[H]AM[P]ÁN',
    '¿Con qué mes empieza el año?|E[N]E[R]O', '¿Qué hacemos al chocar las copas para celebrar?|BRI[N][D]IS', '¿Cómo se llaman las metas que nos marcamos para el año nuevo?|PRO[P]Ó[S]ITOS',
    '¿Qué suena doce veces a medianoche?|CAM[P]A[N]AS', '¿Cómo se llaman los toques que suenan antes de las campanadas?|CUAR[T]O[S]', '¿En qué ciudad baja una gran bola de luces en Times Square?|NUE[V]A [Y]ORK',
    '¿Qué se celebra el 1 de enero?|AÑO [N]U[E]VO', '¿Qué aparato marca la hora en la Puerta del Sol?|RE[L]O[J]',
  ],
  verano: [
    '¿Qué astro nos broncea en la playa?|[S]O[L]', '¿Qué crema protege la piel del sol?|[P]RO[T]ECTOR SOLAR', '¿Qué dulce frío se come en cucurucho?|[H]E[L]ADO',
    '¿Qué sopa fría andaluza de tomate se toma en verano?|GAZ[P]A[C]HO', '¿En qué mes empieza el verano?|JU[N]I[O]', '¿Qué insecto pica por las noches de verano?|MOS[Q]UI[T]O',
    '¿Qué prenda usamos para bañarnos?|BA[Ñ]A[D]OR', '¿Qué construimos con arena en la playa?|CAS[T]I[L]LO', '¿Qué objeto nos da sombra en la playa?|SOM[B]RI[L]LA',
    '¿Qué animal marino transparente puede picar en la playa?|[M]E[D]USA', '¿Qué deporte se practica sobre las olas con una tabla?|SUR[F]', '¿Qué bebida de vino con fruta es típica del verano?|SAN[G]R[Í]A',
    '¿Cómo se llama el descanso de verano de los estudiantes?|VA[C]A[C][I]ONES', '¿Qué fruta grande es verde por fuera y roja por dentro?|SAN[D]Í[A]', '¿Qué bebida se hace con limón, agua y azúcar?|LI[M]O[N]ADA',
    '¿Qué noche de junio se celebra con hogueras?|SAN [J]U[A]N',
  ],
};
const cache = new Map<string, Q[]>();
export function themeQuestions(t: ThemeId): Q[] {
  if (!cache.has(t)) cache.set(t, (RAW[t] || []).map((l, i) => parse(`${t}-${i}`, l)));
  return cache.get(t)!;
}
export const hasThemePool = (t: ThemeId) => (RAW[t] || []).length > 0;

/** Banco de preguntas de una partida (no repite, como la lista "Respondidas") */
export class Bank {
  used = new Set<string>();
  constructor(public theme: ThemeId, public onlyOriginal = false) { }
  private pick(pool: Q[]) { const free = pool.filter(q => !this.used.has(q.id)); if (!free.length) return null; const q = free[Math.floor(Math.random() * free.length)]; this.used.add(q.id); return q; }
  private sb3Range(a: number, b: number) { const r: Q[] = []; for (let i = a; i <= b; i++) r.push(sb3Question(i)); return r; }
  /** ronda: 1..8 ; en la ronda 5 el Scratch usa las "Palabra gallina" (81-90) */
  next(ronda: number | 'FINAL' | 'normal' | 'gallina'): Q {
    const themed = !this.onlyOriginal && hasThemePool(this.theme as ThemeId);
    if (ronda === 'gallina' || (ronda === 5 && !themed)) { const q = this.pick(this.sb3Range(81, 90)); if (q) return q; }
    if (themed) { const q = this.pick(themeQuestions(this.theme)); if (q) return q; if (this.theme === 'ninos') { this.used.forEach(id => id.startsWith('ninos') && this.used.delete(id)); const q2 = this.pick(themeQuestions('ninos')); if (q2) return q2; } }
    return this.pick(this.sb3Range(1, 80)) || (this.used.clear(), this.pick(this.sb3Range(1, 80))!);
  }
}
