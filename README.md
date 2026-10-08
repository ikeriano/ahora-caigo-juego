# ¡Ahora Caigo! — El juego 3D

Remake 3D (Three.js) del minijuego de Scratch «¡Ahora Caigo!» de Iker: plató circular en 3D por el que se puede caminar,
programa completo con presentador virtual, entrenamiento, el juego clásico de Scratch y programas especiales temáticos.

**Jugar online:** https://ikeriano.github.io/ahora-caigo-juego/  ·  **APK Android:** https://ikeriano.github.io/ahora-caigo-juego/descargas/AhoraCaigo3D.apk

## Modos
- **Programa completo**: cabecera → el Presentador da la bienvenida → caminas hasta la trampilla central → 8 duelos
  (elige huella, pregunta con 30 s, PASA con comodines, el que falla cae por su trampilla) → moneda → marcador →
  decisión (plantarse o Juego Final: 10 preguntas en 2 min, dobla el marcador) → despedida con créditos.
- **Entrenamiento**: pruebas con/sin reloj, palabra gallina, juego final y elección de huellas + moneda, sin caídas.
- **Clásico**: el minijuego original de Scratch empaquetado (public/clasico/index.html).
- **Explorar el plató**: paseo libre (joystick + arrastrar / WASD + ratón; 👁 primera/tercera persona).
- **Programas especiales**: Normal, Especial Prime Time, Halloween, Niños, Nochebuena, Navidad, Carnaval, Fin de Año, Verano.

## Desarrollo
```
npm install
npm run dev          # servidor de desarrollo
npm run build        # dist/ (web estática + service worker para jugar sin conexión)
tools/build-apk.sh   # APK firmada (necesita keystore/ y el SDK de Android en ~/android)
```
- Rótulos y créditos: `src/credits.ts` · Temas: `src/themes.ts` · Preguntas temáticas: `src/questions.ts`
- Recursos del .sb3 (disfraces y sonidos): `tools/extract.py` → `public/sb3/`

Juego de fans sin ánimo de lucro. «¡Ahora Caigo!» es un formato de televisión de sus respectivos dueños; este juego no está
afiliado a ninguna cadena. El presentador es un personaje virtual inventado.
