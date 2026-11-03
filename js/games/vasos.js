/* Juego: ¿Dónde está la pelota?
   Una pelota de fútbol queda bajo un vaso, los vasos se mezclan y hay que encontrarla.
   Modos: Por niveles (3, 9 o 12 vasos) y Racha (dificultad creciente, con vidas). */
(function (R) {
  var MODOS = [
    { id: "nivel", nombre: "Por niveles", desc: "Elige cuántos vasos y cuántas rondas. En cada ronda ves dónde queda la pelota, los vasos se mezclan y debes tocar el vaso donde está." },
    { id: "racha", nombre: "Racha", desc: "Sin fin y cada vez más difícil: parte con 3 vasos y va sumando vasos, mezclas y velocidad. Si fallas o se acaba el tiempo pierdes una vida. Gana quien acierta más rondas seguidas." }
  ];
  var NIVELES = [[3, "Nivel 1 · 3 vasos"], [9, "Nivel 2 · 9 vasos"], [12, "Nivel 3 · 12 vasos"]];
  var VELS = [[700, "Lenta"], [450, "Normal"], [280, "Rápida"]];
  var LIMS = [[5, "5 s"], [8, "8 s"], [12, "12 s"], [0, "Sin límite"]];
  var DEF = { modo: "nivel", vasos: 3, rondas: 5, mezclas: 8, vel: 450, lim: 8, vidas: 3 };

  function pent(cx, cy, r, rot) {
    var p = [];
    for (var i = 0; i < 5; i++) {
      var a = (rot + i * 72) * Math.PI / 180;
      p.push((cx + r * Math.cos(a)).toFixed(1) + "," + (cy + r * Math.sin(a)).toFixed(1));
    }
    return p.join(" ");
  }
  var BOLA_SRC = (function () {
    var s = '<svg viewBox="0 0 100 100" aria-hidden="true"><defs><clipPath id="vsb"><circle cx="50" cy="50" r="48"/></clipPath>' +
      '<radialGradient id="vsg" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#f1f1f1"/><stop offset="1" stop-color="#c9c9c9"/></radialGradient></defs>' +
      '<circle cx="50" cy="50" r="48" fill="url(#vsg)"/><g clip-path="url(#vsb)" fill="#171717" stroke="#171717" stroke-width="1.6" stroke-linejoin="round">' +
      '<polygon points="' + pent(50, 50, 15, -90) + '"/>';
    for (var i = 0; i < 5; i++) {
      var a = (-90 + i * 72) * Math.PI / 180;
      s += '<line x1="' + (50 + 15 * Math.cos(a)).toFixed(1) + '" y1="' + (50 + 15 * Math.sin(a)).toFixed(1) +
        '" x2="' + (50 + 33 * Math.cos(a)).toFixed(1) + '" y2="' + (50 + 33 * Math.sin(a)).toFixed(1) + '" fill="none"/>';
      s += '<polygon points="' + pent(50 + 52 * Math.cos(a), 50 + 52 * Math.sin(a), 18, -90 + i * 72 + 36) + '"/>';
    }
    return s + '</g><circle cx="50" cy="50" r="48" fill="none" stroke="#222" stroke-width="2"/></svg>';
  })();
  var nBola = 0;
  function bola() { var id = ++nBola; return BOLA_SRC.replace(/vsb/g, "vsb" + id).replace(/vsg/g, "vsg" + id); }
  var VASO = '<svg viewBox="0 0 100 116" preserveAspectRatio="none" aria-hidden="true"><path d="M13 4 H87 L100 112 H0 Z" fill="#c4222e"/>' +
    '<path d="M13 4 H87 L89 20 H11 Z" fill="#e5505b" opacity=".75"/><path d="M0 112 L2 98 H98 L100 112 Z" fill="#8f1620"/></svg>';

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
  function chips(titulo, attr, lista, actual) {
    return '<p class="campo-et sola">' + titulo + '</p><div class="chips">' +
      lista.map(function (x) {
        return '<button type="button" class="chip' + (x[0] === actual ? " sel" : "") + '" data-' + attr + '="' + x[0] + '">' + x[1] + "</button>";
      }).join("") + "</div>";
  }
  function modoDe(id) { return MODOS.filter(function (m) { return m.id === id; })[0]; }

  R.registrar({
    id: "vasos",
    nombre: "¿Dónde está la pelota?",
    descripcion: "La pelota queda bajo un vaso y los vasos se mezclan. Encuéntrala.",
    preview: function () {
      return R.html('<span class="pv-vasos"><i></i><i></i><i></i><b></b></span>');
    },

    iniciar: function (cont) {
      var cfg = Object.assign({}, DEF, R.leer("vasos.cfg", {}));
      var limpiarJuego = null;

      function guardarCfg() { R.guardar("vasos.cfg", cfg); }
      function etiqueta() {
        var l = cfg.lim ? cfg.lim + " s para responder" : "sin límite";
        if (cfg.modo === "racha") return cfg.vidas + (cfg.vidas === 1 ? " vida" : " vidas") + " · " + l;
        return cfg.vasos + " vasos · " + cfg.rondas + " rondas · " + cfg.mezclas + " mezclas · " + cfg.vel + " ms · " + l;
      }
      function claveRecord() { return "vasos.rec." + cfg.modo + "|" + etiqueta(); }
      function textoRecord() {
        var r = R.leer(claveRecord(), null);
        if (r === null) return "Aún sin récord en esta configuración.";
        return cfg.modo === "racha" ? "Récord: " + r + (r === 1 ? " ronda" : " rondas") : "Récord: " + r + " de " + cfg.rondas + " aciertos";
      }

      /* ---------- configuración ---------- */
      function pantallaConfig() {
        if (limpiarJuego) { limpiarJuego(); limpiarJuego = null; }
        R.mantenerPantalla(false);
        var modo = modoDe(cfg.modo), params = "";
        if (cfg.modo === "nivel") {
          params = chips("Nivel", "vasos", NIVELES, cfg.vasos) +
            campo("rondas", "Rondas", 3, 15, 1, cfg.rondas, "") +
            campo("mezclas", "Mezclas por ronda", 3, 20, 1, cfg.mezclas, "") +
            chips("Velocidad de los vasos", "vel", VELS, cfg.vel);
        } else {
          params = chips("Vidas", "vidas", [[1, "1 vida"], [3, "3 vidas"]], cfg.vidas);
        }
        params += chips("Tiempo para responder", "lim", LIMS, cfg.lim);
        var chipsModo = MODOS.map(function (m) {
          return '<button type="button" class="chip' + (m.id === cfg.modo ? " sel" : "") + '" data-modo="' + m.id + '">' + m.nombre + "</button>";
        }).join("");

        var prev = 0, old = cont.querySelector(".lz-scroll");
        if (old) prev = old.scrollTop;
        cont.innerHTML =
          '<section class="lz lz-config">' +
            '<header class="lz-top"><button class="volver" type="button" data-a="volver" aria-label="Volver al menú">←</button><h2>La pelota</h2></header>' +
            '<div class="lz-scroll"><div class="lz-col">' +
              '<h3>Modo</h3><div class="chips">' + chipsModo + "</div>" +
              '<p class="nota">' + modo.desc + "</p>" + params +
              '<p class="record"></p>' +
            "</div></div>" +
            '<footer class="lz-pie"><div class="lz-col"><button class="btn primario grande" type="button" data-a="jugar">Comenzar</button></div></footer>' +
          "</section>";
        var raiz = cont.querySelector(".lz-config");
        R.pintarRangos(raiz);
        raiz.querySelector(".lz-scroll").scrollTop = prev;
        raiz.querySelector(".record").textContent = textoRecord();

        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b) return;
          var d = b.dataset;
          if (d.a === "volver") R.salir();
          else if (d.a === "jugar") { guardarCfg(); R.pedirJugador(cont, function (n) { jugar(n); }, pantallaConfig); }
          else if (d.modo) { cfg.modo = d.modo; guardarCfg(); pantallaConfig(); }
          else if (d.vasos) { cfg.vasos = +d.vasos; guardarCfg(); pantallaConfig(); }
          else if (d.vel) { cfg.vel = +d.vel; guardarCfg(); pantallaConfig(); }
          else if (d.lim !== undefined) { cfg.lim = +d.lim; guardarCfg(); pantallaConfig(); }
          else if (d.vidas) { cfg.vidas = +d.vidas; guardarCfg(); pantallaConfig(); }
        });
        raiz.addEventListener("input", function (e) {
          var k = e.target.dataset && e.target.dataset.k;
          if (!k) return;
          cfg[k] = +e.target.value;
          var v = raiz.querySelector('[data-v="' + k + '"]');
          if (v) v.textContent = e.target.value + v.dataset.u;
          guardarCfg();
          raiz.querySelector(".record").textContent = textoRecord();
        });
      }

      /* ---------- partida ---------- */
      function jugar(jugador) {
        var racha = cfg.modo === "racha";
        cont.innerHTML =
          '<section class="lz lz-juego vs">' +
            '<div class="lz-hud">' +
              '<button class="volver" type="button" data-a="parar" aria-label="Terminar">✕</button>' +
              '<div class="lz-dato"><span class="v" data-h="r">1</span><small>Ronda</small></div>' +
              '<div class="lz-dato der"><span class="v" data-h="p">0</span><small data-h="pl">' + (racha ? "Vidas" : "Aciertos") + "</small></div>" +
            "</div>" +
            '<div class="lz-barra"><i></i></div>' +
            '<div class="lz-msg fijo" aria-live="polite"></div>' +
            '<div class="vs-area"><div class="vs-campo"></div></div>' +
            '<div class="lz-cuenta" aria-live="assertive"></div>' +
          "</section>";
        var raiz = cont.querySelector(".vs");
        var campoEl = raiz.querySelector(".vs-campo");
        var cuenta = raiz.querySelector(".lz-cuenta"), msg = raiz.querySelector(".lz-msg");
        var hR = raiz.querySelector('[data-h="r"]'), hP = raiz.querySelector('[data-h="p"]');
        var barra = raiz.querySelector(".lz-barra i");
        var S = {
          jugando: false, fase: "cuenta", timers: [], raf: 0, ronda: 0, aciertos: 0, fallos: 0,
          vidas: cfg.vidas, copas: [], objetivo: null, N: 3, g: null, rts: [], tResp: 0
        };

        function after(fn, ms) { var id = setTimeout(fn, ms); S.timers.push(id); return id; }
        function pintarHud() {
          hR.textContent = racha ? S.ronda : Math.min(S.ronda, cfg.rondas) + " / " + cfg.rondas;
          hP.textContent = racha ? corazones(S.vidas, cfg.vidas) : S.aciertos;
        }

        /* dificultad de la ronda */
        function params() {
          if (!racha) return { N: cfg.vasos, mezclas: cfg.mezclas, ms: cfg.vel };
          var r = S.ronda - 1;
          return {
            N: r < 3 ? 3 : r < 6 ? 6 : r < 9 ? 9 : 12,
            mezclas: Math.min(18, 4 + r),
            ms: Math.max(220, 620 - 30 * r)
          };
        }

        /* geometría: posición de cada hueco */
        function geometria() {
          var W = campoEl.clientWidth, H = campoEl.clientHeight, N = S.N;
          var cols = N <= 6 ? 3 : (N === 9 ? 3 : 4), filas = Math.ceil(N / cols);
          var cw = W / cols, ch = H / filas;
          var ancho = Math.max(34, Math.min(cw * 0.66, (ch * 0.62) / 1.15, 150));
          S.g = { W: W, H: H, cols: cols, filas: filas, cw: cw, ch: ch, ancho: ancho, alto: ancho * 1.15 };
        }
        function pos(slot) {
          var g = S.g, c = slot % g.cols, f = Math.floor(slot / g.cols);
          return { x: (c + 0.5) * g.cw - g.ancho / 2, y: (f + 0.5) * g.ch - g.alto / 2 };
        }
        function colocar(c) {
          var p = pos(c.slot);
          c.el.style.transform = "translate3d(" + p.x.toFixed(1) + "px," + p.y.toFixed(1) + "px,0)";
        }
        function dimensionar() {
          var g = S.g;
          S.copas.forEach(function (c) {
            c.el.style.width = g.ancho + "px"; c.el.style.height = g.alto + "px";
            c.el.style.fontSize = Math.round(g.ancho * 0.42) + "px";
            var b = c.el.querySelector(".vs-bola");
            b.style.width = b.style.height = Math.round(g.ancho * 0.56) + "px";
            colocar(c);
          });
        }
        function alCambiarTamano() {
          if (!S.copas.length) return;
          var d = campoEl.style.transition;
          geometria(); dimensionar();
        }
        window.addEventListener("resize", alCambiarTamano);
        var ro = null;
        if (window.ResizeObserver) { ro = new ResizeObserver(alCambiarTamano); ro.observe(campoEl); }

        function construir(p) {
          campoEl.innerHTML = ""; S.copas = []; S.N = p.N;
          geometria();
          for (var i = 0; i < p.N; i++) {
            var el = document.createElement("div");
            el.className = "vs-c";
            el.style.transitionDuration = p.ms + "ms";
            el.innerHTML = '<div class="vs-bola">' + bola() + '</div><div class="vs-vaso">' + VASO + '<span class="vs-n"></span></div>';
            var c = { el: el, slot: i };
            el.__c = c;
            campoEl.appendChild(el);
            S.copas.push(c);
          }
          S.objetivo = S.copas[Math.floor(Math.random() * p.N)];
          S.objetivo.el.classList.add("con-bola");
          dimensionar();
        }

        function mezclar(pasos, ms, fin) {
          var N = S.N, maxPares = Math.max(1, Math.floor(N / 4));
          function paso(i) {
            if (!S.jugando) return;
            if (i >= pasos) { after(fin, 150); return; }
            var slots = [], k;
            for (k = 0; k < N; k++) slots.push(k);
            for (k = N - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = slots[k]; slots[k] = slots[j]; slots[j] = t; }
            var pares = 1 + Math.floor(Math.random() * maxPares);
            for (k = 0; k < pares; k++) {
              var a = slots[2 * k], b = slots[2 * k + 1];
              var ca = S.copas.filter(function (c) { return c.slot === a; })[0];
              var cb = S.copas.filter(function (c) { return c.slot === b; })[0];
              ca.slot = b; cb.slot = a;
              ca.el.style.zIndex = 3; cb.el.style.zIndex = 2;
              colocar(ca); colocar(cb);
            }
            after(function () { S.copas.forEach(function (c) { c.el.style.zIndex = ""; }); paso(i + 1); }, ms + 70);
          }
          paso(0);
        }

        function ronda() {
          if (!S.jugando) return;
          S.ronda++; pintarHud();
          var p = params();
          S.fase = "ver";
          barra.style.transition = "none"; barra.style.transform = "scaleX(0)";
          construir(p);
          msg.textContent = "Mira dónde queda la pelota";
          after(function () { S.objetivo.el.classList.add("alz"); }, 700);
          after(function () { S.objetivo.el.classList.remove("alz"); }, 2100);
          after(function () {
            msg.textContent = "Mezclando…";
            mezclar(p.mezclas, p.ms, responder);
          }, 2700);
        }

        function responder() {
          if (!S.jugando) return;
          S.fase = "resp";
          S.copas.forEach(function (c) { c.el.querySelector(".vs-n").textContent = c.slot + 1; });
          campoEl.classList.add("numerado");
          msg.textContent = "¿Dónde está?";
          S.tResp = performance.now();
          if (cfg.lim) {
            var ini = S.tResp;
            (function tic() {
              if (!S.jugando || S.fase !== "resp") return;
              var r = 1 - (performance.now() - ini) / (cfg.lim * 1000);
              if (r <= 0) { barra.style.transform = "scaleX(0)"; resolver(null); return; }
              barra.style.transform = "scaleX(" + r.toFixed(3) + ")";
              S.raf = requestAnimationFrame(tic);
            })();
          }
        }

        function resolver(copa) {
          if (S.fase !== "resp") return;
          S.fase = "rev";
          cancelAnimationFrame(S.raf);
          campoEl.classList.remove("numerado");
          var ok = copa === S.objetivo;
          if (copa) S.rts.push(performance.now() - S.tResp);
          if (ok) { S.aciertos++; R.fb.ok(); }
          else { S.fallos++; R.fb.mal(); if (racha) { S.vidas--; R.fb.vida(); } }
          pintarHud();
          if (copa) copa.el.classList.add("alz", ok ? "ok" : "mal");
          var slotReal = S.objetivo.slot + 1;
          if (ok) msg.textContent = "¡Vaso " + slotReal + "! Correcto";
          else {
            msg.textContent = copa ? "No… estaba en el vaso " + slotReal : "Se acabó el tiempo · vaso " + slotReal;
            after(function () { S.objetivo.el.classList.add("alz"); }, 500);
          }
          raiz.classList.toggle("golpe", !ok);
          after(function () { raiz.classList.remove("golpe"); }, 300);
          var fin = racha ? S.vidas <= 0 : S.ronda >= cfg.rondas;
          after(function () { if (fin) terminar(); else ronda(); }, ok ? 1500 : 2300);
        }

        campoEl.addEventListener("pointerdown", function (e) {
          if (!S.jugando || S.fase !== "resp") return;
          var el = e.target.closest(".vs-c");
          if (!el || !el.__c) return;
          e.preventDefault();
          resolver(el.__c);
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

        function terminar() {
          if (!S.jugando) return;
          limpiarTodo(); limpiarJuego = null;
          var tot = S.aciertos + S.fallos, prec = tot ? Math.round((S.aciertos / tot) * 100) : 0;
          var media = S.rts.length ? Math.round(S.rts.reduce(function (a, b) { return a + b; }, 0) / S.rts.length) : null;
          var mejor = S.rts.length ? Math.round(Math.min.apply(null, S.rts)) : null;
          var info = {
            jugador: jugador, modoNombre: modoDe(cfg.modo).nombre, unidad: racha ? "rondas" : "aciertos", mejorEs: "max",
            valor: S.aciertos,
            stats: [["Aciertos", S.aciertos], ["Fallos", S.fallos], ["Precisión", prec + " %"], ["Tiempo medio", media === null ? "–" : R.num(media / 1000, 1) + " s"]],
            hist: { aciertos: S.aciertos, fallos: S.fallos, precision: prec, rtMedia: media, rtMejor: mejor }
          };
          if (racha) { info.titulo = "Fin de la racha"; info.grande = S.aciertos; info.etq = S.aciertos === 1 ? "ronda acertada" : "rondas acertadas"; }
          else { info.titulo = "Terminado"; info.grande = S.aciertos + " / " + cfg.rondas; info.etq = "aciertos"; }
          resultado(info);
        }

        /* arranque: cuenta de 3 s */
        R.mantenerPantalla(true);
        S.jugando = true;
        pintarHud();
        msg.textContent = "Prepárate";
        [3, 2, 1].forEach(function (num, idx) {
          after(function () {
            cuenta.textContent = num;
            cuenta.classList.remove("pulso"); void cuenta.offsetWidth; cuenta.classList.add("pulso");
            R.fb.cuenta();
          }, idx * 1000);
        });
        after(function () { cuenta.hidden = true; R.fb.ya(); ronda(); }, 3000);
      }

      function resultado(info) {
        if (limpiarJuego) { limpiarJuego(); limpiarJuego = null; }
        R.mantenerPantalla(false);
        R.fb.fin();
        var nuevo = false, key = claveRecord(), rec = R.leer(key, null);
        if (info.valor > 0 && (rec === null || info.valor > rec)) { R.guardar(key, info.valor); rec = info.valor; nuevo = true; }
        var recTxt = rec === null ? "" : (cfg.modo === "racha" ? "Récord: " + rec + (rec === 1 ? " ronda" : " rondas") : "Récord: " + rec + " aciertos");
        var guardado = R.registrarPartida(info.jugador, {
          juego: "¿Dónde está la pelota?", modo: info.modoNombre, config: etiqueta(), valor: info.valor, unidad: info.unidad,
          mejorEs: info.mejorEs, stats: info.hist
        });
        cont.innerHTML =
          '<section class="lz lz-res"><div class="lz-col centro">' +
            '<p class="eyebrow">' + R.esc(info.modoNombre) + (info.jugador ? " · " + R.esc(info.jugador) : "") + "</p>" +
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
