/* Juego: Conecta 4. Tablero configurable (columnas, filas, fichas a conectar), contra la IA (4 dificultades) o dos personas. */
(function (R) {
  var NIVELES = ["Fácil", "Normal", "Difícil", "Imposible"];
  var DEF = { modo: "ia", nivel: 1, empieza: "yo", cols: 7, filas: 6, conectar: 4, tiempo: 0, serie: 1, pistas: 3, retirar: 1 };
  var DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

  function ganaEn(b, C, F, K, c, r) {
    var p = b[r * C + c]; if (!p) return null;
    for (var d = 0; d < 4; d++) {
      var dx = DIRS[d][0], dy = DIRS[d][1], cel = [r * C + c], x, y;
      x = c + dx; y = r + dy; while (x >= 0 && y >= 0 && x < C && y < F && b[y * C + x] === p) { cel.push(y * C + x); x += dx; y += dy; }
      x = c - dx; y = r - dy; while (x >= 0 && y >= 0 && x < C && y < F && b[y * C + x] === p) { cel.push(y * C + x); x -= dx; y -= dy; }
      if (cel.length >= K) return cel;
    }
    return null;
  }
  function filaLibre(b, C, F, c) { for (var r = F - 1; r >= 0; r--) if (!b[r * C + c]) return r; return -1; }
  function evaluar(b, C, F, K, yo) {
    var tot = 0, i, j, d, t, otro = 3 - yo, mid = (C - 1) / 2;
    for (j = 0; j < F; j++) for (i = 0; i < C; i++) {
      var v0 = b[j * C + i];
      if (v0) { var cen = (mid - Math.abs(i - mid)) * 2; tot += v0 === yo ? cen : -cen; }
      for (d = 0; d < 4; d++) {
        var ex = i + DIRS[d][0] * (K - 1), ey = j + DIRS[d][1] * (K - 1);
        if (ex < 0 || ey < 0 || ex >= C || ey >= F) continue;
        var a = 0, o = 0;
        for (t = 0; t < K; t++) { var v = b[(j + DIRS[d][1] * t) * C + i + DIRS[d][0] * t]; if (v === yo) a++; else if (v === otro) o++; }
        if (a && o) continue;
        if (a) tot += Math.pow(8, a); else if (o) tot -= Math.pow(8, o) * 1.15;
      }
    }
    return tot;
  }
  function orden(C) { var o = [], m = (C - 1) / 2; for (var c = 0; c < C; c++) o.push(c); o.sort(function (a, b) { return Math.abs(a - m) - Math.abs(b - m); }); return o; }
  function negamax(b, C, F, K, turno, prof, alfa, beta, ult, lim, ord) {
    if (ult) {
      var cg = ult[0], rg = ult[1];
      if (ganaEn(b, C, F, K, cg, rg)) return -100000 - prof;
    }
    var hay = false, s;
    for (s = 0; s < C; s++) if (!b[s]) { hay = true; break; }
    if (!hay) return 0;
    if (prof === 0 || Date.now() > lim.t) { if (Date.now() > lim.t) lim.corte = true; return evaluar(b, C, F, K, turno); }
    var mejor = -Infinity;
    for (s = 0; s < ord.length; s++) {
      var c = ord[s], r = filaLibre(b, C, F, c); if (r < 0) continue;
      b[r * C + c] = turno;
      var v = -negamax(b, C, F, K, 3 - turno, prof - 1, -beta, -alfa, [c, r], lim, ord);
      b[r * C + c] = 0;
      if (v > mejor) mejor = v;
      if (mejor > alfa) alfa = mejor;
      if (alfa >= beta) break;
    }
    return mejor;
  }
  function ganadora(b, C, F, K, p) {
    for (var c = 0; c < C; c++) {
      var r = filaLibre(b, C, F, c); if (r < 0) continue;
      b[r * C + c] = p; var g = ganaEn(b, C, F, K, c, r); b[r * C + c] = 0;
      if (g) return c;
    }
    return -1;
  }
  function elegir(b, C, F, K, p, nivel) {
    var libres = []; for (var c0 = 0; c0 < C; c0++) if (filaLibre(b, C, F, c0) >= 0) libres.push(c0);
    if (!libres.length) return -1;
    var azar = function () { return libres[Math.floor(Math.random() * libres.length)]; };
    var w = ganadora(b, C, F, K, p), bl = ganadora(b, C, F, K, 3 - p);
    if (nivel === 0) { if (w >= 0 && Math.random() < 0.6) return w; if (bl >= 0 && Math.random() < 0.35) return bl; return azar(); }
    if (w >= 0) return w;
    if (bl >= 0) return bl;
    var prof = nivel === 1 ? 2 : nivel === 2 ? 4 : 12, ms = nivel === 1 ? 150 : nivel === 2 ? 500 : 1100;
    var lim = { t: Date.now() + ms }, ord = orden(C), mejorC = [], mejorV = -Infinity;
    for (var d = 1; d <= prof; d++) {
      var tmpC = [], tmpV = -Infinity;
      for (var s = 0; s < ord.length; s++) {
        var c = ord[s], r = filaLibre(b, C, F, c); if (r < 0) continue;
        b[r * C + c] = p;
        var v = -negamax(b, C, F, K, 3 - p, d - 1, -Infinity, Infinity, [c, r], lim, ord);
        b[r * C + c] = 0;
        if (v > tmpV) { tmpV = v; tmpC = [c]; } else if (v === tmpV) tmpC.push(c);
        if (Date.now() > lim.t) break;
      }
      if (lim.corte) break;
      mejorC = tmpC; mejorV = tmpV;
      if (mejorV > 50000 || mejorV < -50000) break;
    }
    if (!mejorC.length) return azar();
    if (nivel === 1 && Math.random() < 0.2) return azar();
    return mejorC[Math.floor(Math.random() * mejorC.length)];
  }
  R._conecta4 = { elegir: elegir, ganaEn: ganaEn };

  function chips(t, k, lista, act) {
    return '<p class="campo-et sola">' + t + '</p><div class="chips">' + lista.map(function (x) {
      return '<button type="button" class="chip' + (String(x[0]) === String(act) ? " sel" : "") + '" data-set="' + k + ":" + x[0] + '">' + x[1] + "</button>";
    }).join("") + "</div>";
  }
  function sl(cfg, k, et, min, max) {
    return '<label class="campo"><span class="campo-et">' + et + ' <b data-v="' + k + '">' + cfg[k] + '</b></span><input type="range" data-k="' + k + '" min="' + min + '" max="' + max + '" step="1" value="' + cfg[k] + '"></label>';
  }

  R.registrar({
    id: "conecta4",
    nombre: "Conecta 4",
    descripcion: "Deja caer fichas y conecta cuatro. Contra la IA o contra otra persona.",
    preview: function () {
      return R.html('<span class="pv-c4"><i class="a"></i><i class="b"></i><i class="a"></i><i class="b"></i><i class="a"></i><i class="b"></i><i></i><i class="a"></i><i class="b"></i></span>');
    },
    iniciar: function (cont) {
      var cfg = Object.assign({}, DEF, R.leer("conecta4.cfg", {}));
      var limpiar = null, jugadorNom = null;
      function guardar() { R.guardar("conecta4.cfg", cfg); }
      function ajustar() { cfg.conectar = Math.min(cfg.conectar, Math.max(cfg.cols, cfg.filas)); }
      function clave() { return "conecta4.rec." + cfg.cols + "." + cfg.filas + "." + cfg.conectar + "." + cfg.nivel; }

      function pantallaConfig() {
        if (limpiar) { limpiar(); limpiar = null; }
        ajustar();
        var old = cont.querySelector(".lz-scroll"), prev = old ? old.scrollTop : 0, ia = cfg.modo === "ia";
        cont.innerHTML =
          '<section class="lz lz-config cf-cfg">' +
            '<header class="lz-top"><button class="volver" type="button" data-a="volver" aria-label="Volver al menú">←</button><h2>Conecta 4</h2></header>' +
            '<div class="lz-scroll"><div class="lz-col">' +
              '<p class="nota">Deja caer tus fichas por las columnas y conecta las necesarias antes que tu rival.</p>' +
              "<h3>Modo</h3>" + chips("", "modo", [["ia", "Contra la IA"], ["persona", "Dos personas"]], cfg.modo) +
              (ia ? chips("Dificultad de la IA", "nivel", NIVELES.map(function (n, i) { return [i, n]; }), cfg.nivel) : "") +
              chips("¿Quién empieza?", "empieza", [["yo", ia ? "Yo" : "Jugador 1"], ["ia", ia ? "La IA" : "Jugador 2"], ["alt", "Se turnan"]], cfg.empieza) +
              "<h3>Tablero</h3>" + sl(cfg, "cols", "Columnas", 5, 10) + sl(cfg, "filas", "Filas", 4, 9) + sl(cfg, "conectar", "Fichas para ganar", 3, 6) +
              "<h3>Reglas</h3>" +
              chips("Tiempo por turno", "tiempo", [[0, "Sin límite"], [10, "10 s"], [20, "20 s"], [30, "30 s"]], cfg.tiempo) +
              chips("Partidas a ganar", "serie", [[1, "1 partida"], [2, "Mejor de 3"], [3, "Mejor de 5"]], cfg.serie) +
              chips("Retirar jugada", "retirar", [[1, "Permitido"], [0, "No"]], cfg.retirar) +
              chips("Pistas", "pistas", [[0, "Ninguna"], [3, "3"], [99, "Ilimitadas"]], cfg.pistas) +
              (ia ? '<p class="record">' + (R.leer(clave(), null) === null ? "Aún sin victorias con esta configuración." : "Mejor victoria: en " + R.leer(clave(), null) + " fichas.") + "</p>" : "") +
            "</div></div>" +
            '<footer class="lz-pie"><div class="lz-col"><button class="btn primario grande" type="button" data-a="jugar">Comenzar</button></div></footer>' +
          "</section>";
        var raiz = cont.querySelector(".cf-cfg");
        raiz.querySelector(".lz-scroll").scrollTop = prev;
        R.pintarRangos(raiz);
        raiz.addEventListener("input", function (e) {
          var k = e.target.dataset && e.target.dataset.k; if (!k) return;
          cfg[k] = +e.target.value; ajustar(); guardar();
          ["cols", "filas", "conectar"].forEach(function (c) { raiz.querySelector('[data-v="' + c + '"]').textContent = cfg[c]; var i = raiz.querySelector('[data-k="' + c + '"]'); i.value = cfg[c]; R.pintarRango(i); });
        });
        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button"); if (!b) return;
          if (b.dataset.a === "volver") R.salir();
          else if (b.dataset.a === "jugar") {
            guardar();
            if (cfg.modo === "ia") R.pedirJugador(cont, function (n) { jugadorNom = n; partida(); }, pantallaConfig);
            else { jugadorNom = null; partida(); }
          } else if (b.dataset.set) {
            var p = b.dataset.set.indexOf(":"), k = b.dataset.set.slice(0, p), v = b.dataset.set.slice(p + 1);
            cfg[k] = (k === "modo" || k === "empieza") ? v : Number(v); guardar(); pantallaConfig();
          }
        });
      }

      function partida() {
        var C = cfg.cols, F = cfg.filas, K = cfg.conectar, ia = cfg.modo === "ia";
        var marc = [0, 0], empates = 0, ronda = 0, S = null, tm = [], reloj = null;
        var nom1 = ia ? "Tú" : "Jugador 1", nom2 = ia ? "IA" : "Jugador 2";
        function after(fn, ms) { var id = setTimeout(fn, ms); tm.push(id); return id; }

        var cols = "";
        for (var c = 0; c < C; c++) {
          cols += '<button type="button" class="cf-col" data-c="' + c + '" aria-label="Columna ' + (c + 1) + '">';
          for (var r = 0; r < F; r++) cols += '<span class="cf-celda" data-r="' + r + '"></span>';
          cols += "</button>";
        }
        cont.innerHTML =
          '<section class="cf" style="--C:' + C + ';--F:' + F + '">' +
            '<header class="gt-top"><button class="gt-b" type="button" data-a="salir" aria-label="Salir">←</button><div class="gt-tit"><b>Conecta 4</b><small>' + (ia ? NIVELES[cfg.nivel] : "Dos personas") + " · " + C + "×" + F + " · conecta " + K + '</small></div><button class="gt-b" type="button" data-a="reiniciar" aria-label="Reiniciar">↻</button></header>' +
            '<div class="gt-marcador"><div class="gt-jug j1"><span class="cf-ficha f1"></span><b>' + nom1 + '</b><em data-m="0">0</em></div><span class="gt-vs">VS</span><div class="gt-jug j2"><span class="cf-ficha f2"></span><b>' + nom2 + '</b><em data-m="1">0</em></div></div>' +
            '<p class="gt-estado"></p>' +
            '<div class="gt-area"><div class="cf-tablero">' + cols + "</div></div>" +
            '<div class="gt-pie">' +
              (cfg.retirar ? '<button type="button" class="gt-btn" data-a="retirar"><i>↶</i>Retirar</button>' : "") +
              (cfg.pistas ? '<button type="button" class="gt-btn" data-a="pista"><i>💡</i>Pista <span class="gt-np"></span></button>' : "") +
            "</div>" +
            '<div class="gt-ov" hidden></div>' +
          "</section>";
        var raiz = cont.querySelector(".cf"), tab = raiz.querySelector(".cf-tablero"), est = raiz.querySelector(".gt-estado"), ov = raiz.querySelector(".gt-ov");
        var colEls = tab.querySelectorAll(".cf-col");
        function celda(c, r) { return colEls[c].children[r]; }

        function nuevaRonda() {
          ronda++;
          var primero = cfg.empieza === "yo" ? 1 : cfg.empieza === "ia" ? 2 : ((ronda % 2) ? 1 : 2);
          S = { b: new Int8Array(C * F), turno: primero, hist: [], fin: false, ocupado: false, pistas: cfg.pistas, primero: primero, resto: cfg.tiempo };
          for (var c = 0; c < C; c++) for (var r = 0; r < F; r++) celda(c, r).className = "cf-celda";
          colEls.forEach(function (e) { e.classList.remove("pista"); });
          pintarEstado(); armarReloj();
          if (ia && S.turno === 2) mueveIA();
        }
        function pintarEstado() {
          var t = S.fin ? "" : (ia ? (S.turno === 1 ? "Tu turno" : "Pensando…") : "Turno de " + (S.turno === 1 ? nom1 : nom2));
          if (!S.fin && cfg.tiempo && !(ia && S.turno === 2)) t += " · " + S.resto + " s";
          est.textContent = t;
          raiz.querySelector('[data-m="0"]').textContent = marc[0]; raiz.querySelector('[data-m="1"]').textContent = marc[1];
          raiz.querySelector(".j1").classList.toggle("turno", !S.fin && S.turno === 1);
          raiz.querySelector(".j2").classList.toggle("turno", !S.fin && S.turno === 2);
          var np = raiz.querySelector(".gt-np"); if (np) np.textContent = "(" + (cfg.pistas >= 99 ? "∞" : S.pistas) + ")";
        }
        function armarReloj() {
          clearInterval(reloj); if (!cfg.tiempo) return;
          S.resto = cfg.tiempo; pintarEstado();
          reloj = setInterval(function () {
            if (!S || S.fin || S.ocupado || (ia && S.turno === 2)) return;
            S.resto--; pintarEstado();
            if (S.resto <= 0) { var libres = []; for (var c = 0; c < C; c++) if (filaLibre(S.b, C, F, c) >= 0) libres.push(c); if (libres.length) soltar(libres[Math.floor(Math.random() * libres.length)]); }
          }, 1000);
        }
        function soltar(c) {
          var r = filaLibre(S.b, C, F, c); if (r < 0 || S.fin) return false;
          S.b[r * C + c] = S.turno; S.hist.push([c, r]);
          colEls.forEach(function (e) { e.classList.remove("pista"); });
          var el = celda(c, r); el.className = "cf-celda lleno p" + S.turno + " cae"; el.style.setProperty("--d", r + 1);
          S.ocupado = true;
          R.tono && R.tono(S.turno === 1 ? 560 : 440, 80, "sine", 0.12); R.vibrar && R.vibrar(10);
          var g = ganaEn(S.b, C, F, K, c, r), jug = S.turno;
          after(function () {
            S.ocupado = false; if (!S || S.fin) return;
            if (g) { S.fin = true; clearInterval(reloj); g.forEach(function (i) { var cc = i % C; celda(cc, (i - cc) / C).classList.add("gana"); }); marc[jug - 1]++; pintarEstado(); after(function () { cierre(jug); }, 900); return; }
            var lleno = true; for (var q = 0; q < C; q++) if (!S.b[q]) { lleno = false; break; }
            if (lleno) { S.fin = true; clearInterval(reloj); empates++; pintarEstado(); after(function () { cierre(0); }, 500); return; }
            S.turno = 3 - S.turno; armarReloj(); pintarEstado();
            if (ia && S.turno === 2) mueveIA();
          }, 100 + Math.min(r, 5) * 55 + 150);
          return true;
        }
        function mueveIA() {
          S.ocupado = true;
          after(function () {
            if (!S || S.fin) return;
            S.ocupado = false;
            var c = elegir(S.b, C, F, K, 2, cfg.nivel);
            if (c >= 0) soltar(c);
          }, 420);
        }
        function clic(c) {
          if (!S || S.fin || S.ocupado || (ia && S.turno !== 1)) return;
          soltar(c);
        }
        function retirar() {
          if (!cfg.retirar || !S || S.fin || S.ocupado || !S.hist.length) return;
          function quita() { var u = S.hist.pop(); var pl = S.b[u[1] * C + u[0]]; S.b[u[1] * C + u[0]] = 0; var e = celda(u[0], u[1]); e.className = "cf-celda"; return pl; }
          if (ia) {
            if (!S.hist.some(function (h) { return S.b[h[1] * C + h[0]] === 1; })) return;
            var pl; do { pl = quita(); } while (pl !== 1 && S.hist.length);
            S.turno = 1;
          } else S.turno = quita();
          colEls.forEach(function (e) { e.classList.remove("pista"); });
          armarReloj(); pintarEstado();
        }
        function pista() {
          if (!S || S.fin || S.ocupado || !cfg.pistas || (ia && S.turno !== 1)) return;
          if (cfg.pistas < 99 && S.pistas <= 0) { est.textContent = "Ya no quedan pistas"; return; }
          var c = elegir(S.b, C, F, K, S.turno, 2); if (c < 0) return;
          if (cfg.pistas < 99) S.pistas--;
          colEls.forEach(function (e) { e.classList.remove("pista"); }); colEls[c].classList.add("pista"); pintarEstado();
        }
        function cierre(ganador) {
          var termina = marc[0] >= cfg.serie || marc[1] >= cfg.serie;
          var titulo = ganador === 0 ? "¡Empate!" : (ia ? (ganador === 1 ? "¡Ganaste!" : "Ganó la IA") : "Ganó " + (ganador === 1 ? nom1 : nom2));
          var html = '<div class="gt-card"><h3>' + titulo + "</h3>";
          if (cfg.serie > 1 || termina) html += "<p>Marcador: " + marc[0] + " – " + marc[1] + (empates ? " (empates: " + empates + ")" : "") + "</p>";
          if (termina) {
            var campeon = marc[0] >= cfg.serie ? 1 : 2;
            html += "<p><b>" + (ia ? (campeon === 1 ? "¡Ganaste la serie!" : "La IA ganó la serie") : "Ganó la serie " + (campeon === 1 ? nom1 : nom2)) + "</b></p>";
            if (ia && campeon === 1) {
              var jug = Math.ceil(S.hist.length / 2), rec = R.leer(clave(), null), nuevo = false;
              if (rec === null || jug < rec) { R.guardar(clave(), jug); nuevo = true; }
              try { R.registrarPartida(jugadorNom, { juego: "Conecta 4", modo: "vs IA · " + NIVELES[cfg.nivel], config: C + "×" + F + " · conecta " + K, valor: jug, unidad: "fichas", mejorEs: "min", stats: { aciertos: marc[0], fallos: marc[1], precision: Math.round(marc[0] / Math.max(1, marc[0] + marc[1] + empates) * 100) } }); } catch (e) {}
              if (nuevo) html += '<span class="insignia">Nuevo récord</span>';
            }
            html += '<button class="gt-bt" type="button" data-a="otra">Jugar otra serie</button><button class="gt-bt suave" type="button" data-a="config">Configurar</button><button class="gt-bt suave" type="button" data-a="salir">Menú</button>';
          } else html += '<button class="gt-bt" type="button" data-a="sig">Siguiente partida</button><button class="gt-bt suave" type="button" data-a="ver">Ver tablero</button>';
          ov.innerHTML = html + "</div>"; ov.hidden = false;
        }
        function limpia() { tm.forEach(clearTimeout); tm = []; clearInterval(reloj); if (S) S.fin = true; }
        limpiar = limpia;
        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button"); if (!b) return;
          var a = b.dataset.a;
          if (b.classList.contains("cf-col")) clic(+b.dataset.c);
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
