// Frases nuevas del Presentador (voz sintética genérica). Las voces originales del .sb3 están en voice.ts (CLIPS)
import { THEMES, Theme } from './themes';
import { CHISTES } from './jokes';
import { cons, LB, conNombre } from './concursantes';
const rnd = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
export const L = {
  sube: ['¡Concursante, sube a la trampilla central!', '¡Adelante! Ponte en el centro del plató, encima de la trampilla.'],
  equipo: '¡Aquí están nuestros diez oponentes! Tienes que tirar a ocho de ellos para llegar al final.',
  elige: ['¡Elige una huella! Detrás de cada huella hay un oponente.', 'Muy bien… ¿a quién retas ahora? ¡Elige huella!'],
  elegidoT: ['¡Has elegido al oponente número {n}!', '¡El {n}! Vamos a ver qué sabe…', 'Oponente {n}, ¡al duelo!'],
  ok: ['¡Correcto!', '¡Muy bien!', '¡Lo has clavado!'],
  pasa: ['¡Pasa! Turno de tu oponente…', 'Usas un comodín: ¡pasa la pregunta!'],
  tiempo: ['¡Se acabó el tiempo…!', '¡Oh, no! ¡Tiempo!'],
  turnoBot: ['Empieza contestando el oponente {n}. ¡Cada uno con su reloj!', 'Primero contesta el oponente {n}. ¡Atentos al reloj!'],
  turnoTu: ['¡Empiezas tú! Cada uno tiene su reloj.'],
  pasaSin: ['¡Pasas! Otra pregunta… ¡y tu reloj sigue corriendo!', 'Pasas sin comodín: ¡el reloj no se para!'],
  botTiempo: ['¡Al oponente {n} se le ha acabado el tiempo!', '¡Tiempo para el oponente {n}!'],
  trDuelo: 'Entrenamiento de duelo: tú contra un oponente, por turnos y cada uno con su reloj. ¡Sin caídas!',
  trDueloWin: '¡Has ganado el duelo! En el programa, tu oponente habría caído por la trampilla.',
  trDueloLose: 'Esta vez ha ganado el oponente. ¡Prueba otra vez!',
  cero: 'Has tirado a los ocho… pero tu marcador está a cero. ¡Qué mala suerte!',
  plantas: '¡Te plantas! Te llevas la mitad de tus puntos.',
  final: '¡Juego Final! Diez preguntas en dos minutos. Si lo consigues, ¡doblas tu marcador!',
  ganado: '¡¡Has ganado!! ¡Doblas tu marcador!',
  explBienvenida: '¡Bienvenido al plató! Date una vuelta. Puedes subir a la mesa central y a los atriles.',
  explReto: '¿Te atreves con un programa completo? ¡Pulsa el menú y elige «Programa completo»!',
  trFinal: 'Entrenamiento del Juego Final: diez preguntas en dos minutos. ¡Sin caídas!',
  trFinalOk: '¡Perfecto! Has completado el Juego Final.',
  trFinalT: 'Se acabó el tiempo: has acertado {n} de diez. ¡Sigue practicando!',
  trGallina: '¡Palabra gallina! Completa la letra de la canción.',
  trPruebas: 'Entrenamiento de pruebas: escribe las letras que faltan. ¡Sin caídas!',
  trHuellas: 'Practica la elección de huellas y la moneda. ¡Nadie cae!',
  trHuellaT: 'Has elegido la huella {n}.',
  trHuellasFin: '¡Mira cuántos puntos has conseguido en el entrenamiento!',
};
export const pick = (a: string[]) => rnd(a);
export const fill = (t: string, n: number) => t.replace('{n}', String(n));
/** Frase con el nombre del oponente en el bocadillo. Audio: la versión con el nombre por defecto (pregenerada) o la del número */
export function fraseNum(k: keyof typeof LB, n: number) {
  const i = Math.floor(Math.random() * LB[k].length); const nombre = cons.rival(n);
  const bubble = conNombre(LB[k][i], nombre, n), num = fill(L[k][i], n);
  return { bubble, audio: cons.esDef(n) ? [bubble, num] : [num] };
}
export function despedidaTexto(th: Theme) {
  return th.despedida || `Y hasta aquí el programa de hoy${th.id === 'normal' ? '' : ', el especial ' + th.name}. ¡Muchas gracias por jugar a ¡Ahora Caigo! Ha sido un placer, ¡sois los mejores! ¡Hasta la próxima!`;
}
/** Todas las frases que puede decir el presentador con voz sintética (para pregenerar el audio) */
export function allLines(): string[] {
  const out = new Set<string>();
  for (const v of Object.values(L)) {
    const arr = Array.isArray(v) ? v : [v];
    for (const t of arr) { if (t.includes('{n}')) for (let n = 0; n <= 10; n++) out.add(fill(t, n)); else out.add(t); }
  }
  for (const th of THEMES) { out.add(th.saludo); out.add(despedidaTexto(th)); (th.extra || []).forEach(x => out.add(x)); }
  for (const j of CHISTES) out.add(j.t);
  return [...out];
}
