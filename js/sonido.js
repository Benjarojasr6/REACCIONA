/* Reacciona: sonido y vibración, con interruptores guardados en Opciones. */
(function (R) {
  R.ajustes = Object.assign({ sonido: true, vibracion: true }, R.leer("ajustes", {}));
  R.guardarAjustes = function () { R.guardar("ajustes", R.ajustes); };
  R.puedeVibrar = typeof navigator.vibrate === "function";

  var ctx = null;
  function audio() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { ctx = new C(); } catch (e) { return null; }
    }
    if (ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  R.tono = function (freq, ms, tipo, vol) {
    if (!R.ajustes.sonido) return;
    var a = audio();
    if (!a) return;
    try {
      var o = a.createOscillator(), g = a.createGain(), t = a.currentTime, d = ms / 1000;
      o.type = tipo || "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.22, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(a.destination);
      o.start(t); o.stop(t + d + 0.02);
    } catch (e) {}
  };

  R.vibrar = function (patron) {
    if (R.ajustes.vibracion && R.puedeVibrar) { try { navigator.vibrate(patron); } catch (e) {} }
  };

  /* Notas para la secuencia (una por círculo). */
  var NOTAS = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784];
  R.nota = function (i) { return NOTAS[i % NOTAS.length]; };

  R.fb = {
    ok: function () { R.tono(880, 70, "sine", 0.22); R.vibrar(12); },
    mal: function () { R.tono(170, 170, "square", 0.14); R.vibrar(60); },
    vida: function () { R.tono(130, 320, "sawtooth", 0.16); R.vibrar([80, 40, 80]); },
    cuenta: function () { R.tono(660, 90, "sine", 0.2); },
    ya: function () { R.tono(990, 220, "sine", 0.22); R.vibrar(20); },
    fin: function () {
      R.tono(523, 130, "sine", 0.2);
      setTimeout(function () { R.tono(392, 130, "sine", 0.2); }, 140);
      setTimeout(function () { R.tono(262, 280, "sine", 0.2); }, 280);
      R.vibrar([40, 40, 120]);
    }
  };
})(window.Reacciona);
