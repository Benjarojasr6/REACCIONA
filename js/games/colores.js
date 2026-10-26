/* Juego: Colores y Números.
   Pantalla completa en un color, con un número del 1 al 4 al centro. Cambia al azar. */
(function (R) {
  var BASE = [
    { nom: "Rojo", hex: "#ec2314", on: true },
    { nom: "Verde", hex: "#14c23c", on: true },
    { nom: "Amarillo", hex: "#ffd500", on: true },
    { nom: "Azul", hex: "#1048ff", on: true },
    { nom: "Rosado", hex: "#ff5fa8", on: false },
    { nom: "Celeste", hex: "#3ec9ff", on: false },
    { nom: "Naranja", hex: "#ff8a00", on: false },
    { nom: "Morado", hex: "#8a3ffc", on: false },
    { nom: "Turquesa", hex: "#00c7a8", on: false },
    { nom: "Lima", hex: "#b7e600", on: false },
    { nom: "Blanco", hex: "#ffffff", on: false },
    { nom: "Negro", hex: "#111418", on: false }
  ];
  var NUMEROS = [1, 2, 3, 4];

  function copiaBase() { return BASE.map(function (c) { return { nom: c.nom, hex: c.hex, on: c.on }; }); }

  function colorTexto(hex) {
    var r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) < 110 ? "#f4f5f7" : "#111418";
  }

  R.registrar({
    id: "colores",
    nombre: "Colores y Números",
    descripcion: "Un color a pantalla completa y un número del 1 al 4. Cambia al azar.",
    preview: function () {
      return R.html(
        '<span class="pv-colores"><i style="background:#ec2314"></i><i style="background:#14c23c"></i>' +
        '<i style="background:#ffd500"></i><i style="background:#1048ff"></i></span>'
      );
    },

    iniciar: function (cont) {
      cont.innerHTML =
        '<section class="cn">' +
          '<div class="cn-escena">' +
            '<div class="cn-inicio">' +
              '<h2>Colores y Números</h2>' +
              '<p>Pantalla completa en un color, con un número del 1 al 4 al centro. Toca para pausar.</p>' +
              '<div class="cn-puntos" aria-hidden="true"><i style="background:#ec2314"></i><i style="background:#14c23c"></i><i style="background:#ffd500"></i><i style="background:#1048ff"></i></div>' +
              '<div class="cn-botones">' +
                '<button class="btn primario" type="button" data-a="empezar">Empezar</button>' +
                '<button class="btn" type="button" data-a="ajustes">Ajustes</button>' +
              '</div>' +
            '</div>' +
            '<div class="cn-circulo" hidden></div>' +
          '</div>' +
          '<button class="volver cn-volver" type="button" data-a="volver" aria-label="Volver al menú">←</button>' +
          '<button class="volver cn-gear" type="button" data-a="ajustes" aria-label="Ajustes" hidden>⚙</button>' +
          '<div class="cn-estado" hidden>Pausa</div>' +
          '<section class="cn-panel" hidden aria-label="Ajustes">' +
            '<label class="cn-campo" for="cn-int"><span>Cambio cada <b class="cn-int-v">2,5</b> s</span>' +
              '<input id="cn-int" type="range" min="1" max="6" step="0.5" value="2.5"></label>' +
            '<p class="cn-sub">Colores: toca para activar o desactivar, usa el selector para cambiarlos.</p>' +
            '<div class="cn-colores"></div>' +
            '<div class="cn-fila">' +
              '<button class="btn" type="button" data-a="agregar">Agregar color</button>' +
              '<button class="btn" type="button" data-a="restaurar">Restaurar colores</button>' +
            '</div>' +
            '<div class="cn-fila">' +
              '<button class="btn" type="button" data-a="pausa">Pausar</button>' +
              '<button class="btn" type="button" data-a="full">Pantalla completa</button>' +
              '<button class="btn primario" type="button" data-a="cerrar">Cerrar</button>' +
            '</div>' +
          '</section>' +
        '</section>';

      var raiz = cont.querySelector(".cn");
      var escena = raiz.querySelector(".cn-escena");
      var inicio = raiz.querySelector(".cn-inicio");
      var circulo = raiz.querySelector(".cn-circulo");
      var gear = raiz.querySelector(".cn-gear");
      var estado = raiz.querySelector(".cn-estado");
      var panel = raiz.querySelector(".cn-panel");
      var lista = raiz.querySelector(".cn-colores");
      var rango = raiz.querySelector("#cn-int");
      var rangoV = raiz.querySelector(".cn-int-v");
      var btnPausa = raiz.querySelector("[data-a=pausa]");

      var colores = R.leer("colores.paleta", null);
      if (!Array.isArray(colores) || !colores.length) colores = copiaBase();
      colores = colores.filter(function (c) { return c && /^#[0-9a-f]{6}$/i.test(c.hex); });
      if (!colores.length) colores = copiaBase();
      var intervalo = R.leer("colores.intervalo", 2.5);
      if (!(intervalo >= 1 && intervalo <= 6)) intervalo = 2.5;
      rango.value = intervalo; rangoV.textContent = R.num(intervalo, 1);
      R.pintarRango(rango);

      var timer = null, corriendo = false, pausado = false, ultimoColor = "", ultimoNum = -1;

      function guardar() { R.guardar("colores.paleta", colores); }
      function activos() { return colores.filter(function (c) { return c.on; }).length; }

      function otro(n, ultimo) {
        if (n < 2) return 0;
        var i; do { i = Math.floor(Math.random() * n); } while (i === ultimo);
        return i;
      }
      function siguiente() {
        var act = colores.filter(function (c) { return c.on; });
        if (!act.length) act = [colores[0]];
        var cand = act.filter(function (c) { return c.hex !== ultimoColor; });
        if (!cand.length) cand = act;
        var c = cand[Math.floor(Math.random() * cand.length)];
        ultimoColor = c.hex;
        ultimoNum = otro(NUMEROS.length, ultimoNum);
        escena.style.background = c.hex;
        var t = colorTexto(c.hex);
        circulo.style.color = t; circulo.style.borderColor = t;
        circulo.textContent = NUMEROS[ultimoNum];
      }
      function programar() {
        clearTimeout(timer);
        if (!corriendo || pausado) return;
        timer = setTimeout(function () { siguiente(); programar(); }, intervalo * 1000);
      }
      function empezar() {
        corriendo = true; pausado = false;
        inicio.hidden = true; circulo.hidden = false; gear.hidden = false;
        raiz.classList.add("jugando");
        R.mantenerPantalla(true);
        siguiente(); programar();
      }
      function pausar(p) {
        pausado = p; estado.hidden = !p;
        btnPausa.textContent = p ? "Reanudar" : "Pausar";
        programar();
      }

      function pintarColores() {
        lista.innerHTML = "";
        colores.forEach(function (c, i) {
          var t = R.html(
            '<div class="cn-tile"><button class="cn-sw" type="button"></button><div class="cn-nom"></div>' +
            '<div class="cn-ed"><input type="color"><button class="cn-del" type="button">×</button></div></div>'
          );
          var sw = t.querySelector(".cn-sw"), inp = t.querySelector("input"), del = t.querySelector(".cn-del");
          t.querySelector(".cn-nom").textContent = c.nom;
          sw.style.background = c.hex; sw.textContent = c.on ? "✓" : "";
          sw.setAttribute("aria-pressed", c.on ? "true" : "false");
          sw.setAttribute("aria-label", c.nom);
          inp.value = c.hex; inp.setAttribute("aria-label", "Cambiar " + c.nom);
          del.setAttribute("aria-label", "Quitar " + c.nom);
          sw.addEventListener("click", function () {
            if (c.on && activos() < 2) return;
            c.on = !c.on; guardar(); pintarColores();
          });
          inp.addEventListener("input", function () { c.hex = inp.value; sw.style.background = c.hex; guardar(); });
          del.addEventListener("click", function () {
            if (colores.length < 2 || (c.on && activos() < 2)) return;
            colores.splice(i, 1); guardar(); pintarColores();
          });
          lista.appendChild(t);
        });
      }
      pintarColores();

      raiz.addEventListener("click", function (e) {
        var b = e.target.closest("[data-a]");
        if (!b) return;
        var a = b.getAttribute("data-a");
        if (a === "volver") R.salir();
        else if (a === "empezar") empezar();
        else if (a === "ajustes") panel.hidden = !panel.hidden;
        else if (a === "cerrar") panel.hidden = true;
        else if (a === "pausa") pausar(!pausado);
        else if (a === "full") R.pantallaCompleta();
        else if (a === "agregar") {
          colores.push({
            nom: "Color " + (colores.length + 1),
            hex: "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0"),
            on: true
          });
          guardar(); pintarColores();
        } else if (a === "restaurar") {
          colores = copiaBase(); guardar(); pintarColores();
        }
      });

      escena.addEventListener("click", function (e) {
        if (!corriendo || e.target.closest("[data-a]")) return;
        if (!panel.hidden) { panel.hidden = true; return; }
        pausar(!pausado);
      });

      rango.addEventListener("input", function () {
        intervalo = parseFloat(rango.value);
        rangoV.textContent = R.num(intervalo, 1);
        R.guardar("colores.intervalo", intervalo);
        programar();
      });

      return function destruir() { clearTimeout(timer); corriendo = false; };
    }
  });
})(window.Reacciona);
