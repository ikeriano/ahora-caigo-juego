// «¡VAYA LÍO!» (v1.6): en las casillas blancas sale una palabra que es un ANAGRAMA de la respuesta;
// la definición de abajo dice cuál es. Banco original (cada par se comprueba por código: tools/check-vayalio.mjs).
import type { Q } from './questions';
import { norm } from './questions';

/** [definición, letras de las casillas (anagrama), respuesta] */
export const VAYA_LIO: [string, string, string][] = [
  ['Construcciones laberínticas en las que puedes perderte y quedarte solo.', 'SOLEDAD', 'DÉDALOS'],
  ['Capital de Italia, la Ciudad Eterna.', 'AMOR', 'ROMA'],
  ['Asunto que investiga un detective.', 'COSA', 'CASO'],
  ['Pata de cerdo curada que se corta en lonchas finas.', 'MONJA', 'JAMÓN'],
  ['Persona obstinada que no da su brazo a torcer.', 'RECTO', 'TERCO'],
  ['Gran masa de agua dulce rodeada de tierra.', 'ALGO', 'LAGO'],
  ['Billete de lotería que se compra por Navidad.', 'MÉDICO', 'DÉCIMO'],
  ['Animal marino que forma arrecifes de colores.', 'CALOR', 'CORAL'],
  ['Prenda negra que visten jueces y abogados en los juicios.', 'GATO', 'TOGA'],
  ['Cuerpo redondo con el que se juega al billar.', 'LOBA', 'BOLA'],
  ['Tren que circula bajo tierra en las grandes ciudades.', 'TEMOR', 'METRO'],
  ['Atreverse a hacer algo.', 'ROSA', 'OSAR'],
  ['Que no vale nada, sin efecto.', 'LUNA', 'NULA'],
  ['Hoja delgada de metal o dibujo impreso en un libro.', 'ANIMAL', 'LÁMINA'],
  ['Conjunto de creencias de una persona o de un grupo.', 'CERDO', 'CREDO'],
  ['Tiene la corazonada de que algo va a ocurrir.', 'SERPIENTE', 'PRESIENTE'],
  ['Darse cuenta de algo.', 'RATÓN', 'NOTAR'],
  ['Conjunto de palabras con sentido completo.', 'FRESA', 'FRASE'],
  ['Hablar unas personas con otras.', 'CONSERVAR', 'CONVERSAR'],
  ['Que no tiene principio ni fin.', 'ENTERO', 'ETERNO'],
  ['Voz muy fuerte y levantada.', 'TRIGO', 'GRITO'],
  ['Que pesa mucho; también, persona que cansa.', 'ESPADA', 'PESADA'],
  ['Tener un precio determinado.', 'CASTOR', 'COSTAR'],
  ['Salir al mundo; empezar a vivir.', 'CARNE', 'NACER'],
  ['Pierna de un animal o de una mesa.', 'TAPA', 'PATA'],
  ['Zona de un país con características propias.', 'ORIGEN', 'REGIÓN'],
  ['Reacción del cuerpo al polen o al polvo.', 'ALEGRÍA', 'ALERGIA'],
  ['Momento en que una madre da a luz.', 'TRAPO', 'PARTO'],
  ['Asiento desde el que reina un rey.', 'TORNO', 'TRONO'],
  ['Pez marino de carne muy apreciada.', 'REMO', 'MERO'],
  ['Armas que lanzan flechas.', 'ROSCA', 'ARCOS'],
  ['Movimiento de cada pie al andar.', 'SOPA', 'PASO'],
  ['Parte del zapato que eleva el talón.', 'CANTO', 'TACÓN'],
  ['Conocer algo o tener noticia de ello.', 'BESAR', 'SABER'],
  ['Grupo de estudiantes que cantan y tocan con capa.', 'ATÚN', 'TUNA'],
  ['Granitos en la piel típicos de la adolescencia.', 'CENA', 'ACNÉ'],
  ['Hembra del mono; también, bonita y graciosa.', 'MANO', 'MONA'],
  ['Piedra muy dura y grande.', 'ARCO', 'ROCA'],
  ['Altura pequeña y redondeada del terreno.', 'MALO', 'LOMA'],
  ['Vehículo con alas que vuela por el cielo.', 'NOVIA', 'AVIÓN'],
  ['Cuerpo celeste, como una estrella o un planeta.', 'OSTRA', 'ASTRO'],
  ['Usa la cabeza para razonar.', 'ESPINA', 'PIENSA'],
  ['Parte del árbol que sale del tronco.', 'AMAR', 'RAMA'],
  ['Hombre que tiene hijos.', 'PARED', 'PADRE'],
  ['Poder entrar una cosa dentro de otra.', 'CEBRA', 'CABER'],
  ['Engaño para sacar dinero a alguien.', 'MITO', 'TIMO'],
  ['Conducto por el que la sangre vuelve al corazón.', 'NAVE', 'VENA'],
  ['Tierra natal a la que uno se siente ligado.', 'PIRATA', 'PATRIA'],
  ['Serie de petardos que estallan uno tras otro en las fiestas.', 'CARTA', 'TRACA'],
  ['Vestido típico de las mujeres de la India.', 'RISA', 'SARI'],
];

/** letras ordenadas sin tildes (la Ñ cuenta como letra propia) */
export const firma = (w: string) => w.toUpperCase().replace(/Ñ/g, '\u0001').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0001/g, 'Ñ').replace(/[^A-ZÑ]/g, '').split('').sort().join('');
/** ¿«a» es un anagrama exacto (y distinto) de «b»? */
export const esAnagrama = (a: string, b: string) => firma(a) === firma(b) && norm(a) !== norm(b);

const usados = new Set<number>();
export function vayaLioQ(): Q {
  if (usados.size >= VAYA_LIO.length) usados.clear();
  let i; do { i = Math.floor(Math.random() * VAYA_LIO.length); } while (usados.has(i)); usados.add(i);
  return vayaLioN(i);
}
export function vayaLioN(i: number): Q {
  const [text, tiles, ans] = VAYA_LIO[i]; const exact = norm(ans);
  return { id: 'vl-' + i, kind: 'txt', text, word: tiles, hidden: [...tiles].map(() => false), missing: exact.split(''), exact, answer: ans };
}
