/* Futbolizado: opción de Opciones. Solo cambia el diseño (colores y adornos), nunca los textos. */
(function (R) {
  R.aplicarFutbol = function () {
    document.documentElement.setAttribute("data-fut", R.ajustes.futbol === "primera" ? "primera" : "poco");
  };
  R.PIE_DEF = "Estado de Alerta! Este es el detalle...";
  R.textoPie = function () { var t = R.ajustes.pie; return (typeof t === "string" && t.trim()) ? t : R.PIE_DEF; };
  R.aplicarFutbol();
  window.addEventListener("DOMContentLoaded", function () {
    var a = document.querySelector("#splash .alerta");
    if (a && typeof R.ajustes.pie === "string" && R.ajustes.pie.trim()) a.textContent = R.ajustes.pie;
  });
  var FRASES = ["AMATEUR", "NO ERES FUTBOLIZADO", "ANALFABETO", "PACOS FRUSTRADOS", "INOPERANTES", "PAPERS PENDIENTES"], ultima = -1, tmr = null;
  /* Aviso de 3 segundos con el jugador (sin fondo) y una frase. */
  R.avisoFutbol = function (primera) {
    var frase = "ERES FUTBOLIZADO";
    if (!primera) {
      var i; do { i = Math.floor(Math.random() * FRASES.length); } while (i === ultima && FRASES.length > 1);
      ultima = i; frase = FRASES[i];
    }
    var viejo = document.getElementById("aviso-fut"); if (viejo) viejo.remove();
    clearTimeout(tmr);
    var d = document.createElement("div");
    d.id = "aviso-fut"; d.className = "aviso-fut";
    d.innerHTML = '<div class="af-in"><img src="jugador.png" alt=""><p></p></div>';
    d.querySelector("p").textContent = frase;
    document.body.appendChild(d);
    function cerrar() { clearTimeout(tmr); d.classList.add("sale"); setTimeout(function () { d.remove(); }, 250); }
    d.addEventListener("click", cerrar);
    tmr = setTimeout(cerrar, 3000);
  };
})(window.Reacciona);
