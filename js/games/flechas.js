/* Juego: Flechas.
   Un tablero lleno de flechas con forma de serpiente. Al tocar una, sale deslizándose hacia donde apunta,
   pero solo si su camino hasta el borde está libre. Hay que sacarlas todas sin gastar las gotas (vidas).
   Los tableros se generan solos y siempre tienen solución. 8 dificultades, de «Muy fácil» a «Imposible». */
(function (R) {
  var TIERS = [
    { n: "Muy fácil", c: 6, f: 8, min: 2, max: 4, rec: 0.7, desc: "Para empezar" },
    { n: "Fácil", c: 8, f: 11, min: 2, max: 6, rec: 0.65, desc: "Tablero chico" },
    { n: "Normal", c: 11, f: 15, min: 2, max: 8, rec: 0.6, desc: "Ya hay que pensar" },
    { n: "Difícil", c: 15, f: 21, min: 2, max: 12, rec: 0.55, desc: "Caminos largos" },
    { n: "Muy difícil", c: 20, f: 28, min: 2, max: 16, rec: 0.5, desc: "Hay que hacer zoom" },
    { n: "Extremo", c: 26, f: 36, min: 2, max: 22, rec: 0.45, desc: "Laberinto enorme" },
    { n: "Mega difícil", c: 32, f: 46, min: 2, max: 28, rec: 0.4, desc: "Solo para valientes" },
    { n: "Imposible", c: 40, f: 58, min: 2, max: 36, rec: 0.35, desc: "Paciencia infinita" }
  ];
  var TEMAS = [
    { id: "crema", n: "Crema", bg: "#f3ead8", ink: "#3a2418", dot: "rgba(58,36,24,.2)", top: "#b3622d", panel: "#fffaf0", mute: "#8a6a55" },
    { id: "menta", n: "Menta", bg: "#d6efdc", ink: "#183a3f", dot: "rgba(24,58,63,.2)", top: "#0f8a8f", panel: "#f0fbf3", mute: "#4b7478" },
    { id: "oscuro", n: "Oscuro", bg: "#1c2a35", ink: "#c3d2dc", dot: "rgba(195,210,220,.18)", top: "#9a7bd6", panel: "#26394a", mute: "#8197a8" }
  ];
  var COLS_MOV = ["#2fa36b", "#2f86d6", "#c9a227", "#d1572d", "#8a5fd0"];
  var DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  var DEF = { modo: "libre", tier: 2, nivel: 1, nivelSel: 1, vidas: 3, pistas: 3, tema: "crema" };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- generador ----------
     Cada flecha nueva se coloca solo si su camino hasta el borde está libre de las ya puestas.
     Así existe siempre un orden para sacarlas todas (la última puesta sale primero). */
  function generar(T, seed) {
    var rng = mulberry32(seed), C = T.c, Rw = T.f, N = C * Rw;
    var occ = new Int16Array(N).fill(-1), arrows = [];

    function libre(x, y) { return x >= 0 && y >= 0 && x < C && y < Rw && occ[y * C + x] < 0; }
    function rayoLibre(path, d) {
      var h = path[path.length - 1], x = h % C, y = (h - x) / C;
      x += DX[d]; y += DY[d];
      while (x >= 0 && y >= 0 && x < C && y < Rw) {
        var i = y * C + x;
        if (occ[i] >= 0 || path.indexOf(i) >= 0) return false;
        x += DX[d]; y += DY[d];
      }
      return true;
    }
    function dirFinal(path) {
      var n = path.length;
      if (n < 2) return -1;
      var a = path[n - 2], b = path[n - 1];
      var dx = (b % C) - (a % C), dy = Math.floor(b / C) - Math.floor(a / C);
      return dx === 1 ? 0 : dy === 1 ? 1 : dx === -1 ? 2 : 3;
    }
    function caminar(s, L) {
      var path = [s], x = s % C, y = Math.floor(s / C), d = -1;
      while (path.length < L) {
        var opts = [];
        for (var k = 0; k < 4; k++) {
          var nx = x + DX[k], ny = y + DY[k];
          if (libre(nx, ny) && path.indexOf(ny * C + nx) < 0) opts.push(k);
        }
        if (!opts.length) break;
        var ch = (d >= 0 && opts.indexOf(d) >= 0 && rng() < T.rec) ? d : opts[Math.floor(rng() * opts.length)];
        d = ch; x += DX[d]; y += DY[d]; path.push(y * C + x);
      }
      return path;
    }
    function poner(path, d) {
      var id = arrows.length;
      for (var i = 0; i < path.length; i++) occ[path[i]] = id;
      arrows.push({ id: id, cells: path, dir: d });
    }
    function intentar(s, L) {
      var path = caminar(s, L), cand = [path];
      if (path.length > 1) cand.push(path.slice().reverse());
      if (rng() < 0.5) cand.reverse();
      for (var i = 0; i < cand.length; i++) {
        var p = cand[i], d = dirFinal(p);
        if (d < 0) {
          var o = Math.floor(rng() * 4);
          for (var k = 0; k < 4; k++) { var dd = (o + k) % 4; if (rayoLibre(p, dd)) { poner(p, dd); return true; } }
        } else if (rayoLibre(p, d)) { poner(p, d); return true; }
      }
      return false;
    }

    var tries = N * 40;
    for (var t = 0; t < tries; t++) {
      var s = Math.floor(rng() * N);
      if (t < tries * 0.35) { /* al principio se llena el centro, que luego queda tapado */
        for (var q = 0; q < 3; q++) {
          var s2 = Math.floor(rng() * N);
          if (Math.abs((s2 % C) - C / 2) / C + Math.abs(Math.floor(s2 / C) - Rw / 2) / Rw < Math.abs((s % C) - C / 2) / C + Math.abs(Math.floor(s / C) - Rw / 2) / Rw) s = s2;
        }
      }
      if (occ[s] >= 0) continue;
      var L = T.min + Math.floor(Math.pow(rng(), 1.25) * (T.max - T.min + 1));
      intentar(s, L);
    }
    /* relleno de huecos con flechas cortas */
    for (var pasada = 0; pasada < 4; pasada++) {
      for (var c = 0; c < N; c++) { if (occ[c] < 0) intentar(c, 1 + (pasada % 3)); }
    }
    return { cols: C, rows: Rw, arrows: arrows };
  }

  function movibles(P) { /* para pruebas: ¿se puede vaciar el tablero? */
    var C = P.cols, Rw = P.rows, occ = new Int16Array(C * Rw).fill(-1), vivos = {}, n = 0;
    P.arrows.forEach(function (a) { a.cells.forEach(function (c) { occ[c] = a.id; }); vivos[a.id] = true; n++; });
    var cambio = true;
    while (cambio && n) {
      cambio = false;
      P.arrows.forEach(function (a) {
        if (!vivos[a.id]) return;
        var h = a.cells[a.cells.length - 1], x = h % C + DX[a.dir], y = Math.floor(h / C) + DY[a.dir], ok = true;
        while (x >= 0 && y >= 0 && x < C && y < Rw) { var i = y * C + x; if (occ[i] >= 0 && occ[i] !== a.id) { ok = false; break; } x += DX[a.dir]; y += DY[a.dir]; }
        if (ok) { a.cells.forEach(function (c) { occ[c] = -1; }); vivos[a.id] = false; n--; cambio = true; }
      });
    }
    return n === 0;
  }
  R._flechas = { generar: generar, resoluble: movibles, TIERS: TIERS };

  /* ---------- utilidades ---------- */
  function mmss(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function tierDeNivel(n) { return n <= 2 ? 0 : n <= 4 ? 1 : n <= 7 ? 2 : n <= 10 ? 3 : n <= 14 ? 4 : n <= 19 ? 5 : n <= 25 ? 6 : 7; }
  function hoySeed() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function hoyTxt() { var d = new Date(); return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2); }
  var GOTA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5C9 7 5.5 10.5 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10.5 15 7 12 2.5z"/></svg>';
  var BOMBILLA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0-3.5 10.9V17h7v-3.1A6 6 0 0 0 12 3z"/><path d="M9.5 20h5M10.5 22h3"/></svg>';
  var TEMA_ICO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>';
  var AJUSTE_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.8l7.4 4.3v8.6L12 20l-7.4-4.3V7.1z"/><circle cx="12" cy="11.4" r="2.6"/></svg>';

  function chips(titulo, clave, lista, actual) {
    return (titulo ? '<p class="campo-et sola">' + titulo + "</p>" : "") + '<div class="chips">' +
      lista.map(function (x) {
        return '<button type="button" class="chip' + (String(x[0]) === String(actual) ? " sel" : "") + '" data-set="' + clave + ":" + x[0] + '">' + x[1] + "</button>";
      }).join("") + "</div>";
  }

  R.registrar({
    id: "flechas",
    nombre: "Flechas",
    descripcion: "Saca todas las flechas del tablero sin que se choquen. De muy fácil a imposible.",
    preview: function () {
      return R.html('<span class="pv-flechas"><svg viewBox="0 0 60 60" fill="none" stroke="#e7edea" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M8 12h26"/><path d="M8 24h18v10"/><path d="M52 10v22h-12"/><path d="M12 52V42h22"/><path d="M52 52H44"/><path d="M26 40v-6"/></svg>' +
        '<svg viewBox="0 0 60 60" fill="#e7edea" stroke="none" aria-hidden="true"><path d="M34 8.5l7 3.5-7 3.5z"/><path d="M22 34l3.5 7-7 0z" transform="rotate(0)"/><path d="M36.5 32l-7 3.5 0-7z" transform="translate(4 0)"/><path d="M12.5 44l3.5-7 3.5 7z" transform="translate(0 -6)"/><path d="M42 52l-7 3.5v-7z" transform="translate(0 0)"/></svg></span>');
    },

    iniciar: function (cont) {
      var cfg = Object.assign({}, DEF, R.leer("flechas.cfg", {}));
      var limpiarJuego = null;
      function guardarCfg() { R.guardar("flechas.cfg", cfg); }
      function tema() { return TEMAS.filter(function (t) { return t.id === cfg.tema; })[0] || TEMAS[0]; }
      function varsTema() {
        var t = tema();
        return "--fl-bg:" + t.bg + ";--fl-ink:" + t.ink + ";--fl-dot:" + t.dot + ";--fl-top:" + t.top + ";--fl-panel:" + t.panel + ";--fl-mute:" + t.mute;
      }
      function plan() {
        if (cfg.modo === "niveles") return { tier: tierDeNivel(cfg.nivelSel), seed: cfg.nivelSel * 7919 + 13, titulo: "Nivel " + cfg.nivelSel };
        if (cfg.modo === "diario") return { tier: 3, seed: hoySeed(), titulo: "Desafío del día" };
        return { tier: cfg.tier, seed: (Math.random() * 4294967295) >>> 0, titulo: "Libre" };
      }
      function claveRecord(tier) { return "flechas.rec." + cfg.modo + "." + tier + (cfg.modo === "diario" ? "." + hoySeed() : ""); }

      /* ---------- pantalla de inicio ---------- */
      function pantallaConfig() {
        if (limpiarJuego) { limpiarJuego(); limpiarJuego = null; }
        R.mantenerPantalla(false);
        var prev = 0, old = cont.querySelector(".lz-scroll");
        if (old) prev = old.scrollTop;
        var modos = [["libre", "Libre"], ["niveles", "Niveles"], ["diario", "Desafío del día"]];
        var desc = { libre: "Elige la dificultad. Cada partida es un tablero nuevo.", niveles: "Avanza nivel por nivel: cada vez es más difícil.", diario: "Un mismo tablero para todos, cambia cada día (" + hoyTxt() + ")." };
        var cuerpo = "";
        if (cfg.modo === "libre") {
          cuerpo = "<h3>Dificultad</h3><div class=\"fl-tiers\">" + TIERS.map(function (t, i) {
            return '<button type="button" class="fl-tier' + (i === cfg.tier ? " sel" : "") + '" data-set="tier:' + i + '"><b>' + t.n + "</b><small>" + t.c + " × " + t.f + " · " + t.desc + "</small></button>";
          }).join("") + "</div>";
        } else if (cfg.modo === "niveles") {
          var n = cfg.nivelSel, t = TIERS[tierDeNivel(n)];
          cuerpo = '<h3>Nivel</h3><div class="fl-nivel"><button type="button" class="btn" data-a="menos"' + (n <= 1 ? " disabled" : "") + '>−</button><div><b>Nivel ' + n + "</b><small>" + t.n + " · " + t.c + " × " + t.f + '</small></div><button type="button" class="btn" data-a="mas"' + (n >= cfg.nivel ? " disabled" : "") + ">+</button></div>" +
            '<p class="nota">Has desbloqueado hasta el nivel ' + cfg.nivel + ".</p>";
        } else {
          cuerpo = '<p class="nota">Dificultad: ' + TIERS[3].n + " (" + TIERS[3].c + " × " + TIERS[3].f + ").</p>";
        }
        cont.innerHTML =
          '<section class="lz lz-config fl-cfg">' +
            '<header class="lz-top"><button class="volver" type="button" data-a="volver" aria-label="Volver al menú">←</button><h2>Flechas</h2></header>' +
            '<div class="lz-scroll"><div class="lz-col">' +
              '<p class="nota">Toca una flecha para sacarla del tablero. Solo sale si el camino hacia donde apunta está libre; si choca, pierdes una gota. Los tableros grandes se mueven con el dedo y se agrandan con dos dedos.</p>' +
              "<h3>Modo</h3>" + chips("", "modo", modos, cfg.modo) + '<p class="nota">' + desc[cfg.modo] + "</p>" + cuerpo +
              "<h3>Reglas</h3>" +
              chips("Gotas (vidas)", "vidas", [[1, "1"], [3, "3"], [5, "5"], [0, "Sin límite"]], cfg.vidas) +
              chips("Pistas", "pistas", [[0, "Ninguna"], [3, "3"], [-1, "Ilimitadas"]], cfg.pistas) +
              chips("Tema", "tema", TEMAS.map(function (t) { return [t.id, t.n]; }), cfg.tema) +
              '<p class="record"></p>' +
            "</div></div>" +
            '<footer class="lz-pie"><div class="lz-col"><button class="btn primario grande" type="button" data-a="jugar">Comenzar</button></div></footer>' +
          "</section>";
        var raiz = cont.querySelector(".fl-cfg");
        raiz.querySelector(".lz-scroll").scrollTop = prev;
        var p0 = plan(), r = R.leer(claveRecord(p0.tier), null);
        raiz.querySelector(".record").textContent = r ? "Mejor tiempo: " + mmss(r.t) + " · Mejor puntaje: " + r.p : "Aún sin récord en este modo.";
        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b) return;
          var d = b.dataset;
          if (d.a === "volver") R.salir();
          else if (d.a === "jugar") { guardarCfg(); R.pedirJugador(cont, function (nombre) { jugar(nombre, plan()); }, pantallaConfig); }
          else if (d.a === "menos") { cfg.nivelSel = Math.max(1, cfg.nivelSel - 1); guardarCfg(); pantallaConfig(); }
          else if (d.a === "mas") { cfg.nivelSel = Math.min(cfg.nivel, cfg.nivelSel + 1); guardarCfg(); pantallaConfig(); }
          else if (d.set) {
            var p = d.set.indexOf(":"), k = d.set.slice(0, p), v = d.set.slice(p + 1);
            cfg[k] = (k === "modo" || k === "tema") ? v : Number(v);
            guardarCfg(); pantallaConfig();
          }
        });
      }

      /* ---------- partida ---------- */
      function jugar(jugador, pl) {
        var T = TIERS[pl.tier], P = generar(T, pl.seed);
        var C = P.cols, Rw = P.rows, total = P.arrows.length;
        var vidasMax = cfg.vidas, pistasMax = cfg.pistas;

        cont.innerHTML =
          '<section class="fl" style="' + varsTema() + '">' +
            '<header class="fl-top"><button type="button" class="fl-b" data-a="salir" aria-label="Salir">←</button>' +
              '<div class="fl-tit"><b>' + R.esc(pl.titulo) + "</b><small>" + T.n + "</small></div>" +
              '<div class="fl-acc"><button type="button" class="fl-b" data-a="tema" aria-label="Cambiar tema">' + TEMA_ICO + '</button><button type="button" class="fl-b" data-a="ajustes" aria-label="Configuración">' + AJUSTE_ICO + "</button></div></header>" +
            '<div class="fl-sub"><div class="fl-gotas"></div><span class="fl-crono">0:00</span>' +
              '<button type="button" class="fl-b fl-pista" data-a="pista" aria-label="Pista">' + BOMBILLA + "<em></em></button></div>" +
            '<div class="fl-area"><div class="fl-wrap"></div>' +
              '<div class="fl-zoom"><button type="button" class="fl-b" data-a="zmas" aria-label="Acercar">+</button><button type="button" class="fl-b" data-a="zmenos" aria-label="Alejar">−</button><button type="button" class="fl-b" data-a="zfit" aria-label="Ver todo">⤢</button></div>' +
              '<div class="fl-msg" hidden></div><div class="fl-fx"></div></div>' +
            '<div class="fl-ov" hidden></div>' +
          "</section>";
        var raiz = cont.querySelector(".fl");
        var area = raiz.querySelector(".fl-area"), wrap = raiz.querySelector(".fl-wrap");
        var gotasEl = raiz.querySelector(".fl-gotas"), crono = raiz.querySelector(".fl-crono"), btnPista = raiz.querySelector(".fl-pista");
        var msg = raiz.querySelector(".fl-msg"), ov = raiz.querySelector(".fl-ov"), fx = raiz.querySelector(".fl-fx");

        var S = {
          jugando: true, occ: new Int16Array(C * Rw).fill(-1), vivos: total, anim: 0, vidas: vidasMax, pistas: pistasMax,
          errores: 0, aciertos: 0, pistasUsadas: 0, racha: 0, t0: performance.now(), pausado: 0, pausaIni: 0, timers: [], raf: [], pistaId: -1
        };
        var A = P.arrows.map(function (a) { return { id: a.id, cells: a.cells, dir: a.dir, vivo: true, el: null, ln: null, hd: null }; });
        A.forEach(function (a) { a.cells.forEach(function (c) { S.occ[c] = a.id; }); });
        function after(fn, ms) { var id = setTimeout(fn, ms); S.timers.push(id); return id; }

        /* dibujo */
        var U = 10, PAD = 4;
        function cx(i) { return (i % C) * U + U / 2; }
        function cy(i) { return Math.floor(i / C) * U + U / 2; }
        function longitud(a) { return a.cells.length > 1 ? (a.cells.length - 1) * U : 4.5; }
        function puntos(a) {
          var pts = a.cells.map(function (c) { return [cx(c), cy(c)]; });
          if (pts.length === 1) pts.unshift([pts[0][0] - DX[a.dir] * 4.5, pts[0][1] - DY[a.dir] * 4.5]);
          return pts;
        }
        function dPath(pts) { return "M" + pts.map(function (p) { return p[0] + " " + p[1]; }).join("L"); }
        function cabeza(a, ex, ey) {
          var dx = DX[a.dir], dy = DY[a.dir], px = -dy, py = dx, L = 4.6, W = 2.5;
          return [(ex + dx * L).toFixed(1) + "," + (ey + dy * L).toFixed(1), (ex + px * W).toFixed(1) + "," + (ey + py * W).toFixed(1), (ex - px * W).toFixed(1) + "," + (ey - py * W).toFixed(1)].join(" ");
        }
        var bw = C * U + PAD * 2, bh = Rw * U + PAD * 2;
        var svg = '<svg class="fl-svg" viewBox="' + -PAD + " " + -PAD + " " + bw + " " + bh + '" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="fl-pt" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r=".55" fill="var(--fl-dot)"/></pattern></defs>' +
          '<rect x="0" y="0" width="' + C * U + '" height="' + Rw * U + '" fill="url(#fl-pt)"/>';
        A.forEach(function (a) {
          var pts = puntos(a), d = dPath(pts), h = a.cells[a.cells.length - 1];
          svg += '<g class="fl-a" data-i="' + a.id + '"><path class="fl-l" d="' + d + '"/><polygon class="fl-h" points="' + cabeza(a, cx(h), cy(h)) + '"/><path class="fl-hit" d="' + d + '"/></g>';
        });
        wrap.innerHTML = svg + "</svg>";
        var svgEl = wrap.querySelector("svg");
        A.forEach(function (a) {
          a.el = svgEl.querySelector('.fl-a[data-i="' + a.id + '"]');
          a.ln = a.el.querySelector(".fl-l"); a.hd = a.el.querySelector(".fl-h");
        });

        /* vista: zoom y desplazamiento */
        var V = { W: 0, H: 0, base: 1, z: 1, tx: 0, ty: 0, zmax: 4 };
        function medirVista() {
          V.W = area.clientWidth; V.H = area.clientHeight;
          V.base = Math.min(V.W / bw, V.H / bh);
          svgEl.style.width = bw * V.base + "px"; svgEl.style.height = bh * V.base + "px";
          V.zmax = Math.max(2, 58 / (U * V.base));
        }
        function ajustar() {
          V.z = Math.max(1, Math.min(V.zmax, V.z));
          var sw = bw * V.base * V.z, sh = bh * V.base * V.z;
          V.tx = sw <= V.W ? (V.W - sw) / 2 : Math.max(V.W - sw - 30, Math.min(30, V.tx));
          V.ty = sh <= V.H ? (V.H - sh) / 2 : Math.max(V.H - sh - 30, Math.min(30, V.ty));
        }
        function aplicar() { wrap.style.transform = "translate(" + V.tx.toFixed(1) + "px," + V.ty.toFixed(1) + "px) scale(" + V.z.toFixed(3) + ")"; }
        function vistaFit() { V.z = 1; ajustar(); aplicar(); }
        function zoomEn(px, py, nz) {
          var wx = (px - V.tx) / V.z, wy = (py - V.ty) / V.z;
          V.z = nz; ajustar(); V.tx = px - wx * V.z; V.ty = py - wy * V.z; ajustar(); aplicar();
        }
        function animarVista(fn) {
          wrap.classList.add("suave"); fn(); after(function () { wrap.classList.remove("suave"); }, 380);
        }
        function centrarEn(a) {
          var h = a.cells[a.cells.length - 1];
          var zr = Math.min(V.zmax, Math.max(V.z, 34 / (U * V.base)));
          animarVista(function () {
            V.z = zr; ajustar();
            V.tx = V.W / 2 - ((cx(h) + PAD) * V.base) * V.z; V.ty = V.H / 2 - ((cy(h) + PAD) * V.base) * V.z; ajustar(); aplicar();
          });
        }
        medirVista(); vistaFit();
        function alCambiarTamano() { medirVista(); ajustar(); aplicar(); }
        window.addEventListener("resize", alCambiarTamano);
        var ro = null;
        if (window.ResizeObserver) { ro = new ResizeObserver(alCambiarTamano); ro.observe(area); }

        /* gestos */
        var ptrs = {}, nptrs = 0, g = { mov: false, pinch: false, t: 0, x0: 0, y0: 0 };
        function rect() { return area.getBoundingClientRect(); }
        function dist2() { var k = Object.keys(ptrs), a = ptrs[k[0]], b = ptrs[k[1]]; return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; }
        area.addEventListener("pointerdown", function (e) {
          if (!S.jugando || !ov.hidden) return;
          try { area.setPointerCapture(e.pointerId); } catch (er) {}
          ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; nptrs = Object.keys(ptrs).length;
          if (nptrs === 1) g = { mov: false, pinch: false, t: performance.now(), x0: e.clientX, y0: e.clientY, tx: V.tx, ty: V.ty };
          else if (nptrs === 2) { var p = dist2(), r = rect(); g.pinch = true; g.d0 = p.d || 1; g.z0 = V.z; g.wx = (p.mx - r.left - V.tx) / V.z; g.wy = (p.my - r.top - V.ty) / V.z; }
        });
        area.addEventListener("pointermove", function (e) {
          if (!ptrs[e.pointerId]) return;
          ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
          if (nptrs >= 2) {
            var p = dist2(), r = rect();
            V.z = g.z0 * p.d / g.d0; ajustar();
            V.tx = p.mx - r.left - g.wx * V.z; V.ty = p.my - r.top - g.wy * V.z; ajustar(); aplicar();
          } else if (nptrs === 1) {
            var dx = e.clientX - g.x0, dy = e.clientY - g.y0;
            if (!g.mov && Math.hypot(dx, dy) > 8) g.mov = true;
            if (g.mov && !g.pinch) { V.tx = g.tx + dx; V.ty = g.ty + dy; ajustar(); aplicar(); }
          }
        });
        function soltar(e, cancel) {
          if (!ptrs[e.pointerId]) return;
          var eraUno = nptrs === 1;
          delete ptrs[e.pointerId]; nptrs = Object.keys(ptrs).length;
          if (eraUno && !cancel && !g.mov && !g.pinch && performance.now() - g.t < 700) tocar(e.clientX, e.clientY);
        }
        area.addEventListener("pointerup", function (e) { soltar(e, false); });
        area.addEventListener("pointercancel", function (e) { soltar(e, true); });
        area.addEventListener("wheel", function (e) {
          e.preventDefault();
          var r = rect();
          zoomEn(e.clientX - r.left, e.clientY - r.top, V.z * (e.deltaY < 0 ? 1.18 : 1 / 1.18));
        }, { passive: false });

        /* reglas */
        function bloqueador(a) {
          var h = a.cells[a.cells.length - 1], x = (h % C) + DX[a.dir], y = Math.floor(h / C) + DY[a.dir];
          while (x >= 0 && y >= 0 && x < C && y < Rw) {
            var o = S.occ[y * C + x];
            if (o >= 0 && o !== a.id) return o;
            x += DX[a.dir]; y += DY[a.dir];
          }
          return -1;
        }
        function distBorde(a) {
          var h = a.cells[a.cells.length - 1], x = h % C, y = Math.floor(h / C);
          return a.dir === 0 ? C - 1 - x : a.dir === 1 ? Rw - 1 - y : a.dir === 2 ? x : y;
        }
        function listaMovibles() { return A.filter(function (a) { return a.vivo && bloqueador(a) < 0; }); }

        function tocar(px, py) {
          if (!S.jugando) return;
          var el = document.elementFromPoint(px, py), ge = el && el.closest ? el.closest(".fl-a") : null;
          if (!ge || !wrap.contains(ge)) return;
          var a = A[+ge.dataset.i];
          if (!a.vivo) return;
          var b = bloqueador(a);
          if (b < 0) mover(a); else chocar(a, b);
        }

        function mover(a) {
          a.vivo = false; S.vivos--; S.aciertos++; S.racha++; S.anim++;
          a.cells.forEach(function (c) { S.occ[c] = -1; });
          if (S.pistaId === a.id) { S.pistaId = -1; }
          a.el.classList.remove("pista");
          R.fb.ok(); R.vibrar(12);
          var col = COLS_MOV[Math.floor(Math.random() * COLS_MOV.length)];
          a.el.style.setProperty("--c", col); a.el.classList.add("mov");
          var h = a.cells[a.cells.length - 1], hx = cx(h), hy = cy(h), dx = DX[a.dir], dy = DY[a.dir];
          var orig = longitud(a), ext = (distBorde(a) * U) + U / 2 + orig + 14;
          var pts = puntos(a); pts.push([hx + dx * ext, hy + dy * ext]);
          a.ln.setAttribute("d", dPath(pts));
          a.ln.style.strokeDasharray = orig + " " + (orig + ext + 60);
          a.ln.style.strokeDashoffset = "0";
          var hit = a.el.querySelector(".fl-hit"); if (hit) hit.remove();
          var dur = Math.min(900, Math.max(260, ext / 0.55));
          var ini = performance.now();
          function paso(now) {
            var p = Math.max(0, Math.min(1, (now - ini) / dur)), tt = ext * Math.pow(p, 1.7);
            a.ln.style.strokeDashoffset = String(-tt);
            a.hd.setAttribute("transform", "translate(" + (dx * tt).toFixed(1) + " " + (dy * tt).toFixed(1) + ")");
            if (p < 1 && S.jugando) S.raf.push(requestAnimationFrame(paso));
            else { if (a.el.parentNode) a.el.parentNode.removeChild(a.el); S.anim--; revisarFin(); }
          }
          S.raf.push(requestAnimationFrame(paso));
          var frases = { 3: "¡Bien!", 6: "¡Genial!", 10: "¡Maravilloso!" };
          if (frases[S.racha]) animo(frases[S.racha]);
          else if (S.racha > 10 && S.racha % 10 === 0) animo("¡Increíble!");
          pintarHud();
        }
        function chocar(a, bId) {
          S.errores++; S.racha = 0;
          if (vidasMax) S.vidas--;
          R.fb.mal(); R.vibrar([40, 30, 40]);
          var dx = DX[a.dir] * 2.2, dy = DY[a.dir] * 2.2;
          a.el.style.setProperty("--bx", dx + "px"); a.el.style.setProperty("--by", dy + "px");
          a.el.classList.remove("bump"); void a.el.getBoundingClientRect(); a.el.classList.add("bump");
          var bl = A[bId];
          if (bl && bl.el) { bl.el.classList.add("bloq"); after(function () { if (bl.el) bl.el.classList.remove("bloq"); }, 800); }
          a.el.classList.add("bloq"); after(function () { a.el.classList.remove("bloq"); a.el.classList.remove("bump"); }, 800);
          animo("Hay una flecha en el camino", true);
          pintarHud();
          if (vidasMax && S.vidas <= 0) after(sinVidas, 650);
        }
        function animo(t, malo) {
          msg.textContent = t; msg.hidden = false; msg.className = "fl-msg" + (malo ? " mal" : "");
          void msg.offsetWidth; msg.classList.add("ver");
          clearTimeout(S.msgT); S.msgT = setTimeout(function () { msg.hidden = true; }, 1100);
        }
        function pista() {
          if (!S.jugando || !ov.hidden) return;
          if (pistasMax === 0) return;
          if (pistasMax > 0 && S.pistas <= 0) { animo("Ya no quedan pistas", true); return; }
          var m = listaMovibles();
          if (!m.length) return;
          if (pistasMax > 0) S.pistas--;
          S.pistasUsadas++;
          var a = m[Math.floor(Math.random() * m.length)];
          A.forEach(function (x) { if (x.el) x.el.classList.remove("pista"); });
          a.el.classList.add("pista"); S.pistaId = a.id;
          animo(m.length === 1 ? "Actualmente, 1 flecha puede moverse" : "Actualmente, " + m.length + " flechas pueden moverse");
          centrarEn(a);
          pintarHud();
        }

        /* HUD */
        function pintarHud() {
          if (vidasMax) {
            var h = "";
            for (var i = 0; i < vidasMax; i++) h += '<i class="' + (i < S.vidas ? "" : "va") + '">' + GOTA + "</i>";
            gotasEl.innerHTML = h;
          } else gotasEl.innerHTML = '<span class="fl-inf">∞ gotas</span><small>' + S.vivos + " flechas</small>";
          if (vidasMax) gotasEl.insertAdjacentHTML("beforeend", '<small>' + S.vivos + " flechas</small>");
          var em = btnPista.querySelector("em");
          btnPista.hidden = pistasMax === 0;
          em.textContent = pistasMax < 0 ? "∞" : String(S.pistas);
          btnPista.classList.toggle("vacio", pistasMax > 0 && S.pistas <= 0);
        }
        function tiempo() { var p = S.pausado + (S.pausaIni ? performance.now() - S.pausaIni : 0); return (performance.now() - S.t0 - p) / 1000; }
        var tic = setInterval(function () { if (S.jugando) crono.textContent = mmss(tiempo()); }, 250);
        pintarHud();

        function pausar() { if (!S.pausaIni) S.pausaIni = performance.now(); }
        function reanudar() { if (S.pausaIni) { S.pausado += performance.now() - S.pausaIni; S.pausaIni = 0; } }

        function ventana(html) { ov.innerHTML = html; ov.hidden = false; pausar(); }
        function cerrarVentana() { ov.hidden = true; ov.innerHTML = ""; reanudar(); }
        function ajustes() {
          ventana('<div class="fl-card"><button type="button" class="fl-x" data-a="cerrar" aria-label="Cerrar">×</button><h3>Configuración</h3>' +
            fila("sonido", "Sonido") + fila("vibracion", "Vibración") +
            '<button type="button" class="fl-btn" data-a="reiniciar">Reiniciar</button></div>');
        }
        function fila(k, t) {
          return '<div class="fl-fila"><span>' + t + '</span><button type="button" class="interruptor" role="switch" data-sw="' + k + '" aria-checked="' + (R.ajustes[k] ? "true" : "false") + '"' + (k === "vibracion" && !R.puedeVibrar ? " disabled" : "") + "><i></i></button></div>";
        }
        function sinVidas() {
          if (!S.jugando) return;
          S.jugando = false; pausar(); R.fb.fin();
          ov.innerHTML = '<div class="fl-card"><h3>Sin gotas</h3><p>Se acabaron las gotas. Quedaban ' + S.vivos + " flechas.</p>" +
            '<button type="button" class="fl-btn" data-a="reiniciar">Reintentar</button>' +
            (cfg.modo === "libre" ? '<button type="button" class="fl-btn suave" data-a="nuevo">Tablero nuevo</button>' : "") +
            '<button type="button" class="fl-btn suave" data-a="salir">Salir</button></div>';
          ov.hidden = false;
        }

        function limpiarTodo() {
          S.jugando = false; clearInterval(tic); clearTimeout(S.msgT);
          S.timers.forEach(clearTimeout); S.timers = [];
          S.raf.forEach(cancelAnimationFrame); S.raf = [];
          window.removeEventListener("resize", alCambiarTamano);
          if (ro) { ro.disconnect(); ro = null; }
        }
        limpiarJuego = limpiarTodo;

        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b) return;
          var d = b.dataset, a = d.a, r = rect();
          if (d.sw) {
            R.ajustes[d.sw] = !R.ajustes[d.sw]; R.guardarAjustes();
            b.setAttribute("aria-checked", R.ajustes[d.sw] ? "true" : "false"); return;
          }
          if (a === "salir") { limpiarTodo(); limpiarJuego = null; pantallaConfig(); }
          else if (a === "tema") {
            var i = TEMAS.map(function (t) { return t.id; }).indexOf(cfg.tema);
            cfg.tema = TEMAS[(i + 1) % TEMAS.length].id; guardarCfg(); raiz.setAttribute("style", varsTema());
          }
          else if (a === "ajustes") ajustes();
          else if (a === "cerrar") cerrarVentana();
          else if (a === "pista") pista();
          else if (a === "zmas") zoomEn(V.W / 2, V.H / 2, V.z * 1.5);
          else if (a === "zmenos") zoomEn(V.W / 2, V.H / 2, V.z / 1.5);
          else if (a === "zfit") animarVista(vistaFit);
          else if (a === "reiniciar") { limpiarTodo(); jugar(jugador, pl); }
          else if (a === "nuevo") { limpiarTodo(); jugar(jugador, plan()); }
        });

        function revisarFin() {
          if (S.vivos > 0 || S.anim > 0 || !S.jugando) return;
          S.jugando = false;
          after(function () { terminar(); }, 250);
        }

        function terminar() {
          var seg = Math.round(tiempo());
          limpiarTodo(); limpiarJuego = null;
          R.fb.fin();
          var prec = Math.round(S.aciertos / Math.max(1, S.aciertos + S.errores) * 100);
          var estrellas = S.errores === 0 ? 3 : S.errores <= 2 ? 2 : 1;
          var base = total * 10 * (1 + pl.tier * 0.4), bonus = Math.max(0, total * 1.5 - seg) * 3, pen = S.errores * 25 + S.pistasUsadas * 15;
          var pts = Math.max(0, Math.round(base + bonus - pen));
          var key = claveRecord(pl.tier), rec = R.leer(key, null), nuevo = false;
          if (!rec) { rec = { t: seg, p: pts }; nuevo = true; }
          else { if (seg < rec.t) { rec.t = seg; nuevo = true; } if (pts > rec.p) { rec.p = pts; nuevo = true; } }
          R.guardar(key, rec);
          if (cfg.modo === "niveles" && cfg.nivelSel === cfg.nivel) { cfg.nivel++; }
          guardarCfg();
          var guardado = R.registrarPartida(jugador, {
            juego: "Flechas", modo: (cfg.modo === "niveles" ? "Nivel " + cfg.nivelSel : cfg.modo === "diario" ? "Desafío del día" : "Libre") + " · " + T.n,
            config: T.c + "×" + T.f + " · " + total + " flechas · " + (vidasMax ? vidasMax + " gotas" : "sin límite de gotas") + " · " + (pistasMax < 0 ? "pistas ilimitadas" : pistasMax + " pistas"),
            valor: seg, unidad: "s", mejorEs: "min", stats: { aciertos: S.aciertos, fallos: S.errores, precision: prec }
          });
          var tit = estrellas === 3 ? "¡Pro de las flechas!" : estrellas === 2 ? "¡Muy bien!" : "¡Lo lograste!";
          var conf = "";
          for (var i = 0; i < 34; i++) conf += '<i style="left:' + Math.round(Math.random() * 100) + "%;background:" + COLS_MOV[i % COLS_MOV.length] + ";animation-delay:" + (Math.random() * 1.2).toFixed(2) + "s;animation-duration:" + (2.2 + Math.random() * 1.8).toFixed(2) + 's"></i>';
          var sigNivel = cfg.modo === "niveles";
          cont.innerHTML =
            '<section class="lz lz-res fl-res"><div class="fl-conf">' + conf + '</div><div class="lz-col centro">' +
              '<p class="eyebrow">' + R.esc(pl.titulo) + " · " + T.n + (jugador ? " · " + R.esc(jugador) : "") + "</p>" +
              '<div class="fl-estrellas">' + [1, 2, 3].map(function (n) { return '<span class="' + (n <= estrellas ? "on" : "") + '">★</span>'; }).join("") + "</div>" +
              "<h2>" + tit + "</h2>" +
              (nuevo ? '<span class="insignia">Nuevo récord</span>' : "") +
              '<dl class="stats"><div><dt>Tiempo</dt><dd>' + mmss(seg) + "</dd></div><div><dt>Puntuación</dt><dd>" + pts + "</dd></div>" +
              "<div><dt>Precisión</dt><dd>" + prec + " %</dd></div><div><dt>Errores</dt><dd>" + S.errores + "</dd></div>" +
              "<div><dt>Flechas</dt><dd>" + total + "</dd></div><div><dt>Pistas</dt><dd>" + S.pistasUsadas + "</dd></div></dl>" +
              '<p class="record">Mejor tiempo: ' + mmss(rec.t) + " · Mejor puntaje: " + rec.p + "</p>" +
              (guardado ? '<p class="record">Guardado en el historial.</p>' : "") +
              '<div class="acciones">' +
                (sigNivel ? '<button class="btn primario grande" type="button" data-a="sig">Siguiente nivel</button>' : cfg.modo === "libre" ? '<button class="btn primario grande" type="button" data-a="otra">Otro tablero</button>' : "") +
                '<button class="btn" type="button" data-a="rep">Repetir</button><button class="btn" type="button" data-a="config">Configurar</button><button class="btn" type="button" data-a="menu">Menú</button>' +
              "</div>" +
            "</div></section>";
          cont.querySelector(".fl-res").addEventListener("click", function (e) {
            var b = e.target.closest("[data-a]");
            if (!b) return;
            if (b.dataset.a === "sig") { cfg.nivelSel = Math.min(cfg.nivel, cfg.nivelSel + 1); guardarCfg(); jugar(jugador, plan()); }
            else if (b.dataset.a === "otra") jugar(jugador, plan());
            else if (b.dataset.a === "rep") jugar(jugador, pl);
            else if (b.dataset.a === "config") pantallaConfig();
            else if (b.dataset.a === "menu") R.salir();
          });
        }

        R.mantenerPantalla(true);
      }

      pantallaConfig();
      return function destruir() { if (limpiarJuego) limpiarJuego(); };
    }
  });
})(window.Reacciona);
