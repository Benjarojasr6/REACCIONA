/* Juego: Botellas. Adivina el orden secreto de 6 botellas de colores en 10 intentos (estilo Mastermind). */
(function (R) {
  var COL = [
    { id: "rojo", n: "Rojo", c: "#e53935", d: "#9c1c1a" },
    { id: "azul", n: "Azul", c: "#1e66e0", d: "#123f94" },
    { id: "verde", n: "Verde", c: "#2fb457", d: "#1b7536" },
    { id: "amarillo", n: "Amarillo", c: "#ffd21f", d: "#b58f00" },
    { id: "morado", n: "Morado", c: "#8e44d6", d: "#5a2490" },
    { id: "naranja", n: "Naranja", c: "#ff8a1f", d: "#b85a00" },
    { id: "celeste", n: "Celeste", c: "#3cc8f0", d: "#1688ad" },
    { id: "rosa", n: "Rosa", c: "#ff6fb1", d: "#c23a7c" }
  ];
  var N = 6, INT = 10, uid = 0;

  function botella(i) { /* i = índice de color, o -1 vacía, -2 oculta */
    var k = ++uid;
    if (i < 0) {
      return '<svg viewBox="0 0 30 58" aria-hidden="true"><path d="M11 6h8v10c0 3 6 6 6 12v24a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V28c0-6 6-9 6-12z" fill="' + (i === -2 ? "#34405a" : "none") + '" stroke="' + (i === -2 ? "#556385" : "rgba(255,255,255,.28)") + '" stroke-width="1.6" stroke-dasharray="' + (i === -2 ? "0" : "3 3") + '"/>' +
        (i === -2 ? '<text x="15" y="42" text-anchor="middle" font-size="18" font-weight="800" fill="#9fb0d6">?</text>' : "") + "</svg>";
    }
    var C = COL[i];
    return '<svg viewBox="0 0 30 58" aria-hidden="true"><defs><linearGradient id="bg' + k + '" x1="0" x2="1"><stop offset="0" stop-color="' + C.d + '"/><stop offset=".35" stop-color="' + C.c + '"/><stop offset="1" stop-color="' + C.d + '"/></linearGradient></defs>' +
      '<rect x="10.5" y="1" width="9" height="5.5" rx="1.6" fill="#e9eef5"/>' +
      '<path d="M11 6h8v10c0 3 6 6 6 12v24a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V28c0-6 6-9 6-12z" fill="url(#bg' + k + ')" stroke="rgba(0,0,0,.35)" stroke-width="1"/>' +
      '<rect x="5.5" y="34" width="19" height="12" fill="rgba(255,255,255,.88)"/><circle cx="15" cy="40" r="3.2" fill="' + C.c + '"/>' +
      '<path d="M9 28c0-3 1.5-5 2.6-6.5" stroke="rgba(255,255,255,.55)" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  }

  R.registrar({
    id: "botellas",
    nombre: "Botellas",
    descripcion: "Adivina el orden secreto de 6 botellas de colores en 10 intentos.",
    preview: function () {
      var s = '<span class="pv-botellas">';
      [0, 3, 1, 2].forEach(function (i) { s += "<i>" + botella(i) + "</i>"; });
      return R.html(s + "</span>");
    },

    iniciar: function (cont) {
      var cierres = [], destruido = false;
      var cfg = Object.assign({ repetir: false }, R.leer("botellas.cfg", {}));
      var jugadorNom = null;

      R.pedirJugador(cont, function (nombre) { jugadorNom = nombre; partida(); }, function () { R.salir(); });

      function partida() {
        if (destruido) return;
        var secreto = [], pool = COL.map(function (_, i) { return i; });
        for (var i = 0; i < N; i++) {
          if (cfg.repetir) secreto.push(Math.floor(Math.random() * COL.length));
          else secreto.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }
        var filas = [], actual = [], fin = false, t0 = Date.now();

        var rows = "";
        for (var r = 0; r < INT; r++) {
          rows += '<div class="bt-fila" data-r="' + r + '"><span class="bt-n">' + (r + 1) + '</span><div class="bt-slots">';
          for (var s = 0; s < N; s++) rows += '<button type="button" class="bt-slot" data-s="' + s + '" tabindex="-1">' + botella(-1) + "</button>";
          rows += '</div><div class="bt-pistas"><span class="ok" title="Color y lugar correctos"><b>·</b></span><span class="cerca" title="Color correcto, lugar distinto"><b>·</b></span></div></div>';
        }
        var pal = COL.map(function (c, i) { return '<button type="button" class="bt-col" data-c="' + i + '" aria-label="' + c.n + '">' + botella(i) + "</button>"; }).join("");
        cont.innerHTML =
          '<section class="bt">' +
            '<header class="bt-top"><button class="bt-b" type="button" data-a="volver" aria-label="Volver al menú">←</button><h2>Botellas</h2>' +
              '<div class="bt-acc"><button class="bt-b" type="button" data-a="reglas" aria-label="Reglas">?</button><button class="bt-b" type="button" data-a="reiniciar" aria-label="Reiniciar">↻</button></div></header>' +
            '<div class="bt-secreto"><div class="bt-slots">' + secreto.map(function () { return '<span class="bt-slot s">' + botella(-2) + "</span>"; }).join("") + '</div><p class="bt-estado">Intento <b>1</b> de ' + INT + "</p></div>" +
            '<div class="bt-tablero">' + rows + "</div>" +
            '<div class="bt-leyenda"><span><i class="d ok"></i> color y lugar</span><span><i class="d cerca"></i> color en otro lugar</span></div>' +
            '<div class="bt-pal">' + pal + "</div>" +
            '<div class="bt-pie"><button type="button" class="bt-btn suave" data-a="borrar">Borrar</button><button type="button" class="bt-btn" data-a="comprobar" disabled>Comprobar</button></div>' +
            '<div class="bt-ov" hidden></div>' +
          "</section>";
        var raiz = cont.querySelector(".bt");
        var btnOk = raiz.querySelector('[data-a="comprobar"]'), estado = raiz.querySelector(".bt-estado b"), ov = raiz.querySelector(".bt-ov");

        function filaEl(r) { return raiz.querySelector('.bt-fila[data-r="' + r + '"]'); }
        function pintarActual() {
          var f = filaEl(filas.length); if (!f || fin) return;
          raiz.querySelectorAll(".bt-fila").forEach(function (x) { x.classList.toggle("act", x === f); });
          f.querySelectorAll(".bt-slot").forEach(function (b, s) { b.innerHTML = botella(actual[s] === undefined ? -1 : actual[s]); b.classList.toggle("lleno", actual[s] !== undefined); });
          var lleno = true; for (var s = 0; s < N; s++) if (actual[s] === undefined) lleno = false;
          btnOk.disabled = !lleno;
        }
        function agregar(c) {
          if (fin) return;
          for (var s = 0; s < N; s++) if (actual[s] === undefined) { actual[s] = c; R.tono && R.tono(500 + c * 60, 50, "sine", 0.12); pintarActual(); return; }
        }
        function quitar(s) { if (fin) return; if (s === undefined) { for (var k = N - 1; k >= 0; k--) if (actual[k] !== undefined) { s = k; break; } } if (s !== undefined) { actual[s] = undefined; pintarActual(); } }

        function evaluar(g) {
          var ex = 0, a = [], b = [];
          for (var i = 0; i < N; i++) { if (g[i] === secreto[i]) ex++; else { a.push(g[i]); b.push(secreto[i]); } }
          var cerca = 0;
          a.forEach(function (x) { var k = b.indexOf(x); if (k >= 0) { cerca++; b.splice(k, 1); } });
          return { ex: ex, cerca: cerca };
        }
        function comprobar() {
          if (fin || btnOk.disabled) return;
          var g = actual.slice(), ev = evaluar(g), f = filaEl(filas.length);
          filas.push(g); actual = [];
          f.classList.remove("act"); f.classList.add("hecha");
          f.querySelector(".ok b").textContent = ev.ex; f.querySelector(".cerca b").textContent = ev.cerca;
          f.querySelector(".ok").classList.toggle("cero", !ev.ex); f.querySelector(".cerca").classList.toggle("cero", !ev.cerca);
          if (ev.ex === N) { ganar(); return; }
          R.tono && R.tono(ev.ex ? 660 : 300, 90, "sine", 0.14); R.vibrar && R.vibrar(15);
          if (filas.length >= INT) { perder(); return; }
          estado.textContent = filas.length + 1; pintarActual();
          btnOk.disabled = true;
        }
        function revelar() {
          raiz.querySelectorAll(".bt-secreto .bt-slot").forEach(function (e, i) { e.innerHTML = botella(secreto[i]); e.classList.add("rev"); e.style.animationDelay = i * 90 + "ms"; });
        }
        function ganar() {
          fin = true; btnOk.disabled = true; revelar(); R.fb && R.fb.fin && R.fb.fin();
          var seg = Math.round((Date.now() - t0) / 1000), n = filas.length;
          var conf = ""; for (var i = 0; i < 40; i++) conf += '<i style="left:' + Math.round(Math.random() * 100) + "%;background:" + COL[i % COL.length].c + ";animation-delay:" + (Math.random() * 1.2).toFixed(2) + "s;animation-duration:" + (2 + Math.random() * 2).toFixed(2) + 's"></i>';
          try {
            R.registrarPartida(jugadorNom, { juego: "Botellas", modo: cfg.repetir ? "Con repetidos" : "Sin repetidos", config: N + " botellas · " + INT + " intentos", valor: n, unidad: "intentos", mejorEs: "min", stats: { aciertos: n, fallos: n - 1, precision: Math.round(100 / n) } });
          } catch (e) {}
          var rec = R.leer("botellas.rec." + (cfg.repetir ? "r" : "s"), null), nuevo = !rec || n < rec;
          if (nuevo) R.guardar("botellas.rec." + (cfg.repetir ? "r" : "s"), n);
          setTimeout(function () {
            if (destruido) return;
            ov.innerHTML = '<div class="bt-conf">' + conf + '</div><div class="bt-card"><h3>¡Lo lograste!</h3><p>Adivinaste el orden en <b>' + n + "</b> " + (n === 1 ? "intento" : "intentos") + " (" + seg + " s).</p>" + (nuevo ? '<span class="insignia">Nuevo récord</span>' : "") + '<button class="bt-btn" type="button" data-a="reiniciar">Jugar de nuevo</button><button class="bt-btn suave" type="button" data-a="ver">Ver tablero</button></div>';
            ov.hidden = false;
          }, 900);
        }
        function perder() {
          fin = true; btnOk.disabled = true; revelar(); R.fb && R.fb.mal && R.fb.mal();
          setTimeout(function () {
            if (destruido) return;
            ov.innerHTML = '<div class="bt-card"><h3>Se acabaron los intentos</h3><p>La respuesta estaba arriba. ¡Inténtalo otra vez!</p><button class="bt-btn" type="button" data-a="reiniciar">Jugar de nuevo</button><button class="bt-btn suave" type="button" data-a="ver">Ver respuesta</button></div>';
            ov.hidden = false;
          }, 1100);
        }
        function reglas() {
          ov.innerHTML = '<div class="bt-card"><h3>Reglas rápidas</h3><ol class="bt-reglas"><li>Hay una fila secreta de <b>6 botellas</b> (8 colores posibles' + (cfg.repetir ? ", pueden repetirse" : ", sin repetir") + ").</li><li>Tienes <b>10 intentos</b> para adivinar el orden exacto.</li><li>Toca los colores de abajo para llenar tu fila y presiona <b>Comprobar</b>.</li><li>Al lado verás dos pistas: <b class=\"v\">●</b> color y lugar correctos, <b class=\"a\">●</b> color correcto en otro lugar.</li><li>Toca una botella de tu fila para quitarla.</li></ol>" +
            '<button type="button" class="bt-chip' + (cfg.repetir ? " sel" : "") + '" data-a="rep" aria-pressed="' + cfg.repetir + '">Permitir colores repetidos</button><button class="bt-btn" type="button" data-a="cerrar">Entendido</button></div>';
          ov.hidden = false;
        }
        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button"); if (!b) return;
          var a = b.dataset.a;
          if (b.dataset.c !== undefined) agregar(+b.dataset.c);
          else if (b.classList.contains("bt-slot") && b.closest(".act")) quitar(+b.dataset.s);
          else if (a === "volver") R.salir();
          else if (a === "borrar") quitar();
          else if (a === "comprobar") comprobar();
          else if (a === "reglas") reglas();
          else if (a === "cerrar" || a === "ver") ov.hidden = true;
          else if (a === "reiniciar") partida();
          else if (a === "rep") { cfg.repetir = !cfg.repetir; R.guardar("botellas.cfg", cfg); partida(); }
        });
        pintarActual();
      }
      return function () { destruido = true; cierres.forEach(function (f) { f(); }); };
    }
  });
})(window.Reacciona);
