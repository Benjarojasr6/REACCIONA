# Reacciona

Entrenamiento reactivo: un menú de pequeñas pruebas de reacción que se instala como app.

Pruebas incluidas:
- **Colores y Números**: color a pantalla completa con un número del 1 al 4. Colores editables.
- **Luces**: cuadrícula de círculos que se encienden en azul (#084E96), configurable. Modos: Contrarreloj, Meta en tiempo, Carrera, Infinito (1 o 3 vidas, dificultad creciente y luces rojas), Solo azules y Secuencia.
- **Reacción simple**: un círculo se enciende en un momento al azar; promedio en milisegundos.

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
