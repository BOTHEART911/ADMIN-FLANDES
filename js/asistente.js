/* ============================================================
   ADMIN-FLANDES · ASISTENTE DE AYUDA (solo DEV) · 24/10/2026

   Aquí se entrena el asistente de las apps (kit/asistente.js):
     · TEMAS ........ la base: título, vistas, frases de ejemplo,
                      respuesta, a dónde lleva y en qué estado aplica.
     · POR ENSEÑAR .. lo que la gente preguntó y no tuvo respuesta, o
                      respondió mal (👎): se asigna a un tema como frase
                      nueva, se crea un tema con ella o se descarta.
     · PROBAR ....... se escribe una frase y se ve qué respondería, con el
                      MISMO motor del teléfono (sin servidor).
     · MARCAS 👍/👎 .. 05/11: cada "¿Te sirvió?" con QUIÉN lo marcó (de su
                      sesión), app, vista, fecha, la pregunta y la respuesta
                      que dio. Desde la marca se corrige el tema y la marca
                      queda CORREGIDA en el mismo viaje.

   Una llamada al entrar ('asistenteDatos' con las marcas y los temas de UNA
   app: antes viajaban los de las 7, 206 KB). Al cambiar de app se traen los
   de esa, una sola vez por sesión. Cada cambio sube el sello de
   la base de esa app: el teléfono la recibe en su siguiente apertura.
   05/11 · Las marcas guardan el documento de la sesión (las de antes del
   05/11 llegaron sin él). Los contadores 👍/👎 del resumen abren MARCAS.
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var O = window.OFICINA;
  var C = {};
  var D = null, HORA = null, CARGANDO = null;
  var F = { pestana: 'temas', app: 'CONTRATISTA', busca: '', voto: 'NO', vEstado: 'PEND', vBusca: '', rEstado: 'PENDIENTE', rQue: '', rBusca: '' };
  var PRUEBA = { vista: 'inicio', estado: 'ACTIVO', frase: '' };

  var NOMBRES = { CONTRATISTA: 'Contratista', CONTRATACION: 'Contratación', SUPERVISION: 'Supervisión', CONTABILIDAD: 'Contabilidad',
    TESORERIA: 'Tesorería', COMUNICACIONES: 'Comunicaciones', ADMIN: 'Admin' };

  /* lo que el adaptador de cada app sabe hacer (js/asistente-app.js) */
  var CATALOGO = {
    CONTRATISTA: {
      vistas: ['entrada', 'inicio', 'proceso', 'personales', 'borrador', 'borradorObligacion', 'cuenta', 'seguimiento', 'avisos',
        'comunicaciones', 'tesoreria', 'contratacion', 'comunicados', 'directorio', 'tutoriales', 'sitios', 'misregistros'],
      acciones: ['ir:inicio', 'ir:proceso', 'ir:personales', 'ir:borrador', 'ir:cuenta', 'ir:seguimiento', 'ir:plan', 'ir:egresos', 'ir:drive',
        'ir:certificacion', 'ir:comunicaciones', 'ir:comunicacionesNueva', 'ir:tesoreria', 'ir:tesoreriaNueva', 'ir:contratacion',
        'ir:contratacionNueva', 'ir:comunicados', 'ir:directorio', 'ir:tutoriales', 'ir:sitios', 'ir:avisos', 'ir:misregistros',
        'guia', 'soporte', 'foto', 'clave', 'instalar', 'olvide', 'documento'],
      datos: ['estadoCuenta', 'estadoCuentaCorto', 'queMeToca', 'cuentaPendiente', 'reporteBloqueo', 'devolucion', 'pagado', 'quienMeAtiende',
        'supervisor', 'contratoResumen', 'obligaciones', 'contratosCert', 'avisosTelefono', 'noLeidos', 'comunicadosSinLeer',
        'pctSalud', 'pctPension', 'pctArl', 'contrato', 'estadoContrato', 'nombre']
    },
    /* 24/10 · entrega 7 y 8 (sacados de su js/asistente-app.js y su base) */
    COMUNICACIONES: {
      vistas: ['inicio', 'solicitudes', 'repartir', 'solicitud', 'informes', 'solicitantes', 'nueva', 'comunicados', 'directorio', 'entrada'],
      acciones: ['ir:inicio', 'ir:abiertas', 'ir:vencidas', 'ir:enProceso', 'ir:realizadas', 'ir:mias', 'ir:sinAsignar', 'ir:externas', 'ir:repartir', 'ir:nueva', 'ir:registros', 'ir:comunicados', 'ir:directorio', 'ir:solicitantes', 'ir:solActivos', 'guia', 'soporte', 'foto', 'clave', 'instalar', 'olvide', 'documento'],
      datos: ['queMeToca', 'abiertas', 'proximas', 'vencidas', 'hoy', 'sinAsignar', 'cargaEquipo', 'aQuien', 'mesHechas', 'mias', 'externas', 'masPiden', 'falta', 'periodo', 'comunicados', 'dirIncompletos', 'solNunca', 'solQuienPide', 'permisos', 'avisosTelefono', 'nombre']
    },
    ADMIN: {
      vistas: ['inicio', 'soportes', 'usuarios', 'atrasos', 'configuracion', 'tablero', 'agenda', 'recordatorios', 'bitacora', 'rendimiento', 'comunicados', 'mibot', 'tutoriales', 'contratistas', 'contratista', 'agregar', 'masiva', 'novedad', 'asistente', 'entrada'],
      acciones: ['ir:inicio', 'ir:configuracion', 'ir:cfgCalendario', 'ir:cfgCatalogos', 'ir:cfgSupervisores', 'ir:cfgGrupos', 'ir:cfgPlantillas', 'ir:cfgGuias', 'ir:cfgMensajes', 'ir:cfgMantenimiento', 'ir:cfgMarca', 'ir:usuarios', 'ir:usBloqueados', 'ir:usSinCelular', 'ir:usSinCorreo', 'ir:usClaveDoc', 'ir:usSinContrato', 'ir:soportes', 'ir:sopAbiertos', 'ir:sopReabiertos', 'ir:sopNuevo', 'ir:atrasos', 'ir:agenda', 'ir:bitacora', 'ir:registros', 'ir:recordatorios', 'ir:comunicados', 'ir:mibot', 'ir:tablero', 'ir:rendimiento', 'ir:tutoriales', 'ir:asistente', 'ir:contratistas', 'ir:ctActivos', 'ir:agregar', 'ir:masiva', 'guia', 'soporte', 'foto', 'clave', 'instalar', 'olvide', 'documento'],
      datos: ['queMeToca', 'resumen', 'versiones', 'mantenimiento', 'soportes', 'reabiertos', 'atrasados', 'bloqueados', 'sinCelular', 'sinCorreo', 'claveDoc', 'supSinGrupo', 'festivos', 'sinGuia', 'cambiosHoy', 'bot', 'asistente', 'permisos', 'avisosTelefono', 'nombre']
    }
  };

  function catalogo(app) { return CATALOGO[app] || { vistas: [], acciones: ['guia', 'soporte'], datos: [] }; }

  function indexar(t) { t._t = K.norm([t.id, t.titulo, t.vista, t.accion, (t.frases || []).join(' '), t.respuesta].join(' ')); return t; }

  /* 05/11 · CARGADAS: apps cuyos temas ya están en memoria (el CORE viejo manda todas) */
  var CARGADAS = {};
  function recibir(d) {
    D = d || { temas: [], porEnsenar: [] };
    D.temas = (D.temas || []).map(indexar);
    D.votos = D.votos || [];
    CARGADAS = {};
    (D.cargadas || D.apps || []).forEach(function (a) { CARGADAS[a] = 1; });
    if (!D.cargadas) D.temas.forEach(function (t) { CARGADAS[t.app] = 1; });
    HORA = new Date();
    MOTOR = {};
  }

  function cargar(fresco) {
    if (D && !fresco) return Promise.resolve(D);
    if (CARGANDO && !fresco) return CARGANDO;
    var app = F.app;
    CARGANDO = O.leer('asistenteDatos', { apps: [app] }).then(function (d) { CARGANDO = null; recibir(d); return D; }, function (e) { CARGANDO = null; throw e; });
    return CARGANDO;
  }

  /** Los temas de unas apps que aún no están en memoria, en UN viaje. */
  var TRAYENDO = {};
  function asegurar(apps) {
    var faltan = (apps || []).filter(function (a, i, x) { return a && !CARGADAS[a] && x.indexOf(a) === i; });
    if (!faltan.length) return Promise.resolve(D);
    var k = faltan.slice().sort().join(',');
    if (TRAYENDO[k]) return TRAYENDO[k];
    TRAYENDO[k] = O.leer('asistenteDatos', { apps: faltan, soloTemas: true }).then(function (d) {
      delete TRAYENDO[k];
      if (!D) return D;
      var ya = {};
      D.temas.forEach(function (t) { ya[t.id] = 1; });
      (d.temas || []).forEach(function (t) { if (!ya[t.id]) D.temas.push(indexar(t)); });
      (d.cargadas || faltan).forEach(function (a) { CARGADAS[a] = 1; });
      if (!d.cargadas) (d.temas || []).forEach(function (t) { CARGADAS[t.app] = 1; });
      Object.keys(d.sellos || {}).forEach(function (a) { D.sellos[a] = d.sellos[a]; });
      MOTOR = {};
      return D;
    }, function (e) { delete TRAYENDO[k]; throw e; });
    return TRAYENDO[k];
  }

  /* el motor del teléfono, uno por app, con la base de esta vista */
  var MOTOR = {};
  function motor(app) {
    if (!K.piezas.asistente) return null;
    if (!MOTOR[app]) MOTOR[app] = K.piezas.asistente.motor((D ? D.temas : []).filter(function (t) { return t.app === app; }));
    return MOTOR[app];
  }

  function temasDe(app) { return (D ? D.temas : []).filter(function (t) { return t.app === app; }).sort(function (a, b) { return (a.orden || 0) - (b.orden || 0); }); }
  function coincide(t, q) {
    q = K.norm(q || ''); if (!q) return true;
    return q.split(' ').filter(Boolean).every(function (p) { return t.indexOf(p) >= 0; });
  }
  function rico(t) { return K.esc(t).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }

  /* ══════════════ vista ══════════════ */

  var REPINTAR = null;

  function vista() {
    if (!(C.esDev && C.esDev())) { C.irA('inicio'); return; }
    var caja = K.nodo('<div class="kit-ancho vista ct of as"></div>');
    C.app.appendChild(caja);
    O.cabecera(caja, 'robot', 'ASISTENTE DE AYUDA',
      'Lo que responde el robot de las apps. Edita los <b>temas</b>, enseña lo que quedó <b>por enseñar</b> y <b>prueba</b> una frase. Los cambios llegan a los teléfonos en su siguiente apertura.');

    var resumen = K.nodo('<section class="as-res" aria-live="polite"></section>');
    caja.appendChild(resumen);
    var zP = K.nodo('<div class="as-pest"></div>');
    caja.appendChild(zP);
    var zA = K.nodo('<div class="as-apps"></div>');
    caja.appendChild(zA);
    var cuerpo = K.nodo('<div class="as-cuerpo"></div>');
    caja.appendChild(cuerpo);

    var pP = K.piezas.pastillas.montar(zP, {
      valor: F.pestana,
      opciones: [{ valor: 'temas', texto: 'Temas' }, { valor: 'ensenar', texto: 'Por enseñar', tono: 'aviso' },
        { valor: 'votos', texto: 'Marcas 👍/👎', tono: 'aviso' }, { valor: 'redactemos', texto: 'Redactemos', tono: 'aviso' }, { valor: 'probar', texto: 'Probar' }],
      alCambiar: function (v) { F.pestana = v || 'temas'; pintar(); }
    });

    function pintarApps() {
      zA.innerHTML = '';
      var apps = (D && D.apps) || ['CONTRATISTA'];
      K.piezas.pastillas.montar(zA, {
        etiqueta: 'App', valor: F.app,
        opciones: apps.map(function (a) { return { valor: a, texto: NOMBRES[a] || a }; }),
        alCambiar: function (v) { F.app = v || 'CONTRATISTA'; pintar(); }
      });
    }

    function pintar() {
      if (!D) return;
      /* la app elegida aún no tiene sus temas en memoria: se traen (una vez) y se repinta */
      var faltan = F.pestana === 'votos'
        ? (D.votos || []).filter(pendiente).map(function (v) { return v.app; })
        : (F.pestana === 'redactemos' ? [] : [F.app]);
      if (faltan.some(function (a) { return !CARGADAS[a]; })) {
        cuerpo.innerHTML = '';
        K.piezas.esqueletos.mientras(cuerpo, asegurar(faltan), { forma: 'tarjetas', cuantos: 3, espera: 'Trayendo los temas de ' + (F.pestana === 'votos' ? 'esas apps' : (NOMBRES[F.app] || F.app)) })
          .then(function () { pintar(); })['catch'](function (e) { cuerpo.appendChild(C.errorCaja(e, function () { pintar(); })); });
        return;
      }
      var r = D.resumen || {};
      resumen.innerHTML =
        '<span><b>' + K.numero(temasDe(F.app).length || (D.temasPorApp && D.temasPorApp[F.app]) || 0) + '</b> temas de ' + K.esc(NOMBRES[F.app] || F.app) + '</span>' +
        '<span><b>' + K.numero(r.total || 0) + '</b> preguntas</span>' +
        '<span><b>' + K.numero(r.resueltas || 0) + '</b> resueltas</span>' +
        '<span class="as-res--malo"><b>' + K.numero(r.porEnsenar || 0) + '</b> por enseñar</span>' +
        /* 05/11 · antes eran texto y no hacían nada: ahora abren MARCAS con ese filtro */
        '<button type="button" class="as-res__b" data-voto="SI" aria-label="Ver las marcas de me gusta">' + K.icono('pulgar-arriba', 14) + ' <b>' + K.numero(r.buenas || 0) + '</b></button>' +
        '<button type="button" class="as-res__b as-res--malo" data-voto="NO" aria-label="Ver las marcas de no me gusta">' + K.icono('pulgar-abajo', 14) + ' <b>' + K.numero(r.malas || 0) + '</b>' +
        (r.malasPendientes ? ' <i>' + K.numero(r.malasPendientes) + ' por corregir</i>' : '') + '</button>' +
        (D.activas && D.activas.indexOf(F.app) < 0 ? '<span class="as-res--aviso">Esta app todavía no tiene el asistente en su pantalla</span>' : '') +
        (HORA ? '<span class="ct-sello">' + K.icono('reloj', 13) + ' Al día a las ' + K.esc(O.horaCorta(HORA)) + '</span>' : '');
      if (pP && pP.conteos) pP.conteos({ ensenar: (D.porEnsenar || []).filter(function (p) { return p.app === F.app; }).length, temas: temasDe(F.app).length,
        votos: (D.votos || []).filter(pendiente).length, redactemos: RD ? RD.pendientes : undefined });
      O.marcar(zP, F.pestana);
      /* las marcas son de todas las apps (cada tarjeta dice la suya) */
      zA.hidden = F.pestana === 'votos' || F.pestana === 'redactemos';
      cuerpo.innerHTML = '';
      if (F.pestana === 'votos') pintarVotos(cuerpo);
      else if (F.pestana === 'redactemos') pintarRedactemos(cuerpo);
      else if (F.pestana === 'ensenar') pintarEnsenar(cuerpo);
      else if (F.pestana === 'probar') pintarProbar(cuerpo);
      else pintarTemas(cuerpo);
    }
    REPINTAR = function () { pintarApps(); pintar(); };
    resumen.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('[data-voto]');
      if (!b) return;
      K.vibrar(6);
      F.pestana = 'votos'; F.voto = b.getAttribute('data-voto'); F.vEstado = F.voto === 'NO' ? 'PEND' : '';
      pintar();
    });

    K.piezas.esqueletos.mientras(cuerpo, cargar(false), { forma: 'tarjetas', cuantos: 4, espera: 'Trayendo la base del asistente' })
      .then(function () { pintarApps(); pintar(); })['catch'](function (e) { caja.appendChild(C.errorCaja(e, function () { D = null; C.irA('asistente'); })); });
    K.piezas.creditos.montar(caja);
  }

  function repintar() { if (REPINTAR) REPINTAR(); }

  /* ── temas ── */

  function pintarTemas(z) {
    var nuevo = K.nodo('<button type="button" class="kit-btn kit-btn--marca of-nuevo">' + K.icono('mas', 18) + ' Nuevo tema</button>');
    nuevo.addEventListener('click', function () { K.vibrar(8); editar(null); });
    z.appendChild(nuevo);
    var b = O.barra({ placeholder: 'Título, frase, vista o respuesta', valor: F.busca,
      alBuscar: function (q) { F.busca = q; lista(); },
      alRefrescar: function () { return cargar(true).then(repintar); } });
    z.appendChild(b.caja);
    var conteo = K.nodo('<p class="ct-conteo"></p>');
    z.appendChild(conteo);
    var rej = K.nodo('<div class="as-lista"></div>');
    z.appendChild(rej);
    function lista() {
      var L = temasDe(F.app).filter(function (t) { return coincide(t._t, F.busca); });
      conteo.innerHTML = '<b>' + K.numero(L.length) + '</b> ' + (L.length === 1 ? 'tema' : 'temas');
      rej.innerHTML = '';
      if (!L.length) rej.appendChild(O.vacio(temasDe(F.app).length ? 'No hay temas con esa búsqueda.' : 'Esta app todavía no tiene temas.', function () { F.busca = ''; b.inp.value = ''; lista(); }));
      L.forEach(function (t) { rej.appendChild(tarjeta(t)); });
    }
    lista();
  }

  function tarjeta(t) {
    var el = K.nodo('<button type="button" class="kit-tarjeta as-tema' + (t.activo ? '' : ' as-tema--off') + '">' +
      '<span class="as-tema__t"></span>' +
      '<span class="as-tema__m"></span>' +
      '<span class="as-tema__r"></span></button>');
    el.querySelector('.as-tema__t').textContent = t.titulo;
    el.querySelector('.as-tema__m').innerHTML =
      '<i>' + K.esc(t.id) + '</i>' +
      '<i>' + K.esc(t.vista || 'todas las vistas') + '</i>' +
      (t.accion ? '<i>' + K.esc(t.accion) + '</i>' : '') +
      (t.estado ? '<i class="as-chip--estado">' + K.esc(t.estado) + '</i>' : '') +
      (t.activo ? '' : '<i class="as-chip--off">INACTIVO</i>') +
      '<i>' + K.numero((t.frases || []).length) + ' frases</i>';
    el.querySelector('.as-tema__r').textContent = String(t.respuesta || '').replace(/\*\*/g, '').slice(0, 160);
    el.addEventListener('click', function () { K.vibrar(6); editar(t); });
    return el;
  }

  /* 05/11 · voto: la marca 👎 desde la que se corrige (el tema guarda y la marca queda CORREGIDA) */
  function editar(t, conFrase, voto) {
    var nuevo = !t;
    var cat = catalogo(F.app);
    t = t || { id: '', app: F.app, vista: '', titulo: '', frases: conFrase ? [conFrase] : [], respuesta: '', accion: '', estado: '', activo: true, orden: '' };
    var frasesIni = (t.frases || []).slice();
    if (conFrase && !nuevo && !frasesIni.some(function (x) { return K.norm(x) === K.norm(conFrase); })) frasesIni.push(conFrase);
    var cuerpo = K.nodo('<div class="tu-form as-form"></div>');
    if (voto) {
      var ctx = K.nodo('<div class="as-ctx"><p class="as-ctx__t"></p><p class="as-ctx__q"></p><p class="as-ctx__h"></p></div>');
      ctx.querySelector('.as-ctx__t').innerHTML = K.icono('pulgar-abajo', 15) + ' <b></b>';
      ctx.querySelector('.as-ctx__t b').textContent = 'No le sirvió a ' + (voto.nombre ? O.nombre(voto.nombre) : 'una persona') + ' · ' + fechaBonita(voto.fecha);
      ctx.querySelector('.as-ctx__q').textContent = '«' + voto.pregunta + '»';
      ctx.querySelector('.as-ctx__h').textContent = nuevo
        ? 'No había un tema para esto. Crea uno: la pregunta ya va como frase de ejemplo.'
        : 'Mejora la respuesta (o el título y las frases). La pregunta ya va al final de las frases: quítala si no corresponde.';
      cuerpo.appendChild(ctx);
    }
    function campo(etiqueta, html, ayuda) {
      var l = K.nodo('<label class="op-campo"><span></span>' + html + (ayuda ? '<small class="campo__ayuda"></small>' : '') + '</label>');
      l.querySelector('span').textContent = etiqueta;
      if (ayuda) l.querySelector('small').textContent = ayuda;
      cuerpo.appendChild(l);
      return l.querySelector('input, select, textarea');
    }
    var iT = campo('Título (lo que sale en el botón)', '<input class="ad-in" maxlength="120" autocomplete="off">');
    iT.value = t.titulo;
    var iF = campo('Frases de ejemplo (una por línea)', '<textarea class="ad-in" rows="6" maxlength="6000"></textarea>',
      'Cómo lo pregunta la gente, con sus palabras. Entre más variadas, mejor: el buscador entiende errores de escritura y palabras sueltas.');
    iF.value = frasesIni.join('\n');
    var iR = campo('Respuesta', '<textarea class="ad-in" rows="6" maxlength="2500"></textarea>',
      'Usa **negrita** y saltos de línea. Datos reales de la persona: ' + cat.datos.map(function (d) { return '{{' + d + '}}'; }).join(' '));
    iR.value = t.respuesta;
    var iV = campo('Vistas donde es pregunta frecuente (separadas por coma; vacío = en todas las búsquedas)', '<input class="ad-in" maxlength="300" autocomplete="off">',
      'Vistas: ' + cat.vistas.join(', ') + '. "entrada" = la pantalla de entrada (sin sesión).');
    iV.value = t.vista || '';
    var iA = campo('Acción (a dónde lleva)', '<input class="ad-in" maxlength="120" autocomplete="off" list="as-acciones">',
      'Vacío = solo responde. ir:destino lleva a una vista; preguntar:ID1|ID2 repregunta con botones; guia, soporte, foto, clave, instalar, olvide, documento.');
    iA.value = t.accion || '';
    var dl = K.nodo('<datalist id="as-acciones"></datalist>');
    cat.acciones.forEach(function (a) { var o = document.createElement('option'); o.value = a; dl.appendChild(o); });
    cuerpo.appendChild(dl);
    var sE = campo('Estado del contrato en que aplica', '<select class="ad-in op-select"><option value="">Siempre</option><option value="ACTIVO">Solo contrato ACTIVO</option><option value="TERMINADO">Solo contrato TERMINADO o inactivo</option></select>');
    sE.value = t.estado || '';
    var iO = campo('Orden (las frecuentes salen por este orden)', '<input class="ad-in" inputmode="numeric" maxlength="4" autocomplete="off">');
    iO.value = t.orden || '';
    var lAc = K.nodo('<label class="tu-sw"><input type="checkbox"><span>Activo</span></label>');
    var iAc = lAc.querySelector('input'); iAc.checked = t.activo !== false;
    cuerpo.appendChild(lAc);

    var m = O.modal({
      titulo: (voto ? 'Corregir · ' : (nuevo ? 'Nuevo tema · ' : 'Editar tema · ')) + (nuevo ? (NOMBRES[F.app] || F.app) : t.id), cuerpo: cuerpo, ancha: true,
      botones: [
        { texto: 'Cancelar', al: function () { m.cerrar(); } },
        { texto: voto ? 'Guardar y dar por corregida' : 'Guardar', icono: 'check', marca: true, al: guardar }
      ]
    });
    setTimeout(function () { (nuevo ? iT : iF).focus(); }, 120);

    function guardar() {
      var tema = {
        id: t.id, app: F.app, titulo: iT.value.replace(/\s+/g, ' ').trim(),
        frases: iF.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean),
        respuesta: iR.value.trim(), vista: iV.value.replace(/\s+/g, '').trim(), accion: iA.value.trim(),
        estado: sE.value, orden: iO.value.trim(), activo: iAc.checked
      };
      if (tema.titulo.length < 3) { K.aviso('Escribe el título.', 'aviso', 3000); iT.focus(); return; }
      if (!tema.frases.length) { K.aviso('Pon al menos una frase de ejemplo.', 'aviso', 3000); iF.focus(); return; }
      if (!tema.respuesta) { K.aviso('Escribe la respuesta.', 'aviso', 3000); iR.focus(); return; }
      if (K.ocupado) return;
      K.ocupado = true;
      var bt = m.botones[1]; bt.disabled = true; bt.classList.add('kit-ocupado');
      var cuerpoP = { tema: tema };
      if (voto) cuerpoP.idPregunta = voto.id;
      K.pedir('asistenteTemaGuardar', cuerpoP, { ms: 60000 }).then(function (r) {
        K.ocupado = false;
        m.cerrar();
        /* se parcha la lista en memoria: no se vuelve a pedir todo */
        var x = r.tema; x._t = K.norm([x.id, x.titulo, x.vista, x.accion, (x.frases || []).join(' '), x.respuesta].join(' '));
        var i = D.temas.findIndex(function (y) { return y.id === x.id; });
        if (i >= 0) D.temas[i] = x; else D.temas.push(x);
        Object.keys(r.sellos || {}).forEach(function (a) { D.sellos[a] = r.sellos[a]; });
        MOTOR = {};
        if (voto) atender(voto.id, 'CORREGIDA', x);
        K.aviso((voto ? 'Corregida. ' : '') + (r.nuevo ? 'Tema creado. Llega a los teléfonos en su siguiente apertura.' : 'Tema guardado. Llega a los teléfonos en su siguiente apertura.'), 'ok', 4000);
        repintar();
      }, function (e) {
        K.ocupado = false; bt.disabled = false; bt.classList.remove('kit-ocupado');
        K.aviso((e && e.message) || 'No se pudo guardar el tema.', 'malo', 8000);
      });
    }
  }

  /* ── por enseñar ── */

  function pintarEnsenar(z) {
    var L = (D.porEnsenar || []).filter(function (p) { return p.app === F.app; });
    if (!L.length) {
      z.appendChild(K.nodo('<div class="kit-tarjeta ct-vacio">' + K.icono('check', 30) + '<p><b>No hay nada por enseñar.</b><br>Aquí llegan las preguntas sin respuesta y las que tuvieron 👎.</p></div>'));
      return;
    }
    var mo = motor(F.app);
    L.forEach(function (p) {
      var c = K.nodo('<section class="kit-tarjeta as-preg"><p class="as-preg__q"></p><p class="as-preg__m"></p><div class="as-preg__sug"></div><div class="as-preg__b"></div></section>');
      c.querySelector('.as-preg__q').textContent = '«' + p.pregunta + '»';
      c.querySelector('.as-preg__m').textContent = [p.fecha, p.vista || 'sin vista', p.voto === '👎' ? '👎 respondió ' + (p.tema || '') : 'sin respuesta'].join(' · ');
      var sug = c.querySelector('.as-preg__sug');
      var r = mo ? mo.buscar(p.pregunta, { vista: p.vista, estado: 'ACTIVO', entrada: p.vista === 'entrada' }) : null;
      var cand = r ? r.candidatos.slice(0, 3) : [];
      sug.appendChild(K.nodo('<span class="as-preg__et">Asignar como frase de:</span>'));
      cand.forEach(function (x) {
        var b = K.nodo('<button type="button" class="kit-pastilla"></button>');
        b.textContent = x.tema.titulo + ' · ' + Math.round(x.puntaje * 100) + '%';
        b.addEventListener('click', function () { ensenar(p, x.tema.id, b); });
        sug.appendChild(b);
      });
      var sel = K.nodo('<select class="ad-in op-select as-preg__sel"><option value="">Otro tema…</option></select>');
      temasDe(F.app).forEach(function (t) { var o = document.createElement('option'); o.value = t.id; o.textContent = t.titulo; sel.appendChild(o); });
      sel.addEventListener('change', function () { if (sel.value) ensenar(p, sel.value, sel); });
      sug.appendChild(sel);
      var bb = c.querySelector('.as-preg__b');
      var bN = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('mas', 15) + ' Crear tema con esta frase</button>');
      bN.addEventListener('click', function () { editar(null, p.pregunta); });
      var bD = K.nodo('<button type="button" class="kit-btn kit-btn--plano kit-btn--malo">' + K.icono('cerrar', 15) + ' Descartar</button>');
      bD.addEventListener('click', function () { ensenar(p, '', bD, true); });
      bb.appendChild(bN); bb.appendChild(bD);
      z.appendChild(c);
    });
  }

  function ensenar(p, idTema, boton, descartar) {
    if (K.ocupado) return;
    K.ocupado = true;
    if (boton) { boton.disabled = true; boton.classList.add('kit-ocupado'); }
    K.pedir('asistenteEnsenar', { idPregunta: p.id, idTema: idTema, descartar: !!descartar }, { ms: 60000 }).then(function (r) {
      K.ocupado = false;
      var antes = D.porEnsenar.length;
      D.porEnsenar = D.porEnsenar.filter(function (x) { return x.id !== p.id; });
      if (D.resumen && antes !== D.porEnsenar.length) D.resumen.porEnsenar = Math.max(0, (D.resumen.porEnsenar || 1) - 1);
      atender(p.id, descartar ? 'DESCARTADA' : 'ENSEÑADA', descartar ? null : D.temas.find(function (x) { return x.id === idTema; }));
      if (!descartar) {
        var t = D.temas.find(function (x) { return x.id === idTema; });
        if (t && t.frases.indexOf(r.frase) < 0) { t.frases.push(r.frase); t._t += ' ' + K.norm(r.frase); }
        MOTOR = {};
      }
      K.aviso(descartar ? 'Descartada.' : 'Aprendido: «' + r.frase + '».', 'ok', 3000);
      repintar();
    }, function (e) {
      K.ocupado = false;
      if (boton) { boton.disabled = false; boton.classList.remove('kit-ocupado'); }
      K.aviso((e && e.message) || 'No se pudo guardar.', 'malo', 7000);
    });
  }

  /* ── marcas 👍/👎 (05/11) ── */

  function pendiente(v) { return v.voto === '👎' && !v.estado; }

  function fechaBonita(f) {
    var m = String(f || '').match(/^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d)/);
    if (!m) return String(f || '');
    var h = +m[4], ap = h < 12 ? 'a. m.' : 'p. m.';
    return m[3] + '/' + m[2] + '/' + m[1] + ' ' + (((h + 11) % 12) + 1) + ':' + m[5] + ' ' + ap;
  }

  /* el CORE normaliza sin tildes: ENSEÑADA llega como ENSENADA */
  function ahoraLocal() {
    var d = new Date(), z = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds());
  }

  var ESTADOS = { CORREGIDA: 'Corregida', 'ENSEÑADA': 'Enseñada', ENSENADA: 'Enseñada', DESCARTADA: 'Descartada' };

  /** Parcha la marca y lo que depende de ella en memoria (no se vuelve a pedir todo). */
  function atender(id, estado, tema) {
    var v = (D.votos || []).find(function (x) { return x.id === id; });
    if (v) {
      if (pendiente(v) && D.resumen) D.resumen.malasPendientes = Math.max(0, (D.resumen.malasPendientes || 1) - 1);
      v.estado = estado;
      v.atendida = ahoraLocal();
      /* lo que respondió no cambia: se anota aparte a qué tema quedó */
      if (tema && tema.id !== v.tema) v.asignado = { id: tema.id, titulo: tema.titulo };
    }
    var antes = (D.porEnsenar || []).length;
    D.porEnsenar = (D.porEnsenar || []).filter(function (x) { return x.id !== id; });
    if (D.resumen && antes !== D.porEnsenar.length) D.resumen.porEnsenar = Math.max(0, (D.resumen.porEnsenar || 1) - 1);
  }

  function pintarVotos(z) {
    var fil = K.nodo('<div class="as-vfil"><div class="as-vfil__a"></div><div class="as-vfil__b"></div></div>');
    z.appendChild(fil);
    var pV = K.piezas.pastillas.montar(fil.querySelector('.as-vfil__a'), {
      etiqueta: 'Marca', valor: F.voto,
      opciones: [{ valor: 'NO', texto: '👎 No le sirvió', tono: 'aviso' }, { valor: 'SI', texto: '👍 Le sirvió' }, { valor: '', texto: 'Todas' }],
      alCambiar: function (v) { F.voto = v; lista(); }
    });
    var pE = K.piezas.pastillas.montar(fil.querySelector('.as-vfil__b'), {
      etiqueta: 'Estado', valor: F.vEstado,
      opciones: [{ valor: 'PEND', texto: 'Por corregir', tono: 'aviso' }, { valor: 'HECHAS', texto: 'Atendidas' }, { valor: '', texto: 'Todas' }],
      alCambiar: function (v) { F.vEstado = v; lista(); }
    });
    var b = O.barra({ placeholder: 'Nombre, documento, pregunta, tema o app', valor: F.vBusca,
      alBuscar: function (q) { F.vBusca = q; lista(); },
      alRefrescar: function () { return cargar(true).then(repintar); } });
    z.appendChild(b.caja);
    var conteo = K.nodo('<p class="ct-conteo"></p>');
    z.appendChild(conteo);
    var rej = K.nodo('<div class="as-votos"></div>');
    z.appendChild(rej);

    function pasa(v, voto, est) {
      if (voto === 'NO' && v.voto !== '👎') return false;
      if (voto === 'SI' && v.voto !== '👍') return false;
      if (est === 'PEND' && v.estado) return false;
      if (est === 'PEND' && v.voto !== '👎') return false;
      if (est === 'HECHAS' && !v.estado) return false;
      return true;
    }
    function lista() {
      var V = D.votos || [];
      var q = F.vBusca;
      var L = V.filter(function (v) {
        if (!pasa(v, F.voto, F.vEstado)) return false;
        if (!q) return true;
        if (!v._t) v._t = K.norm([v.nombre, v.documento, v.contrato, v.pregunta, v.tema, v.temaTitulo, v.app, NOMBRES[v.app], v.vista].join(' '));
        return coincide(v._t, q);
      });
      pV.conteos({ NO: V.filter(function (v) { return pasa(v, 'NO', F.vEstado); }).length, SI: V.filter(function (v) { return pasa(v, 'SI', F.vEstado); }).length, '': V.filter(function (v) { return pasa(v, '', F.vEstado); }).length });
      pE.conteos({ PEND: V.filter(function (v) { return pasa(v, F.voto, 'PEND'); }).length, HECHAS: V.filter(function (v) { return pasa(v, F.voto, 'HECHAS'); }).length, '': V.filter(function (v) { return pasa(v, F.voto, ''); }).length });
      conteo.innerHTML = '<b>' + K.numero(L.length) + '</b> ' + (L.length === 1 ? 'marca' : 'marcas');
      rej.innerHTML = '';
      if (!L.length) {
        rej.appendChild(O.vacio(V.length ? 'No hay marcas con este filtro.' : 'Todavía nadie ha marcado una respuesta.', function () {
          F.voto = ''; F.vEstado = ''; F.vBusca = ''; b.inp.value = ''; pV.poner(''); pE.poner('');
        }));
        return;
      }
      L.forEach(function (v) { rej.appendChild(tarjetaVoto(v)); });
    }
    lista();
  }

  function tarjetaVoto(v) {
    var malo = v.voto === '👎';
    var c = K.nodo('<section class="kit-tarjeta as-voto' + (malo ? ' as-voto--no' : ' as-voto--si') + (v.estado ? ' as-voto--hecha' : '') + '">' +
      '<header class="as-voto__cab"><span class="as-voto__ic"></span><b class="as-voto__v"></b><i class="as-voto__est"></i><time class="as-voto__f"></time></header>' +
      '<p class="as-voto__quien"></p>' +
      '<p class="as-voto__m"></p>' +
      '<p class="as-voto__q"></p>' +
      '<div class="as-voto__r"><p class="as-voto__rt"></p><div class="as-voto__rx"></div><small class="as-voto__nota"></small></div>' +
      '<div class="as-voto__b"></div></section>');
    c.querySelector('.as-voto__ic').innerHTML = K.icono(malo ? 'pulgar-abajo' : 'pulgar-arriba', 16);
    c.querySelector('.as-voto__v').textContent = malo ? 'No le sirvió' : 'Le sirvió';
    var est = c.querySelector('.as-voto__est');
    if (v.estado) est.textContent = (ESTADOS[v.estado] || v.estado) + (v.atendida ? ' · ' + fechaBonita(v.atendida) : '');
    else if (malo) { est.textContent = 'Por corregir'; est.classList.add('as-voto__est--pend'); }
    else est.remove();
    c.querySelector('.as-voto__f').textContent = fechaBonita(v.fecha);
    var qn = c.querySelector('.as-voto__quien');
    if (v.documento) {
      qn.innerHTML = K.icono('persona', 15) + '<span class="as-voto__qt"><b></b> <i></i></span>';
      qn.querySelector('b').textContent = v.nombre ? O.nombre(v.nombre) : 'Sin nombre registrado';
      qn.querySelector('i').textContent = '· ' + v.documento + (v.contrato ? ' · ' + v.contrato : '');
    } else {
      qn.classList.add('as-voto__quien--sin');
      qn.innerHTML = K.icono('persona', 15) + ' <span>Sin dato de quién: marca de antes del 05/11, cuando se guardaban sin nombre.</span>';
    }
    c.querySelector('.as-voto__m').textContent = [NOMBRES[v.app] || v.app, 'vista ' + (v.vista || 'sin vista'),
      v.resolucion === 'GEMINI' ? 'tema elegido por Gemini' : (v.resolucion === 'SIN RESPUESTA' ? 'no encontró tema' : 'respondió el buscador')].join(' · ');
    c.querySelector('.as-voto__q').textContent = '«' + v.pregunta + '»';
    var tema = v.tema ? D.temas.find(function (x) { return x.id === v.tema; }) : null;
    c.querySelector('.as-voto__rt').innerHTML = '<span>Respondió:</span> ';
    var rt = c.querySelector('.as-voto__rt');
    if (v.tema) { var bt = document.createElement('b'); bt.textContent = (v.temaTitulo || 'Tema') + ' '; var it = document.createElement('i'); it.textContent = v.tema; rt.appendChild(bt); rt.appendChild(it); }
    else { var bn = document.createElement('b'); bn.textContent = '¿Quisiste decir…?'; rt.appendChild(bn); }
    c.querySelector('.as-voto__rx').innerHTML = rico(String(v.respuesta || '').replace(/\{\{(\w+)\}\}/g, '[$1]'));
    if (v.asignado) {
      var as = K.nodo('<p class="as-voto__asig"></p>');
      as.textContent = 'Quedó como frase de: ' + v.asignado.titulo + ' (' + v.asignado.id + ')';
      c.querySelector('.as-voto__r').appendChild(as);
    }
    var nota = c.querySelector('.as-voto__nota');
    if (v.tema && !v.respuestaGuardada) nota.textContent = 'Es el texto ACTUAL del tema: esta marca es de antes del 05/11 y no guardó el texto de ese momento. Los [corchetes] son datos de la persona.';
    else if (v.tema && /\{\{/.test(v.respuesta || '')) nota.textContent = 'Los [corchetes] son los datos de la persona que el teléfono puso en ese momento.';
    else nota.remove();

    var bb = c.querySelector('.as-voto__b');
    function boton(txt, ic, cls, al) {
      var x = K.nodo('<button type="button" class="kit-btn ' + cls + '">' + K.icono(ic, 15) + ' <span></span></button>');
      x.querySelector('span').textContent = txt;
      x.addEventListener('click', function () { K.vibrar(6); al(x); });
      bb.appendChild(x);
      return x;
    }
    if (pendiente(v)) {
      boton(tema ? 'Corregir la respuesta' : 'Crear el tema que faltaba', 'lapiz', 'kit-btn--marca', function () {
        F.app = v.app;
        editar(tema || null, v.pregunta, v);
      });
      var sel = K.nodo('<select class="ad-in op-select as-preg__sel" aria-label="Era de otro tema"><option value="">Era de otro tema…</option></select>');
      temasDe(v.app).forEach(function (t) { if (t.id === v.tema) return; var o = document.createElement('option'); o.value = t.id; o.textContent = t.titulo; sel.appendChild(o); });
      sel.addEventListener('change', function () { if (sel.value) ensenar(v, sel.value, sel); });
      bb.appendChild(sel);
      boton('Descartar', 'cerrar', 'kit-btn--plano kit-btn--malo', function (x) { ensenar(v, '', x, true); });
    } else if (tema) {
      boton('Ver el tema', 'lapiz', 'kit-btn--plano', function () { F.app = v.app; editar(tema); });
    }
    return c;
  }

  /* ══════════ 10/11 · REDACTEMOS JUNTOS: lo que aprende el asistente de redacción ══════════
     Del diálogo «Redactemos una actividad juntos» (CONTRATISTA) llegan, sin cifras ni nombres:
     las unidades que cuentan, para quién lo hacen, qué evidencias nombran y lo que no entendió,
     por tipo de obligación. APROBAR lo vuelve opción (botón) para los contratistas de ese tipo de
     obligación; nunca se usa para redactar por ellos. Lo no entendido se marca REVISADO.
     Un viaje al abrir la pestaña (redaccionDatos, cache del CORE) y uno por marca (redaccionMarcar). */
  var RD = null, RD_TRAYENDO = null;
  var RD_QUE = { 'PARA QUIEN': 'Para quién', 'EVIDENCIA': 'Evidencia', 'UNIDAD': 'Lo que cuentan' };
  var RD_EST = { PENDIENTE: 'Por revisar', APROBADO: 'Aprobado', DESCARTADO: 'Descartado', REVISADO: 'Revisado' };
  function rdTraer(forzar) {
    if (RD && !forzar) return Promise.resolve(RD);
    if (RD_TRAYENDO && !forzar) return RD_TRAYENDO;
    RD_TRAYENDO = K.pedir('redaccionDatos', {}, { fondo: true }).then(function (d) { RD = d || { items: [], uso: {} }; RD_TRAYENDO = null; return RD; },
      function (e) { RD_TRAYENDO = null; throw e; });
    return RD_TRAYENDO;
  }
  function rdTipo(q) { return /^NO ENTENDIO/.test(q) ? 'NO' : q; }
  function rdQueTexto(q) { return /^NO ENTENDIO/.test(q) ? 'No entendió · ' + q.replace(/^NO ENTENDIO\s*·\s*/, '').toLowerCase() : (RD_QUE[q] || q); }
  function pintarRedactemos(z) {
    if (!RD) {
      K.piezas.esqueletos.mientras(z, rdTraer(false), { forma: 'tarjetas', cuantos: 3, espera: 'Trayendo lo que aprendió el asistente de redacción' })
        .then(function () { repintar(); })['catch'](function (e) { z.appendChild(C.errorCaja(e, function () { RD = null; repintar(); })); });
      return;
    }
    var u = RD.uso || {};
    z.appendChild(K.nodo('<p class="as-rd__intro">' + K.icono('robot', 16) + ' <span>Lo que dicen los contratistas en <b>Redactemos una actividad juntos</b>, sin cifras ni nombres. <b>Aprobar</b> lo vuelve botón para quienes tienen ese tipo de obligación; nunca redacta por ellos.</span></p>'));
    z.appendChild(K.nodo('<div class="as-res as-rd__uso">' +
      '<span><b>' + K.numero(u.total || 0) + '</b> actividades redactadas</span>' +
      '<span><b>' + K.numero(u.contratos || 0) + '</b> contratos</span>' +
      '<span><b>' + K.numero(u.ultimos30 || 0) + '</b> en 30 días</span>' +
      '<span><b>' + K.numero(u.gemini || 0) + '</b> con Gemini · <b>' + K.numero(u.local || 0) + '</b> en el teléfono</span>' +
      '<span><b>' + K.numero(u.noRealizada || 0) + '</b> «no la realicé»</span></div>'));
    var fil = K.nodo('<div class="as-vfil"><div class="as-vfil__a"></div><div class="as-vfil__b"></div></div>');
    z.appendChild(fil);
    function pasa(x, est, que) {
      if (est && x.estado !== est) return false;
      if (que && rdTipo(x.que) !== que) return false;
      return true;
    }
    var pE = K.piezas.pastillas.montar(fil.querySelector('.as-vfil__a'), {
      etiqueta: 'Estado', valor: F.rEstado,
      opciones: [{ valor: 'PENDIENTE', texto: 'Por revisar', tono: 'aviso' }, { valor: 'APROBADO', texto: 'Aprobados' }, { valor: 'REVISADO', texto: 'Revisados' }, { valor: 'DESCARTADO', texto: 'Descartados' }, { valor: '', texto: 'Todos' }],
      alCambiar: function (v) { F.rEstado = v; lista(); }
    });
    var pQ = K.piezas.pastillas.montar(fil.querySelector('.as-vfil__b'), {
      etiqueta: 'Qué', valor: F.rQue,
      opciones: [{ valor: '', texto: 'Todo' }, { valor: 'PARA QUIEN', texto: 'Para quién' }, { valor: 'EVIDENCIA', texto: 'Evidencia' }, { valor: 'UNIDAD', texto: 'Lo que cuentan' }, { valor: 'NO', texto: 'No entendió', tono: 'aviso' }],
      alCambiar: function (v) { F.rQue = v; lista(); }
    });
    var b = O.barra({ placeholder: 'Tipo de obligación o frase', valor: F.rBusca,
      alBuscar: function (q) { F.rBusca = q; lista(); },
      alRefrescar: function () { return rdTraer(true).then(repintar); } });
    z.appendChild(b.caja);
    var conteo = K.nodo('<p class="ct-conteo"></p>');
    z.appendChild(conteo);
    var rej = K.nodo('<div class="as-rd"></div>');
    z.appendChild(rej);
    function lista() {
      var I = RD.items || [], q = F.rBusca;
      var L = I.filter(function (x) {
        if (!pasa(x, F.rEstado, F.rQue)) return false;
        if (!q) return true;
        if (!x._t) x._t = K.norm([x.tema, x.que, x.muestra].join(' '));
        return coincide(x._t, q);
      });
      var cE = {}; ['PENDIENTE', 'APROBADO', 'REVISADO', 'DESCARTADO', ''].forEach(function (e) { cE[e] = I.filter(function (x) { return pasa(x, e, F.rQue); }).length; });
      var cQ = {}; ['', 'PARA QUIEN', 'EVIDENCIA', 'UNIDAD', 'NO'].forEach(function (k) { cQ[k] = I.filter(function (x) { return pasa(x, F.rEstado, k); }).length; });
      pE.conteos(cE); pQ.conteos(cQ);
      conteo.innerHTML = '<b>' + K.numero(L.length) + '</b> ' + (L.length === 1 ? 'frase' : 'frases');
      rej.innerHTML = '';
      if (!L.length) {
        rej.appendChild(O.vacio(I.length ? 'No hay frases con este filtro.' : 'Todavía nadie ha redactado con el asistente.', function () {
          F.rEstado = ''; F.rQue = ''; F.rBusca = ''; b.inp.value = ''; pE.poner(''); pQ.poner('');
        }));
        return;
      }
      /* agrupadas por tipo de obligación (lo que se cuenta en ella) */
      var grupos = {}, orden = [];
      L.forEach(function (x) { var t = x.tema || 'sin tipo'; if (!grupos[t]) { grupos[t] = []; orden.push(t); } grupos[t].push(x); });
      orden.forEach(function (t) {
        var g = K.nodo('<section class="kit-tarjeta as-rd__g"><header class="as-rd__gt"></header><ul class="as-rd__l" role="list"></ul></section>');
        g.querySelector('.as-rd__gt').innerHTML = K.icono('documento', 15) + ' <span></span>';
        g.querySelector('.as-rd__gt span').textContent = 'Obligaciones de: ' + t.split('|').join(', ');
        var ul = g.querySelector('.as-rd__l');
        grupos[t].forEach(function (x) { ul.appendChild(filaRd(x, lista)); });
        rej.appendChild(g);
      });
    }
    lista();
  }
  function filaRd(x, alCambiar) {
    var no = rdTipo(x.que) === 'NO';
    var li = K.nodo('<li class="as-rd__i as-rd__i--' + x.estado.toLowerCase() + '">' +
      '<div class="as-rd__t"><span class="as-rd__que"></span><b class="as-rd__m"></b><small class="as-rd__meta"></small></div>' +
      '<div class="as-rd__b"></div></li>');
    li.querySelector('.as-rd__que').textContent = rdQueTexto(x.que);
    li.querySelector('.as-rd__m').textContent = '«' + x.muestra + '»';
    li.querySelector('.as-rd__meta').textContent = x.veces + (x.veces === 1 ? ' vez' : ' veces') + ' · ' + fechaBonita(x.ultima) +
      (x.estado !== 'PENDIENTE' ? ' · ' + (RD_EST[x.estado] || x.estado) + (x.fechaRev ? ' el ' + fechaBonita(x.fechaRev) : '') : '');
    var bb = li.querySelector('.as-rd__b');
    function boton(txt, ic, cls, estado) {
      var bt = K.nodo('<button type="button" class="kit-btn ' + cls + '">' + K.icono(ic, 15) + ' <span></span></button>');
      bt.querySelector('span').textContent = txt;
      bt.addEventListener('click', function () {
        if (bt.disabled) return;
        K.vibrar(6);
        [].forEach.call(bb.querySelectorAll('button'), function (y) { y.disabled = true; });
        bt.setAttribute('aria-busy', 'true');
        K.pedir('redaccionMarcar', { ids: [x.id], estado: estado, rid: 'RD' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }, { ms: 30000 }).then(function () {
          /* se parcha la fila en memoria: no se recarga todo */
          var antes = x.estado;
          x.estado = estado; x.fechaRev = ahoraLocal();
          if (antes === 'PENDIENTE' && estado !== 'PENDIENTE') RD.pendientes = Math.max(0, (RD.pendientes || 0) - 1);
          if (antes !== 'PENDIENTE' && estado === 'PENDIENTE') RD.pendientes = (RD.pendientes || 0) + 1;
          K.aviso(estado === 'APROBADO' ? 'Aprobado: ya sale como opción para ese tipo de obligación.' : (estado === 'PENDIENTE' ? 'Volvió a por revisar.' : 'Listo.'), 'ok', 3500);
          alCambiar();
        }, function (e) {
          [].forEach.call(bb.querySelectorAll('button'), function (y) { y.disabled = false; });
          bt.removeAttribute('aria-busy');
          K.aviso((e && e.message) || 'No se pudo guardar. Intenta de nuevo.', 'malo', 5000);
        });
      });
      bb.appendChild(bt);
    }
    if (x.estado === 'PENDIENTE') {
      if (no) boton('Revisado', 'check', 'kit-btn--marca', 'REVISADO');
      else boton('Aprobar', 'check', 'kit-btn--marca', 'APROBADO');
      boton('Descartar', 'cerrar', 'kit-btn--plano kit-btn--malo', 'DESCARTADO');
    } else {
      boton('Volver a por revisar', 'recargar', 'kit-btn--plano', 'PENDIENTE');
    }
    return li;
  }

  /* ── probar ── */

  function pintarProbar(z) {
    var cat = catalogo(F.app);
    var f = K.nodo('<section class="kit-tarjeta as-probar">' +
      '<div class="as-probar__fila"><label class="op-campo"><span>Vista</span><select class="ad-in op-select as-v"></select></label>' +
      '<label class="op-campo"><span>Contrato</span><select class="ad-in op-select as-e"><option value="ACTIVO">Activo</option><option value="TERMINADO">Terminado o inactivo</option></select></label></div>' +
      '<label class="op-campo"><span>Escribe una frase como la escribiría la gente</span><input class="ad-in as-q" maxlength="200" autocomplete="off" placeholder="Ej.: en qué va mi cuenta"></label>' +
      '<div class="as-probar__res" aria-live="polite"></div>' +
      '<div class="as-probar__frec"></div></section>');
    var sV = f.querySelector('.as-v'), sE = f.querySelector('.as-e'), iQ = f.querySelector('.as-q'), res = f.querySelector('.as-probar__res'), fr = f.querySelector('.as-probar__frec');
    (cat.vistas.length ? cat.vistas : ['inicio']).forEach(function (v) { var o = document.createElement('option'); o.value = v; o.textContent = v; sV.appendChild(o); });
    sV.value = PRUEBA.vista; sE.value = PRUEBA.estado; iQ.value = PRUEBA.frase;
    function correr() {
      PRUEBA.vista = sV.value; PRUEBA.estado = sE.value; PRUEBA.frase = iQ.value;
      var mo = motor(F.app);
      fr.innerHTML = '';
      if (mo) {
        var fq = mo.frecuentes(sV.value, sE.value);
        fr.appendChild(K.nodo('<span class="as-preg__et">Preguntas frecuentes de esta vista:</span>'));
        fq.forEach(function (t) { var b = K.nodo('<span class="kit-pastilla"></span>'); b.textContent = t.titulo; fr.appendChild(b); });
      }
      var q = iQ.value.trim();
      if (!q || !mo) { res.innerHTML = '<p class="as-probar__nada">Escribe una frase para ver qué respondería el asistente.</p>'; return; }
      var r = mo.buscar(q, { vista: sV.value, estado: sE.value, entrada: sV.value === 'entrada' });
      var tipo = r.tipo === 'tema' ? '<b class="as-ok">Responde</b>' : (r.tipo === 'dudas' ? '<b class="as-duda">¿Quisiste decir…?</b>' : '<b class="as-malo">Fuera de la app</b>');
      var h = '<p>' + tipo + ' · ' + r.ms + ' ms en el teléfono</p>';
      if (r.tipo === 'tema') h += '<div class="as-probar__resp"><p class="as-probar__tt">' + K.esc(r.tema.titulo) + ' <i>' + K.esc(r.tema.id) + ' · ' + Math.round(r.puntaje * 100) + '%</i></p><p>' + rico(r.tema.respuesta) + '</p>' +
        (r.tema.accion ? '<p class="as-probar__acc">' + K.icono('adelante', 14) + ' ' + K.esc(r.tema.accion) + '</p>' : '') + '</div>';
      h += '<ol class="as-probar__cand">' + r.candidatos.map(function (c) { return '<li>' + K.esc(c.tema.titulo) + ' <i>' + Math.round(c.puntaje * 100) + '%</i></li>'; }).join('') + '</ol>';
      res.innerHTML = h;
    }
    iQ.addEventListener('input', K.debounce(correr, 120));
    sV.addEventListener('change', correr); sE.addEventListener('change', correr);
    z.appendChild(f);
    correr();
    setTimeout(function () { iQ.focus(); }, 80);
  }

  window.ASISTENTE_ADMIN = {
    configurar: function (c) { C = c || {}; },
    vista: vista,
    /* 24/10 · entrega 8: el asistente de ADMIN trae aquí al DEV con la frase que no supo
       responder, para enseñársela en Probar (la vista se pinta al llegar) */
    probar: function (o) {
      o = o || {};
      F.pestana = 'probar';
      if (o.app) F.app = String(o.app).toUpperCase();
      if (o.frase !== undefined) PRUEBA.frase = String(o.frase || '');
      var vs = catalogo(F.app).vistas;
      PRUEBA.vista = o.vista && vs.indexOf(o.vista) >= 0 ? o.vista : (vs.indexOf('inicio') >= 0 ? 'inicio' : (vs[0] || 'inicio'));
      PRUEBA.estado = 'ACTIVO';
    },
    _datos: function () { return D; }
  };
}());
