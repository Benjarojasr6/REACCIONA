/* Juego: Gato (tres en línea). Tablero de 3×3 a 8×8, línea de 3 a 5, contra la IA (4 dificultades) o contra otra persona. */
(function (R) {
  var NIVELES = ["Fácil", "Normal", "Difícil", "Imposible"];
  var DEF = { modo: "ia", tam: 3, linea: 3, nivel: 1, empieza: "yo", serie: 1, pistas: 3, retirar: 1 };
  var DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

  /* ---------- lógica ---------- */
  function ganaEn(b, n, k, i, j) { /* ¿la ficha puesta en (i,j) completa una línea? */
    var p = b[j * n + i];
    if (!p) return null;
    for (var d = 0; d < 4; d++) {
      var dx = DIRS[d][0], dy = DIRS[d][1], cel = [j * n + i], x, y;
      x = i + dx; y = j + dy; while (x >= 0 && y >= 0 && x < n && y < n && b[y * n + x] === p) { cel.push(y * n + x); x += dx; y += dy; }
      x = i - dx; y = j - dy; while (x >= 0 && y >= 0 && x < n && y < n && b[y * n + x] === p) { cel.push(y * n + x); x -= dx; y -= dy; }
      if (cel.length >= k) return cel;
    }
    return null;
  }
  function candidatas(b, n) {
    var c = [], lleno = true, i, j, di, dj;
    for (i = 0; i < n * n; i++) if (b[i]) { lleno = false; break; }
    if (lleno) return [Math.floor(n / 2) * n + Math.floor(n / 2)];
    var cerca = n <= 4 ? 4 : 2;
    for (j = 0; j < n; j++) for (i = 0; i < n; i++) {
      if (b[j * n + i]) continue;
      var ok = false;
      for (dj = -cerca; dj <= cerca && !ok; dj++) for (di = -cerca; di <= cerca; di++) {
        var x = i + di, y = j + dj;
        if (x >= 0 && y >= 0 && x < n && y < n && b[y * n + x]) { ok = true; break; }
      }
      if (ok) c.push(j * n + i);
    }
    return c;
  }
  function evaluar(b, n, k, yo) { /* a favor de "yo" */
    var tot = 0, i, j, d, t, otro = 3 - yo;
    for (j = 0; j < n; j++) for (i = 0; i < n; i++) for (d = 0; d < 4; d++) {
      var ex = i + DIRS[d][0] * (k - 1), ey = j + DIRS[d][1] * (k - 1);
      if (ex < 0 || ey < 0 || ex >= n || ey >= n) continue;
      var a = 0, o = 0;
      for (t = 0; t < k; t++) { var v = b[(j + DIRS[d][1] * t) * n + i + DIRS[d][0] * t]; if (v === yo) a++; else if (v === otro) o++; }
      if (a && o) continue;
      if (a) tot += Math.pow(10, a); else if (o) tot -= Math.pow(10, o) * 1.1;
    }
    return tot;
  }
  function negamax(b, n, k, turno, yo, prof, alfa, beta, ult, lim) {
    /* valor desde el punto de vista de "turno" */
    if (ult >= 0) {
      var ci = ult % n, cj = (ult - ci) / n;
      if (ganaEn(b, n, k, ci, cj)) return -100000 - prof;
    }
    var c = candidatas(b, n);
    if (!c.length) return 0;
    if (prof === 0 || Date.now() > lim.t) { lim.corte = lim.corte || Date.now() > lim.t; return evaluar(b, n, k, turno); }
    /* ordenar por cercanía al centro */
    var m = (n - 1) / 2;
    c.sort(function (p, q) { return (Math.abs(p % n - m) + Math.abs(Math.floor(p / n) - m)) - (Math.abs(q % n - m) + Math.abs(Math.floor(q / n) - m)); });
    var mejor = -Infinity;
    for (var s = 0; s < c.length; s++) {
      b[c[s]] = turno;
      var v = -negamax(b, n, k, 3 - turno, yo, prof - 1, -beta, -alfa, c[s], lim);
      b[c[s]] = 0;
      if (v > mejor) mejor = v;
      if (mejor > alfa) alfa = mejor;
      if (alfa >= beta) break;
    }
    return mejor;
  }
  function jugadaGanadora(b, n, k, p) {
    var c = candidatas(b, n);
    for (var s = 0; s < c.length; s++) {
      b[c[s]] = p; var i = c[s] % n, j = (c[s] - i) / n, g = ganaEn(b, n, k, i, j); b[c[s]] = 0;
      if (g) return c[s];
    }
    return -1;
  }
  function elegir(b, n, k, p, nivel) {
    var c = candidatas(b, n);
    if (!c.length) return -1;
    var azar = function () { return c[Math.floor(Math.random() * c.length)]; };
    var w = jugadaGanadora(b, n, k, p);
    if (nivel === 0) {
      if (w >= 0 && Math.random() < 0.6) return w;
      var bl0 = jugadaGanadora(b, n, k, 3 - p); if (bl0 >= 0 && Math.random() < 0.35) return bl0;
      return azar();
    }
    if (w >= 0) return w;
    var bl = jugadaGanadora(b, n, k, 3 - p); if (bl >= 0) return bl;
    var prof, ms;
    if (nivel === 1) { prof = 1; ms = 150; }
    else if (nivel === 2) { prof = n === 3 ? 4 : 3; ms = 450; }
    else { prof = n === 3 ? 9 : 7; ms = 1000; }
    var lim = { t: Date.now() + ms }, mejorJ = [], mejorV = -Infinity;
    for (var d = 1; d <= prof; d++) {
      var tmpJ = [], tmpV = -Infinity;
      c.sort(function (x, y) { return 0; });
      for (var s = 0; s < c.length; s++) {
        b[c[s]] = p;
        var v = -negamax(b, n, k, 3 - p, p, d - 1, -Infinity, Infinity, c[s], lim);
        b[c[s]] = 0;
        if (v > tmpV) { tmpV = v; tmpJ = [c[s]]; } else if (v === tmpV) tmpJ.push(c[s]);
        if (Date.now() > lim.t) break;
      }
      if (lim.corte) break;
      mejorJ = tmpJ; mejorV = tmpV;
      if (mejorV > 50000) break;
    }
    if (!mejorJ.length) return azar();
    if (nivel === 1 && Math.random() < 0.25) return azar();
    return mejorJ[Math.floor(Math.random() * mejorJ.length)];
  }
  R._gato = { elegir: elegir, ganaEn: ganaEn };

  /* ---------- interfaz ---------- */
  function chips(t, k, lista, act) {
    return '<p class="campo-et sola">' + t + '</p><div class="chips">' + lista.map(function (x) {
      return '<button type="button" class="chip' + (String(x[0]) === String(act) ? " sel" : "") + '" data-set="' + k + ":" + x[0] + '">' + x[1] + "</button>";
    }).join("") + "</div>";
  }

  R.registrar({
    id: "gato",
    nombre: "Gato",
    descripcion: "Tres en línea contra la IA o contra otra persona. Tableros de 3×3 a 8×8.",
    preview: function () {
      return R.html('<span class="pv-gato"><i class="x"></i><i class="o"></i><i></i><i class="o"></i><i class="x"></i><i></i><i></i><i></i><i class="x"></i></span>');
    },
    iniciar: function (cont) {
      var cfg = Object.assign({}, DEF, R.leer("gato.cfg", {}));
      var limpiar = null, jugadorNom = null;
      function guardar() { R.guardar("gato.cfg", cfg); }
      function ajustar() {
        if (cfg.linea > cfg.tam) cfg.linea = cfg.tam;
        if (cfg.tam >= 5 && cfg.linea < 4 && cfg.tam >= 6) cfg.linea = Math.max(cfg.linea, 3);
      }
      function clave() { return "gato.rec." + cfg.tam + "." + cfg.linea + "." + cfg.nivel; }

      function pantallaConfig() {
        if (limpiar) { limpiar(); limpiar = null; }
        ajustar();
        var old = cont.querySelector(".lz-scroll"), prev = old ? old.scrollTop : 0;
        var ia = cfg.modo === "ia", maxL = Math.min(5, cfg.tam), ops = [];
        for (var l = 3; l <= maxL; l++) ops.push([l, l + " en línea"]);
        cont.innerHTML =
          '<section class="lz lz-config gt-cfg">' +
            '<header class="lz-top"><button class="volver" type="button" data-a="volver" aria-label="Volver al menú">←</button><h2>Gato</h2></header>' +
            '<div class="lz-scroll"><div class="lz-col">' +
              '<p class="nota">Pon tus fichas en el tablero y forma una línea antes que tu rival.</p>' +
              "<h3>Modo</h3>" + chips("", "modo", [["ia", "Contra la IA"], ["persona", "Dos personas"]], cfg.modo) +
              (ia ? chips("Dificultad de la IA", "nivel", NIVELES.map(function (n, i) { return [i, n]; }), cfg.nivel) : "") +
              (ia ? chips("¿Quién empieza?", "empieza", [["yo", "Yo"], ["ia", "La IA"], ["alt", "Se turnan"]], cfg.empieza) : chips("¿Quién empieza?", "empieza", [["yo", "Jugador 1"], ["ia", "Jugador 2"], ["alt", "Se turnan"]], cfg.empieza)) +
              "<h3>Tablero</h3>" +
              chips("Tamaño", "tam", [3, 4, 5, 6, 7, 8].map(function (n) { return [n, n + "×" + n]; }), cfg.tam) +
              chips("Línea para ganar", "linea", ops, cfg.linea) +
              "<h3>Reglas</h3>" +
              chips("Partidas a ganar", "serie", [[1, "1 partida"], [2, "Mejor de 3"], [3, "Mejor de 5"]], cfg.serie) +
              chips("Retirar jugada", "retirar", [[1, "Permitido"], [0, "No"]], cfg.retirar) +
              chips("Pistas", "pistas", [[0, "Ninguna"], [3, "3"], [99, "Ilimitadas"]], cfg.pistas) +
              (ia ? '<p class="record">' + (R.leer(clave(), null) === null ? "Aún sin victorias con esta configuración." : "Mejor victoria: en " + R.leer(clave(), null) + " jugadas.") + "</p>" : "") +
            "</div></div>" +
            '<footer class="lz-pie"><div class="lz-col"><button class="btn primario grande" type="button" data-a="jugar">Comenzar</button></div></footer>' +
          "</section>";
        var raiz = cont.querySelector(".gt-cfg");
        raiz.querySelector(".lz-scroll").scrollTop = prev;
        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button"); if (!b) return;
          if (b.dataset.a === "volver") R.salir();
          else if (b.dataset.a === "jugar") {
            guardar();
            if (cfg.modo === "ia") R.pedirJugador(cont, function (n) { jugadorNom = n; partida(); }, pantallaConfig);
            else { jugadorNom = null; partida(); }
          } else if (b.dataset.set) {
            var p = b.dataset.set.indexOf(":"), k = b.dataset.set.slice(0, p), v = b.dataset.set.slice(p + 1);
            cfg[k] = (k === "modo" || k === "empieza") ? v : Number(v); ajustar(); guardar(); pantallaConfig();
          }
        });
      }

      function partida() {
        var n = cfg.tam, K = cfg.linea, ia = cfg.modo === "ia";
        var marc = [0, 0], empates = 0, ronda = 0, S = null, tm = [];
        var nomJ1 = ia ? "Tú" : "Jugador 1", nomJ2 = ia ? "IA" : "Jugador 2";
        function after(fn, ms) { var id = setTimeout(fn, ms); tm.push(id); return id; }

        cont.innerHTML =
          '<section class="gt" style="--n:' + n + '">' +
            '<header class="gt-top"><button class="gt-b" type="button" data-a="salir" aria-label="Salir">←</button><div class="gt-tit"><b>Gato</b><small>' + (ia ? NIVELES[cfg.nivel] : "Dos personas") + " · " + n + "×" + n + " · " + K + ' en línea</small></div><button class="gt-b" type="button" data-a="reiniciar" aria-label="Reiniciar">↻</button></header>' +
            '<div class="gt-marcador"><div class="gt-jug j1"><span class="mk x"></span><b>' + nomJ1 + '</b><em data-m="0">0</em></div><span class="gt-vs">VS</span><div class="gt-jug j2"><span class="mk o"></span><b>' + nomJ2 + '</b><em data-m="1">0</em></div></div>' +
            '<p class="gt-estado"></p>' +
            '<div class="gt-area"><div class="gt-tablero"></div></div>' +
            '<div class="gt-pie">' +
              (cfg.retirar ? '<button type="button" class="gt-btn" data-a="retirar"><i>↶</i>Retirar</button>' : "") +
              (cfg.pistas ? '<button type="button" class="gt-btn" data-a="pista"><i>💡</i>Pista <span class="gt-np"></span></button>' : "") +
            "</div>" +
            '<div class="gt-ov" hidden></div>' +
          "</section>";
        var raiz = cont.querySelector(".gt"), tab = raiz.querySelector(".gt-tablero"), est = raiz.querySelector(".gt-estado"), ov = raiz.querySelector(".gt-ov");
        var celdas = "";
        for (var i = 0; i < n * n; i++) celdas += '<button type="button" class="gt-c" data-i="' + i + '"></button>';
        tab.innerHTML = celdas;
        var els = tab.querySelectorAll(".gt-c");

        function nuevaRonda() {
          ronda++;
          var primero = cfg.empieza === "yo" ? 1 : cfg.empieza === "ia" ? 2 : ((ronda % 2) ? 1 : 2);
          S = { b: new Int8Array(n * n), turno: primero, hist: [], fin: false, pensando: false, pistas: cfg.pistas, pistaIdx: -1, primero: primero };
          pintar();
          if (ia && S.turno === 2) mueveIA();
        }
        function textoTurno() {
          if (S.fin) return "";
          if (ia) return S.turno === 1 ? "Tu turno" : "Pensando…";
          return "Turno de " + (S.turno === 1 ? nomJ1 : nomJ2);
        }
        function pintar() {
          for (var i = 0; i < els.length; i++) {
            var v = S.b[i], e = els[i];
            e.className = "gt-c" + (v ? " p" + v : "") + (i === S.pistaIdx ? " pista" : "");
            e.innerHTML = v ? '<span class="mk ' + (v === 1 ? "x" : "o") + '"></span>' : "";
          }
          est.textContent = textoTurno();
          raiz.querySelector('[data-m="0"]').textContent = marc[0]; raiz.querySelector('[data-m="1"]').textContent = marc[1];
          raiz.querySelector(".j1").classList.toggle("turno", !S.fin && S.turno === 1);
          raiz.querySelector(".j2").classList.toggle("turno", !S.fin && S.turno === 2);
          var np = raiz.querySelector(".gt-np"); if (np) np.textContent = "(" + (cfg.pistas >= 99 ? "∞" : S.pistas) + ")";
        }
        function poner(i) {
          S.b[i] = S.turno; S.hist.push(i); S.pistaIdx = -1;
          R.tono && R.tono(S.turno === 1 ? 620 : 480, 70, "sine", 0.12); R.vibrar && R.vibrar(10);
          var x = i % n, y = (i - x) / n, g = ganaEn(S.b, n, K, x, y);
          if (g) { S.fin = true; pintar(); g.forEach(function (c) { els[c].classList.add("gana"); }); marc[S.turno - 1]++; pintar(); after(function () { cierre(S.turno); }, 900); return; }
          var libre = false; for (var q = 0; q < S.b.length; q++) if (!S.b[q]) { libre = true; break; }
          if (!libre) { S.fin = true; empates++; pintar(); after(function () { cierre(0); }, 600); return; }
          S.turno = 3 - S.turno; pintar();
        }
        function mueveIA() {
          S.pensando = true; pintar();
          after(function () {
            if (!S || S.fin) return;
            var j = elegir(S.b, n, K, 2, cfg.nivel);
            S.pensando = false;
            if (j >= 0) poner(j);
            if (!S.fin && ia && S.turno === 2) mueveIA();
          }, 380);
        }
        function clic(i) {
          if (!S || S.fin || S.pensando || S.b[i]) return;
          if (ia && S.turno !== 1) return;
          poner(i);
          if (!S.fin && ia && S.turno === 2) mueveIA();
        }
        function retirar() {
          if (!cfg.retirar || !S || S.fin || S.pensando || !S.hist.length) return;
          if (ia) {
            if (!S.hist.some(function (i) { return S.b[i] === 1; })) return;
            while (S.hist.length) { var j = S.hist.pop(), humano = S.b[j] === 1; S.b[j] = 0; if (humano) break; }
            S.turno = 1;
          } else { var u = S.hist.pop(); S.turno = S.b[u]; S.b[u] = 0; }
          S.pistaIdx = -1; pintar();
        }
        function pista() {
          if (!S || S.fin || S.pensando || !cfg.pistas || (ia && S.turno !== 1)) return;
          if (cfg.pistas < 99 && S.pistas <= 0) { est.textContent = "Ya no quedan pistas"; return; }
          var j = elegir(S.b, n, K, S.turno, 2);
          if (j < 0) return;
          if (cfg.pistas < 99) S.pistas--;
          S.pistaIdx = j; pintar();
        }
        function cierre(ganador) {
          var termina = marc[0] >= cfg.serie || marc[1] >= cfg.serie;
          var titulo = ganador === 0 ? "¡Empate!" : (ia ? (ganador === 1 ? "¡Ganaste!" : "Ganó la IA") : "Ganó " + (ganador === 1 ? nomJ1 : nomJ2));
          var html = '<div class="gt-card"><h3>' + titulo + "</h3>";
          if (cfg.serie > 1 || termina) html += "<p>Marcador: " + marc[0] + " – " + marc[1] + (empates ? " (empates: " + empates + ")" : "") + "</p>";
          if (termina) {
            var campeon = marc[0] >= cfg.serie ? 1 : 2;
            html += "<p><b>" + (ia ? (campeon === 1 ? "¡Ganaste la serie!" : "La IA ganó la serie") : "Ganó la serie " + (campeon === 1 ? nomJ1 : nomJ2)) + "</b></p>";
            if (ia && campeon === 1) {
              var jug = S.hist.length ? Math.ceil(S.hist.length / 2) : 0, rec = R.leer(clave(), null), nuevo = false;
              if (rec === null || jug < rec) { R.guardar(clave(), jug); nuevo = true; }
              try { R.registrarPartida(jugadorNom, { juego: "Gato", modo: "vs IA · " + NIVELES[cfg.nivel], config: n + "×" + n + " · " + K + " en línea", valor: jug, unidad: "jugadas", mejorEs: "min", stats: { aciertos: marc[0], fallos: marc[1], precision: Math.round(marc[0] / Math.max(1, marc[0] + marc[1] + empates) * 100) } }); } catch (e) {}
              if (nuevo) html += '<span class="insignia">Nuevo récord</span>';
            }
            html += '<button class="gt-bt" type="button" data-a="otra">Jugar otra serie</button><button class="gt-bt suave" type="button" data-a="config">Configurar</button><button class="gt-bt suave" type="button" data-a="salir">Menú</button>';
          } else html += '<button class="gt-bt" type="button" data-a="sig">Siguiente partida</button><button class="gt-bt suave" type="button" data-a="ver">Ver tablero</button>';
          ov.innerHTML = html + "</div>"; ov.hidden = false;
        }
        function limpia() { tm.forEach(clearTimeout); tm = []; if (S) S.fin = true; }
        limpiar = limpia;
        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button"); if (!b) return;
          var a = b.dataset.a;
          if (b.classList.contains("gt-c")) clic(+b.dataset.i);
          else if (a === "salir") { limpia(); limpiar = null; R.salir(); }
          else if (a === "reiniciar") { limpia(); partida(); }
          else if (a === "retirar") retirar();
          else if (a === "pista") pista();
          else if (a === "sig") { ov.hidden = true; nuevaRonda(); }
          else if (a === "ver") ov.hidden = true;
          else if (a === "otra") { limpia(); partida(); }
          else if (a === "config") { limpia(); limpiar = null; pantallaConfig(); }
        });
        R.mantenerPantalla(true);
        nuevaRonda();
      }

      pantallaConfig();
      return function () { if (limpiar) limpiar(); R.mantenerPantalla(false); };
    }
  });
})(window.Reacciona);
