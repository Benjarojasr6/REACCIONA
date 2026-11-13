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
})(window.Reacciona);
