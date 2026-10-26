/* Juego: Luces.
   Cuadrícula de círculos. Tras una cuenta regresiva de 3 s se van encendiendo en azul (#084E96)
   y hay que tocarlos. Modos: Contrarreloj, Meta en tiempo, Carrera, Infinito (con vidas y dificultad
   creciente), Solo azules y Secuencia. */
(function (R) {
  var MODOS = [
    { id: "tiempo", nombre: "Contrarreloj", desc: "Toca todas las luces que puedas antes de que se acabe el tiempo." },
    { id: "meta", nombre: "Meta en tiempo", desc: "Logra una cantidad de toques antes de que pasen los segundos." },
    { id: "carrera", nombre: "Carrera", desc: "Completa una cantidad de toques lo más rápido que puedas." },
    { id: "infinito", nombre: "Infinito", desc: "Sin tiempo y cada vez más difícil: las luces duran menos, salen varias a la vez y más adelante aparecen luces rojas que no se deben tocar. Pierdes una vida si tocas un círculo apagado o una roja, o si dejas escapar una luz azul." },
    { id: "azules", nombre: "Solo azules", desc: "Toca solo las luces azules. Las rojas no se tocan (cada roja que toques resta un punto): esperas a que se apaguen o, si lo eliges, las apagas tocando un círculo vacío." },
    { id: "secuencia", nombre: "Secuencia", desc: "Mira la secuencia de luces y repítela. Cada ronda suma un paso y va más rápido. Si te equivocas pierdes una vida." }
  ];
  var PRESETS = [["Fácil", 3, 4], ["Medio", 4, 5], ["Difícil", 5, 6], ["Experto", 6, 8]];
  var DURACIONES = [[0, "Hasta tocarla"], [3000, "3 s"], [2000, "2 s"], [1000, "1 s"], [700, "0,7 s"]];
  var DEF = {
    modo: "tiempo", cols: 4, filas: 5, simult: 1, duracion: 0, seg: 30, toques: 20, segMeta: 30,
    vidas: 3, rojas: 30, velocidad: 700, rojaMs: 1500, rojaVacio: false
  };

  function nombreModo(id) { return MODOS.filter(function (m) { return m.id === id; })[0].nombre; }
  function corazones(rest, total) {
    var s = "";
    for (var i = 0; i < total; i++) s += i < rest ? "♥" : "♡";
    return s;
  }
  function campo(k, etiqueta, min, max, step, valor, unidad) {
    return '<label class="campo"><span class="campo-et">' + etiqueta +
      ' <b data-v="' + k + '" data-u="' + (unidad || "") + '">' + valor + (unidad || "") + '</b></span>' +
      '<input type="range" data-k="' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + valor + '"></label>';
  }
  function chipsVidas(v) {
    return '<p class="campo-et sola">Vidas</p><div class="chips">' +
      [1, 3].map(function (n) {
        return '<button type="button" class="chip' + (v === n ? " sel" : "") + '" data-vidas="' + n + '">' + n + (n === 1 ? " vida" : " vidas") + "</button>";
      }).join("") + "</div>";
  }

  function ajustesRoja(cfg) {
    return campo("rojaMs", "Duración de la luz roja", 500, 3000, 100, cfg.rojaMs, " ms") +
      '<p class="campo-et sola">Cuando sale una roja</p><div class="chips">' +
      '<button type="button" class="chip' + (!cfg.rojaVacio ? " sel" : "") + '" data-rv="0">Esperar a que se apague</button>' +
      '<button type="button" class="chip' + (cfg.rojaVacio ? " sel" : "") + '" data-rv="1">Tocar un círculo vacío</button></div>' +
      '<p class="nota">' + (cfg.rojaVacio
        ? "Al salir una roja, tócala apagándola con cualquier círculo vacío. No cuesta vida ni punto, y así no esperas a que se apague sola."
        : "La roja no se toca: se espera a que se apague sola.") + "</p>";
  }

  R.registrar({
    id: "luces",
    nombre: "Luces",
    descripcion: "Círculos que se encienden en azul. Tócalos lo más rápido que puedas.",
    preview: function () {
      var h = '<span class="pv-luces">';
      for (var i = 0; i < 12; i++) h += "<i" + (i === 5 ? ' class="on"' : i === 8 ? ' class="on rojo"' : "") + "></i>";
      return R.html(h + "</span>");
    },

    iniciar: function (cont) {
      var cfg = Object.assign({}, DEF, R.leer("luces.cfg", {}));
      var limpiarJuego = null;

      function guardarCfg() { R.guardar("luces.cfg", cfg); }
      function durTxt(d) { return d ? R.num(d / 1000, 1) + " s por luz" : "luz hasta tocarla"; }
      function etiqueta() {
        var g = cfg.cols + "×" + cfg.filas;
        var luces = cfg.simult + (cfg.simult === 1 ? " luz" : " luces");
        switch (cfg.modo) {
          case "tiempo": return g + " · " + luces + " · " + durTxt(cfg.duracion) + " · " + cfg.seg + " s";
          case "meta": return g + " · " + luces + " · " + durTxt(cfg.duracion) + " · " + cfg.toques + " toques en " + cfg.segMeta + " s";
          case "carrera": return g + " · " + luces + " · " + durTxt(cfg.duracion) + " · " + cfg.toques + " toques";
          case "infinito": return g + " · " + cfg.vidas + (cfg.vidas === 1 ? " vida" : " vidas") + " · roja " + R.num(cfg.rojaMs / 1000, 1) + " s" + (cfg.rojaVacio ? " · roja: círculo vacío" : "");
          case "azules": return g + " · " + luces + " · " + durTxt(cfg.duracion) + " · " + cfg.seg + " s · " + cfg.rojas + " % rojas · roja " + R.num(cfg.rojaMs / 1000, 1) + " s" + (cfg.rojaVacio ? " · roja: círculo vacío" : "");
          default: return g + " · " + cfg.vidas + (cfg.vidas === 1 ? " vida" : " vidas") + " · " + cfg.velocidad + " ms por paso";
        }
      }
      function claveRecord() { return "luces.rec." + cfg.modo + "|" + etiqueta(); }
      function textoRecord() {
        var r = R.leer(claveRecord(), null);
        if (r === null) return "Aún sin récord en esta configuración.";
        return cfg.modo === "meta" || cfg.modo === "carrera" ? "Récord: " + R.num(r, 2) + " s" : "Récord: " + r;
      }

      /* ---------- configuración ---------- */
      function pantallaConfig() {
        if (limpiarJuego) { limpiarJuego(); limpiarJuego = null; }
        R.mantenerPantalla(false);
        var modo = MODOS.filter(function (m) { return m.id === cfg.modo; })[0];
        var params = "", dificultad = "";
        if (cfg.modo === "tiempo") params = campo("seg", "Duración", 5, 120, 5, cfg.seg, " s");
        else if (cfg.modo === "meta") params = campo("toques", "Toques a lograr", 5, 100, 5, cfg.toques, "") + campo("segMeta", "En", 5, 120, 5, cfg.segMeta, " s");
        else if (cfg.modo === "carrera") params = campo("toques", "Toques a lograr", 5, 100, 5, cfg.toques, "");
        else if (cfg.modo === "infinito") params = chipsVidas(cfg.vidas) + ajustesRoja(cfg);
        else if (cfg.modo === "azules") params = campo("seg", "Duración", 5, 120, 5, cfg.seg, " s") + campo("rojas", "Luces rojas", 10, 60, 5, cfg.rojas, " %") + ajustesRoja(cfg);
        else params = campo("velocidad", "Velocidad inicial (tiempo por paso)", 300, 1200, 50, cfg.velocidad, " ms") + chipsVidas(cfg.vidas);

        if (cfg.modo !== "infinito" && cfg.modo !== "secuencia") {
          dificultad = "<h3>Dificultad</h3>" + campo("simult", "Luces a la vez", 1, 3, 1, cfg.simult, "") +
            '<p class="campo-et sola">Tiempo que dura cada luz</p><div class="chips">' +
            DURACIONES.map(function (d) {
              return '<button type="button" class="chip' + (d[0] === cfg.duracion ? " sel" : "") + '" data-dur="' + d[0] + '">' + d[1] + "</button>";
            }).join("") + "</div>";
        }

        var chipsModo = MODOS.map(function (m) {
          return '<button type="button" class="chip' + (m.id === cfg.modo ? " sel" : "") + '" data-modo="' + m.id + '">' + m.nombre + "</button>";
        }).join("");
        var chipsPre = PRESETS.map(function (p) {
          var sel = cfg.cols === p[1] && cfg.filas === p[2];
          return '<button type="button" class="chip' + (sel ? " sel" : "") + '" data-pre="' + p[1] + "x" + p[2] + '">' + p[0] + " " + p[1] + "×" + p[2] + "</button>";
        }).join("");

        var prevScroll = 0, old = cont.querySelector(".lz-scroll");
        if (old) prevScroll = old.scrollTop;

        cont.innerHTML =
          '<section class="lz lz-config">' +
            '<header class="lz-top"><button class="volver" type="button" data-a="volver" aria-label="Volver al menú">←</button><h2>Luces</h2></header>' +
            '<div class="lz-scroll"><div class="lz-col">' +
              "<h3>Modo</h3><div class=\"chips\">" + chipsModo + "</div>" +
              '<p class="nota">' + modo.desc + "</p>" + params +
              "<h3>Cuadrícula</h3><div class=\"chips\">" + chipsPre + "</div>" +
              campo("cols", "Columnas", 2, 6, 1, cfg.cols, "") + campo("filas", "Filas", 2, 8, 1, cfg.filas, "") +
              '<div class="lz-mini-caja"><div class="lz-mini"></div></div>' +
              dificultad +
              '<p class="record"></p>' +
            "</div></div>" +
            '<footer class="lz-pie"><div class="lz-col"><button class="btn primario grande" type="button" data-a="jugar">Comenzar</button></div></footer>' +
          "</section>";

        var raiz = cont.querySelector(".lz-config");
        R.pintarRangos(raiz);
        raiz.querySelector(".lz-scroll").scrollTop = prevScroll;
        actualizarMini(raiz); actualizarRecord(raiz);

        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b) return;
          if (b.dataset.a === "volver") R.salir();
          else if (b.dataset.a === "jugar") {
            guardarCfg();
            R.pedirJugador(cont, function (nombre) { jugar(nombre); }, pantallaConfig);
          }
          else if (b.dataset.modo) { cfg.modo = b.dataset.modo; guardarCfg(); pantallaConfig(); }
          else if (b.dataset.pre) { var p = b.dataset.pre.split("x"); cfg.cols = +p[0]; cfg.filas = +p[1]; guardarCfg(); pantallaConfig(); }
          else if (b.dataset.dur !== undefined) { cfg.duracion = +b.dataset.dur; guardarCfg(); pantallaConfig(); }
          else if (b.dataset.rv !== undefined) { cfg.rojaVacio = b.dataset.rv === "1"; guardarCfg(); pantallaConfig(); }
          else if (b.dataset.vidas) { cfg.vidas = +b.dataset.vidas; guardarCfg(); pantallaConfig(); }
        });
        raiz.addEventListener("input", function (e) {
          var k = e.target.dataset && e.target.dataset.k;
          if (!k) return;
          cfg[k] = +e.target.value;
          var v = raiz.querySelector('[data-v="' + k + '"]');
          if (v) v.textContent = e.target.value + v.dataset.u;
          guardarCfg();
          if (k === "cols" || k === "filas") {
            Array.prototype.forEach.call(raiz.querySelectorAll("[data-pre]"), function (c) {
              c.classList.toggle("sel", c.dataset.pre === cfg.cols + "x" + cfg.filas);
            });
          }
          actualizarMini(raiz); actualizarRecord(raiz);
        });
      }

      function actualizarRecord(raiz) { raiz.querySelector(".record").textContent = textoRecord(); }
      function actualizarMini(raiz) {
        var mini = raiz.querySelector(".lz-mini");
        var d = Math.floor(Math.min(240 / cfg.filas, 240 / cfg.cols, 38));
        var gap = Math.max(4, Math.round(d / 5));
        mini.style.gridTemplateColumns = "repeat(" + cfg.cols + "," + d + "px)";
        mini.style.gap = gap + "px";
        var n = cfg.cols * cfg.filas, h = "";
        var conRojas = cfg.modo === "azules" || cfg.modo === "infinito";
        var enc = cfg.modo === "infinito" || cfg.modo === "secuencia" ? 1 : Math.min(cfg.simult, Math.floor(n / 2));
        for (var i = 0; i < n; i++) {
          var cl = i < enc ? "on" : (conRojas && i === enc + 1 ? "on rojo" : "");
          h += '<i style="width:' + d + "px;height:" + d + 'px"' + (cl ? ' class="' + cl + '"' : "") + "></i>";
        }
        mini.innerHTML = h;
      }

      /* ---------- pantalla de partida (común) ---------- */
      function montar() {
        var cols = cfg.cols, filas = cfg.filas, n = cols * filas;
        cont.innerHTML =
          '<section class="lz lz-juego">' +
            '<div class="lz-hud">' +
              '<button class="volver" type="button" data-a="parar" aria-label="Terminar">✕</button>' +
              '<div class="lz-dato"><span class="v" data-h="t">0,0</span><small data-h="tl"></small></div>' +
              '<div class="lz-dato der"><span class="v" data-h="p">0</span><small data-h="pl"></small></div>' +
            "</div>" +
            '<div class="lz-barra"><i></i></div>' +
            '<div class="lz-msg" aria-live="polite"></div>' +
            '<div class="lz-area"><div class="lz-grid"></div></div>' +
            '<div class="lz-cuenta" aria-live="assertive"></div>' +
          "</section>";
        var P = { n: n, cols: cols, filas: filas };
        P.raiz = cont.querySelector(".lz-juego");
        P.area = P.raiz.querySelector(".lz-area");
        P.grid = P.raiz.querySelector(".lz-grid");
        P.cuenta = P.raiz.querySelector(".lz-cuenta");
        P.msg = P.raiz.querySelector(".lz-msg");
        P.hT = P.raiz.querySelector('[data-h="t"]'); P.hTl = P.raiz.querySelector('[data-h="tl"]');
        P.hP = P.raiz.querySelector('[data-h="p"]'); P.hPl = P.raiz.querySelector('[data-h="pl"]');
        P.barraCont = P.raiz.querySelector(".lz-barra");
        P.barra = P.barraCont.querySelector("i");
        var h = "";
        for (var i = 0; i < n; i++) h += '<div class="c" data-i="' + i + '"></div>';
        P.grid.innerHTML = h;
        P.celdas = Array.prototype.slice.call(P.grid.children);

        function ajustar() {
          var PAD = 14;
          var w = P.area.clientWidth - PAD * 2, hh = P.area.clientHeight - PAD * 2;
          if (w <= 0 || hh <= 0) return;
          var gap = Math.max(6, Math.min(18, Math.round(Math.min(w, hh) / 38)));
          var d = Math.floor(Math.min((w - gap * (cols - 1)) / cols, (hh - gap * (filas - 1)) / filas));
          P.grid.style.gridTemplateColumns = "repeat(" + cols + "," + d + "px)";
          P.grid.style.gap = gap + "px";
          P.grid.style.setProperty("--d", d + "px");
        }
        ajustar();
        window.addEventListener("resize", ajustar);
        var ro = null;
        if (window.ResizeObserver) { ro = new ResizeObserver(ajustar); ro.observe(P.area); }

        P.S = { jugando: false, timers: [], raf: 0 };
        P.after = function (fn, ms) { var id = setTimeout(fn, ms); P.S.timers.push(id); return id; };
        P.parar = function () {
          P.S.jugando = false;
          cancelAnimationFrame(P.S.raf);
          P.S.timers.forEach(clearTimeout); P.S.timers = [];
        };
        P.destello = function (el, clase) {
          el.classList.add(clase);
          setTimeout(function () { el.classList.remove(clase); }, 220);
        };
        P.golpe = function () {
          P.raiz.classList.add("golpe");
          setTimeout(function () { P.raiz.classList.remove("golpe"); }, 260);
        };
        P.limpiar = function () {
          P.parar();
          window.removeEventListener("resize", ajustar);
          if (ro) { ro.disconnect(); ro = null; }
        };
        limpiarJuego = P.limpiar;
        return P;
      }

      function cuentaRegresiva(P, alTerminar) {
        R.mantenerPantalla(true);
        [3, 2, 1].forEach(function (num, idx) {
          P.after(function () {
            P.cuenta.textContent = num;
            P.cuenta.classList.remove("pulso"); void P.cuenta.offsetWidth; P.cuenta.classList.add("pulso");
            R.fb.cuenta();
          }, idx * 1000);
        });
        P.after(function () { P.cuenta.hidden = true; R.fb.ya(); alTerminar(); }, 3000);
      }

      /* ---------- jugar ---------- */
      function jugar(jugador) {
        var P = montar();
        if (cfg.modo === "secuencia") logicaSecuencia(P, jugador);
        else logicaLuces(P, jugador);
      }

      /* Modos de luces que se encienden: tiempo, meta, carrera, infinito, azules. */
      function logicaLuces(P, jugador) {
        var modo = cfg.modo, n = P.n, celdas = P.celdas, S = P.S;
        var infinito = modo === "infinito", azules = modo === "azules";
        var metaToques = (modo === "meta" || modo === "carrera") ? cfg.toques : 0;
        var limite = modo === "tiempo" || azules ? cfg.seg : (modo === "meta" ? cfg.segMeta : 0);
        var simultBase = Math.max(1, Math.min(cfg.simult, Math.floor(n / 2)));
        var vidasTotal = infinito ? cfg.vidas : 0, vidasRest = vidasTotal;
        var lit = {}, ult = -1, t0 = 0;
        var est = { hits: 0, fuera: 0, perdidas: 0, rojas: 0, esquivadas: 0, rts: [], tUltimo: 0 };
        var rojaVacio = cfg.rojaVacio && (infinito || azules);
        if (rojaVacio) P.msg.classList.add("fijo");

        function nivel() { return infinito ? Math.floor(est.hits / 5) : 0; }
        function simultAhora() {
          if (!infinito) return simultBase;
          var L = nivel(), s = L >= 9 ? 3 : (L >= 4 ? 2 : 1);
          return Math.max(1, Math.min(s, Math.floor(n / 2)));
        }
        function durAhora() { return infinito ? Math.max(600, 3000 - 180 * nivel()) : cfg.duracion; }
        function probRojo() {
          if (azules) return cfg.rojas / 100;
          if (infinito) { var L = nivel(); return L < 2 ? 0 : Math.min(0.35, 0.08 + 0.04 * (L - 2)); }
          return 0;
        }
        function puntos() { return azules ? Math.max(0, est.hits - est.rojas) : est.hits; }

        P.hTl.textContent = infinito ? "vidas" : (limite ? "segundos" : "tiempo");
        P.hPl.textContent = metaToques ? "de " + metaToques : (azules ? "puntos" : "aciertos");
        P.hT.textContent = infinito ? corazones(vidasRest, vidasTotal) : (limite ? R.num(limite, 1) : "0,0");
        P.hP.textContent = "0";
        if (infinito) P.barraCont.style.visibility = "hidden";

        function hud(ahora) {
          var el = (ahora - t0) / 1000;
          if (limite) {
            var rest = Math.max(0, limite - el);
            P.hT.textContent = R.num(rest, 1);
            P.barra.style.transform = "scaleX(" + (rest / limite) + ")";
          } else if (modo === "carrera") {
            P.hT.textContent = R.num(el, 1);
            P.barra.style.transform = "scaleX(" + Math.min(1, est.hits / metaToques) + ")";
          }
          if (infinito) {
            P.hT.textContent = corazones(vidasRest, vidasTotal);
            P.hPl.textContent = "aciertos · nivel " + (nivel() + 1);
          }
          P.hP.textContent = puntos();
        }
        function tick() {
          if (!S.jugando) return;
          var ahora = performance.now();
          hud(ahora);
          if (limite && (ahora - t0) / 1000 >= limite) { terminar("tiempo"); return; }
          S.raf = requestAnimationFrame(tick);
        }

        function encenderUno(i) {
          var el = celdas[i], rojo = Math.random() < probRojo();
          var d = durAhora(), dd = rojo ? cfg.rojaMs : d;
          el.classList.remove("hit", "err", "miss");
          el.classList.add("on");
          if (rojo) el.classList.add("rojo");
          var o = { t: performance.now(), rojo: rojo, timer: 0 };
          if (dd) o.timer = P.after(function () { expira(i); }, dd);
          lit[i] = o;
        }
        function encender() {
          var libres = [], s = simultAhora();
          for (var i = 0; i < n; i++) if (!lit[i] && i !== ult) libres.push(i);
          while (Object.keys(lit).length < s && libres.length) {
            var k = Math.floor(Math.random() * libres.length);
            encenderUno(libres.splice(k, 1)[0]);
          }
          aviso();
        }
        function aviso() {
          if (!rojaVacio) return;
          var hay = Object.keys(lit).some(function (k) { return lit[k].rojo; });
          P.msg.textContent = hay ? "Roja: toca un círculo vacío" : "";
        }
        function apagar(i) {
          if (lit[i]) clearTimeout(lit[i].timer);
          delete lit[i];
          celdas[i].classList.remove("on", "rojo");
          aviso();
        }
        function quitarVida() {
          vidasRest--;
          R.fb.vida(); P.golpe();
          hud(performance.now());
          if (vidasRest <= 0) { terminar("vidas"); return true; }
          return false;
        }
        function expira(i) {
          if (!S.jugando || !lit[i]) return;
          var o = lit[i];
          apagar(i); ult = i;
          if (!o.rojo) {
            est.perdidas++; P.destello(celdas[i], "miss");
            if (infinito) { if (quitarVida()) return; } else R.fb.mal();
          }
          encender(); hud(performance.now());
        }
        function acierto(i, ahora) {
          est.rts.push(ahora - lit[i].t);
          est.hits++; est.tUltimo = ahora - t0;
          apagar(i); P.destello(celdas[i], "hit"); R.fb.ok();
          ult = i;
          hud(ahora);
          if (metaToques && est.hits >= metaToques) { terminar("meta"); return; }
          encender();
        }

        P.grid.addEventListener("pointerdown", function (e) {
          if (!S.jugando) return;
          var c = e.target.closest(".c");
          if (!c) return;
          e.preventDefault();
          var i = +c.dataset.i, ahora = performance.now();
          if (lit[i] && !lit[i].rojo) { acierto(i, ahora); return; }
          if (lit[i] && lit[i].rojo) {
            est.rojas++; apagar(i); ult = i; P.destello(c, "err");
            if (infinito) { if (quitarVida()) return; } else R.fb.mal();
            encender(); hud(ahora); return;
          }
          if (rojaVacio) {
            var rojos = Object.keys(lit).filter(function (k) { return lit[k].rojo; });
            if (rojos.length) {
              rojos.sort(function (a, b) { return lit[a].t - lit[b].t; });
              var r = +rojos[0];
              apagar(r); ult = r; est.esquivadas++;
              P.destello(c, "hit"); R.fb.ok();
              encender(); hud(ahora);
              return;
            }
          }
          est.fuera++; P.destello(c, "err");
          if (infinito) { if (quitarVida()) return; } else R.fb.mal();
        });

        function terminar(motivo) {
          var ahora = performance.now(), durReal;
          if (motivo === "meta") durReal = est.tUltimo / 1000;
          else if (limite) durReal = limite;
          else durReal = (ahora - t0) / 1000;
          if (motivo === "tiempo") R.fb.fin();
          P.parar();
          hud(t0 + durReal * 1000);
          construirResultado(motivo, durReal, est, nivel(), jugador);
        }

        cuentaRegresiva(P, function () {
          S.jugando = true; t0 = performance.now();
          encender();
          if (limite || modo === "carrera") S.raf = requestAnimationFrame(tick);
        });

        P.raiz.addEventListener("click", function (e) {
          if (!e.target.closest("[data-a=parar]")) return;
          if (S.jugando && infinito) { terminar("parar"); return; }
          P.limpiar(); limpiarJuego = null; pantallaConfig();
        });
      }

      /* Modo Secuencia. */
      function logicaSecuencia(P, jugador) {
        var n = P.n, celdas = P.celdas, S = P.S;
        var seq = [], ronda = 0, completadas = 0, pos = 0, fase = "espera";
        var vidasTotal = cfg.vidas, vidasRest = vidasTotal;
        var est = { pasosOk: 0, errores: 0 };

        P.barraCont.style.visibility = "hidden";
        P.hTl.textContent = "ronda"; P.hT.textContent = "–";
        P.hPl.textContent = "vidas"; P.hP.textContent = corazones(vidasRest, vidasTotal);

        function msg(t) { P.msg.textContent = t; }
        function paso() { return Math.max(250, cfg.velocidad * Math.pow(0.94, ronda - 1)); }
        function luz(i, ms) {
          var el = celdas[i];
          el.classList.add("on");
          R.tono(R.nota(i), Math.min(ms, 320), "sine", 0.25);
          P.after(function () { el.classList.remove("on"); }, ms);
        }
        function mostrar() {
          fase = "mirar"; msg("Mira");
          var p = paso(), cada = p * 1.4;
          P.after(function () {
            seq.forEach(function (c, k) { P.after(function () { luz(c, p); }, k * cada); });
            P.after(function () { fase = "tu"; pos = 0; msg("Tu turno"); }, seq.length * cada + 120);
          }, 700);
        }
        function nuevaRonda() {
          ronda++;
          var nxt;
          do { nxt = Math.floor(Math.random() * n); } while (n > 1 && nxt === seq[seq.length - 1]);
          seq.push(nxt);
          P.hT.textContent = ronda;
          mostrar();
        }

        P.grid.addEventListener("pointerdown", function (e) {
          if (!S.jugando || fase !== "tu") return;
          var c = e.target.closest(".c");
          if (!c) return;
          e.preventDefault();
          var i = +c.dataset.i;
          if (i === seq[pos]) {
            luz(i, 170); est.pasosOk++; pos++;
            if (pos === seq.length) {
              fase = "espera"; completadas = ronda; msg("¡Bien!");
              P.after(function () { R.fb.ok(); }, 220);
              P.after(nuevaRonda, 1000);
            }
          } else {
            fase = "espera"; est.errores++; vidasRest--;
            P.destello(c, "err"); P.golpe(); R.fb.vida();
            P.hP.textContent = corazones(vidasRest, vidasTotal);
            if (vidasRest <= 0) { msg("Fin"); P.after(function () { terminar("vidas"); }, 700); }
            else { msg("Otra vez"); P.after(mostrar, 1100); }
          }
        });

        function terminar(motivo) {
          if (motivo === "vidas") R.fb.fin();
          P.parar();
          construirResultadoSecuencia(motivo, completadas, est, jugador);
        }

        cuentaRegresiva(P, function () { S.jugando = true; nuevaRonda(); });

        P.raiz.addEventListener("click", function (e) {
          if (!e.target.closest("[data-a=parar]")) return;
          if (S.jugando) { terminar("parar"); return; }
          P.limpiar(); limpiarJuego = null; pantallaConfig();
        });
      }

      /* ---------- resultados ---------- */
      function construirResultado(motivo, dseg, est, nivel, jugador) {
        var modo = cfg.modo, infinito = modo === "infinito", azules = modo === "azules";
        var fallos = est.fuera + est.perdidas + est.rojas;
        var total = est.hits + fallos;
        var prec = total ? Math.round((est.hits / total) * 100) : 0;
        var media = est.rts.length ? est.rts.reduce(function (a, b) { return a + b; }, 0) / est.rts.length : 0;
        var mejor = est.rts.length ? Math.min.apply(null, est.rts) : 0;
        var tps = dseg > 0 ? est.hits / dseg : 0;
        var puntos = azules ? Math.max(0, est.hits - est.rojas) : est.hits;

        var info = { jugador: jugador, modoNombre: nombreModo(modo), unidad: "aciertos", mejorEs: "max", valor: null, modoHist: nombreModo(modo) };
        if (modo === "tiempo") { info.titulo = "¡Tiempo!"; info.grande = est.hits; info.etq = "aciertos"; info.valor = est.hits; }
        else if (azules) { info.titulo = "¡Tiempo!"; info.grande = puntos; info.etq = "puntos"; info.valor = puntos; info.unidad = "puntos"; }
        else if (infinito) { info.titulo = motivo === "vidas" ? "Sin vidas" : "Terminado"; info.grande = est.hits; info.etq = "aciertos"; info.valor = est.hits; }
        else if (modo === "carrera") { info.titulo = "¡Carrera completa!"; info.grande = R.num(dseg, 2); info.etq = "segundos"; info.valor = +dseg.toFixed(2); info.mejorEs = "min"; info.unidad = "s"; }
        else if (motivo === "meta") { info.titulo = "¡Meta lograda!"; info.grande = R.num(dseg, 2); info.etq = "segundos"; info.valor = +dseg.toFixed(2); info.mejorEs = "min"; info.unidad = "s"; }
        else { info.titulo = "No llegaste a la meta"; info.grande = est.hits + " / " + cfg.toques; info.etq = "toques"; info.valorHist = est.hits; info.modoHist = nombreModo(modo) + " (no lograda)"; info.unidad = "toques"; }

        info.stats = [
          ["Aciertos", est.hits], ["Fallos", fallos], ["Precisión", prec + " %"],
          ["Reacción media", est.rts.length ? Math.round(media) + " ms" : "–"],
          ["Mejor reacción", est.rts.length ? Math.round(mejor) + " ms" : "–"],
          ["Toques por segundo", R.num(tps, 2)]
        ];
        if (azules) info.stats.splice(1, 0, ["Rojas tocadas", est.rojas]);
        if ((azules || infinito) && cfg.rojaVacio) info.stats.splice(azules ? 2 : 1, 0, ["Rojas apagadas", est.esquivadas]);
        if (infinito) info.stats.splice(1, 0, ["Nivel alcanzado", nivel + 1]);
        info.hist = { aciertos: est.hits, fallos: fallos, precision: prec, rtMedia: est.rts.length ? Math.round(media) : null, rtMejor: est.rts.length ? Math.round(mejor) : null };
        resultado(info);
      }

      function construirResultadoSecuencia(motivo, completadas, est, jugador) {
        var total = est.pasosOk + est.errores;
        var prec = total ? Math.round((est.pasosOk / total) * 100) : 0;
        resultado({
          jugador: jugador, modoNombre: "Secuencia", modoHist: "Secuencia", unidad: "rondas", mejorEs: "max",
          titulo: motivo === "vidas" ? "Fin de la secuencia" : "Terminado",
          grande: completadas, etq: "rondas completas", valor: completadas,
          stats: [["Rondas completas", completadas], ["Errores", est.errores], ["Pasos correctos", est.pasosOk], ["Precisión", prec + " %"]],
          hist: { aciertos: est.pasosOk, fallos: est.errores, precision: prec, rtMedia: null, rtMejor: null }
        });
      }

      function resultado(info) {
        if (limpiarJuego) { limpiarJuego(); limpiarJuego = null; }
        R.mantenerPantalla(false);
        var nuevo = false, rec = null, guardado = false;
        var key = claveRecord();
        if (info.valor !== null && info.valor > 0) {
          rec = R.leer(key, null);
          if (rec === null || (info.mejorEs === "max" ? info.valor > rec : info.valor < rec)) {
            R.guardar(key, info.valor); rec = info.valor; nuevo = true;
          }
        } else rec = R.leer(key, null);
        var recTxt = rec === null ? "" : (info.mejorEs === "max" ? "Récord: " + rec : "Récord: " + R.num(rec, 2) + " s");

        var v = info.valor !== null ? info.valor : info.valorHist;
        if (v !== undefined && v !== null) {
          guardado = R.registrarPartida(info.jugador, {
            juego: "Luces", modo: info.modoHist, config: etiqueta(), valor: v, unidad: info.unidad,
            mejorEs: info.mejorEs, stats: info.hist
          });
        }

        cont.innerHTML =
          '<section class="lz lz-res"><div class="lz-col centro">' +
            '<p class="eyebrow">' + R.esc(info.modoNombre) + " · " + cfg.cols + "×" + cfg.filas + (info.jugador ? " · " + R.esc(info.jugador) : "") + "</p>" +
            "<h2>" + info.titulo + "</h2>" +
            '<div class="gran"><span>' + info.grande + "</span><small>" + info.etq + "</small></div>" +
            (nuevo ? '<span class="insignia">Nuevo récord</span>' : '<p class="record">' + recTxt + "</p>") +
            '<dl class="stats">' + info.stats.map(function (s) { return "<div><dt>" + s[0] + "</dt><dd>" + s[1] + "</dd></div>"; }).join("") + "</dl>" +
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
          if (b.dataset.a === "otra") jugar(info.jugador);
          else if (b.dataset.a === "config") pantallaConfig();
          else if (b.dataset.a === "menu") R.salir();
        });
      }

      pantallaConfig();
      return function destruir() { if (limpiarJuego) limpiarJuego(); };
    }
  });
})(window.Reacciona);
