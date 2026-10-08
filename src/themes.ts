export type ThemeId = 'primetime' | 'normal' | 'halloween' | 'ninos' | 'nochebuena' | 'navidad' | 'carnaval' | 'findeano' | 'verano' | 'especial300';
export interface Theme {
  id: ThemeId; name: string; emoji: string;
  wallA: string; wallB: string;   // degradado de los paneles
  chevA: string; chevB: string;   // flechas
  glow: number;                    // color de los aros/luces
  accent: number;                  // segundo color de luz
  fog: number; bg: number;
  host: { suit: number; shirt: number; tie: number; bowtie?: boolean; hat?: 'bruja' | 'papanoel' | 'fiesta' | 'paja' | 'helice' | 'corona' | 'chistera'; glasses?: boolean; cape?: number };
  decor: string;
  saludo: string;
  hashtag?: string; banner?: string; despedida?: string;
  /** frases extra del Presentador tras el saludo (voz sintética genérica) */
  extra?: string[];
  /** mención en los créditos */
  credito?: [string, string[]];
  /** gala con confeti en cabecera, caídas y marcador */
  festivo?: boolean;
}
export const THEMES: Theme[] = [
  { id: 'normal', name: 'Normal', emoji: '⭐', wallA: '#0b2fa8', wallB: '#1b52e6', chevA: '#ffd23a', chevB: '#f39a12', glow: 0x39c8ff, accent: 0xffa020, fog: 0x030817, bg: 0x02040c,
    host: { suit: 0x1b2b5c, shirt: 0xffffff, tie: 0xf3a312 }, hashtag: '#AhoraCaigo', decor: 'none', saludo: '¡Muy buenas noches y bienvenidos a ¡Ahora Caigo!' },
  { id: 'primetime', name: 'Especial Prime Time', emoji: '🌟', wallA: '#06123f', wallB: '#123a9a', chevA: '#ffe7a0', chevB: '#d9a520', glow: 0x6fb8ff, accent: 0xffc93a, fog: 0x02050f, bg: 0x010309,
    host: { suit: 0x050505, shirt: 0xffffff, tie: 0x050505, bowtie: true }, decor: 'primetime', saludo: '¡Muy buenas noches! Bienvenidos a una gala muy especial: ¡el Especial Prime Time de ¡Ahora Caigo!',
    hashtag: '#AhoraCaigoPrimeTime', banner: 'ESPECIAL PRIME TIME', festivo: true },
  { id: 'halloween', name: 'Halloween', emoji: '🎃', wallA: '#2a0b45', wallB: '#5a1a8a', chevA: '#ff9a1a', chevB: '#e2520a', glow: 0xff7a18, accent: 0x9b3cff, fog: 0x0d0414, bg: 0x070209,
    host: { suit: 0x111111, shirt: 0x3b0a55, tie: 0xff7a18, hat: 'bruja', cape: 0x5a0a0a }, hashtag: '#AhoraCaigoHalloween', decor: 'halloween', saludo: '¡Buuu! ¡Bienvenidos al especial de Halloween de ¡Ahora Caigo!' },
  { id: 'ninos', name: 'Niños', emoji: '🧸', wallA: '#0f8fd1', wallB: '#26c2f0', chevA: '#ff5fb0', chevB: '#ffd23a', glow: 0x5fffb0, accent: 0xff5fb0, fog: 0x0a1630, bg: 0x081022,
    host: { suit: 0x1fa84a, shirt: 0xfff36a, tie: 0xff4fa0, hat: 'helice' }, hashtag: '#AhoraCaigoNiños', decor: 'ninos', saludo: '¡Hola, chicos y chicas! ¡Bienvenidos al especial infantil!' },
  { id: 'nochebuena', name: 'Nochebuena', emoji: '🕯️', wallA: '#08154a', wallB: '#13307e', chevA: '#ffe08a', chevB: '#d4a017', glow: 0xffd77a, accent: 0x7fb4ff, fog: 0x02030f, bg: 0x010208,
    host: { suit: 0x0d1638, shirt: 0xffffff, tie: 0xd4a017 }, hashtag: '#AhoraCaigoNochebuena', decor: 'nochebuena', saludo: '¡Feliz Nochebuena! Bienvenidos a esta noche tan especial.' },
  { id: 'navidad', name: 'Navidad', emoji: '🎄', wallA: '#8a0c12', wallB: '#c81a22', chevA: '#ffffff', chevB: '#2fbf4a', glow: 0x48ff7a, accent: 0xff3030, fog: 0x0c0306, bg: 0x060203,
    host: { suit: 0xb0101a, shirt: 0xffffff, tie: 0x1a8a30, hat: 'papanoel' }, hashtag: '#AhoraCaigoNavidad', decor: 'navidad', saludo: '¡Feliz Navidad! ¡Jo, jo, jo! Bienvenidos al especial navideño.' },
  { id: 'carnaval', name: 'Carnaval', emoji: '🎭', wallA: '#4b0f8a', wallB: '#8a1fd0', chevA: '#3dff8a', chevB: '#ffd23a', glow: 0xff4fd8, accent: 0x3dff8a, fog: 0x0c0418, bg: 0x07020e,
    host: { suit: 0x7a1fd0, shirt: 0xffd23a, tie: 0x3dff8a, hat: 'corona', glasses: true }, hashtag: '#AhoraCaigoCarnaval', decor: 'carnaval', saludo: '¡Que empiece el Carnaval! ¡Bienvenidos a la fiesta de ¡Ahora Caigo!' },
  { id: 'findeano', name: 'Fin de Año', emoji: '🥂', wallA: '#151515', wallB: '#3a3326', chevA: '#ffe28a', chevB: '#c9a227', glow: 0xffe08a, accent: 0xd0d8ff, fog: 0x050505, bg: 0x020202,
    host: { suit: 0x0a0a0a, shirt: 0xffffff, tie: 0x0a0a0a, hat: 'chistera' }, hashtag: '#AhoraCaigoFinDeAño', decor: 'findeano', saludo: '¡Últimas horas del año! Bienvenidos a la gran gala de Fin de Año.' },
  { id: 'verano', name: 'Verano', emoji: '🏖️', wallA: '#0aa6b8', wallB: '#33d6d0', chevA: '#ffb02e', chevB: '#ff6a3a', glow: 0xfff07a, accent: 0xff7a3a, fog: 0x0a2230, bg: 0x061620,
    host: { suit: 0xff7a3a, shirt: 0x2ad0c0, tie: 0xffe03a, hat: 'paja', glasses: true }, hashtag: '#AhoraCaigoVerano', decor: 'verano', saludo: '¡Qué calor! Bienvenidos al especial de verano de ¡Ahora Caigo!' },
  { id: 'especial300', name: 'Especial 300 suscriptores', emoji: '🏆', wallA: '#3a0610', wallB: '#8a0f1c', chevA: '#ffe08a', chevB: '#d4a017', glow: 0xffd23a, accent: 0xff3b4a, fog: 0x0a0204, bg: 0x050102,
    host: { suit: 0x141414, shirt: 0xffffff, tie: 0xd4a017, bowtie: true, hat: 'fiesta' }, decor: 'especial300', hashtag: '#AhoraCaigo300',
    banner: 'Especial 300 suscriptores · Ikeriano el campeón 2', festivo: true,
    saludo: '¡Muy buenas noches! Bienvenidos a una gala única: ¡el Especial 300 suscriptores del canal Ikeriano el campeón 2!',
    extra: ['¡Trescientos suscriptores! Muchísimas gracias a todos los que estáis al otro lado. Este programa va dedicado a vosotros.', 'Así que ya sabéis: ¡a jugar, a no venirse abajo… y a por los cuatrocientos!'],
    despedida: '¡Y hasta aquí el Especial 300 suscriptores! Mil gracias a todos los suscriptores de Ikeriano el campeón 2. ¡Sois los mejores! ¡Nos vemos en el próximo vídeo!',
    credito: ['Especial 300 suscriptores', ['Dedicado a los suscriptores', 'del canal de YouTube', '«Ikeriano el campeón 2»']] },
];
export const themeById = (id: string) => THEMES.find(t => t.id === id) || THEMES[0];
