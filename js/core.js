/* Reacciona: núcleo. Registro de juegos, menú, rutas y utilidades compartidas.
   Para agregar un juego nuevo: crea js/games/<nombre>.js que llame a Reacciona.registrar({...})
   y súmalo en index.html y en la lista ARCHIVOS de sw.js. */
(function () {
  var R = window.Reacciona = { juegos: [], version: "1.0" };

  R.registrar = function (juego) { R.juegos.push(juego); };

  /* ---------- utilidades ---------- */
  R.html = function (s) {
    var t = document.createElement("template");
    t.innerHTML = s.trim();
    return t.content.firstElementChild;
  };

  R.leer = function (clave, defecto) {
    try {
      var v = localStorage.getItem("reacciona:" + clave);
      return v === null ? defecto : JSON.parse(v);
    } catch (e) { return defecto; }
  };
  R.guardar = function (clave, valor) {
    try { localStorage.setItem("reacciona:" + clave, JSON.stringify(valor)); } catch (e) {}
  };

  R.num = function (n, dec) { return Number(n).toFixed(dec).replace(".", ","); };

  /* Pinta el relleno de las barras deslizantes (--p). */
  R.pintarRango = function (inp) {
    var min = +inp.min || 0, max = +inp.max || 100;
    inp.style.setProperty("--p", ((inp.value - min) / (max - min)) * 100 + "%");
  };
  document.addEventListener("input", function (e) {
    if (e.target && e.target.type === "range") R.pintarRango(e.target);
  });
  R.pintarRangos = function (raiz) {
    Array.prototype.forEach.call(raiz.querySelectorAll("input[type=range]"), R.pintarRango);
  };

  /* Mantener la pantalla encendida mientras se juega. */
  var wake = null, quiereWake = false;
  function pedirWake() {
    try {
      if (quiereWake && navigator.wakeLock && document.visibilityState === "visible") {
        navigator.wakeLock.request("screen").then(function (w) { wake = w; }).catch(function () {});
      }
    } catch (e) {}
  }
  R.mantenerPantalla = function (on) {
    quiereWake = !!on;
    if (on) pedirWake();
    else if (wake) { try { wake.release(); } catch (e) {} wake = null; }
  };
  document.addEventListener("visibilitychange", pedirWake);

  R.pantallaCompleta = function () {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(function () {});
    } catch (e) {}
  };

  /* ---------- rutas: #/<id> abre un juego, vacío es el menú ---------- */
  var app, cierre = null, desdeMenu = false;

  R.abrir = function (id) { desdeMenu = true; location.hash = "#/" + id; };
  R.salir = function () {
    if (desdeMenu) history.back();
    else location.hash = "";
  };

  function limpiar() {
    if (cierre) { try { cierre(); } catch (e) {} cierre = null; }
    R.mantenerPantalla(false);
    app.innerHTML = "";
    app.className = "";
  }

  function ruta() {
    var id = (location.hash || "").replace(/^#\/?/, "");
    limpiar();
    var juego = R.juegos.filter(function (j) { return j.id === id; })[0];
    if (id === "opciones" && R.pantallaOpciones) {
      app.className = "juego";
      cierre = R.pantallaOpciones(app);
    } else if (juego) {
      desdeMenu = desdeMenu || false;
      app.className = "juego";
      cierre = juego.iniciar(app, R);
    } else {
      desdeMenu = false;
      menu();
    }
    R.pintarAviso();
  }

  /* Aviso de versión nueva: solo se muestra en el menú, para no interrumpir una partida. */
  R.hayActualizacion = false;
  R.pintarAviso = function () {
    var ya = document.getElementById("aviso-act");
    var mostrar = R.hayActualizacion && app && app.className === "menu";
    if (!mostrar) { if (ya) ya.remove(); return; }
    if (ya) return;
    var a = R.html(
      '<div id="aviso-act" role="status"><span>Hay una versión nueva</span>' +
      '<button type="button" data-a="act">Actualizar</button>' +
      '<button type="button" class="suave" data-a="luego" aria-label="Ahora no">✕</button></div>'
    );
    a.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.a === "act") location.reload();
      else { R.hayActualizacion = false; a.remove(); }
    });
    document.body.appendChild(a);
  };

  function menu() {
    app.className = "menu";
    var raiz = R.html(
      '<div class="menu-in">' +
        '<header class="menu-cab">' +
          '<img src="icon-192.png" alt="" width="72" height="72">' +
          '<div class="menu-tit"><h1>REACCIONA</h1><p>Entrenamiento reactivo</p></div>' +
          '<div class="menu-acc">' +
            '<button class="pildora" type="button" data-a="hist" aria-pressed="false" title="Guardar nombre y resultado de las partidas siguientes">' +
              '<i class="punto"></i><span>Historial</span></button>' +
            '<button class="btn-icono" type="button" data-a="opciones" aria-label="Opciones" title="Opciones">⚙</button>' +
            '<button class="btn-icono" type="button" data-a="full" aria-label="Pantalla completa" title="Pantalla completa">⛶</button>' +
          '</div>' +
        '</header>' +
        '<h2 class="menu-sec">Pruebas</h2>' +
        '<div class="cartas"></div>' +
        '<p class="menu-pie">Estado de Alerta! Este es el detalle...<span class="ver"></span></p>' +
      '</div>'
    );
    var cont = raiz.querySelector(".cartas");
    R.juegos.forEach(function (j) {
      var c = R.html(
        '<button class="carta" type="button">' +
          '<span class="carta-pv"></span>' +
          '<span class="carta-tx"><b></b><small></small></span>' +
          '<span class="carta-ir" aria-hidden="true">›</span>' +
        '</button>'
      );
      c.querySelector("b").textContent = j.nombre;
      c.querySelector("small").textContent = j.descripcion;
      c.querySelector(".carta-pv").appendChild(j.preview());
      c.addEventListener("click", function () { R.abrir(j.id); });
      cont.appendChild(c);
    });
    cont.appendChild(R.html('<div class="carta vacia"><span>Más pruebas pronto</span></div>'));
    raiz.querySelector("[data-a=full]").addEventListener("click", R.pantallaCompleta);
    raiz.querySelector("[data-a=opciones]").addEventListener("click", function () { R.abrir("opciones"); });
    var pil = raiz.querySelector("[data-a=hist]");
    function pintarHist() {
      pil.setAttribute("aria-pressed", R.hist && R.hist.activo ? "true" : "false");
      pil.querySelector("span").textContent = R.hist && R.hist.activo ? "Historial activo" : "Historial";
    }
    pil.addEventListener("click", function () { R.hist.activo = !R.hist.activo; pintarHist(); R.tono && R.tono(R.hist.activo ? 700 : 450, 80, "sine", 0.15); });
    pintarHist();
    app.appendChild(raiz);
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage("version");
      }
    } catch (e) {}
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", function (e) {
      if (!e.data || !e.data.version) return;
      var v = String(e.data.version).replace(/^.*-v/, "");
      var el = document.querySelector(".menu-pie .ver");
      if (el) el.textContent = "Versión " + v;
    });
  }

  R.iniciar = function () {
    app = document.getElementById("app");
    window.addEventListener("hashchange", ruta);
    ruta();

    var splash = document.getElementById("splash");
    function quitar() {
      if (!splash) return;
      splash.classList.add("fuera");
      var s = splash; splash = null;
      setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 500);
    }
    splash.addEventListener("click", quitar);
    setTimeout(quitar, 2400);

    if ("serviceWorker" in navigator && /^https?:/.test(location.protocol)) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").then(function (reg) {
          function nueva() { R.hayActualizacion = true; R.pintarAviso(); }
          if (reg.waiting && navigator.serviceWorker.controller) nueva();
          reg.addEventListener("updatefound", function () {
            var w = reg.installing;
            if (!w) return;
            w.addEventListener("statechange", function () {
              if (w.state === "installed" && navigator.serviceWorker.controller) nueva();
            });
          });
          function buscar() { try { reg.update().catch(function () {}); } catch (e) {} }
          document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "visible") buscar();
          });
          setInterval(buscar, 30 * 60 * 1000);
        }).catch(function () {});
      });
    }
  };
})();
