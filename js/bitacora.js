/* ============================================================
   ADMIN-FLANDES · BITÁCORA
   Ecosistema Flandes · Fase 10 · entrega 10.1

   Cada cambio hecho desde ADMIN (hoja BITACORA_ADMIN): quién, cuándo, en
   qué app, qué acción, sobre qué, cómo estaba, cómo quedó y el motivo.

   Las últimas 400 filas vinieron con el arranque; "Traer toda la
   bitácora" pide el resto UNA vez ('bitacora'). Filtros por app, por
   acción, por fechas y búsqueda, todo en el teléfono.

   PDF por BLOQUES (regla del PDF: un informe para leer, agrupado por
   día) y Excel plano (una fila por cambio, con el antes y el después
   completos).
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var C = {};
  var F = { app: '', accion: '', buscar: '', desde: '', hasta: '' };
  var TODA = null;           /* la bitácora entera, si se pidió */

  function O() { return window.OFICINA; }
  function D() { return C.datos ? C.datos() : {}; }
  function filas() { return TODA || D().bitacora || []; }

  /** 'dd/MM/yyyy HH:mm:ss' -> 'aaaa-mm-dd' */
  function iso(f) { var m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(f || '')); return m ? m[3] + '-' + m[2] + '-' + m[1] : ''; }
  function grupoAccion(a) {
    a = String(a || '');
    if (/^USUARIO|^CLAVE|^BIENVENIDA|^REVISOR/.test(a)) return 'USUARIOS';
    if (/^SUPERVISOR/.test(a)) return 'SUPERVISORES';
    if (a === 'FESTIVOS') return 'FESTIVOS';
    if (a === 'AVISO') return 'AVISOS';
    if (a === 'CONFIG') return 'CONFIGURACIÓN';
    return a || 'OTRO';
  }

  function filtradas() {
    var q = K.norm(F.buscar);
    return filas().filter(function (b) {
      if (F.app && b.app !== F.app) return false;
      if (F.accion && grupoAccion(b.accion) !== F.accion) return false;
      var d = iso(b.fecha);
      if (F.desde && d < F.desde) return false;
      if (F.hasta && d > F.hasta) return false;
      if (q && K.norm([b.nombre, b.app, b.accion, b.objeto, b.motivo, b.antes, b.despues].join(' ')).indexOf(q) < 0) return false;
      return true;
    });
  }

  /* ══════════════ la vista ══════════════ */

  function vista() {
    var caja = K.nodo('<div class="kit-ancho vista ct ad"></div>');
    C.app.appendChild(caja);
    O().cabecera(caja, 'documento', 'BITÁCORA DE CAMBIOS',
      'Todo lo que se cambia desde ADMIN: configuración, festivos, avisos, supervisores y usuarios. Las llaves secretas se apuntan tapadas y las contraseñas nunca se escriben.');

    var b = O().barra({ placeholder: 'Buscar por llave, persona, motivo o valor', valor: F.buscar,
      alBuscar: function (t) { F.buscar = t; pintar(); },
      alRefrescar: function () { return C.recargar().then(function () { TODA = null; pastillas(); pintar(); }); } });
    caja.appendChild(b.caja);

    var fechas = K.nodo('<div class="rp-fechas ad-fechas">' +
      '<label><span>Desde</span><input type="date" data-kit-fecha data-desde="2026" data-titulo="Desde"></label>' +
      '<label><span>Hasta</span><input type="date" data-kit-fecha data-desde="2026" data-titulo="Hasta"></label></div>');
    var iDe = fechas.querySelectorAll('input')[0], iHa = fechas.querySelectorAll('input')[1];
    iDe.value = F.desde; iHa.value = F.hasta;
    iDe.addEventListener('change', function () { F.desde = iDe.value; pintar(); });
    iHa.addEventListener('change', function () { F.hasta = iHa.value; pintar(); });
    caja.appendChild(fechas);
    if (K.piezas.fechas) setTimeout(function () { K.piezas.fechas.montar(fechas); }, 0);

    var zA = K.nodo('<div class="ad-pastillas"></div>'), zX = K.nodo('<div class="ad-pastillas"></div>');
    caja.appendChild(zA); caja.appendChild(zX);

    var acc = K.nodo('<div class="ct-acc ad-exp"></div>');
    var bPdf = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('pdf', 16) + ' PDF</button>');
    var bXls = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('hoja', 16) + ' Excel</button>');
    var bTodo = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('descargar', 16) + ' Traer toda la bitácora</button>');
    acc.appendChild(bPdf); acc.appendChild(bXls);
    caja.appendChild(acc);
    var total = K.nodo('<p class="formulario__nota ad-total"></p>');
    caja.appendChild(total);
    var zona = K.nodo('<div class="ad-bit"></div>');
    caja.appendChild(zona);
    K.piezas.creditos.montar(caja);

    bPdf.addEventListener('click', function () { exportar('pdf'); });
    bXls.addEventListener('click', function () { exportar('xlsx'); });
    bTodo.addEventListener('click', function () {
      bTodo.disabled = true; bTodo.classList.add('kit-ocupado');
      K.piezas.esqueletos.mientras(zona, O().leer('bitacora'), { forma: 'ficha', cuantos: 2, espera: 'Trayendo toda la bitácora' })
        .then(function (r) { TODA = r.lista || []; pastillas(); pintar(); }, function (e) { bTodo.disabled = false; bTodo.classList.remove('kit-ocupado'); K.aviso((e && e.message) || 'No se pudo.', 'malo', 6000); pintar(); });
    });

    var pA, pX;
    function pastillas() {
      zA.innerHTML = ''; zX.innerHTML = '';
      var apps = {}, acciones = {};
      filas().forEach(function (x) { apps[x.app] = 1; acciones[grupoAccion(x.accion)] = 1; });
      pA = K.piezas.pastillas.montar(zA, { opciones: [{ valor: '', texto: 'Todas las apps' }].concat(Object.keys(apps).sort().map(function (a) { return { valor: a, texto: a === 'CORE' ? 'Ecosistema' : a }; })),
        valor: F.app, alCambiar: function (v) { F.app = v; pintar(); } });
      pX = K.piezas.pastillas.montar(zX, { opciones: [{ valor: '', texto: 'Todo' }].concat(Object.keys(acciones).sort().map(function (a) { return { valor: a, texto: a }; })),
        valor: F.accion, alCambiar: function (v) { F.accion = v; pintar(); } });
    }
    function pintar() {
      var mA = { '': 0 }, mX = { '': 0 };
      filas().forEach(function (x) { mA['']++; mA[x.app] = (mA[x.app] || 0) + 1; var g = grupoAccion(x.accion); mX['']++; mX[g] = (mX[g] || 0) + 1; });
      pA.conteos(mA); pX.conteos(mX);
      var l = filtradas();
      var tot = TODA ? TODA.length : (D().bitacoraTotal || filas().length);
      total.textContent = K.numero(l.length) + (l.length === 1 ? ' cambio' : ' cambios') + ' con estos filtros · ' + K.numero(filas().length) + ' cargados de ' + K.numero(tot) + '.';
      if (!TODA && tot > filas().length) { if (!bTodo.parentNode) acc.appendChild(bTodo); } else if (bTodo.parentNode) bTodo.parentNode.removeChild(bTodo);
      zona.innerHTML = '';
      if (!l.length) { zona.appendChild(O().vacio(filas().length ? 'Ningún cambio con esos filtros.' : 'Todavía no hay cambios apuntados. Aparecen apenas guardes algo desde ADMIN.', filas().length ? function () { F = { app: '', accion: '', buscar: '', desde: '', hasta: '' }; b.inp.value = ''; iDe.value = ''; iHa.value = ''; pastillas(); pintar(); } : null)); return; }
      var dia = '';
      l.slice(0, 300).forEach(function (x) {
        var d = String(x.fecha).slice(0, 10);
        if (d !== dia) { dia = d; zona.appendChild(K.nodo('<h4 class="ad-bit__dia">' + K.esc(O().cuando(iso(x.fecha)) || d) + '</h4>')); }
        zona.appendChild(fila(x));
      });
      if (l.length > 300) zona.appendChild(K.nodo('<p class="formulario__nota">Se muestran los 300 más recientes. Filtra o descarga el Excel para ver todos.</p>'));
    }
    pastillas();
    pintar();
    vista._repintar = pintar;
  }

  function fila(x) {
    var t = K.nodo('<article class="kit-tarjeta ad-bf"><div class="ad-bf__cab"><span class="ad-bf__cara"></span><div class="ad-bf__t"><b></b><small></small></div><span class="ct-marca"></span></div>' +
      '<p class="ad-bf__obj"></p></article>');
    if (K.piezas.personas) t.querySelector('.ad-bf__cara').appendChild(K.piezas.personas.avatar(x.nombre || 'SISTEMA', { tam: 36 }));
    t.querySelector('.ad-bf__t b').textContent = x.accion + (x.app && x.app !== 'CORE' ? ' · ' + x.app : '');
    t.querySelector('.ad-bf__t small').textContent = String(x.fecha).slice(11, 16) + ' · ' + O().nombre(x.nombre || 'Sistema');
    t.querySelector('.ad-bf__cab > .ct-marca').textContent = grupoAccion(x.accion);
    t.querySelector('.ad-bf__obj').textContent = x.objeto;
    if (x.motivo) t.appendChild(K.nodo('<p class="ad-bf__mot">' + K.icono('comentario', 13) + ' <span></span></p>')).querySelector('span').textContent = x.motivo;
    var dif = diferencias(x.antes, x.despues);
    if (dif.length) {
      var det = K.nodo('<details class="ad-bf__det"><summary>' + K.icono('abajo', 12) + ' Ver el cambio (' + dif.length + ')</summary><div class="ad-dif"></div></details>');
      var z = det.querySelector('.ad-dif');
      dif.forEach(function (d) {
        var r = K.nodo('<div class="ad-dif__f"><code></code><span class="ad-dif__a"></span><span class="ad-dif__b"></span></div>');
        r.querySelector('code').textContent = d.k || 'valor';
        r.querySelector('.ad-dif__a').textContent = d.a === '' ? '(vacío)' : d.a;
        r.querySelector('.ad-dif__b').textContent = d.b === '' ? '(vacío)' : d.b;
        z.appendChild(r);
      });
      t.appendChild(det);
    }
    return t;
  }

  /** Lo que cambió, campo por campo si los dos lados son JSON de objeto. */
  function diferencias(a, b) {
    var A = parse(a), B = parse(b);
    if (A && B && typeof A === 'object' && typeof B === 'object' && !(A instanceof Array) && !(B instanceof Array)) {
      var out = [], vistos = {};
      Object.keys(A).concat(Object.keys(B)).forEach(function (k) {
        if (vistos[k]) return; vistos[k] = 1;
        var va = JSON.stringify(A[k] === undefined ? '' : A[k]), vb = JSON.stringify(B[k] === undefined ? '' : B[k]);
        if (va !== vb) out.push({ k: k, a: corto(A[k]), b: corto(B[k]) });
      });
      return out;
    }
    if (String(a || '') === String(b || '')) return [];
    return [{ k: '', a: corto(A !== null ? A : a), b: corto(B !== null ? B : b) }];
  }
  function parse(s) { try { return JSON.parse(s); } catch (e) { return null; } }
  function corto(v) { if (v === undefined || v === null) return ''; var s = typeof v === 'string' ? v : JSON.stringify(v); return s.length > 600 ? s.slice(0, 600) + '…' : s; }

  /* ══════════════ PDF y Excel ══════════════ */

  function exportar(que) {
    var l = filtradas();
    if (!l.length) { K.aviso('No hay cambios con esos filtros.', 'aviso', 3000); return; }
    var cols = [
      { campo: 'fecha', titulo: 'Fecha' }, { campo: 'nombre', titulo: 'Quién' }, { campo: 'documento', titulo: 'Documento' },
      { campo: 'app', titulo: 'App' }, { campo: 'accion', titulo: 'Acción' }, { campo: 'objeto', titulo: 'Sobre qué' },
      { campo: 'antes', titulo: 'Antes' }, { campo: 'despues', titulo: 'Después' }, { campo: 'motivo', titulo: 'Motivo' }
    ];
    var rango = (F.desde || F.hasta) ? 'Del ' + (O().fecha(F.desde) || 'inicio') + ' al ' + (O().fecha(F.hasta) || 'hoy') : 'Toda la bitácora cargada';
    var ex = K.piezas.exportar;
    if (que === 'xlsx') { ex.aExcel('Bitacora ADMIN', cols, l); return; }
    var filasPdf = l.map(function (x) {
      var d = diferencias(x.antes, x.despues).map(function (z) { return (z.k ? z.k + ': ' : '') + (z.a || '(vacío)') + ' → ' + (z.b || '(vacío)'); }).join('\n');
      return { fecha: x.fecha, nombre: O().nombre(x.nombre), app: x.app, accion: x.accion, objeto: x.objeto, cambio: d, motivo: x.motivo, dia: String(x.fecha).slice(0, 10) };
    });
    ex.aPDF('Bitácora de ADMIN', [
      { campo: 'fecha', titulo: 'Fecha' }, { campo: 'nombre', titulo: 'Quién' }, { campo: 'app', titulo: 'App' },
      { campo: 'objeto', titulo: 'Sobre qué' }, { campo: 'cambio', titulo: 'Cambio', largo: true }, { campo: 'motivo', titulo: 'Motivo', largo: true }
    ], filasPdf, {
      subtitulo: rango + ' · ' + l.length + (l.length === 1 ? ' cambio' : ' cambios'),
      bloque: {
        titulo: function (f) { return f.accion + (f.app && f.app !== 'CORE' ? ' · ' + f.app : ''); },
        sub: function (f) { return f.fecha + ' · ' + f.nombre; },
        marca: function (f) { return grupoAccion(f.accion); },
        tono: function (f) { return /INACTIVO|RETIRADO|SUSPENDIDO/.test(f.accion) ? 'malo' : (/NUEVO|REACTIVADO|ACTIVO/.test(f.accion) ? 'ok' : ''); }
      },
      grupo: function (f) { return f.dia; },
      resumen: function (fs) {
        var c = {};
        fs.forEach(function (f) { var g = grupoAccion(f.accion); c[g] = (c[g] || 0) + 1; });
        return Object.keys(c).map(function (k) { return { etiqueta: k, valor: c[k] }; });
      }
    });
  }

  window.BITACORA = {
    configurar: function (c) { C = c || {}; },
    vista: vista,
    olvidar: function () { F = { app: '', accion: '', buscar: '', desde: '', hasta: '' }; TODA = null; },
    _filtradas: filtradas, _diferencias: diferencias, _grupo: grupoAccion
  };
}());
