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
    { id: "rosa", n: "Rosa", c: "#ff6fb1", d: "#c23a7c" },
    { id: "cafe", n: "Café", c: "#9a6238", d: "#5e3a1e" },
    { id: "lima", n: "Lima", c: "#b6e02e", d: "#76931a" }
  ];
  var uid = 0;
  var DEF = { n: 6, k: 8, intentos: 10, rep: false, tiempo: 0, pistas: 0 };

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
      var destruido = false, jugadorNom = null, limpiar = null;
      var cfg = Object.assign({}, DEF, R.leer("botellas.cfg", {}));
      function guardarCfg() { R.guardar("botellas.cfg", cfg); }
      function ajustar() { if (!cfg.rep && cfg.k < cfg.n) cfg.k = cfg.n; }
      function claveRec() { return "botellas.rec." + cfg.n + "." + cfg.k + "." + cfg.intentos + "." + (cfg.rep ? "r" : "s"); }
      function chips(t, k, lista) {
        return '<p class="campo-et sola">' + t + '</p><div class="chips">' + lista.map(function (x) {
          return '<button type="button" class="chip' + (String(cfg[k]) === String(x[0]) ? " sel" : "") + '" data-set="' + k + ":" + x[0] + '">' + x[1] + "</button>";
        }).join("") + "</div>";
      }
      function sl(k, et, min, max, u) {
        return '<label class="campo"><span class="campo-et">' + et + ' <b data-v="' + k + '">' + cfg[k] + (u || "") + '</b></span><input type="range" data-k="' + k + '" data-u="' + (u || "") + '" min="' + min + '" max="' + max + '" step="1" value="' + cfg[k] + '"></label>';
      }

      function pantallaConfig() {
        if (limpiar) { limpiar(); limpiar = null; }
        ajustar();
        var old = cont.querySelector(".lz-scroll"), prev = old ? old.scrollTop : 0;
        var rec = R.leer(claveRec(), null);
        var muestra = ""; for (var i = 0; i < cfg.k; i++) muestra += '<i title="' + COL[i].n + '">' + botella(i) + "</i>";
        cont.innerHTML =
          '<section class="lz lz-config bt-cfg">' +
            '<header class="lz-top"><button class="volver" type="button" data-a="volver" aria-label="Volver al menú">←</button><h2>Botellas</h2></header>' +
            '<div class="lz-scroll"><div class="lz-col">' +
              '<p class="nota">Adivina el orden secreto de las botellas. Tras cada intento verás cuántas tienen el color y el lugar correctos y cuántas tienen solo el color correcto.</p>' +
              "<h3>Tablero</h3>" +
              sl("n", "Botellas en la fila", 3, 8, "") + sl("k", "Colores distintos", 3, COL.length, "") +
              '<div class="bt-muestra">' + muestra + "</div>" +
              sl("intentos", "Intentos", 3, 20, "") +
              chips("Colores repetidos", "rep", [[false, "Sin repetir"], [true, "Con repetidos"]]) +
              (!cfg.rep ? '<p class="nota">Sin repetir, los colores distintos nunca son menos que las botellas.</p>' : "") +
              "<h3>Reglas</h3>" +
              chips("Tiempo límite", "tiempo", [[0, "Sin límite"], [1, "1 min"], [2, "2 min"], [3, "3 min"], [5, "5 min"]]) +
              chips("Pistas (revelan una botella)", "pistas", [[0, "Ninguna"], [1, "1"], [3, "3"], [99, "Ilimitadas"]]) +
              '<p class="record">' + (rec === null ? "Aún sin récord con esta configuración." : "Mejor: " + rec + (rec === 1 ? " intento" : " intentos")) + "</p>" +
            "</div></div>" +
            '<footer class="lz-pie"><div class="lz-col"><button class="btn primario grande" type="button" data-a="jugar">Comenzar</button></div></footer>' +
          "</section>";
        var raiz = cont.querySelector(".bt-cfg");
        raiz.querySelector(".lz-scroll").scrollTop = prev;
        R.pintarRangos(raiz);
        raiz.addEventListener("input", function (e) {
          var k = e.target.dataset && e.target.dataset.k; if (!k) return;
          cfg[k] = +e.target.value; ajustar(); guardarCfg();
          ["n", "k", "intentos"].forEach(function (c) {
            raiz.querySelector('[data-v="' + c + '"]').textContent = cfg[c];
            var inp = raiz.querySelector('[data-k="' + c + '"]'); inp.value = cfg[c]; R.pintarRango(inp);
          });
          var m = ""; for (var i = 0; i < cfg.k; i++) m += '<i title="' + COL[i].n + '">' + botella(i) + "</i>";
          raiz.querySelector(".bt-muestra").innerHTML = m;
          var r = R.leer(claveRec(), null);
          raiz.querySelector(".record").textContent = r === null ? "Aún sin récord con esta configuración." : "Mejor: " + r + (r === 1 ? " intento" : " intentos");
        });
        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button"); if (!b) return;
          if (b.dataset.a === "volver") R.salir();
          else if (b.dataset.a === "jugar") { guardarCfg(); R.pedirJugador(cont, function (nombre) { jugadorNom = nombre; partida(); }, pantallaConfig); }
          else if (b.dataset.set) {
            var p = b.dataset.set.indexOf(":"), k = b.dataset.set.slice(0, p), v = b.dataset.set.slice(p + 1);
            cfg[k] = k === "rep" ? v === "true" : Number(v); ajustar(); guardarCfg(); pantallaConfig();
          }
        });
      }

      function partida() {
        if (destruido) return;
        var N = cfg.n, K = cfg.k, INT = cfg.intentos;
        var secreto = [], pool = []; for (var q = 0; q < K; q++) pool.push(q);
        for (var i = 0; i < N; i++) {
          if (cfg.rep) secreto.push(Math.floor(Math.random() * K));
          else secreto.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }
        var filas = [], actual = [], fin = false, t0 = Date.now(), pistasUsadas = 0, reveladas = {}, tmrs = [];
        var limite = cfg.tiempo * 60, maxPistas = cfg.pistas;

        var rows = "";
        for (var r = 0; r < INT; r++) {
          rows += '<div class="bt-fila" data-r="' + r + '"><span class="bt-n">' + (r + 1) + '</span><div class="bt-slots">';
          for (var s = 0; s < N; s++) rows += '<button type="button" class="bt-slot" data-s="' + s + '" tabindex="-1">' + botella(-1) + "</button>";
          rows += '</div><div class="bt-pistas"><span class="ok" title="Color y lugar correctos"><b>·</b></span><span class="cerca" title="Color correcto, lugar distinto"><b>·</b></span></div></div>';
        }
        var pal = ""; for (var c = 0; c < K; c++) pal += '<button type="button" class="bt-col" data-c="' + c + '" aria-label="' + COL[c].n + '">' + botella(c) + "</button>";
        cont.innerHTML =
          '<section class="bt" style="--n:' + N + ';--k:' + K + '">' +
            '<header class="bt-top"><button class="bt-b" type="button" data-a="salir" aria-label="Volver">←</button><h2>Botellas</h2>' +
              '<div class="bt-acc"><button class="bt-b" type="button" data-a="reglas" aria-label="Reglas">?</button><button class="bt-b" type="button" data-a="reiniciar" aria-label="Reiniciar">↻</button></div></header>' +
            '<div class="bt-secreto"><div class="bt-slots">' + secreto.map(function () { return '<span class="bt-slot s">' + botella(-2) + "</span>"; }).join("") + '</div><p class="bt-estado">Intento <b>1</b> de ' + INT + '<span class="bt-reloj"></span></p></div>' +
            '<div class="bt-tablero" style="--filas:' + INT + '">' + rows + "</div>" +
            '<div class="bt-leyenda"><span><i class="d ok"></i> color y lugar</span><span><i class="d cerca"></i> color en otro lugar</span></div>' +
            '<div class="bt-pal">' + pal + "</div>" +
            '<div class="bt-pie' + (maxPistas ? " con-pista" : "") + '"><button type="button" class="bt-btn suave" data-a="borrar">Borrar</button>' +
              (maxPistas ? '<button type="button" class="bt-btn suave" data-a="pista">Pista <span class="bt-np"></span></button>' : "") +
              '<button type="button" class="bt-btn" data-a="comprobar" disabled>Comprobar</button></div>' +
            '<div class="bt-ov" hidden></div>' +
          "</section>";
        var raiz = cont.querySelector(".bt");
        var btnOk = raiz.querySelector('[data-a="comprobar"]'), estado = raiz.querySelector(".bt-estado b"), ov = raiz.querySelector(".bt-ov"), reloj = raiz.querySelector(".bt-reloj");
        var btnPista = raiz.querySelector('[data-a="pista"]');
        function pintarPistas() { if (btnPista) { var q = maxPistas >= 99 ? "∞" : String(maxPistas - pistasUsadas); btnPista.querySelector(".bt-np").textContent = "(" + q + ")"; btnPista.disabled = fin || (maxPistas < 99 && pistasUsadas >= maxPistas) || Object.keys(reveladas).length >= N - 1; } }
        pintarPistas();

        function filaEl(r) { return raiz.querySelector('.bt-fila[data-r="' + r + '"]'); }
        function pintarActual() {
          var f = filaEl(filas.length); if (!f || fin) return;
          raiz.querySelectorAll(".bt-fila").forEach(function (x) { x.classList.toggle("act", x === f); });
          f.querySelectorAll(".bt-slot").forEach(function (b, s) { b.innerHTML = botella(actual[s] === undefined ? -1 : actual[s]); b.classList.toggle("lleno", actual[s] !== undefined); });
          var lleno = true; for (var s = 0; s < N; s++) if (actual[s] === undefined) lleno = false;
          btnOk.disabled = !lleno;
          var fe = raiz.querySelector(".bt-fila.act"); if (fe && fe.scrollIntoView) fe.scrollIntoView({ block: "nearest" });
        }
        function agregar(c) {
          if (fin) return;
          for (var s = 0; s < N; s++) if (actual[s] === undefined) { actual[s] = c; R.tono && R.tono(500 + c * 50, 50, "sine", 0.12); pintarActual(); return; }
        }
        function quitar(s) { if (fin) return; if (s === undefined) { for (var k = N - 1; k >= 0; k--) if (actual[k] !== undefined) { s = k; break; } } if (s !== undefined) { actual[s] = undefined; pintarActual(); } }
        function evaluar(g) {
          var ex = 0, a = [], b = [];
          for (var i = 0; i < N; i++) { if (g[i] === secreto[i]) ex++; else { a.push(g[i]); b.push(secreto[i]); } }
          var cerca = 0;
          a.forEach(function (x) { var k = b.indexOf(x); if (k >= 0) { cerca++; b.splice(k, 1); } });
          return { ex: ex, cerca: cerca };
        }
        function pistaYa() {
          if (fin || btnPista.disabled) return;
          var libres = []; for (var i = 0; i < N; i++) if (!(i in reveladas)) libres.push(i);
          if (libres.length <= 1) return;
          var p = libres[Math.floor(Math.random() * libres.length)];
          reveladas[p] = true; pistasUsadas++;
          var e = raiz.querySelectorAll(".bt-secreto .bt-slot")[p]; e.innerHTML = botella(secreto[p]); e.classList.add("rev");
          R.tono && R.tono(880, 90, "sine", 0.14);
          pintarPistas();
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
          if (filas.length >= INT) { perder("Se acabaron los intentos"); return; }
          estado.textContent = filas.length + 1; pintarActual();
          btnOk.disabled = true;
        }
        function revelar() {
          raiz.querySelectorAll(".bt-secreto .bt-slot").forEach(function (e, i) { e.innerHTML = botella(secreto[i]); e.classList.add("rev"); e.style.animationDelay = i * 90 + "ms"; });
        }
        function parar() { fin = true; clearInterval(reloj_id); btnOk.disabled = true; if (btnPista) btnPista.disabled = true; }
        function ganar() {
          parar(); revelar(); R.fb && R.fb.fin && R.fb.fin();
          var seg = Math.round((Date.now() - t0) / 1000), n = filas.length;
          var conf = ""; for (var i = 0; i < 40; i++) conf += '<i style="left:' + Math.round(Math.random() * 100) + "%;background:" + COL[i % COL.length].c + ";animation-delay:" + (Math.random() * 1.2).toFixed(2) + "s;animation-duration:" + (2 + Math.random() * 2).toFixed(2) + 's"></i>';
          try {
            R.registrarPartida(jugadorNom, { juego: "Botellas", modo: (cfg.rep ? "Con repetidos" : "Sin repetir"), config: N + " botellas · " + K + " colores · " + INT + " intentos" + (cfg.tiempo ? " · " + cfg.tiempo + " min" : "") + (pistasUsadas ? " · " + pistasUsadas + " pistas" : ""), valor: n, unidad: "intentos", mejorEs: "min", stats: { aciertos: n, fallos: n - 1, precision: Math.round(100 / n) } });
          } catch (e) {}
          var rec = R.leer(claveRec(), null), nuevo = rec === null || n < rec;
          if (nuevo) R.guardar(claveRec(), n);
          tmrs.push(setTimeout(function () {
            if (destruido) return;
            ov.innerHTML = '<div class="bt-conf">' + conf + '</div><div class="bt-card"><h3>¡Lo lograste!</h3><p>Adivinaste el orden en <b>' + n + "</b> " + (n === 1 ? "intento" : "intentos") + " (" + seg + " s).</p>" + (nuevo ? '<span class="insignia">Nuevo récord</span>' : "") + '<button class="bt-btn" type="button" data-a="reiniciar">Jugar de nuevo</button><button class="bt-btn suave" type="button" data-a="ver">Ver tablero</button><button class="bt-btn suave" type="button" data-a="config">Configurar</button></div>';
            ov.hidden = false;
          }, 900));
        }
        function perder(motivo) {
          parar(); revelar(); R.fb && R.fb.mal && R.fb.mal();
          tmrs.push(setTimeout(function () {
            if (destruido) return;
            ov.innerHTML = '<div class="bt-card"><h3>' + motivo + '</h3><p>La respuesta estaba arriba. ¡Inténtalo otra vez!</p><button class="bt-btn" type="button" data-a="reiniciar">Jugar de nuevo</button><button class="bt-btn suave" type="button" data-a="ver">Ver respuesta</button><button class="bt-btn suave" type="button" data-a="config">Configurar</button></div>';
            ov.hidden = false;
          }, 1100));
        }
        function reglas() {
          ov.innerHTML = '<div class="bt-card"><h3>Reglas rápidas</h3><ol class="bt-reglas"><li>Hay una fila secreta de <b>' + N + ' botellas</b> (' + K + " colores posibles" + (cfg.rep ? ", pueden repetirse" : ", sin repetir") + ").</li><li>Tienes <b>" + INT + " intentos</b>" + (limite ? " y <b>" + cfg.tiempo + " min</b>" : "") + " para adivinar el orden exacto.</li><li>Toca los colores de abajo para llenar tu fila y presiona <b>Comprobar</b>.</li><li>Al lado verás dos pistas: <b class=\"v\">●</b> color y lugar correctos, <b class=\"a\">●</b> color correcto en otro lugar.</li><li>Toca una botella de tu fila para quitarla.</li></ol>" +
            '<button class="bt-btn" type="button" data-a="cerrar">Entendido</button></div>';
          ov.hidden = false;
        }
        var reloj_id = setInterval(function () {
          if (fin) return;
          var t = Math.round((Date.now() - t0) / 1000);
          if (limite) {
            var resto = limite - t; reloj.textContent = " · " + Math.floor(resto / 60) + ":" + ("0" + (resto % 60)).slice(-2);
            if (resto <= 0) perder("Se acabó el tiempo");
          }
        }, 500);
        if (limite) reloj.textContent = " · " + cfg.tiempo + ":00";
        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button"); if (!b) return;
          var a = b.dataset.a;
          if (b.dataset.c !== undefined) agregar(+b.dataset.c);
          else if (b.classList.contains("bt-slot") && b.closest(".act")) quitar(+b.dataset.s);
          else if (a === "salir") { clean(); R.salir(); }
          else if (a === "borrar") quitar();
          else if (a === "comprobar") comprobar();
          else if (a === "pista") pistaYa();
          else if (a === "reglas") reglas();
          else if (a === "cerrar" || a === "ver") ov.hidden = true;
          else if (a === "reiniciar") { clean(); partida(); }
          else if (a === "config") { clean(); pantallaConfig(); }
        });
        function clean() { clearInterval(reloj_id); tmrs.forEach(clearTimeout); }
        limpiar = clean;
        pintarActual();
      }

      pantallaConfig();
      return function () { destruido = true; if (limpiar) limpiar(); };
    }
  });
})(window.Reacciona);
