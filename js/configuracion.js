/* ============================================================
   ADMIN-FLANDES · CONFIGURACIÓN DEL ECOSISTEMA
   Ecosistema Flandes · Fase 10 · entrega 10.1

   La cara de la hoja CONFIG. Nada se pide al abrir: todo vino con el
   arranque. Cada tarjeta es una llave y guarda sola ('configGuardar',
   una llamada), con motivo opcional que queda en la bitácora.

   Secciones (pastillas arriba, y cada una se puede abrir directo por
   #/configuracion/<sección>):
     · CALENDARIO ..... vigencia, festivos calculados por ley (con días
                         agregados o quitados a mano), día de corte de cada
                         mes y cierre de la vigencia
     · CATÁLOGOS ...... las listas que se escogen en Contratista y
                         Contratación (las que usa el código van con candado)
     · SUPERVISORES ... la hoja SUPERVISORES y su grupo de WhatsApp
     · GRUPOS Y CARPETAS  ids de grupo y carpetas de Drive con "Ir a carpeta"
     · PLANTILLAS ..... ids de las plantillas con "Ir a plantilla"
     · GUÍAS RÁPIDAS .. el PDF de cada app ("Descargar guía rápida") con
                         "Ir a guía"; el CORE exige PDF y lo comparte
     · MENSAJES Y AVISOS  el texto de cada aviso (push, WhatsApp, correo),
                         sus canales y los mensajes de identidad
     · MANTENIMIENTO .. modo mantenimiento, direcciones y versión de cada
                         app, medios, sonidos, claves, sesión y bot
     · MARCA .......... nombres y firmas que salen en los documentos
     · OTRAS LLAVES ... todo lo demás, con el editor según su tipo

   La validación de verdad la hace el CORE (tipo, forma del JSON, que la
   carpeta o la plantilla exista en Drive). Aquí se ayuda a no mandar
   basura, nada más.
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var C = {};
  var SECCION = 'calendario';
  var BUSCAR = '';

  var SECCIONES = [
    { id: 'calendario', t: 'Calendario', icono: 'reloj', p: 'La vigencia, los festivos (se calculan por ley y aquí agregas o quitas días), el día de corte de cada mes y el cierre de la vigencia. Mandan sobre las fechas de radicación que ve el contratista.' },
    { id: 'catalogos', t: 'Catálogos', icono: 'hoja', p: 'Las listas que se escogen en Contratista y Contratación. Las que usa el código tal cual (meses, estados de cuenta, tramos) van con candado.' },
    { id: 'supervisores', t: 'Supervisores', icono: 'persona', p: 'Los supervisores que se pueden escoger al crear un contrato, su celular, su firma y el grupo de WhatsApp al que les llegan los avisos.' },
    { id: 'grupos', t: 'Grupos y carpetas', icono: 'whatsapp', p: 'Los grupos de WhatsApp de cada área y las carpetas de Drive donde el sistema guarda. Pega el enlace o el id: el CORE comprueba que la carpeta exista.' },
    { id: 'plantillas', t: 'Plantillas', icono: 'documento', p: 'Las plantillas de Google con las que se generan los documentos. Pega el enlace o el id: el CORE comprueba que exista.' },
    { id: 'guias', t: 'Guías rápidas', icono: 'pdf', p: 'El PDF instructivo de cada app y de la web de Solicitud de Prensa: es lo que baja la opción "Descargar guía rápida" del menú. Para reemplazar una guía, sube el PDF nuevo a la carpeta GUÍAS RÁPIDAS y pega aquí su enlace o id: el CORE comprueba que sea un PDF y lo comparte con enlace. Las apps no se vuelven a publicar.' },
    { id: 'mensajes', t: 'Mensajes y avisos', icono: 'campana', p: 'Lo que dice cada aviso del ecosistema (push, WhatsApp y correo) y por qué canal sale. También los mensajes de alta, bienvenida y recuperación de contraseña.' },
    { id: 'mantenimiento', t: 'Mantenimiento', icono: 'candado', p: 'Cierra una app o todas con un mensaje (tú sigues entrando como DEV), las direcciones y la versión publicada de cada app, medios, sonidos, claves, sesión y bot.' },
    { id: 'marca', t: 'Marca', icono: 'lapiz', p: 'Nombres, NIT y firmas que salen en los documentos y en el pie de las siete apps.' },
    { id: 'otras', t: 'Otras llaves', icono: 'llave', p: 'El resto de CONFIG. Las contables y las de Tesorería se editan en su app; aquí solo si hace falta corregir el valor a mano.' }
  ];

  /* Llave -> [sección, etiqueta, editor]. Lo que no está aquí cae en OTRAS. */
  var CAT = {
    VIGENCIA: ['calendario', 'Vigencia (año)', 'numero'],
    SOLIDARIO_UMBRAL: ['calendario', 'Umbral del fondo de solidaridad pensional (IBC)', 'pesos'],
    LISTA_BANCOS: ['catalogos', 'Bancos', 'lista'],
    LISTA_EPS: ['catalogos', 'EPS', 'lista'],
    LISTA_AFP: ['catalogos', 'Fondos de pensiones (AFP)', 'lista'],
    LISTA_ARL: ['catalogos', 'Aseguradoras de riesgos (ARL)', 'lista'],
    LISTA_TIPOS_CONTRATO: ['catalogos', 'Tipos de contrato', 'lista'],
    LISTA_SECRETARIAS: ['catalogos', 'Secretarías', 'lista'],
    SITIOS_WEB: ['catalogos', 'Sitios web (Contratista)', 'json'],
    LISTA_MESES: ['catalogos', 'Meses', 'lista'],
    LISTA_ESTADOS_CUENTA: ['catalogos', 'Estados de la cuenta (en orden)', 'lista'],
    LISTA_TRAMOS: ['catalogos', 'Tramos del contrato', 'lista'],
    CARPETAS_SECRETARIA: ['grupos', 'Carpeta de cada secretaría', 'mapaCarpetas'],
    DRIVE_HACIENDA: ['grupos', 'Drive de Hacienda (Supervisión)', 'json'],
    GRUPO_CONTRATACION: ['grupos', 'Grupo de Contratación (cuentas que aprueba el supervisor y recordatorio de las revisadas)', 'grupo'],
    PLANTILLAS_ACTIVIDADES: ['plantillas', 'Actividades y evidencias según el número de obligaciones', 'tramosPlantilla'],
    CARPETA_GUIAS: ['guias', 'Carpeta GUÍAS RÁPIDAS (Drive)', 'carpeta'],
    CARPETA_TUTORIALES: ['grupos', 'Carpeta TUTORIALES EN VIDEO (videos y portadas del contratista)', 'carpeta'],
    GUIA_CONTRATISTA: ['guias', 'Guía de Contratista', 'guia'],
    GUIA_CONTRATACION: ['guias', 'Guía de Contratación', 'guia'],
    GUIA_SUPERVISION: ['guias', 'Guía de Supervisión', 'guia'],
    GUIA_CONTABILIDAD: ['guias', 'Guía de Contabilidad', 'guia'],
    GUIA_TESORERIA: ['guias', 'Guía de Tesorería', 'guia'],
    GUIA_COMUNICACIONES: ['guias', 'Guía de Comunicaciones', 'guia'],
    GUIA_ADMIN: ['guias', 'Guía de Admin', 'guia'],
    GUIA_SOLICITUD_PRENSA: ['guias', 'Guía de la web Solicitud de Prensa', 'guia'],
    MENSAJE_BIENVENIDA: ['mensajes', 'Mensaje de bienvenida', 'largo'],
    MENSAJE_ALTA: ['mensajes', 'Mensaje de alta y de contraseña reiniciada', 'largo'],
    MENSAJE_RECUPERAR: ['mensajes', 'Mensaje de "Olvidé mi contraseña"', 'largo'],
    CANAL_POR_DEFECTO: ['mensajes', 'Canal por defecto del contratista', 'canal'],
    NOTIFICAR_VENTANA_HORAS: ['mensajes', 'Horas en que un aviso repetido no se vuelve a mandar', 'numero'],
    RESPALDO_WHATSAPP: ['mensajes', 'Si el push no llega, mandar por WhatsApp', 'booleano'],
    PUSH_ACTIVO: ['mensajes', 'Notificaciones push encendidas', 'booleano'],
    CORREO_ACTIVO: ['mensajes', 'Correo encendido', 'booleano'],
    CORREO_RESERVA: ['mensajes', 'Correos que se guardan de reserva cada día', 'numero'],
    CORREO_REMITENTE_NOMBRE: ['mensajes', 'Nombre del remitente del correo', 'texto'],
    BOT_SILENCIO: ['mensajes', 'Bot en silencio (no sale ningún WhatsApp ni correo)', 'booleano'],
    AVISO_CIERRE_63: ['mensajes', 'Avisar a Contabilidad al cerrar el plan de pagos', 'sino'],
    AVISO_ORDEN_7: ['mensajes', 'Avisar al contratista al crear la orden de pago', 'sino'],
    AVISO_TESORERIA_8: ['mensajes', 'Avisar al contratista en egreso y pago', 'sino'],
    APPS_URLS: ['mantenimiento', 'Dirección de cada app', 'mapaApps'],
    MEDIOS_BASE: ['mantenimiento', 'Dirección de los medios (ALCALDIA-MEDIOS)', 'texto'],
    SONIDOS: ['mantenimiento', 'Sonidos de las apps', 'mapaSonidos'],
    AUDIOS_GUIA: ['mantenimiento', 'Audios guía', 'mapaSonidos'],
    BOT_API_URL: ['mantenimiento', 'BuilderBot: dirección de envío', 'texto'],
    BOT_API_KEY: ['mantenimiento', 'BuilderBot: llave', 'secreta'],
    VOZ_ON: ['mantenimiento', 'Voz de Insights encendida', 'sino'],
    VOZ_CLAVE: ['mantenimiento', 'Voz (Inworld): clave', 'secreta'],
    VOZ_ID: ['mantenimiento', 'Voz: nombre de la voz', 'texto'],
    VOZ_MODELO: ['mantenimiento', 'Voz: modelo', 'texto'],
    VOZ_IDIOMA: ['mantenimiento', 'Voz: idioma', 'texto'],
    VOZ_VELOCIDAD: ['mantenimiento', 'Voz: velocidad (0,5 a 1,5)', 'numero'],
    VOZ_ENTREGA: ['mantenimiento', 'Voz: modo de entrega', 'texto'],
    VOZ_CUOTA: ['mantenimiento', 'Voz: caracteres por persona al día', 'numero'],
    FIREBASE_WEB: ['mantenimiento', 'Firebase: configuración web', 'json'],
    FIREBASE_VAPID: ['mantenimiento', 'Firebase: llave VAPID', 'texto'],
    SESION_HORAS: ['mantenimiento', 'Horas que dura una sesión', 'numero'],
    INTENTOS_MAX: ['mantenimiento', 'Intentos antes de bloquear', 'numero'],
    BLOQUEO_MINUTOS: ['mantenimiento', 'Minutos de bloqueo', 'numero'],
    CLAVE_MINIMA: ['mantenimiento', 'Largo mínimo de la contraseña', 'numero'],
    MEDICION_ACTIVA: ['mantenimiento', 'Medir el tiempo de cada llamada', 'booleano'],
    MARCA_MUNICIPIO: ['marca', 'Municipio', 'texto'],
    MARCA_NIT: ['marca', 'NIT', 'texto'],
    MARCA_ALCALDESA: ['marca', 'Alcaldesa (firma la orden y el egreso)', 'texto'],
    MARCA_SECRETARIA_HACIENDA: ['marca', 'Secretaria de Hacienda (firma el egreso)', 'texto'],
    MARCA_AUTOR: ['marca', 'Autor (pie de las apps)', 'texto'],
    MARCA_AUTOR_FRASE: ['marca', 'Frase bajo el autor', 'texto']
  };

  /* Llaves que tienen su propia pantalla y no se pintan sueltas */
  var PROPIAS = ['FESTIVOS', 'FESTIVOS_AJUSTES', 'CORTES_POR_MES', 'CIERRE_VIGENCIA', 'MANTENIMIENTO', 'GRUPOS_SUPERVISOR',
                 'PLANTILLAS', 'CANALES_POR_TIPO', 'SUPERVISION_ALCANCE', 'DECISION_USUARIOS',
                 /* 10.3 · tienen su propia vista: RECORDATORIOS */
                 'RECORDATORIOS', 'NOTIFICACION_FINAL',
                 /* ajuste 4 · el interruptor vive en su vista: TUTORIALES EN VIDEO (no deja encender sin videos) */
                 'TUTORIALES_ACTIVO'];
  var DE_OTRA_APP = { RETENCIONES: 'Contabilidad y Tesorería', CUENTAS_CONTABLES: 'Contabilidad', CUENTA_BANCO_EGRESO: 'Tesorería', CONTABLE_REGLAS: 'Contabilidad',
                      CONTABLE_CATALOGO: 'Contabilidad', DESTINACIONES: 'Tesorería', EGRESO_FIRMANTES: 'Tesorería', EGRESO_REGLAS: 'Tesorería', EMBARGOS: 'Tesorería' };

  var TIPOS_AVISO = {
    CUENTA_RADICADA: 'Cuenta radicada', CUENTA_VISTO_BUENO: 'Visto bueno del revisor', CUENTA_REVISADA_SUPERVISOR: 'Revisada por el supervisor',
    CUENTA_INCOMPLETA: 'Cuenta incompleta', CUENTA_APROBADA: 'Cuenta aprobada (hacer plan de pagos)', CUENTA_DEVUELTA: 'Cuenta devuelta',
    CUENTA_EN_CONTABILIDAD: 'Cuenta en Contabilidad', ORDEN_PAGO: 'Orden de pago', EGRESO: 'Egreso', PAGO: 'Pago',
    CONTRATO_NUEVO: 'Contrato nuevo', CLAVE_RECUPERADA: 'Contraseña recuperada', USUARIO_ALTA: 'Alta de usuario',
    CONTRATO_ADICION: 'Adición del contrato', CONTRATO_CESION: 'Cesión del contrato', CONTRATO_SUSPENSION: 'Suspensión del contrato',
    REQUERIMIENTO: 'Requerimiento de la oficina', CONTRATO_OTROSI: 'Otrosí del contrato', PLAN_POR_CORREGIR: 'Plan de pagos por corregir',
    SOLICITUD_COMUNICACIONES: 'Solicitud a Comunicaciones',
    CONTRATO_NOTIFICADO: 'Notificación final (descargar la certificación)'
  };
  var MARCADORES = '{nombre} {contrato} {informe} {estado} {valor} {observacion} {supervisor} {secretaria} {orden} {egreso} {fecha} {app} {clave} {codigo} {evento} {asignados} {hasta}';

  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var APPS_MANT = ['CONTRATISTA', 'CONTRATACION', 'SUPERVISION', 'CONTABILIDAD', 'TESORERIA', 'COMUNICACIONES'];

  function O() { return window.OFICINA; }
  function D() { return C.datos ? C.datos() : {}; }
  function cfg() { return D().cfg || []; }
  function item(llave) { var l = cfg(); for (var i = 0; i < l.length; i++) if (l[i].llave === llave) return l[i]; return null; }
  function valorJson(llave, def) { var it = item(llave); if (!it) return def; try { return it.valor ? JSON.parse(it.valor) : def; } catch (e) { return def; } }
  function copia(x) { return JSON.parse(JSON.stringify(x === undefined ? null : x)); }
  function seccionDe(llave) {
    if (CAT[llave]) return CAT[llave][0];
    if (PROPIAS.indexOf(llave) >= 0) return '';
    if (/^GRUPO_/.test(llave) || /^CARPETA_/.test(llave)) return 'grupos';
    if (/^PLANTILLA_/.test(llave)) return 'plantillas';
    return 'otras';
  }
  function etiqueta(llave) {
    if (CAT[llave]) return CAT[llave][1];
    return llave.replace(/_/g, ' ').toLowerCase().replace(/^./, function (c) { return c.toUpperCase(); });
  }
  function editorDe(it) {
    if (it.secreta) return 'secreta';
    if (CAT[it.llave]) return CAT[it.llave][2];
    if (/^CARPETA_/.test(it.llave)) return 'carpeta';
    if (/^PLANTILLA_/.test(it.llave)) return 'plantilla';
    if (/^GRUPO_/.test(it.llave)) return 'grupo';
    if (it.tipo === 'NUMERO') return 'numero';
    if (it.tipo === 'BOOLEANO') return 'booleano';
    if (it.tipo === 'JSON') return 'json';
    if (/^(SI|NO)$/.test(it.valor)) return 'sino';
    return String(it.valor).length > 90 || /\n/.test(it.valor) ? 'largo' : 'texto';
  }
  function urlDrive(id, carpeta) {
    return carpeta ? 'https://drive.google.com/drive/folders/' + encodeURIComponent(id) : 'https://drive.google.com/open?id=' + encodeURIComponent(id);
  }
  function idDe(t) {
    var s = String(t || '').trim();
    var m = /\/folders\/([\w-]{15,})/.exec(s) || /\/d\/([\w-]{15,})/.exec(s) || /[?&]id=([\w-]{15,})/.exec(s);
    return m ? m[1] : s;
  }

  /* ══════════════ la vista ══════════════ */

  function vista(sub) {
    if (sub && SECCIONES.some(function (s) { return s.id === sub; })) SECCION = sub;
    var caja = K.nodo('<div class="kit-ancho vista cf ad"></div>');
    C.app.appendChild(caja);
    O().cabecera(caja, 'herramienta', 'CONFIGURACIÓN DEL ECOSISTEMA',
      'Todo lo que las siete apps leen de la hoja CONFIG, ordenado. Cada cambio se valida en el CORE y queda en la <b>bitácora</b> con quién, cuándo, antes, después y motivo.');

    var b = O().barra({ placeholder: 'Buscar una llave (nombre, grupo, descripción)', valor: BUSCAR,
      alBuscar: function (t) { BUSCAR = t; pintar(); },
      alRefrescar: function () { return C.recargar().then(pintar); } });
    caja.appendChild(b.caja);
    var zp = K.nodo('<div class="ad-pastillas"></div>');
    caja.appendChild(zp);
    var zona = K.nodo('<div class="cf-zona ad-zona"></div>');
    caja.appendChild(zona);
    K.piezas.creditos.montar(caja);

    var pas = K.piezas.pastillas.montar(zp, {
      opciones: SECCIONES.map(function (s) { return { valor: s.id, texto: s.t }; }),
      valor: SECCION,
      alCambiar: function (v) { SECCION = v || 'calendario'; history.replaceState(null, '', '#/configuracion/' + SECCION); pintar(); if (window.AYUDA) window.AYUDA.montar('configuracion'); }
    });

    function pintar() {
      zona.innerHTML = '';
      if (BUSCAR) { pintarBusqueda(zona); return; }
      var s = SECCIONES.filter(function (x) { return x.id === SECCION; })[0] || SECCIONES[0];
      zona.appendChild(K.nodo('<p class="formulario__nota ad-sec-nota">' + K.icono(s.icono, 15) + ' ' + K.esc(s.p) + '</p>'));
      if (SECCION === 'calendario') { zona.appendChild(bloqueFestivos()); zona.appendChild(bloqueCortes()); zona.appendChild(bloqueCierre()); }
      if (SECCION === 'supervisores') zona.appendChild(bloqueSupervisores());
      if (SECCION === 'mensajes') zona.appendChild(bloqueAvisos());
      if (SECCION === 'mantenimiento') { zona.appendChild(bloqueMantenimiento()); }
      var llaves = cfg().filter(function (it) { return seccionDe(it.llave) === SECCION; });
      if (SECCION === 'catalogos') llaves.sort(function (a, b) { return (a.bloqueada ? 1 : 0) - (b.bloqueada ? 1 : 0); });
      if (llaves.length) {
        var g = K.nodo('<div class="ad-llaves"></div>');
        llaves.forEach(function (it) { g.appendChild(tarjeta(it)); });
        zona.appendChild(g);
      }
    }
    pintar();
    vista._repintar = pintar;
    vista._pastillas = pas;
  }

  function pintarBusqueda(zona) {
    var q = K.norm(BUSCAR);
    var l = cfg().filter(function (it) {
      return K.norm(it.llave + ' ' + etiqueta(it.llave) + ' ' + it.grupo + ' ' + it.descripcion).indexOf(q) >= 0;
    });
    zona.appendChild(K.nodo('<p class="formulario__nota">' + K.numero(l.length) + (l.length === 1 ? ' llave encontrada' : ' llaves encontradas') + '.</p>'));
    if (!l.length) { zona.appendChild(O().vacio('Ninguna llave coincide.', function () { BUSCAR = ''; vista._repintar(); })); return; }
    var g = K.nodo('<div class="ad-llaves"></div>');
    l.forEach(function (it) {
      if (PROPIAS.indexOf(it.llave) >= 0) {
        var s = { FESTIVOS: 'calendario', FESTIVOS_AJUSTES: 'calendario', CORTES_POR_MES: 'calendario', CIERRE_VIGENCIA: 'calendario', MANTENIMIENTO: 'mantenimiento',
                  GRUPOS_SUPERVISOR: 'supervisores', PLANTILLAS: 'mensajes', CANALES_POR_TIPO: 'mensajes' }[it.llave];
        var t = K.nodo('<article class="kit-tarjeta cf-item ad-llave ad-llave--propia"><div class="cf-item__cab"><b></b><code></code></div><p class="formulario__nota"></p></article>');
        t.querySelector('b').textContent = etiqueta(it.llave);
        t.querySelector('code').textContent = it.llave;
        var rc = it.llave === 'RECORDATORIOS' || it.llave === 'NOTIFICACION_FINAL';
        t.querySelector('p').textContent = rc ? 'Tiene su propia pantalla: RECORDATORIOS.' : (s ? 'Tiene su propia pantalla en ' + (SECCIONES.filter(function (x) { return x.id === s; })[0] || {}).t + '.' : 'Se edita en USUARIOS Y ROLES (tarjeta de cada REVISOR).');
        var ir = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('adelante', 14) + ' Ir</button>');
        ir.addEventListener('click', function () { BUSCAR = ''; if (rc) C.irA('recordatorios'); else if (s) { SECCION = s; C.irA('configuracion/' + s); } else C.irA('usuarios'); });
        t.appendChild(ir);
        g.appendChild(t);
      } else g.appendChild(tarjeta(it));
    });
    zona.appendChild(g);
  }

  /* ══════════════ guardar una llave ══════════════ */

  function guardarLlave(llave, valor, motivo, boton, textos) {
    if (boton) boton.disabled = true;
    return K.piezas.guardado.mientras(K.pedir('configGuardar', { llave: llave, valor: valor, motivo: motivo || '' }, { ms: 60000 }), {
      titulo: (textos && textos.titulo) || 'Guardando ' + etiqueta(llave), sub: 'Vale para las siete apps desde ya.',
      pasos: ['Validando en el CORE…', 'Guardando en CONFIG…', 'Apuntando en la bitácora…'], listo: { titulo: 'Guardado', paso: 'Queda en la bitácora' }
    }).then(function (r) {
      if (r && r.sinCambio) K.aviso('No había nada que cambiar.', 'info', 2500);
      if (r && r.item) C.llave(r.item);
      if (r && r.bitacora) C.bitacora(r.bitacora);
      if (r && r.festivos) C.festivos(r.festivos);
      if (vista._repintar) vista._repintar();
      return r;
    }, function (e) { if (boton) boton.disabled = false; K.aviso((e && e.message) || 'No se pudo guardar.', 'malo', 8000); throw e; });
  }

  /** Pie común: motivo + Guardar. estaCambiado() dice si hay algo que guardar; valor() lo que se manda. */
  function pieGuardar(t, llave, valor, estaCambiado) {
    var pie = K.nodo('<div class="ad-pie" hidden>' +
      '<label class="op-campo ad-motivo"><span>Motivo del cambio (queda en la bitácora)</span><input type="text" maxlength="300" placeholder="Opcional"></label>' +
      '<div class="ct-acc"><button type="button" class="kit-btn kit-btn--plano ad-deshacer">' + K.icono('girar', 14) + ' Deshacer</button>' +
      '<button type="button" class="kit-btn kit-btn--marca ad-guardar">' + K.icono('check', 16) + ' Guardar</button></div></div>');
    var bG = pie.querySelector('.ad-guardar');
    bG.addEventListener('click', function () {
      var v;
      try { v = valor(); } catch (e) { K.aviso(e.message || 'Revisa el valor.', 'aviso', 5000); return; }
      guardarLlave(llave, v, pie.querySelector('input').value.trim(), bG)['catch'](function () {});
    });
    pie.querySelector('.ad-deshacer').addEventListener('click', function () { if (vista._repintar) vista._repintar(); });
    t.appendChild(pie);
    return function () { pie.hidden = !estaCambiado(); };
  }

  /* ══════════════ la tarjeta de una llave ══════════════ */

  function tarjeta(it) {
    var ed = editorDe(it);
    var t = K.nodo('<article class="kit-tarjeta cf-item ad-llave' + (it.bloqueada ? ' ad-llave--bloq' : '') + '">' +
      '<div class="cf-item__cab"><b></b><code class="ad-llave__k"></code></div></article>');
    t.querySelector('b').innerHTML = (it.bloqueada ? K.icono('candado', 14) + ' ' : '') + K.esc(etiqueta(it.llave));
    t.querySelector('code').textContent = it.llave + (it.publica ? ' · pública' : '');
    if (it.descripcion) t.appendChild(K.nodo('<p class="formulario__nota ad-llave__d">' + K.esc(it.descripcion) + '</p>'));
    if (DE_OTRA_APP[it.llave]) t.appendChild(K.nodo('<p class="formulario__nota formulario__nota--fuerte">' + K.icono('info', 14) + ' Se edita en ' + K.esc(DE_OTRA_APP[it.llave]) + '. Aquí solo si hace falta corregir el valor a mano.</p>'));
    if (it.bloqueada) {
      var v = K.nodo('<div class="cf-chips ad-solo"></div>');
      var lst = null; try { lst = JSON.parse(it.valor); } catch (e) {}
      if (lst instanceof Array) lst.forEach(function (x) { v.appendChild(K.nodo('<span class="kit-pastilla" aria-pressed="false">' + K.esc(typeof x === 'string' ? x : JSON.stringify(x)) + '</span>')); });
      else v.appendChild(K.nodo('<pre class="ad-json ad-json--solo">' + K.esc(bonito(it.valor)) + '</pre>'));
      t.appendChild(v);
      t.appendChild(K.nodo('<p class="formulario__nota">El código de las apps depende de este valor tal cual: se cambia solo con una entrega.</p>'));
      return t;
    }
    var E = EDITORES[ed] || EDITORES.texto;
    E(t, it);
    return t;
  }

  function bonito(v) { try { return JSON.stringify(JSON.parse(v), null, 2); } catch (e) { return String(v || ''); } }

  function campoTexto(t, it, opc) {
    opc = opc || {};
    var inp = K.nodo(opc.largo ? '<textarea class="ad-in" rows="' + (opc.filas || 5) + '"></textarea>' : '<input class="ad-in" type="text">');
    if (opc.inputmode) inp.setAttribute('inputmode', opc.inputmode);
    inp.value = opc.inicial !== undefined ? opc.inicial : it.valor;
    t.appendChild(inp);
    var extra = opc.extra ? opc.extra(inp) : null;
    if (extra) t.appendChild(extra);
    var refrescar = pieGuardar(t, it.llave, function () { return opc.valor ? opc.valor(inp.value) : inp.value; },
      function () { return inp.value !== (opc.inicial !== undefined ? opc.inicial : it.valor); });
    inp.addEventListener('input', refrescar);
    return inp;
  }

  var EDITORES = {
    texto: function (t, it) { campoTexto(t, it); },
    largo: function (t, it) {
      campoTexto(t, it, { largo: true, filas: 6, extra: function () { return /^MENSAJE_/.test(it.llave) ? K.nodo('<p class="formulario__nota">Marcadores: ' + K.esc(it.llave === 'MENSAJE_BIENVENIDA' ? '{nombre} {app} {enlace} {documento} {clave}' : '{nombre} {app} {clave}') + '</p>') : null; } });
    },
    numero: function (t, it) {
      campoTexto(t, it, { inputmode: 'decimal', valor: function (v) { if (!/^-?\d+([.,]\d+)?$/.test(String(v).trim())) throw new Error('Escribe solo el número.'); return String(v).trim(); } });
    },
    pesos: function (t, it) {
      campoTexto(t, it, { inputmode: 'numeric', inicial: K.pesos ? K.pesos(Number(it.valor) || 0) : it.valor,
        valor: function (v) { var n = String(v).replace(/\D/g, ''); if (!n) throw new Error('Escribe el valor.'); return n; } });
    },
    booleano: function (t, it) { interruptor(t, it, it.valor === 'SI' || it.valor === 'true', function (on) { return on; }); },
    sino: function (t, it) { interruptor(t, it, it.valor === 'SI', function (on) { return on ? 'SI' : 'NO'; }); },
    canal: function (t, it) {
      var s = K.nodo('<select class="op-select ad-in"></select>');
      [['AMBOS', 'WhatsApp y correo'], ['WHATSAPP', 'Solo WhatsApp'], ['CORREO', 'Solo correo']].forEach(function (o) {
        var x = document.createElement('option'); x.value = o[0]; x.textContent = o[1]; if (o[0] === it.valor) x.selected = true; s.appendChild(x);
      });
      t.appendChild(s);
      var r = pieGuardar(t, it.llave, function () { return s.value; }, function () { return s.value !== it.valor; });
      s.addEventListener('change', r);
    },
    secreta: function (t, it) {
      t.appendChild(K.nodo('<p class="ad-secreta">' + K.icono('candado', 14) + ' Guardada: <code>' + K.esc(it.valor || '(vacía)') + '</code></p>'));
      campoTexto(t, it, { inicial: '', extra: function (inp) { inp.placeholder = 'Pega la llave nueva completa para reemplazarla'; inp.type = 'password'; inp.autocomplete = 'off'; return null; } });
    },
    grupo: function (t, it) {
      campoTexto(t, it, { extra: function (inp) {
        var b = K.nodo('<button type="button" class="kit-btn kit-btn--plano ad-mini">' + K.icono('copiar', 14) + ' Copiar id</button>');
        b.addEventListener('click', function () { copiar(inp.value); });
        return b;
      } });
    },
    carpeta: function (t, it) { campoDrive(t, it, true); },
    plantilla: function (t, it) { campoDrive(t, it, false); },
    guia: function (t, it) { campoDrive(t, it, false, 'guia'); },
    lista: function (t, it) { editorLista(t, it); },
    json: function (t, it) { editorJson(t, it); },
    mapaCarpetas: function (t, it) { editorMapa(t, it, { clave: 'Secretaría', valor: 'Carpeta (enlace o id)', carpeta: true }); },
    mapaApps: function (t, it) { editorMapa(t, it, { clave: 'App', valor: 'Dirección (https://…)', apps: true }); },
    mapaSonidos: function (t, it) { editorMapa(t, it, { clave: 'Nombre', valor: 'Dirección del audio (https://…)', sonar: true }); },
    tramosPlantilla: function (t, it) { editorTramos(t, it); }
  };

  function interruptor(t, it, actual, aValor) {
    var l = K.nodo('<label class="op-check cf-sw ad-sw"><input type="checkbox"><span></span></label>');
    var inp = l.querySelector('input');
    inp.checked = !!actual;
    l.querySelector('span').textContent = actual ? 'Encendido' : 'Apagado';
    t.appendChild(l);
    var r = pieGuardar(t, it.llave, function () { return aValor(inp.checked); }, function () { return inp.checked !== !!actual; });
    inp.addEventListener('change', function () { l.querySelector('span').textContent = inp.checked ? 'Encendido' : 'Apagado'; r(); });
  }

  function campoDrive(t, it, esCarpeta, clase) {
    campoTexto(t, it, { extra: function (inp) {
      var fila = K.nodo('<div class="ct-acc ad-drive"></div>');
      var ir = K.nodo('<a class="kit-btn kit-btn--plano ad-mini" target="_blank" rel="noopener">' + K.icono(esCarpeta ? 'archivo' : (clase === 'guia' ? 'pdf' : 'documento'), 14) + ' ' + (esCarpeta ? 'Ir a carpeta' : (clase === 'guia' ? 'Ir a guía' : 'Ir a plantilla')) + '</a>');
      function poner() { var id = idDe(inp.value); if (id) { ir.href = urlDrive(id, esCarpeta); ir.removeAttribute('aria-disabled'); } else { ir.removeAttribute('href'); ir.setAttribute('aria-disabled', 'true'); } }
      poner();
      inp.addEventListener('input', poner);
      fila.appendChild(ir);
      return fila;
    }, valor: function (v) { return idDe(v); } });
  }

  /* ── lista de textos (chips) ── */
  function editorLista(t, it) {
    var orig = []; try { orig = JSON.parse(it.valor) || []; } catch (e) {}
    var lista = orig.slice();
    var chips = K.nodo('<div class="cf-chips ad-chips"></div>');
    var add = K.nodo('<div class="ad-add"><input class="ad-in" type="text" maxlength="120" placeholder="Agregar a la lista"><button type="button" class="kit-btn kit-btn--plano ad-mini">' + K.icono('mas', 14) + ' Agregar</button></div>');
    t.appendChild(chips); t.appendChild(add);
    var r = pieGuardar(t, it.llave, function () { return JSON.stringify(lista); }, function () { return JSON.stringify(lista) !== JSON.stringify(orig); });
    function pintar() {
      chips.innerHTML = '';
      lista.forEach(function (x, i) {
        var c = K.nodo('<span class="kit-pastilla ad-chip" aria-pressed="false"><span></span><button type="button" aria-label="Quitar">' + K.icono('cerrar', 12) + '</button></span>');
        c.querySelector('span').textContent = x;
        c.querySelector('button').addEventListener('click', function () { lista.splice(i, 1); pintar(); r(); });
        chips.appendChild(c);
      });
      chips.appendChild(K.nodo('<small class="ad-cuenta">' + lista.length + '</small>'));
    }
    function agregar() {
      var inp = add.querySelector('input'), v = inp.value.trim().toUpperCase();
      if (!v) return;
      if (lista.some(function (x) { return K.norm(x) === K.norm(v); })) { K.aviso('"' + v + '" ya está en la lista.', 'aviso', 3000); return; }
      lista.push(v); inp.value = ''; pintar(); r();
    }
    add.querySelector('button').addEventListener('click', agregar);
    add.querySelector('input').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); agregar(); } });
    pintar();
  }

  /* ── JSON a mano ── */
  function editorJson(t, it) {
    var ta = K.nodo('<textarea class="ad-in ad-json" rows="8" spellcheck="false"></textarea>');
    ta.value = bonito(it.valor);
    var est = K.nodo('<p class="formulario__nota ad-json__est"></p>');
    t.appendChild(ta); t.appendChild(est);
    if (it.llave === 'DRIVE_HACIENDA') {
      var ir = K.nodo('<a class="kit-btn kit-btn--plano ad-mini" target="_blank" rel="noopener">' + K.icono('archivo', 14) + ' Ir a carpeta</a>');
      try { ir.href = urlDrive(JSON.parse(it.valor).carpeta, true); t.appendChild(ir); } catch (e) {}
    }
    var r = pieGuardar(t, it.llave, function () { var o = JSON.parse(ta.value); return JSON.stringify(o); },
      function () { try { return JSON.stringify(JSON.parse(ta.value)) !== JSON.stringify(JSON.parse(it.valor || 'null')); } catch (e) { return true; } });
    ta.addEventListener('input', function () {
      try { JSON.parse(ta.value); est.textContent = ''; est.classList.remove('ad-malo'); } catch (e) { est.textContent = 'El JSON no se puede leer: ' + e.message; est.classList.add('ad-malo'); }
      r();
    });
  }

  /* ── mapa nombre -> valor ── */
  function editorMapa(t, it, o) {
    var orig = {}; try { orig = JSON.parse(it.valor) || {}; } catch (e) {}
    var filas = Object.keys(orig).map(function (k) { return { k: k, v: String(orig[k]) }; });
    var z = K.nodo('<div class="ad-mapa"></div>');
    t.appendChild(z);
    var mas = K.nodo('<button type="button" class="kit-btn kit-btn--plano ad-mini">' + K.icono('mas', 14) + ' Agregar fila</button>');
    t.appendChild(mas);
    function actual() { var m = {}; filas.forEach(function (f) { if (String(f.k).trim()) m[String(f.k).trim()] = o.carpeta ? idDe(f.v) : String(f.v).trim(); }); return m; }
    var r = pieGuardar(t, it.llave, function () {
      var m = actual();
      if (o.apps || o.sonar) for (var k in m) if (!/^https:\/\/\S+$/.test(m[k])) throw new Error('La dirección de ' + k + ' debe empezar por https://');
      return JSON.stringify(m);
    }, function () { return JSON.stringify(actual()) !== JSON.stringify(orig); });
    function pintar() {
      z.innerHTML = '';
      filas.forEach(function (f, i) {
        var fila = K.nodo('<div class="ad-mapa__f"><input class="ad-in ad-mapa__k" type="text"><input class="ad-in ad-mapa__v" type="text"><span class="ad-mapa__acc"></span></div>');
        var ik = fila.querySelector('.ad-mapa__k'), iv = fila.querySelector('.ad-mapa__v'), acc = fila.querySelector('.ad-mapa__acc');
        ik.value = f.k; iv.value = f.v; ik.placeholder = o.clave; iv.placeholder = o.valor;
        ik.addEventListener('input', function () { f.k = ik.value; r(); });
        iv.addEventListener('input', function () { f.v = iv.value; r(); poner(); });
        var ir = null;
        if (o.carpeta || o.apps) {
          ir = K.nodo('<a class="kit-btn kit-btn--plano ad-mini" target="_blank" rel="noopener" title="' + (o.carpeta ? 'Ir a carpeta' : 'Abrir la app') + '">' + K.icono(o.carpeta ? 'archivo' : 'abrir-pestana', 14) + '</a>');
          acc.appendChild(ir);
        }
        if (o.apps) {
          var ver = K.nodo('<small class="ad-ver"></small>');
          var vv = (C.versiones && C.versiones()[f.k]) || '';
          ver.textContent = vv ? 'v ' + vv : '';
          acc.appendChild(ver);
        }
        if (o.sonar) {
          var pl = K.nodo('<button type="button" class="kit-btn kit-btn--plano ad-mini" title="Escuchar">' + K.icono('play', 14) + '</button>');
          pl.addEventListener('click', function () { try { new Audio(iv.value).play()['catch'](function () { K.aviso('No se pudo reproducir: revisa la dirección.', 'malo', 4000); }); } catch (e) {} });
          acc.appendChild(pl);
        }
        var q = K.nodo('<button type="button" class="kit-btn kit-btn--plano ad-mini cf-quitar" title="Quitar fila">' + K.icono('basura', 14) + '</button>');
        q.addEventListener('click', function () { filas.splice(i, 1); pintar(); r(); });
        acc.appendChild(q);
        function poner() { if (!ir) return; var val = iv.value.trim(); ir.href = o.carpeta ? urlDrive(idDe(val), true) : val; }
        poner();
        z.appendChild(fila);
      });
    }
    mas.addEventListener('click', function () { filas.push({ k: '', v: '' }); pintar(); var ult = z.querySelector('.ad-mapa__f:last-child .ad-mapa__k'); if (ult) ult.focus(); });
    pintar();
  }

  /* ── PLANTILLAS_ACTIVIDADES: [{hasta, actividades, evidencias}] ── */
  function editorTramos(t, it) {
    var orig = []; try { orig = JSON.parse(it.valor) || []; } catch (e) {}
    var l = copia(orig);
    var z = K.nodo('<div class="ad-mapa"></div>');
    t.appendChild(z);
    var r = pieGuardar(t, it.llave, function () {
      l.forEach(function (x) { x.hasta = Number(x.hasta) || 0; x.actividades = idDe(x.actividades); x.evidencias = idDe(x.evidencias); if (!x.hasta || !x.actividades || !x.evidencias) throw new Error('Cada fila necesita hasta cuántas obligaciones y las dos plantillas.'); });
      return JSON.stringify(l);
    }, function () { return JSON.stringify(l) !== JSON.stringify(orig); });
    l.forEach(function (x) {
      var f = K.nodo('<div class="ad-tramo"><label class="op-campo"><span>Hasta (obligaciones)</span><input class="ad-in" inputmode="numeric" maxlength="3"></label>' +
        '<label class="op-campo"><span>Actividades</span><input class="ad-in ad-a"></label><label class="op-campo"><span>Evidencias</span><input class="ad-in ad-e"></label>' +
        '<span class="ad-mapa__acc"></span></div>');
      var ih = f.querySelector('input'), ia = f.querySelector('.ad-a'), ie = f.querySelector('.ad-e'), acc = f.querySelector('.ad-mapa__acc');
      ih.value = x.hasta; ia.value = x.actividades; ie.value = x.evidencias;
      var irA = K.nodo('<a class="kit-btn kit-btn--plano ad-mini" target="_blank" rel="noopener">' + K.icono('documento', 14) + ' Actividades</a>');
      var irE = K.nodo('<a class="kit-btn kit-btn--plano ad-mini" target="_blank" rel="noopener">' + K.icono('imagen', 14) + ' Evidencias</a>');
      function poner() { irA.href = urlDrive(idDe(ia.value), false); irE.href = urlDrive(idDe(ie.value), false); }
      poner();
      acc.appendChild(irA); acc.appendChild(irE);
      ih.addEventListener('input', function () { x.hasta = ih.value.replace(/\D/g, ''); ih.value = x.hasta; r(); });
      ia.addEventListener('input', function () { x.actividades = ia.value.trim(); poner(); r(); });
      ie.addEventListener('input', function () { x.evidencias = ie.value.trim(); poner(); r(); });
      z.appendChild(f);
    });
  }

  function copiar(texto) {
    var ok = function () { K.aviso('Copiado.', 'ok', 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(String(texto || '')).then(ok, function () { K.aviso('No se pudo copiar.', 'malo', 3000); });
    else { var ta = document.createElement('textarea'); ta.value = texto; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) {} document.body.removeChild(ta); }
  }

  /* ══════════════ CALENDARIO ══════════════ */

  function seccion(icono, titulo, texto) {
    return K.nodo('<section class="kit-tarjeta grupo cf-bloque ad-bloque"><h3 class="grupo__t">' + K.icono(icono, 16) + ' ' + K.esc(titulo) + '</h3>' +
      (texto ? '<p class="formulario__nota">' + texto + '</p>' : '') + '</section>');
  }

  var DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  function diaSemana(f) { var p = f.split('/'); return DIAS[new Date(+p[2], +p[1] - 1, +p[0]).getDay()]; }

  function bloqueFestivos() {
    var f = D().festivos || { detalle: [], ajustes: { agregar: [], quitar: [] }, vigencia: '' };
    var aj = copia(f.ajustes || { agregar: [], quitar: [] });
    var origen = JSON.stringify(aj);
    var s = seccion('reloj', 'FESTIVOS ' + f.vigencia + ' Y ' + (Number(f.vigencia) + 1),
      'Se calculan <b>por ley</b> (fijos, Ley Emiliani y los que dependen de la Semana Santa) para la vigencia y la siguiente. Si un día de ley no aplica, márcalo; si hay un día no laboral extra (un decreto, una fecha local), agrégalo. ' +
      'Las apps no radican en festivos ni en fines de semana (en diciembre sí se radica el fin de semana).');
    var estado = K.nodo('<p class="ad-estado"></p>');
    estado.innerHTML = f.alDia ? K.icono('check', 14) + ' La hoja está al día con lo calculado.' :
      K.icono('aviso', 14) + ' La hoja no coincide con lo calculado' + (f.faltan && f.faltan.length ? ': faltan ' + K.esc(f.faltan.join(', ')) : '') + (f.sobran && f.sobran.length ? '; sobran ' + K.esc(f.sobran.join(', ')) : '') + '. Guarda para ponerla al día.';
    estado.className = 'ad-estado ' + (f.alDia ? 'ad-estado--ok' : 'ad-estado--aviso');
    s.appendChild(estado);
    var z = K.nodo('<div class="ad-festivos"></div>');
    s.appendChild(z);
    var pie = K.nodo('<div class="ad-pie">' +
      '<label class="op-campo ad-motivo"><span>Motivo del cambio (queda en la bitácora)</span><input type="text" maxlength="300" placeholder="Opcional"></label>' +
      '<div class="ct-acc"><button type="button" class="kit-btn kit-btn--plano ad-mas">' + K.icono('mas', 14) + ' Agregar un día</button>' +
      '<button type="button" class="kit-btn kit-btn--marca ad-guardar">' + K.icono('check', 16) + ' Guardar festivos</button></div></div>');
    s.appendChild(pie);
    var bG = pie.querySelector('.ad-guardar');
    function cambio() { bG.disabled = f.alDia && JSON.stringify(aj) === origen; }

    function pintar() {
      z.innerHTML = '';
      var anios = {};
      var filas = (f.detalle || []).filter(function (x) { return x.origen === 'LEY'; }).map(function (x) { return { fecha: x.fecha, nombre: x.nombre, origen: 'LEY' }; });
      aj.agregar.forEach(function (x) { if (!filas.some(function (y) { return y.fecha === x; })) filas.push({ fecha: x, nombre: 'Día no laboral (agregado)', origen: 'AGREGADO' }); });
      filas.sort(function (a, b) { return a.fecha.split('/').reverse().join('').localeCompare(b.fecha.split('/').reverse().join('')); });
      filas.forEach(function (x) { var y = x.fecha.slice(-4); (anios[y] = anios[y] || []).push(x); });
      Object.keys(anios).sort().forEach(function (y) {
        var g = K.nodo('<div class="ad-anio"><h4>' + y + ' <small></small></h4><div class="ad-dias"></div></div>');
        var activos = 0;
        anios[y].forEach(function (x) {
          var quitado = x.origen === 'LEY' && aj.quitar.indexOf(x.fecha) >= 0;
          if (!quitado) activos++;
          var d = K.nodo('<div class="ad-dia' + (quitado ? ' ad-dia--off' : '') + (x.origen === 'AGREGADO' ? ' ad-dia--mas' : '') + '">' +
            '<b></b><span class="ad-dia__n"></span><button type="button" class="kit-btn kit-btn--plano ad-mini"></button></div>');
          d.querySelector('b').textContent = x.fecha.slice(0, 5) + ' ' + diaSemana(x.fecha);
          d.querySelector('.ad-dia__n').textContent = x.nombre;
          var b = d.querySelector('button');
          if (x.origen === 'AGREGADO') {
            b.innerHTML = K.icono('basura', 13) + ' Quitar';
            b.addEventListener('click', function () { aj.agregar = aj.agregar.filter(function (z2) { return z2 !== x.fecha; }); pintar(); });
          } else {
            b.innerHTML = quitado ? K.icono('mas', 13) + ' Sí aplica' : K.icono('menos', 13) + ' No aplica';
            b.addEventListener('click', function () {
              if (quitado) aj.quitar = aj.quitar.filter(function (z2) { return z2 !== x.fecha; }); else aj.quitar.push(x.fecha);
              pintar();
            });
          }
          g.querySelector('.ad-dias').appendChild(d);
        });
        g.querySelector('small').textContent = activos + ' días';
        z.appendChild(g);
      });
      cambio();
    }
    pie.querySelector('.ad-mas').addEventListener('click', function () {
      var v = Number(f.vigencia) || new Date().getFullYear();
      K.piezas.fechas.abrir({ titulo: 'Día no laboral', anioDesde: v, anioHasta: v + 1, valor: null, alElegir: function (x) {
        var t = ('0' + x.d).slice(-2) + '/' + ('0' + x.m).slice(-2) + '/' + x.y;
        var dw = new Date(x.y, x.m - 1, x.d).getDay();
        if (dw === 0 || dw === 6) { K.aviso('Ese día es fin de semana: ya no se radica.', 'aviso', 4000); return; }
        if ((f.detalle || []).some(function (y) { return y.fecha === t && y.origen === 'LEY'; })) {
          aj.quitar = aj.quitar.filter(function (z2) { return z2 !== t; }); pintar(); K.aviso('Ese día ya es festivo de ley.', 'info', 3000); return;
        }
        if (aj.agregar.indexOf(t) < 0) aj.agregar.push(t);
        pintar();
      } });
    });
    bG.addEventListener('click', function () {
      bG.disabled = true;
      K.piezas.guardado.mientras(K.pedir('festivosGuardar', { ajustes: aj, motivo: pie.querySelector('input').value.trim() }, { ms: 60000 }), {
        titulo: 'Guardando los festivos', sub: 'Las fechas de radicación de todas las apps los respetan desde ya.',
        pasos: ['Calculando los festivos de ley…', 'Guardando en CONFIG…'], listo: { titulo: 'Festivos al día', paso: 'Queda en la bitácora' }
      }).then(function (r) {
        C.festivos(r.festivos);
        C.bitacora((r.bitacora || []).filter(function (b) { return b.accion === 'FESTIVOS'; }).slice(0, 1));
        if (vista._repintar) vista._repintar();
      }, function (e) { bG.disabled = false; K.aviso((e && e.message) || 'No se pudo guardar.', 'malo', 7000); });
    });
    pintar();
    return s;
  }

  function bloqueCortes() {
    var orig = valorJson('CORTES_POR_MES', {}) || {};
    var v = copia(orig);
    var s = seccion('reloj', 'DÍA DE CORTE DE CADA MES',
      'Desde ese día del mes, la radicación ya no ofrece fechas del mes en curso sino los <b>dos primeros días hábiles del mes siguiente</b>, para que la cuenta no se venza antes de llegar a Contabilidad. Déjalo vacío para no tener corte ese mes.');
    var g = K.nodo('<div class="ad-meses"></div>');
    MESES.forEach(function (m, i) {
      var l = K.nodo('<label class="op-campo ad-mes"><span></span><input class="ad-in" inputmode="numeric" maxlength="2" placeholder="—"></label>');
      l.querySelector('span').textContent = m;
      var inp = l.querySelector('input');
      inp.value = v[String(i)] || '';
      inp.addEventListener('input', function () {
        inp.value = inp.value.replace(/\D/g, '');
        if (inp.value) v[String(i)] = Number(inp.value); else delete v[String(i)];
        r();
      });
      g.appendChild(l);
    });
    s.appendChild(g);
    var r = pieGuardar(s, 'CORTES_POR_MES', function () {
      for (var k in v) if (!(v[k] >= 1 && v[k] <= 31)) throw new Error('El día de corte de ' + MESES[+k] + ' debe estar entre 1 y 31.');
      var o = {}; for (var j = 0; j < 12; j++) if (v[String(j)]) o[String(j)] = v[String(j)];
      return JSON.stringify(o);
    }, function () { return JSON.stringify(v) !== JSON.stringify(orig); });
    var hoy = new Date(), c = orig[String(hoy.getMonth())];
    s.appendChild(K.nodo('<p class="formulario__nota">' + K.icono('info', 13) + ' Hoy es ' + hoy.getDate() + ' de ' + MESES[hoy.getMonth()].toLowerCase() + ': ' +
      (c ? (hoy.getDate() >= c ? '<b>ya pasó el corte</b> (' + c + '); se ofrecen los primeros hábiles del mes siguiente.' : 'el corte es el ' + c + '.') : 'este mes no tiene corte.') + '</p>'));
    return s;
  }

  function bloqueCierre() {
    var orig = valorJson('CIERRE_VIGENCIA', { fecha: '', mensaje: '' }) || { fecha: '', mensaje: '' };
    var v = copia(orig);
    var s = seccion('candado', 'CIERRE DE LA VIGENCIA',
      'El último día en que se puede radicar una cuenta en la vigencia. Después de esa fecha la radicación no ofrece ningún día y el contratista ve el mensaje. Vacío = sin cierre.');
    var f = K.nodo('<div class="cf-item__campos"><label class="op-campo"><span>Último día para radicar</span><input class="ad-in" type="date" data-kit-fecha data-titulo="Cierre de la vigencia"></label>' +
      '<label class="op-campo cf-ancho"><span>Mensaje para el contratista</span><input class="ad-in ad-msg" type="text" maxlength="200"></label></div>');
    var iF = f.querySelector('input[type=date]'), iM = f.querySelector('.ad-msg');
    if (v.fecha) { var p = v.fecha.split('/'); iF.value = p[2] + '-' + p[1] + '-' + p[0]; }
    iM.value = v.mensaje || '';
    s.appendChild(f);
    var quitar = K.nodo('<button type="button" class="kit-btn kit-btn--plano ad-mini">' + K.icono('cerrar', 13) + ' Sin cierre</button>');
    s.appendChild(quitar);
    function leerV() { var x = iF.value ? iF.value.split('-') : null; return { fecha: x ? x[2] + '/' + x[1] + '/' + x[0] : '', mensaje: iM.value.trim() }; }
    var r = pieGuardar(s, 'CIERRE_VIGENCIA', function () { return JSON.stringify(leerV()); }, function () { return JSON.stringify(leerV()) !== JSON.stringify({ fecha: orig.fecha || '', mensaje: orig.mensaje || '' }); });
    iF.addEventListener('change', r); iM.addEventListener('input', r);
    quitar.addEventListener('click', function () { iF.value = ''; r(); });
    setTimeout(function () { if (K.piezas.fechas) K.piezas.fechas.montar(f); }, 0);
    return s;
  }

  /* ══════════════ MANTENIMIENTO ══════════════ */

  function bloqueMantenimiento() {
    var orig = valorJson('MANTENIMIENTO', { activo: false, apps: [], mensaje: '' }) || { activo: false, apps: [], mensaje: '' };
    var v = copia(orig); v.apps = v.apps || [];
    var s = seccion('candado', 'MODO MANTENIMIENTO',
      'Con el modo encendido, las apps que marques (o <b>todas</b> si no marcas ninguna) responden tu mensaje a cualquiera que no sea DEV, también al iniciar sesión. ADMIN nunca se cierra. Úsalo al publicar una versión o al corregir datos a mano.');
    if (orig.activo) s.classList.add('ad-bloque--alerta');
    var sw = K.nodo('<label class="op-check cf-sw ad-sw ad-sw--grande"><input type="checkbox"><span></span></label>');
    var iA = sw.querySelector('input');
    iA.checked = !!v.activo;
    s.appendChild(sw);
    var chips = K.nodo('<div class="cf-chips ad-chips"></div>');
    s.appendChild(K.nodo('<p class="formulario__nota formulario__nota--fuerte">Apps que se cierran (ninguna marcada = todas menos ADMIN)</p>'));
    s.appendChild(chips);
    var l = K.nodo('<label class="op-campo"><span>Mensaje que verán</span><textarea class="ad-in" rows="3" maxlength="300"></textarea></label>');
    var iM = l.querySelector('textarea'); iM.value = v.mensaje || '';
    s.appendChild(l);
    function leerV() { return { activo: iA.checked, apps: v.apps.slice(), mensaje: iM.value.trim() }; }
    var r = pieGuardar(s, 'MANTENIMIENTO', function () {
      var x = leerV();
      if (x.activo && !x.mensaje) throw new Error('Escribe el mensaje que van a ver.');
      return JSON.stringify(x);
    }, function () { return JSON.stringify(leerV()) !== JSON.stringify({ activo: !!orig.activo, apps: orig.apps || [], mensaje: orig.mensaje || '' }); });
    function texto() { sw.querySelector('span').innerHTML = iA.checked ? '<b>Mantenimiento ENCENDIDO</b>' : 'Mantenimiento apagado: todas las apps abiertas'; }
    function pintar() {
      chips.innerHTML = '';
      APPS_MANT.forEach(function (a) {
        var on = v.apps.indexOf(a) >= 0;
        var b = K.nodo('<button type="button" class="kit-pastilla" aria-pressed="' + (on ? 'true' : 'false') + '"></button>');
        b.textContent = a;
        b.addEventListener('click', function () { if (on) v.apps = v.apps.filter(function (x) { return x !== a; }); else v.apps.push(a); pintar(); r(); });
        chips.appendChild(b);
      });
    }
    iA.addEventListener('change', function () { texto(); r(); });
    iM.addEventListener('input', r);
    texto(); pintar();
    return s;
  }

  /* ══════════════ SUPERVISORES ══════════════ */

  function bloqueSupervisores() {
    var sup = D().supervisores || { lista: [], huerfanos: [] };
    var s = seccion('persona', 'SUPERVISORES (' + sup.lista.length + ')',
      'Los que se ofrecen al crear un contrato en Contratación. El <b>grupo</b> es el de WhatsApp al que les llegan los avisos de sus cuentas. Para que entren a la app de Supervisión, créales el usuario en USUARIOS Y ROLES.');
    var nuevo = K.nodo('<button type="button" class="kit-btn kit-btn--marca">' + K.icono('mas', 16) + ' Agregar supervisor</button>');
    nuevo.addEventListener('click', function () { editarSupervisor(null); });
    s.appendChild(nuevo);
    var g = K.nodo('<div class="kit-rejilla kit-rejilla--auto ad-sups"></div>');
    sup.lista.forEach(function (x) {
      var t = K.nodo('<article class="kit-tarjeta ad-sup"><div class="ad-sup__cab"><span class="ad-sup__cara"></span><div><b></b><small></small></div></div>' +
        '<ul class="ad-sup__datos"></ul><div class="ct-acc"></div></article>');
      if (K.piezas.personas) t.querySelector('.ad-sup__cara').appendChild(K.piezas.personas.avatar(x.nombre, { tam: 44 }));
      t.querySelector('.ad-sup__cab div b').textContent = O().nombre(x.nombre);
      t.querySelector('.ad-sup__cab div small').textContent = 'C.C. ' + x.documento + (x.id ? ' · ' + x.id : '');
      var ul = t.querySelector('ul');
      function li(ic, txt, malo) { var e = K.nodo('<li' + (malo ? ' class="ad-malo"' : '') + '>' + K.icono(ic, 13) + '<span></span></li>'); e.querySelector('span').textContent = txt; ul.appendChild(e); }
      li('telefono', x.contacto || 'Sin celular', !x.contacto);
      li('whatsapp', x.grupo ? 'Grupo ' + x.grupo : 'Sin grupo: sus avisos no salen', !x.grupo);
      li('hoja', x.contratos.activos + ' contratos activos de ' + x.contratos.total);
      li('persona', x.usuario ? 'Usuario de Supervisión ' + x.usuario : 'Sin usuario en Supervisión', x.usuario !== 'ACTIVO');
      var acc = t.querySelector('.ct-acc');
      var bE = K.nodo('<button type="button" class="kit-btn kit-btn--plano ins-accion">' + K.icono('lapiz', 14) + ' Editar</button>');
      bE.addEventListener('click', function () { editarSupervisor(x); });
      acc.appendChild(bE);
      if (x.firma) {
        var bF = K.nodo('<a class="kit-btn kit-btn--plano ins-accion" target="_blank" rel="noopener">' + K.icono('imagen', 14) + ' Ver firma</a>');
        bF.href = urlDrive(x.firma, false);
        acc.appendChild(bF);
      }
      if (x.grupo) {
        var bC = K.nodo('<button type="button" class="kit-btn kit-btn--plano ins-accion">' + K.icono('copiar', 14) + ' Grupo</button>');
        bC.addEventListener('click', function () { copiar(x.grupo); });
        acc.appendChild(bC);
      }
      var bR = K.nodo('<button type="button" class="kit-btn kit-btn--plano ins-accion cf-quitar">' + K.icono('basura', 14) + ' Retirar</button>');
      bR.addEventListener('click', function () { retirarSupervisor(x); });
      acc.appendChild(bR);
      g.appendChild(t);
    });
    s.appendChild(g);
    if ((sup.huerfanos || []).length) {
      var h = K.nodo('<div class="ad-huerfanos"><p class="formulario__nota formulario__nota--fuerte">' + K.icono('info', 14) + ' Grupos guardados de supervisores que ya no están en la lista</p></div>');
      sup.huerfanos.forEach(function (x) {
        var f = K.nodo('<div class="ad-huerfano"><span></span><button type="button" class="kit-btn kit-btn--plano ad-mini cf-quitar">' + K.icono('basura', 13) + ' Quitar su grupo</button></div>');
        f.querySelector('span').textContent = O().nombre(x.nombre) + ' · ' + x.grupo + (x.contratos.total ? ' · ' + x.contratos.activos + ' contratos activos' : '');
        f.querySelector('button').addEventListener('click', function () {
          K.piezas.confirmar.preguntar({ titulo: 'Quitar el grupo de ' + O().nombre(x.nombre), texto: 'Se borra de GRUPOS_SUPERVISOR. Si todavía supervisa contratos activos, sus avisos dejarían de llegar a ese grupo.', si: 'Quitar', peligro: true })
            .then(function (si) {
              if (!si) return;
              var m = valorJson('GRUPOS_SUPERVISOR', {}) || {};
              Object.keys(m).forEach(function (k) { if (K.norm(k) === K.norm(x.nombre)) delete m[k]; });
              guardarLlave('GRUPOS_SUPERVISOR', JSON.stringify(m), 'Grupo de ' + x.nombre + ' (ya no está en SUPERVISORES)', null)
                .then(function () { return C.recargar(); }).then(function () { if (vista._repintar) vista._repintar(); })['catch'](function () {});
            });
        });
        h.appendChild(f);
      });
      s.appendChild(h);
    }
    return s;
  }

  function editarSupervisor(x) {
    x = x || {};
    var f = K.nodo('<div class="formulario ad-form"></div>');
    function campo(et, attrs, val, ayuda) {
      var l = K.nodo('<label class="campo"><span>' + K.esc(et) + '</span><input ' + attrs + '></label>');
      l.querySelector('input').value = val || '';
      if (ayuda) l.appendChild(K.nodo('<p class="campo__ayuda">' + ayuda + '</p>'));
      f.appendChild(l);
      return l.querySelector('input');
    }
    var iN = campo('Nombre completo *', 'type="text" maxlength="120"', x.nombre);
    var iD = campo('Documento *', 'type="text" inputmode="numeric" maxlength="12"', x.documento);
    var iC = campo('Celular', 'type="tel" inputmode="numeric" maxlength="10" placeholder="3XXXXXXXXX"', x.contacto);
    var iG = campo('Grupo de WhatsApp (id)', 'type="text" maxlength="30"', x.grupo, 'El id del grupo en BuilderBot (letras y números).');
    var iF = campo('Firma (enlace o id de la imagen en Drive)', 'type="text" maxlength="200"', x.firma, 'La imagen que sale en el informe de supervisión si el supervisor no ha subido la suya.');
    var iMo = campo('Motivo (queda en la bitácora)', 'type="text" maxlength="300" placeholder="Opcional"', '');
    [iD, iC].forEach(function (i) { i.addEventListener('input', function () { i.value = i.value.replace(/\D/g, ''); }); });
    var m = O().modal({ titulo: x.fila ? 'Editar supervisor' : 'Agregar supervisor', cuerpo: f,
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } }, { texto: 'Guardar', icono: 'check', marca: true, al: guardar }] });
    function guardar() {
      var d = { fila: x.fila || '', nombre: iN.value.trim(), documento: iD.value.trim(), contacto: iC.value.trim(), grupo: iG.value.trim(), firma: idDe(iF.value), motivo: iMo.value.trim() };
      if (!d.nombre || !d.documento) { K.aviso('Escribe el nombre y el documento.', 'aviso', 3500); return; }
      if (d.contacto && !/^3\d{9}$/.test(d.contacto)) { K.aviso('El celular debe tener 10 dígitos y empezar por 3.', 'aviso', 4000); return; }
      m.botones[1].disabled = true;
      K.piezas.guardado.mientras(K.pedir('supervisorGuardar', d, { ms: 60000 }), {
        titulo: x.fila ? 'Guardando el supervisor' : 'Agregando el supervisor', sub: d.nombre.toUpperCase(),
        pasos: ['Comprobando que no esté repetido…', 'Guardando en SUPERVISORES…', 'Moviendo su grupo…'], listo: { titulo: 'Supervisor al día', paso: 'Queda en la bitácora' }
      }).then(function (r) {
        C.supervisores(r.supervisores); C.bitacora(r.bitacora);
        m.cerrar();
        if (vista._repintar) vista._repintar();
      }, function (e) { m.botones[1].disabled = false; K.aviso((e && e.message) || 'No se pudo guardar.', 'malo', 7000); });
    }
  }

  function retirarSupervisor(x) {
    if (x.contratos.activos) { K.aviso(O().nombre(x.nombre) + ' supervisa ' + x.contratos.activos + ' contratos activos: cámbialos de supervisor antes de retirarlo.', 'aviso', 7000); return; }
    K.piezas.confirmar.preguntar({ titulo: 'Retirar a ' + O().nombre(x.nombre), texto: 'Deja de ofrecerse al crear contratos. Sus contratos cerrados y su usuario no cambian.', si: 'Retirar', peligro: true })
      .then(function (si) {
        if (!si) return;
        K.piezas.guardado.mientras(K.pedir('supervisorRetirar', { fila: x.fila }, { ms: 60000 }), {
          titulo: 'Retirando al supervisor', sub: x.nombre, pasos: ['Quitándolo de la lista…'], listo: { titulo: 'Retirado', paso: 'Queda en la bitácora' }
        }).then(function (r) { C.supervisores(r.supervisores); C.bitacora(r.bitacora); if (vista._repintar) vista._repintar(); },
          function (e) { K.aviso((e && e.message) || 'No se pudo retirar.', 'malo', 7000); });
      });
  }

  /* ══════════════ MENSAJES Y AVISOS ══════════════ */

  function bloqueAvisos() {
    var a = D().avisos || { tipos: [], plantillas: {}, canales: {} };
    var s = seccion('campana', 'AVISOS DEL ECOSISTEMA (' + a.tipos.length + ')',
      'Cada aviso tiene su texto para <b>push</b> (corto), <b>WhatsApp</b> y <b>correo</b>, y sale por los canales que marques. El push no tiene cuota; el correo va con el tope diario de la cuenta. Toca uno para editarlo.');
    var g = K.nodo('<div class="ad-avisos"></div>');
    a.tipos.forEach(function (t) {
      var p = a.plantillas[t] || {}, c = a.canales[t] || [];
      var b = K.nodo('<button type="button" class="kit-tarjeta ad-aviso"><b></b><span class="ad-aviso__p"></span><span class="ad-aviso__c"></span></button>');
      b.querySelector('b').textContent = TIPOS_AVISO[t] || t;
      b.querySelector('.ad-aviso__p').textContent = (p.push && p.push.titulo) ? p.push.titulo + ' — ' + (p.push.cuerpo || '') : (p.wa || '').slice(0, 90);
      b.querySelector('.ad-aviso__c').innerHTML = c.length ? c.map(function (x) { return '<span class="ct-marca">' + K.icono(x === 'PUSH' ? 'campana' : (x === 'CORREO' ? 'sobre' : 'whatsapp'), 11) + ' ' + K.esc(x) + '</span>'; }).join('') : '<span class="ct-marca ad-malo">No sale</span>';
      b.addEventListener('click', function () { editarAviso(t); });
      g.appendChild(b);
    });
    s.appendChild(g);
    return s;
  }

  function editarAviso(tipo) {
    var a = D().avisos, p = copia(a.plantillas[tipo] || {}), c = (a.canales[tipo] || []).slice();
    p.push = p.push || {};
    var f = K.nodo('<div class="formulario ad-form"></div>');
    f.appendChild(K.nodo('<p class="formulario__nota">Marcadores: <code>' + K.esc(MARCADORES) + '</code>. El que no venga en el aviso se borra solo.</p>'));
    var can = K.nodo('<div class="cf-chips"></div>');
    ['PUSH', 'WHATSAPP', 'CORREO'].forEach(function (x) {
      var b = K.nodo('<button type="button" class="kit-pastilla" aria-pressed="' + (c.indexOf(x) >= 0) + '">' + K.icono(x === 'PUSH' ? 'campana' : (x === 'CORREO' ? 'sobre' : 'whatsapp'), 13) + ' ' + x + '</button>');
      b.addEventListener('click', function () { var i = c.indexOf(x); if (i >= 0) c.splice(i, 1); else c.push(x); b.setAttribute('aria-pressed', c.indexOf(x) >= 0); });
      can.appendChild(b);
    });
    var lc = K.nodo('<div class="campo"><span>Canales por los que sale</span></div>'); lc.appendChild(can); f.appendChild(lc);
    function campo(et, val, largo, max) {
      var l = K.nodo('<label class="campo"><span>' + K.esc(et) + '</span>' + (largo ? '<textarea rows="4"></textarea>' : '<input type="text">') + '<small class="ad-cuenta"></small></label>');
      var i = l.querySelector(largo ? 'textarea' : 'input');
      i.value = val || '';
      if (max) i.maxLength = max;
      var cu = l.querySelector('small');
      function contar() { cu.textContent = max ? i.value.length + ' / ' + max : ''; }
      i.addEventListener('input', contar); contar();
      f.appendChild(l);
      return i;
    }
    var iPT = campo('Push · título', p.push.titulo, false, 65);
    var iPC = campo('Push · cuerpo', p.push.cuerpo, true, 240);
    var iWA = campo('WhatsApp', p.wa, true, 2000);
    var iAs = campo('Correo · asunto', p.asunto, false, 150);
    var iCo = campo('Correo · cuerpo', p.correo, true, 4000);
    var iMo = campo('Motivo del cambio (queda en la bitácora)', '', false, 300);
    var m = O().modal({ titulo: TIPOS_AVISO[tipo] || tipo, cuerpo: f, ancha: true,
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } }, { texto: 'Guardar', icono: 'check', marca: true, al: guardar }] });
    function guardar() {
      if (!c.length) {
        K.piezas.confirmar.preguntar({ titulo: 'Sin canales', texto: 'Este aviso no va a salir por ningún lado. ¿Lo dejas así?', si: 'Sí, dejarlo apagado', peligro: true })
          .then(function (si) { if (si) enviar(); });
        return;
      }
      enviar();
    }
    function enviar() {
      m.botones[1].disabled = true;
      K.piezas.guardado.mientras(K.pedir('avisoGuardar', { tipo: tipo, pushTitulo: iPT.value, pushCuerpo: iPC.value, wa: iWA.value, asunto: iAs.value, correo: iCo.value, canales: c, motivo: iMo.value.trim() }, { ms: 60000 }), {
        titulo: 'Guardando el aviso', sub: TIPOS_AVISO[tipo] || tipo, pasos: ['Guardando el texto…', 'Guardando los canales…'], listo: { titulo: 'Aviso al día', paso: 'Queda en la bitácora' }
      }).then(function (r) {
        C.aviso(r.tipo, r.plantilla, r.canales); C.bitacora(r.bitacora);
        m.cerrar();
        if (vista._repintar) vista._repintar();
      }, function (e) { m.botones[1].disabled = false; K.aviso((e && e.message) || 'No se pudo guardar.', 'malo', 7000); });
    }
  }

  window.CONFIG = {
    configurar: function (c) { C = c || {}; },
    vista: vista,
    olvidar: function () { SECCION = 'calendario'; BUSCAR = ''; },
    _seccion: function () { return SECCION; },
    _secciones: SECCIONES,
    _seccionDe: seccionDe,
    _etiqueta: etiqueta,
    _tiposAviso: TIPOS_AVISO
  };
}());
