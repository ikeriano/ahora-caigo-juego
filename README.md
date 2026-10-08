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
- **Programas especiales**: Normal, Especial Prime Time, Halloween, Niños, Nochebuena, Navidad, Carnaval, Fin de Año, Verano, Especial 300 suscriptores.

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

## v1.2 — Cabecera nueva, duelos contra los oponentes, PASAR y música propia
- **Cabecera** de «Programa completo» recreada dentro del plató (el decorado se ve siempre): túnel azul con partículas y letras metálicas → destello → ¡AHORA CAIGO! sobre la trampilla central → vuelo de dron por el plató (techo de luces, picado, mesa, atriles, marcador de premios, latigazos, órbita, ras de suelo, subida, plano general) → bienvenida del Presentador.
- **Música de la cabecera (Opciones):** «Elegir audio de mi dispositivo» (input file `audio/*`), nombre del archivo, «Probar» y «Quitar». El audio se guarda **solo en el dispositivo** (IndexedDB, `src/customaudio.ts`): no se sube, no va en la web ni en la APK. Si hay audio propio suena en la cabecera (desde el principio, con los mismos movimientos de cámara y fundido al terminar) y en la despedida (con fundido). Si no, suena la música del minijuego (`Trilha` del .sb3). La APK abre el selector de archivos de Android (`WebChromeClient.onShowFileChooser`).
- **Duelos 1 contra 1** (`src/duelo.ts`): el oponente elegido también juega. Turnos alternos (empieza el oponente), un reloj de 30 s para cada uno (solo corre el del turno), marcador con los dos relojes y el turno solo durante el duelo. El bot piensa, escribe letra a letra, a veces se equivoca, pasa o se queda en blanco; su nivel depende del oponente y sube en cada duelo. Quien se queda sin tiempo cae por su trampilla.
- **PASAR** junto a las casillas (encima del teclado del móvil): en el duelo, con comodín la pregunta pasa al oponente; sin comodines sale otra pregunta y tu reloj sigue corriendo. En el Juego Final salta a la siguiente pregunta y los 2:00 siguen corriendo. También en Entrenamiento (nuevo «Duelo contra un oponente»).
- Marcador de premios de la moneda en el plató (valores del .sb3: 50.000, 25.000, 15.000, 5.000, 1.000, +1, ×2, ÷2, VIDA EXTRA, LO PIERDES TODO).
- **Logo propio en dos líneas** («AHORA» arriba, «CAIGO» abajo, un «¡» alto a la izquierda y un «!» alto a la derecha, letras plateadas con relieve sobre el círculo de las huellas) en menús, portada, pantallas del plató, final y en las letras 3D que se montan en la mesa central durante la cabecera. Cada programa especial tiene su variante (Halloween, Navidad, Carnaval, Prime Time dorado, Niños de colores, 300…). Sin logos de cadenas.
- **Hashtag por modo** arriba a la izquierda: #AhoraCaigo, #AhoraCaigoPrimeTime, #AhoraCaigoHalloween, #AhoraCaigoNiños, #AhoraCaigoNochebuena, #AhoraCaigoNavidad, #AhoraCaigoCarnaval, #AhoraCaigoFinDeAño, #AhoraCaigoVerano, #AhoraCaigo300 y #AhoraCaigoEntrena (Entrenamiento).
- **Nuevo programa «Especial 300 suscriptores»** dedicado al canal de YouTube «Ikeriano el campeón 2»: plató rojo y dorado, gráfico dorado «300», confeti, pancarta «Especial 300 suscriptores · Ikeriano el campeón 2», frases del Presentador (voz sintética genérica) dando las gracias a los suscriptores, chistes propios y mención en los créditos. Se juega igual que el Programa completo.
- No se incluye ninguna sintonía de televisión ni audio de vídeos.
