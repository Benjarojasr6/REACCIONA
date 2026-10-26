/* Reacciona: historial de partidas, nombre del jugador, ranking, opciones y exportación a Excel.
   El historial se activa con el botón del menú. Queda apagado cada vez que se abre la app. */
(function (R) {
  R.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  function dos(n) { return (n < 10 ? "0" : "") + n; }
  function fechaTxt(d) { return dos(d.getDate()) + "-" + dos(d.getMonth() + 1) + "-" + d.getFullYear(); }
  function horaTxt(d) { return dos(d.getHours()) + ":" + dos(d.getMinutes()); }

  R.hist = {
    activo: false,
    todos: function () { var l = R.leer("historial", []); return Array.isArray(l) ? l : []; },
    guardar: function (rec) {
      var l = R.hist.todos();
      l.push(rec);
      if (l.length > 3000) l = l.slice(l.length - 3000);
      R.guardar("historial", l);
    },
    borrar: function () { R.guardar("historial", []); },
    nombres: function () {
      var vistos = {}, salida = [], l = R.hist.todos();
      for (var i = l.length - 1; i >= 0 && salida.length < 8; i--) {
        var n = l[i].nombre;
        if (n && !vistos[n.toLowerCase()]) { vistos[n.toLowerCase()] = 1; salida.push(n); }
      }
      return salida;
    }
  };

  /* Pide el nombre antes de jugar. Si el historial está apagado, sigue de largo. */
  R.pedirJugador = function (cont, ok, cancelar) {
    if (!R.hist.activo) { ok(null); return; }
    var ahora = new Date();
    var recientes = R.hist.nombres();
    cont.innerHTML =
      '<section class="lz op">' +
        '<header class="lz-top"><button class="volver" type="button" data-a="cancelar" aria-label="Volver">←</button><h2>Jugador</h2></header>' +
        '<div class="lz-scroll"><div class="lz-col">' +
          '<h3>Nombre</h3>' +
          '<input id="jug-nombre" class="texto" type="text" maxlength="40" autocomplete="off" autocapitalize="words" placeholder="Escribe el nombre" value="' + R.esc(recientes[0] || "") + '">' +
          (recientes.length ? '<div class="chips">' + recientes.map(function (n) {
            return '<button type="button" class="chip" data-n="' + R.esc(n) + '">' + R.esc(n) + "</button>";
          }).join("") + "</div>" : "") +
          '<p class="nota">Fecha y hora: <b>' + fechaTxt(ahora) + " " + horaTxt(ahora) + "</b> (se guarda sola)</p>" +
        "</div></div>" +
        '<footer class="lz-pie"><div class="lz-col"><button class="btn primario grande" type="button" data-a="ok">Comenzar</button></div></footer>' +
      "</section>";
    var raiz = cont.querySelector(".op");
    var inp = raiz.querySelector("#jug-nombre");
    function aceptar() { ok((inp.value || "").trim() || "Sin nombre"); }
    raiz.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.a === "cancelar") cancelar();
      else if (b.dataset.a === "ok") aceptar();
      else if (b.dataset.n !== undefined) { inp.value = b.dataset.n; aceptar(); }
    });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") aceptar(); });
    setTimeout(function () { try { inp.focus(); inp.select(); } catch (e) {} }, 60);
  };

  /* ---------- exportar a Excel ---------- */
  R.exportarExcel = function () {
    var l = R.hist.todos();
    if (!l.length) return false;
    var filas = [["Fecha", "Hora", "Nombre", "Prueba", "Modo", "Configuración", "Resultado", "Unidad",
      "Aciertos", "Fallos", "Precisión (%)", "Reacción media (ms)", "Mejor reacción (ms)"]];
    l.forEach(function (r) {
      var d = new Date(r.t), s = r.stats || {};
      filas.push([fechaTxt(d), horaTxt(d), r.nombre, r.juego, r.modo, r.config, r.valor, r.unidad,
        s.aciertos, s.fallos, s.precision, s.rtMedia, s.rtMejor]);
    });
    var bytes = R.crearXlsx({
      hoja: "Historial",
      anchos: [12, 8, 22, 16, 18, 34, 11, 11, 10, 8, 13, 19, 19],
      filas: filas
    });
    var blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    var a = document.createElement("a");
    var hoy = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = "reacciona-historial-" + hoy.getFullYear() + "-" + dos(hoy.getMonth() + 1) + "-" + dos(hoy.getDate()) + ".xlsx";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 10000);
    return true;
  };

  /* ---------- pantalla de opciones ---------- */
  R.pantallaOpciones = function (cont) {
    var grupoSel = null, confirmando = false, aviso = "";

    function interruptor(clave, etiqueta, nota, deshabilitado) {
      return '<div class="fila-op"><div><b>' + etiqueta + "</b>" + (nota ? "<small>" + nota + "</small>" : "") + "</div>" +
        '<button type="button" class="interruptor" role="switch" data-sw="' + clave + '" aria-checked="' + (R.ajustes[clave] && !deshabilitado ? "true" : "false") + '"' +
        (deshabilitado ? " disabled" : "") + '><i></i></button></div>';
    }

    function grupos(l) {
      var m = {};
      l.forEach(function (r) {
        var k = r.juego + " · " + r.modo;
        m[k] = (m[k] || 0) + 1;
      });
      return Object.keys(m).sort(function (a, b) { return m[b] - m[a]; });
    }

    function pintar() {
      var l = R.hist.todos();
      var gs = grupos(l);
      if (!grupoSel || gs.indexOf(grupoSel) < 0) grupoSel = gs[0] || null;

      var ranking = "";
      if (!l.length) {
        ranking = '<p class="nota">Aún no hay partidas guardadas. Activa el botón <b>Historial</b> en el menú antes de jugar.</p>';
      } else {
        var items = l.filter(function (r) { return r.juego + " · " + r.modo === grupoSel; });
        var menorEsMejor = items.length && items[0].mejorEs === "min";
        items.sort(function (a, b) { return menorEsMejor ? a.valor - b.valor || a.t - b.t : b.valor - a.valor || a.t - b.t; });
        ranking = '<div class="chips">' + gs.map(function (g) {
          return '<button type="button" class="chip' + (g === grupoSel ? " sel" : "") + '" data-g="' + R.esc(g) + '">' + R.esc(g) + "</button>";
        }).join("") + "</div><ol class=\"rank\">" + items.slice(0, 20).map(function (r, i) {
          var d = new Date(r.t);
          var v = r.unidad === "s" ? R.num(r.valor, 2) : r.valor;
          return '<li><span class="pos">' + (i + 1) + "</span><span class=\"nm\">" + R.esc(r.nombre) +
            "<small>" + R.esc(r.config) + " · " + fechaTxt(d) + " " + horaTxt(d) + "</small></span>" +
            '<span class="val">' + v + "<small>" + R.esc(r.unidad) + "</small></span></li>";
        }).join("") + "</ol>";
      }

      var scroll = cont.querySelector(".lz-scroll");
      var prev = scroll ? scroll.scrollTop : 0;
      cont.innerHTML =
        '<section class="lz op">' +
          '<header class="lz-top"><button class="volver" type="button" data-a="volver" aria-label="Volver al menú">←</button><h2>Opciones</h2></header>' +
          '<div class="lz-scroll"><div class="lz-col">' +
            "<h3>Sonido y vibración</h3>" +
            interruptor("sonido", "Sonido", "Avisos al acertar, fallar y en la cuenta regresiva.", false) +
            interruptor("vibracion", "Vibración", R.puedeVibrar ? "" : "No está disponible en este dispositivo.", !R.puedeVibrar) +
            "<h3>Ranking</h3>" + ranking +
            "<h3>Historial</h3>" +
            '<p class="nota">' + l.length + (l.length === 1 ? " partida guardada" : " partidas guardadas") + " en esta tablet. " +
              (R.hist.activo ? "El historial está activo." : "El historial está apagado.") + "</p>" +
            (aviso ? '<p class="aviso">' + aviso + "</p>" : "") +
            '<div class="acciones">' +
              '<button class="btn primario grande" type="button" data-a="excel">Exportar a Excel</button>' +
              (confirmando
                ? '<button class="btn peligro" type="button" data-a="borrar-si">Sí, borrar todo</button><button class="btn" type="button" data-a="borrar-no">Cancelar</button>'
                : '<button class="btn" type="button" data-a="borrar" style="grid-column:1/-1">Borrar historial</button>') +
            "</div>" +
          "</div></div>" +
        "</section>";
      var s2 = cont.querySelector(".lz-scroll");
      if (s2) s2.scrollTop = prev;
    }

    cont.addEventListener("click", onClick);
    function onClick(e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.a === "volver") R.salir();
      else if (b.dataset.sw) {
        R.ajustes[b.dataset.sw] = !R.ajustes[b.dataset.sw];
        R.guardarAjustes();
        if (R.ajustes[b.dataset.sw]) { if (b.dataset.sw === "sonido") R.fb.ok(); else R.vibrar(30); }
        aviso = ""; pintar();
      } else if (b.dataset.g) { grupoSel = b.dataset.g; pintar(); }
      else if (b.dataset.a === "excel") {
        aviso = R.exportarExcel() ? "Se descargó el archivo de Excel." : "No hay partidas para exportar todavía.";
        pintar();
      } else if (b.dataset.a === "borrar") { confirmando = true; aviso = ""; pintar(); }
      else if (b.dataset.a === "borrar-no") { confirmando = false; pintar(); }
      else if (b.dataset.a === "borrar-si") { R.hist.borrar(); confirmando = false; aviso = "Historial borrado."; pintar(); }
    }
    pintar();
    return function () { cont.removeEventListener("click", onClick); };
  };

  /* Construye el registro de una partida y lo guarda si el historial está activo. */
  R.registrarPartida = function (nombre, datos) {
    if (!R.hist.activo || !nombre) return false;
    R.hist.guardar({
      t: Date.now(), nombre: nombre, juego: datos.juego, modo: datos.modo, config: datos.config,
      valor: datos.valor, unidad: datos.unidad, mejorEs: datos.mejorEs, stats: datos.stats || {}
    });
    return true;
  };
})(window.Reacciona);
