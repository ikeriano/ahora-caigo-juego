import { cons, RIVALES } from './concursantes';
export const VERSION = '1.3';
// ======= Rótulos y créditos (editar aquí) =======
export const CREDITOS = {
  hashtag: '#AhoraCaigo',
  /** Rótulos de la cabecera (se añade "Modo: <tema>") */
  cabecera: [
    'Presentador: el Presentador virtual',
    'Juego creado por Iker',
    'Basado en el minijuego de Scratch',
    'Formato original: ¡Ahora Caigo! (Antena 3)',
  ],
  /** Columna de créditos del final */
  final: [
    ['Presentador', ['El Presentador virtual']],
    ['Juego creado por', ['Iker']],
    ['Basado en', ['El minijuego de Scratch', '«¡Ahora Caigo!»']],
    ['Música y sonidos', ['Del minijuego de Scratch original']],
    ['Voces sintéticas genéricas (Piper TTS)', ['Presentador: davefx (CC0)', 'Oponentes: sharvard (CC BY 3.0, Univ. de Edimburgo),', 'carlfm (dominio público), ald (Unlicense),', 'daniela (CC BY-SA 4.0, corpus OpenSLR 61)']],
    ['Público de las gradas', ['Maniquíes virtuales', 'Aplausos, vítores y «oooh»', 'sintetizados por el juego (sin grabaciones)']],
    ['Formato original', ['¡Ahora Caigo! (Antena 3)']],
    ['Agradecimientos', ['A todos los concursantes', 'y a ti por jugar']],
  ] as [string, string[]][],
  produccion: 'Una producción de Iker',
};

/** Créditos finales con los concursantes de Opciones › Concursantes */
export function creditosFinal(): [string, string[]][] {
  const out = [...CREDITOS.final];
  const c: [string, string[]][] = [];
  if (cons.central) c.push(['Concursante central', [cons.central + (cons.profesion ? ' · ' + cons.profesion : '')]]);
  c.push(['Oponentes', RIVALES.map((r, i) => `${i + 1}. ${cons.rival(i + 1)} · ${r.job}`)]);
  out.splice(1, 0, ...c);
  return out;
}
