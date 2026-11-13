/* Futbolizado: opción de Opciones. "poco" = normal, "primera" = todo ambientado en el fútbol. */
(function (R) {
  var NOMBRES = {
    colores: ["Colores y Dorsales", "Una camiseta de color a pantalla completa y un dorsal del 1 al 4. Cambia al azar."],
    luces: ["Reflectores", "Los focos del estadio se encienden en azul. Tócalos lo más rápido que puedas."],
    reaccion: ["Pitazo", "Suena el pitazo en un momento al azar. Toca lo más rápido que puedas."],
    numeros: ["Dorsales en movimiento", "Dorsales que se mueven por la cancha. Tócalos en orden."],
    vasos: ["¿Dónde está el balón?", "Sigue el balón entre los conos y adivina dónde quedó."],
    personalizado: ["Pizarra a medida", "Arma tu propio entrenamiento: colores, dorsales, jugadas y más."],
    flechas: ["Jugadas sin choque", "Saca todas las jugadas de la pizarra sin que se crucen. De muy fácil a imposible."],
    botellas: ["Alineación secreta", "Adivina el orden de la alineación escondida en 10 intentos."]
  };
  var TXT = {
    "Pruebas": "Convocatoria", "Entrenamiento reactivo": "Pretemporada reactiva", "Más pruebas pronto": "Más fichajes pronto",
    "Comenzar": "¡Pitazo inicial!", "Repetir": "Revancha", "Reintentar": "Revancha", "Menú": "Vestuario", "Configurar": "Pizarra táctica",
    "Jugar de nuevo": "Jugar otro partido", "Otro tablero": "Otro partido", "Siguiente nivel": "Siguiente fecha", "Tablero nuevo": "Otro partido",
    "Historial": "Tabla de posiciones", "Historial activo": "Tabla activa", "Opciones": "Cuerpo técnico", "Jugador": "Alineación",
    "Nuevo récord": "¡Récord de la liga!", "¡Lo lograste!": "¡Golazo!", "¡Muy bien!": "¡Buen pase!", "¡Pro de las flechas!": "¡Crack del área!",
    "Sin gotas": "Tarjeta roja", "Salir": "Al camarín", "Reglas rápidas": "Reglas del partido", "Entendido": "¡A la cancha!", "Comprobar": "Cobrar"
  };
  function aplicarAtrib() { document.documentElement.setAttribute("data-fut", R.ajustes.futbol === "primera" ? "primera" : "poco"); }
  R.aplicarFutbol = aplicarAtrib;
  var ocupado = false;
  function pasar() {
    if (ocupado || R.ajustes.futbol !== "primera") return;
    ocupado = true;
    try {
      var cs = document.querySelectorAll("#app .carta:not(.vacia)");
      for (var i = 0; i < cs.length && i < R.juegos.length; i++) {
        var N = NOMBRES[R.juegos[i].id], b = cs[i].querySelector("b"), s = cs[i].querySelector("small");
        if (N && b && b.textContent !== N[0]) { b.textContent = N[0]; s.textContent = N[1]; }
      }
      document.querySelectorAll("#app button, #app h2, #app h3, #app .eyebrow, #app .carta.vacia span, #app .menu-tit p, #app .insignia, #app .pildora span").forEach(function (e) {
        if (e.children.length) { var t = e.querySelector(":scope > span:only-child"); if (!t) return; e = t; }
        var k = e.textContent.trim();
        if (TXT[k] && e.textContent !== TXT[k]) e.textContent = TXT[k];
      });
    } finally { ocupado = false; }
  }
  aplicarFutbol();
  function aplicarFutbol() { aplicarAtrib(); }
  window.addEventListener("DOMContentLoaded", function () {
    new MutationObserver(function () { pasar(); }).observe(document.body, { childList: true, subtree: true, characterData: true });
    pasar();
  });
})(window.Reacciona);
