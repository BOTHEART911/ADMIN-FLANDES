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

   Una llamada al entrar ('asistenteDatos'). Cada cambio sube el sello de
   la base de esa app: el teléfono la recibe en su siguiente apertura.
   Las preguntas que llegan son ANÓNIMAS (sin nombre ni documento).
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var O = window.OFICINA;
  var C = {};
  var D = null, HORA = null, CARGANDO = null;
  var F = { pestana: 'temas', app: 'CONTRATISTA', busca: '' };
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

  function recibir(d) {
    D = d || { temas: [], porEnsenar: [] };
    D.temas = (D.temas || []).map(function (t) { t._t = K.norm([t.id, t.titulo, t.vista, t.accion, (t.frases || []).join(' '), t.respuesta].join(' ')); return t; });
    HORA = new Date();
    MOTOR = {};
  }

  function cargar(fresco) {
    if (D && !fresco) return Promise.resolve(D);
    if (CARGANDO && !fresco) return CARGANDO;
    CARGANDO = O.leer('asistenteDatos').then(function (d) { CARGANDO = null; recibir(d); return D; }, function (e) { CARGANDO = null; throw e; });
    return CARGANDO;
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
      opciones: [{ valor: 'temas', texto: 'Temas' }, { valor: 'ensenar', texto: 'Por enseñar', tono: 'aviso' }, { valor: 'probar', texto: 'Probar' }],
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
      var r = D.resumen || {};
      resumen.innerHTML =
        '<span><b>' + K.numero(temasDe(F.app).length) + '</b> temas de ' + K.esc(NOMBRES[F.app] || F.app) + '</span>' +
        '<span><b>' + K.numero(r.total || 0) + '</b> preguntas</span>' +
        '<span><b>' + K.numero(r.resueltas || 0) + '</b> resueltas</span>' +
        '<span class="as-res--malo"><b>' + K.numero(r.porEnsenar || 0) + '</b> por enseñar</span>' +
        '<span>' + K.icono('pulgar-arriba', 14) + ' ' + K.numero(r.buenas || 0) + ' · ' + K.icono('pulgar-abajo', 14) + ' ' + K.numero(r.malas || 0) + '</span>' +
        (D.activas && D.activas.indexOf(F.app) < 0 ? '<span class="as-res--aviso">Esta app todavía no tiene el asistente en su pantalla</span>' : '') +
        (HORA ? '<span class="ct-sello">' + K.icono('reloj', 13) + ' Al día a las ' + K.esc(O.horaCorta(HORA)) + '</span>' : '');
      if (pP && pP.conteos) pP.conteos({ ensenar: (D.porEnsenar || []).filter(function (p) { return p.app === F.app; }).length, temas: temasDe(F.app).length });
      O.marcar(zP, F.pestana);
      cuerpo.innerHTML = '';
      if (F.pestana === 'ensenar') pintarEnsenar(cuerpo);
      else if (F.pestana === 'probar') pintarProbar(cuerpo);
      else pintarTemas(cuerpo);
    }
    REPINTAR = function () { pintarApps(); pintar(); };

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

  function editar(t, conFrase) {
    var nuevo = !t;
    var cat = catalogo(F.app);
    t = t || { id: '', app: F.app, vista: '', titulo: '', frases: conFrase ? [conFrase] : [], respuesta: '', accion: '', estado: '', activo: true, orden: '' };
    var cuerpo = K.nodo('<div class="tu-form as-form"></div>');
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
    iF.value = (t.frases || []).join('\n');
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
      titulo: nuevo ? 'Nuevo tema · ' + (NOMBRES[F.app] || F.app) : 'Editar tema · ' + t.id, cuerpo: cuerpo, ancha: true,
      botones: [
        { texto: 'Cancelar', al: function () { m.cerrar(); } },
        { texto: 'Guardar', icono: 'check', marca: true, al: guardar }
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
      K.pedir('asistenteTemaGuardar', { tema: tema }, { ms: 60000 }).then(function (r) {
        K.ocupado = false;
        m.cerrar();
        /* se parcha la lista en memoria: no se vuelve a pedir todo */
        var x = r.tema; x._t = K.norm([x.id, x.titulo, x.vista, x.accion, (x.frases || []).join(' '), x.respuesta].join(' '));
        var i = D.temas.findIndex(function (y) { return y.id === x.id; });
        if (i >= 0) D.temas[i] = x; else D.temas.push(x);
        Object.keys(r.sellos || {}).forEach(function (a) { D.sellos[a] = r.sellos[a]; });
        MOTOR = {};
        K.aviso(r.nuevo ? 'Tema creado. Llega a los teléfonos en su siguiente apertura.' : 'Tema guardado. Llega a los teléfonos en su siguiente apertura.', 'ok', 4000);
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
      D.porEnsenar = D.porEnsenar.filter(function (x) { return x.id !== p.id; });
      if (D.resumen) D.resumen.porEnsenar = Math.max(0, (D.resumen.porEnsenar || 1) - 1);
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
