// Chistes originales del Presentador (aptos para toda la familia)
import type { ThemeId } from './themes';
export type JokeCtx = 'intro' | 'caida' | 'entre' | 'final';
interface Joke { t: string; c: JokeCtx[]; th?: ThemeId[] }
const G: JokeCtx[] = ['intro', 'entre'];
export const CHISTES: Joke[] = [
  { t: '¿Sabéis por qué las trampillas nunca se ponen nerviosas? ¡Porque siempre tienen los pies en el suelo… hasta que dejan de tenerlos!', c: G },
  { t: '¡Ese ha caído más bajo que mis audiencias de los lunes!', c: ['caida'] },
  { t: 'Tranquilos, abajo hay colchones. Bueno… eso me dijo el de producción.', c: ['caida', 'intro'] },
  { t: 'Mi médico me dijo que tenía que bajar… ¡y yo he puesto trampillas en el plató!', c: G },
  { t: '¿Cuál es el deporte favorito de este programa? ¡La caída libre!', c: ['caida', 'entre'] },
  { t: 'Aquí todos dejan huella… ¡aunque sea la última!', c: ['caida', 'entre'] },
  { t: 'Pedí un aumento de sueldo y el director me contestó: «¡Ahora caigo!»… y se abrió la trampilla.', c: G },
  { t: '¿Qué le dijo una trampilla a otra? «Ábrete, que viene la pregunta difícil».', c: G },
  { t: 'En este programa no hay pregunta fácil… ni suelo seguro.', c: G },
  { t: 'Si la respuesta no sale, tranquilo: el suelo sí que sale… ¡hacia abajo!', c: ['entre', 'caida'] },
  { t: 'El otro día me tropecé en las escaleras del plató… y me pidieron repetirlo para la promo.', c: G },
  { t: 'Nuestros oponentes tienen mucha estabilidad emocional. La del suelo ya es otra cosa.', c: G },
  { t: 'Me encanta este trabajo: cada día conozco gente nueva… y cada día la veo caer.', c: ['caida'] },
  { t: '¿Por qué el reloj está tan serio? ¡Porque tiene los segundos contados!', c: G },
  { t: 'Las preguntas son como las trampillas: cuando menos te lo esperas, ¡se abren!', c: G },
  { t: 'Un consejo: pisa fuerte… pero tampoco tanto.', c: ['intro', 'entre'] },
  { t: 'Ese oponente no ha caído: ha bajado a por un café. Ahora vuelve. O no.', c: ['caida'] },
  { t: '¡Qué caída tan elegante! Yo le doy un nueve. El jurado del sótano le da un diez.', c: ['caida'] },
  { t: 'Abajo tenemos una sala de espera… muy, muy, muy profunda.', c: ['caida'] },
  { t: 'Dicen que lo importante es participar. Lo segundo más importante es no caerse.', c: G },
  { t: '¿Sabéis cómo se despiden los oponentes de este programa? «¡Nos vemos abajo!»', c: ['caida'] },
  { t: 'Ese ha bajado más rápido que el precio de las palomitas cuando termina la peli.', c: ['caida'] },
  { t: 'Las huellas de este plató están muy pisadas, pero nunca se quejan.', c: G },
  { t: 'La pregunta más difícil del programa no sale en pantalla: ¿quién barre el sótano?', c: G },
  { t: 'Lo bueno de caer aquí es que nunca te quedas a medias: ¡caes enterito!', c: ['caida'] },
  { t: '¿Por qué el plató es redondo? Para que nadie se quede en una esquina pensando la respuesta.', c: G },
  { t: 'Mi abuela juega desde casa y acierta más que yo. ¡Un beso, abuela!', c: G },
  { t: 'Aquí no hay tiempo muerto… solo tiempo cayendo.', c: ['caida', 'entre'] },
  { t: 'Esto es como la vida: unas veces estás arriba y otras… ¡en el piso de abajo!', c: ['caida', 'entre'] },
  { t: 'Uno menos. A este paso tendremos que contratar oponentes por docenas.', c: ['caida'] },
  { t: 'Juego final: diez preguntas, dos minutos y un presentador que no puede ni mirar.', c: ['final'] },
  { t: 'Si ganas, doblas tus puntos. Si pierdes… doblas la esquina del sótano.', c: ['final'] },
  { t: 'Respira hondo. Yo también, que estos nervios me despeinan el tupé.', c: ['final'] },
  { t: 'Tranquilidad: el suelo del juego final es igual que el de antes. Igual de traicionero.', c: ['final'] },
  // Prime Time
  { t: 'Esta noche es Prime Time: hasta las trampillas se han puesto pajarita.', c: G, th: ['primetime'] },
  { t: 'En las galas especiales las caídas son más elegantes: con música, luces y confeti.', c: ['caida'], th: ['primetime'] },
  { t: 'He ensayado tanto para esta gala que hasta el suelo me aplaude… antes de abrirse.', c: G, th: ['primetime'] },
  { t: 'Hay tantos focos esta noche que los oponentes caen con gafas de sol.', c: ['caida', 'entre'], th: ['primetime'] },
  // Halloween
  { t: '¿Qué le dijo un fantasma al oponente? «¡Buuu… bajada directa!»', c: ['caida', 'entre'], th: ['halloween'] },
  { t: 'Esta noche, quien cae por la trampilla aparece directamente en la fiesta de los zombis.', c: ['caida'], th: ['halloween'] },
  { t: 'Los esqueletos no se apuntan a este concurso: dicen que no tienen estómago para las caídas.', c: G, th: ['halloween'] },
  { t: 'Cuidado con las calabazas: algunas se saben más respuestas que tú.', c: G, th: ['halloween'] },
  // Navidad / Nochebuena
  { t: 'Papá Noel se apuntó al programa, pero se quedó atascado en la trampilla… como en las chimeneas.', c: G, th: ['navidad', 'nochebuena'] },
  { t: '¿Qué hace un turrón en la trampilla? ¡Partirse de risa!', c: ['caida', 'entre'], th: ['navidad', 'nochebuena'] },
  { t: 'Esta noche los oponentes no caen: bajan como los regalos por la chimenea.', c: ['caida'], th: ['navidad', 'nochebuena'] },
  { t: 'El que pierda friega los platos de la cena de Nochebuena. ¡Todos!', c: G, th: ['nochebuena'] },
  // Carnaval
  { t: 'En Carnaval nadie sabe quién es quién… ¡hasta que cae y se le ve la peluca!', c: ['caida'], th: ['carnaval'] },
  { t: 'Ese oponente iba disfrazado de ganador. El disfraz no ha funcionado.', c: ['caida'], th: ['carnaval'] },
  { t: '¡Qué disfraz tan conseguido! Se había disfrazado de trampilla abierta.', c: ['caida', 'entre'], th: ['carnaval'] },
  // Fin de Año
  { t: 'Doce campanadas, doce uvas… y una trampilla de propina.', c: G, th: ['findeano'] },
  { t: 'Mi propósito de año nuevo: no caerme del escenario. Llevo tres segundos cumpliéndolo.', c: G, th: ['findeano'] },
  // Verano
  { t: 'En verano las trampillas dan directamente a la piscina. Bueno… eso nos gustaría.', c: ['caida', 'entre'], th: ['verano'] },
  { t: 'Hace tanto calor que los oponentes no caen: ¡se derriten!', c: ['caida'], th: ['verano'] },
  { t: 'Ponte crema, que con estos focos te pones moreno en una sola pregunta.', c: G, th: ['verano'] },
  // Niños
  { t: '¿Qué le dijo un pie al otro pie? ¡Vamos a dejar huella!', c: G, th: ['ninos'] },
  { t: '¿Por qué el libro de matemáticas está triste? ¡Porque tiene muchos problemas!', c: G, th: ['ninos'] },
  { t: '¿Qué hace una abeja en el gimnasio? ¡Zum-ba!', c: G, th: ['ninos'] },
  { t: '¿Qué le dice una trampilla a un niño? ¡Tranquilo, que aquí abajo hay un tobogán!', c: ['caida', 'entre'], th: ['ninos'] },
  { t: '¿Sabéis por qué la huella izquierda siempre llega primero? ¡Porque la derecha va siempre detrás!', c: G, th: ['ninos'] },
  { t: '¿Cuál es el colmo de un concursante? Saberse todas las respuestas… ¡y que le pregunten su nombre!', c: G, th: ['ninos'] },
];
/** Elige un chiste no repetido en este programa (Niños: solo los del tema y los generales) */
export class Chistes {
  used = new Set<string>();
  constructor(public theme: ThemeId) { }
  next(ctx: JokeCtx): string | null {
    const ok = CHISTES.filter(j => j.c.includes(ctx) && !this.used.has(j.t) && (!j.th || j.th.includes(this.theme)));
    if (!ok.length) return null;
    // preferir los del tema especial
    const themed = ok.filter(j => j.th);
    const pool = themed.length && Math.random() < 0.6 ? themed : ok;
    const j = pool[Math.floor(Math.random() * pool.length)]; this.used.add(j.t); return j.t;
  }
}
