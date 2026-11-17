/* Juego: Botellas. Dos modos:
   - Adivinar el orden (estilo Mastermind): fila secreta, intentos y pistas de color/lugar.
   - Intercambiar: ordena la estantería tocando dos botellas; el contador muestra cuántas están bien puestas.
   Con Futbolizado de primera las botellas llevan el escudo de un equipo de Primera B 2026. */
(function (R) {
  var COL = [
    { id: "rojo", n: "Rojo", c: "#e53935", d: "#8f1715" },
    { id: "azul", n: "Azul", c: "#1e66e0", d: "#0f3a8a" },
    { id: "verde", n: "Verde", c: "#2fb457", d: "#17692f" },
    { id: "amarillo", n: "Amarillo", c: "#ffd21f", d: "#a98100" },
    { id: "morado", n: "Morado", c: "#8e44d6", d: "#511f86" },
    { id: "naranja", n: "Naranja", c: "#ff8a1f", d: "#a85200" },
    { id: "celeste", n: "Celeste", c: "#3cc8f0", d: "#12809f" },
    { id: "rosa", n: "Rosa", c: "#ff6fb1", d: "#b8316f" },
    { id: "cafe", n: "Café", c: "#9a6238", d: "#573318" },
    { id: "lima", n: "Lima", c: "#b6e02e", d: "#6c8a14" },
    { id: "turquesa", n: "Turquesa", c: "#14b8a6", d: "#0a6b60" },
    { id: "granate", n: "Granate", c: "#a3203f", d: "#5c0f22" },
    { id: "gris", n: "Gris", c: "#8e9aa8", d: "#4b5560" },
    { id: "azulmarino", n: "Azul marino", c: "#2b3a8f", d: "#141c4a" },
    { id: "oliva", n: "Oliva", c: "#8a8f2c", d: "#4a4d14" },
    { id: "coral", n: "Coral", c: "#ff7f6e", d: "#b8402f" }
  ];
  /* Equipos de Primera B 2026 (logos en logos/<id>.png). La botella toma el color del equipo. */
  var EQ = [
    { id: "wanderers", n: "Santiago Wanderers", c: "#1fa23b", d: "#0b5a1f" },
    { id: "cobreloa", n: "Cobreloa", c: "#f58a1f", d: "#9a4f00" },
    { id: "curico", n: "Curicó Unido", c: "#d6262b", d: "#7d1014" },
    { id: "antofagasta", n: "Deportes Antofagasta", c: "#2a78c8", d: "#12437a" },
    { id: "copiapo", n: "Deportes Copiapó", c: "#e8e8e8", d: "#8c8c8c" },
    { id: "iquique", n: "Deportes Iquique", c: "#3fb4e6", d: "#14708f" },
    { id: "puertomontt", n: "Puerto Montt", c: "#2a9bb5", d: "#145a6b" },
    { id: "recoleta", n: "Deportes Recoleta", c: "#1e4fa3", d: "#0e2a5c" },
    { id: "santacruz", n: "Santa Cruz", c: "#1c7a45", d: "#0c4224" },
    { id: "temuco", n: "Deportes Temuco", c: "#16803a", d: "#0a4520" },
    { id: "magallanes", n: "Magallanes", c: "#7cc4ee", d: "#3a84b0" },
    { id: "rangers", n: "Rangers", c: "#cf2027", d: "#7a0e12" },
    { id: "sanluis", n: "San Luis", c: "#f6c800", d: "#a08000" },
    { id: "sanmarcos", n: "San Marcos de Arica", c: "#2a5db0", d: "#143266" },
    { id: "uespanola", n: "Unión Española", c: "#b3162b", d: "#5e0a16" },
    { id: "sanfelipe", n: "Unión San Felipe", c: "#e03a3e", d: "#8a1418" }
  ];
  var uid = 0;
  var DEF = { modo: "adivinar", n: 6, k: 8, intentos: 10, rep: false, tiempo: 0, pistas: 0, sn: 5, smov: 0, marcas: 1 };

  function fut() { return document.documentElement.getAttribute("data-fut") === "primera"; }

  function emblema(i, col) { /* dibujo genérico centrado en (20,56) */
    var f = 'fill="' + col + '"';
    switch (i % 10) {
      case 0: return '<circle cx="20" cy="56" r="5.5" ' + f + "/>";
      case 1: return '<rect x="13" y="51" width="14" height="3" ' + f + '/><rect x="13" y="56" width="14" height="3" ' + f + '/><rect x="13" y="61" width="14" height="3" ' + f + "/>";
      case 2: return '<path d="M20 49l2.2 5 5.4.5-4.1 3.6 1.3 5.4-4.8-2.9-4.8 2.9 1.3-5.4-4.1-3.6 5.4-.5z" ' + f + "/>";
      case 3: return '<path d="M12 56q4-6 8 0t8 0" stroke="' + col + '" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M12 62q4-6 8 0t8 0" stroke="' + col + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
      case 4: return '<path d="M22 48l-8 10h5l-3 9 9-11h-5z" ' + f + "/>";
      case 5: return '<path d="M20 49l7 7-7 7-7-7z" ' + f + "/>";
      case 6: return '<path d="M20 49l8 14H12z" ' + f + "/>";
      case 7: return '<circle cx="20" cy="56" r="5" fill="none" stroke="' + col + '" stroke-width="3"/>';
      case 8: return '<path d="M18 49h4v5h5v4h-5v5h-4v-5h-5v-4h5z" ' + f + "/>";
      default: return '<path d="M20 48c4 6 7 9 7 13a7 7 0 0 1-14 0c0-4 3-7 7-13z" ' + f + "/>";
    }
  }
  function escudo(i) {
    var e = EQ[i % EQ.length];
    return '<image href="logos/' + e.id + '.png" x="9.5" y="44.5" width="21" height="23.5" preserveAspectRatio="xMidYMid meet"/>';
  }
  function botella(i) { /* i = índice de color, -1 vacía, -2 oculta */
    var k = ++uid, cuerpo = "M16 10h8v12c0 5 10 8 10 18v32a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V40c0-10 10-13 10-18z";
    if (i === -1) return '<svg viewBox="0 0 40 84" aria-hidden="true"><path d="' + cuerpo + '" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.3)" stroke-width="1.5" stroke-dasharray="3 3"/></svg>';
    if (i === -2) return '<svg viewBox="0 0 40 84" aria-hidden="true"><defs><linearGradient id="bq' + k + '" x1="0" x2="1"><stop offset="0" stop-color="#1c1440"/><stop offset=".4" stop-color="#43308a"/><stop offset="1" stop-color="#1c1440"/></linearGradient></defs>' +
      '<path d="' + cuerpo + '" fill="url(#bq' + k + ')" stroke="#ff4fa3" stroke-width="1.6"/><rect x="14" y="4" width="12" height="7" rx="2" fill="#6b5aa8"/>' +
      '<text x="20" y="62" text-anchor="middle" font-size="26" font-weight="900" fill="#ffd21f" font-family="Arial Black,Arial,sans-serif">?</text></svg>';
    var C = fut() ? EQ[i % EQ.length] : COL[i % COL.length];
    return '<svg viewBox="0 0 40 84" aria-hidden="true"><defs>' +
      '<linearGradient id="bg' + k + '" x1="0" x2="1"><stop offset="0" stop-color="' + C.d + '"/><stop offset=".3" stop-color="' + C.c + '"/><stop offset=".62" stop-color="' + C.c + '"/><stop offset="1" stop-color="' + C.d + '"/></linearGradient>' +
      '<linearGradient id="bt' + k + '" x1="0" x2="1"><stop offset="0" stop-color="#8d96a6"/><stop offset=".4" stop-color="#f4f7fb"/><stop offset="1" stop-color="#7a8394"/></linearGradient></defs>' +
      '<ellipse cx="20" cy="81" rx="14" ry="3" fill="rgba(0,0,0,.4)"/>' +
      '<path d="' + cuerpo + '" fill="url(#bg' + k + ')" stroke="rgba(0,0,0,.45)" stroke-width="1"/>' +
      '<rect x="6.5" y="45" width="27" height="23" fill="#fff" opacity=".96"/><rect x="6.5" y="45" width="27" height="2" fill="' + C.d + '" opacity=".55"/><rect x="6.5" y="66" width="27" height="2" fill="' + C.d + '" opacity=".55"/>' +
      (fut() ? escudo(i) : emblema(i, C.c)) +
      '<rect x="13.5" y="3.5" width="13" height="8" rx="2.2" fill="url(#bt' + k + ')" stroke="rgba(0,0,0,.35)" stroke-width=".8"/><path d="M16 5v5M20 5v5M24 5v5" stroke="rgba(0,0,0,.25)" stroke-width=".8"/>' +
      '<path d="M10.5 41c0-4 2-6 3.4-8" stroke="rgba(255,255,255,.7)" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M9.8 44v0" stroke="rgba(255,255,255,.6)" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M30 40v26" stroke="rgba(255,255,255,.18)" stroke-width="2" stroke-linecap="round"/></svg>';
  }
  function nombreCol(i) { return fut() ? EQ[i % EQ.length].n : COL[i % COL.length].n; }

  R.registrar({
    id: "botellas",
    nombre: "Botellas",
    descripcion: "Adivina el orden de las botellas o ordénalas en la estantería.",
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
      var swap = function () { return cfg.modo === "swap"; };
      function claveRec() { return swap() ? "botellas.swap.rec." + cfg.sn : "botellas.rec." + cfg.n + "." + cfg.k + "." + cfg.intentos + "." + (cfg.rep ? "r" : "s"); }
      function textoRec() {
        var r = R.leer(claveRec(), null);
        if (r === null) return "Aún sin récord con esta configuración.";
        return "Mejor: " + r + (swap() ? (r === 1 ? " movimiento" : " movimientos") : (r === 1 ? " intento" : " intentos"));
      }
      function chips(t, k, lista) {
        return '<p class="campo-et sola">' + t + '</p><div class="chips">' + lista.map(function (x) {
          return '<button type="button" class="chip' + (String(cfg[k]) === String(x[0]) ? " sel" : "") + '" data-set="' + k + ":" + x[0] + '">' + x[1] + "</button>";
        }).join("") + "</div>";
      }
      function sl(k, et, min, max, u) {
        return '<label class="campo"><span class="campo-et">' + et + ' <b data-v="' + k + '">' + cfg[k] + (u || "") + '</b></span><input type="range" data-k="' + k + '" data-u="' + (u || "") + '" min="' + min + '" max="' + max + '" step="1" value="' + cfg[k] + '"></label>';
      }
      function pintarMuestra() { var m = ""; for (var i = 0; i < (swap() ? cfg.sn : cfg.k); i++) m += '<i title="' + nombreCol(i) + '">' + botella(i) + "</i>"; return m; }

      /* ---------------- configuración ---------------- */
      function pantallaConfig() {
        if (limpiar) { limpiar(); limpiar = null; }
        ajustar();
        var old = cont.querySelector(".lz-scroll"), prev = old ? old.scrollTop : 0, cuerpo;
        if (!swap()) {
          cuerpo = '<p class="nota">Adivina el orden secreto. Tras cada intento verás cuántas botellas tienen el color y el lugar correctos y cuántas solo el color.</p><h3>Tablero</h3>' +
            sl("n", "Botellas en la fila", 3, 10, "") + sl("k", fut() ? "Equipos distintos" : "Colores distintos", 3, COL.length, "") + '<div class="bt-muestra">' + pintarMuestra() + "</div>" +
            sl("intentos", "Intentos", 3, 20, "") +
            chips("Colores repetidos", "rep", [[false, "Sin repetir"], [true, "Con repetidos"]]) +
            chips("Marcar cada botella (verde: lugar correcto · naranjo: existe en otro lugar)", "marcas", [[1, "Sí"], [0, "Solo contadores"]]) +
            (!cfg.rep ? '<p class="nota">Sin repetir, los colores distintos nunca son menos que las botellas.</p>' : "");
        } else {
          cuerpo = '<p class="nota">Las botellas están desordenadas. Toca una y luego otra para intercambiarlas. El contador te dice cuántas están en su lugar correcto: descubre el orden secreto con la menor cantidad de movimientos.</p><h3>Estantería</h3>' +
            sl("sn", "Botellas", 3, 12, "") + '<div class="bt-muestra">' + pintarMuestra() + "</div>" +
            chips("Marcar cada botella (verde: en su lugar · naranjo: en lugar incorrecto)", "marcas", [[1, "Sí"], [0, "No"]]) +
            chips("Movimientos máximos", "smov", [[0, "Sin límite"], [10, "10"], [15, "15"], [20, "20"], [30, "30"], [50, "50"]]);
        }
        cont.innerHTML =
          '<section class="lz lz-config bt-cfg">' +
            '<header class="lz-top"><button class="volver" type="button" data-a="volver" aria-label="Volver al menú">←</button><h2>Botellas</h2></header>' +
            '<div class="lz-scroll"><div class="lz-col">' +
              "<h3>Modo</h3>" + chips("", "modo", [["adivinar", "Adivinar el orden"], ["swap", "Intercambiar"]]) + cuerpo +
              "<h3>Reglas</h3>" +
              chips("Tiempo límite", "tiempo", [[0, "Sin límite"], [1, "1 min"], [2, "2 min"], [3, "3 min"], [5, "5 min"]]) +
              chips(swap() ? "Pistas (colocan una botella en su lugar)" : "Pistas (revelan una botella)", "pistas", [[0, "Ninguna"], [1, "1"], [3, "3"], [99, "Ilimitadas"]]) +
              '<p class="record">' + textoRec() + "</p>" +
            "</div></div>" +
            '<footer class="lz-pie"><div class="lz-col"><button class="btn primario grande" type="button" data-a="jugar">Comenzar</button></div></footer>' +
          "</section>";
        var raiz = cont.querySelector(".bt-cfg");
        raiz.querySelector(".lz-scroll").scrollTop = prev;
        R.pintarRangos(raiz);
        raiz.addEventListener("input", function (e) {
          var k = e.target.dataset && e.target.dataset.k; if (!k) return;
          cfg[k] = +e.target.value; ajustar(); guardarCfg();
          ["n", "k", "intentos", "sn"].forEach(function (c) {
            var sp = raiz.querySelector('[data-v="' + c + '"]'); if (!sp) return;
            sp.textContent = cfg[c];
            var inp = raiz.querySelector('[data-k="' + c + '"]'); inp.value = cfg[c]; R.pintarRango(inp);
          });
          raiz.querySelector(".bt-muestra").innerHTML = pintarMuestra();
          raiz.querySelector(".record").textContent = textoRec();
        });
        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button"); if (!b) return;
          if (b.dataset.a === "volver") R.salir();
          else if (b.dataset.a === "jugar") { guardarCfg(); R.pedirJugador(cont, function (nombre) { jugadorNom = nombre; (swap() ? partidaSwap : partida)(); }, pantallaConfig); }
          else if (b.dataset.set) {
            var p = b.dataset.set.indexOf(":"), k = b.dataset.set.slice(0, p), v = b.dataset.set.slice(p + 1);
            cfg[k] = (k === "rep") ? v === "true" : (k === "modo" ? v : Number(v)); ajustar(); guardarCfg(); pantallaConfig();
          }
        });
      }

      function fondoNeon() { return '<div class="bt-fondo"><i class="t1"></i><i class="t2"></i><i class="t3"></i><b></b></div>'; }

      /* ---------------- modo: adivinar ---------------- */
      function partida() {
        if (destruido) return;
        var N = cfg.n, K = cfg.k, INT = cfg.intentos;
        var secreto = [], pool = []; for (var q = 0; q < K; q++) pool.push(q);
        for (var i = 0; i < N; i++) {
          if (cfg.rep) secreto.push(Math.floor(Math.random() * K));
          else secreto.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }
        var filas = [], actual = [], fin = false, t0 = Date.now(), pistasUsadas = 0, reveladas = {}, tmrs = [], ultimo = -1;
        var limite = cfg.tiempo * 60, maxPistas = cfg.pistas;

        var rows = "";
        for (var r = 0; r < INT; r++) {
          rows += '<div class="bt-fila" data-r="' + r + '"><span class="bt-n">' + (r + 1) + '</span><div class="bt-slots">';
          for (var s = 0; s < N; s++) rows += '<button type="button" class="bt-slot" data-s="' + s + '" tabindex="-1">' + botella(-1) + "</button>";
          rows += '</div><div class="bt-pistas"><span class="ok" title="Color y lugar correctos"><b>·</b></span><span class="cerca" title="Color correcto, lugar distinto"><b>·</b></span></div></div>';
        }
        var pal = ""; for (var c = 0; c < K; c++) pal += '<button type="button" class="bt-col" data-c="' + c + '" aria-label="' + nombreCol(c) + '">' + botella(c) + "</button>";
        cont.innerHTML =
          '<section class="bt" style="--n:' + N + ';--k:' + K + ';--pc:' + (K > 8 ? Math.ceil(K / 2) : K) + '">' + fondoNeon() +
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
          f.querySelectorAll(".bt-slot").forEach(function (b, s) {
            b.innerHTML = botella(actual[s] === undefined ? -1 : actual[s]);
            b.classList.toggle("lleno", actual[s] !== undefined);
            b.classList.toggle("cae", s === ultimo && actual[s] !== undefined);
          });
          ultimo = -1;
          var lleno = true; for (var s = 0; s < N; s++) if (actual[s] === undefined) lleno = false;
          btnOk.disabled = !lleno;
          var fe = raiz.querySelector(".bt-fila.act"); if (fe && fe.scrollIntoView) fe.scrollIntoView({ block: "nearest" });
        }
        function agregar(c) {
          if (fin) return;
          for (var s = 0; s < N; s++) if (actual[s] === undefined) { actual[s] = c; ultimo = s; R.tono && R.tono(500 + c * 50, 50, "sine", 0.12); pintarActual(); return; }
        }
        function quitar(s) { if (fin) return; if (s === undefined) { for (var k = N - 1; k >= 0; k--) if (actual[k] !== undefined) { s = k; break; } } if (s !== undefined) { actual[s] = undefined; pintarActual(); } }
        function evaluar(g) {
          var ex = 0, a = [], b = [];
          for (var i = 0; i < N; i++) { if (g[i] === secreto[i]) ex++; else { a.push(g[i]); b.push(secreto[i]); } }
          var cerca = 0;
          a.forEach(function (x) { var k = b.indexOf(x); if (k >= 0) { cerca++; b.splice(k, 1); } });
          /* marca por botella: 2 = lugar correcto, 1 = existe en otro lugar, 0 = no está */
          var marcas = [], resto = {};
          for (var q2 = 0; q2 < N; q2++) { marcas[q2] = 0; if (g[q2] === secreto[q2]) marcas[q2] = 2; else resto[secreto[q2]] = (resto[secreto[q2]] || 0) + 1; }
          for (var q3 = 0; q3 < N; q3++) if (!marcas[q3] && resto[g[q3]] > 0) { marcas[q3] = 1; resto[g[q3]]--; }
          return { ex: ex, cerca: cerca, marcas: marcas };
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
          f.querySelectorAll(".bt-slot").forEach(function (b, i) { b.style.animationDelay = i * 60 + "ms"; b.classList.remove("cae"); b.classList.add("salta"); if (cfg.marcas) b.classList.add(ev.marcas[i] === 2 ? "m-ok" : ev.marcas[i] === 1 ? "m-cerca" : "m-no"); });
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
          try {
            R.registrarPartida(jugadorNom, { juego: "Botellas", modo: "Adivinar · " + (cfg.rep ? "con repetidos" : "sin repetir"), config: N + " botellas · " + K + " colores · " + INT + " intentos" + (cfg.tiempo ? " · " + cfg.tiempo + " min" : "") + (pistasUsadas ? " · " + pistasUsadas + " pistas" : ""), valor: n, unidad: "intentos", mejorEs: "min", stats: { aciertos: n, fallos: n - 1, precision: Math.round(100 / n) } });
          } catch (e) {}
          var rec = R.leer(claveRec(), null), nuevo = rec === null || n < rec;
          if (nuevo) R.guardar(claveRec(), n);
          tmrs.push(setTimeout(function () {
            if (destruido) return;
            ov.innerHTML = '<div class="bt-card"><div class="bt-cinta"><b>¡Resuelto!</b></div>' + "<p>Adivinaste el orden en <b>" + n + "</b> " + (n === 1 ? "intento" : "intentos") + " (" + seg + " s).</p>" + (nuevo ? '<span class="insignia">Nuevo récord</span>' : "") + '<button class="bt-btn" type="button" data-a="reiniciar">Jugar de nuevo</button><button class="bt-btn suave" type="button" data-a="ver">Ver tablero</button><button class="bt-btn suave" type="button" data-a="config">Configurar</button></div>';
            ov.hidden = false;
          }, 1000));
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
          ov.innerHTML = '<div class="bt-card"><h3>Reglas rápidas</h3><ol class="bt-reglas"><li>Hay una fila secreta de <b>' + N + ' botellas</b> (' + K + " " + (fut() ? "equipos" : "colores") + " posibles" + (cfg.rep ? ", pueden repetirse" : ", sin repetir") + ").</li><li>Tienes <b>" + INT + " intentos</b>" + (limite ? " y <b>" + cfg.tiempo + " min</b>" : "") + " para adivinar el orden exacto.</li><li>Toca las botellas de abajo para llenar tu fila y presiona <b>Comprobar</b>.</li><li>Al lado verás dos pistas: <b class=\"v\">●</b> correcta en su lugar, <b class=\"a\">●</b> correcta pero en otro lugar.</li><li>Toca una botella de tu fila para quitarla.</li></ol>" +
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

      /* ---------------- modo: intercambiar ---------------- */
      function partidaSwap() {
        if (destruido) return;
        var N = cfg.sn, maxMov = cfg.smov, limite = cfg.tiempo * 60, maxPistas = cfg.pistas;
        var pool = []; for (var q = 0; q < COL.length; q++) pool.push(q);
        var cols = []; while (cols.length < N) cols.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        var secreto = cols.slice(); /* secreto[slot] = color correcto */
        var orden = cols.slice(); /* orden[slot] = color que hay ahora */
        function aciertos() { var n = 0; for (var i = 0; i < N; i++) if (orden[i] === secreto[i]) n++; return n; }
        do { for (var k = N - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)), t = orden[k]; orden[k] = orden[j]; orden[j] = t; } } while (aciertos() === N || (N > 3 && aciertos() > 1));
        var movs = 0, sel = -1, ocupado = false, fin = false, t0 = Date.now(), pistasUsadas = 0, tmrs = [];
        var botellas = {}; /* color -> elemento */

        var shelf = "";
        orden.forEach(function (c) { shelf += '<div class="bs-b" data-c="' + c + '"><div class="bs-i">' + botella(c) + "</div></div>"; });
        cont.innerHTML =
          '<section class="bt bs" style="--n:' + N + '">' + fondoNeon() +
            '<header class="bt-top"><button class="bt-b" type="button" data-a="salir" aria-label="Volver">←</button><div class="bs-cinta"><b>Botellas</b><small>Movimientos <span class="bs-mov">0</span>' + (maxMov ? " / " + maxMov : "") + '<span class="bt-reloj"></span></small></div>' +
              '<div class="bt-acc"><button class="bt-b" type="button" data-a="reglas" aria-label="Reglas">?</button><button class="bt-b" type="button" data-a="reiniciar" aria-label="Reiniciar">↻</button></div></header>' +
            '<div class="bs-escena"><div class="bs-luces"><i></i><i></i><i></i></div><div class="bs-cuenta"><b class="bs-n">0</b><span>/' + N + '</span><em class="bs-d"></em></div>' +
              '<div class="bs-estante"><div class="bs-fila">' + shelf + '</div><div class="bs-tabla"></div></div>' +
              '<p class="bs-guia">Toca una botella y luego dónde va</p></div>' +
            '<div class="bt-pie bs-pie' + (maxPistas ? " con-pista" : "") + '">' + (maxPistas ? '<button type="button" class="bt-btn suave" data-a="pista">Pista <span class="bt-np"></span></button>' : "") + "</div>" +
            '<div class="bt-ov" hidden></div>' +
          "</section>";
        var raiz = cont.querySelector(".bs"), fila = raiz.querySelector(".bs-fila"), ov = raiz.querySelector(".bt-ov");
        var elN = raiz.querySelector(".bs-n"), elD = raiz.querySelector(".bs-d"), elMov = raiz.querySelector(".bs-mov"), reloj = raiz.querySelector(".bt-reloj");
        var btnPista = raiz.querySelector('[data-a="pista"]');
        fila.querySelectorAll(".bs-b").forEach(function (e) { botellas[e.dataset.c] = e; });
        function pintarPistas() { if (btnPista) { var q = maxPistas >= 99 ? "∞" : String(maxPistas - pistasUsadas); btnPista.querySelector(".bt-np").textContent = "(" + q + ")"; btnPista.disabled = fin || (maxPistas < 99 && pistasUsadas >= maxPistas); } }
        pintarPistas();
        function ancho() { return fila.clientWidth / N; }
        function colocar() {
          var w = ancho();
          orden.forEach(function (c, s) { var e = botellas[c]; e.style.width = w + "px"; e.style.transform = "translateX(" + (s * w) + "px)"; });
        }
        colocar();
        var ro = window.ResizeObserver ? new ResizeObserver(colocar) : null; if (ro) ro.observe(fila);
        function marcador(n, ant) {
          elN.textContent = n;
          var d = n - ant;
          if (d) { elD.textContent = (d > 0 ? "+" : "") + d; elD.className = "bs-d " + (d > 0 ? "mas" : "menos"); void elD.offsetWidth; elD.classList.add("v"); }
          raiz.querySelector(".bs-cuenta").classList.toggle("lleno", n === N);
        }
        marcador(aciertos(), aciertos()); marcarTodas();
        function marcarTodas() {
          fila.querySelectorAll(".bs-b").forEach(function (e) {
            var s = orden.indexOf(+e.dataset.c), bien = orden[s] === secreto[s];
            e.classList.toggle("ok", cfg.marcas && bien); e.classList.toggle("cerca", !!cfg.marcas && !bien);
          });
        }
        function intercambiar(a, b) {
          ocupado = true;
          var ant = aciertos(), ca = orden[a], cb = orden[b];
          orden[a] = cb; orden[b] = ca;
          var ea = botellas[ca], eb = botellas[cb];
          ea.classList.add("mueve"); eb.classList.add("mueve"); ea.classList.remove("sel");
          colocar(); movs++; elMov.textContent = movs;
          R.tono && R.tono(420, 70, "triangle", 0.12);
          tmrs.push(setTimeout(function () {
            ea.classList.remove("mueve"); eb.classList.remove("mueve"); ea.classList.add("cae"); eb.classList.add("cae");
            tmrs.push(setTimeout(function () { ea.classList.remove("cae"); eb.classList.remove("cae"); }, 380));
            var n = aciertos(); marcador(n, ant);
            [[ea, ca, a, b], [eb, cb, b, a]].forEach(function (x) { if (orden[x[3]] === secreto[x[3]] && x[0]) x[0].classList.add("ok"); });
            marcarTodas();
            if (n > ant) { R.fb && R.fb.ok && R.fb.ok(); } else if (n < ant) { R.fb && R.fb.mal && R.fb.mal(); } else R.vibrar && R.vibrar(10);
            ocupado = false;
            if (n === N) ganar();
            else if (maxMov && movs >= maxMov) perder("Se acabaron los movimientos");
          }, 420));
        }
        function tocar(e) {
          if (fin || ocupado) return;
          var s = orden.indexOf(+e.dataset.c);
          if (sel < 0) { sel = s; e.classList.add("sel"); R.tono && R.tono(660, 50, "sine", 0.1); }
          else if (sel === s) { e.classList.remove("sel"); sel = -1; }
          else { var a = sel; sel = -1; intercambiar(a, s); }
        }
        function pistaYa() {
          if (fin || ocupado || (btnPista && btnPista.disabled)) return;
          var malos = []; for (var i = 0; i < N; i++) if (orden[i] !== secreto[i]) malos.push(i);
          if (!malos.length) return;
          var s = malos[Math.floor(Math.random() * malos.length)], de = orden.indexOf(secreto[s]);
          pistasUsadas++; pintarPistas();
          fila.querySelectorAll(".bs-b.sel").forEach(function (x) { x.classList.remove("sel"); }); sel = -1;
          intercambiar(de, s);
        }
        function revelar() { /* todas en su lugar */ }
        function parar() { fin = true; clearInterval(reloj_id); if (btnPista) btnPista.disabled = true; }
        function ganar() {
          parar(); R.fb && R.fb.fin && R.fb.fin();
          var seg = Math.round((Date.now() - t0) / 1000), n = movs;
          try { R.registrarPartida(jugadorNom, { juego: "Botellas", modo: "Intercambiar", config: N + " botellas" + (maxMov ? " · máx " + maxMov + " mov" : "") + (cfg.tiempo ? " · " + cfg.tiempo + " min" : "") + (pistasUsadas ? " · " + pistasUsadas + " pistas" : ""), valor: n, unidad: "movimientos", mejorEs: "min", stats: { aciertos: N, fallos: Math.max(0, n - N), precision: Math.round(Math.min(100, N / Math.max(1, n) * 100)) } }); } catch (e) {}
          var rec = R.leer(claveRec(), null), nuevo = rec === null || n < rec; if (nuevo) R.guardar(claveRec(), n);
          tmrs.push(setTimeout(function () {
            if (destruido) return;
            ov.innerHTML = '<div class="bt-card"><div class="bt-cinta"><b>¡Resuelto!</b></div>' + "<p><b>" + n + "</b> " + (n === 1 ? "movimiento" : "movimientos") + " · " + seg + " s</p>" + (nuevo ? '<span class="insignia">Nuevo récord</span>' : "<p>Mejor: " + rec + "</p>") + '<button class="bt-btn" type="button" data-a="reiniciar">Jugar de nuevo</button><button class="bt-btn suave" type="button" data-a="ver">Ver estantería</button><button class="bt-btn suave" type="button" data-a="config">Configurar</button></div>';
            ov.hidden = false;
          }, 900));
        }
        function perder(motivo) {
          parar(); R.fb && R.fb.mal && R.fb.mal();
          tmrs.push(setTimeout(function () {
            if (destruido) return;
            ov.innerHTML = '<div class="bt-card"><h3>' + motivo + '</h3><p>Llevabas ' + aciertos() + " de " + N + ' bien puestas.</p><button class="bt-btn" type="button" data-a="reiniciar">Jugar de nuevo</button><button class="bt-btn suave" type="button" data-a="ver">Ver estantería</button><button class="bt-btn suave" type="button" data-a="config">Configurar</button></div>';
            ov.hidden = false;
          }, 700));
        }
        function reglas() {
          ov.innerHTML = '<div class="bt-card"><h3>Reglas rápidas</h3><ol class="bt-reglas"><li>Hay un orden secreto para las <b>' + N + " botellas</b>.</li><li>Toca una botella para levantarla y luego otra: <b>se intercambian</b>.</li><li>El contador muestra cuántas están en su lugar correcto (<b>+1</b>, <b>−1</b>…).</li><li>Úsalo para deducir el orden con los menos movimientos posibles" + (maxMov ? " (máximo " + maxMov + ")" : "") + (limite ? " y en menos de " + cfg.tiempo + " min" : "") + ".</li></ol>" +
            '<button class="bt-btn" type="button" data-a="cerrar">Entendido</button></div>';
          ov.hidden = false;
        }
        var reloj_id = setInterval(function () {
          if (fin) return;
          if (limite) {
            var resto = limite - Math.round((Date.now() - t0) / 1000); reloj.textContent = " · " + Math.floor(resto / 60) + ":" + ("0" + (resto % 60)).slice(-2);
            if (resto <= 0) perder("Se acabó el tiempo");
          }
        }, 500);
        if (limite) reloj.textContent = " · " + cfg.tiempo + ":00";
        function clean() { clearInterval(reloj_id); tmrs.forEach(clearTimeout); if (ro) ro.disconnect(); }
        limpiar = clean;
        raiz.addEventListener("click", function (e) {
          var bb = e.target.closest(".bs-b"); if (bb) { tocar(bb); return; }
          var b = e.target.closest("button"); if (!b) return;
          var a = b.dataset.a;
          if (a === "salir") { clean(); R.salir(); }
          else if (a === "pista") pistaYa();
          else if (a === "reglas") reglas();
          else if (a === "cerrar" || a === "ver") ov.hidden = true;
          else if (a === "reiniciar") { clean(); partidaSwap(); }
          else if (a === "config") { clean(); pantallaConfig(); }
        });
      }

      pantallaConfig();
      return function () { destruido = true; if (limpiar) limpiar(); };
    }
  });
})(window.Reacciona);
