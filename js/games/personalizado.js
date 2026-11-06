/* Juego: Personalizado.
   Entrenamiento a la medida en 4 pasos: Estímulos, Transición, Duración y Resumen.
   Estímulos: colores (con colores propios), flechas, números, letras, formas, palabras y cálculos,
   con opción de verlos y/o escucharlos. Avanzado: color + estímulo, palabra y color (Stroop),
   pelota en movimiento y ver/escuchar. Además: parada (no-go), series con descanso y favoritos. */
(function (R) {
  var COLORES = [
    ["rojo", "Rojo", "#e11d2e"], ["azul", "Azul", "#1f5fe0"], ["verde", "Verde", "#13b955"], ["amarillo", "Amarillo", "#f7d417"],
    ["morado", "Morado", "#8a2be2"], ["naranjo", "Naranjo", "#fb7a14"], ["negro", "Negro", "#0b0b0b"], ["gris", "Gris", "#6b7280"],
    ["rosado", "Rosado", "#ff69b4"], ["celeste", "Celeste", "#4cc9f0"], ["cafe", "Café", "#7b4a24"], ["blanco", "Blanco", "#fafafa"],
    ["turquesa", "Turquesa", "#14b8a6"], ["lima", "Lima", "#a3e635"], ["burdeo", "Burdeo", "#7a1030"], ["dorado", "Dorado", "#d4a017"]
  ];
  var DIRS = [["derecha", 0], ["abajo a la derecha", 45], ["abajo", 90], ["abajo a la izquierda", 135], ["izquierda", 180], ["arriba a la izquierda", 225], ["arriba", 270], ["arriba a la derecha", 315]];
  var GLIFOS = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"];
  var ORDEN_BRUJULA = [5, 6, 7, 4, -1, 0, 3, 2, 1];
  var FORMAS = [["circulo", "Círculo"], ["triangulo", "Triángulo"], ["cuadrado", "Cuadrado"], ["rombo", "Rombo"], ["pentagono", "Pentágono"],
    ["hexagono", "Hexágono"], ["octogono", "Octógono"], ["estrella", "Estrella"], ["cruz", "Cruz"], ["corazon", "Corazón"]];
  var LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  var CATS = [["colores", "Colores"], ["flechas", "Flechas"], ["numeros", "Números"], ["letras", "Letras"], ["formas", "Formas"], ["palabras", "Palabras"], ["calculos", "Cálculos"]];
  var TIPOS = [
    { id: "combo", nombre: "Color + estímulo", desc: "La pantalla se pinta de un color y encima aparece una flecha, número, letra, forma o palabra. Por ejemplo: fondo rojo con una flecha negra hacia la derecha." },
    { id: "stroop", nombre: "Palabra y color", desc: "Aparece el nombre de un color escrito con tinta de otro color, sobre un fondo. Por ejemplo: fondo rojo con la palabra AZUL escrita en azul: hay que ir al cono azul y no al rojo." },
    { id: "bola", nombre: "Pelota en movimiento", desc: "Una pelota rebota por la pantalla y en cada cambio toma otro color. Sirve para seguir un objeto en movimiento y reaccionar al color." },
    { id: "verOir", nombre: "Ver y escuchar", desc: "Lo que se ve y lo que se escucha son cosas distintas (por ejemplo, la pantalla muestra un color y la voz dice un número). Se indica a cuál hacer caso." }
  ];
  var OPS = [["+", "Sumas (+)"], ["-", "Restas (−)"], ["x", "Multiplicaciones (×)"]];
  var DEF = {
    nivel: "simple", tipoAv: "combo",
    vis: { colores: true, flechas: true, numeros: true, letras: true, formas: true, palabras: true, calculos: true },
    voz: { colores: false, flechas: false, numeros: false, letras: false, formas: false, palabras: false, calculos: false },
    sel: { colores: ["rojo", "azul", "verde", "amarillo"], flechas: [], numeros: [], letras: [], formas: [], palabras: [], calculos: [] },
    extra: [], maxCalc: 10, fondo: "claro",
    regla: "tinta", coinc: 50, fondoStroop: "color", reglaVO: "vista", vBola: 5,
    trans: "tiempo", dur: 1, durRand: false, durMax: 2, pausa: 0.5, pausaRand: false, pausaMax: 1.5, reloj: false, feedback: false, tic: false,
    noGo: false, noGoColor: "rojo", noGoProb: 20,
    tipoDur: "tiempo", min: 0, seg: 30, ilim: false, rondas: 20, series: 1, descanso: 30
  };

  /* ---------- utilidades ---------- */
  function mezcla(def, guardado) {
    var o = {};
    Object.keys(def).forEach(function (k) {
      var d = def[k], g = guardado ? guardado[k] : undefined;
      if (g === undefined) o[k] = JSON.parse(JSON.stringify(d));
      else if (d && typeof d === "object" && !Array.isArray(d)) o[k] = Object.assign(JSON.parse(JSON.stringify(d)), g);
      else o[k] = g;
    });
    return o;
  }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function elegir(a) { return a[rnd(a.length)]; }
  function entre(a, b) { return a + Math.random() * (b - a); }
  function contraste(hex) {
    var h = hex.replace("#", ""); if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#111111" : "#ffffff";
  }
  function mmss(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function seg1(v) { return R.num(v, 1) + " s"; }

  function poly(n, rot, r) {
    var p = [];
    for (var i = 0; i < n; i++) {
      var a = (rot + (360 / n) * i) * Math.PI / 180;
      p.push((50 + r * Math.cos(a)).toFixed(1) + "," + (50 + r * Math.sin(a)).toFixed(1));
    }
    return p.join(" ");
  }
  function estrella() {
    var p = [];
    for (var i = 0; i < 10; i++) {
      var a = (-90 + 36 * i) * Math.PI / 180, r = i % 2 ? 20 : 48;
      p.push((50 + r * Math.cos(a)).toFixed(1) + "," + (50 + r * Math.sin(a)).toFixed(1));
    }
    return p.join(" ");
  }
  function formaSVG(id, fg) {
    var d = "";
    switch (id) {
      case "circulo": d = '<circle cx="50" cy="50" r="45"/>'; break;
      case "triangulo": d = '<polygon points="' + poly(3, -90, 50) + '"/>'; break;
      case "cuadrado": d = '<rect x="7" y="7" width="86" height="86" rx="6"/>'; break;
      case "rombo": d = '<polygon points="' + poly(4, -90, 49) + '"/>'; break;
      case "pentagono": d = '<polygon points="' + poly(5, -90, 47) + '"/>'; break;
      case "hexagono": d = '<polygon points="' + poly(6, 0, 47) + '"/>'; break;
      case "octogono": d = '<polygon points="' + poly(8, 22.5, 49) + '"/>'; break;
      case "estrella": d = '<polygon points="' + estrella() + '"/>'; break;
      case "cruz": d = '<path d="M36 6h28v30h30v28H64v30H36V64H6V36h30z"/>'; break;
      default: d = '<path d="M50 92C8 62 2 34 20 19c12-9 25-4 30 8c5-12 18-17 30-8c18 15 12 43-30 73z"/>';
    }
    return '<svg viewBox="0 0 100 100" fill="' + fg + '" aria-hidden="true">' + d + "</svg>";
  }
  function flechaSVG(ang, fg) {
    return '<svg viewBox="0 0 100 100" fill="' + fg + '" aria-hidden="true"><g transform="rotate(' + ang + ' 50 50)"><path d="M6 37H54V14L96 50L54 86V63H6Z"/></g></svg>';
  }
  function cruzNoGo(fg) {
    return '<svg viewBox="0 0 100 100" fill="none" stroke="' + fg + '" stroke-width="13" stroke-linecap="round" aria-hidden="true"><path d="M18 18L82 82M82 18L18 82"/></svg>';
  }
  function estrellasHTML(n, clave) {
    var s = "";
    for (var i = 1; i <= 5; i++) s += '<button type="button" class="pz-est' + (i <= n ? " on" : "") + '" data-est="' + clave + ":" + i + '" aria-label="' + i + ' de 5">' + (i <= n ? "★" : "☆") + "</button>";
    return s;
  }

  function hablar(t) {
    if (!t || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(t));
      u.lang = "es-CL"; u.rate = 1.1;
      var vs = window.speechSynthesis.getVoices();
      var v = vs.filter(function (x) { return /^es[-_](CL|419|MX|US|AR)/i.test(x.lang); })[0] || vs.filter(function (x) { return /^es/i.test(x.lang); })[0];
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function callar() { try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {} }

  R.registrar({
    id: "personalizado",
    nombre: "Personalizado",
    descripcion: "Arma tu propio entrenamiento: colores, flechas, números, letras, formas y combinaciones.",
    preview: function () {
      return R.html('<span class="pv-pers"><i style="background:#e11d2e;color:#111">➜</i><i style="background:#1f5fe0">7</i><i style="background:#13b955;color:#111">A</i><i style="background:#f7d417;color:#111">★</i></span>');
    },

    iniciar: function (cont) {
      var cfg = mezcla(DEF, R.leer("personalizado.cfg", {}));
      var favs = R.leer("personalizado.favs", []);
      var limpiarJuego = null;
      var paso = 1, exp = { numeros: false, letras: false }, editColor = false, aviso = "";

      function guardarCfg() { R.guardar("personalizado.cfg", cfg); }
      function guardarFavs() { R.guardar("personalizado.favs", favs); }

      /* ---------- catálogo ---------- */
      function todosColores() {
        return COLORES.concat(cfg.extra.map(function (e) { return [e.id, e.nombre, e.hex]; }));
      }
      function colorDe(id) { return todosColores().filter(function (c) { return c[0] === id; })[0]; }
      function itemsCat(cat) {
        var s = cfg.sel[cat] || [];
        switch (cat) {
          case "colores":
            return todosColores().filter(function (c) { return s.indexOf(c[0]) >= 0; }).map(function (c) { return { cat: cat, id: c[0], etq: c[1], voz: c[1], hex: c[2] }; });
          case "flechas":
            return s.map(function (i) { return { cat: cat, id: "f" + i, etq: GLIFOS[i] + " " + DIRS[i][0], voz: DIRS[i][0], ang: DIRS[i][1] }; });
          case "numeros":
            return s.map(function (n) { return { cat: cat, id: "n" + n, etq: String(n), voz: String(n), txt: String(n) }; });
          case "letras":
            return s.map(function (l) { return { cat: cat, id: "l" + l, etq: l, voz: l, txt: l }; });
          case "formas":
            return FORMAS.filter(function (f) { return s.indexOf(f[0]) >= 0; }).map(function (f) { return { cat: cat, id: f[0], etq: f[1], voz: f[1], forma: f[0] }; });
          case "palabras":
            return s.map(function (w, i) { return { cat: cat, id: "p" + i, etq: w, voz: w, txt: w }; });
          default:
            return s.map(function (op) { return { cat: cat, id: "c" + op, op: op, gen: true, etq: "Cálculo " + op }; });
        }
      }
      function genCalc(it) {
        var m = cfg.maxCalc, a, b, r, txt, voz;
        if (it.op === "+") { r = 1 + rnd(m); a = rnd(r + 1); b = r - a; txt = a + " + " + b; voz = a + " más " + b; }
        else if (it.op === "-") { r = rnd(m + 1); b = rnd(Math.min(m, 20 - r) + 1); a = r + b; txt = a + " − " + b; voz = a + " menos " + b; }
        else {
          var pares = [];
          for (var x = 1; x <= m; x++) for (var y = 1; y <= m; y++) if (x * y <= m && x * y >= 2) pares.push([x, y]);
          var p = pares.length ? elegir(pares) : [1, 2];
          a = p[0]; b = p[1]; r = a * b; txt = a + " × " + b; voz = a + " por " + b;
        }
        return { cat: "calculos", id: "c" + it.op, etq: "Resultado " + r, voz: voz, txt: txt };
      }
      function resolver(it) { return it.gen ? genCalc(it) : it; }
      function poolActivo(clave) {
        var out = [];
        CATS.forEach(function (c) { if (cfg[clave][c[0]]) out = out.concat(itemsCat(c[0])); });
        return out;
      }
      function nombreCat(id) { return CATS.filter(function (c) { return c[0] === id; })[0][1]; }

      function validar() {
        var activos = 0;
        CATS.forEach(function (c) { if ((cfg.vis[c[0]] || cfg.voz[c[0]]) && itemsCat(c[0]).length) activos++; });
        if (cfg.nivel === "simple") {
          if (!activos) return "Elige al menos un estímulo y deja activado «Ver» o «Voz» en su categoría.";
        } else if (cfg.tipoAv === "combo") {
          if (!itemsCat("colores").length) return "Elige al menos un color para usar de fondo.";
        } else if (cfg.tipoAv === "stroop") {
          if (itemsCat("colores").length < 2) return "Elige al menos dos colores.";
        } else if (cfg.tipoAv === "bola") {
          if (!itemsCat("colores").length) return "Elige al menos un color para la pelota.";
        } else {
          if (!poolActivo("vis").length) return "Activa «Ver» en alguna categoría con estímulos elegidos.";
          if (!poolActivo("voz").length) return "Activa «Voz» en alguna categoría con estímulos elegidos.";
          if (poolActivo("vis").length + poolActivo("voz").length < 3) return "Elige más estímulos para que lo que se ve y lo que se escucha sean distintos.";
        }
        if (cfg.noGo && !colorDe(cfg.noGoColor)) return "Elige el color de la parada (no-go).";
        return "";
      }

      /* ---------- generación de estímulos ---------- */
      function neutro() { return cfg.fondo === "oscuro" ? { bg: "#0b0b0b", fg: "#ffffff" } : { bg: "#f3f3ef", fg: "#111111" }; }
      function contenido(it, fg) {
        if (it.cat === "flechas") return flechaSVG(it.ang, fg);
        if (it.cat === "formas") return formaSVG(it.forma, fg);
        var len = it.txt.length, k = len <= 2 ? 1 : Math.max(0.14, 2.4 / len);
        return '<span class="pz-txt" style="--k:' + k.toFixed(3) + ';color:' + fg + '">' + R.esc(it.txt) + "</span>";
      }
      function simple(prev) {
        var pool = poolActivo("vis").concat(poolActivo("voz").filter(function (x) { return !cfg.vis[x.cat]; }));
        var it = null, i;
        for (i = 0; i < 5; i++) { it = resolver(elegir(pool)); if (!prev || it.id !== prev || pool.length < 2) break; }
        var n = neutro(), spec;
        if (it.cat === "colores" && cfg.vis.colores) spec = { bg: it.hex, fg: contraste(it.hex), html: "" };
        else if (cfg.vis[it.cat]) spec = { bg: n.bg, fg: n.fg, html: it.cat === "colores" ? "" : contenido(it, n.fg) };
        else spec = { bg: n.bg, fg: n.fg, html: '<span class="pz-txt" style="--k:.5">🔊</span>' };
        spec.etq = it.etq; spec.id = it.id; spec.voz = cfg.voz[it.cat] ? it.voz : "";
        return spec;
      }
      function combo(prev) {
        var cols = itemsCat("colores"), tops = [];
        CATS.forEach(function (c) { if (c[0] !== "colores" && cfg.vis[c[0]]) tops = tops.concat(itemsCat(c[0])); });
        var col = elegir(cols), top = tops.length ? resolver(elegir(tops)) : null;
        for (var i = 0; i < 4 && prev && (col.id + (top ? top.id : "")) === prev && (cols.length * Math.max(1, tops.length)) > 1; i++) {
          col = elegir(cols); top = tops.length ? resolver(elegir(tops)) : null;
        }
        var fg = contraste(col.hex);
        var voz = [];
        if (cfg.voz.colores) voz.push(col.voz);
        if (top && cfg.voz[top.cat]) voz.push(top.voz);
        return { bg: col.hex, fg: fg, html: top ? contenido(top, fg) : "", etq: top ? col.etq + " + " + top.etq : col.etq, id: col.id + (top ? top.id : ""), voz: voz.join(", ") };
      }
      function stroop(prev) {
        var cols = itemsCat("colores"), colorFondo = cfg.fondoStroop === "color";
        var F, I, W, i;
        var neutroHex = cfg.fondoStroop === "oscuro" ? "#0b0b0b" : "#f3f3ef";
        for (i = 0; i < 12; i++) {
          W = elegir(cols);
          I = Math.random() * 100 < cfg.coinc ? W : elegir(cols);
          F = colorFondo ? elegir(cols) : null;
          if (F ? F.id !== I.id : contraste(I.hex) !== contraste(neutroHex)) break;
        }
        var fondoHex = F ? F.hex : neutroHex;
        var regla = cfg.regla;
        if (regla === "azar") regla = elegir(colorFondo ? ["tinta", "palabra", "fondo"] : ["tinta", "palabra"]);
        if (regla === "fondo" && !F) regla = "tinta";
        var resp = regla === "tinta" ? I : regla === "palabra" ? W : F;
        var label = cfg.regla === "azar" ? (regla === "tinta" ? "COLOR DE LA TINTA" : regla === "palabra" ? "LA PALABRA" : "COLOR DEL FONDO") : "";
        return {
          bg: fondoHex, fg: I.hex, etq: resp.etq, id: W.id + I.id + (F ? F.id : "") + regla, label: label, voz: cfg.voz.colores ? W.voz : "",
          html: '<span class="pz-txt pz-stroop" style="--k:' + Math.max(0.2, Math.min(1, 3.2 / W.etq.length)).toFixed(3) + ';color:' + I.hex + '">' + R.esc(W.etq.toUpperCase()) + "</span>"
        };
      }
      function verOir(prev) {
        var vis = poolActivo("vis"), oir = poolActivo("voz"), a, b, i;
        for (i = 0; i < 8; i++) { a = resolver(elegir(vis)); b = resolver(elegir(oir)); if (a.etq !== b.etq) break; }
        var regla = cfg.reglaVO === "azar" ? elegir(["vista", "oido"]) : cfg.reglaVO;
        var n = neutro(), spec;
        if (a.cat === "colores") spec = { bg: a.hex, fg: contraste(a.hex), html: "" };
        else spec = { bg: n.bg, fg: n.fg, html: contenido(a, n.fg) };
        spec.etq = regla === "vista" ? a.etq : b.etq;
        spec.id = a.id + b.id + regla;
        spec.voz = b.voz;
        spec.label = cfg.reglaVO === "azar" ? (regla === "vista" ? "HAZ CASO A LO QUE VES" : "HAZ CASO A LO QUE ESCUCHAS") : "";
        return spec;
      }
      function siguiente(prev) {
        if (cfg.noGo && Math.random() * 100 < cfg.noGoProb) {
          var c = colorDe(cfg.noGoColor), fg = contraste(c[2]);
          return { bg: c[2], fg: fg, html: cruzNoGo(fg), etq: "PARADA · " + c[1], id: "nogo", voz: "Alto", noGo: true };
        }
        if (cfg.nivel === "simple") return simple(prev);
        if (cfg.tipoAv === "combo") return combo(prev);
        if (cfg.tipoAv === "stroop") return stroop(prev);
        if (cfg.tipoAv === "verOir") return verOir(prev);
        var col = elegir(itemsCat("colores")), n = neutro();
        return { bg: n.bg, fg: n.fg, html: "", etq: col.etq, id: col.id, bola: col.hex, voz: cfg.voz.colores ? col.voz : "" };
      }

      /* ---------- textos de resumen ---------- */
      function nombreModo() { return cfg.nivel === "simple" ? "Simple" : TIPOS.filter(function (t) { return t.id === cfg.tipoAv; })[0].nombre; }
      function resumenEstimulos() {
        if (cfg.nivel === "avanzado") {
          var t = nombreModo();
          if (cfg.tipoAv === "stroop") return t + " · " + itemsCat("colores").length + " colores · regla: " + ({ tinta: "color de la tinta", palabra: "la palabra", fondo: "color del fondo", azar: "al azar" })[cfg.regla];
          if (cfg.tipoAv === "bola") return t + " · " + itemsCat("colores").length + " colores · velocidad " + cfg.vBola;
          if (cfg.tipoAv === "verOir") return t + " · hacer caso a " + ({ vista: "lo que se ve", oido: "lo que se escucha", azar: "uno al azar" })[cfg.reglaVO];
        }
        var p = [];
        CATS.forEach(function (c) {
          var n = itemsCat(c[0]).length;
          if (n && (cfg.vis[c[0]] || cfg.voz[c[0]])) p.push(c[1] + " (" + n + ")" + (cfg.voz[c[0]] ? (cfg.vis[c[0]] ? " 👁🔊" : " 🔊") : ""));
        });
        return (cfg.nivel === "avanzado" ? nombreModo() + " · " : "") + (p.join(", ") || "Sin estímulos");
      }
      function resumenTransicion() {
        var p = [];
        if (cfg.trans === "tiempo") p.push("Por tiempo", cfg.durRand ? seg1(cfg.dur) + " a " + seg1(cfg.durMax) : seg1(cfg.dur));
        else p.push("Al tocar");
        p.push("pausa " + (cfg.pausaRand && cfg.trans === "tiempo" ? seg1(cfg.pausa) + " a " + seg1(cfg.pausaMax) : seg1(cfg.pausa)));
        if (cfg.reloj && cfg.trans === "tiempo") p.push("reloj de anticipación");
        if (cfg.noGo) p.push("parada " + (colorDe(cfg.noGoColor) || ["", "?"])[1] + " " + cfg.noGoProb + " %");
        return p.join(" · ");
      }
      function resumenDuracion() {
        var p = [];
        if (cfg.tipoDur === "tiempo") p.push(cfg.ilim ? "Sin límite de tiempo" : mmss(cfg.min * 60 + cfg.seg));
        else p.push(cfg.ilim ? "Sin límite de rondas" : cfg.rondas + " rondas");
        p.push(cfg.series + (cfg.series === 1 ? " serie" : " series"));
        if (cfg.series > 1) p.push("descanso " + cfg.descanso + " s");
        return p.join(" · ");
      }
      function tiempoTotal() {
        var D = Math.max(5, cfg.min * 60 + cfg.seg), s;
        if (cfg.tipoDur === "tiempo") {
          if (cfg.ilim) return "sin límite";
          s = cfg.series * D + (cfg.series - 1) * cfg.descanso;
        } else {
          if (cfg.ilim || cfg.trans === "toque") return "depende de ti";
          var m = (cfg.durRand ? (cfg.dur + cfg.durMax) / 2 : cfg.dur) + (cfg.pausaRand ? (cfg.pausa + cfg.pausaMax) / 2 : cfg.pausa);
          s = cfg.series * cfg.rondas * m + (cfg.series - 1) * cfg.descanso;
        }
        s = Math.round(s);
        return Math.floor(s / 60) + " min " + (s % 60) + " s";
      }
      function resumenLargo(c) {
        var guardado = cfg; cfg = c;
        var t = resumenEstimulos() + " · " + resumenTransicion() + " · " + resumenDuracion();
        cfg = guardado;
        return t;
      }

      /* ---------- helpers de interfaz ---------- */
      function campo(k, etiqueta, min, max, step, valor, unidad, dec, off) {
        var txt = dec ? R.num(valor, 1) : valor;
        return '<label class="campo' + (off ? " off" : "") + '"><span class="campo-et">' + etiqueta +
          ' <b data-v="' + k + '" data-u="' + (unidad || "") + '" data-d="' + (dec ? 1 : 0) + '">' + txt + (unidad || "") + "</b></span>" +
          '<input type="range" data-k="' + k + '" data-d="' + (dec ? 1 : 0) + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + valor + '"' + (off ? " disabled" : "") + "></label>";
      }
      function chips(titulo, clave, lista, actual) {
        return (titulo ? '<p class="campo-et sola">' + titulo + "</p>" : "") + '<div class="chips">' +
          lista.map(function (x) {
            return '<button type="button" class="chip' + (String(x[0]) === String(actual) ? " sel" : "") + '" data-set="' + clave + ":" + x[0] + '">' + x[1] + "</button>";
          }).join("") + "</div>";
      }
      function interruptor(clave, etiqueta, nota, valor) {
        return '<div class="fila-op"><div><b>' + etiqueta + "</b>" + (nota ? "<small>" + nota + "</small>" : "") + "</div>" +
          '<button type="button" class="interruptor" role="switch" data-sw="' + clave + '" aria-checked="' + (valor ? "true" : "false") + '"><i></i></button></div>';
      }
      function setCfg(clave, val) {
        if (val === "true") val = true; else if (val === "false") val = false;
        else if (val !== "" && !isNaN(val)) val = Number(val);
        cfg[clave] = val;
      }
      function alternar(lista, v) {
        var i = lista.indexOf(v);
        if (i >= 0) lista.splice(i, 1); else lista.push(v);
      }

      /* ---------- inicio ---------- */
      function pantallaInicio() {
        if (limpiarJuego) { limpiarJuego(); limpiarJuego = null; }
        R.mantenerPantalla(false);
        var tieneUltimo = !!R.leer("personalizado.cfg", null);
        cont.innerHTML =
          '<section class="lz lz-config pz">' +
            '<header class="lz-top"><button class="volver" type="button" data-a="volver" aria-label="Volver al menú">←</button><h2>Personalizado</h2></header>' +
            '<div class="lz-scroll"><div class="lz-col">' +
              '<p class="nota">Arma tu propio entrenamiento en 4 pasos: qué estímulos aparecen, cómo cambian, cuánto dura y listo. Puedes guardarlo como favorito.</p>' +
              '<button class="btn primario grande" type="button" data-a="nuevo">Nuevo entrenamiento</button>' +
              (tieneUltimo ? '<h3>Último entrenamiento</h3><div class="pz-fav"><p>' + R.esc(resumenLargo(cfg)) + '</p><div class="pz-fav-acc"><button class="btn" type="button" data-a="ultimo-ver">Editar</button><button class="btn primario" type="button" data-a="ultimo-ir">Comenzar</button></div></div>' : "") +
              "<h3>Favoritos</h3>" +
              (favs.length ? favs.map(function (f, i) {
                return '<div class="pz-fav"><b>' + R.esc(f.nombre) + "</b>" + (f.desc ? "<small>" + R.esc(f.desc) + "</small>" : "") +
                  "<p>" + R.esc(resumenLargo(mezcla(DEF, f.cfg))) + '</p><div class="pz-fav-acc"><button class="btn peligro" type="button" data-a="fav-borrar" data-i="' + i + '">Eliminar</button>' +
                  '<button class="btn" type="button" data-a="fav-editar" data-i="' + i + '">Editar</button><button class="btn primario" type="button" data-a="fav-ir" data-i="' + i + '">Comenzar</button></div></div>';
              }).join("") : '<p class="nota">Aún no tienes favoritos. Al final del paso 4 puedes guardar el entrenamiento.</p>') +
            "</div></div>" +
          "</section>";
        var raiz = cont.querySelector(".pz");
        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b) return;
          var a = b.dataset.a, i = +b.dataset.i;
          if (a === "volver") R.salir();
          else if (a === "nuevo") { cfg = mezcla(DEF, null); guardarCfg(); paso = 1; pantallaPaso(); }
          else if (a === "ultimo-ver") { paso = 1; pantallaPaso(); }
          else if (a === "ultimo-ir") comenzar();
          else if (a === "fav-editar") { cfg = mezcla(DEF, favs[i].cfg); guardarCfg(); paso = 1; pantallaPaso(); }
          else if (a === "fav-ir") { cfg = mezcla(DEF, favs[i].cfg); guardarCfg(); comenzar(); }
          else if (a === "fav-borrar") { favs.splice(i, 1); guardarFavs(); pantallaInicio(); }
        });
      }

      function comenzar() {
        var err = validar();
        if (err) { aviso = err; paso = 1; pantallaPaso(); return; }
        R.pedirJugador(cont, function (nombre) { entrenar(nombre); }, function () { paso = 4; pantallaPaso(); });
      }

      /* ---------- asistente de 4 pasos ---------- */
      function htmlSeccion(cat, cuerpo) {
        var n = itemsCat(cat).length;
        function tg(k, et) { return '<button type="button" class="pildora pz-tg" data-tg="' + k + ":" + cat + '" aria-pressed="' + (cfg[k][cat] ? "true" : "false") + '"><span class="punto"></span>' + et + "</button>"; }
        return '<div class="pz-sec"><div class="pz-sec-cab"><h3>' + nombreCat(cat) + (n ? ' <em>' + n + "</em>" : "") + "</h3><div class=\"pz-tgs\">" + tg("vis", "Ver") + tg("voz", "Voz") + "</div></div>" + cuerpo + "</div>";
      }
      function cuerpoColores() {
        var s = cfg.sel.colores;
        var h = '<div class="pz-swatches">' + todosColores().map(function (c) {
          var esExtra = cfg.extra.some(function (e) { return e.id === c[0]; });
          return '<span class="pz-swc"><button type="button" class="pz-sw" data-lista="colores" data-v="' + c[0] + '" aria-pressed="' + (s.indexOf(c[0]) >= 0) + '" aria-label="' + R.esc(c[1]) + '" title="' + R.esc(c[1]) + '" style="--c:' + c[2] + ";--t:" + contraste(c[2]) + '"><span>✓</span></button>' +
            (esExtra ? '<button type="button" class="pz-x" data-delcol="' + c[0] + '" aria-label="Quitar color">×</button>' : "") + '<small>' + R.esc(c[1]) + "</small></span>";
        }).join("") + '<span class="pz-swc"><button type="button" class="pz-sw pz-mas" data-a="color-nuevo" aria-label="Agregar color propio">+</button><small>Propio</small></span></div>';
        if (editColor) {
          h += '<div class="pz-edit"><input id="pz-cn" class="texto" type="text" maxlength="16" placeholder="Nombre del color" autocomplete="off"><input id="pz-cc" type="color" value="#ff6a00" aria-label="Elegir color"><button class="btn primario" type="button" data-a="color-ok">Agregar</button></div>';
        }
        h += '<div class="pz-fila-bt"><button type="button" class="chip" data-a="todos:colores">Todos</button><button type="button" class="chip" data-a="ninguno:colores">Ninguno</button></div>';
        return h;
      }
      function cuerpoFlechas() {
        var s = cfg.sel.flechas;
        return '<div class="pz-brujula">' + ORDEN_BRUJULA.map(function (i) {
          if (i < 0) return '<button type="button" class="chip pz-todas" data-a="todos:flechas">' + (s.length === 8 ? "Quitar" : "Todas") + "</button>";
          return '<button type="button" class="chip pz-flecha' + (s.indexOf(i) >= 0 ? " sel" : "") + '" data-lista="flechas" data-v="' + i + '" aria-label="' + DIRS[i][0] + '">' + GLIFOS[i] + "</button>";
        }).join("") + "</div>";
      }
      function cuerpoLista(cat, valores, visibles) {
        var s = cfg.sel[cat], expandido = exp[cat];
        var lista = expandido ? valores : valores.slice(0, visibles);
        return '<div class="chips pz-nums">' + lista.map(function (v) {
          return '<button type="button" class="chip' + (s.indexOf(v) >= 0 ? " sel" : "") + '" data-lista="' + cat + '" data-v="' + v + '">' + v + "</button>";
        }).join("") + '</div><div class="pz-fila-bt"><button type="button" class="chip" data-a="exp:' + cat + '">' + (expandido ? "Ver menos" : "Ver más") + '</button><button type="button" class="chip" data-a="todos:' + cat + '">Todos</button><button type="button" class="chip" data-a="ninguno:' + cat + '">Ninguno</button></div>';
      }
      function cuerpoFormas() {
        var s = cfg.sel.formas;
        return '<div class="chips">' + FORMAS.map(function (f) {
          return '<button type="button" class="chip pz-forma' + (s.indexOf(f[0]) >= 0 ? " sel" : "") + '" data-lista="formas" data-v="' + f[0] + '"><span class="pz-mini">' + formaSVG(f[0], "currentColor") + "</span>" + f[1] + "</button>";
        }).join("") + "</div>";
      }
      function cuerpoPalabras() {
        return '<div class="pz-edit"><input id="pz-pal" class="texto" type="text" maxlength="18" placeholder="Escribe una palabra (ej.: Pase)" autocomplete="off"><button class="btn primario" type="button" data-a="pal-ok">Agregar</button></div>' +
          (cfg.sel.palabras.length ? '<div class="chips">' + cfg.sel.palabras.map(function (w, i) {
            return '<span class="pz-pal">' + R.esc(w) + '<button type="button" data-delpal="' + i + '" aria-label="Quitar">×</button></span>';
          }).join("") + "</div>" : '<p class="nota">Agrega tus propias palabras: nombres de jugadas, posiciones, órdenes…</p>');
      }
      function cuerpoCalculos() {
        var s = cfg.sel.calculos;
        return '<div class="chips">' + OPS.map(function (o) {
          return '<button type="button" class="chip' + (s.indexOf(o[0]) >= 0 ? " sel" : "") + '" data-lista="calculos" data-v="' + o[0] + '">' + o[1] + "</button>";
        }).join("") + "</div>" + campo("maxCalc", "Resultado máximo", 5, 20, 1, cfg.maxCalc, "") +
          '<p class="nota">Aparece una cuenta (por ejemplo 3 + 4) y el resultado indica a qué cono ir.</p>';
      }
      function htmlEstimulos() {
        var h = '<div class="pz-tabs"><button type="button" class="' + (cfg.nivel === "simple" ? "sel" : "") + '" data-set="nivel:simple">Simple</button>' +
          '<button type="button" class="' + (cfg.nivel === "avanzado" ? "sel" : "") + '" data-set="nivel:avanzado">Avanzado</button></div>';
        var cats = CATS.map(function (c) { return c[0]; });
        if (cfg.nivel === "avanzado") {
          h += '<p class="nota">Combinaciones que mezclan estímulos.</p><div class="pz-tipos">' + TIPOS.map(function (t) {
            var sel = t.id === cfg.tipoAv, extra = "";
            if (sel && t.id === "stroop") {
              extra = chips("Fondo", "fondoStroop", [["color", "De color"], ["blanco", "Blanco"], ["oscuro", "Negro"]], cfg.fondoStroop) +
                chips("¿A qué color ir?", "regla", [["tinta", "Color de la tinta"], ["palabra", "La palabra escrita"], ["fondo", "Color del fondo"], ["azar", "Al azar (se indica)"]], cfg.regla) +
                campo("coinc", "Palabra y tinta iguales", 0, 100, 10, cfg.coinc, " %");
            } else if (sel && t.id === "bola") extra = campo("vBola", "Velocidad de la pelota", 1, 10, 1, cfg.vBola, "");
            else if (sel && t.id === "verOir") extra = chips("¿A cuál hacer caso?", "reglaVO", [["vista", "Lo que veo"], ["oido", "Lo que escucho"], ["azar", "Al azar (se indica)"]], cfg.reglaVO);
            return '<div class="pz-tipo' + (sel ? " sel" : "") + '"><button type="button" class="pz-tipo-b" data-set="tipoAv:' + t.id + '"><b>' + t.nombre + "</b><small>" + t.desc + "</small></button>" + (sel && extra ? '<div class="pz-tipo-ex">' + extra + "</div>" : "") + "</div>";
          }).join("") + "</div>";
          if (cfg.tipoAv === "stroop" || cfg.tipoAv === "bola") cats = ["colores"];
          if (cfg.tipoAv === "combo") h += '<p class="nota">Los colores elegidos son el fondo y lo demás aparece encima.</p>';
          if (cfg.tipoAv === "verOir") h += '<p class="nota">«Ver» define qué puede aparecer en pantalla y «Voz» qué puede decir la voz.</p>';
        }
        cats.forEach(function (c) {
          var cuerpo = c === "colores" ? cuerpoColores() : c === "flechas" ? cuerpoFlechas() : c === "numeros" ? cuerpoLista("numeros", Array.apply(null, Array(31)).map(function (_, i) { return i; }), 13) :
            c === "letras" ? cuerpoLista("letras", LETRAS, 8) : c === "formas" ? cuerpoFormas() : c === "palabras" ? cuerpoPalabras() : cuerpoCalculos();
          if ((cfg.nivel === "avanzado" && (cfg.tipoAv === "stroop" || cfg.tipoAv === "bola")) && c === "colores") {
            h += '<div class="pz-sec"><div class="pz-sec-cab"><h3>Colores <em>' + itemsCat("colores").length + "</em></h3>" +
              (cfg.tipoAv === "stroop" ? '<div class="pz-tgs"><button type="button" class="pildora pz-tg" data-tg="voz:colores" aria-pressed="' + cfg.voz.colores + '"><span class="punto"></span>Voz</button></div>' : "") + "</div>" + cuerpo + "</div>";
          } else h += htmlSeccion(c, cuerpo);
        });
        if (cfg.nivel === "simple" || cfg.tipoAv === "verOir" || cfg.tipoAv === "combo") {
          h += "<h3>Fondo</h3>" + chips("", "fondo", [["claro", "Claro"], ["oscuro", "Oscuro"]], cfg.fondo) + '<p class="nota">Fondo para flechas, números, letras y formas (los colores llenan toda la pantalla).</p>';
        }
        return h;
      }
      function htmlTransicion() {
        var h = '<div class="pz-tabs"><button type="button" class="' + (cfg.trans === "tiempo" ? "sel" : "") + '" data-set="trans:tiempo">Por tiempo</button>' +
          '<button type="button" class="' + (cfg.trans === "toque" ? "sel" : "") + '" data-set="trans:toque">Al tocar</button></div>';
        if (cfg.trans === "tiempo") {
          h += '<p class="nota">El estímulo cambia solo, cada cierto tiempo.</p>';
          if (cfg.durRand) h += campo("dur", "Duración: desde", 0.1, 5, 0.1, cfg.dur, " s", true) + campo("durMax", "Duración: hasta", 0.1, 5, 0.1, cfg.durMax, " s", true);
          else h += campo("dur", "Duración del estímulo", 0.1, 5, 0.1, cfg.dur, " s", true);
          h += interruptor("durRand", "Duración aleatoria", "Un tiempo distinto cada vez, dentro de un rango.", cfg.durRand);
          if (cfg.pausaRand) h += campo("pausa", "Pausa: desde", 0, 5, 0.1, cfg.pausa, " s", true) + campo("pausaMax", "Pausa: hasta", 0, 5, 0.1, cfg.pausaMax, " s", true);
          else h += campo("pausa", "Pausa entre estímulos", 0, 5, 0.1, cfg.pausa, " s", true);
          h += interruptor("pausaRand", "Pausa aleatoria", "Para que no se pueda adivinar cuándo viene el siguiente.", cfg.pausaRand);
          h += interruptor("reloj", "Reloj de anticipación", "Una barra se vacía durante la pausa y avisa cuándo aparece el próximo.", cfg.reloj);
        } else {
          h += '<p class="nota">El estímulo cambia cuando tocas la pantalla (el entrenador o el deportista).</p>' +
            campo("pausa", "Pausa antes del siguiente", 0, 5, 0.1, cfg.pausa, " s", true) +
            interruptor("feedback", "Mostrar tiempo de reacción", "Después de cada toque muestra cuántos milisegundos tardó.", cfg.feedback);
        }
        h += interruptor("tic", "Sonido al cambiar", "Un tic corto cada vez que aparece un estímulo.", cfg.tic);
        h += interruptor("noGo", "Parada (no-go)", "A veces aparece un color con una ✕: el deportista no debe moverse.", cfg.noGo);
        if (cfg.noGo) {
          h += '<p class="campo-et sola">Color de la parada</p><div class="pz-swatches pz-chicos">' + todosColores().map(function (c) {
            return '<span class="pz-swc"><button type="button" class="pz-sw" data-set="noGoColor:' + c[0] + '" aria-pressed="' + (cfg.noGoColor === c[0]) + '" aria-label="' + R.esc(c[1]) + '" style="--c:' + c[2] + ";--t:" + contraste(c[2]) + '"><span>✓</span></button></span>';
          }).join("") + "</div>" + campo("noGoProb", "Frecuencia de la parada", 5, 50, 5, cfg.noGoProb, " %");
        }
        return h;
      }
      function htmlDuracion() {
        var h = '<div class="pz-tabs"><button type="button" class="' + (cfg.tipoDur === "tiempo" ? "sel" : "") + '" data-set="tipoDur:tiempo">Cuenta regresiva</button>' +
          '<button type="button" class="' + (cfg.tipoDur === "rondas" ? "sel" : "") + '" data-set="tipoDur:rondas">Rondas</button></div>';
        if (cfg.tipoDur === "tiempo") {
          h += interruptor("ilim", "Sin límite de tiempo", "Corre hasta que lo detengas.", cfg.ilim) +
            campo("min", "Minutos", 0, 10, 1, cfg.min, "", false, cfg.ilim) + campo("seg", "Segundos", 0, 55, 5, cfg.seg, "", false, cfg.ilim) +
            (!cfg.ilim && cfg.min * 60 + cfg.seg < 5 ? '<p class="nota">El mínimo es 5 segundos.</p>' : "");
        } else {
          h += interruptor("ilim", "Sin límite de rondas", "Corre hasta que lo detengas.", cfg.ilim) + campo("rondas", "Rondas (estímulos por serie)", 5, 200, 5, cfg.rondas, "", false, cfg.ilim);
        }
        h += "<h3>Series</h3>" + campo("series", "Series", 1, 10, 1, cfg.series, "");
        if (cfg.series > 1) h += campo("descanso", "Descanso entre series", 0, 180, 5, cfg.descanso, " s");
        return h;
      }
      function htmlResumen() {
        function fila(t, v) { return '<div class="pz-res-f"><b>' + t + "</b><span>" + R.esc(v) + "</span></div>"; }
        return fila("Estímulos", resumenEstimulos()) + fila("Transición", resumenTransicion()) + fila("Duración", resumenDuracion()) +
          '<p class="pz-total">Tiempo total: <b>' + tiempoTotal() + "</b></p>" +
          '<div id="pz-guardar" hidden><h3>Guardar en favoritos</h3><input id="pz-fn" class="texto" type="text" maxlength="40" placeholder="Nombre del entrenamiento" autocomplete="off">' +
          '<input id="pz-fd" class="texto" type="text" maxlength="80" placeholder="Descripción (opcional)" autocomplete="off"><button class="btn primario" type="button" data-a="fav-ok">Guardar</button></div>' +
          '<p class="aviso" id="pz-ok" hidden>Guardado en favoritos.</p>';
      }

      var TITULOS = ["Estímulos", "Transición", "Duración", "Resumen"];
      var SUBT = ["Qué aparece en la pantalla", "Cómo y cuándo cambian los estímulos", "Cuánto dura el entrenamiento", "¿Todo se ve bien?"];

      function pantallaPaso() {
        if (limpiarJuego) { limpiarJuego(); limpiarJuego = null; }
        R.mantenerPantalla(false);
        var prev = 0, old = cont.querySelector(".lz-scroll");
        if (old) prev = old.scrollTop;
        var cuerpo = paso === 1 ? htmlEstimulos() : paso === 2 ? htmlTransicion() : paso === 3 ? htmlDuracion() : htmlResumen();
        var err = paso === 1 ? validar() : "";
        var puntos = [1, 2, 3, 4].map(function (n) {
          return '<i class="' + (n < paso ? "hecho" : n === paso ? "ahora" : "") + '">' + (n < paso ? "✓" : n) + "</i>";
        }).join("");
        cont.innerHTML =
          '<section class="lz lz-config pz">' +
            '<header class="lz-top"><button class="volver" type="button" data-a="salir" aria-label="Salir al inicio">✕</button><div class="pz-pasos">' + puntos + "</div></header>" +
            '<div class="lz-scroll"><div class="lz-col"><h2 class="pz-tit">' + TITULOS[paso - 1] + "</h2><p class=\"nota\">" + SUBT[paso - 1] + "</p>" + cuerpo +
              (err ? '<p class="pz-err">' + err + "</p>" : (aviso && paso === 1 ? '<p class="pz-err">' + aviso + "</p>" : "")) + "</div></div>" +
            '<footer class="lz-pie"><div class="lz-col pz-nav">' +
              '<button class="btn" type="button" data-a="atras">' + (paso === 1 ? "Inicio" : "Anterior") + "</button>" +
              (paso < 4 ? '<button class="btn primario" type="button" data-a="sigue"' + (err ? " disabled" : "") + ">Siguiente</button>"
                : '<button class="btn" type="button" data-a="fav">★ Favorito</button><button class="btn primario" type="button" data-a="go">Comenzar</button>') +
            "</div></footer>" +
          "</section>";
        var raiz = cont.querySelector(".pz");
        R.pintarRangos(raiz);
        raiz.querySelector(".lz-scroll").scrollTop = prev;
        aviso = "";
        enlazarPaso(raiz);
      }

      function enlazarPaso(raiz) {
        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b) return;
          var d = b.dataset, a = d.a || "";
          if (a === "salir") { pantallaInicio(); return; }
          if (a === "atras") { if (paso === 1) pantallaInicio(); else { paso--; pantallaPaso(); } return; }
          if (a === "sigue") { paso++; pantallaPaso(); return; }
          if (a === "go") { comenzar(); return; }
          if (a === "fav") { var g = raiz.querySelector("#pz-guardar"); g.hidden = !g.hidden; if (!g.hidden) raiz.querySelector("#pz-fn").focus(); return; }
          if (a === "fav-ok") {
            var nombre = (raiz.querySelector("#pz-fn").value || "").trim();
            if (!nombre) { raiz.querySelector("#pz-fn").focus(); return; }
            favs.push({ nombre: nombre, desc: (raiz.querySelector("#pz-fd").value || "").trim(), cfg: JSON.parse(JSON.stringify(cfg)) });
            guardarFavs();
            raiz.querySelector("#pz-guardar").hidden = true; raiz.querySelector("#pz-ok").hidden = false;
            return;
          }
          var cambio = true;
          if (d.set) { var p = d.set.indexOf(":"); setCfg(d.set.slice(0, p), d.set.slice(p + 1)); }
          else if (d.tg) { var q = d.tg.split(":"); cfg[q[0]][q[1]] = !cfg[q[0]][q[1]]; }
          else if (d.sw) { cfg[d.sw] = !cfg[d.sw]; if (d.sw === "durRand" && cfg.durMax < cfg.dur) cfg.durMax = cfg.dur; if (d.sw === "pausaRand" && cfg.pausaMax < cfg.pausa) cfg.pausaMax = cfg.pausa; }
          else if (d.lista) {
            var v = d.v; if (d.lista === "numeros" || d.lista === "flechas") v = Number(v);
            alternar(cfg.sel[d.lista], v);
            if (d.lista === "numeros") cfg.sel.numeros.sort(function (x, y) { return x - y; });
          }
          else if (d.delcol) {
            cfg.extra = cfg.extra.filter(function (c) { return c.id !== d.delcol; });
            cfg.sel.colores = cfg.sel.colores.filter(function (c) { return c !== d.delcol; });
            if (cfg.noGoColor === d.delcol) cfg.noGoColor = "rojo";
          }
          else if (d.delpal !== undefined) cfg.sel.palabras.splice(+d.delpal, 1);
          else if (a === "color-nuevo") editColor = !editColor;
          else if (a === "color-ok") {
            var nom = (raiz.querySelector("#pz-cn").value || "").trim() || "Color " + (cfg.extra.length + 1);
            var id = "x" + Date.now();
            cfg.extra.push({ id: id, nombre: nom, hex: raiz.querySelector("#pz-cc").value });
            cfg.sel.colores.push(id); editColor = false;
          }
          else if (a === "pal-ok") {
            var inp = raiz.querySelector("#pz-pal"), w = (inp.value || "").trim();
            if (!w) { inp.focus(); return; }
            if (cfg.sel.palabras.indexOf(w) < 0) cfg.sel.palabras.push(w);
          }
          else if (a.indexOf("exp:") === 0) exp[a.slice(4)] = !exp[a.slice(4)];
          else if (a.indexOf("todos:") === 0) {
            var cat = a.slice(6);
            if (cat === "colores") cfg.sel.colores = todosColores().map(function (c) { return c[0]; });
            else if (cat === "flechas") cfg.sel.flechas = cfg.sel.flechas.length === 8 ? [] : [0, 1, 2, 3, 4, 5, 6, 7];
            else if (cat === "numeros") cfg.sel.numeros = Array.apply(null, Array(exp.numeros ? 31 : 13)).map(function (_, i) { return i; });
            else if (cat === "letras") cfg.sel.letras = LETRAS.slice(0, exp.letras ? 26 : 8);
          }
          else if (a.indexOf("ninguno:") === 0) { var c2 = a.slice(8); cfg.sel[c2] = []; }
          else cambio = false;
          if (cambio) { guardarCfg(); pantallaPaso(); }
        });
        raiz.addEventListener("input", function (e) {
          var k = e.target.dataset && e.target.dataset.k;
          if (!k) return;
          cfg[k] = +e.target.value;
          function pintar(clave) {
            var v = raiz.querySelector('[data-v="' + clave + '"]');
            if (v) v.textContent = (v.dataset.d === "1" ? R.num(cfg[clave], 1) : cfg[clave]) + v.dataset.u;
          }
          pintar(k);
          var pares = { dur: ["durRand", "durMax", 1], durMax: ["durRand", "dur", -1], pausa: ["pausaRand", "pausaMax", 1], pausaMax: ["pausaRand", "pausa", -1] };
          var pr = pares[k];
          if (pr && cfg[pr[0]]) {
            var otro = pr[1];
            if ((pr[2] === 1 && cfg[otro] < cfg[k]) || (pr[2] === -1 && cfg[otro] > cfg[k])) {
              cfg[otro] = cfg[k];
              var inp = raiz.querySelector('input[data-k="' + otro + '"]');
              if (inp) { inp.value = cfg[otro]; R.pintarRango(inp); }
              pintar(otro);
            }
          }
          if (k === "min" || k === "seg") {
            var nota = raiz.querySelector(".pz-min-nota");
            if (nota) nota.hidden = cfg.min * 60 + cfg.seg >= 5;
          }
          guardarCfg();
        });
      }

      /* ---------- entrenamiento ---------- */
      function entrenar(jugador) {
        var neu = neutro();
        cont.innerHTML =
          '<section class="pz-tren">' +
            '<div class="pz-escena" style="background:' + neu.bg + ';color:' + neu.fg + '"><div class="pz-cont"></div><div class="pz-bola" hidden></div><div class="pz-regla" hidden></div></div>' +
            '<div class="pz-reloj"><b data-h="t">0:00</b><small data-h="s"></small></div>' +
            '<button class="pz-pausa" type="button" data-a="pausa" aria-label="Pausa">❚❚</button>' +
            '<div class="pz-ant" hidden><i></i></div><div class="pz-fb" hidden></div>' +
            '<div class="pz-overlay"></div>' +
          "</section>";
        var raiz = cont.querySelector(".pz-tren");
        var esc = raiz.querySelector(".pz-escena"), cen = raiz.querySelector(".pz-cont"), bola = raiz.querySelector(".pz-bola"), regla = raiz.querySelector(".pz-regla");
        var hT = raiz.querySelector('[data-h="t"]'), hS = raiz.querySelector('[data-h="s"]');
        var ant = raiz.querySelector(".pz-ant"), antI = ant.querySelector("i"), fb = raiz.querySelector(".pz-fb"), ov = raiz.querySelector(".pz-overlay");
        var D = Math.max(5, cfg.min * 60 + cfg.seg);
        var esBola = cfg.nivel === "avanzado" && cfg.tipoAv === "bola";
        var S = {
          fase: "cuenta", t: 0, prox: 3000, tSerie: 0, tTotal: 0, serie: 1, repsSerie: 0, reps: 0, resp: {}, rts: [],
          pausado: false, fin: false, raf: 0, last: performance.now(), tEst: 0, prev: null, cuentaN: 4, pTotal: 0,
          bx: 0, by: 0, bvx: 0, bvy: 0, bd: 60, hudT: "", hudS: "", fbT: 0
        };

        function neutroEscena() { var n = neutro(); esc.style.background = n.bg; esc.style.color = n.fg; cen.innerHTML = ""; regla.hidden = true; bola.hidden = true; }
        function valor(base, rand, max) { return rand ? entre(base, Math.max(base, max)) : base; }
        function toast(t) {
          fb.textContent = t; fb.hidden = false; S.fbT = S.t + 900;
        }

        function overlayCuenta() {
          ov.className = "pz-overlay"; ov.hidden = false;
          ov.innerHTML = '<p class="pz-ov-t">' + (S.serie > 1 ? "Serie " + S.serie + " comienza en" : "El entrenamiento comienza en") + '</p><div class="pz-anillo"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="9"/><circle class="pz-arco" cx="60" cy="60" r="52" fill="none" stroke="#ff8a1a" stroke-width="9" stroke-linecap="round" transform="rotate(-90 60 60)" stroke-dasharray="326.7" stroke-dashoffset="0"/></svg><b>3</b></div>';
        }
        function overlayDescanso() {
          ov.hidden = false;
          ov.innerHTML = '<p class="pz-ov-t">Descanso</p><b class="pz-gran" data-h="d">' + mmss(cfg.descanso) + '</b><p class="pz-ov-s">Siguiente: serie ' + (S.serie + 1) + " de " + cfg.series + '</p><button class="btn" type="button" data-a="saltar">Saltar descanso</button>';
        }
        function overlayPausa() {
          ov.hidden = false;
          ov.innerHTML = '<p class="pz-ov-t">Pausa</p><p class="pz-ov-s">' + (cfg.tipoDur === "tiempo" && !cfg.ilim ? "Quedan " + mmss(D - S.tSerie / 1000) + " de la serie " + S.serie : "Estímulos: " + S.reps) +
            '</p><div class="pz-ov-bt"><button class="btn primario grande" type="button" data-a="seguir">Reanudar</button><button class="btn grande" type="button" data-a="terminar">Terminar y ver resultados</button><button class="btn peligro grande" type="button" data-a="salir">Salir sin guardar</button></div>';
        }

        function hud() {
          var t, s = "";
          if (cfg.tipoDur === "tiempo") t = cfg.ilim ? mmss(S.tSerie / 1000) : mmss(D - S.tSerie / 1000);
          else t = cfg.ilim ? String(S.repsSerie) : S.repsSerie + " / " + cfg.rondas;
          if (cfg.series > 1) s = "Serie " + S.serie + "/" + cfg.series;
          if (t !== S.hudT) { S.hudT = t; hT.textContent = t; }
          if (s !== S.hudS) { S.hudS = s; hS.textContent = s; hS.hidden = !s; }
        }

        function iniciarSerie() {
          ov.hidden = true; S.tSerie = 0; S.repsSerie = 0; S.prev = null;
          R.mantenerPantalla(true); R.fb.ya();
          mostrar();
        }
        function mostrar() {
          var spec = siguiente(S.prev);
          S.prev = spec.id; S.spec = spec;
          esc.style.background = spec.bg; esc.style.color = spec.fg;
          cen.innerHTML = spec.html || "";
          regla.hidden = !spec.label; regla.textContent = spec.label || "";
          if (esBola) {
            bola.hidden = false; bola.style.background = spec.bola; bola.style.borderColor = contraste(spec.bola);
            var w = esc.clientWidth, h = esc.clientHeight;
            S.bd = Math.round(Math.min(w, h) * 0.17);
            bola.style.width = bola.style.height = S.bd + "px";
            var ang = Math.random() * Math.PI * 2, v = Math.min(w, h) * (0.15 + 0.12 * cfg.vBola);
            S.bvx = Math.cos(ang) * v; S.bvy = Math.sin(ang) * v;
            if (!S.bx && !S.by) { S.bx = w / 2 - S.bd / 2; S.by = h / 2 - S.bd / 2; }
          }
          ant.hidden = true;
          S.reps++; S.repsSerie++; S.resp[spec.etq] = (S.resp[spec.etq] || 0) + 1;
          if (spec.voz) hablar(spec.voz);
          if (cfg.tic) R.tono(spec.noGo ? 220 : 700, 45, "sine", 0.12);
          S.fase = "estimulo"; S.tEst = performance.now();
          S.prox = cfg.trans === "tiempo" ? S.t + valor(cfg.dur, cfg.durRand, cfg.durMax) * 1000 : Infinity;
        }
        function terminaEstimulo() {
          if (cfg.tipoDur === "rondas" && !cfg.ilim && S.repsSerie >= cfg.rondas) { finSerie(); return; }
          var p = valor(cfg.pausa, cfg.pausaRand && cfg.trans === "tiempo", cfg.pausaMax);
          if (p <= 0.001) { mostrar(); return; }
          S.fase = "pausa"; S.prox = S.t + p * 1000; S.pTotal = p * 1000;
          callar(); neutroEscena();
          ant.hidden = !(cfg.reloj && cfg.trans === "tiempo");
        }
        function finSerie() {
          callar(); neutroEscena(); ant.hidden = true;
          if (S.serie >= cfg.series) { terminar(); return; }
          if (cfg.descanso > 0) { S.fase = "descanso"; S.prox = S.t + cfg.descanso * 1000; overlayDescanso(); R.fb.fin(); }
          else siguienteSerie();
        }
        function siguienteSerie() {
          S.serie++; S.fase = "cuenta"; S.prox = S.t + 3000; S.cuentaN = 4; overlayCuenta();
        }

        function moverBola(dt) {
          var w = esc.clientWidth - S.bd, h = esc.clientHeight - S.bd, s = dt / 1000;
          S.bx += S.bvx * s; S.by += S.bvy * s;
          if (S.bx < 0) { S.bx = 0; S.bvx = Math.abs(S.bvx); } else if (S.bx > w) { S.bx = w; S.bvx = -Math.abs(S.bvx); }
          if (S.by < 0) { S.by = 0; S.bvy = Math.abs(S.bvy); } else if (S.by > h) { S.by = h; S.bvy = -Math.abs(S.bvy); }
          bola.style.transform = "translate3d(" + S.bx.toFixed(1) + "px," + S.by.toFixed(1) + "px,0)";
        }

        function bucle(ts) {
          S.raf = requestAnimationFrame(bucle);
          var dt = Math.min(100, Math.max(0, ts - S.last)); S.last = ts;
          if (S.pausado || S.fin) return;
          S.t += dt;
          if (S.fbT && S.t > S.fbT) { fb.hidden = true; S.fbT = 0; }
          if (S.fase === "cuenta") {
            var rem = S.prox - S.t, n = Math.ceil(rem / 1000);
            var arco = ov.querySelector(".pz-arco"), num = ov.querySelector(".pz-anillo b");
            if (arco) arco.setAttribute("stroke-dashoffset", String(326.7 * (1 - (rem % 1000 || 1000) / 1000)));
            if (n !== S.cuentaN && n > 0) { S.cuentaN = n; if (num) num.textContent = n; R.fb.cuenta(); }
            if (rem <= 0) iniciarSerie();
          } else if (S.fase === "descanso") {
            var r = S.prox - S.t, d = ov.querySelector('[data-h="d"]');
            if (d) d.textContent = mmss(r / 1000);
            if (r <= 0) siguienteSerie();
          } else {
            S.tSerie += dt; S.tTotal += dt;
            hud();
            if (cfg.tipoDur === "tiempo" && !cfg.ilim && S.tSerie >= D * 1000) { finSerie(); return; }
            if (S.fase === "estimulo") {
              if (cfg.trans === "tiempo" && S.t >= S.prox) terminaEstimulo();
              else if (esBola) moverBola(dt);
            } else if (S.fase === "pausa") {
              if (S.t >= S.prox) mostrar();
              else if (!ant.hidden) antI.style.transform = "scaleX(" + ((S.prox - S.t) / S.pTotal).toFixed(3) + ")";
            }
          }
        }

        function terminar() {
          if (S.fin) return;
          S.fin = true; cancelAnimationFrame(S.raf); callar();
          R.mantenerPantalla(false); R.fb.fin();
          limpiarJuego = null;
          resultado(S, jugador);
        }

        /* toque en la pantalla (modo «Al tocar») */
        esc.addEventListener("pointerdown", function () {
          if (S.pausado || S.fin || S.fase !== "estimulo" || cfg.trans !== "toque") return;
          var rt = performance.now() - S.tEst;
          if (cfg.feedback) { S.rts.push(rt); toast(Math.round(rt) + " ms"); }
          terminaEstimulo();
        });
        raiz.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b) return;
          var a = b.dataset.a;
          if (a === "pausa" && !S.pausado && !S.fin && S.fase !== "cuenta") { S.pausado = true; callar(); overlayPausa(); }
          else if (a === "seguir") { S.pausado = false; S.last = performance.now(); if (S.fase === "cuenta") overlayCuenta(); else if (S.fase === "descanso") overlayDescanso(); else ov.hidden = true; }
          else if (a === "terminar") { S.pausado = false; terminar(); }
          else if (a === "salir") { S.fin = true; cancelAnimationFrame(S.raf); callar(); limpiarJuego = null; pantallaPaso(); }
          else if (a === "saltar") siguienteSerie();
        });

        limpiarJuego = function () { S.fin = true; cancelAnimationFrame(S.raf); callar(); };
        R.mantenerPantalla(true);
        neutroEscena(); hud(); overlayCuenta();
        S.raf = requestAnimationFrame(bucle);
      }

      /* ---------- resultados ---------- */
      function resultado(S, jugador) {
        var calif = { intensidad: 0, concentracion: 0 }, guardado = false;
        var total = Math.round(S.tTotal / 100) / 10;
        var filas = Object.keys(S.resp).map(function (k) { return [k, S.resp[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
        var media = S.rts.length ? Math.round(S.rts.reduce(function (a, b) { return a + b; }, 0) / S.rts.length) : null;
        var mejor = S.rts.length ? Math.round(Math.min.apply(null, S.rts)) : null;
        var puedeGuardar = R.hist && R.hist.activo && jugador;

        function pintar() {
          cont.innerHTML =
            '<section class="lz lz-res pz-res"><div class="lz-col centro">' +
              '<p class="eyebrow">Personalizado · ' + R.esc(nombreModo()) + (jugador ? " · " + R.esc(jugador) : "") + "</p>" +
              "<h2>Resultados</h2>" +
              '<div class="gran"><span>' + S.reps + "</span><small>estímulos</small></div>" +
              '<dl class="stats"><div><dt>Tiempo entrenado</dt><dd>' + R.num(total, 1) + " s</dd></div><div><dt>Series</dt><dd>" + S.serie + "</dd></div>" +
              (media !== null ? "<div><dt>Reacción media</dt><dd>" + media + " ms</dd></div><div><dt>Mejor reacción</dt><dd>" + mejor + " ms</dd></div>" : "") + "</dl>" +
              '<div class="pz-tabla"><div class="pz-tabla-c"><span>Estímulo</span><span>Veces</span></div>' + filas.map(function (f) {
                return "<div><span>" + R.esc(f[0]) + "</span><b>" + f[1] + "</b></div>";
              }).join("") + "</div>" +
              '<div class="pz-esfuerzo"><p>¿Qué tan intenso fue?</p><div class="pz-estrellas">' + estrellasHTML(calif.intensidad, "intensidad") + "</div>" +
              "<p>¿Qué tan concentrado estuvo?</p><div class=\"pz-estrellas\">" + estrellasHTML(calif.concentracion, "concentracion") + "</div></div>" +
              (puedeGuardar ? '<button class="btn primario grande" type="button" data-a="guardar"' + (guardado ? " disabled" : "") + ">" + (guardado ? "Guardado en el historial" : "Guardar en el historial") + "</button>" : "") +
              '<div class="acciones">' +
                '<button class="btn primario" type="button" data-a="otra">Repetir</button>' +
                '<button class="btn" type="button" data-a="config">Configurar</button>' +
                '<button class="btn" type="button" data-a="menu">Menú</button>' +
              "</div>" +
            "</div></section>";
          cont.querySelector(".pz-res").addEventListener("click", function (e) {
            var b = e.target.closest("button");
            if (!b) return;
            var d = b.dataset;
            if (d.est) { var p = d.est.split(":"); calif[p[0]] = calif[p[0]] === +p[1] ? 0 : +p[1]; var sc = cont.querySelector(".lz-res").scrollTop; pintar(); cont.querySelector(".lz-res").scrollTop = sc; }
            else if (d.a === "guardar" && !guardado) {
              var extra = (calif.intensidad ? " · intensidad " + calif.intensidad + "/5" : "") + (calif.concentracion ? " · concentración " + calif.concentracion + "/5" : "");
              guardado = R.registrarPartida(jugador, {
                juego: "Personalizado", modo: nombreModo(), config: resumenEstimulos() + " · " + resumenTransicion() + " · " + resumenDuracion() + extra,
                valor: S.reps, unidad: "estímulos", mejorEs: "max", stats: { rtMedia: media, rtMejor: mejor }
              });
              var sc2 = cont.querySelector(".lz-res").scrollTop; pintar(); cont.querySelector(".lz-res").scrollTop = sc2;
            }
            else if (d.a === "otra") entrenar(jugador);
            else if (d.a === "config") { paso = 4; pantallaPaso(); }
            else if (d.a === "menu") R.salir();
          });
        }
        pintar();
      }

      pantallaInicio();
      return function destruir() { if (limpiarJuego) limpiarJuego(); callar(); };
    }
  });
})(window.Reacciona);
