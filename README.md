# Reacciona

Entrenamiento reactivo: un menú de pequeñas pruebas de reacción que se instala como app.

Pruebas incluidas:
- **Colores y Números**: color a pantalla completa con un número del 1 al 4. Colores editables.
- **Luces**: cuadrícula de círculos que se encienden en azul (#084E96), configurable. Modos: Contrarreloj, Meta en tiempo, Carrera, Infinito (1 o 3 vidas, dificultad creciente y luces rojas), Solo azules y Secuencia.
- **Reacción simple**: un círculo se enciende en un momento al azar; promedio en milisegundos.
- **Números en movimiento**: cuadritos numerados que se mueven; hay que tocarlos en orden (Contra el tiempo, Lo más rápido, Desaparecen y Memoria).
- **¿Dónde está la pelota?**: una pelota de fútbol queda bajo un vaso, los vasos se mezclan y hay que encontrarla (por niveles de 3, 9 o 12 vasos, o en racha con dificultad creciente).
- **Personalizado**: entrenamiento a la medida en 4 pasos (estímulos, transición, duración y resumen) con colores propios, flechas, números, letras, formas, palabras, cálculos, voz, combinaciones (color + estímulo, palabra y color, pelota en movimiento, ver y escuchar), parada (no-go), series con descanso y favoritos.
- **Flechas**: rompecabezas de flechas serpiente que hay que sacar del tablero sin que choquen. 8 dificultades (de «Muy fácil» 6×8 a «Imposible» 40×58), modos Libre, Niveles y Desafío del día, gotas, pistas, zoom y 3 temas. Los tableros siempre tienen solución.
- **Botellas**: dos modos: adivinar el orden (Mastermind) e intercambiar botellas en una estantería; estilo neón; futbolizado con escudos de Primera B 2026 (con los logos de los 16 equipos en `logos/`).
- **Gato**: tres en línea (3×3 a 8×8, línea de 3–5), vs IA (Fácil/Normal/Difícil/Imposible) o 2 personas, series, retirar y pistas.
- **Conecta 4**: tablero y línea configurables, vs IA (4 niveles) o 2 personas, tiempo por turno, series, retirar y pistas.
- **Corredor**: salta y barre esquivando obstáculos mientras recoges pelotas; velocidad creciente, 5 dificultades + personalizado, vidas y modo contrarreloj.
- **Futbolizado** (Opciones): «Poco futbolizado» o «Futbolizado de primera»; solo cambia el diseño, no los textos. También se puede editar el texto de la pantalla de inicio.
El botón muestra por 3 segundos al jugador con una frase (ERES FUTBOLIZADO, o una al azar al volver a «Poco futbolizado»).

Extras: sonido y vibración (se apagan en Opciones), historial por jugador con ranking y exportación a Excel.

## Historial
El botón **Historial** (arriba a la derecha del menú) queda apagado cada vez que se abre la app. Cuando está activo, antes de cada partida pide el nombre y guarda fecha y hora solas. En **Opciones** (⚙) están el ranking, la exportación a Excel (.xlsx) y el borrado. Los datos quedan solo en ese dispositivo.

## Publicar en GitHub Pages
1. Crea un repositorio nuevo en GitHub (público) y sube **el contenido** de esta carpeta (que `index.html` quede en la raíz del repositorio).
2. En el repositorio: Settings > Pages > Source: "Deploy from a branch" > rama `main` y carpeta `/ (root)` > Save.
3. En un minuto o dos aparece la dirección `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

## Instalar en la tablet (Chrome)
1. Abre esa dirección en Chrome.
2. Menú ⋮ > "Instalar aplicación" (o "Agregar a la pantalla de inicio").
3. Queda con el logo y el nombre "Reacciona", y funciona sin internet después de la primera carga.

## Actualizar
Cuando subas cambios, edita `VERSION` en `sw.js` (por ejemplo `reacciona-v5`). Los dispositivos con la app abierta o instalada lo detectan y muestran en el menú el aviso **"Hay una versión nueva · Actualizar"**. El número de versión se ve al final del menú.

## Agregar una prueba nueva
1. Crea `js/games/<nombre>.js` y llama a `Reacciona.registrar({ id, nombre, descripcion, preview(), iniciar(contenedor) })`. `iniciar` debe devolver una función que limpie timers y listeners. Usa `colores.js` como modelo.
2. Agrega el `<script>` en `index.html` (antes de `js/main.js`) y el archivo en la lista `ARCHIVOS` de `sw.js`.
3. Sube la versión en `sw.js`.
