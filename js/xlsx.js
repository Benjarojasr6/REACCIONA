/* Reacciona: generador mínimo de archivos .xlsx (sin librerías, funciona sin internet).
   R.crearXlsx({ hoja: "Historial", anchos: [12, 8, ...], filas: [[...encabezados], [...datos]] }) -> Uint8Array */
(function (R) {
  var TABLA = null;
  function crc32(bytes) {
    if (!TABLA) {
      TABLA = [];
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        TABLA[n] = c >>> 0;
      }
    }
    var crc = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) crc = TABLA[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function utf8(s) { return new TextEncoder().encode(s); }
  function u16(n) { return [n & 255, (n >>> 8) & 255]; }
  function u32(n) { return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]; }

  /* ZIP sin compresión ("store"), suficiente para un .xlsx. */
  function zip(archivos) {
    var partes = [], central = [], offset = 0;
    archivos.forEach(function (a) {
      var nombre = utf8(a.nombre), datos = utf8(a.contenido), crc = crc32(datos);
      var cab = [].concat(
        [0x50, 0x4b, 0x03, 0x04], u16(20), u16(0x0800), u16(0), u16(0), u16(0x21),
        u32(crc), u32(datos.length), u32(datos.length), u16(nombre.length), u16(0)
      );
      partes.push(new Uint8Array(cab), nombre, datos);
      central.push(new Uint8Array([].concat(
        [0x50, 0x4b, 0x01, 0x02], u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21),
        u32(crc), u32(datos.length), u32(datos.length), u16(nombre.length), u16(0), u16(0),
        u16(0), u16(0), u32(0), u32(offset)
      )), nombre);
      offset += cab.length + nombre.length + datos.length;
    });
    var tamCentral = 0;
    central.forEach(function (p) { tamCentral += p.length; });
    var fin = new Uint8Array([].concat(
      [0x50, 0x4b, 0x05, 0x06], u16(0), u16(0), u16(archivos.length), u16(archivos.length),
      u32(tamCentral), u32(offset), u16(0)
    ));
    var todo = partes.concat(central, [fin]), total = 0;
    todo.forEach(function (p) { total += p.length; });
    var salida = new Uint8Array(total), pos = 0;
    todo.forEach(function (p) { salida.set(p, pos); pos += p.length; });
    return salida;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; })
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
  }
  function columna(i) {
    var s = "";
    for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
    return s;
  }

  R.crearXlsx = function (o) {
    var filas = o.filas, anchos = o.anchos || [];
    var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
    if (anchos.length) {
      xml += "<cols>" + anchos.map(function (w, i) {
        return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>';
      }).join("") + "</cols>";
    }
    xml += "<sheetData>";
    filas.forEach(function (fila, r) {
      xml += '<row r="' + (r + 1) + '">';
      fila.forEach(function (v, c) {
        if (v === null || v === undefined || v === "") return;
        var ref = columna(c) + (r + 1), estilo = r === 0 ? ' s="1"' : "";
        if (typeof v === "number" && isFinite(v)) xml += '<c r="' + ref + '"' + estilo + "><v>" + v + "</v></c>";
        else xml += '<c r="' + ref + '" t="inlineStr"' + estilo + "><is><t>" + esc(v) + "</t></is></c>";
      });
      xml += "</row>";
    });
    xml += "</sheetData></worksheet>";

    var estilos = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts>' +
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FF14573A"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

    return zip([
      { nombre: "[Content_Types].xml", contenido:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>' },
      { nombre: "_rels/.rels", contenido:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { nombre: "xl/workbook.xml", contenido:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' + esc(o.hoja || "Hoja1") + '" sheetId="1" r:id="rId1"/></sheets></workbook>' },
      { nombre: "xl/_rels/workbook.xml.rels", contenido:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { nombre: "xl/styles.xml", contenido: estilos },
      { nombre: "xl/worksheets/sheet1.xml", contenido: xml }
    ]);
  };
})(window.Reacciona || (window.Reacciona = {}));
