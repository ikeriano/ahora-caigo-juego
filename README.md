# ¡Ahora Caigo! — El juego 3D

Remake 3D (Three.js) del minijuego de Scratch «¡Ahora Caigo!» de Iker: plató circular en 3D por el que se puede caminar,
programa completo con presentador virtual, entrenamiento, el juego clásico de Scratch y programas especiales temáticos.

**Jugar online:** https://ikeriano.github.io/ahora-caigo-juego/  ·  **APK Android:** https://ikeriano.github.io/ahora-caigo-juego/descargas/AhoraCaigo3D.apk

## Modos
- **Programa completo**: cabecera → el Presentador da la bienvenida → caminas hasta la trampilla central → 8 duelos
  (elige huella, pregunta con 30 s, PASA con comodines, el que falla cae por su trampilla) → moneda → marcador →
  decisión (plantarse o Juego Final: 10 preguntas en 2 min, dobla el marcador) → despedida con créditos.
- **Entrenamiento**: pruebas con/sin reloj, palabra gallina, duelo contra un oponente, Entre tres, Adivina, ¡Dame letra!, ¿Sí o no?, elección del central, juego final y elección de huellas + moneda, sin caídas.
- **La historia de ¡Ahora Caigo!**: el Presentador cuenta la historia del concurso en 10 capítulos cortos con planos del plató, rótulos y gráficos.
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

## v1.3 — Público, concursantes con nombre, la historia del programa y pruebas nuevas en los duelos
- **Público en el plató** (`src/audience.ts`, `src/publico.ts`, `src/crowd.ts`): gradas con espectadores 3D (InstancedMesh, ropa y peinados variados) iluminados por los focos del plató, que se ven en la cabecera y en los planos de dron. Reaccionan: aplausos al ritmo de la cabecera, «oooh» en las caídas, ovación, risas y vítores. Sonidos sintetizados en el propio juego (Web Audio, sin grabaciones). Público temático (Halloween, Navidad, Carnaval…) y carteles «300» en el Especial 300. Opciones › **Público**: Sí/No, volumen y gradas 3D Sí/No.
- **Concursantes** (Opciones › Concursantes, `src/concursantes.ts`): nombre del concursante central y su profesión, y nombres de los 10 oponentes (cada uno con un oficio inventado y simpático). Se guardan en el dispositivo y salen en los rótulos de las trampillas, el marcador del duelo, los bocadillos y los créditos.
- **Presentaciones** (`src/presentaciones.ts`, se pueden saltar): tras elegir huella, el Presentador saluda al oponente por su nombre, le pregunta por su oficio y hay un chascarrillo; a veces sale un guiño cariñoso a Karlos Arguiñano («rico, rico y con fundamento», el perejil…). El central se presenta tras la cabecera con su profesión. El público reacciona.
- **Voces**: solo voces sintéticas genéricas de Piper, pregeneradas (`tools/gen-voice.mjs`, sin clonación de voz). Presentador: es_ES davefx (CC0). Oponentes: es_ES sharvard (CC BY 3.0, Universidad de Edimburgo), es_ES carlfm (dominio público), es_MX ald (Unlicense) y es_AR daniela (CC BY-SA 4.0, OpenSLR 61), con tonos distintos. Las frases con nombres personalizados salen en el bocadillo; la frase propia del central usa la síntesis de voz del sistema (speechSynthesis) si existe; en la APK suele no haber voces y entonces solo se ve el bocadillo.
- **La historia de ¡Ahora Caigo!** (`src/historia.ts`): 10 capítulos (origen, estreno, especiales, remodelaciones, pruebas, mecánica de 2021, el final, el formato por el mundo, audiencias con gráfico de barras y la vuelta según el anuncio del 31 de agosto de 2026). Siguiente/Anterior/Saltar y subtítulos. Narración resumida con nuestras propias palabras. Fuente: Wikipedia (CC BY-SA 4.0). Sin nombres de ganadores, sin fotos reales y sin logos de cadenas.
- **Pruebas en los duelos** (`src/pruebas.ts`, preguntas originales en `src/bancos.ts`): cada duelo del Programa usa una prueba, anunciada en la pantalla grande del plató con un rótulo naranja. Están mezcladas para que no sea casi todo Clásico, y cada prueba se puede jugar en Entrenamiento.
  - **Clásico** y **Palabra gallina** (como antes).
  - **Entre tres**: pantalla partida, pregunta y 3 respuestas, 5 segundos y turnos alternos. Quien falla cae, salvo que tenga comodín (65 preguntas).
  - **¡Adivina!**: categoría y pistas una a una. Pulsa «¡LO SÉ!» y escribe la respuesta; el oponente también pulsa (32 temas × 5 pistas).
  - **¡Dame letra!**: frase oculta (refranes, frases hechas, títulos) con su categoría. Por turnos, cada uno pide una letra con el teclado y tiene 10 s para escribir la frase completa (da igual tildes y mayúsculas). Quien la dice primero gana y el otro cae. Si el que pierde tiene comodín, lo gasta, y si el ganador no tenía ninguno, se lo roba (62 frases).
  - **¿Sí o no?**: una pregunta cada uno, 5 s y dos botones SÍ / NO, sin PASAR ni rebote. Si fallas con comodín, lo gastas, y el rival se lo queda si acierta su siguiente pregunta. Sin comodines, caes (144 preguntas).
  - **Elección del central** (opcional en Opciones › Concursantes): todos con tableta y la misma pregunta, con tiempos a los lados. Si gana un oponente, entras igualmente «por invitación del público» (42 preguntas).
  - Los oponentes empiezan sin comodines; en ¡Dame letra! y ¿Sí o no? pueden ganarlos robándolos.
  - Pendiente del vídeo de referencia: «¡Vaya lío!» (el marco ya está preparado).

## v1.4 — Nombre del presentador
- Opciones › Concursantes › **Nombre del presentador** (por defecto «El Presentador», con «↺ Restablecer»; se guarda en el dispositivo).
- El nombre sale en la cabecera de los bocadillos (en mayúsculas), los subtítulos de «La historia de ¡Ahora Caigo!», las presentaciones (el central y los oponentes saludan al presentador por su nombre en el bocadillo), el menú, los rótulos de la cabecera y los créditos («Presentado por: <nombre> (presentador virtual)»).
- La voz sigue siendo la sintética genérica pregenerada y nunca dice el nombre personalizado (tampoco con la voz del sistema). El aspecto 3D del presentador no cambia.

## v1.5 — El presentador lee las preguntas
- El presentador lee en voz alta todas las preguntas con la misma voz sintética genérica pregenerada (piper, sin clonación): Clásico (las del Scratch y las de los temas), Entre tres (pregunta + «¿A, B o C?»), Adivina (la categoría y cada pista al aparecer), ¿Sí o no?, Elección del central, Juego Final y Entrenamiento. En ¡Dame letra! solo lee la categoría, nunca la frase oculta; en «Palabra gallina» dice una frase genérica (no lee letras de canciones).
- Como en el programa, el reloj del concursante (o del oponente) arranca cuando termina la lectura; se puede escribir o elegir mientras lee y, si aciertas, la lectura se corta. En el Juego Final lee más deprisa y el reloj de 2:00 sigue corriendo. Pulsar PASAR arranca tu reloj aunque esté leyendo, y sin comodín sigue corriendo durante la lectura de la siguiente pregunta; la pregunta pasada con comodín no se vuelve a leer.
- Opciones: **El presentador lee las preguntas** Sí/No (por defecto Sí) y **Velocidad de lectura** Normal/Rápida. Respeta el volumen y el Sí/No de la voz del presentador. Mientras lee aparece el indicador «🎙 El presentador lee…».
- Los textos se normalizan para la voz (números, años, siglos y reyes en números romanos, ordinales, %, €, unidades, siglas y nombres extranjeros) y se comprobaron con reconocimiento de voz.
- 622 lecturas en `public/voz/q/` (mp3 mono a 32 kbps, ~6,8 MB): en la web se descargan bajo demanda (no las precarga el service worker) y quedan en caché; en el APK van incluidas.
- Generar: `npm run build`, servidor en :4180 y `node tools/gen-voice.mjs` (o `SOLO_Q=1 node tools/gen-voice.mjs` para regenerar solo las preguntas). Pruebas: `node test/v13.mjs lectura` (capturas en `previews/lectura/`).

## v1.6 — Plató virtual
- Opciones › **Plató**: «Clásico» (el de siempre, por defecto) o «Plató virtual». Se guarda en el dispositivo y vale para todos los modos (programa, entrenamiento, especiales, la historia, explorar y el Juego Final con su decorado dorado).
- Plató virtual (`src/plato-virtual.ts`): anillo de 10 trampillas negras con aro rojo-naranja, dos placas y poste con aro rojo, alrededor de una tarima central elevada (trampilla central amarilla) separada por un foso negro; escalera blanca frontal y escalones laterales y trasero; pasarela frontal negra; barandilla metálica; banda de luz LED facetada; gradas blancas escalonadas a los lados (el público se sienta en cuatro filas: dos en calidad baja, tres en media); pantalla vertical al fondo con el logo y marcadores tipo cápsula (0 y 30) sobre una escalera; pared del fondo con tubos blancos curvos; pantallas laterales grises; parrilla de techo con aros de focos de colores y hexágonos.
- Tres looks de luz: **Blanco**, **Morado** y **Morado + cian**. En «Auto» cambian solos (menú y cabecera en morado+cian, duelos en morado, Juego Final en morado+cian, despedida y entrenamiento en blanco); también se puede fijar uno en Opciones › Luces del plató.
- Las cámaras, el caminar (escaleras, escalones, barandillas) y las trampillas se adaptan al plató elegido; las tarjetas de prueba salen en la pantalla vertical.
- Pruebas: `node test/plato.mjs <base>` (vistas y looks en `previews/plato-privado/`) y `node test/plato-modos.mjs <base>` (Opciones, caminar, Juego Final, entrenamiento, historia y especiales). `PLATO=virtual node test/v13.mjs programa` juega un programa corto en el plató virtual.
