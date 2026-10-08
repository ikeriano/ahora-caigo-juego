// Voz del presentador:
//  - frases que existen como voz en el .sb3 -> se reproduce el clip original y solo se muestran subtítulos (CLIPS)
//  - frases nuevas -> voz sintética genérica en español pregenerada (public/voz, piper es_ES) o, si falta, speechSynthesis es-ES
import { audio, BASE } from './assets';

export function hashText(s: string) {
  let h = 0x811c9dc5; const t = s.normalize('NFC').trim();
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

class Voice {
  enabled = true; jokes = true;
  index: Record<string, number> = {};
  requested = new Set<string>();
  private utter: SpeechSynthesisUtterance | null = null;
  async load() { try { this.index = await (await fetch(`${BASE}voz/index.json`)).json(); } catch { this.index = {}; } }
  stop() { audio.stopTag('voz'); try { speechSynthesis?.cancel(); } catch { } this.utter = null; }
  /** Empieza a hablar; devuelve la duración aproximada en ms y una promesa de fin */
  speak(text: string): { ms: number; done: Promise<void> } {
    this.requested.add(text);
    if (!this.enabled) return { ms: 0, done: Promise.resolve() };
    this.stop();
    const h = hashText(text);
    const words = text.split(/\s+/).length;
    if (this.index[h] != null) {
      const ms = this.index[h] * 1000;
      const done = audio.playUrl(`${BASE}voz/${h}.mp3`, 1, 'voz').then(r => r.done);
      return { ms, done };
    }
    // reserva: voz del navegador
    const ms = 600 + words * 330;
    try {
      const ss = window.speechSynthesis; if (!ss) return { ms: 0, done: Promise.resolve() };
      const u = new SpeechSynthesisUtterance(text.replace(/[«»]/g, '')); u.lang = 'es-ES'; u.rate = 1.12; u.pitch = 0.95;
      const v = ss.getVoices().find(v => /^es(-|_)ES/i.test(v.lang) && /male|hombre|jorge|pablo|diego|alvaro/i.test(v.name)) || ss.getVoices().find(v => /^es(-|_)ES/i.test(v.lang));
      if (v) u.voice = v;
      const done = new Promise<void>(r => { u.onend = () => r(); u.onerror = () => r(); setTimeout(r, ms + 3000); });
      this.utter = u; ss.speak(u); return { ms, done };
    } catch { return { ms: 0, done: Promise.resolve() }; }
  }
}
export const voice = new Voice();

/** Voces originales del .sb3 (transcritas) con sus tiempos: [inicio, fin, texto] */
export type Cue = [number, number, string];
export const CLIPS: Record<string, Cue[]> = {
  'AhoraCaigo - Intro.mp3': [
    [7.7, 13.4, '¡Hola! Te doy la bienvenida al minijuego de la versión virtual de ¡Ahora Caigo!'],
    [13.4, 19.1, '¿Listo para acertar todas las preguntas y tirar a todos tus oponentes?'],
    [19.1, 23.8, 'Pues prepárate para jugar y recuerda: ¡no venirte abajo!']],
  'AhoraCaigo - ComeceDuelo.mp3': [[0, 2.0, '¡Que comience el duelo!']],
  'AhoraCaigo - Decisão.mp3': [
    [3.1, 9.5, '¡Enhorabuena! Has tirado a los 8 oponentes y es el momento de tomar una importante decisión.'],
    [9.5, 17.6, '¿Te plantas con la mitad de lo que has acumulado o te atreves con el juego final para intentar doblar lo que has conseguido hasta ahora?']],
  'AhoraCaigo - Fim.mp3': [[1.1, 6.9, 'Ha sido un placer jugar contigo. ¡Espero verte en la próxima partida de ¡Ahora Caigo!']],
  'AhoraCaigo - Moeda.mp3': [[0, 4.0, 'Escoge un lado de la moneda y veamos qué sumamos a tu marcador.']],
  'AhoraCaigo - Queda.mp3': [[0, 1.5, '¡Ahí te va, Vicente!']],
  'AhoraCaigo - Round1.mp3': [[0.2, 5.4, '¡Arrancamos! Quedan 8 oponentes para el juego final.'], [6.0, 8.4, 'Escoge tu primer oponente.']],
  'AhoraCaigo - Round2.mp3': [[0.2, 4.8, '¡A por la ronda 2! Quedan 7 oponentes para el juego final.']],
  'AhoraCaigo - Round3.mp3': [[0, 6.1, '¡Que sigamos por el buen camino en la ronda 3! Te quedan 6 oponentes para el juego final.']],
  'AhoraCaigo - Round4.mp3': [[0, 5.9, 'Llegamos al ecuador con la ronda 4. Nos quedan 5 oponentes para el juego final.']],
  'AhoraCaigo - Round5.mp3': [[0, 5.0, 'Nos vamos a la ronda 5. Quedan 4 oponentes para el juego final.']],
  'AhoraCaigo - Round6.mp3': [[0, 6.7, '¿Cómo van esos nervios? Arranca la sexta ronda cuando quedan 3 oponentes para el juego final.']],
  'AhoraCaigo - Round7.mp3': [[0, 6.3, 'Estamos llegando al final. Llega la ronda 7 y nos quedan dos oponentes para el juego final.']],
  'AhoraCaigo - Round8.mp3': [[0, 5.3, 'Llegaste al último duelo: te queda un oponente para el juego final.']],
};
