/* Juego: Reacción simple.
   La pantalla espera un tiempo al azar (2 a 6 s) y un círculo se enciende. Toca lo más rápido que puedas.
   Se repite varias veces y entrega el promedio en milisegundos. */
(function (R) {
  R.registrar({
    id: "reaccion",
    nombre: "Reacción simple",
    descripcion: "Un círculo se enciende en un momento al azar. Toca lo más rápido que puedas.",
    preview: function () {
      return R.html('<span class="pv-reaccion"><i></i></span>');
    },

    iniciar: function (cont) {
      var cfg = Object.assign({ intentos: 5 }, R.leer("reaccion.cfg", {}));
      var limpiar = null;

      function claveRecord() { return "reaccion.rec." + cfg.intentos; }

      function pantallaConfig() {
        if (limpiar) { limpiar(); limpiar = null; }
        R.mantenerPantalla(false);
        var rec = R.leer(claveRecord(), null);
        cont.innerHTML =
          '<section class="lz lz-config">' +
            '<header class="lz-top"><button class="volver" type="button" data-a="volver" aria-label="Volver al menú">←</button><h2>Reacción simple</h2></header>' +
            '<div class="lz-scroll"><div class="lz-col">' +
              '<p class="nota">La pantalla queda en espera y, pasado un tiempo al azar de 2 a 6 segundos, un círculo se enciende en azul. Tócalo lo más rápido que puedas. Si tocas antes de que se encienda, cuenta como salida en falso.</p>' +
              '<label class="campo"><span class="campo-et">Intentos <b data-v="intentos" data-u="">' + cfg.intentos + '</b></span>' +
              '<input type="range" data-k="intentos" min="3" max="10" step="1" value="' + cfg.intentos + '"></label>' +
              '<p class="record">' + (rec === null ? "Aún sin récord con estos intentos." : "Mejor promedio: " + rec + " ms") + "</p>" +
            "</div></div>" +
            '<footer class="lz-pie"><div class="lz-col"><button class="btn primario grande" type="button" data-a="jugar">Comenzar</button></div></footer>' +
          "</section>";
        var raiz = cont.querySelector(".lz-config");
        R.pintarRangos(raiz);
        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b) return;
          if (b.dataset.a === "volver") R.salir();
          else if (b.dataset.a === "jugar") R.pedirJugador(cont, function (nombre) { jugar(nombre); }, pantallaConfig);
        });
        raiz.addEventListener("input", function (e) {
          if (!e.target.dataset || e.target.dataset.k !== "intentos") return;
          cfg.intentos = +e.target.value;
          raiz.querySelector('[data-v="intentos"]').textContent = cfg.intentos;
          R.guardar("reaccion.cfg", cfg);
          var r = R.leer(claveRecord(), null);
          raiz.querySelector(".record").textContent = r === null ? "Aún sin récord con estos intentos." : "Mejor promedio: " + r + " ms";
        });
      }

      function jugar(jugador) {
        cont.innerHTML =
          '<section class="lz rs">' +
            '<div class="lz-hud">' +
              '<button class="volver" type="button" data-a="parar" aria-label="Salir">✕</button>' +
              '<div class="lz-dato"><span class="v" data-h="i">1</span><small>de ' + cfg.intentos + "</small></div>" +
              '<div class="lz-dato der"><span class="v" data-h="u">–</span><small>último (ms)</small></div>' +
            "</div>" +
            '<div class="rs-centro"><div class="rs-circulo"></div><div class="rs-msg" aria-live="assertive">Prepárate</div></div>' +
          "</section>";
        var raiz = cont.querySelector(".rs");
        var circ = raiz.querySelector(".rs-circulo"), msg = raiz.querySelector(".rs-msg");
        var hI = raiz.querySelector('[data-h="i"]'), hU = raiz.querySelector('[data-h="u"]');
        var fase = "pausa", timers = [], t0 = 0, tiempos = [], falsas = 0, vivo = true;

        function after(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
        function esperar() {
          if (!vivo) return;
          fase = "espera"; circ.classList.remove("on"); msg.textContent = "Espera…";
          hI.textContent = Math.min(cfg.intentos, tiempos.length + 1);
          after(encender, 2000 + Math.random() * 4000);
        }
        function encender() {
          fase = "ya"; circ.classList.add("on"); msg.textContent = "¡Toca!";
          requestAnimationFrame(function () { t0 = performance.now(); });
        }
        function terminar() {
          vivo = false;
          timers.forEach(clearTimeout);
          resultado(tiempos, falsas, jugador);
        }

        raiz.addEventListener("pointerdown", function (e) {
          if (e.target.closest("[data-a=parar]")) return;
          if (fase === "espera") {
            timers.forEach(clearTimeout); timers = [];
            falsas++; fase = "pausa"; R.fb.mal(); msg.textContent = "¡Muy pronto!";
            after(esperar, 1500);
          } else if (fase === "ya") {
            var rt = performance.now() - t0;
            tiempos.push(rt); fase = "pausa"; R.fb.ok();
            circ.classList.remove("on");
            msg.textContent = Math.round(rt) + " ms"; hU.textContent = Math.round(rt);
            if (tiempos.length >= cfg.intentos) after(terminar, 1200);
            else after(esperar, 1200);
          }
        });
        raiz.addEventListener("click", function (e) {
          if (!e.target.closest("[data-a=parar]")) return;
          vivo = false; timers.forEach(clearTimeout);
          limpiar = null; pantallaConfig();
        });

        R.mantenerPantalla(true);
        after(esperar, 1000);
        limpiar = function () { vivo = false; timers.forEach(clearTimeout); };
      }

      function resultado(tiempos, falsas, jugador) {
        if (limpiar) { limpiar(); limpiar = null; }
        R.mantenerPantalla(false);
        R.fb.fin();
        var suma = tiempos.reduce(function (a, b) { return a + b; }, 0);
        var media = Math.round(suma / tiempos.length);
        var mejor = Math.round(Math.min.apply(null, tiempos));
        var peor = Math.round(Math.max.apply(null, tiempos));

        var rec = R.leer(claveRecord(), null), nuevo = false;
        if (rec === null || media < rec) { R.guardar(claveRecord(), media); rec = media; nuevo = true; }
        var guardado = R.registrarPartida(jugador, {
          juego: "Reacción simple", modo: "Reacción simple", config: cfg.intentos + " intentos",
          valor: media, unidad: "ms", mejorEs: "min",
          stats: { aciertos: tiempos.length, fallos: falsas, precision: Math.round(tiempos.length / (tiempos.length + falsas) * 100), rtMedia: media, rtMejor: mejor }
        });

        cont.innerHTML =
          '<section class="lz lz-res"><div class="lz-col centro">' +
            '<p class="eyebrow">Reacción simple · ' + cfg.intentos + " intentos" + (jugador ? " · " + R.esc(jugador) : "") + "</p>" +
            "<h2>Promedio</h2>" +
            '<div class="gran"><span>' + media + "</span><small>milisegundos</small></div>" +
            (nuevo ? '<span class="insignia">Nuevo récord</span>' : '<p class="record">Mejor promedio: ' + rec + " ms</p>") +
            '<dl class="stats">' +
              "<div><dt>Mejor</dt><dd>" + mejor + " ms</dd></div>" +
              "<div><dt>Más lento</dt><dd>" + peor + " ms</dd></div>" +
              "<div><dt>Salidas en falso</dt><dd>" + falsas + "</dd></div>" +
            "</dl>" +
            '<div class="tiempos">' + tiempos.map(function (t, i) { return "<span><b>" + (i + 1) + "</b> " + Math.round(t) + " ms</span>"; }).join("") + "</div>" +
            (guardado ? '<p class="record">Guardado en el historial.</p>' : "") +
            '<div class="acciones">' +
              '<button class="btn primario grande" type="button" data-a="otra">Repetir</button>' +
              '<button class="btn" type="button" data-a="config">Configurar</button>' +
              '<button class="btn" type="button" data-a="menu">Menú</button>' +
            "</div>" +
          "</div></section>";
        cont.querySelector(".lz-res").addEventListener("click", function (e) {
          var b = e.target.closest("[data-a]");
          if (!b) return;
          if (b.dataset.a === "otra") jugar(jugador);
          else if (b.dataset.a === "config") pantallaConfig();
          else if (b.dataset.a === "menu") R.salir();
        });
      }

      pantallaConfig();
      return function destruir() { if (limpiar) limpiar(); };
    }
  });
})(window.Reacciona);
