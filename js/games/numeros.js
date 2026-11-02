/* Juego: Números en movimiento.
   Cuadritos numerados que se mueven y se superponen. Hay que tocarlos en orden (1, 2, 3…).
   Modos: Contra el tiempo, Lo más rápido, Desaparecen y Memoria. */
(function (R) {
  var MODOS = [
    { id: "tiempo", nombre: "Contra el tiempo", desc: "Toca los números en orden antes de que se acabe el tiempo. Los que ya tocaste se quedan en pantalla, apagados, y todo sigue moviéndose. Si los completas todos, aparece otra tanda. Gana quien toca más números correctos." },
    { id: "rapido", nombre: "Lo más rápido", desc: "Toca todos los números en orden en el menor tiempo posible. Los tocados se quedan en pantalla, apagados, y todo sigue moviéndose. Cada error suma una penalización al tiempo." },
    { id: "desaparecen", nombre: "Desaparecen", desc: "Igual que «Lo más rápido», pero cada número que tocas desaparece y la pantalla se va despejando. Cada error suma una penalización al tiempo." },
    { id: "memoria", nombre: "Memoria", desc: "Los números se muestran unos segundos y luego se tapan con «?». Todo sigue moviéndose: toca los números en orden de memoria. Si te equivocas se descubre ese número un instante y suma una penalización." }
  ];
  var PENAS = [[0, "Sin penalización"], [1, "+1 s por error"], [2, "+2 s por error"]];
  var DEF = { modo: "tiempo", n: 25, vel: 4, orden: "asc", pista: true, pena: 1, seg: 60, memSeg: 4 };
  var PAL = [
    ["#41306b", "#7a63b8"], ["#2b4573", "#5b84c8"], ["#2a5649", "#52a58c"],
    ["#5f4326", "#b98a52"], ["#5f2f2c", "#b9625b"]
  ];

  function campo(k, etiqueta, min, max, step, valor, unidad) {
    return '<label class="campo"><span class="campo-et">' + etiqueta +
      ' <b data-v="' + k + '" data-u="' + (unidad || "") + '">' + valor + (unidad || "") + '</b></span>' +
      '<input type="range" data-k="' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + valor + '"></label>';
  }
  function mmss(s) { return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function modoDe(id) { return MODOS.filter(function (m) { return m.id === id; })[0]; }

  R.registrar({
    id: "numeros",
    nombre: "Números en movimiento",
    descripcion: "Cuadritos numerados que se mueven. Tócalos en orden lo más rápido que puedas.",
    preview: function () {
      var d = [[6, 8, 0, 3], [52, 4, 1, 7], [24, 44, 2, 1], [62, 50, 3, 4], [8, 62, 4, 2]];
      var h = '<span class="pv-numeros">';
      d.forEach(function (x) {
        h += '<i style="left:' + x[0] + "%;top:" + x[1] + "%;--c:" + PAL[x[2]][0] + ";--b:" + PAL[x[2]][1] + '"' + (x[3] === 1 ? ' class="sig"' : "") + ">" + x[3] + "</i>";
      });
      return R.html(h + "</span>");
    },

    iniciar: function (cont) {
      var cfg = Object.assign({}, DEF, R.leer("numeros.cfg", {}));
      var limpiarJuego = null;

      function guardarCfg() { R.guardar("numeros.cfg", cfg); }
      function etiqueta() {
        var p = cfg.n + " números · " + (cfg.orden === "asc" ? "1→" + cfg.n : cfg.n + "→1") + " · velocidad " + cfg.vel;
        if (cfg.modo === "tiempo") p += " · " + cfg.seg + " s";
        else p += " · penalización " + cfg.pena + " s";
        if (cfg.modo === "memoria") p += " · memorizar " + cfg.memSeg + " s";
        else if (!cfg.pista) p += " · sin pista";
        return p;
      }
      function claveRecord() { return "numeros.rec." + cfg.modo + "|" + etiqueta(); }
      function textoRecord() {
        var r = R.leer(claveRecord(), null);
        if (r === null) return "Aún sin récord en esta configuración.";
        return cfg.modo === "tiempo" ? "Récord: " + r + " números" : "Récord: " + R.num(r, 2) + " s";
      }

      /* ---------- configuración ---------- */
      function pantallaConfig() {
        if (limpiarJuego) { limpiarJuego(); limpiarJuego = null; }
        R.mantenerPantalla(false);
        var modo = modoDe(cfg.modo);
        var params = "";
        if (cfg.modo === "tiempo") params = campo("seg", "Duración", 20, 180, 10, cfg.seg, " s");
        else if (cfg.modo === "memoria") params = campo("memSeg", "Tiempo para memorizar", 2, 10, 1, cfg.memSeg, " s");

        var chipsModo = MODOS.map(function (m) {
          return '<button type="button" class="chip' + (m.id === cfg.modo ? " sel" : "") + '" data-modo="' + m.id + '">' + m.nombre + "</button>";
        }).join("");
        var orden = '<p class="campo-et sola">Orden</p><div class="chips">' +
          '<button type="button" class="chip' + (cfg.orden === "asc" ? " sel" : "") + '" data-orden="asc">Ascendente 1 → ' + cfg.n + "</button>" +
          '<button type="button" class="chip' + (cfg.orden === "desc" ? " sel" : "") + '" data-orden="desc">Descendente ' + cfg.n + " → 1</button></div>";
        var pista = cfg.modo === "memoria" ? "" :
          '<p class="campo-et sola">Pista</p><div class="chips">' +
          '<button type="button" class="chip' + (cfg.pista ? " sel" : "") + '" data-pista="1">Siguiente en rojo</button>' +
          '<button type="button" class="chip' + (!cfg.pista ? " sel" : "") + '" data-pista="0">Sin pista</button></div>' +
          '<p class="nota">' + (cfg.pista ? "El siguiente número se ve en rojo. Arriba siempre se indica cuál toca." : "Sin resaltar: solo arriba se indica qué número toca y tienes que encontrarlo.") + "</p>";
        var pena = cfg.modo === "tiempo" ? "" :
          '<p class="campo-et sola">Errores</p><div class="chips">' +
          PENAS.map(function (p) {
            return '<button type="button" class="chip' + (cfg.pena === p[0] ? " sel" : "") + '" data-pena="' + p[0] + '">' + p[1] + "</button>";
          }).join("") + "</div>";

        var prevScroll = 0, old = cont.querySelector(".lz-scroll");
        if (old) prevScroll = old.scrollTop;

        cont.innerHTML =
          '<section class="lz lz-config">' +
            '<header class="lz-top"><button class="volver" type="button" data-a="volver" aria-label="Volver al menú">←</button><h2>Números</h2></header>' +
            '<div class="lz-scroll"><div class="lz-col">' +
              '<h3>Modo</h3><div class="chips">' + chipsModo + "</div>" +
              '<p class="nota">' + modo.desc + "</p>" + params +
              "<h3>Dificultad</h3>" +
              campo("n", "Cantidad de números", 5, 40, 1, cfg.n, "") +
              campo("vel", "Velocidad", 0, 10, 1, cfg.vel, "") +
              orden + pista + pena +
              '<p class="record"></p>' +
            "</div></div>" +
            '<footer class="lz-pie"><div class="lz-col"><button class="btn primario grande" type="button" data-a="jugar">Comenzar</button></div></footer>' +
          "</section>";

        var raiz = cont.querySelector(".lz-config");
        R.pintarRangos(raiz);
        raiz.querySelector(".lz-scroll").scrollTop = prevScroll;
        raiz.querySelector(".record").textContent = textoRecord();

        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b) return;
          if (b.dataset.a === "volver") R.salir();
          else if (b.dataset.a === "jugar") {
            guardarCfg();
            R.pedirJugador(cont, function (nombre) { jugar(nombre); }, pantallaConfig);
          }
          else if (b.dataset.modo) { cfg.modo = b.dataset.modo; guardarCfg(); pantallaConfig(); }
          else if (b.dataset.orden) { cfg.orden = b.dataset.orden; guardarCfg(); pantallaConfig(); }
          else if (b.dataset.pista !== undefined) { cfg.pista = b.dataset.pista === "1"; guardarCfg(); pantallaConfig(); }
          else if (b.dataset.pena !== undefined) { cfg.pena = +b.dataset.pena; guardarCfg(); pantallaConfig(); }
        });
        raiz.addEventListener("input", function (e) {
          var k = e.target.dataset && e.target.dataset.k;
          if (!k) return;
          cfg[k] = +e.target.value;
          var v = raiz.querySelector('[data-v="' + k + '"]');
          if (v) v.textContent = e.target.value + v.dataset.u;
          guardarCfg();
          if (k === "n") {
            var asc = raiz.querySelector('[data-orden="asc"]'), desc = raiz.querySelector('[data-orden="desc"]');
            if (asc) asc.textContent = "Ascendente 1 → " + cfg.n;
            if (desc) desc.textContent = "Descendente " + cfg.n + " → 1";
          }
          raiz.querySelector(".record").textContent = textoRecord();
        });
      }

      /* ---------- partida ---------- */
      function jugar(jugador) {
        cont.innerHTML =
          '<section class="lz lz-juego nm">' +
            '<div class="lz-hud">' +
              '<button class="volver" type="button" data-a="parar" aria-label="Terminar">✕</button>' +
              '<div class="lz-dato"><span class="v" data-h="t">0,0</span><small data-h="tl">' + (cfg.modo === "tiempo" ? "Restante" : "Tiempo") + "</small></div>" +
              '<div class="lz-dato der"><span class="v" data-h="p">0</span><small data-h="pl">' + (cfg.modo === "tiempo" ? "Números" : "Hechos") + "</small></div>" +
            "</div>" +
            '<div class="lz-barra"><i></i></div>' +
            '<div class="lz-msg fijo" aria-live="polite"></div>' +
            '<div class="nm-area"><div class="nm-campo"></div></div>' +
            '<div class="lz-cuenta" aria-live="assertive"></div>' +
          "</section>";
        var raiz = cont.querySelector(".nm");
        var area = raiz.querySelector(".nm-campo");
        var cuenta = raiz.querySelector(".lz-cuenta"), msg = raiz.querySelector(".lz-msg");
        var hT = raiz.querySelector('[data-h="t"]'), hP = raiz.querySelector('[data-h="p"]');
        var barra = raiz.querySelector(".lz-barra i");
        var S = {
          jugando: false, fase: "cuenta", timers: [], raf: 0, last: 0, tiles: [], orden: [],
          k: 0, hits: 0, errores: 0, extra: 0, rondas: 0, t0: 0, w: 0, h: 0, s: 48
        };
        barra.style.transition = "none";

        function after(fn, ms) { var id = setTimeout(fn, ms); S.timers.push(id); return id; }
        function sig() { return S.orden[S.k]; }
        function medir() {
          S.w = area.clientWidth; S.h = area.clientHeight;
          var base = Math.sqrt(Math.max(1, S.w * S.h) / cfg.n);
          S.s = Math.round(Math.max(44, Math.min(78, base * 0.55)));
        }
        var ro = null;
        function alCambiarTamano() {
          S.w = area.clientWidth; S.h = area.clientHeight;
          var mw = Math.max(0, S.w - S.s), mh = Math.max(0, S.h - S.s);
          S.tiles.forEach(function (t) { t.x = Math.min(t.x, mw); t.y = Math.min(t.y, mh); });
        }
        window.addEventListener("resize", alCambiarTamano);
        if (window.ResizeObserver) { ro = new ResizeObserver(alCambiarTamano); ro.observe(area); }

        function crear() {
          area.innerHTML = ""; S.tiles = []; S.k = 0; S.orden = [];
          medir();
          var vmax = cfg.vel ? Math.min(S.w, S.h) * (0.02 + 0.035 * cfg.vel) : 0;
          for (var i = 1; i <= cfg.n; i++) {
            var c = PAL[Math.floor(Math.random() * PAL.length)];
            var el = document.createElement("div");
            el.className = "nm-t" + (cfg.modo === "memoria" && S.fase === "juego" ? " oculto" : "");
            el.style.cssText = "--c:" + c[0] + ";--b:" + c[1] + ";width:" + S.s + "px;height:" + S.s + "px;font-size:" + Math.round(S.s * 0.5) + "px";
            el.innerHTML = "<span>" + i + "</span>";
            var ang = Math.random() * Math.PI * 2, sp = vmax * (0.7 + Math.random() * 0.6);
            var t = {
              n: i, el: el, hecho: false,
              x: Math.random() * Math.max(0, S.w - S.s), y: Math.random() * Math.max(0, S.h - S.s),
              vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp
            };
            el.__t = t;
            el.style.transform = "translate3d(" + t.x.toFixed(1) + "px," + t.y.toFixed(1) + "px,0)";
            area.appendChild(el);
            S.tiles.push(t);
            S.orden.push(cfg.orden === "asc" ? i : cfg.n - i + 1);
          }
          marcarSig();
        }
        function marcarSig() {
          var quiere = cfg.pista && cfg.modo !== "memoria";
          S.tiles.forEach(function (t) { t.el.classList.toggle("sig", quiere && !t.hecho && t.n === sig()); });
          if (S.fase === "juego") msg.textContent = S.k < cfg.n ? "Siguiente: " + sig() : "";
        }
        function pintarProgreso() {
          hP.textContent = cfg.modo === "tiempo" ? S.hits : S.k + " / " + cfg.n;
        }

        function mover(dt) {
          var mw = Math.max(0, S.w - S.s), mh = Math.max(0, S.h - S.s);
          S.tiles.forEach(function (t) {
            if (t.vx || t.vy) {
              var a = (Math.random() - 0.5) * 2.4 * dt, c = Math.cos(a), s = Math.sin(a);
              var vx = t.vx * c - t.vy * s, vy = t.vx * s + t.vy * c;
              t.vx = vx; t.vy = vy;
              t.x += vx * dt; t.y += vy * dt;
              if (t.x < 0) { t.x = 0; t.vx = Math.abs(t.vx); } else if (t.x > mw) { t.x = mw; t.vx = -Math.abs(t.vx); }
              if (t.y < 0) { t.y = 0; t.vy = Math.abs(t.vy); } else if (t.y > mh) { t.y = mh; t.vy = -Math.abs(t.vy); }
              t.el.style.transform = "translate3d(" + t.x.toFixed(1) + "px," + t.y.toFixed(1) + "px,0)";
            }
          });
        }
        function reloj() {
          if (S.fase !== "juego") return;
          var el = (performance.now() - S.t0) / 1000;
          if (cfg.modo === "tiempo") {
            var rest = cfg.seg - el;
            if (rest <= 0) { hT.textContent = "0:00"; barra.style.transform = "scaleX(0)"; terminar(); return; }
            hT.textContent = mmss(Math.ceil(rest));
            barra.style.transform = "scaleX(" + (rest / cfg.seg).toFixed(3) + ")";
          } else {
            hT.textContent = R.num(el + S.extra, 1);
            barra.style.transform = "scaleX(" + (S.k / cfg.n).toFixed(3) + ")";
          }
        }
        function bucle(ts) {
          if (!S.jugando) return;
          var dt = Math.min(0.05, Math.max(0, (ts - S.last) / 1000)); S.last = ts;
          mover(dt); reloj();
          if (S.jugando) S.raf = requestAnimationFrame(bucle);
        }

        function acierto(t) {
          S.hits++; S.k++; R.fb.ok();
          t.hecho = true;
          if (cfg.modo === "tiempo" || cfg.modo === "rapido") {
            t.el.classList.add("hecho"); t.el.classList.remove("sig");
          } else {
            t.el.classList.remove("sig"); t.el.classList.add("sale");
            S.tiles = S.tiles.filter(function (x) { return x !== t; });
            after(function () { if (t.el.parentNode) t.el.parentNode.removeChild(t.el); }, 200);
          }
          pintarProgreso();
          if (S.k >= cfg.n) {
            if (cfg.modo === "tiempo") {
              S.rondas++; S.fase = "pausa"; msg.textContent = "¡Tanda completa!"; R.fb.ya();
              after(function () { S.fase = "juego"; crear(); }, 700);
            } else terminar();
          } else marcarSig();
        }
        function fallo(t) {
          S.errores++; R.fb.mal();
          if (cfg.modo !== "tiempo" && cfg.pena) S.extra += cfg.pena;
          t.el.classList.add("mal");
          after(function () { t.el.classList.remove("mal"); }, 260);
          raiz.classList.add("golpe");
          after(function () { raiz.classList.remove("golpe"); }, 260);
          if (cfg.modo === "memoria") {
            t.el.classList.add("revela");
            after(function () { t.el.classList.remove("revela"); }, 800);
          }
          if (cfg.modo !== "tiempo" && cfg.pena) {
            msg.textContent = "+" + cfg.pena + " s";
            after(function () { if (S.fase === "juego" && S.jugando) marcarSig(); }, 700);
          }
        }

        area.addEventListener("pointerdown", function (e) {
          if (!S.jugando || S.fase !== "juego") return;
          var el = e.target.closest(".nm-t");
          if (!el || !el.__t || el.__t.hecho) return;
          e.preventDefault();
          if (el.__t.n === sig()) acierto(el.__t); else fallo(el.__t);
        });
        raiz.addEventListener("click", function (e) {
          if (!e.target.closest("[data-a=parar]")) return;
          limpiarTodo(); limpiarJuego = null; pantallaConfig();
        });

        function limpiarTodo() {
          S.jugando = false;
          cancelAnimationFrame(S.raf);
          S.timers.forEach(clearTimeout); S.timers = [];
          window.removeEventListener("resize", alCambiarTamano);
          if (ro) { ro.disconnect(); ro = null; }
        }
        limpiarJuego = limpiarTodo;

        function empezarJuego() {
          S.fase = "juego";
          S.t0 = performance.now();
          if (cfg.modo === "memoria") {
            S.tiles.forEach(function (t) { t.el.classList.add("oculto"); });
          }
          marcarSig(); pintarProgreso();
          R.fb.ya();
        }
        function arrancar() {
          cuenta.hidden = true;
          S.jugando = true;
          S.fase = cfg.modo === "memoria" ? "ver" : "juego";
          crear();
          S.last = performance.now();
          S.raf = requestAnimationFrame(bucle);
          if (cfg.modo === "memoria") {
            var rest = cfg.memSeg;
            msg.textContent = "Memoriza: " + rest;
            for (var i = 1; i <= cfg.memSeg; i++) {
              (function (i) {
                after(function () {
                  var r = cfg.memSeg - i;
                  if (r > 0) msg.textContent = "Memoriza: " + r;
                  else empezarJuego();
                }, i * 1000);
              })(i);
            }
          } else {
            S.t0 = performance.now();
            pintarProgreso();
            R.fb.ya();
          }
        }

        R.mantenerPantalla(true);
        [3, 2, 1].forEach(function (num, idx) {
          after(function () {
            cuenta.textContent = num;
            cuenta.classList.remove("pulso"); void cuenta.offsetWidth; cuenta.classList.add("pulso");
            R.fb.cuenta();
          }, idx * 1000);
        });
        after(arrancar, 3000);

        function terminar() {
          if (!S.jugando) return;
          limpiarTodo();
          limpiarJuego = null;
          var tot = S.hits + S.errores, prec = tot ? Math.round((S.hits / tot) * 100) : 0;
          var info;
          if (cfg.modo === "tiempo") {
            info = {
              jugador: jugador, modoNombre: modoDe(cfg.modo).nombre, modoHist: modoDe(cfg.modo).nombre, unidad: "números", mejorEs: "max",
              titulo: "Tiempo", grande: S.hits, etq: "números en orden", valor: S.hits,
              stats: [["Números correctos", S.hits], ["Tandas completas", S.rondas], ["Errores", S.errores], ["Precisión", prec + " %"]],
              hist: { aciertos: S.hits, fallos: S.errores, precision: prec, rtMedia: null, rtMejor: null }
            };
          } else {
            var limpio = (performance.now() - S.t0) / 1000;
            var total = Math.round((limpio + S.extra) * 100) / 100;
            info = {
              jugador: jugador, modoNombre: modoDe(cfg.modo).nombre, modoHist: modoDe(cfg.modo).nombre, unidad: "s", mejorEs: "min",
              titulo: "¡Completo!", grande: R.num(total, 2), etq: "segundos", valor: total,
              stats: [["Tiempo sin penalización", R.num(limpio, 2) + " s"], ["Penalización", R.num(S.extra, 0) + " s"], ["Errores", S.errores], ["Precisión", prec + " %"]],
              hist: { aciertos: S.hits, fallos: S.errores, precision: prec, rtMedia: Math.round((total / cfg.n) * 1000), rtMejor: null }
            };
          }
          resultado(info);
        }
      }

      function resultado(info) {
        if (limpiarJuego) { limpiarJuego(); limpiarJuego = null; }
        R.mantenerPantalla(false);
        R.fb.fin();
        var nuevo = false, rec = null, guardado = false;
        var key = claveRecord();
        rec = R.leer(key, null);
        if (info.valor > 0 && (rec === null || (info.mejorEs === "max" ? info.valor > rec : info.valor < rec))) {
          R.guardar(key, info.valor); rec = info.valor; nuevo = true;
        }
        var recTxt = rec === null ? "" : (info.mejorEs === "max" ? "Récord: " + rec + " números" : "Récord: " + R.num(rec, 2) + " s");

        guardado = R.registrarPartida(info.jugador, {
          juego: "Números en movimiento", modo: info.modoHist, config: etiqueta(), valor: info.valor, unidad: info.unidad,
          mejorEs: info.mejorEs, stats: info.hist
        });

        cont.innerHTML =
          '<section class="lz lz-res"><div class="lz-col centro">' +
            '<p class="eyebrow">' + R.esc(info.modoNombre) + " · " + cfg.n + " números" + (info.jugador ? " · " + R.esc(info.jugador) : "") + "</p>" +
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
