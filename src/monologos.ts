// Monólogo del presentador (v1.6): tras la cabecera del Programa, el presentador virtual (personaje inventado, voz sintética
// genérica piper; no imita a nadie) hace un número cómico corto: con el público, hablando por teléfono o «cambiando las normas».
// Humor blanco para todos los públicos. Texto en bocadillos + voz pregenerada. Se salta con un toque.
import * as THREE from 'three';
import type { Ctx } from './show';
import { gesture } from './people';
import { publico } from './publico';
import { skippable } from './intro';
import { TOP, ROWS, TIER_A, RING_OUT, PLATO } from './set3d';
import type { Session } from './hud';
import { voice } from './voice';

export type TipoMono = 'publico' | 'telefono' | 'normas';
/** paso: [lo que dice, acciones separadas por espacios] — acciones: baja sube risas aplauso vitores baila tropieza gira encoge tel telFuera normasFuera  ·  norma = rótulo */
type Paso = [string, string?, string?];
export interface Monologo { id: string; tipo: TipoMono; titulo: string; tema?: string; pasos: Paso[] }

export const MONOLOGOS: Monologo[] = [
  // ---------------------------------------------------------------- (a) con el público
  { id: 'pub-saludo', tipo: 'publico', titulo: 'Bajando a saludar', pasos: [
    ['¡Un momento, un momento! Antes de empezar, voy a bajar a saludar a mi gente.', 'baja'],
    ['¡Hola, hola! ¿Qué tal estáis? Esto huele a palomitas y a nervios.', 'risas'],
    ['Usted, señora, la de la chaqueta: ¿viene mucho por aquí? ¡Pues ya podría traer merienda para todos!', 'risas'],
    ['Y usted, caballero, ¿ha venido a ver el programa o a echarse la siesta? Que le he visto cerrar un ojo en la cabecera.', 'risas'],
    ['Os enseño el baile oficial del programa: brazos arriba, un pasito a la izquierda… ¡y a no caerse!', 'baila aplauso'],
    ['Bueno, me vuelvo a mi sitio, que el realizador me hace señas como un guardia de tráfico.', 'sube'],
    ['¡Uy! Ese escalón no estaba ayer. ¡Estoy bien, estoy bien!', 'tropieza risas'],
    ['¡Un aplauso para vosotros, que sois el mejor público del mundo!', 'aplauso'],
  ] },
  { id: 'pub-encuesta', tipo: 'publico', titulo: 'La encuesta de la grada', pasos: [
    ['Hoy vamos a hacer una encuesta muy seria. Bajo a la grada, que aquí es donde se sabe todo.', 'baja'],
    ['Que levanten la mano los que alguna vez se han caído por una trampilla… ¿Nadie? ¡Mentirosos!', 'risas'],
    ['Ahora los que se han caído del sofá viendo el programa. ¡Ah, ahora sí! ¡Media grada!', 'risas'],
    ['Usted, joven: ¿cuál es la capital de Francia? ¿París? ¡Muy bien! Ya tiene más puntos que yo en el examen de conducir.', 'risas'],
    ['Me han dicho que si el público aplaude muy fuerte, el concursante acierta más. Vamos a probarlo.', 'vitores'],
    ['¡Así me gusta! Con este aplauso, hasta yo me sé las respuestas.', 'encoge'],
    ['Venga, vuelvo a mi sitio antes de que alguien me pregunte algo difícil.', 'sube aplauso'],
  ] },
  { id: 'pub-cumple', tipo: 'publico', titulo: 'El cumpleaños', pasos: [
    ['Me han chivado que hoy hay alguien de cumpleaños en el público. ¡Voy para allá!', 'baja'],
    ['¿Dónde está? ¿Usted? ¿Usted también? ¿Cumplen todos hoy? ¡Esto parece una tarta gigante!', 'risas'],
    ['Pues cantamos para todos a la vez. Pero bajito, que el reloj del duelo se pone nervioso.', 'encoge'],
    ['¡Cumpleaños feliz… ahora caigo y no me levanto…! ¡No, no, esa letra no era!', 'baila risas'],
    ['Os traía una tarta, pero se me ha caído por la trampilla. Si alguien baja al sótano, que me guarde un trozo.', 'risas'],
    ['¡Un aplauso enorme para los cumpleañeros, los de hoy y los que dicen que son de hoy para salir en la tele!', 'aplauso'],
    ['Y ahora, ¡al lío, que el programa no se presenta solo!', 'sube'],
  ] },
  { id: 'pub-selfi', tipo: 'publico', titulo: 'El selfi', pasos: [
    ['Antes de empezar, me apetece hacerme un selfi con el público. Esperad, que bajo.', 'baja'],
    ['Juntaos un poco… ¡más! ¡Usted, el de atrás, que solo se le ve el flequillo!', 'risas'],
    ['Decid todos conmigo: ¡Ahora caigooo!', 'vitores'],
    ['Uy, ha salido movida. O se ha movido el plató, o he sido yo, que tiemblo de la emoción.', 'encoge risas'],
    ['Otra vez, y esta vez sonreíd como si hubierais ganado el bote.', 'aplauso'],
    ['¡Perfecta! Esta la cuelgo en la entrada de mi casa, al lado de la foto de mi abuela.', 'risas'],
    ['Gracias, de verdad. Sin vosotros, esto sería un plató vacío con un señor hablando solo.', 'sube aplauso'],
  ] },
  // ---------------------------------------------------------------- (b) al teléfono
  { id: 'tel-madre', tipo: 'telefono', titulo: 'Llama mi madre', pasos: [
    ['¡Perdonad, perdonad, me suena el móvil! Es mi madre, tengo que cogerlo.', 'tel'],
    ['¿Sí, mamá? Sí, estoy trabajando… En la tele, mamá… ¡Que sí, que me estás viendo ahora mismo!', 'risas'],
    ['No, mamá, esta chaqueta no es la de los domingos, me la ha elegido vestuario.', ''],
    ['¿Que si he comido? Sí, un bocadillo… De tortilla… No, no le he dado a nadie.', 'risas'],
    ['Dice mi madre que hola a todos y que os sentéis rectos.', 'risas'],
    ['Mamá, te dejo, que hay diez personas encima de trampillas esperándome. Sí, yo también te quiero. ¡Adiós!', 'telFuera'],
    ['Perdonad. Es que si no lo cojo, llama al realizador.', 'risas aplauso'],
  ] },
  { id: 'tel-pizza', tipo: 'telefono', titulo: 'Pizza para cien', pasos: [
    ['Un segundito, que tengo que hacer una llamada urgente.', 'tel'],
    ['¿Hola? ¿Pizzería? Quería pedir una pizza familiar… para unas… cien personas.', 'risas'],
    ['¿La dirección? Plató de ¡Ahora Caigo!, trampilla central. Si no abro, empuje fuerte.', ''],
    ['¿Ingredientes? Tomate, queso y una pizca de suspense.', 'risas'],
    ['¿Que tardan cuarenta minutos? Dígale al repartidor que tiene treinta segundos en el reloj… y si no llega, ¡ahora cae!', 'aplauso'],
    ['Perfecto, muchas gracias. ¡Pago con comodín!', 'telFuera risas'],
    ['Si veis a alguien con una caja enorme, dejadle pasar, que viene a cenar con nosotros.', 'encoge'],
  ] },
  { id: 'tel-tecnico', tipo: 'telefono', titulo: 'El servicio técnico', pasos: [
    ['Esperad, que llamo al servicio técnico, que una trampilla hace un ruido raro.', 'tel'],
    ['¿Servicio técnico? Le llamo por una trampilla. Sí… se abre… sola… cuando alguien falla.', 'risas'],
    ['¿Que eso es lo normal? ¿Cómo que es lo normal? ¡Si se cae la gente!', 'encoge risas'],
    ['Ah, que viene así de fábrica. Vale… ¿Y tiene botón de deshacer?', ''],
    ['¿Que pruebe a apagarla y encenderla? Eso lo intentó un concursante la semana pasada y todavía no ha vuelto.', 'risas'],
    ['Nada, le dejo, que vuelve a sonar la musiquilla de espera.', 'telFuera'],
    ['Conclusión: las trampillas funcionan perfectamente. Demasiado bien, diría yo.', 'aplauso'],
  ] },
  { id: 'tel-futuro', tipo: 'telefono', titulo: 'Llamada del futuro', pasos: [
    ['Perdón, me llama un número rarísimo: cero, cero, cero, cero, cero…', 'tel'],
    ['¿Diga? ¿Quién? ¿Un concursante que me llama desde el año tres mil?', 'risas'],
    ['¿Y cómo es el programa en el futuro? ¿Que las trampillas ahora son toboganes con piscina de bolas?', 'risas'],
    ['¿Y el presentador? ¿Sigo siendo yo? ¡Qué alegría! ¿Y sigo teniendo pelo?… ¿Hola? ¿Hola? Se ha cortado.', 'telFuera risas'],
    ['Bueno, al menos sé que en el año tres mil seguimos en antena.', 'aplauso'],
    ['Le he preguntado la respuesta del Juego Final, pero dice que eso es trampa. ¡Qué gente más honrada, la del futuro!', 'encoge'],
  ] },
  // ---------------------------------------------------------------- (c) cambiando las normas
  { id: 'nor-nuevas', tipo: 'normas', titulo: 'Normas nuevas', pasos: [
    ['Atención, que hoy estreno normas nuevas. Me las he inventado esta mañana en el desayuno.', 'encoge'],
    ['Norma número uno: prohibido estornudar durante los duelos. Si estornudáis, que sea en silencio.', 'risas', 'Prohibido estornudar durante los duelos'],
    ['Norma número dos: el reloj se para cada vez que yo cuento un chiste… Mmm, así no acabamos nunca.', 'risas', 'El reloj se para si el presentador cuenta un chiste'],
    ['Norma número tres: antes de responder, cada concursante tiene que bailar un poquito. Así.', 'baila risas', 'Antes de responder, hay que bailar'],
    ['¿Cómo? ¿Que dicen desde dirección que no puedo cambiar las normas?', 'encoge'],
    ['Vale, vale, quito las normas. Pero que conste que la del baile era la mejor.', 'normasFuera aplauso'],
  ] },
  { id: 'nor-croquetas', tipo: 'normas', titulo: 'La votación de las croquetas', pasos: [
    ['Hoy propongo cambiar una norma y que vote el público. Democracia pura.', ''],
    ['Propuesta: un comodín extra para todo concursante que traiga croquetas al plató.', '', 'Propuesta: un comodín extra si traes croquetas'],
    ['¿Quién vota a favor? ¡Uy, cuántas manos! ¿Y en contra?… Solo el realizador, que es más de tortilla.', 'risas vitores'],
    ['¡Aprobado por mayoría absoluta!', 'baila', 'APROBADA: las croquetas cuentan como comodín'],
    ['Ahora me dicen que las croquetas tienen que ser caseras… y que me las tengo que comer yo para comprobarlo. Qué sacrificio.', 'risas'],
    ['Bueno, se suspende la norma hasta que llegue la merienda. Seguimos con las de siempre.', 'normasFuera aplauso'],
  ] },
  { id: 'nor-reves', tipo: 'normas', titulo: 'Todo al revés', pasos: [
    ['Llevo toda la semana pensándolo: ¿y si hoy jugamos al revés?', ''],
    ['Nueva norma: gana el que más falle. ¡Por fin un concurso a mi medida!', 'risas', 'Gana el que más falle'],
    ['Y las trampillas se abren hacia arriba: en vez de caer, ¡saldréis volando!', 'risas', 'Las trampillas se abren hacia arriba'],
    ['Y el presentador da una vuelta entera antes de cada pregunta. Así.', 'gira', 'El presentador gira antes de preguntar'],
    ['¿Qué? ¿Que así no se entiende nada? Ya, ya me lo imaginaba.', 'tropieza risas'],
    ['Todo vuelve a su sitio: el que acierta sigue, y el que no… ¡ahora cae!', 'normasFuera aplauso'],
  ] },
  { id: 'nor-publico', tipo: 'normas', titulo: 'Normas para el público', pasos: [
    ['Normas especiales para el público. Atentos, que entran en el examen.', ''],
    ['Primera: aplaudir cada vez que yo diga «aplauso». ¡Aplauso!', 'aplauso', 'Aplaudir cuando el presentador diga «aplauso»'],
    ['Segunda: reírse de mis chistes. Sobre todo de los malos, que son los que más lo necesitan.', 'risas', 'Reírse de los chistes, aunque sean malos'],
    ['Tercera: nada de chivar respuestas. Ni con señas, ni con la mirada, ni con palomas mensajeras.', 'risas', 'Prohibido chivar respuestas (ni con palomas)'],
    ['Muy bien, lo estáis cumpliendo todo. Os habéis ganado mi admiración, que es gratis.', 'encoge'],
    ['Normas retiradas. A partir de ahora, solo una: ¡pasarlo bien!', 'normasFuera vitores'],
  ] },
  // ---------------------------------------------------------------- especiales (uno por tema)
  { id: 'esp-halloween', tipo: 'normas', titulo: 'Normas de Halloween', tema: 'halloween', pasos: [
    ['Como hoy es Halloween, hay normas terroríficas.', 'encoge'],
    ['Norma uno: si un fantasma os chiva una respuesta, no vale. Los fantasmas no tienen carné de concursante.', 'risas', 'Los fantasmas no pueden chivar respuestas'],
    ['Norma dos: prohibido asustar al presentador. Que luego no duermo.', 'tropieza risas', 'Prohibido asustar al presentador'],
    ['¿Que el único que da miedo aquí es mi traje? Vale, retiro las normas y me voy a cambiar… mañana.', 'normasFuera aplauso'],
  ] },
  { id: 'esp-navidad', tipo: 'telefono', titulo: 'Llamada al Polo Norte', tema: 'navidad', pasos: [
    ['Perdonad, que me llaman desde el Polo Norte.', 'tel'],
    ['¿Sí? ¿Que se ha perdido un reno y lo han visto entrar en el plató? Aquí no hay renos… solo concursantes muy abrigados.', 'risas'],
    ['¿Que si he sido bueno este año? Muy bueno: no he tirado a nadie por la trampilla… sin motivo.', 'risas'],
    ['¡Feliz Navidad! Os mandan recuerdos y dicen que no os comáis todo el turrón antes del Juego Final.', 'telFuera vitores'],
  ] },
  { id: 'esp-verano', tipo: 'publico', titulo: 'Verano en la grada', tema: 'verano', pasos: [
    ['¡Qué calor hace hoy! Bajo a la grada a ver si allí corre el aire.', 'baja'],
    ['¿Quién se ha traído la toalla? ¡Usted! ¡Y la sombrilla! Esto ya no es un plató, es la playa.', 'risas'],
    ['Si alguien se cae por una trampilla, que no se preocupe: hoy abajo hay piscina. Es broma, es broma.', 'risas'],
    ['¡Venga, un aplauso fresquito y empezamos!', 'sube aplauso'],
  ] },
  { id: 'esp-carnaval', tipo: 'publico', titulo: 'Disfraces de carnaval', tema: 'carnaval', pasos: [
    ['¡Es carnaval! Voy a bajar a ver los disfraces del público.', 'baja'],
    ['Usted va de pirata, usted de astronauta… y usted, ¿de qué va? ¿De usted mismo? ¡Muy logrado!', 'risas'],
    ['Yo voy disfrazado de presentador. Me ha costado mucho, ¿eh?', 'gira risas'],
    ['¡Un aplauso para los mejores disfraces de la tele!', 'sube vitores'],
  ] },
];

export const lineasMonologos = () => MONOLOGOS.flatMap(m => m.pasos.map(p => p[0]));
export const monoOpts = { on: true };
const LAST = 'ac3d_mono_last';

/** elige un monólogo al azar sin repetir el de la última partida; en un tema, a veces el suyo */
export function elegirMonologo(tema = 'normal'): Monologo {
  let last = ''; try { last = localStorage.getItem(LAST) || ''; } catch { }
  const propio = MONOLOGOS.filter(m => m.tema === tema && m.id !== last);
  if (propio.length && Math.random() < 0.6) return propio[0];
  const pool = MONOLOGOS.filter(m => !m.tema && m.id !== last);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ---------------------------------------------------------------- puesta en escena
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
let phone: THREE.Object3D | null = null;
function telefono(c: Ctx, on: boolean) {
  const h = c.eng.host;
  if (!phone || phone.parent !== h.armL) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.15, 0.012), new THREE.MeshStandardMaterial({ color: 0x15161c, roughness: 0.35, metalness: 0.4 }));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.064, 0.13), new THREE.MeshBasicMaterial({ color: 0x5ad1ff }));
    scr.position.z = 0.007; g.add(body, scr); g.position.set(0.02, -0.7, 0.07); g.rotation.set(0.2, 0, 0);
    phone = g; h.armL.add(g);
  }
  phone.visible = on;
}
function normasUi() {
  let el = document.getElementById('normas');
  if (!el) { el = document.createElement('div'); el.id = 'normas'; el.innerHTML = '<h3>📜 NORMAS NUEVAS</h3><ol></ol>'; (document.getElementById('hud') || document.body).appendChild(el); }
  return el;
}
function norma(t: string) { const el = normasUi(); el.classList.add('on'); const li = document.createElement('li'); li.textContent = t; el.querySelector('ol')!.appendChild(li); requestAnimationFrame(() => li.classList.add('in')); }
async function normasFuera(s: Session) {
  const el = document.getElementById('normas'); if (!el) return;
  el.querySelectorAll('li').forEach(li => li.classList.add('tachada')); await s.w(900); el.classList.add('fuera'); await s.w(500); el.remove();
}
/** punto junto a la primera fila de la grada (lado del presentador) */
function puntoGrada(lado: number): THREE.Vector3[] {
  const a = TIER_A[0] - (PLATO === 'virtual' ? 0.1 : 0.06), r = ROWS[0].r - (PLATO === 'virtual' ? 0.4 : 0.9);
  const front = V(0, 0, RING_OUT + (PLATO === 'virtual' ? 0.6 : 0.5));
  return [V(0, TOP, 2.6), front, V(lado * Math.sin(a) * r, 0, Math.cos(a) * r)];
}

export async function monologo(c: Ctx, m: Monologo, main: Session) {
  const { eng, hud } = c; const host = eng.host;
  const home = host.root.position.clone(), homeRot = host.root.rotation.y;
  const lado = home.x >= 0 ? 1 : -1;
  (window as any).__mono = { id: m.id, tipo: m.tipo, paso: -1, fin: false, normas: 0, tel: false, baja: false };
  try { localStorage.setItem(LAST, m.id); } catch { }
  let follow: ReturnType<typeof setInterval> | null = null;
  const camHost = (dist = 3.2, h = 1.65, side = 0.9) => {
    const p = host.root.position; const toward = V(-p.x, 0, 8 - p.z).normalize();
    const pos = p.clone().addScaledVector(toward, dist).add(V(toward.z * side, 0, -toward.x * side)).setY(p.y + h);
    eng.cut(pos, p.clone().setY(p.y + 1.35));
  };
  const seguir = (on: boolean) => {
    if (follow) { clearInterval(follow); follow = null; }
    if (on) follow = setInterval(() => { const p = host.root.position; eng.glide(p.clone().add(V(lado * 1.6, 1.8, 3.6)), p.clone().setY(p.y + 1.2), 0.45); }, 300);
  };
  const mirarPublico = () => { const p = host.root.position; eng.face(host, V(lado * 12, 0, p.z + 2)); };
  const cleanup = () => {
    seguir(false); telefono(c, false); document.getElementById('normas')?.remove();
    eng.movers = eng.movers.filter(x => x.p !== host); host.root.position.copy(home); host.root.rotation.y = homeRot; host.gesture = 0;
    document.removeEventListener('pointerdown', tap, true); voice.stop(); hud.hideBubble();
    (window as any).__mono.fin = true;
  };
  // un toque en el plató (fuera del bocadillo) salta el monólogo entero; tocar el bocadillo pasa a la siguiente frase
  const tap = (e: PointerEvent) => { const t = e.target as HTMLElement; if (t.closest('button, #bubble, #topbar, #menu, .ui')) return; (document.getElementById('btnSkip') as HTMLElement | null)?.click(); };
  document.addEventListener('pointerdown', tap, true);
  try {
    await skippable(main, hud, async (s) => {
      eng.lookEvent('normal'); camHost(); eng.face(host, V(0, 0, 9));
      for (let i = 0; i < m.pasos.length; i++) {
        const [t, acc = '', rot] = m.pasos[i]; const a = acc.split(/\s+/).filter(Boolean);
        (window as any).__mono.paso = i;
        if (a.includes('baja')) {
          (window as any).__mono.baja = true; gesture(host, 'saluda', 1.4); seguir(true);
          for (const p of puntoGrada(lado)) { await s.race(eng.walkTo(host, p, 2.2)); }
          seguir(false); mirarPublico(); publico.vitores(2.5, 0.7);
          { const p = host.root.position; const inn = V(-p.x, 0, -p.z).normalize(); eng.glide(p.clone().addScaledVector(inn, 3.4).add(V(-lado * 1.2, 1.5, 0)), p.clone().add(V(lado * 1.2, 1.2, 0)), 1.2); }
        }
        if (a.includes('tel')) { telefono(c, true); (window as any).__mono.tel = true; gesture(host, 'telefono', 60); camHost(2.6, 1.6, -0.7); }
        if (rot) { norma(rot); (window as any).__mono.normas++; const hp = host.root.position; eng.glide(V(hp.x * 0.3, hp.y + 1.7, hp.z + 3.6), hp.clone().setY(hp.y + 1.1), 0.8); }
        for (const g of ['baila', 'tropieza', 'gira', 'encoge']) if (a.includes(g)) gesture(host, g, g === 'baila' ? 3.2 : g === 'gira' ? 1.6 : g === 'tropieza' ? 1.3 : 2);
        if (!a.some(x => ['baila', 'tropieza', 'gira', 'encoge', 'tel'].includes(x)) && host.gestureType !== 'telefono') gesture(host, 'habla', 2.4);
        let done = false; hud.say(t, 2600).then(() => { done = true; });
        if (a.includes('risas')) setTimeout(() => publico.risas(), 1400);
        await s.until(() => done);
        if (a.includes('risas')) { publico.risas(); eng.opps.forEach(o => { if (Math.random() < 0.4) gesture(o, 'aplaude', 1.2); }); }
        if (a.includes('aplauso')) publico.aplauso(2.4, 0.7);
        if (a.includes('vitores')) publico.vitores(2.8, 0.85);
        if (a.includes('telFuera')) { gesture(host, 'habla', 0.4); await s.w(300); telefono(c, false); (window as any).__mono.tel = false; camHost(); }
        if (a.includes('normasFuera')) await normasFuera(s);
        if (a.includes('sube')) {
          seguir(true); const pts = puntoGrada(lado).reverse().slice(1); pts.push(home);
          for (const p of pts) await s.race(eng.walkTo(host, p, 2.4));
          seguir(false); eng.face(host, V(0, 0, 9)); camHost();
        }
        await s.w(a.length ? 650 : 250);
      }
    });
  } finally { cleanup(); }
}
