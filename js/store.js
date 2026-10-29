/* Estado, almacenamiento en el dispositivo (IndexedDB) y valores por defecto. */
(function () {
  const K = (window.K = window.K || {});
  K.version = '1.4.2';

  K.uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  K.pad = (n) => String(n).padStart(2, '0');
  K.hoy = () => {
    const d = new Date();
    return d.getFullYear() + '-' + K.pad(d.getMonth() + 1) + '-' + K.pad(d.getDate());
  };
  K.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  K.fechaCorta = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}-${m}-${y}`;
  };

  /* ---------- Catálogos por defecto ---------- */
  K.TRATAMIENTOS_BASE = [
    { id: 'ejercicio', nombre: 'Ejercicio terapéutico', icono: 'img:ejercicio', intervencion: true },
    { id: 'hielo', nombre: 'Inmersión en hielo', icono: 'svg:hielo', intervencion: true },
    { id: 'termo', nombre: 'Termoterapia', icono: 'img:termoterapia', intervencion: true },
    { id: 'vendaje', nombre: 'Vendajes', icono: 'img:vendaje', intervencion: true },
    { id: 'crio', nombre: 'Crioterapia', icono: 'img:crioterapia', intervencion: true },
    { id: 'heridas', nombre: 'Limpieza de heridas', icono: 'svg:heridas', intervencion: true },
    { id: 'electro', nombre: 'Electroterapia', icono: 'svg:electro', intervencion: true },
    { id: 'preso', nombre: 'Presoterapia', icono: 'img:presoterapia', intervencion: true },
    { id: 'puncion', nombre: 'Punción seca', icono: 'img:puncion', intervencion: true },
    { id: 'masaje', nombre: 'Masajes', icono: 'img:masaje', intervencion: true },
    { id: 'seguro', nombre: 'Derivaciones al seguro', icono: 'img:mok', intervencion: false },
    { id: 'carga', nombre: 'Manejo de carga', icono: 'svg:balanza', intervencion: true },
    { id: 'farmaco', nombre: 'Farmacología', icono: 'svg:medicamento', intervencion: true },
    { id: 'deriv', nombre: 'Derivación externa', icono: 'svg:estetoscopio', intervencion: false },
    { id: 'sangrado', nombre: 'Manejo de sangrado', icono: 'svg:gota', intervencion: true },
    { id: 'evalcancha', nombre: 'Evaluación en cancha', icono: 'svg:atenciones', intervencion: true },
    { id: 'ortopedia', nombre: 'Ortopedia', icono: 'svg:muleta', intervencion: true },
    { id: 'inmov', nombre: 'Inmovilización', icono: 'svg:hueso', intervencion: true }
  ];
  K.TRAT_NUEVOS = ['carga', 'farmaco', 'deriv', 'sangrado', 'ortopedia', 'inmov', 'evalcancha'];
  K.INDICADORES_GENERALES = [
    { id: 'i-lesiones', nombre: 'Total de lesiones', fuente: 'lesiones', icono: 'svg:lesion' },
    { id: 'i-molestias', nombre: 'Total de molestias', fuente: 'molestias', icono: 'svg:molestia' },
    { id: 'i-atenciones', nombre: 'Total de atenciones', fuente: 'atenciones', icono: 'img:atenciones' },
    { id: 'i-intervenciones', nombre: 'Total de intervenciones', fuente: 'intervenciones', icono: 'svg:intervencion' },
    { id: 'i-controles', nombre: 'Total de controles médicos', fuente: 'controles', icono: 'svg:control' },
    { id: 'i-examenes', nombre: 'Total de exámenes', fuente: 'examenes', icono: 'svg:examen' },
    { id: 'i-medicamentos', nombre: 'Total de medicamentos', fuente: 'medicamentos', icono: 'svg:medicamento' },
    { id: 'i-cirugias', nombre: 'Total de cirugías', fuente: 'cirugias', icono: 'svg:cirugia' }
  ];
  K.STAFF_BASE = [
    { cargo: 'Técnico', personas: ['Sebastián Méndez', 'Domingo Sorace'] },
    { cargo: 'Preparador físico', personas: ['Carlos Márquez'] },
    { cargo: 'Preparador de arqueros', personas: ['Fernando Guerrero', 'Benjamín Aguilera'] },
    { cargo: 'Utilero', personas: ['Manuel Munizaga'] },
    { cargo: 'Kinesiólogo', personas: ['Benjamín Rojas', 'Nicolás Aravena', 'Fernando'] }
  ];
  // Calendario real del semestre (Sub 15-16): [rival, archivo del escudo, local]
  K.CALENDARIO_BASE = [
    ['Palestino', 'palestino', false], ['Audax', 'audax', true], ['Everton', 'everton', false],
    ['Coquimbo', 'coquimbo', true], ['Iquique', 'iquique', false], ['U. de Chile', 'u-de-chile', true],
    ['Temuco', 'temuco', true], ['Cobreloa', 'cobreloa', true], ["O'Higgins", 'ohiggins', true],
    ['Colo-Colo', 'colo-colo', false], ['Unión Española', 'union-espanola', true],
    ['U. de Concepción', 'u-de-concepcion', false], ['Recoleta', 'recoleta', false],
    ['U. Católica', 'u-catolica', true], ['Huachipato', 'huachipato', true]
  ];
  K.GRAVEDADES = { minima: 'Mínima', leve: 'Leve', moderada: 'Moderada', grave: 'Grave', pordefinir: 'Por definir' };
  // Gravedad según días fuera: mínima 1-3 · leve 4-7 · moderada 8-28 · grave más de 28.
  K.GRAV_DIAS = { minima: '1-3 días fuera', leve: '4-7 días fuera', moderada: '8-28 días fuera', grave: 'más de 28 días fuera', pordefinir: 'aún sin definir' };
  K.GRAV_ORDEN = ['minima', 'leve', 'moderada', 'grave', 'pordefinir'];
  K.COLORES_GRAV = { minima: '#8fd3a8', leve: '#3fbf6a', moderada: '#f5b400', grave: '#e8353d', pordefinir: '#9aa4a9' };
  K.gravClave = (g) => (K.GRAVEDADES[g] ? g : 'leve');
  K.gravRotulo = (g, dias) => { g = K.gravClave(g); return dias ? `${K.GRAVEDADES[g]} (${K.GRAV_DIAS[g]})` : K.GRAVEDADES[g]; };
  // Gravedad sugerida a partir de los días fuera.
  K.gravPorDias = (n) => (n >= 29 ? 'grave' : n >= 8 ? 'moderada' : n >= 4 ? 'leve' : n >= 1 ? 'minima' : 'pordefinir');

  /* ---------- Fábrica de informes ---------- */
  K.nuevoInforme = function (o) {
    o = o || {};
    const anio = o.anio || new Date().getFullYear();
    const inf = {
      id: K.uid(),
      nombre: o.nombre || 'Sub 15-16',
      categorias: o.categorias || o.nombre || 'Sub 15-16',
      titulo: 'Reporte área Kinésica',
      anio,
      partidos: [],
      staff: [],
      jugadores: [],
      camposExtra: [],
      casos: [],
      atenciones: [],
      eventos: [],
      manuales: [],
      asistencias: [],
      seguros: [],
      segEventos: [],
      tratamientos: K.TRATAMIENTOS_BASE.map((t) => Object.assign({}, t)),
      indicadores: []
    };
    K.TRATAMIENTOS_BASE.forEach(() => {});
    inf.indicadores = K.INDICADORES_GENERALES.map((i) => Object.assign({ grupo: 'general', visible: true }, i)).concat(
      K.TRATAMIENTOS_BASE.map((t) => ({
        id: 'i-t-' + t.id, nombre: t.nombre, fuente: 'trat:' + t.id, icono: t.icono, grupo: 'tratamiento', visible: true
      }))
    );
    if (o.conCalendario) {
      inf.partidos = K.CALENDARIO_BASE.map((p) => ({
        id: K.uid(), rival: p[0], logo: p[1], local: p[2], fecha: '', jugado: true, duracion: 90, minutos: {}, notas: ''
      }));
    }
    if (o.conStaff) {
      inf.staff = K.STAFF_BASE.map((s) => ({
        id: K.uid(), cargo: s.cargo, personas: s.personas.map((n) => ({ nombre: n, ocasional: false }))
      }));
    }
    return inf;
  };

  K.estadoInicial = function () {
    const inf = K.nuevoInforme({ nombre: 'Sub 15-16', conStaff: true });
    return {
      v: 1,
      informes: [inf],
      activo: inf.id,
      periodo: { tipo: 'anual', anio: new Date().getFullYear(), desde: '', hasta: '' },
      ultimoRespaldo: null,
      cambios: 0
    };
  };

  /* ---------- Almacenamiento (IndexedDB con respaldo en localStorage) ---------- */
  const DB = 'informe-kine-sw', ST = 'kv';
  function abrir() {
    return new Promise((ok, mal) => {
      if (!window.indexedDB) return mal(new Error('sin indexedDB'));
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(ST);
      r.onsuccess = () => ok(r.result);
      r.onerror = () => mal(r.error);
    });
  }
  K.cargar = async function () {
    try {
      const db = await abrir();
      const v = await new Promise((ok, mal) => {
        const t = db.transaction(ST).objectStore(ST).get('estado');
        t.onsuccess = () => ok(t.result);
        t.onerror = () => mal(t.error);
      });
      if (v) return v;
    } catch (e) { /* intenta localStorage */ }
    try {
      const s = localStorage.getItem('kine-sw-estado');
      if (s) return JSON.parse(s);
    } catch (e) { /* nada */ }
    return null;
  };
  let tmr = null;
  K.guardarYa = async function () {
    const copia = K.state;
    try {
      const db = await abrir();
      await new Promise((ok, mal) => {
        const t = db.transaction(ST, 'readwrite');
        t.objectStore(ST).put(copia, 'estado');
        t.oncomplete = ok; t.onerror = () => mal(t.error);
      });
    } catch (e) {
      try { localStorage.setItem('kine-sw-estado', JSON.stringify(copia)); } catch (e2) { K.aviso && K.aviso('No se pudo guardar en este dispositivo', true); }
    }
  };
  K.guardar = function () {
    K.state.cambios = (K.state.cambios || 0) + 1;
    clearTimeout(tmr);
    tmr = setTimeout(K.guardarYa, 250);
  };

  /* ---------- Accesos rápidos ---------- */
  K.inf = () => K.state.informes.find((i) => i.id === K.state.activo) || K.state.informes[0];
  K.jugador = (inf, id) => inf.jugadores.find((j) => j.id === id);
  K.trat = (inf, id) => inf.tratamientos.find((t) => t.id === id);

  /* ---------- Respaldo ---------- */
  K.exportar = function (soloActivo) {
    const data = soloActivo
      ? { tipo: 'informe', v: 1, informe: K.inf() }
      : { tipo: 'todo', v: 1, estado: K.state };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    const nombre = soloActivo ? 'informe-' + K.inf().nombre.replace(/[^\w-]+/g, '-') : 'respaldo-informes-kine';
    a.href = URL.createObjectURL(blob);
    a.download = `${nombre}-${K.hoy()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    K.state.ultimoRespaldo = K.hoy();
    K.state.cambios = 0;
    K.guardar();
  };
  K.importar = function (texto, modo) {
    const d = JSON.parse(texto);
    if (d.tipo === 'informe' && d.informe) {
      const inf = d.informe;
      if (K.state.informes.some((i) => i.id === inf.id)) inf.id = K.uid();
      K.state.informes.push(inf);
      K.state.activo = inf.id;
    } else if (d.tipo === 'todo' && d.estado) {
      if (modo === 'reemplazar') {
        const per = K.state.periodo;
        K.state = d.estado;
        K.state.periodo = K.state.periodo || per;
      } else {
        d.estado.informes.forEach((inf) => {
          if (K.state.informes.some((i) => i.id === inf.id)) inf.id = K.uid();
          K.state.informes.push(inf);
        });
      }
    } else throw new Error('Archivo no reconocido');
    K.guardar();
  };
})();
