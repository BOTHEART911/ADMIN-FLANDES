/* ============================================================
   ADMIN-FLANDES · TABLERO DEL ECOSISTEMA y TABLERO DE RENDIMIENTO
   Fase 10 · entrega 10.6

   UNA llamada ('tablero') trae los dos; el CORE la guarda 20 minutos.
   Todo lo demás (fechas, área, persona, búsqueda) se filtra en el
   teléfono: cero viajes nuevos. "Recalcular" pide el cálculo fresco.

   TABLERO (#/tablero): contratos, cuentas por estado, lo girado por mes,
   usuarios y teléfonos por app, soportes, atrasados, comunicados, el
   servidor en los últimos 7 días (llamadas, lentitud, errores) y los
   avisos por canal.

   RENDIMIENTO (#/rendimiento): cuánto se demora cada paso de una cuenta,
   en DÍAS HÁBILES (sin fines de semana ni festivos; mismo día = 0):
       Revisión (Supervisión + Contratación)  reporte → aprobada
       Cierre del supervisor                  aprobada → plan aceptado / informe firmado
       Contabilidad                           cierre → orden de pago
       Tesorería · egreso                     orden → egreso
       Tesorería · pago                       egreso → pago
   Con la TRAZA DE ESTADOS (apps nuevas, desde producción) la revisión se
   parte en Supervisión y Contratación. Por supervisión (supervisor del
   contrato), por persona de cada área y las cuentas más lentas.

   PDF por BLOQUES (un bloque por área y persona, con el resumen arriba) y
   Excel plano (una fila por cuenta con todas las fechas y los días).
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var O = window.OFICINA;
  var C = {};
  var DATA = null, CARGANDO = null;
  var FK = 'admin.rendimiento.filtro.v1';
  var F = leerFiltro();

  function leerFiltro() {
    var g = K.guardar.leer(FK, null) || {};
    return { area: g.area || '', desde: g.desde || '', hasta: g.hasta || '', busca: '' };
  }
  function guardarFiltro() { K.guardar.escribir(FK, { area: F.area, desde: F.desde, hasta: F.hasta }); }

  /* Los tramos, en el orden del proceso. k = campo del CORE. */
  var TRAMOS = [
    { k: 'dRev', t: 'Revisión', sub: 'Supervisión + Contratación', area: 'REVISION', quien: 'qA', desc: 'Del reporte de la cuenta a la aprobación de Contratación' },
    { k: 'dSup', t: 'Supervisión revisa', sub: 'solo con la traza nueva', area: 'SUPERVISION', quien: 'qRS', desc: 'Del reporte a REVISADA POR SUPERVISOR', traza: true },
    { k: 'dCon', t: 'Contratación revisa', sub: 'solo con la traza nueva', area: 'CONTRATACION', quien: 'qA', desc: 'De REVISADA POR SUPERVISOR a APROBADA', traza: true },
    { k: 'dCie', t: 'Cierre del supervisor', sub: 'plan de pagos + informe firmado', area: 'SUPERVISION', quien: 'qS', desc: 'De la aprobación al plan aceptado y el informe de supervisión firmado' },
    { k: 'dCtb', t: 'Contabilidad', sub: 'orden de pago', area: 'CONTABILIDAD', quien: 'qO', desc: 'Del cierre a la orden de pago' },
    { k: 'dEgr', t: 'Tesorería · egreso', sub: 'comprobante de egreso', area: 'TESORERIA', quien: 'qE', desc: 'De la orden de pago al egreso' },
    { k: 'dPag', t: 'Tesorería · pago', sub: 'giro al contratista', area: 'TESORERIA', quien: 'qP', desc: 'Del egreso al pago' },
    { k: 'dTot', t: 'Total', sub: 'de punta a punta', area: '', quien: '', desc: 'Del reporte de la cuenta al pago' }
  ];
  var AREAS = [
    { v: '', t: 'Todas' }, { v: 'SUPERVISION', t: 'Supervisión' }, { v: 'CONTRATACION', t: 'Contratación' },
    { v: 'CONTABILIDAD', t: 'Contabilidad' }, { v: 'TESORERIA', t: 'Tesorería' }
  ];

  function cargar(fresco) {
    if (DATA && !fresco) return Promise.resolve(DATA);
    if (CARGANDO && !fresco) return CARGANDO;
    CARGANDO = O.leer('tablero', fresco ? { fresco: true } : {}).then(function (d) {
      CARGANDO = null; recibir(d); return DATA;
    }, function (e) { CARGANDO = null; throw e; });
    return CARGANDO;
  }

  /** Las filas del rendimiento como objetos {id, nombre, ..., dTot}. */
  function recibir(d) {
    DATA = d || {};
    var R = DATA.rendimiento || { campos: [], filas: [] };
    DATA._filas = (R.filas || []).map(function (f) {
      var o = {}; R.campos.forEach(function (k, i) { o[k] = f[i]; });
      o._t = K.norm([o.nombre, o.id, o.sup, o.sec, o.qA, o.qS, o.qO, o.qE, o.qP, o.qRS].join(' '));
      o._dia = String(o.R || '').slice(0, 10);
      return o;
    });
    DATA._conTraza = DATA._filas.some(function (o) { return o.fuente === 'T'; });
  }

  /* ══════════════ estadística ══════════════ */

  function mediana(l) {
    if (!l.length) return null;
    var s = l.slice().sort(function (a, b) { return a - b; }), m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2 * 10) / 10;
  }
  function p90(l) { if (!l.length) return null; var s = l.slice().sort(function (a, b) { return a - b; }); return s[Math.min(s.length - 1, Math.floor(s.length * 0.9))]; }
  function prom(l) { if (!l.length) return null; return Math.round(l.reduce(function (a, b) { return a + b; }, 0) / l.length * 10) / 10; }
  function stats(l) { return { n: l.length, med: mediana(l), prom: prom(l), p90: p90(l), max: l.length ? Math.max.apply(null, l) : null }; }
  function valores(filas, k) { return filas.map(function (o) { return o[k]; }).filter(function (x) { return x !== null && x !== undefined && x !== ''; }); }
  function dias(n) { return n === null || n === undefined ? '—' : (String(n).replace('.', ',') + (n === 1 ? ' día' : ' días')); }

  function filtradas() {
    if (!DATA) return [];
    var q = K.norm(F.busca);
    return DATA._filas.filter(function (o) {
      if (F.desde && o._dia < F.desde) return false;
      if (F.hasta && o._dia > F.hasta) return false;
      if (q && o._t.indexOf(q) < 0) return false;
      return true;
    });
  }

  /** Tramos visibles: los del área escogida (sin traza, los de solo-traza se esconden). */
  function tramosVisibles() {
    return TRAMOS.filter(function (t) {
      if (t.traza && !DATA._conTraza) return false;
      if (!F.area) return true;
      if (F.area === 'SUPERVISION' || F.area === 'CONTRATACION') return t.area === F.area || (t.area === 'REVISION' && !DATA._conTraza);
      return t.area === F.area;
    });
  }

  /** Por persona de un tramo: [{quien, n, med, prom, p90, max}] ordenado por mediana. */
  function porPersona(filas, t, campoQuien) {
    var g = {};
    filas.forEach(function (o) {
      var v = o[t.k]; if (v === null || v === undefined) return;
      var q = String(o[campoQuien || t.quien] || '').trim() || 'Sin dato';
      (g[q] = g[q] || []).push(v);
    });
    return Object.keys(g).map(function (q) { var s = stats(g[q]); s.quien = q; return s; })
      .sort(function (a, b) { return (b.med - a.med) || (b.n - a.n); });
  }

  /* ══════════════ piezas de dibujo (SVG, un solo tono de la marca) ══════════════ */

  /** Barras horizontales: [{t, v, sub, alerta}] */
  function barras(items, o) {
    o = o || {};
    var max = Math.max.apply(null, items.map(function (x) { return x.v || 0; }).concat([1]));
    var z = K.nodo('<div class="tb-barras" role="list"></div>');
    items.forEach(function (x) {
      var pct = Math.max(2, Math.round((x.v || 0) / max * 100));
      var r = K.nodo('<div class="tb-barra" role="listitem"><span class="tb-barra__t"></span>' +
        '<span class="tb-barra__pista"><span class="tb-barra__v' + (x.alerta ? ' tb-barra__v--alerta' : '') + '" style="width:' + pct + '%"></span></span>' +
        '<b class="tb-barra__n"></b></div>');
      r.querySelector('.tb-barra__t').textContent = x.t;
      r.querySelector('.tb-barra__n').textContent = o.fmt ? o.fmt(x.v) : K.numero(x.v || 0);
      r.title = x.t + ': ' + (o.fmt ? o.fmt(x.v) : K.numero(x.v || 0)) + (x.sub ? ' · ' + x.sub : '');
      z.appendChild(r);
    });
    return z;
  }

  /** Columnas por mes (SVG): [{t, v}] */
  function columnas(items, fmt) {
    var W = 640, H = 200, pad = 26, n = items.length || 1;
    var max = Math.max.apply(null, items.map(function (x) { return x.v; }).concat([1]));
    var ancho = (W - pad * 2) / n, bw = Math.min(46, ancho * 0.62);
    var s = '<svg class="tb-col" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Girado por mes">';
    s += '<line x1="' + pad + '" y1="' + (H - pad) + '" x2="' + (W - pad) + '" y2="' + (H - pad) + '" class="tb-col__eje"/>';
    items.forEach(function (x, i) {
      var h = Math.max(2, (x.v / max) * (H - pad * 2 - 14));
      var cx = pad + ancho * i + ancho / 2, y = H - pad - h;
      s += '<g class="tb-col__g"><title>' + K.esc(x.t + ': ' + fmt(x.v)) + '</title>' +
        '<rect x="' + (cx - bw / 2) + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="4" class="tb-col__r"/>' +
        '<text x="' + cx + '" y="' + (H - 8) + '" class="tb-col__x">' + K.esc(x.t) + '</text></g>';
    });
    return K.nodo('<div class="tb-col__caja">' + s + '</svg></div>');
  }

  function bloque(caja, titulo, ico, nota) {
    var s = K.nodo('<section class="kit-tarjeta tb-bloque"><h3 class="tb-bloque__t">' + K.icono(ico, 18) + ' <span></span></h3></section>');
    s.querySelector('span').textContent = titulo;
    if (nota) s.appendChild(K.nodo('<p class="formulario__nota"></p>')).textContent = nota;
    caja.appendChild(s);
    return s;
  }
  function cifra(n, t, destino) {
    var b = K.nodo('<button type="button" class="ct-cifra"><b></b><span></span></button>');
    b.querySelector('b').textContent = n;
    b.querySelector('span').textContent = t;
    if (destino) b.addEventListener('click', function () { K.vibrar(6); C.irA(destino); }); else b.disabled = true;
    return b;
  }
  function tabla(cabeza, filas) {
    var t = K.nodo('<div class="tb-tabla" role="table"><div class="tb-tabla__f tb-tabla__f--cab" role="row"></div></div>');
    var cab = t.firstChild;
    cabeza.forEach(function (c) { cab.appendChild(K.nodo('<span role="columnheader"></span>')).textContent = c; });
    filas.forEach(function (f) {
      var r = K.nodo('<div class="tb-tabla__f" role="row"></div>');
      f.forEach(function (c) { r.appendChild(K.nodo('<span role="cell"></span>')).textContent = c; });
      t.appendChild(r);
    });
    return t;
  }

  var ESTADO_T = function (e) { return String(e || '').charAt(0) + String(e || '').slice(1).toLowerCase(); };
  var APP_T = { CONTRATISTA: 'Contratista', CONTRATACION: 'Contratación', SUPERVISION: 'Supervisión', CONTABILIDAD: 'Contabilidad',
                TESORERIA: 'Tesorería', COMUNICACIONES: 'Comunicaciones', ADMIN: 'Admin', CORE: 'Ecosistema (CORE)', KIT: 'Kit', '': 'Sin app' };
  function mesT(m) {
    var n = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    var p = String(m).split('-'); return (n[+p[1] - 1] || p[1]) + ' ' + String(p[0]).slice(2);
  }
  function millones(v) { return '$ ' + (Math.round((v || 0) / 1e5) / 10).toLocaleString('es-CO') + ' M'; }
  function seg(ms) { return ms === null || ms === undefined ? '—' : (Math.round(ms / 100) / 10).toLocaleString('es-CO') + ' s'; }

  /* ══════════════ la cabecera común ══════════════ */

  function cabecera(caja, ico, t, p, alRecalcular) {
    O.cabecera(caja, ico, t, p);
    var barra = K.nodo('<div class="tb-barra-acc"><span class="ct-sello tb-sello"></span></div>');
    var bR = K.nodo('<button type="button" class="kit-btn kit-btn--plano ct-recargar ct-recargar--mini">' + K.icono('recargar', 16) + '<span>Recalcular</span></button>');
    var bPdf = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('pdf', 16) + ' PDF</button>');
    var bXls = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('hoja', 16) + ' Excel</button>');
    barra.appendChild(bR); barra.appendChild(bPdf); barra.appendChild(bXls);
    caja.appendChild(barra);
    bR.addEventListener('click', function () {
      bR.disabled = true; bR.classList.add('kit-ocupado');
      cargar(true).then(function () { K.aviso('Recalculado con los datos de ahora.', 'ok', 2500); alRecalcular(); },
        function (e) { K.aviso((e && e.message) || 'No se pudo recalcular.', 'malo', 6000); })
        .then(function () { bR.disabled = false; bR.classList.remove('kit-ocupado'); });
    });
    return { pdf: bPdf, xls: bXls, sello: barra.querySelector('.tb-sello') };
  }
  function sellar(el) {
    if (!DATA) return;
    el.innerHTML = K.icono('reloj', 13) + ' ' + K.esc('Calculado el ' + String(DATA.hora || '').slice(0, 16) + (DATA.deCache ? ' (guardado; Recalcular para lo de ahora)' : ''));
  }

  /* ══════════════ TABLERO GENERAL ══════════════ */

  function vistaTablero() {
    var caja = K.nodo('<div class="kit-ancho vista ct tb"></div>');
    C.app.appendChild(caja);
    var cab = cabecera(caja, 'grafica', 'TABLERO DEL ECOSISTEMA',
      'Cómo está todo hoy: contratos, cuentas, dinero girado, usuarios, soportes y la salud del servidor. Toca una cifra para ir a su vista.', pintar);
    var zona = K.nodo('<div class="tb-zona"></div>');
    caja.appendChild(zona);
    K.piezas.creditos.montar(caja);
    cab.pdf.addEventListener('click', function () { exportarGeneral('pdf'); });
    cab.xls.addEventListener('click', function () { exportarGeneral('xlsx'); });

    function pintar() {
      sellar(cab.sello);
      zona.innerHTML = '';
      var g = DATA.general || {};
      var ct = g.contratos || { porEstado: {} }, cu = g.cuentas || { porEstado: [] }, di = g.dinero || { porMes: [] };
      var sop = g.soporte ? (g.soporte.pendientes || 0) + (g.soporte.enProceso || 0) + (g.soporte.reabiertos || 0) : null;
      var usu = Object.keys(g.usuarios || {}).reduce(function (s, k) { return s + g.usuarios[k]; }, 0);
      var cifras = K.nodo('<div class="ct-cifras tb-cifras"></div>');
      cifras.appendChild(cifra(K.numero(ct.porEstado.ACTIVO || 0), 'Contratos activos', 'contratistas'));
      cifras.appendChild(cifra(K.numero(cu.abiertas || 0), 'Cuentas en curso', 'rendimiento'));
      cifras.appendChild(cifra(millones(di.total), 'Girado en la vigencia', 'rendimiento'));
      cifras.appendChild(cifra(millones(cu.cobroAbierto), 'Por pagar en curso', ''));
      cifras.appendChild(cifra(sop === null ? '—' : K.numero(sop), 'Soportes por atender', 'soportes'));
      cifras.appendChild(cifra(g.atrasos ? K.numero(g.atrasos.total) : '—', 'Cuentas atrasadas', 'atrasos'));
      cifras.appendChild(cifra(g.comunicados === null || g.comunicados === undefined ? '—' : K.numero(g.comunicados), 'Comunicados publicados', 'comunicados'));
      cifras.appendChild(cifra(K.numero(usu), 'Usuarios activos', 'usuarios'));
      zona.appendChild(cifras);

      var b1 = bloque(zona, 'Cuentas por estado', 'documento', 'En el orden del proceso. ' + K.numero(cu.total || 0) + ' cuentas en la hoja.');
      b1.appendChild(barras((cu.porEstado || []).map(function (x) { return { t: ESTADO_T(x.estado), v: x.n, alerta: x.estado === 'DEVUELTA' || x.estado === 'INCOMPLETA' }; })));

      var b2 = bloque(zona, 'Girado por mes', 'moneda', 'Lo pagado (PAGOS: pago 1 + pago 2). Total ' + K.pesos(di.total) + ' en ' + K.numero(di.pagos || 0) + ' pagos.');
      if ((di.porMes || []).length) b2.appendChild(columnas(di.porMes.map(function (m) { return { t: mesT(m.mes), v: m.valor }; }), K.pesos));
      b2.appendChild(tabla(['Mes', 'Pagos', 'Girado'], (di.porMes || []).map(function (m) { return [mesT(m.mes), K.numero(m.pagos), K.pesos(m.valor)]; })));

      var b3 = bloque(zona, 'Contratos activos por secretaría', 'persona', 'Valor total de los activos: ' + K.pesos(ct.valorActivo) + '.');
      b3.appendChild(barras((ct.porSecretaria || []).map(function (s) { return { t: O.titulo(s.sec), v: s.activos, sub: K.pesos(s.valor) }; })));
      var est = Object.keys(ct.porEstado || {}).map(function (k) { return ESTADO_T(k) + ' ' + ct.porEstado[k]; }).join(' · ');
      b3.appendChild(K.nodo('<p class="formulario__nota"></p>')).textContent = 'Todos los contratos: ' + est + '.';

      var b4 = bloque(zona, 'Usuarios y teléfonos con avisos, por app', 'telefono');
      var apps = {}; Object.keys(g.usuarios || {}).concat(Object.keys(g.telefonos || {})).forEach(function (a) { apps[a] = 1; });
      b4.appendChild(tabla(['App', 'Usuarios activos', 'Teléfonos con avisos'], Object.keys(apps).sort().map(function (a) {
        return [APP_T[a] || a, a === 'CONTRATISTA' ? 'contratistas' : K.numero((g.usuarios || {})[a] || 0), K.numero((g.telefonos || {})[a] || 0)];
      })));

      var sv = g.servidor || { apps: [], lentas: [] };
      var b5 = bloque(zona, 'El servidor en los últimos 7 días', 'nube', 'Cada llamada de las apps al CORE. Mediana = la llamada típica; p90 = 9 de cada 10 tardan menos que eso.');
      b5.appendChild(tabla(['App', 'Llamadas', 'Mediana', 'p90', 'Lentas (+5 s)', 'Con error'], sv.apps.map(function (x) {
        return [APP_T[x.app] || x.app, K.numero(x.llamadas), seg(x.mediana), seg(x.p90), K.numero(x.lentas), K.numero(x.fallos)];
      })));
      if (sv.lentas.length) {
        b5.appendChild(K.nodo('<h4 class="tb-sub">Las acciones más lentas (p90)</h4>'));
        b5.appendChild(barras(sv.lentas.map(function (x) { return { t: (APP_T[x.app] || x.app) + ' · ' + x.accion, v: x.p90, alerta: x.p90 > 8000, sub: x.llamadas + ' llamadas' }; }), { fmt: seg }));
      }
      var er = g.errores || { porApp: {}, ultimos: [] };
      var b6 = bloque(zona, 'Errores en los últimos 7 días', 'aviso', K.numero(er.total || 0) + ' errores anotados en FC_ERRORES.');
      b6.appendChild(barras(Object.keys(er.porApp).map(function (a) { return { t: APP_T[a] || a, v: er.porApp[a], alerta: true }; }).sort(function (a, b) { return b.v - a.v; })));
      (er.ultimos || []).forEach(function (x) {
        var r = K.nodo('<div class="tb-err"><small></small><p></p></div>');
        r.querySelector('small').textContent = x.fecha + ' · ' + (APP_T[x.app] || x.app) + (x.accion ? ' · ' + x.accion : '');
        r.querySelector('p').textContent = x.error;
        b6.appendChild(r);
      });
      var b7 = bloque(zona, 'Avisos de los últimos 7 días, por canal', 'campana');
      b7.appendChild(tabla(['Canal', 'Enviados', 'Salieron'], (g.notificaciones || []).map(function (x) { return [x.canal === '-' ? 'Sin canal' : ESTADO_T(x.canal), K.numero(x.total), K.numero(x.ok)]; })));
    }

    K.piezas.esqueletos.mientras(zona, cargar(false), { forma: 'tarjetas', cuantos: 3, espera: 'Calculando el tablero' })
      .then(pintar)['catch'](function (e) { zona.appendChild(C.errorCaja(e)); });
  }

  /** El tablero general como indicadores (PDF por bloques y Excel). */
  function indicadores() {
    var g = DATA.general || {}, out = [];
    function i(sec, ind, valor, nota) { out.push({ seccion: sec, indicador: ind, valor: String(valor), nota: nota || '' }); }
    var ct = g.contratos || { porEstado: {} };
    Object.keys(ct.porEstado).forEach(function (k) { i('Contratos', 'Contratos ' + ESTADO_T(k).toLowerCase(), ct.porEstado[k]); });
    i('Contratos', 'Valor de los activos', K.pesos(ct.valorActivo));
    (ct.porSecretaria || []).forEach(function (s) { i('Contratos por secretaría', O.titulo(s.sec), s.activos + ' activos', K.pesos(s.valor)); });
    var cu = g.cuentas || { porEstado: [] };
    (cu.porEstado || []).forEach(function (x) { i('Cuentas por estado', ESTADO_T(x.estado), x.n); });
    i('Cuentas por estado', 'En curso', cu.abiertas, 'Por pagar ' + K.pesos(cu.cobroAbierto));
    var di = g.dinero || { porMes: [] };
    (di.porMes || []).forEach(function (m) { i('Girado por mes', mesT(m.mes), K.pesos(m.valor), m.pagos + ' pagos'); });
    i('Girado por mes', 'Total de la vigencia', K.pesos(di.total), di.pagos + ' pagos');
    Object.keys(g.usuarios || {}).forEach(function (a) { i('Usuarios activos', APP_T[a] || a, g.usuarios[a], ((g.telefonos || {})[a] || 0) + ' teléfonos con avisos'); });
    if (g.soporte) i('Soporte', 'Por atender', (g.soporte.pendientes || 0) + (g.soporte.enProceso || 0) + (g.soporte.reabiertos || 0), (g.soporte.reabiertos || 0) + ' reabiertos');
    if (g.atrasos) i('Soporte', 'Cuentas atrasadas', g.atrasos.total);
    ((g.servidor || {}).apps || []).forEach(function (x) { i('Servidor (7 días)', APP_T[x.app] || x.app, x.llamadas + ' llamadas', 'mediana ' + seg(x.mediana) + ' · p90 ' + seg(x.p90) + ' · ' + x.fallos + ' con error'); });
    Object.keys((g.errores || {}).porApp || {}).forEach(function (a) { i('Errores (7 días)', APP_T[a] || a, g.errores.porApp[a]); });
    (g.notificaciones || []).forEach(function (x) { i('Avisos (7 días)', x.canal === '-' ? 'Sin canal' : ESTADO_T(x.canal), x.total + ' enviados', x.ok + ' salieron'); });
    return out;
  }

  function exportarGeneral(que) {
    if (!DATA) return;
    var ex = K.piezas.exportar, l = indicadores();
    var cols = [{ campo: 'seccion', titulo: 'Sección' }, { campo: 'indicador', titulo: 'Indicador' }, { campo: 'valor', titulo: 'Valor' }, { campo: 'nota', titulo: 'Detalle' }];
    if (que === 'xlsx') { ex.aExcel('Tablero ecosistema', cols, l); return; }
    ex.aPDF('Tablero del ecosistema', [{ campo: 'valor', titulo: 'Valor' }, { campo: 'nota', titulo: 'Detalle', largo: true }], l, {
      subtitulo: 'Calculado el ' + String(DATA.hora || '').slice(0, 16),
      bloque: { titulo: function (f) { return f.indicador; }, sub: function (f) { return f.seccion; }, marca: function (f) { return f.valor; },
                tono: function (f) { return /Errores/.test(f.seccion) ? 'malo' : ''; } },
      grupo: function (f) { return f.seccion; },
      resumen: function () {
        var g = DATA.general || {};
        return [{ etiqueta: 'Contratos activos', valor: ((g.contratos || {}).porEstado || {}).ACTIVO || 0 },
                { etiqueta: 'Cuentas en curso', valor: (g.cuentas || {}).abiertas || 0 },
                { etiqueta: 'Girado', valor: millones((g.dinero || {}).total) }];
      }
    });
  }

  /* ══════════════ RENDIMIENTO ══════════════ */

  function vistaRendimiento() {
    var caja = K.nodo('<div class="kit-ancho vista ct tb"></div>');
    C.app.appendChild(caja);
    var cab = cabecera(caja, 'velocimetro', 'TABLERO DE RENDIMIENTO',
      'Cuánto se demora cada paso de una cuenta, en días hábiles (sin fines de semana ni festivos; el mismo día cuenta 0): por supervisión, por área y por persona.', pintar);
    var b = O.barra({ placeholder: 'Contratista, contrato, supervisor, secretaría o quien la tramitó', valor: F.busca,
      alBuscar: function (q) { F.busca = q; pintar(); }, alRefrescar: function () { return cargar(true).then(pintar); } });
    caja.appendChild(b.caja);
    var fechas = K.nodo('<div class="rp-fechas ad-fechas">' +
      '<label><span>Reportadas desde</span><input type="date" data-kit-fecha data-desde="2026" data-titulo="Desde"></label>' +
      '<label><span>Hasta</span><input type="date" data-kit-fecha data-desde="2026" data-titulo="Hasta"></label></div>');
    var iDe = fechas.querySelectorAll('input')[0], iHa = fechas.querySelectorAll('input')[1];
    iDe.value = F.desde; iHa.value = F.hasta;
    iDe.addEventListener('change', function () { F.desde = iDe.value; guardarFiltro(); pintar(); });
    iHa.addEventListener('change', function () { F.hasta = iHa.value; guardarFiltro(); pintar(); });
    caja.appendChild(fechas);
    if (K.piezas.fechas) setTimeout(function () { K.piezas.fechas.montar(fechas); }, 0);
    var zA = K.nodo('<div></div>');
    caja.appendChild(zA);
    var pA = K.piezas.pastillas.montar(zA, { etiqueta: 'Área', valor: F.area,
      opciones: AREAS.map(function (a) { return { valor: a.v, texto: a.t }; }),
      alCambiar: function (v) { F.area = v; guardarFiltro(); pintar(); } });
    var zona = K.nodo('<div class="tb-zona"></div>');
    caja.appendChild(zona);
    K.piezas.creditos.montar(caja);
    cab.pdf.addEventListener('click', function () { exportarRend('pdf'); });
    cab.xls.addEventListener('click', function () { exportarRend('xlsx'); });

    function pintar() {
      sellar(cab.sello);
      O.marcar(zA, F.area);
      zona.innerHTML = '';
      var L = filtradas();
      var cob = (DATA.rendimiento || {}).cobertura || {};
      zona.appendChild(K.nodo('<p class="ct-conteo"><b>' + K.numero(L.length) + '</b> cuentas reportadas' +
        ((F.desde || F.hasta) ? ' del ' + K.esc(O.fecha(F.desde) || 'inicio') + ' al ' + K.esc(O.fecha(F.hasta) || 'hoy') : ' en la vigencia') + '</p>'));
      if (!DATA._conTraza) zona.appendChild(K.nodo('<p class="ad-alerta ad-alerta--info tb-nota">' + K.icono('info', 16) +
        '<span>Con los datos de hoy (hojas viejas) la revisión de Supervisión y la de Contratación salen juntas: las hojas no guardan cuándo revisó el supervisor. ' +
        'Desde el paso a producción las apps nuevas anotan la hora de cada paso y el tablero las separa solo. ' +
        (cob.alReves ? K.numero(cob.alReves) + ' tramos de datos viejos tienen las fechas al revés y no se cuentan.' : '') + '</span></p>'));
      if (!L.length) { zona.appendChild(O.vacio('No hay cuentas con esos filtros.', function () { F = { area: '', desde: '', hasta: '', busca: '' }; b.inp.value = ''; iDe.value = ''; iHa.value = ''; guardarFiltro(); pintar(); })); return; }

      /* las tarjetas de cada tramo */
      var tv = tramosVisibles();
      var rej = K.nodo('<div class="kit-rejilla kit-rejilla--auto tb-tramos"></div>');
      var med = {};
      tv.forEach(function (t) {
        var s = stats(valores(L, t.k)); med[t.k] = s;
        var c = K.nodo('<article class="kit-tarjeta tb-tramo' + (t.k === 'dTot' ? ' tb-tramo--total' : '') + '"><h4></h4><small></small>' +
          '<p class="tb-tramo__v"></p><p class="tb-tramo__d"></p></article>');
        c.querySelector('h4').textContent = t.t;
        c.querySelector('small').textContent = t.sub;
        c.querySelector('.tb-tramo__v').innerHTML = '<b>' + K.esc(s.med === null ? '—' : String(s.med).replace('.', ',')) + '</b> ' + (s.med === 1 ? 'día hábil' : 'días hábiles');
        c.querySelector('.tb-tramo__d').textContent = s.n ? 'Mediana de ' + K.numero(s.n) + ' · promedio ' + dias(s.prom) + ' · 9 de 10 en ' + dias(s.p90) + ' o menos · el más largo ' + dias(s.max) : 'Sin datos en este rango';
        c.title = t.desc;
        rej.appendChild(c);
      });
      zona.appendChild(rej);

      /* comparación de tramos */
      var bC = bloque(zona, 'Dónde se va el tiempo', 'velocimetro', 'Promedio de días hábiles por paso (la barra más larga es el paso más lento). La mediana es casi siempre 1 día; el promedio deja ver dónde se acumulan las demoras.');
      bC.appendChild(barras(tv.filter(function (t) { return t.k !== 'dTot'; }).map(function (t) { return { t: t.t, v: med[t.k].prom || 0, alerta: (med[t.k].prom || 0) >= 2 }; }), { fmt: dias }));

      /* por supervisión */
      if (!F.area || F.area === 'SUPERVISION') {
        var bS = bloque(zona, 'Por supervisión', 'persona', 'El supervisor del contrato. Revisión = de reporte a aprobada (Supervisión + Contratación); cierre = aceptar el plan y firmar el informe.');
        var gs = {};
        L.forEach(function (o) { var k = o.sup || 'Sin supervisor'; (gs[k] = gs[k] || []).push(o); });
        var filasS = Object.keys(gs).map(function (k) {
          var l = gs[k];
          return { sup: k, n: l.length, rev: mediana(valores(l, DATA._conTraza ? 'dSup' : 'dRev')), cie: mediana(valores(l, 'dCie')), tot: mediana(valores(l, 'dTot')),
                   dev: l.reduce(function (s, o) { return s + (o.devSup || 0) + (o.devCon || 0); }, 0) };
        }).sort(function (a, b) { return ((b.rev || 0) + (b.cie || 0)) - ((a.rev || 0) + (a.cie || 0)); });
        bS.appendChild(barras(filasS.map(function (x) { return { t: O.nombre(x.sup), v: (x.rev || 0) + (x.cie || 0), sub: x.n + ' cuentas' }; }), { fmt: dias }));
        bS.appendChild(tabla(['Supervisor', 'Cuentas', DATA._conTraza ? 'Revisa' : 'Revisión', 'Cierre', 'Total', 'Devoluciones'], filasS.map(function (x) {
          return [O.nombre(x.sup), K.numero(x.n), dias(x.rev), dias(x.cie), dias(x.tot), K.numero(x.dev)];
        })));
      }

      /* por persona de cada área */
      tv.filter(function (t) { return t.quien && t.k !== 'dTot'; }).forEach(function (t) {
        var pp = porPersona(L, t);
        if (!pp.length) return;
        var bP = bloque(zona, t.t + ' · por persona', 'persona', t.desc + '. Quien hizo el paso' + (t.k === 'dRev' ? ' (la aprobación de Contratación)' : '') + '.');
        bP.appendChild(barras(pp.slice(0, 12).map(function (x) { return { t: O.nombre(x.quien), v: x.med || 0, sub: x.n + ' cuentas' }; }), { fmt: dias }));
        bP.appendChild(tabla(['Persona', 'Cuentas', 'Mediana', 'Promedio', '9 de 10', 'Máximo'], pp.map(function (x) {
          return [O.nombre(x.quien), K.numero(x.n), dias(x.med), dias(x.prom), dias(x.p90), dias(x.max)];
        })));
      });

      /* las más lentas */
      var lentas = L.filter(function (o) { return o.dTot !== null && o.dTot !== undefined; }).sort(function (a, b) { return b.dTot - a.dTot; }).slice(0, 10);
      if (lentas.length) {
        var bL = bloque(zona, 'Las cuentas que más se demoraron', 'reloj', 'De punta a punta (reporte → pago).');
        lentas.forEach(function (o) {
          var r = K.nodo('<div class="tb-lenta"><div><b></b><small></small></div><span class="kit-pastilla tb-lenta__d"></span></div>');
          r.querySelector('b').textContent = O.nombre(o.nombre);
          r.querySelector('small').textContent = 'Contrato ' + o.contrato + ' · cuenta ' + o.informe + ' · ' + O.nombre(o.sup) + ' · revisión ' + dias(o.dRev) + ', cierre ' + dias(o.dCie) + ', contabilidad ' + dias(o.dCtb) + ', egreso ' + dias(o.dEgr) + ', pago ' + dias(o.dPag);
          r.querySelector('.tb-lenta__d').textContent = dias(o.dTot);
          bL.appendChild(r);
        });
      }
    }

    K.piezas.esqueletos.mientras(zona, cargar(false), { forma: 'tarjetas', cuantos: 3, espera: 'Calculando los tiempos' })
      .then(pintar)['catch'](function (e) { zona.appendChild(C.errorCaja(e)); });
    vistaRendimiento._repintar = pintar;
  }

  /** PDF: un bloque por área y persona. Excel: una fila por cuenta. */
  function exportarRend(que) {
    if (!DATA) return;
    var L = filtradas(), ex = K.piezas.exportar;
    if (!L.length) { K.aviso('No hay cuentas con esos filtros.', 'aviso', 3000); return; }
    var rango = (F.desde || F.hasta) ? 'Reportadas del ' + (O.fecha(F.desde) || 'inicio') + ' al ' + (O.fecha(F.hasta) || 'hoy') : 'Toda la vigencia';
    if (que === 'xlsx') {
      ex.aExcel('Rendimiento de cuentas', [
        { campo: 'id', titulo: 'ID contrato' }, { campo: 'nombre', titulo: 'Contratista' }, { campo: 'contrato', titulo: 'Contrato' }, { campo: 'informe', titulo: 'Cuenta' },
        { campo: 'sec', titulo: 'Secretaría' }, { campo: 'sup', titulo: 'Supervisor' }, { campo: 'estado', titulo: 'Estado' }, { campo: 'fuente', titulo: 'Fuente (H hojas / T traza)' },
        { campo: 'R', titulo: 'Reportada' }, { campo: 'RS', titulo: 'Revisada por supervisor' }, { campo: 'qRS', titulo: 'Revisó (supervisión)' },
        { campo: 'A', titulo: 'Aprobada (Contratación)' }, { campo: 'qA', titulo: 'Aprobó' }, { campo: 'devSup', titulo: 'Devoluciones supervisión' }, { campo: 'devCon', titulo: 'Devoluciones Contratación' },
        { campo: 'S', titulo: 'Cierre del supervisor' }, { campo: 'qS', titulo: 'Firmó' }, { campo: 'O', titulo: 'Orden de pago' }, { campo: 'qO', titulo: 'Contabilidad' },
        { campo: 'E', titulo: 'Egreso' }, { campo: 'qE', titulo: 'Tesorería (egreso)' }, { campo: 'P', titulo: 'Pago' }, { campo: 'qP', titulo: 'Tesorería (pago)' },
        { campo: 'dRev', titulo: 'Días revisión' }, { campo: 'dSup', titulo: 'Días supervisión revisa' }, { campo: 'dCon', titulo: 'Días Contratación revisa' },
        { campo: 'dCie', titulo: 'Días cierre supervisor' }, { campo: 'dCtb', titulo: 'Días Contabilidad' }, { campo: 'dEgr', titulo: 'Días egreso' }, { campo: 'dPag', titulo: 'Días pago' }, { campo: 'dTot', titulo: 'Días total' }
      ], L);
      return;
    }
    var bloques = [];
    tramosVisibles().forEach(function (t) {
      var s = stats(valores(L, t.k));
      bloques.push({ area: 'Resumen por paso', quien: t.t, detalle: t.desc, n: s.n, med: dias(s.med), prom: dias(s.prom), p90: dias(s.p90), max: dias(s.max), _m: s.med });
      if (t.quien && t.k !== 'dTot') porPersona(L, t).forEach(function (x) {
        bloques.push({ area: t.t, quien: O.nombre(x.quien), detalle: t.desc, n: x.n, med: dias(x.med), prom: dias(x.prom), p90: dias(x.p90), max: dias(x.max), _m: x.med });
      });
    });
    if (!F.area || F.area === 'SUPERVISION') {
      var gs = {};
      L.forEach(function (o) { (gs[o.sup || 'Sin supervisor'] = gs[o.sup || 'Sin supervisor'] || []).push(o); });
      Object.keys(gs).forEach(function (k) {
        var l = gs[k], s = stats(valores(l, 'dTot'));
        bloques.push({ area: 'Por supervisión', quien: O.nombre(k), detalle: 'Revisión ' + dias(mediana(valores(l, 'dRev'))) + ' · cierre ' + dias(mediana(valores(l, 'dCie'))) + ' · total (mediana)',
          n: l.length, med: dias(s.med), prom: dias(s.prom), p90: dias(s.p90), max: dias(s.max), _m: s.med });
      });
    }
    var todas = valores(L, 'dTot');
    ex.aPDF('Rendimiento de las cuentas', [
      { campo: 'n', titulo: 'Cuentas' }, { campo: 'med', titulo: 'Mediana' }, { campo: 'prom', titulo: 'Promedio' },
      { campo: 'p90', titulo: '9 de cada 10' }, { campo: 'max', titulo: 'Máximo' }, { campo: 'detalle', titulo: 'Qué mide', largo: true }
    ], bloques, {
      subtitulo: rango + ' · ' + L.length + ' cuentas · días hábiles',
      bloque: { titulo: function (f) { return f.quien; }, sub: function (f) { return f.area; }, marca: function (f) { return f.med; },
                tono: function (f) { return f._m === null ? '' : (f._m >= 5 ? 'malo' : (f._m >= 3 ? 'aviso' : 'ok')); } },
      grupo: function (f) { return f.area; },
      resumen: function () { return [{ etiqueta: 'Cuentas', valor: L.length }, { etiqueta: 'Total (mediana)', valor: dias(mediana(todas)) }, { etiqueta: '9 de 10 en', valor: dias(p90(todas)) }]; }
    });
  }

  window.TABLERO = {
    configurar: function (c) { C = c || {}; },
    tablero: vistaTablero,
    rendimiento: vistaRendimiento,
    cargar: cargar,
    olvidar: function () { DATA = null; K.guardar.borrar(FK); F = leerFiltro(); },
    _datos: function () { return DATA; },
    _filtradas: filtradas,
    _stats: stats,
    _porPersona: porPersona,
    _tramos: function () { return DATA ? tramosVisibles() : []; },
    _indicadores: indicadores,
    TRAMOS: TRAMOS
  };
}());
