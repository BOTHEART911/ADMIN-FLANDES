/* ============================================================
   ADMIN-FLANDES · SOPORTES
   Ecosistema Flandes · Fase 10 · entrega 10.4

   Todas las solicitudes de soporte de las siete apps (hoja SOPORTE):
     · Se RESPONDEN (EN PROCESO o RESUELTO). Al quedar RESUELTO, a la
       persona le llega el aviso y la próxima vez que abra su app le
       salen las ESTRELLAS. Con 1 o 2 el caso vuelve aquí como REABIERTO.
     · Se CARGA un soporte a nombre de un contratista o de un usuario de
       cualquier app (lo que se atendió por teléfono o en persona).
     · Se descargan en PDF (informe por bloques, agrupado por app) y en
       Excel (una fila por caso).
   Los documentos rehechos de una cuenta (ficha del contratista) también
   quedan aquí como soporte hecho.

   UN SOLO LLAMADO: la vista entera llega con 'soportes' (lista, cifras,
   personas a quien cargar). Cada botón es una llamada y devuelve el caso
   al día; aquí se funde sin volver a pedir la lista.
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var C = {};
  var D = null;                 /* lo que trajo 'soportes' */
  var F = { estado: '', app: '', buscar: '', desde: '', hasta: '' };
  var ENVIO_FOTOS = 3;

  var TONO = { PENDIENTE: 'aviso', 'EN PROCESO': 'info', RESUELTO: 'ok', REABIERTO: 'malo', CERRADO: '' };
  var APP_T = { CONTRATISTA: 'Contratista', CONTRATACION: 'Contratación', SUPERVISION: 'Supervisión', CONTABILIDAD: 'Contabilidad',
                TESORERIA: 'Tesorería', COMUNICACIONES: 'Comunicaciones', ADMIN: 'Admin' };
  var ETIQ = ['', 'Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'];

  function O() { return window.OFICINA; }
  function nombre(s) { return O() ? O().nombre(s) : String(s || ''); }
  function lista() { return (D && D.lista) || []; }
  /** 'dd/mm/aaaa ...' -> 'aaaa-mm-dd' */
  function iso(f) { var m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(f || '')); return m ? m[3] + '-' + m[2] + '-' + m[1] : ''; }
  function diasDesde(f) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(f || ''));
    if (!m) return -1;
    var d = new Date(+m[3], +m[2] - 1, +m[1]), hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return Math.round((hoy - d) / 864e5);
  }
  function estrellas(n, tam) {
    var h = '';
    for (var i = 1; i <= 5; i++) h += '<span class="kit-est__v' + (i <= n ? ' kit-est__v--on' : '') + '">' + K.icono('estrella', tam || 14) + '</span>';
    return '<span class="kit-est__ver" aria-label="' + n + ' de 5 estrellas">' + h + '</span>';
  }
  function mal(e) { K.aviso((e && e.message) || 'No se pudo guardar.', 'malo', 9000); }

  /* ══════════════ cifras (en el teléfono: la lista ya está aquí) ══════════════ */

  function cifras(l) {
    var c = { total: l.length, PENDIENTE: 0, 'EN PROCESO': 0, RESUELTO: 0, REABIERTO: 0, CERRADO: 0, calificados: 0, suma: 0, sinCalificar: 0 };
    l.forEach(function (x) {
      c[x.estado] = (c[x.estado] || 0) + 1;
      if (x.estrellas) { c.calificados++; c.suma += x.estrellas; }
      if (x.estado === 'RESUELTO' && !x.estrellas) c.sinCalificar++;
    });
    c.promedio = c.calificados ? Math.round(c.suma / c.calificados * 10) / 10 : 0;
    return c;
  }
  function resumenInicio(c) {
    return { pendientes: c.PENDIENTE, enProceso: c['EN PROCESO'], reabiertos: c.REABIERTO, sinCalificar: c.sinCalificar,
             cerrados: c.CERRADO, promedio: c.promedio, calificados: c.calificados, total: c.total };
  }

  function filtradas() {
    var q = K.norm(F.buscar);
    return lista().filter(function (x) {
      if (F.estado === 'REALIZADOS') { if (x.estado !== 'RESUELTO' && x.estado !== 'CERRADO') return false; }
      else if (F.estado === 'ABIERTOS') { if (x.estado !== 'PENDIENTE' && x.estado !== 'EN PROCESO' && x.estado !== 'REABIERTO') return false; }
      else if (F.estado && x.estado !== F.estado) return false;
      if (F.app && x.app !== F.app) return false;
      var d = iso(x.fecha);
      if (F.desde && (!d || d < F.desde)) return false;
      if (F.hasta && (!d || d > F.hasta)) return false;
      if (q && K.norm([x.id, x.emisor, x.documento, x.idContrato, x.solicitud, x.respuesta, x.comentario, x.rol, x.tipo].join(' ')).indexOf(q) < 0) return false;
      return true;
    });
  }

  /** Un caso que cambió (o uno nuevo): se funde en la lista y en el resumen del inicio. */
  function fundir(x) {
    if (!x || !D) return;
    var l = D.lista, i;
    for (i = 0; i < l.length; i++) if (l[i].id === x.id) { l[i] = x; break; }
    if (i === l.length) l.unshift(x);
    D.cifras = cifras(l);
  }
  function alInicio(r) {
    if (r && r.resumen && C.soporte) C.soporte(r.resumen);
    else if (D && C.soporte) C.soporte(resumenInicio(D.cifras));
  }

  function traer() {
    return O().leer('soportes').then(function (d) { D = d; D.cifras = cifras(D.lista || []); alInicio(null); return d; });
  }

  /* ══════════════ la vista ══════════════ */

  var zonaLista = null, zonaCifras = null, total = null, pE = null, pA = null;

  function vista(sub) {
    var caja = K.nodo('<div class="kit-ancho vista ct ad so"></div>');
    C.app.appendChild(caja);
    O().cabecera(caja, 'salvavidas', 'SOPORTES',
      'Todas las solicitudes de las siete apps. Respóndelas: al quedar <b>resueltas</b>, a la persona le llega el aviso y la próxima vez que entre a su app las califica con estrellas. Con 1 o 2 estrellas vuelven aquí como <b>reabiertas</b>.');

    var b = O().barra({ placeholder: 'Buscar por persona, documento, número o texto', valor: F.buscar,
      alBuscar: function (t) { F.buscar = t; pintar(); },
      alRefrescar: function () { return traer().then(function () { pastillas(); pintar(); }); } });
    caja.appendChild(b.caja);

    zonaCifras = K.nodo('<div class="kit-tarjeta so-cifras"></div>');
    caja.appendChild(zonaCifras);

    var acc = K.nodo('<div class="ct-acc so-acc"></div>');
    var bNuevo = K.nodo('<button type="button" class="kit-btn kit-btn--marca">' + K.icono('mas', 16) + ' Cargar un soporte</button>');
    var bPdf = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('pdf', 16) + ' PDF</button>');
    var bXls = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('hoja', 16) + ' Excel</button>');
    acc.appendChild(bNuevo); acc.appendChild(bPdf); acc.appendChild(bXls);
    caja.appendChild(acc);

    var fechas = K.nodo('<div class="rp-fechas ad-fechas">' +
      '<label><span>Desde</span><input type="date" data-kit-fecha data-desde="2025" data-titulo="Desde"></label>' +
      '<label><span>Hasta</span><input type="date" data-kit-fecha data-desde="2025" data-titulo="Hasta"></label></div>');
    var iDe = fechas.querySelectorAll('input')[0], iHa = fechas.querySelectorAll('input')[1];
    iDe.value = F.desde; iHa.value = F.hasta;
    iDe.addEventListener('change', function () { F.desde = iDe.value; pintar(); });
    iHa.addEventListener('change', function () { F.hasta = iHa.value; pintar(); });
    caja.appendChild(fechas);
    if (K.piezas.fechas) setTimeout(function () { K.piezas.fechas.montar(fechas); }, 0);

    var zE = K.nodo('<div class="ad-pastillas"></div>'), zA = K.nodo('<div class="ad-pastillas"></div>');
    caja.appendChild(zE); caja.appendChild(zA);
    total = K.nodo('<p class="formulario__nota ad-total"></p>');
    caja.appendChild(total);
    zonaLista = K.nodo('<div class="so-lista"></div>');
    caja.appendChild(zonaLista);
    K.piezas.creditos.montar(caja);

    bNuevo.addEventListener('click', function () { cargar(); });
    bPdf.addEventListener('click', function () { exportar('pdf'); });
    bXls.addEventListener('click', function () { exportar('xlsx'); });

    function pastillas() {
      zE.innerHTML = ''; zA.innerHTML = '';
      pE = K.piezas.pastillas.montar(zE, { etiqueta: 'Estado', valor: F.estado, alCambiar: function (v) { F.estado = v; pintar(); }, opciones: [
        { valor: '', texto: 'Todos' }, { valor: 'ABIERTOS', texto: 'Por atender', tono: 'aviso' }, { valor: 'PENDIENTE', texto: 'Pendientes' },
        { valor: 'EN PROCESO', texto: 'En proceso' }, { valor: 'REABIERTO', texto: 'Reabiertos', tono: 'malo' },
        { valor: 'RESUELTO', texto: 'Por calificar' }, { valor: 'CERRADO', texto: 'Cerrados', tono: 'ok' }, { valor: 'REALIZADOS', texto: 'Realizados' }] });
      var apps = {};
      lista().forEach(function (x) { apps[x.app] = 1; });
      pA = K.piezas.pastillas.montar(zA, { etiqueta: 'App', valor: F.app, alCambiar: function (v) { F.app = v; pintar(); },
        opciones: [{ valor: '', texto: 'Todas las apps' }].concat(Object.keys(apps).sort().map(function (a) { return { valor: a, texto: APP_T[a] || a }; })) });
    }

    function empezar() {
      pastillas();
      pintar();
      if (sub === 'nuevo') cargar();
    }
    if (D) empezar();
    else {
      K.piezas.esqueletos.mientras(zonaLista, traer(), { forma: 'ficha', cuantos: 3, espera: 'Trayendo los soportes' })
        .then(empezar, function (e) { zonaLista.innerHTML = ''; zonaLista.appendChild(C.errorCaja(e, function () { C.irA('soportes'); vista(sub); })); });
    }
    vista._repintar = function () { if (document.body.contains(zonaLista)) { pastillas(); pintar(); } };
  }

  function pintarCifras() {
    var c = (D && D.cifras) || cifras([]);
    zonaCifras.innerHTML = '';
    var r = K.nodo('<div class="ct-cifras so-cifras__r"></div>');
    [[c.PENDIENTE, 'Pendientes', 'PENDIENTE'], [c['EN PROCESO'], 'En proceso', 'EN PROCESO'], [c.REABIERTO, 'Reabiertos', 'REABIERTO'],
     [c.sinCalificar, 'Por calificar', 'RESUELTO'], [c.CERRADO, 'Cerrados', 'CERRADO']].forEach(function (x) {
      var b = K.nodo('<button type="button" class="ct-cifra' + (x[2] === 'REABIERTO' && x[0] ? ' so-cifra--malo' : '') + '"><b>' + K.numero(x[0] || 0) + '</b><span>' + K.esc(x[1]) + '</span></button>');
      b.addEventListener('click', function () { K.vibrar(6); if (pE) pE.poner(x[2]); else { F.estado = x[2]; pintar(); } });
      r.appendChild(b);
    });
    zonaCifras.appendChild(r);
    var p = K.nodo('<p class="so-prom"></p>');
    if (c.calificados) p.innerHTML = estrellas(Math.round(c.promedio), 18) + ' <b>' + String(c.promedio).replace('.', ',') + '</b> de 5 · ' + c.calificados + (c.calificados === 1 ? ' calificación' : ' calificaciones');
    else p.textContent = 'Todavía nadie ha calificado un soporte.';
    zonaCifras.appendChild(p);
  }

  function pintar() {
    if (!zonaLista || !D) return;
    pintarCifras();
    var mE = { '': 0, ABIERTOS: 0, REALIZADOS: 0 }, mA = { '': 0 };
    lista().forEach(function (x) {
      mE['']++; mE[x.estado] = (mE[x.estado] || 0) + 1;
      if (x.estado === 'PENDIENTE' || x.estado === 'EN PROCESO' || x.estado === 'REABIERTO') mE.ABIERTOS++;
      if (x.estado === 'RESUELTO' || x.estado === 'CERRADO') mE.REALIZADOS++;
      mA['']++; mA[x.app] = (mA[x.app] || 0) + 1;
    });
    if (pE) pE.conteos(mE);
    if (pA) pA.conteos(mA);
    var l = filtradas();
    total.textContent = K.numero(l.length) + (l.length === 1 ? ' soporte' : ' soportes') + ' con estos filtros · ' + K.numero(lista().length) + ' en total.';
    zonaLista.innerHTML = '';
    if (!l.length) {
      zonaLista.appendChild(O().vacio(lista().length ? 'Ningún soporte con esos filtros.' : 'Todavía no hay soportes. Aparecen apenas alguien cuente un problema desde su app, o cuando cargues uno.',
        lista().length ? function () { F = { estado: '', app: '', buscar: '', desde: '', hasta: '' }; C.irA('soportes'); } : null));
      return;
    }
    l.slice(0, 200).forEach(function (x) { zonaLista.appendChild(tarjeta(x)); });
    if (l.length > 200) zonaLista.appendChild(K.nodo('<p class="formulario__nota">Se muestran los 200 más recientes. Filtra o descarga el Excel para ver todos.</p>'));
  }

  function tarjeta(x) {
    var t = K.nodo('<article class="kit-tarjeta so-c so-c--' + (TONO[x.estado] || 'nada') + '">' +
      '<div class="ad-bf__cab"><span class="so-c__cara"></span><div class="ad-bf__t"><b></b><small></small></div><span class="ct-marca so-est"></span></div>' +
      '<p class="so-c__meta"></p><p class="so-c__sol"></p></article>');
    if (K.piezas.personas) t.querySelector('.so-c__cara').appendChild(K.piezas.personas.avatar(x.emisor || 'SIN NOMBRE', { tam: 40 }));
    t.querySelector('.ad-bf__t b').textContent = nombre(x.emisor || 'Sin nombre');
    t.querySelector('.ad-bf__t small').textContent = [APP_T[x.app] || x.app, x.rol && x.rol !== x.app ? x.rol : '', x.idContrato || x.documento].filter(Boolean).join(' · ');
    var est = t.querySelector('.so-est');
    est.textContent = x.estado === 'RESUELTO' ? 'RESUELTO · por calificar' : x.estado;
    est.classList.add('so-est--' + (TONO[x.estado] || 'nada'));
    var dias = diasDesde(x.fecha);
    var meta = [x.id, x.fecha ? (O().cuando(iso(x.fecha)) || x.fecha.slice(0, 10)) + ' ' + String(x.fecha).slice(11, 16) : 'sin fecha (app anterior)',
                x.tipo && x.tipo !== 'SOLICITUD' ? x.tipo.toLowerCase() : '', x.vista ? 'vista: ' + x.vista : ''];
    t.querySelector('.so-c__meta').textContent = meta.filter(Boolean).join(' · ');
    if (x.reabierto) t.querySelector('.so-c__meta').appendChild(K.nodo('<em class="so-re">' + K.icono('recargar', 12) + ' reabierto ' + x.reabierto + (x.reabierto === 1 ? ' vez' : ' veces') + '</em>'));
    if ((x.estado === 'PENDIENTE' || x.estado === 'REABIERTO') && dias >= 2) t.querySelector('.so-c__meta').appendChild(K.nodo('<em class="so-dias">' + dias + ' días esperando</em>'));
    t.querySelector('.so-c__sol').innerHTML = O().conEnlaces(x.solicitud);

    if (x.fotos && x.fotos.length) {
      var zf = K.nodo('<div class="so-fotos"></div>');
      x.fotos.forEach(function (u, i) {
        var bf = K.nodo('<button type="button" class="so-foto" aria-label="Ver la captura ' + (i + 1) + '"><img alt="" loading="lazy"></button>');
        bf.querySelector('img').src = K.miniDrive ? K.miniDrive(u, 240) : u;
        bf.addEventListener('click', function () {
          if (!K.piezas.carrusel) { window.open(u, '_blank', 'noopener'); return; }
          K.piezas.carrusel.abrir(x.fotos.map(function (v, j) { return { url: K.miniDrive ? K.miniDrive(v, 1600) : v, titulo: x.id + ' · captura ' + (j + 1) }; }), { indice: i });
        });
        zf.appendChild(bf);
      });
      t.appendChild(zf);
    }

    if (x.respuesta) {
      var r = K.nodo('<div class="so-resp"><p class="ad-ctr__et">Respuesta</p><p class="so-resp__t"></p><small></small></div>');
      r.querySelector('.so-resp__t').innerHTML = O().conEnlaces(x.respuesta);
      r.querySelector('small').textContent = [x.respondidoPor ? nombre(x.respondidoPor) : '', x.fechaRespuesta].filter(Boolean).join(' · ');
      t.appendChild(r);
    }
    if (x.estrellas) {
      var q = K.nodo('<p class="so-cal"></p>');
      q.innerHTML = estrellas(x.estrellas, 16) + ' <b>' + ETIQ[x.estrellas] + '</b>';
      if (x.comentario) q.appendChild(document.createTextNode(' · “' + x.comentario + '”'));
      t.appendChild(q);
    }
    if (x.historial && x.historial.length) {
      var det = K.nodo('<details class="ad-bf__det"><summary>' + K.icono('abajo', 12) + ' Historial (' + x.historial.length + ')</summary><div class="ad-traza"></div></details>');
      x.historial.forEach(function (h) {
        var p = K.nodo('<p></p>');
        p.textContent = [h.fecha, h.evento, nombre(h.quien), h.detalle].filter(Boolean).join(' · ');
        det.querySelector('.ad-traza').appendChild(p);
      });
      t.appendChild(det);
    }

    var acc = K.nodo('<div class="ct-acc so-c__acc"></div>');
    if (x.estado !== 'CERRADO') {
      var bR = K.nodo('<button type="button" class="kit-btn kit-btn--plano ad-mini">' + K.icono('responder', 14) + (x.respuesta ? ' Responder de nuevo' : ' Responder') + '</button>');
      bR.addEventListener('click', function () { responder(x); });
      acc.appendChild(bR);
    }
    if (x.contacto) {
      var tel = x.contacto.length === 10 ? '57' + x.contacto : x.contacto;
      var a = K.nodo('<a class="kit-btn kit-btn--plano ad-mini" target="_blank" rel="noopener">' + K.icono('whatsapp', 14) + ' Escribirle</a>');
      a.href = 'https://wa.me/' + tel + '?text=' + encodeURIComponent('Hola ' + nombre(String(x.emisor || '').split(' ')[0]) + ', te escribo por tu solicitud de soporte ' + x.id + '.');
      acc.appendChild(a);
    }
    if (acc.children.length) t.appendChild(acc);
    return t;
  }

  /* ══════════════ responder ══════════════ */

  function responder(x) {
    var elegido = x.estado === 'EN PROCESO' ? 'RESUELTO' : (x.respuesta ? 'RESUELTO' : 'RESUELTO');
    var f = K.nodo('<div class="formulario ad-form so-form">' +
      '<div class="so-form__sol"><p class="ad-ctr__et">' + K.esc(x.id) + ' · ' + K.esc(nombre(x.emisor)) + '</p><p class="so-form__txt"></p></div>' +
      '<div class="cf-chips so-estados"></div>' +
      '<label class="campo"><span>Qué se hizo (es lo que la persona lee y califica)</span><textarea rows="5" maxlength="3000"></textarea></label>' +
      '<label class="op-check cf-sw"><input type="checkbox" checked><span>Avisarle y pedirle que califique (push y WhatsApp)</span></label>' +
      '<p class="formulario__nota so-form__nota"></p></div>');
    f.querySelector('.so-form__txt').textContent = x.solicitud;
    var txt = f.querySelector('textarea');
    txt.value = x.estado === 'REABIERTO' ? '' : (x.respuesta || '');
    if (x.estado === 'REABIERTO') txt.placeholder = 'Lo reabrió con ' + x.estrellas + (x.estrellas === 1 ? ' estrella' : ' estrellas') + (x.comentario ? ': “' + x.comentario + '”' : '');
    var chk = f.querySelector('input[type=checkbox]');
    var nota = f.querySelector('.so-form__nota');
    var z = f.querySelector('.so-estados');
    [['EN PROCESO', 'La estoy atendiendo'], ['RESUELTO', 'Quedó resuelto']].forEach(function (e) {
      var b = K.nodo('<button type="button" class="kit-pastilla" aria-pressed="' + (e[0] === elegido) + '"></button>');
      b.textContent = e[1];
      b.addEventListener('click', function () { elegido = e[0]; z.querySelectorAll('.kit-pastilla').forEach(function (y) { y.setAttribute('aria-pressed', String(y === b)); }); pintarNota(); });
      z.appendChild(b);
    });
    function pintarNota() {
      chk.parentNode.hidden = elegido !== 'RESUELTO' || !x.documento;
      nota.textContent = !x.documento
        ? 'Este caso no tiene documento (viene de la app anterior y no se encontró a quién es): se guarda la respuesta, pero no se le puede pedir que califique.'
        : (elegido === 'RESUELTO' ? 'Al guardar, le sale la calificación con estrellas la próxima vez que abra ' + (APP_T[x.app] || 'su app') + '.' : 'Queda EN PROCESO: la persona lo ve así en Mis solicitudes.');
    }
    pintarNota();
    var m = O().modal({ titulo: x.estado === 'REABIERTO' ? 'Responder el caso reabierto' : 'Responder el soporte', cuerpo: f, ancha: true,
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } }, { texto: 'Guardar', icono: 'check', marca: true, al: function () {
        var t = txt.value.trim();
        if (elegido === 'RESUELTO' && t.length < 5) { txt.focus(); K.aviso('Escribe qué se hizo: es lo que la persona va a calificar.', 'aviso', 5000); return; }
        m.botones[1].disabled = true;
        K.ocupado = true;
        K.piezas.guardado.mientras(K.pedir('soporteResponder', { id: x.id, estado: elegido, respuesta: t, avisar: chk.checked }, { ms: 60000 }), {
          titulo: 'Guardando la respuesta', sub: x.id + ' · ' + nombre(x.emisor), pasos: ['Escribiendo en SOPORTE', elegido === 'RESUELTO' && chk.checked ? 'Avisando para que califique' : 'Sin avisos', 'Apuntando en la bitácora'],
          listo: { titulo: elegido === 'RESUELTO' ? 'Resuelto' : 'En proceso', paso: x.id }
        }).then(function (r) {
          K.ocupado = false;
          fundir(r.soporte); alInicio(r);
          if (C.bitacora) C.bitacora(r.bitacora);
          m.cerrar();
          pintar();
          if (r.aviso && !r.aviso.ok && !r.aviso.prueba) K.aviso('Quedó guardado, pero el aviso no salió: ' + (r.aviso.error || 'sin canal') + '.', 'aviso', 8000);
        }, function (e) { K.ocupado = false; m.botones[1].disabled = false; mal(e); });
      } }] });
    setTimeout(function () { txt.focus(); }, 120);
  }

  /* ══════════════ cargar un soporte a nombre de alguien ══════════════ */

  function personas() {
    var p = (D && D.personas) || {};
    var out = [];
    var c = p.contratistas || { filas: [] }, u = p.usuarios || { filas: [] };
    c.filas.forEach(function (f) { out.push({ tipo: 'CONTRATISTA', id: f[0], doc: f[1], nombre: f[2], estado: f[3], det: 'Contrato ' + f[5] + ' · ' + (f[4] || '') + (f[3] && f[3] !== 'ACTIVO' ? ' · ' + f[3] : '') }); });
    u.filas.forEach(function (f) { out.push({ tipo: 'USUARIO', doc: f[0], nombre: f[1], app: f[2], det: (APP_T[f[2]] || f[2]) + ' · ' + f[3] }); });
    return out;
  }

  function cargar() {
    if (!D) return;
    var para = null, estado = 'RESUELTO', adj = null;
    var f = K.nodo('<div class="formulario ad-form so-form">' +
      '<div class="campo so-quien"><span>Para quién</span><div class="cf-chips so-tipo"></div>' +
      '<label class="ins-buscar so-bus">' + K.icono('buscar', 18) + '<input type="search" autocomplete="off" placeholder="Nombre, documento o contrato"></label>' +
      '<div class="so-res" role="listbox"></div><div class="so-elegido" hidden></div></div>' +
      '<label class="campo"><span>Qué pidió o qué le pasaba</span><textarea class="so-sol" rows="3" maxlength="3000" placeholder="Ej: no le abría el Drive de la cuenta 5"></textarea></label>' +
      '<div class="cf-chips so-estados"></div>' +
      '<label class="campo so-campo-resp"><span>Qué se hizo</span><textarea class="so-resp-in" rows="3" maxlength="3000" placeholder="Ej: se le compartió la carpeta a su correo nuevo"></textarea></label>' +
      '<div class="campo"><span>Capturas (opcional, hasta 3)</span><div class="so-zona"></div></div>' +
      '<label class="op-check cf-sw so-avisar"><input type="checkbox" checked><span>Avisarle y pedirle que califique</span></label>' +
      '</div>');
    var tipo = 'CONTRATISTA';
    var zt = f.querySelector('.so-tipo'), inp = f.querySelector('.so-bus input'), res = f.querySelector('.so-res'), eleg = f.querySelector('.so-elegido');
    [['CONTRATISTA', 'Un contratista'], ['USUARIO', 'Un usuario de una app']].forEach(function (x) {
      var b = K.nodo('<button type="button" class="kit-pastilla" aria-pressed="' + (x[0] === tipo) + '"></button>');
      b.textContent = x[1];
      b.addEventListener('click', function () { tipo = x[0]; zt.querySelectorAll('.kit-pastilla').forEach(function (y) { y.setAttribute('aria-pressed', String(y === b)); }); quitar(); buscar(); });
      zt.appendChild(b);
    });
    var todos = personas();
    function buscar() {
      res.innerHTML = '';
      var q = K.norm(inp.value);
      if (q.length < 2) { res.appendChild(K.nodo('<p class="formulario__nota">Escribe al menos dos letras o números.</p>')); return; }
      var l = todos.filter(function (p) { return p.tipo === tipo && K.norm([p.nombre, p.doc, p.id, p.det].join(' ')).indexOf(q) >= 0; });
      /* los activos primero */
      l.sort(function (a, b) { return (a.estado === 'ACTIVO' ? 0 : 1) - (b.estado === 'ACTIVO' ? 0 : 1); });
      if (!l.length) { res.appendChild(K.nodo('<p class="formulario__nota">Nadie con eso.</p>')); return; }
      l.slice(0, 8).forEach(function (p) {
        var b = K.nodo('<button type="button" class="so-per" role="option"><b></b><small></small></button>');
        b.querySelector('b').textContent = nombre(p.nombre);
        b.querySelector('small').textContent = p.doc + ' · ' + p.det;
        b.addEventListener('click', function () { elegir(p); });
        res.appendChild(b);
      });
      if (l.length > 8) res.appendChild(K.nodo('<p class="formulario__nota">… y ' + (l.length - 8) + ' más: escribe un poco más.</p>'));
    }
    function elegir(p) {
      para = p;
      res.innerHTML = ''; inp.parentNode.hidden = true;
      eleg.hidden = false; eleg.innerHTML = '';
      var c = K.nodo('<div class="so-per so-per--on"><b></b><small></small><button type="button" class="kit-btn kit-btn--plano ad-mini">Cambiar</button></div>');
      c.querySelector('b').textContent = nombre(p.nombre);
      c.querySelector('small').textContent = p.doc + ' · ' + p.det;
      c.querySelector('button').addEventListener('click', function () { quitar(); inp.focus(); });
      eleg.appendChild(c);
    }
    function quitar() { para = null; eleg.hidden = true; eleg.innerHTML = ''; inp.parentNode.hidden = false; }
    inp.addEventListener('input', K.debounce(buscar, 120));

    var ze = f.querySelector('.so-estados'), cResp = f.querySelector('.so-campo-resp'), cAv = f.querySelector('.so-avisar');
    [['PENDIENTE', 'Queda pendiente'], ['EN PROCESO', 'Lo estoy atendiendo'], ['RESUELTO', 'Ya quedó resuelto']].forEach(function (x) {
      var b = K.nodo('<button type="button" class="kit-pastilla" aria-pressed="' + (x[0] === estado) + '"></button>');
      b.textContent = x[1];
      b.addEventListener('click', function () { estado = x[0]; ze.querySelectorAll('.kit-pastilla').forEach(function (y) { y.setAttribute('aria-pressed', String(y === b)); }); cAv.hidden = estado !== 'RESUELTO'; });
      ze.appendChild(b);
    });
    if (K.piezas.adjuntos) adj = K.piezas.adjuntos.montar(f.querySelector('.so-zona'), { acepta: 'image/*', varios: true, maximo: ENVIO_FOTOS, maximoMB: 6 });

    var m = O().modal({ titulo: 'Cargar un soporte', cuerpo: f, ancha: true,
      alCerrar: function () { if (adj) adj.desmontar(); if (location.hash === '#/soportes/nuevo') history.replaceState(null, '', '#/soportes'); },
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } }, { texto: 'Guardar soporte', icono: 'check', marca: true, al: function () {
        var sol = f.querySelector('.so-sol').value.trim(), resp = f.querySelector('.so-resp-in').value.trim();
        if (!para) { inp.focus(); K.aviso('Escoge a la persona.', 'aviso', 4000); return; }
        if (sol.length < 10) { f.querySelector('.so-sol').focus(); K.aviso('Cuenta qué pidió (al menos diez letras).', 'aviso', 4000); return; }
        if (estado === 'RESUELTO' && resp.length < 5) { f.querySelector('.so-resp-in').focus(); K.aviso('Escribe qué se hizo: es lo que la persona va a calificar.', 'aviso', 5000); return; }
        m.botones[1].disabled = true;
        K.ocupado = true;
        var datos = { para: para.tipo === 'CONTRATISTA' ? { tipo: 'CONTRATISTA', idContrato: para.id } : { tipo: 'USUARIO', documento: para.doc, app: para.app },
                      solicitud: sol, respuesta: resp, estado: estado, avisar: f.querySelector('.so-avisar input').checked };
        var envio = fotos(adj).then(function (fs) { datos.fotos = fs; return K.pedir('soporteCargar', datos, { ms: 90000 }); });
        K.piezas.guardado.mientras(envio, {
          titulo: 'Cargando el soporte', sub: nombre(para.nombre), pasos: ['Escribiendo en SOPORTE', estado === 'RESUELTO' && datos.avisar ? 'Avisando para que califique' : 'Sin avisos', 'Apuntando en la bitácora'],
          listo: { titulo: 'Soporte cargado', paso: estado }
        }).then(function (r) {
          K.ocupado = false;
          fundir(r.soporte); alInicio(r);
          if (C.bitacora) C.bitacora(r.bitacora);
          m.cerrar();
          F.estado = ''; F.app = ''; F.buscar = '';
          if (vista._repintar) vista._repintar();
          K.aviso('Quedó el soporte ' + r.soporte.id + '.', 'ok', 5000);
        }, function (e) { K.ocupado = false; m.botones[1].disabled = false; mal(e); });
      } }] });
    setTimeout(function () { inp.focus(); }, 120);
  }

  /** Las capturas, reducidas a JPEG como en el soporte de las apps. */
  function fotos(adj) {
    if (!adj) return Promise.resolve([]);
    var l = adj.archivos ? adj.archivos() : [];
    if (!l.length) return Promise.resolve([]);
    var I = K.piezas.imagenes;
    if (!I || !I.preparar) return adj.aBase64();
    return Promise.all(l.map(function (f, i) {
      return I.preparar(f).then(function (r) {
        return { nombre: 'captura-' + (i + 1) + '.jpg', tipo: 'image/jpeg', datos: String(r.dataUrl).slice(String(r.dataUrl).indexOf(',') + 1) };
      });
    }));
  }

  /* ══════════════ PDF y Excel ══════════════ */

  function exportar(que) {
    var l = filtradas();
    if (!l.length) { K.aviso('No hay soportes con esos filtros.', 'aviso', 3000); return; }
    var ex = K.piezas.exportar;
    var filas = l.map(function (x) {
      return { id: x.id, fecha: x.fecha, app: APP_T[x.app] || x.app, persona: nombre(x.emisor), documento: x.documento, rol: x.rol,
               contrato: x.idContrato, tipo: x.tipo, estado: x.estado, solicitud: x.solicitud, respuesta: x.respuesta,
               atendio: nombre(x.respondidoPor), fechaRespuesta: x.fechaRespuesta, estrellas: x.estrellas || '',
               calificacion: x.estrellas ? x.estrellas + ' de 5 · ' + ETIQ[x.estrellas] : (x.estado === 'RESUELTO' ? 'Por calificar' : ''),
               comentario: x.comentario, fechaCalificacion: x.fechaCalificacion, reabierto: x.reabierto || '', vista: x.vista, cargadoPor: nombre(x.cargadoPor),
               historial: (x.historial || []).map(function (h) { return h.fecha + ' · ' + h.evento + ' · ' + nombre(h.quien) + (h.detalle ? ' · ' + h.detalle : ''); }).join('\n') };
    });
    var rango = (F.desde || F.hasta) ? 'Del ' + (O().fecha(F.desde) || 'inicio') + ' al ' + (O().fecha(F.hasta) || 'hoy') : 'Todos los soportes';
    var filtroE = { '': '', ABIERTOS: 'por atender', REALIZADOS: 'realizados', PENDIENTE: 'pendientes', 'EN PROCESO': 'en proceso', REABIERTO: 'reabiertos', RESUELTO: 'por calificar', CERRADO: 'cerrados' }[F.estado] || '';
    var sub = rango + (filtroE ? ' · ' + filtroE : '') + (F.app ? ' · ' + (APP_T[F.app] || F.app) : '') + ' · ' + l.length + (l.length === 1 ? ' soporte' : ' soportes');
    if (que === 'xlsx') {
      ex.aExcel('Soportes', [
        { campo: 'id', titulo: 'N° soporte' }, { campo: 'fecha', titulo: 'Fecha' }, { campo: 'app', titulo: 'App' }, { campo: 'persona', titulo: 'Persona' },
        { campo: 'documento', titulo: 'Documento' }, { campo: 'rol', titulo: 'Rol' }, { campo: 'contrato', titulo: 'ID contrato' }, { campo: 'tipo', titulo: 'Tipo' },
        { campo: 'estado', titulo: 'Estado' }, { campo: 'solicitud', titulo: 'Solicitud' }, { campo: 'respuesta', titulo: 'Respuesta' },
        { campo: 'atendio', titulo: 'Atendió' }, { campo: 'fechaRespuesta', titulo: 'Fecha respuesta' }, { campo: 'estrellas', titulo: 'Estrellas' },
        { campo: 'comentario', titulo: 'Comentario' }, { campo: 'fechaCalificacion', titulo: 'Fecha calificación' }, { campo: 'reabierto', titulo: 'Veces reabierto' },
        { campo: 'vista', titulo: 'Vista' }, { campo: 'cargadoPor', titulo: 'Cargado por' }, { campo: 'historial', titulo: 'Historial' }
      ], filas);
      return;
    }
    ex.aPDF('Informe de soportes', [
      { campo: 'solicitud', titulo: 'Solicitud', largo: true }, { campo: 'respuesta', titulo: 'Respuesta', largo: true },
      { campo: 'atendio', titulo: 'Atendió' }, { campo: 'fechaRespuesta', titulo: 'Respondido' }, { campo: 'calificacion', titulo: 'Calificación' },
      { campo: 'comentario', titulo: 'Comentario de la persona', largo: true }, { campo: 'reabierto', titulo: 'Veces reabierto' }, { campo: 'tipo', titulo: 'Tipo' }
    ], filas, {
      subtitulo: sub,
      bloque: {
        titulo: function (f) { return f.id + ' · ' + f.persona; },
        sub: function (f) { return [f.app, f.contrato || f.documento, f.fecha].filter(Boolean).join(' · '); },
        marca: function (f) { return f.estado + (f.estrellas ? ' · ' + f.estrellas + '★' : ''); },
        tono: function (f) { return f.estado === 'REABIERTO' ? 'malo' : (f.estado === 'CERRADO' || f.estado === 'RESUELTO' ? 'ok' : 'aviso'); }
      },
      grupo: function (f) { return f.app; },
      resumen: function (fs) {
        var c = cifras(fs.map(function (f) { return { estado: f.estado, estrellas: f.estrellas || 0 }; }));
        var r = [{ etiqueta: 'Soportes', valor: c.total }, { etiqueta: 'Por atender', valor: c.PENDIENTE + c['EN PROCESO'] + c.REABIERTO },
                 { etiqueta: 'Realizados', valor: c.RESUELTO + c.CERRADO }, { etiqueta: 'Reabiertos', valor: c.REABIERTO }];
        if (c.calificados) r.push({ etiqueta: 'Promedio (' + c.calificados + ' calificados)', valor: String(c.promedio).replace('.', ',') + ' de 5' });
        return r;
      }
    });
  }

  window.SOPORTES = {
    configurar: function (c) { C = c || {}; },
    vista: vista,
    olvidar: function () { D = null; F = { estado: '', app: '', buscar: '', desde: '', hasta: '' }; },
    /* lo que llega de otra vista (los documentos rehechos de una cuenta) */
    recibir: function (x) { if (D) { fundir(x); alInicio(null); } },
    _datos: function () { return D; }, _filtradas: filtradas, _cifras: cifras, _filtros: function () { return F; }
  };
}());
