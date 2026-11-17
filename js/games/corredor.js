/* Juego: Corredor. Un corredor que salta y se barre para esquivar obstáculos mientras recoge pelotas.
   Cada vez más rápido. Con Futbolizado de primera es un futbolista con la camiseta de Wanderers. */
(function (R) {
  var TIERS = [
    { n: "Fácil", v0: 200, acc: 3, vmax: 420, rmin: 1.15, extra: 1.0, pelotas: 0.4 },
    { n: "Normal", v0: 240, acc: 4.5, vmax: 520, rmin: 1.0, extra: 0.9, pelotas: 0.32 },
    { n: "Difícil", v0: 280, acc: 6, vmax: 640, rmin: 0.9, extra: 0.8, pelotas: 0.26 },
    { n: "Muy difícil", v0: 320, acc: 8, vmax: 760, rmin: 0.8, extra: 0.7, pelotas: 0.2 },
    { n: "Extremo", v0: 360, acc: 10, vmax: 880, rmin: 0.72, extra: 0.6, pelotas: 0.15 },
    { n: "Personalizado", v0: 240, acc: 5, vmax: 600, rmin: 0.9, extra: 0.8, pelotas: 0.25 }
  ];
  var DEF = { tier: 1, vidas: 3, modo: 0, ini: 120, acel: 50, tope: 160, freq: 5 };
  var LW = 360, PH = 100, PX = 96, T_SALTO = 0.6, T_BARRIDA = 0.5, PICO = 1.3;

  function chips(t, k, lista, act) {
    return '<p class="campo-et sola">' + t + '</p><div class="chips">' + lista.map(function (x) {
      return '<button type="button" class="chip' + (String(x[0]) === String(act) ? " sel" : "") + '" data-set="' + k + ":" + x[0] + '">' + x[1] + "</button>";
    }).join("") + "</div>";
  }
  function sl(cfg, k, et, min, max, u) {
    return '<label class="campo"><span class="campo-et">' + et + ' <b data-v="' + k + '">' + cfg[k] + (u || "") + '</b></span><input type="range" data-k="' + k + '" data-u="' + (u || "") + '" min="' + min + '" max="' + max + '" step="1" value="' + cfg[k] + '"></label>';
  }
  function hash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function params(cfg) {
    if (cfg.tier < 5) return TIERS[cfg.tier];
    var T = TIERS[5];
    T.v0 = 120 + cfg.ini * 1.6; T.acc = cfg.acel / 8; T.vmax = Math.max(T.v0 + 20, cfg.tope * 5); T.rmin = 1.2 - cfg.freq * 0.055; T.extra = 1.1 - cfg.freq * 0.06; T.pelotas = 0.5 - cfg.freq * 0.035;
    return T;
  }

  R.registrar({
    id: "corredor",
    nombre: "Corredor",
    descripcion: "Salta y barre para esquivar obstáculos y recoge pelotas. Cada vez más rápido.",
    preview: function () {
      return R.html('<span class="pv-corredor"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M4 82h92" stroke="#7fd68f" stroke-width="3" stroke-linecap="round"/><g stroke="#e7edea" stroke-width="6" stroke-linecap="round" fill="none"><path d="M46 38l-4 22"/><path d="M42 60l-12 18M42 60l12 14"/><path d="M45 44l-14 8M46 44l12 6"/></g><circle cx="49" cy="28" r="8" fill="#e7edea"/><circle cx="82" cy="64" r="9" fill="#fff" stroke="#222" stroke-width="2"/><path d="M82 59l5 3-2 6h-6l-2-6z" fill="#222"/></svg></span>');
    },

    iniciar: function (cont) {
      var cfg = Object.assign({}, DEF, R.leer("corredor.cfg", {}));
      var limpiar = null, jugadorNom = null;
      function guardar() { R.guardar("corredor.cfg", cfg); }
      function clave() { return "corredor.rec." + cfg.tier + "." + cfg.modo; }
      var MODOS = [[0, "Sin fin"], [60, "60 segundos"], [90, "90 segundos"], [120, "2 minutos"]];

      function pantallaConfig() {
        if (limpiar) { limpiar(); limpiar = null; }
        var old = cont.querySelector(".lz-scroll"), prev = old ? old.scrollTop : 0;
        var rec = R.leer(clave(), null);
        cont.innerHTML =
          '<section class="lz lz-config co-cfg">' +
            '<header class="lz-top"><button class="volver" type="button" data-a="volver" aria-label="Volver al menú">←</button><h2>Corredor</h2></header>' +
            '<div class="lz-scroll"><div class="lz-col">' +
              '<p class="nota">Corre, salta las vallas con ↑ y pasa por debajo de lo que cuelga con la barrida ↓. Recoge pelotas para sumar puntos. Cada vez corres más rápido.</p>' +
              "<h3>Dificultad</h3>" +
              chips("", "tier", TIERS.map(function (t, i) { return [i, t.n]; }), cfg.tier) +
              (cfg.tier === 5 ? sl(cfg, "ini", "Velocidad inicial", 0, 200, " %") + sl(cfg, "acel", "Aceleración", 0, 100, " %") + sl(cfg, "tope", "Velocidad máxima", 60, 260, " %") + sl(cfg, "freq", "Cantidad de obstáculos", 1, 10, "") : "") +
              "<h3>Reglas</h3>" +
              chips("Vidas", "vidas", [[1, "1"], [3, "3"], [5, "5"], [0, "Infinitas"]], cfg.vidas) +
              chips("Modo", "modo", MODOS, cfg.modo) +
              '<p class="record">' + (rec === null ? "Aún sin récord en este modo." : "Mejor puntaje: " + rec) + "</p>" +
            "</div></div>" +
            '<footer class="lz-pie"><div class="lz-col"><button class="btn primario grande" type="button" data-a="jugar">Comenzar</button></div></footer>' +
          "</section>";
        var raiz = cont.querySelector(".co-cfg");
        raiz.querySelector(".lz-scroll").scrollTop = prev;
        R.pintarRangos(raiz);
        raiz.addEventListener("input", function (e) {
          var k = e.target.dataset && e.target.dataset.k; if (!k) return;
          cfg[k] = +e.target.value; guardar();
          raiz.querySelector('[data-v="' + k + '"]').textContent = cfg[k] + (e.target.dataset.u || "");
        });
        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button"); if (!b) return;
          if (b.dataset.a === "volver") R.salir();
          else if (b.dataset.a === "jugar") { guardar(); R.pedirJugador(cont, function (n) { jugadorNom = n; juego(); }, pantallaConfig); }
          else if (b.dataset.set) {
            var p = b.dataset.set.indexOf(":"), k = b.dataset.set.slice(0, p), v = b.dataset.set.slice(p + 1);
            cfg[k] = Number(v); guardar(); pantallaConfig();
          }
        });
      }

      function juego() {
        var fut = document.documentElement.getAttribute("data-fut") === "primera";
        var P = params(cfg), vidasMax = cfg.vidas, limite = cfg.modo;
        cont.innerHTML =
          '<section class="co">' +
            '<canvas class="co-cv"></canvas>' +
            '<div class="co-hud"><div class="co-fila"><div class="co-vidas"></div><div class="co-punt"><b>0</b><small>puntos</small></div><button type="button" class="co-b" data-a="pausa" aria-label="Pausa">❚❚</button></div>' +
              '<div class="co-fila2"><span class="co-pel"><i></i><b>0</b></span><div class="co-vel"><div></div></div><span class="co-tiempo"></span></div></div>' +
            '<div class="co-msg" hidden></div><div class="co-cuenta"></div>' +
            '<div class="co-ctl"><button type="button" class="co-bt" data-a="salto" aria-label="Saltar"><svg viewBox="0 0 24 24"><path d="M12 4l7 8h-4v8H9v-8H5z"/></svg><span>Saltar</span></button>' +
              '<button type="button" class="co-bt" data-a="barrida" aria-label="Barrida"><svg viewBox="0 0 24 24"><path d="M12 20l-7-8h4V4h6v8h4z"/></svg><span>Barrida</span></button></div>' +
            '<div class="co-ov" hidden></div>' +
          "</section>";
        var raiz = cont.querySelector(".co"), cv = raiz.querySelector(".co-cv"), ctx = cv.getContext("2d");
        var elVidas = raiz.querySelector(".co-vidas"), elPunt = raiz.querySelector(".co-punt b"), elPel = raiz.querySelector(".co-pel b"), elVel = raiz.querySelector(".co-vel div"), elTiempo = raiz.querySelector(".co-tiempo");
        var elMsg = raiz.querySelector(".co-msg"), elCuenta = raiz.querySelector(".co-cuenta"), ov = raiz.querySelector(".co-ov");
        var LH = 640, G = 420, esc = 1, raf = 0, ultimo = 0, vivo = true;

        function medir() {
          var r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
          cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
          esc = cv.width / LW; LH = LW * r.height / Math.max(1, r.width); G = LH * 0.66;
        }
        medir();
        window.addEventListener("resize", medir);

        /* pelota (sprite) */
        var bola = document.createElement("canvas"); bola.width = bola.height = 64;
        (function () {
          var b = bola.getContext("2d"); b.translate(32, 32);
          b.fillStyle = "#fff"; b.strokeStyle = "#1b1b1b"; b.lineWidth = 3; b.beginPath(); b.arc(0, 0, 29, 0, 7); b.fill(); b.stroke();
          b.fillStyle = "#1b1b1b"; b.beginPath(); for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * Math.PI * 2 / 5; b.lineTo(Math.cos(a) * 12, Math.sin(a) * 12); } b.fill();
          b.lineWidth = 2.5; for (var j = 0; j < 5; j++) { var c = -Math.PI / 2 + j * Math.PI * 2 / 5; b.beginPath(); b.moveTo(Math.cos(c) * 12, Math.sin(c) * 12); b.lineTo(Math.cos(c) * 24, Math.sin(c) * 24); b.stroke(); }
          for (var k = 0; k < 5; k++) { var d = -Math.PI / 2 + Math.PI / 5 + k * Math.PI * 2 / 5; b.beginPath(); b.arc(Math.cos(d) * 28, Math.sin(d) * 28, 6, 0, 7); b.fill(); }
        })();

        var cam = new Image(); cam.src = "camiseta.png";
        var camCache = {};
        function camSprite(w, h) { /* reduce por pasos para que la polera no se vea ruidosa */
          var k = Math.round(w) + "x" + Math.round(h);
          if (camCache[k]) return camCache[k];
          var cur = cam, cw = cam.naturalWidth, ch = cam.naturalHeight, tw = Math.max(2, Math.round(w)), th = Math.max(2, Math.round(h));
          while (cw / 2 > tw) {
            var c2 = document.createElement("canvas"); c2.width = Math.round(cw / 2); c2.height = Math.round(ch / 2);
            var x2 = c2.getContext("2d"); x2.imageSmoothingQuality = "high"; x2.drawImage(cur, 0, 0, c2.width, c2.height);
            cur = c2; cw = c2.width; ch = c2.height;
          }
          var f = document.createElement("canvas"); f.width = tw; f.height = th;
          var xf = f.getContext("2d"); xf.imageSmoothingQuality = "high"; xf.drawImage(cur, 0, 0, tw, th);
          camCache[k] = f; return f;
        }
        var torsoCache = {};
        function torsoSprite(w, h) { /* zona del pecho de la polera real (con el escudo), reducida suavemente */
          var k = Math.round(w) + "x" + Math.round(h);
          if (torsoCache[k]) return torsoCache[k];
          var W = cam.naturalWidth, H = cam.naturalHeight, sx = W * 0.22, sy = H * 0.06, sw = W * 0.56, sh = H * 0.5;
          var cur = document.createElement("canvas"); cur.width = Math.round(sw); cur.height = Math.round(sh);
          cur.getContext("2d").drawImage(cam, sx, sy, sw, sh, 0, 0, cur.width, cur.height);
          var tw = Math.max(2, Math.round(w)), th = Math.max(2, Math.round(h));
          while (cur.width / 2 > tw) {
            var c2 = document.createElement("canvas"); c2.width = Math.round(cur.width / 2); c2.height = Math.round(cur.height / 2);
            var x2 = c2.getContext("2d"); x2.imageSmoothingQuality = "high"; x2.drawImage(cur, 0, 0, c2.width, c2.height); cur = c2;
          }
          var f = document.createElement("canvas"); f.width = tw; f.height = th;
          var xf = f.getContext("2d"); xf.imageSmoothingQuality = "high"; xf.drawImage(cur, 0, 0, tw, th);
          torsoCache[k] = f; return f;
        }
        /* torso con la textura de la polera (no la silueta completa): queda limpio aun siendo pequeño */
        function camiseta(a, b, ancho, largo) {
          if (!cam.complete || !cam.naturalWidth) return false;
          var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
          var spr = torsoSprite(ancho * esc, largo * esc), r = ancho * 0.42;
          ctx.save(); ctx.translate(mx, my); ctx.rotate(ang);
          ctx.beginPath();
          ctx.moveTo(-ancho / 2 + r, -largo / 2); ctx.lineTo(ancho / 2 - r, -largo / 2); ctx.quadraticCurveTo(ancho / 2, -largo / 2, ancho / 2, -largo / 2 + r);
          ctx.lineTo(ancho / 2, largo / 2 - r * 0.5); ctx.quadraticCurveTo(ancho / 2, largo / 2, ancho / 2 - r * 0.5, largo / 2); ctx.lineTo(-ancho / 2 + r * 0.5, largo / 2);
          ctx.quadraticCurveTo(-ancho / 2, largo / 2, -ancho / 2, largo / 2 - r * 0.5); ctx.lineTo(-ancho / 2, -largo / 2 + r); ctx.quadraticCurveTo(-ancho / 2, -largo / 2, -ancho / 2 + r, -largo / 2);
          ctx.closePath(); ctx.clip();
          ctx.drawImage(spr, -ancho / 2, -largo / 2, ancho, largo);
          ctx.restore();
          ctx.save(); ctx.translate(mx, my); ctx.rotate(ang); ctx.strokeStyle = "rgba(0,60,20,.55)"; ctx.lineWidth = 1.2;
          ctx.strokeRect(-ancho / 2 + 0.6, -largo / 2 + 0.6, ancho - 1.2, largo - 1.2); ctx.restore();
          return true;
        }
        /* estado */
        var S = {
          v: P.v0, dist: 0, nextDist: 380, pelotas: 0, vidas: vidasMax || 99, golpes: 0, pasados: 0, t: 0, tJuego: 0,
          est: "correr", tEst: 0, cola: null, inv: 0, buf: null, etapa: 0, items: [], parts: [], sacudida: 0, pausa: false, fin: false, listo: false, aire: 0
        };
        function after(fn, ms) { return setTimeout(fn, ms); }
        var tmrs = [];

        function pintarVidas() {
          if (!vidasMax) { elVidas.innerHTML = '<span class="co-inf">♥ ∞</span>'; return; }
          var h = ""; for (var i = 0; i < vidasMax; i++) h += '<i class="' + (i < S.vidas ? "" : "va") + '">♥</i>'; elVidas.innerHTML = h;
        }
        pintarVidas();

        function msg(t, malo) {
          elMsg.textContent = t; elMsg.hidden = false; elMsg.className = "co-msg" + (malo ? " mal" : "");
          void elMsg.offsetWidth; elMsg.classList.add("ver");
          clearTimeout(S.mT); S.mT = setTimeout(function () { elMsg.hidden = true; }, 1000);
        }

        /* entrada */
        function salto() { if (S.fin || S.pausa || !S.listo) return; if (S.est === "correr" || S.est === "barrida") { S.est = "salto"; S.tEst = 0; S.cola = null; R.tono && R.tono(660, 70, "sine", 0.1); } else S.buf = { a: "salto", t: 0.16 }; }
        function barrida() { if (S.fin || S.pausa || !S.listo) return; if (S.est === "correr") { S.est = "barrida"; S.tEst = 0; R.tono && R.tono(300, 90, "triangle", 0.1); } else if (S.est === "salto") S.cola = "barrida"; }
        function tecla(e) {
          if (e.repeat) return;
          var k = e.key;
          if (k === "ArrowUp" || k === " " || k === "w" || k === "W") { e.preventDefault(); salto(); }
          else if (k === "ArrowDown" || k === "s" || k === "S") { e.preventDefault(); barrida(); }
          else if (k === "p" || k === "Escape") pausar(!S.pausa);
        }
        window.addEventListener("keydown", tecla);
        var tx = null, ty = null;
        cv.addEventListener("pointerdown", function (e) { tx = e.clientX; ty = e.clientY; });
        cv.addEventListener("pointerup", function (e) {
          if (ty === null) return; var dy = e.clientY - ty; if (Math.abs(dy) > 28) { if (dy < 0) salto(); else barrida(); } else salto(); tx = ty = null;
        });
        raiz.querySelector(".co-ctl").addEventListener("pointerdown", function (e) {
          var b = e.target.closest("[data-a]"); if (!b) return; e.preventDefault();
          if (b.dataset.a === "salto") salto(); else barrida();
        });
        function visibilidad() { if (document.hidden && !S.fin) pausar(true); }
        document.addEventListener("visibilitychange", visibilidad);

        function pausar(si) {
          if (S.fin || !S.listo) return;
          S.pausa = si;
          if (si) { ov.innerHTML = '<div class="co-card"><h3>Pausa</h3><button class="co-bn" type="button" data-a="seguir">Continuar</button><button class="co-bn suave" type="button" data-a="reiniciar">Reiniciar</button><button class="co-bn suave" type="button" data-a="config">Configurar</button><button class="co-bn suave" type="button" data-a="salir">Menú</button></div>'; ov.hidden = false; }
          else { ov.hidden = true; ultimo = performance.now(); }
        }

        /* generador */
        function crearBola(x, y) { S.items.push({ t: "b", x: x, y: y, ok: false, rot: Math.random() * 6 }); }
        function crearObst(tipo, x) { S.items.push({ t: "o", k: tipo, x: x, golpe: false, pasado: false }); }
        function generar() {
          var x0 = LW + 70, r = Math.random(), dens = P.pelotas;
          if (r < dens) { /* línea de pelotas */
            var alta = Math.random() < 0.4;
            for (var i = 0; i < 5; i++) crearBola(x0 + i * 32, alta ? G - PH * (0.95 + 0.25 * Math.sin(i / 4 * Math.PI)) : G - PH * 0.3);
            return v() * 0.75;
          }
          r = Math.random();
          if (r < 0.52) { /* valla baja: hay que saltar */
            crearObst("baja", x0);
            if (Math.random() < 0.65) for (var j = 0; j < 5; j++) crearBola(x0 + (j - 2) * 34, G - PH * (0.85 + 0.5 * (1 - Math.pow((j - 2) / 2, 2))));
            return 0;
          } else if (r < 0.88) { /* colgante: hay que barrerse */
            crearObst("alta", x0);
            if (Math.random() < 0.65) for (var q = 0; q < 4; q++) crearBola(x0 + (q - 1.5) * 34, G - PH * 0.26);
            return 0;
          } else { /* combinación */
            var baja = Math.random() < 0.5;
            crearObst(baja ? "baja" : "alta", x0); crearObst(baja ? "alta" : "baja", x0 + v() * 0.78);
            return v() * 0.8;
          }
        }
        function v() { return S.v; }

        /* colisiones */
        function cajaJugador() {
          var h = 0;
          if (S.est === "salto") { var u = S.tEst / T_SALTO; h = 4 * PICO * PH * u * (1 - u); }
          var alto = S.est === "barrida" ? PH * 0.3 : PH * 0.95;
          return { x1: PX - PH * 0.16, x2: PX + PH * 0.16, y1: G - h - alto, y2: G - h, h: h };
        }
        function golpe(o) {
          if (S.inv > 0) return;
          o.golpe = true; S.golpes++; S.sacudida = 0.3; S.inv = 1.5;
          if (vidasMax) S.vidas--;
          S.v = Math.max(P.v0, S.v * 0.88);
          R.fb && R.fb.mal(); R.vibrar && R.vibrar([60, 30, 60]);
          pintarVidas(); msg("¡Cuidado!", true);
          if (vidasMax && S.vidas <= 0) fin("Fin del juego");
        }
        function actualizar(dt) {
          S.t += dt;
          if (!S.listo) { return; }
          S.tJuego += dt;
          S.v = Math.min(P.vmax, S.v + P.acc * dt);
          var mv = S.v * dt; S.dist += mv;
          S.tEst += dt;
          if (S.est === "salto") {
            if (S.cola === "barrida") S.tEst += dt * 1.6;
            if (S.tEst >= T_SALTO) { S.est = "correr"; S.tEst = 0; if (S.cola === "barrida") { S.cola = null; S.est = "barrida"; } }
          } else if (S.est === "barrida" && S.tEst >= T_BARRIDA) { S.est = "correr"; S.tEst = 0; }
          if (S.buf) { S.buf.t -= dt; if (S.buf.t <= 0) S.buf = null; else if (S.est === "correr" || S.est === "barrida") { var a = S.buf.a; S.buf = null; if (a === "salto") salto(); } }
          if (S.inv > 0) S.inv -= dt; if (S.sacudida > 0) S.sacudida -= dt;
          if (S.dist >= S.nextDist) { var extra = generar(); S.nextDist = S.dist + extra + S.v * (P.rmin + Math.random() * P.extra); }
          var cj = cajaJugador(), i;
          for (i = S.items.length - 1; i >= 0; i--) {
            var it = S.items[i]; it.x -= mv;
            if (it.t === "b") {
              if (!it.ok) {
                var dx = it.x - PX, dy = it.y - (cj.y1 + cj.y2) / 2;
                if (Math.abs(dx) < PH * 0.3 && it.y > cj.y1 - 8 && it.y < cj.y2 + 8) {
                  it.ok = true; S.pelotas++; R.tono && R.tono(880 + Math.min(S.pelotas, 20) * 15, 60, "sine", 0.1);
                  for (var p = 0; p < 6; p++) S.parts.push({ x: it.x, y: it.y, vx: (Math.random() - .5) * 160, vy: -Math.random() * 140, t: 0.45 });
                }
              }
              if (it.x < -40 || it.ok) { if (it.ok || it.x < -40) S.items.splice(i, 1); }
            } else {
              var ow = it.k === "baja" ? PH * 0.5 : PH * 0.8;
              var ox1 = it.x - ow / 2 + PH * 0.06, ox2 = it.x + ow / 2 - PH * 0.06;
              var oy1 = it.k === "baja" ? G - PH * 0.5 : G - PH * 1.5, oy2 = it.k === "baja" ? G : G - PH * 0.62;
              if (!it.golpe && cj.x2 > ox1 && cj.x1 < ox2 && cj.y2 > oy1 + 4 && cj.y1 < oy2 - 2) golpe(it);
              if (!it.pasado && ox2 < cj.x1) { it.pasado = true; S.pasados++; }
              if (it.x < -80) S.items.splice(i, 1);
            }
          }
          for (i = S.parts.length - 1; i >= 0; i--) { var q = S.parts[i]; q.t -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 300 * dt; if (q.t <= 0) S.parts.splice(i, 1); }
          var etapa = Math.floor((S.v - P.v0) / Math.max(1, P.vmax - P.v0) * 8);
          if (etapa > S.etapa) { S.etapa = etapa; msg("¡Más rápido!"); }
          if (limite && S.tJuego >= limite) fin("¡Se acabó el tiempo!");
        }
        function puntaje() { return Math.floor(S.dist / 50) + S.pelotas * 25; }

        /* ---------- dibujo ---------- */
        function ola(ctx2, x, y, w, a) { ctx2.beginPath(); for (var i = 0; i <= 10; i++) { var xx = x + i / 10 * w, yy = y + Math.sin(i * 1.3 + a) * 1.6; if (i) ctx2.lineTo(xx, yy); else ctx2.moveTo(xx, yy); } ctx2.stroke(); }
        function fondo() {
          var d = S.dist, i, x;
          if (fut) {
            var g1 = ctx.createLinearGradient(0, 0, 0, G); g1.addColorStop(0, "#0b2a1b"); g1.addColorStop(1, "#1f6b3d"); ctx.fillStyle = g1; ctx.fillRect(0, 0, LW, G + 4);
            /* gradas */
            var gy = G - 190; ctx.fillStyle = "#2a3140"; ctx.fillRect(0, gy, LW, 150);
            var off = (d * 0.12) % 14;
            for (var fil = 0; fil < 6; fil++) for (i = -1; i < LW / 14 + 2; i++) {
              x = i * 14 - off + (fil % 2) * 7; var hh = hash(i + Math.floor(d * 0.12 / 14) * 0 + fil * 31 + Math.floor((d * 0.12) / 14));
              var cols = ["#e8e8e8", "#1fa23b", "#ffd21f", "#c93a3a", "#8fd69a", "#fff"]; ctx.fillStyle = cols[Math.floor(hh * 6)];
              ctx.fillRect(x, gy + 8 + fil * 23, 7, 9); ctx.fillStyle = "#f0c8a0"; ctx.beginPath(); ctx.arc(x + 3.5, gy + 4 + fil * 23, 3, 0, 7); ctx.fill();
            }
            ctx.fillStyle = "#1a1f2b"; ctx.fillRect(0, gy + 146, LW, 8);
            /* reflectores */
            var off2 = (d * 0.3) % 240;
            for (i = -1; i < 3; i++) { x = i * 240 - off2 + 120; ctx.fillStyle = "#333b4d"; ctx.fillRect(x - 3, gy - 80, 6, 100); ctx.fillStyle = "#fffbd0"; ctx.fillRect(x - 22, gy - 96, 44, 18); ctx.fillStyle = "rgba(255,251,208,.12)"; ctx.beginPath(); ctx.moveTo(x - 22, gy - 78); ctx.lineTo(x - 70, gy + 40); ctx.lineTo(x + 70, gy + 40); ctx.lineTo(x + 22, gy - 78); ctx.fill(); }
            /* césped */
            ctx.fillStyle = "#2f8c3c"; ctx.fillRect(0, G - 40, LW, LH - G + 40);
            var off3 = d % 120; for (i = -1; i < LW / 60 + 2; i++) { ctx.fillStyle = (i % 2) ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.06)"; ctx.fillRect(i * 60 - off3 % 120 * 0.5 - (d % 60), G - 40, 60, LH - G + 40); }
            ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillRect(0, G - 40, LW, 3);
          } else {
            var g2 = ctx.createLinearGradient(0, 0, 0, G); g2.addColorStop(0, "#1b2a5e"); g2.addColorStop(0.7, "#9a4f87"); g2.addColorStop(1, "#f0906a"); ctx.fillStyle = g2; ctx.fillRect(0, 0, LW, G + 4);
            ctx.fillStyle = "#ffe9b0"; ctx.beginPath(); ctx.arc(LW * 0.75, G - 150, 30, 0, 7); ctx.fill();
            var o1 = (d * 0.12) % 240; ctx.fillStyle = "rgba(40,30,80,.55)";
            for (i = -1; i < 6; i++) { var idx = i + Math.floor(d * 0.12 / 240) * 6 * 0; x = i * 60 - o1 % 60; var hh2 = 60 + hash(i + Math.floor(d * 0.12 / 60)) * 110; ctx.fillRect(x, G - 40 - hh2, 52, hh2 + 40); }
            var o2 = (d * 0.3) % 80; ctx.fillStyle = "rgba(20,16,50,.8)";
            for (i = -1; i < 7; i++) { x = i * 80 - o2; var h3 = 30 + hash(i * 3 + Math.floor(d * 0.3 / 80) + 9) * 60; ctx.fillRect(x, G - 40 - h3, 66, h3 + 40); }
            ctx.fillStyle = "#3a3f4a"; ctx.fillRect(0, G - 40, LW, LH - G + 40);
            ctx.fillStyle = "#555b69"; ctx.fillRect(0, G - 40, LW, 5);
            ctx.fillStyle = "rgba(255,255,255,.5)"; var o3 = d % 80; for (i = -1; i < LW / 80 + 2; i++) ctx.fillRect(i * 80 - o3, G + 40, 40, 4);
          }
        }
        function obstaculo(it) {
          var x = it.x;
          if (it.k === "baja") {
            if (fut) { /* cono */
              ctx.fillStyle = "#ff6a1a"; ctx.beginPath(); ctx.moveTo(x - PH * 0.22, G); ctx.lineTo(x + PH * 0.22, G); ctx.lineTo(x + PH * 0.06, G - PH * 0.5); ctx.lineTo(x - PH * 0.06, G - PH * 0.5); ctx.fill();
              ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(x - PH * 0.14, G - PH * 0.2); ctx.lineTo(x + PH * 0.14, G - PH * 0.2); ctx.lineTo(x + PH * 0.1, G - PH * 0.31); ctx.lineTo(x - PH * 0.1, G - PH * 0.31); ctx.fill();
              ctx.fillStyle = "#1c1c1c"; ctx.fillRect(x - PH * 0.27, G - 4, PH * 0.54, 5);
            } else { /* caja */
              ctx.fillStyle = "#a9703a"; ctx.fillRect(x - PH * 0.25, G - PH * 0.5, PH * 0.5, PH * 0.5); ctx.strokeStyle = "#6b4121"; ctx.lineWidth = 3; ctx.strokeRect(x - PH * 0.25 + 1.5, G - PH * 0.5 + 1.5, PH * 0.5 - 3, PH * 0.5 - 3);
              ctx.beginPath(); ctx.moveTo(x - PH * 0.25, G - PH * 0.5); ctx.lineTo(x + PH * 0.25, G); ctx.moveTo(x + PH * 0.25, G - PH * 0.5); ctx.lineTo(x - PH * 0.25, G); ctx.stroke();
            }
          } else {
            var w = PH * 0.8, top = G - PH * 1.5, bot = G - PH * 0.62;
            ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - w * 0.35, 0); ctx.lineTo(x - w * 0.35, top); ctx.moveTo(x + w * 0.35, 0); ctx.lineTo(x + w * 0.35, top); ctx.stroke();
            if (fut) { /* pancarta */
              ctx.fillStyle = "#f4f7f4"; ctx.fillRect(x - w / 2, top, w, bot - top); ctx.fillStyle = "#1fa23b";
              for (var s = 0; s < 4; s++) ctx.fillRect(x - w / 2 + s * w / 4, top, w / 8, bot - top);
              ctx.strokeStyle = "#0b3d1e"; ctx.lineWidth = 3; ctx.strokeRect(x - w / 2, top, w, bot - top);
            } else { /* viga */
              ctx.fillStyle = "#8b93a3"; ctx.fillRect(x - w / 2, top, w, bot - top); ctx.fillStyle = "#ffcf1f";
              for (var s2 = 0; s2 < 5; s2++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + s2 * w / 5, bot); ctx.lineTo(x - w / 2 + s2 * w / 5 + w / 10, bot); ctx.lineTo(x - w / 2 + s2 * w / 5 + w / 10 + (bot - top) * 0.4, top); ctx.lineTo(x - w / 2 + s2 * w / 5 + (bot - top) * 0.4, top); ctx.fill(); }
              ctx.strokeStyle = "#4b5160"; ctx.lineWidth = 3; ctx.strokeRect(x - w / 2, top, w, bot - top);
            }
          }
        }
        function linea(a, b, c, d2, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d2); ctx.stroke(); }
        function corredor(x, h, alpha) {
          var u = PH / 10, g = G - h, ph = S.t * (S.est === "correr" ? 3.4 + S.v / 160 : 3), est = S.est;
          var piel = "#e9b98b", camisa = fut ? "#1fa23b" : "#2f6bd1", short = fut ? "#fafafa" : "#3b3f4d", media = fut ? "#1fa23b" : "#e9b98b", bota = fut ? "#1a1a1a" : "#f4f4f4";
          ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = "round"; ctx.lineJoin = "round";
          /* sombra */
          ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(x, G + 2, est === "barrida" ? PH * 0.55 : PH * 0.3 * (1 - Math.min(0.5, h / PH * 0.4)), 4, 0, 0, 7); ctx.fill();
          if (est === "barrida") {
            var hip = [x - 0.5 * u, g - 1.8 * u], neck = [x - 4.6 * u, g - 3.7 * u], head = [x - 5.7 * u, g - 4.6 * u];
            /* brazo atrás */ linea(neck[0], neck[1], x - 7.4 * u, g - 0.9 * u, 1 * u, piel);
            /* pierna doblada */ linea(hip[0], hip[1], x + 2.2 * u, g - 4 * u, 1.7 * u, short); linea(x + 2.2 * u, g - 4 * u, x + 3.2 * u, g - 1.1 * u, 1.2 * u, media); linea(x + 3.2 * u, g - 1.1 * u, x + 4.2 * u, g - 0.9 * u, 1.1 * u, bota);
            /* torso */ linea(hip[0], hip[1], neck[0], neck[1], 3.1 * u, camisa);
            if (fut) camiseta([hip[0] + 0.2 * u, hip[1] + 0.1 * u], [neck[0] - 0.3 * u, neck[1] - 0.1 * u], 3.1 * u, 4.3 * u);
            /* pierna estirada */ linea(hip[0], hip[1], x + 3 * u, g - 1.3 * u, 1.7 * u, short); linea(x + 3 * u, g - 1.3 * u, x + 6 * u, g - 0.7 * u, 1.2 * u, media); linea(x + 6 * u, g - 0.7 * u, x + 7 * u, g - 0.6 * u, 1.2 * u, bota);
            /* brazo adelante */ linea(neck[0], neck[1], x - 3.2 * u, g - 5.6 * u, 1 * u, piel); if (fut) linea(neck[0], neck[1], neck[0] + (x - 3.2 * u - neck[0]) * 0.55, neck[1] + (g - 5.6 * u - neck[1]) * 0.55, 1.5 * u, "#158a37"); linea(x - 3.2 * u, g - 5.6 * u, x - 1.2 * u, g - 6.4 * u, 0.9 * u, piel);
            ctx.fillStyle = piel; ctx.beginPath(); ctx.arc(head[0], head[1], 1.15 * u, 0, 7); ctx.fill(); ctx.fillStyle = "#2a1a10"; ctx.beginPath(); ctx.arc(head[0] - 0.2 * u, head[1] - 0.2 * u, 1.2 * u, Math.PI, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "rgba(230,230,230,.55)"; for (var d = 0; d < 4; d++) { ctx.beginPath(); ctx.arc(x + 5.5 * u + d * 1.5 * u + Math.sin(S.t * 20 + d) * u, g - 0.6 * u - d * 0.4 * u, 0.9 * u + d * 0.2 * u, 0, 7); ctx.fill(); }
          } else {
            var salto = est === "salto", hipy = g - 4.7 * u, hip2 = [x, hipy], neck2 = [x + 0.8 * u, g - 7.7 * u];
            var piernas = [0, Math.PI];
            piernas.forEach(function (off, idx) {
              var a, b;
              if (salto) { a = idx ? 1.25 : 0.25; b = idx ? 1.5 : 1.3; } else { a = 0.95 * Math.sin(ph + off); b = 0.7 + 0.8 * Math.sin(ph + off - 1.5); }
              var kx = hip2[0] + 2.4 * u * Math.sin(a), ky = hip2[1] + 2.4 * u * Math.cos(a);
              var a2 = a - b, fx = kx + 2.3 * u * Math.sin(a2), fy = ky + 2.3 * u * Math.cos(a2);
              if (idx === 1) { ctx.globalAlpha = alpha * 0.9; }
              linea(hip2[0], hip2[1], kx, ky, 1.7 * u, short); linea(kx, ky, fx, fy, 1.2 * u, media); linea(fx, fy, fx + 0.9 * u, fy + 0.1 * u, 1.2 * u, bota);
              ctx.globalAlpha = alpha;
            });
            /* brazo trasero */
            var sw = salto ? -2.6 : -0.9 * Math.sin(ph);
            function brazo(s, col1) { var ex = neck2[0] + 1.8 * u * Math.sin(s), ey = neck2[1] + 0.6 * u + 1.8 * u * Math.cos(s); var s2 = salto ? s - 0.5 : s + 1.4; var mx = ex + 1.7 * u * Math.sin(s2), my = ey + 1.7 * u * Math.cos(s2); linea(neck2[0], neck2[1] + 0.6 * u, ex, ey, 1.1 * u, col1); if (fut) linea(neck2[0], neck2[1] + 0.6 * u, neck2[0] + (ex - neck2[0]) * 0.55, neck2[1] + 0.6 * u + (ey - neck2[1] - 0.6 * u) * 0.55, 1.6 * u, "#158a37"); linea(ex, ey, mx, my, 0.9 * u, piel); }
            brazo(-sw * 0.8 + (salto ? 0.2 : 0), fut ? piel : camisa);
            /* torso */
            linea(hip2[0], hip2[1], neck2[0], neck2[1], 3 * u, camisa);
            if (fut) camiseta([hip2[0], hip2[1] + 0.2 * u], [neck2[0], neck2[1] - 0.2 * u], 3.2 * u, 3.9 * u);
            brazo(sw * 0.8 - (salto ? 0.3 : 0), fut ? piel : camisa);
            /* cabeza */
            ctx.fillStyle = piel; ctx.beginPath(); ctx.arc(x + 1.1 * u, g - 8.9 * u, 1.2 * u, 0, 7); ctx.fill(); ctx.fillStyle = "#2a1a10"; ctx.beginPath(); ctx.arc(x + 0.9 * u, g - 9.1 * u, 1.25 * u, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
            ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(x + 1.7 * u, g - 8.9 * u, 0.15 * u, 0, 7); ctx.fill();
          }
          ctx.restore();
        }
        function dibujar() {
          ctx.setTransform(esc, 0, 0, esc, 0, 0);
          var sx = S.sacudida > 0 ? (Math.random() - .5) * 8 : 0, sy = S.sacudida > 0 ? (Math.random() - .5) * 6 : 0;
          ctx.save(); ctx.translate(sx, sy);
          fondo();
          var i, it;
          for (i = 0; i < S.items.length; i++) { it = S.items[i]; if (it.t === "o") obstaculo(it); }
          for (i = 0; i < S.items.length; i++) {
            it = S.items[i]; if (it.t !== "b") continue;
            ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot + S.dist * 0.01); ctx.drawImage(bola, -11, -11, 22, 22); ctx.restore();
          }
          var h = 0; if (S.est === "salto") { var u = S.tEst / T_SALTO; h = 4 * PICO * PH * u * (1 - u); }
          var parpadeo = S.inv > 0 && Math.floor(S.inv * 12) % 2 === 0;
          corredor(PX, h, parpadeo ? 0.35 : 1);
          ctx.fillStyle = "#fff"; for (i = 0; i < S.parts.length; i++) { var q = S.parts[i]; ctx.globalAlpha = Math.max(0, q.t * 2); ctx.beginPath(); ctx.arc(q.x, q.y, 2.5, 0, 7); ctx.fill(); }
          ctx.globalAlpha = 1;
          if (S.inv > 1.2) { ctx.fillStyle = "rgba(255,40,40,.18)"; ctx.fillRect(-10, -10, LW + 20, LH + 20); }
          ctx.restore();
        }
        function hud() {
          elPunt.textContent = puntaje(); elPel.textContent = S.pelotas;
          elVel.style.width = Math.min(100, (S.v - P.v0) / Math.max(1, P.vmax - P.v0) * 100) + "%";
          if (limite) { var r = Math.max(0, Math.ceil(limite - S.tJuego)); elTiempo.textContent = Math.floor(r / 60) + ":" + ("0" + (r % 60)).slice(-2); } else elTiempo.textContent = Math.floor(S.tJuego) + " s";
        }

        function fin(titulo) {
          if (S.fin) return; S.fin = true;
          R.fb && R.fb.fin && R.fb.fin();
          var pts = puntaje(), metros = Math.floor(S.dist / 50), rec = R.leer(clave(), null), nuevo = rec === null || pts > rec;
          if (nuevo) R.guardar(clave(), pts);
          try { R.registrarPartida(jugadorNom, { juego: "Corredor", modo: P.n + (limite ? " · " + limite + " s" : " · sin fin"), config: (vidasMax ? vidasMax + " vidas" : "vidas infinitas"), valor: pts, unidad: "pts", mejorEs: "max", stats: { aciertos: S.pelotas, fallos: S.golpes, precision: Math.round(S.pasados / Math.max(1, S.pasados + S.golpes) * 100) } }); } catch (e) {}
          tmrs.push(setTimeout(function () {
            ov.innerHTML = '<div class="co-card"><h3>' + titulo + "</h3>" + (nuevo ? '<span class="insignia">Nuevo récord</span>' : "") +
              '<dl class="co-stats"><div><dt>Puntos</dt><dd>' + pts + "</dd></div><div><dt>Distancia</dt><dd>" + metros + " m</dd></div><div><dt>Pelotas</dt><dd>" + S.pelotas + "</dd></div><div><dt>Golpes</dt><dd>" + S.golpes + "</dd></div></dl>" +
              "<p>Mejor: " + Math.max(pts, rec || 0) + " puntos</p>" +
              '<button class="co-bn" type="button" data-a="reiniciar">Jugar de nuevo</button><button class="co-bn suave" type="button" data-a="config">Configurar</button><button class="co-bn suave" type="button" data-a="salir">Menú</button></div>';
            ov.hidden = false;
          }, 700));
        }

        function bucle(ahora) {
          if (!vivo) return;
          raf = requestAnimationFrame(bucle);
          var dt = Math.min(0.033, (ahora - ultimo) / 1000 || 0); ultimo = ahora;
          if (!S.pausa && !S.fin) actualizar(dt);
          else if (S.fin) { S.t += dt; }
          if (!S.pausa) { dibujar(); hud(); }
        }
        /* cuenta regresiva */
        var cuenta = 3;
        function contar() {
          if (!vivo) return;
          if (cuenta > 0) { elCuenta.textContent = cuenta; elCuenta.className = "co-cuenta ver"; cuenta--; tmrs.push(setTimeout(contar, 650)); }
          else { elCuenta.textContent = "¡Ya!"; S.listo = true; tmrs.push(setTimeout(function () { elCuenta.textContent = ""; }, 500)); }
        }
        contar();

        function limpia() {
          vivo = false; cancelAnimationFrame(raf); tmrs.forEach(clearTimeout); clearTimeout(S.mT);
          window.removeEventListener("resize", medir); window.removeEventListener("keydown", tecla); document.removeEventListener("visibilitychange", visibilidad);
          R.mantenerPantalla(false);
        }
        limpiar = limpia;
        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("[data-a]"); if (!b) return;
          var a = b.dataset.a;
          if (a === "pausa") pausar(!S.pausa);
          else if (a === "seguir") pausar(false);
          else if (a === "reiniciar") { limpia(); limpiar = null; juego(); }
          else if (a === "config") { limpia(); limpiar = null; pantallaConfig(); }
          else if (a === "salir") { limpia(); limpiar = null; R.salir(); }
        });
        R.mantenerPantalla(true);
        ultimo = performance.now(); raf = requestAnimationFrame(bucle);
        R._corredor = { S: S };
      }

      pantallaConfig();
      return function () { if (limpiar) limpiar(); };
    }
  });
})(window.Reacciona);
