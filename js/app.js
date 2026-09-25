/* ============================================================
   ADMIN-FLANDES · APP
   Ecosistema Flandes · Fase 10 · entregas 10.1, 10.2 y 10.3

   La app del desarrollador. La misma cara de las otras apps: franja
   con cielo, tu foto, los accesos por bloques y abajo el resumen de
   lo que pide atención (se toca y abre la vista ya filtrada).

   Vistas de la 10.1:
     · CONFIGURACIÓN (configuracion.js): todo CONFIG ordenado por sección,
       festivos, calendario de cuentas, supervisores, grupos, carpetas,
       plantillas, mensajes y avisos, mantenimiento.
     · USUARIOS Y ROLES (usuarios.js): las cinco apps de funcionarios y
       ADMIN; crear, editar, estado, contraseña, desbloqueo, bienvenida
       y, por REVISOR, a quién revisa y si decide.
     · BITÁCORA (bitacora.js): todo cambio hecho desde aquí, con PDF y Excel.
     · SOPORTE (tarjeta y menú del perfil).

   Vista de la 10.3:
     · RECORDATORIOS (recordatorios.js): los dos scripts viejos
       (RECORDATORIO_CUENTAS y NOTIFICACION_FINAL) ya dentro del CORE,
       con horas, textos, cuentas prioritarias, vista previa y reloj.

   Vistas de la 10.2 (contratistas):
     · CONTRATISTAS, ficha, AGREGAR, ADICIÓN, CESIÓN, SUSPENSIÓN y EDITAR:
       las MISMAS de CONTRATACION (contratistas.js y gestion.js son archivos
       compartidos); el CORE las atiende con rutas de ADMIN que van a las
       mismas funciones y suman la bitácora.
     · CARGA MASIVA (masiva.js, compartido con CONTRATACION).
     · Lo propio de ADMIN (contratos-admin.js): canal de notificación,
       cuentas con cambio de estado en silencio, historial, NOVEDADES y
       TODOS LOS DATOS de la fila.

   UN SOLO LLAMADO por pantalla o acción:
     · Entrar: el login trae el arranque ('inicio') en el mismo viaje y ahí
       viene TODO: configuración, usuarios, supervisores, festivos, avisos y
       las últimas 400 filas de la bitácora. Ninguna vista vuelve a pedirlo.
     · Cada botón: una llamada, y la respuesta trae lo que hay que repintar.
     · La versión publicada de cada app se lee en segundo plano de su propio
       version.js (no pasa por el CORE).

   Reglas de siempre
     · Todo dato de la hoja pasa por K.esc antes de entrar al HTML.
     · La app no conoce ninguna URL: todo sale de marca.js y de CONFIG.
     · Qué ve cada quien lo decide el CORE (hoy ADMIN es solo el DEV).
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var M = window.MARCA || {};
  var app = K.id('app');

  var YO = null;          /* quién entró */
  var ARRANQUE = null;    /* lo que trajo 'inicio' */
  var VERSIONES = {};     /* APP -> versión publicada (de su version.js) */

  var MODULOS = ['CONFIG', 'USUARIOS', 'BITACORA', 'RECORDATORIOS'];

  /* Las siete apps con la imagen que las representa en ALCALDIA-MEDIOS */
  var APPS = [
    { app: 'CONTRATISTA', t: 'Contratista', img: 'img/contratista.webp' },
    { app: 'CONTRATACION', t: 'Contratación', img: 'img/contratacion.webp' },
    { app: 'SUPERVISION', t: 'Supervisión', img: 'img/supervision.webp' },
    { app: 'CONTABILIDAD', t: 'Contabilidad', img: 'img/contabilidad.webp' },
    { app: 'TESORERIA', t: 'Tesorería', img: 'img/tesoreria.webp' },
    { app: 'COMUNICACIONES', t: 'Comunicaciones', img: 'img/prensa.webp' },
    { app: 'ADMIN', t: 'Admin', propio: 'img/icono-192.png' }
  ];

  /* ══════════════ el arranque, en UNA sola llamada ══════════════ */

  function leer(accion, datos, veces) {
    return K.pedir(accion, datos || {}, { ms: 60000 })['catch'](function (e) {
      var red = e && (e.codigo === 'RESPUESTA_NO_JSON' || e.codigo === 'SIN_RED' || e.codigo === 'TIEMPO');
      if (red && (veces || 0) < 1) return leer(accion, datos, (veces || 0) + 1);
      throw e;
    });
  }

  function recibir(d) {
    ARRANQUE = d;
    YO = d.yo || YO;
    if (d.personas && K.piezas.personas) K.piezas.personas.cargar(d.personas);
    if (d.push && K.piezas.avisos && K.piezas.avisos.configurar) K.piezas.avisos.configurar(d.push);
    if (d.config && K.piezas.creditos && K.piezas.creditos.configurar) K.piezas.creditos.configurar(d.config);
  }

  /* 10.2 · lo que comparten las vistas de contratistas (las de CONTRATACION) */
  function contextoContratos() {
    return { app: app, puede: puede, irA: irA, errorCaja: errorCaja, enrutar: enrutar,
             bitacora: function (f) { if (C) C.bitacora(f); } };
  }

  /* el login trae el arranque (pre.arranque) en el mismo viaje */
  function arranque(conEsqueleto, pre) {
    var yaVino = pre && pre.arranque ? pre.arranque : null;
    var quitar = (!yaVino && conEsqueleto && K.piezas.esqueletos && app)
      ? K.piezas.esqueletos.poner(app, { forma: 'ficha', cuantos: 1, sitio: 'reemplaza', espera: 'Cargando Admin Flandes' })
      : function () {};

    return (yaVino ? Promise.resolve(yaVino) : leer('inicio')).then(function (d) {
      recibir(d);
      quitar();
      return d;
    }, function (e) {
      quitar();
      throw e;
    });
  }

  K.listo(function () {
    registrarSW();
    if (K.piezas.instalar) K.piezas.instalar.vigilar();
    if (K.piezas.version) K.piezas.version.vigilar();

    var puerta = K.piezas.bienvenida
      ? K.piezas.bienvenida.abrir({
          titulo: 'Admin Flandes',
          sub: M.MUNICIPIO || 'Alcaldía de Flandes',
          imagen: M.APP_ICON || 'img/icono-512.png'
        })
      : Promise.resolve('saltada');

    puerta.then(function () {
      K.piezas.sesion.entrar({
        titulo: 'ADMIN FLANDES',
        sub: 'Ingresa con tu documento y contraseña',
        imagen: M.APP_ICON || 'img/icono-512.png',
        arranqueEnLogin: true,
        comprobar: function (login) { return arranque(true, login).then(function (d) { return d.yo; }); },
        alEntrar: arrancar
      });
    });
  });

  function registrarSW() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('sw.js')['catch'](function () {});
  }

  /* Lo que las vistas comparten. Las escrituras devuelven lo nuevo y aquí
     se funde en ARRANQUE: así el inicio y las demás vistas quedan al día
     sin volver a pedir 'inicio'. */
  var C = null;
  function contexto() {
    return {
      app: app, puede: puede, irA: irA, errorCaja: errorCaja, leer: leer,
      esDev: function () { return K.norm((YO && YO.rol) || '') === 'DEV'; },
      yo: function () { return YO || {}; },
      datos: function () { return ARRANQUE || {}; },
      config: function () { return (ARRANQUE && ARRANQUE.config) || {}; },
      apps: function () { return APPS; },
      versiones: function () { return VERSIONES; },
      /* una o varias filas nuevas de bitácora, arriba */
      bitacora: function (filas) {
        if (!ARRANQUE) return;
        [].concat(filas || []).filter(Boolean).reverse().forEach(function (f) { ARRANQUE.bitacora.unshift(f); ARRANQUE.bitacoraTotal = (ARRANQUE.bitacoraTotal || 0) + 1; });
      },
      /* una llave de CONFIG que cambió */
      llave: function (item) {
        if (!ARRANQUE || !item) return;
        var l = ARRANQUE.cfg || [];
        for (var i = 0; i < l.length; i++) if (l[i].llave === item.llave) { l[i] = item; return; }
        l.push(item);
      },
      /* un usuario que cambió (o uno nuevo) */
      usuario: function (u) {
        if (!ARRANQUE || !u) return;
        var l = ARRANQUE.usuarios || [];
        for (var i = 0; i < l.length; i++) if (l[i].fila === u.fila) { l[i] = u; return; }
        l.push(u);
      },
      usuarios: function (lista) { if (ARRANQUE && lista) ARRANQUE.usuarios = lista; },
      supervisores: function (s) { if (ARRANQUE && s) ARRANQUE.supervisores = s; },
      festivos: function (f) { if (ARRANQUE && f) ARRANQUE.festivos = f; },
      aviso: function (tipo, plantilla, canales) {
        if (!ARRANQUE || !ARRANQUE.avisos) return;
        ARRANQUE.avisos.plantillas[tipo] = plantilla; ARRANQUE.avisos.canales[tipo] = canales;
      },
      /* vuelve a traer el arranque entero (el botón Refrescar del inicio) */
      recargar: function () { return leer('inicio').then(function (d) { recibir(d); return d; }); },
      miFoto: miFoto, abrirFoto: abrirFoto
    };
  }

  function arrancar(yo) {
    YO = yo || {};
    montarBanner();

    if (K.piezas.avisos) {
      K.piezas.avisos.autoActivar();
      K.piezas.avisos.alLlegar(function (a) {
        K.aviso(a.titulo ? (a.titulo + ': ' + a.cuerpo) : a.cuerpo, 'info', 6000);
      });
    }

    C = contexto();
    if (window.AYUDA) {
      window.AYUDA.configurar(function () {
        return { yo: YO, arranque: ARRANQUE, vista: vistaActual(), versiones: VERSIONES };
      });
    }
    MODULOS.forEach(function (m) { if (window[m]) window[m].configurar(C); });
    ['CONTRATISTAS', 'GESTION', 'MASIVA', 'CONTRATOS_ADMIN'].forEach(function (m) { if (window[m]) window[m].configurar(contextoContratos()); });

    K.cuando('kit:foto', function (r) {
      YO.imagen = r.url || '';
      K.piezas.banner.perfil({ foto: r.foto || '' });
      var cara = document.querySelector('.saludo .kit-perfil-cara');
      if (cara && K.piezas.perfil) cara.parentNode.replaceChild(caraPerfil(), cara);
    });

    window.addEventListener('hashchange', enrutar);
    enrutar();
    leerVersiones();
  }

  /* La versión publicada de cada app, de su version.js (sin caché, sin CORE). */
  function leerVersiones() {
    var urls = (ARRANQUE && ARRANQUE.config && ARRANQUE.config.APPS_URLS) || {};
    APPS.forEach(function (a) {
      var base = urls[a.app];
      if (!base) return;
      fetch(String(base).replace(/\/?$/, '/') + 'version.js?t=' + Date.now(), { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (t) {
          var m = /APP_VERSION\s*=\s*["']([^"']+)["']/.exec(t || '');
          VERSIONES[a.app] = m ? m[1] : 'sin publicar';
          K.disparar('admin:versiones', VERSIONES);
        })['catch'](function () { VERSIONES[a.app] = 'sin respuesta'; K.disparar('admin:versiones', VERSIONES); });
    });
  }

  /* ══════════════ permisos ══════════════ */
  function puede(vista) {
    var r = K.norm((YO && YO.rol) || '');
    if (r === 'DEV') return true;
    var v = (YO && YO.vistas) || [];
    for (var i = 0; i < v.length; i++) if (K.norm(v[i]) === K.norm(vista)) return true;
    return false;
  }

  function miFoto(ancho) {
    return K.miniDrive ? K.miniDrive(YO.imagen || '', ancho || 200) : (YO.imagen || '');
  }

  function abrirFoto() {
    if (!K.piezas.perfil) return;
    K.piezas.perfil.abrir({ nombre: YO.nombre || '', foto: miFoto(512) });
  }

  function caraPerfil() {
    return K.piezas.perfil.cara(YO.nombre || '', miFoto(200), {
      tam: 66, fotoActual: function () { return miFoto(512); }
    });
  }

  function soporte() { if (K.piezas.soporte) K.piezas.soporte.abrir({ vista: vistaActual() }); }

  function montarBanner() {
    var menu = [{ texto: 'Foto de perfil', al: abrirFoto }];
    menu.push({ texto: 'Actualizar contraseña', al: function () { K.piezas.sesion.cambiarClave(); } });
    menu.push({ texto: 'Instalar la app', al: function () { K.piezas.instalar.abrir(); } });
    menu.push({ texto: 'Soporte', al: soporte });
    menu.push({ texto: 'Cerrar sesión', al: salir, peligro: true });
    K.piezas.banner.montar({
      titulo: 'Admin Flandes',
      nombre: YO.nombre || '',
      rol: rolLegible(YO.rol),
      foto: miFoto(200),
      menu: menu
    });
    if (K.piezas.cielo) K.piezas.cielo.soloFondo(document.querySelector('.kit-banner'));
  }

  function rolLegible(r) {
    var n = K.norm(r || '');
    if (n === 'DEV') return 'DEV · Desarrollo';
    if (n === 'ADMIN') return 'Administrador del ecosistema';
    return r || 'Admin';
  }

  function salir() {
    if (K.piezas.avisos) K.piezas.avisos.olvidar();
    if (K.piezas.insights) K.piezas.insights.quitar();
    MODULOS.forEach(function (m) { if (window[m] && window[m].olvidar) window[m].olvidar(); });
    if (window.CONTRATISTAS && window.CONTRATISTAS.olvidar) window.CONTRATISTAS.olvidar();
    ARRANQUE = null;
    K.piezas.sesion.salir();
    location.hash = '';
  }

  /* ══════════════ vistas ══════════════ */

  var VISTAS = {
    inicio: vistaInicio,
    configuracion: function (sub) { window.CONFIG.vista(sub); },
    usuarios: function (sub) { window.USUARIOS.vista(sub); },
    bitacora: function () { window.BITACORA.vista(); },
    /* 10.3 · recordatorios y notificación final (antes scripts sueltos) */
    recordatorios: function () { window.RECORDATORIOS.vista(); },
    /* 10.2 · contratistas (las vistas de CONTRATACION) */
    contratistas: function (sub) { window.CONTRATISTAS.lista(sub); },
    contratista: function (sub) { window.CONTRATISTAS.detalle(sub); },
    agregar: function () { window.GESTION.agregar(); },
    adicion: function (sub) { window.GESTION.adicion(sub); },
    cesion: function (sub) { window.GESTION.cesion(sub); },
    suspension: function (sub) { window.GESTION.suspension(sub); },
    editar: function (sub) { window.GESTION.editar(sub); },
    masiva: function () { window.MASIVA.vista(); },
    /* 10.2 · lo propio de ADMIN */
    novedad: function (sub) { window.CONTRATOS_ADMIN.novedad(sub); },
    datos: function (sub) { window.CONTRATOS_ADMIN.datos(sub); }
  };

  var titulos = {
    inicio: 'Admin Flandes',
    configuracion: 'CONFIGURACIÓN',
    usuarios: 'USUARIOS Y ROLES',
    bitacora: 'BITÁCORA',
    recordatorios: 'RECORDATORIOS',
    contratistas: 'CONTRATISTAS',
    contratista: 'DETALLES DEL CONTRATISTA',
    agregar: 'AGREGAR CONTRATISTA',
    adicion: 'ADICIÓN',
    cesion: 'CESIÓN',
    suspension: 'SUSPENSIÓN',
    editar: 'EDITAR CONTRATO',
    masiva: 'CARGA MASIVA',
    novedad: 'NOVEDADES',
    datos: 'TODOS LOS DATOS'
  };

  var PERMISO = { configuracion: 'configuracion', usuarios: 'usuarios', bitacora: 'bitacora', recordatorios: 'configuracion',
    contratistas: 'contratistas', contratista: 'contratistas', agregar: 'agregarContratista', masiva: 'agregarContratista',
    adicion: 'adicion', cesion: 'cesion', suspension: 'suspension', editar: 'editarContratista',
    novedad: 'contratistas', datos: 'contratistas' };

  function irA(v) { location.hash = '#/' + v; }

  function vistaActual() {
    var v = String(location.hash || '').replace(/^#\/?/, '').split('/')[0] || 'inicio';
    return titulos[v] || v;
  }

  function enrutar() {
    var partes = String(location.hash || '').replace(/^#\/?/, '').split('/');
    var v = partes[0] || 'inicio';
    if (!VISTAS[v]) v = 'inicio';
    if (v !== 'inicio' && !puede(PERMISO[v] || v)) v = 'inicio';

    K.piezas.banner.vista(titulos[v]);
    var resto = partes.slice(1).join('/');
    /* la ficha vuelve a la lista; lo que sale de una ficha vuelve a esa ficha */
    var FICHA_DE = { adicion: 1, cesion: 1, suspension: 1, editar: 1, novedad: 1, datos: 1 };
    K.piezas.banner.atras(v === 'inicio' ? null : function () {
      if (FICHA_DE[v]) irA('contratista/' + partes[1]);
      else if (v === 'contratista' || v === 'agregar' || v === 'masiva') irA('contratistas');
      else irA('inicio');
    });
    /* las vistas de 10.1 reciben el resto ya decodificado, como antes */
    if (!window.CONTRATISTAS || !{ contratistas: 1, contratista: 1, agregar: 1, adicion: 1, cesion: 1, suspension: 1, editar: 1, masiva: 1, novedad: 1, datos: 1 }[v]) resto = decodeURIComponent(resto);

    app.innerHTML = '';
    if (window.AYUDA) window.AYUDA.montar(v);
    window.scrollTo(0, 0);
    VISTAS[v](resto);
  }

  /* ---------- inicio ---------- */

  function vistaInicio() {
    var caja = K.nodo('<div class="kit-ancho vista"></div>');
    var saludo = K.nodo(
      '<section class="saludo">' +
      '  <div class="saludo__txt">' +
      '    <p class="saludo__hola">' + K.esc(saludoDelDia()) + ',</p>' +
      '    <h2 class="saludo__nombre">' + K.esc(nombreCorto(YO.nombre)) + '</h2>' +
      '    <p class="saludo__doc">' + K.esc(rolLegible(YO.rol)) + ' · ' + K.esc(fechaHumana(new Date())) + '</p>' +
      '  </div>' +
      '</section>'
    );
    if (K.piezas.perfil && K.piezas.personas) saludo.appendChild(caraPerfil());
    if (K.piezas.cielo) K.piezas.cielo.poner(saludo, { burbujas: 3 });
    caja.appendChild(saludo);

    function bloque(titulo, tarjetas) {
      var s = K.nodo('<section class="bloque" aria-label="' + K.esc(titulo) + '">' +
        '<h3 class="bloque__t">' + K.esc(titulo) + '</h3></section>');
      var r = K.nodo('<div class="kit-rejilla kit-rejilla--auto accesos"></div>');
      tarjetas.forEach(function (t) { r.appendChild(t); });
      s.appendChild(r);
      caja.appendChild(s);
      return s;
    }

    var d = ARRANQUE || {};
    var acc = {};
    var tE = [];
    if (puede('configuracion')) tE.push(acc.config = accesoIcono('CONFIGURACIÓN', 'Festivos, calendario de cuentas, catálogos, supervisores, grupos, carpetas, plantillas y claves', 'herramienta',
      function () { irA('configuracion'); }));
    if (puede('usuarios')) tE.push(acc.usuarios = accesoIcono('USUARIOS Y ROLES', 'Quién entra a cada app y con qué rol; contraseñas, desbloqueos y bienvenida', 'persona',
      function () { irA('usuarios'); }));
    if (puede('configuracion')) tE.push(acc.recordatorios = accesoIcono('RECORDATORIOS', 'Recordatorios de cuentas a supervisores y Contratación, y la notificación final del contrato', 'reloj',
      function () { irA('recordatorios'); }));
    if (puede('bitacora')) tE.push(acc.bitacora = acceso('BITÁCORA', 'Cada cambio hecho desde aquí: quién, cuándo, antes, después y motivo', 'img/pdf.webp',
      function () { irA('bitacora'); }));
    if (tE.length) bloque('ECOSISTEMA', tE);

    /* 10.2 · contratistas: las mismas vistas de CONTRATACION + lo de ADMIN */
    var tC = [];
    if (puede('contratistas')) tC.push(acceso('CONTRATISTAS', 'Cualquier contrato: todos sus datos, novedades, cesión, cuentas en silencio y canal de avisos', 'img/contratista.webp',
      function () { irA('contratistas'); }));
    if (puede('agregarContratista')) {
      tC.push(acceso('AGREGAR CONTRATISTA', 'Registra un contrato: primero se valida el documento, después lo demás', 'img/datos_de_procesos.webp',
        function () { irA('agregar'); }));
      tC.push(accesoIcono('CARGA MASIVA', 'Varios contratos de una vez con la plantilla de Excel: se revisan antes de registrar', 'hoja',
        function () { irA('masiva'); }));
    }
    if (tC.length) bloque('CONTRATISTAS', tC);

    var tA = [];
    if (puede('configuracion')) {
      tA.push(acc.avisos = accesoIcono('MENSAJES Y AVISOS', 'Los textos de WhatsApp, correo y push de todas las apps, y por qué canal sale cada uno', 'campana',
        function () { irA('configuracion/mensajes'); }));
      tA.push(acc.mant = accesoIcono('MANTENIMIENTO', 'Cierra una app o todas con un mensaje, mira la versión publicada de cada una', 'candado',
        function () { irA('configuracion/mantenimiento'); }));
    }
    tA.push(acceso('SOPORTE', 'Cuéntanos qué falla, con hasta 3 capturas', 'img/comunicaciones.webp', soporte));
    bloque('ATAJOS', tA);

    var sRes = K.nodo('<section class="bloque" aria-label="Resumen"><h3 class="bloque__t">LO QUE PIDE ATENCIÓN</h3></section>');
    var destino = K.nodo('<section class="resumen"></section>');
    sRes.appendChild(destino);
    caja.appendChild(sRes);

    var sApps = K.nodo('<section class="bloque" aria-label="Apps del ecosistema"><h3 class="bloque__t">APPS DEL ECOSISTEMA</h3></section>');
    var zApps = K.nodo('<div class="ad-apps"></div>');
    sApps.appendChild(zApps);
    caja.appendChild(sApps);

    app.appendChild(caja);
    K.piezas.creditos.montar(caja);

    pintarResumen(destino, acc);
    pintarApps(zApps);
    var alVer = function () { if (document.body.contains(zApps)) pintarApps(zApps); };
    document.addEventListener('admin:versiones', alVer);
  }

  function cifrasDe(d) {
    var us = d.usuarios || [];
    var act = us.filter(function (u) { return u.estado === 'ACTIVO'; });
    var hoy = hoyTexto();
    var sup = d.supervisores || { lista: [], huerfanos: [] };
    var mant = d.mantenimiento || {};
    return {
      activos: act.length,
      bloqueados: us.filter(function (u) { return u.bloqueado; }).length,
      sinCelular: act.filter(function (u) { return !u.telefono; }).length,
      sinCorreo: act.filter(function (u) { return !u.correo; }).length,
      claveDoc: act.filter(function (u) { return u.claveEsDocumento; }).length,
      cambiosHoy: (d.bitacora || []).filter(function (b) { return String(b.fecha).indexOf(hoy) === 0; }).length,
      festivosAlDia: !!(d.festivos && d.festivos.alDia),
      supSinGrupo: sup.lista.filter(function (s) { return !s.grupo; }).length,
      huerfanos: (sup.huerfanos || []).length,
      mantenimiento: mant.activo === true ? ((mant.apps || []).length ? mant.apps.join(', ') : 'TODAS') : ''
    };
  }

  function hoyTexto() {
    var d = new Date();
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
  }

  function pintarResumen(destino, acc) {
    destino.innerHTML = '';
    var n = cifrasDe(ARRANQUE || {});
    burbuja(acc.usuarios, n.bloqueados, 'bloqueados', 'Nadie bloqueado ahora');
    burbuja(acc.mant, n.mantenimiento ? 1 : 0, 'en mantenimiento', 'Todas las apps abiertas');
    var caja = K.nodo('<div class="kit-tarjeta resumen__caja ct-resumen"></div>');
    var ref = K.nodo('<button type="button" class="kit-btn kit-btn--plano ct-recargar ct-recargar--mini" aria-label="Refrescar las cifras">' +
      K.icono('recargar', 16) + '<span>Refrescar</span></button>');
    ref.addEventListener('click', function () {
      ref.disabled = true; ref.classList.add('kit-ocupado');
      C.recargar().then(function () {
        pintarResumen(destino, acc);
        K.aviso('Al día.', 'ok', 2000);
      }, function (e) { K.aviso((e && e.message) || 'No se pudo refrescar.', 'malo', 5000); ref.disabled = false; ref.classList.remove('kit-ocupado'); });
    });
    caja.appendChild(ref);
    var cifras = K.nodo('<div class="ct-cifras sp-cifras"></div>');
    [
      [n.activos, 'Usuarios activos', 'usuarios'],
      [n.bloqueados, 'Bloqueados ahora', 'usuarios/BLOQUEADOS'],
      [n.sinCelular, 'Sin celular', 'usuarios/SIN_CELULAR'],
      [n.claveDoc, 'Contraseña = documento', 'usuarios/CLAVE_DOC'],
      [n.cambiosHoy, 'Cambios hoy', 'bitacora']
    ].forEach(function (c) {
      var b = K.nodo('<button type="button" class="ct-cifra"><b>' + K.numero(c[0] || 0) + '</b><span>' + K.esc(c[1]) + '</span></button>');
      b.addEventListener('click', function () { K.vibrar(6); irA(c[2]); });
      cifras.appendChild(b);
    });
    caja.appendChild(cifras);

    var alertas = [];
    if (n.mantenimiento) alertas.push(['malo', 'candado', 'Mantenimiento ACTIVO en: ' + n.mantenimiento, 'configuracion/mantenimiento']);
    if (!n.festivosAlDia) alertas.push(['aviso', 'reloj', 'Los festivos de la hoja no coinciden con los calculados: revísalos', 'configuracion/calendario']);
    if (n.supSinGrupo) alertas.push(['aviso', 'whatsapp', n.supSinGrupo + (n.supSinGrupo === 1 ? ' supervisor sin grupo de WhatsApp' : ' supervisores sin grupo de WhatsApp'), 'configuracion/supervisores']);
    if (n.huerfanos) alertas.push(['info', 'whatsapp', n.huerfanos + (n.huerfanos === 1 ? ' grupo de un supervisor que ya no está en la lista' : ' grupos de supervisores que ya no están en la lista'), 'configuracion/supervisores']);
    if (n.sinCelular) alertas.push(['aviso', 'telefono', n.sinCelular + (n.sinCelular === 1 ? ' usuario activo sin celular: no recibe ni recupera la contraseña' : ' usuarios activos sin celular: no reciben ni recuperan la contraseña'), 'usuarios/SIN_CELULAR']);
    if (n.sinCorreo) alertas.push(['info', 'sobre', n.sinCorreo + ' usuarios activos sin correo (no reciben avisos por correo)', 'usuarios/SIN_CORREO']);
    var t = K.nodo('<div class="ad-alertas"></div>');
    if (!alertas.length) t.appendChild(K.nodo('<p class="ct-resumen__t sp-total">' + K.icono('check', 15) + ' Todo en orden: nada pide atención.</p>'));
    alertas.forEach(function (a) {
      var b = K.nodo('<button type="button" class="ad-alerta ad-alerta--' + a[0] + '">' + K.icono(a[1], 16) + '<span>' + K.esc(a[2]) + '</span>' + K.icono('adelante', 14) + '</button>');
      b.addEventListener('click', function () { irA(a[3]); });
      t.appendChild(b);
    });
    caja.appendChild(t);
    destino.appendChild(caja);
  }

  function pintarApps(z) {
    z.innerHTML = '';
    var urls = (ARRANQUE && ARRANQUE.config && ARRANQUE.config.APPS_URLS) || {};
    var mant = (ARRANQUE && ARRANQUE.mantenimiento) || {};
    APPS.forEach(function (a) {
      var cerrada = mant.activo === true && a.app !== 'ADMIN' && (!(mant.apps || []).length || (mant.apps || []).indexOf(a.app) >= 0);
      var v = VERSIONES[a.app];
      var src = a.propio || K.medio(a.img);
      var t = K.nodo('<a class="kit-tarjeta ad-app' + (cerrada ? ' ad-app--cerrada' : '') + '" target="_blank" rel="noopener">' +
        '<img class="ad-app__img" alt="" loading="lazy">' +
        '<span class="ad-app__t"></span>' +
        '<span class="ad-app__v"></span></a>');
      t.querySelector('img').src = src;
      t.querySelector('.ad-app__t').textContent = a.t;
      t.querySelector('.ad-app__v').textContent = cerrada ? 'En mantenimiento' : (v ? 'v ' + v : 'Leyendo versión…');
      if (urls[a.app]) t.href = urls[a.app]; else t.removeAttribute('href');
      z.appendChild(t);
    });
  }

  function burbuja(acc, n, que, vacio) {
    if (!acc) return;
    var bb = acc.querySelector('.acceso__burbuja');
    if (bb) bb.parentNode.removeChild(bb);
    var p = acc.querySelector('.acceso__p');
    if (!acc.__texto && p) acc.__texto = p.textContent;
    if (n) { acc.insertAdjacentHTML('beforeend', '<b class="acceso__burbuja rv-burbuja" aria-label="' + n + ' ' + que + '">' + (n > 99 ? '99+' : n) + '</b>'); if (p) p.textContent = acc.__texto; }
    else if (p && vacio) p.textContent = acc.__texto;
  }

  function acceso(titulo, texto, medio, al) {
    var b = K.nodo(
      '<button type="button" class="kit-tarjeta acceso">' +
      '  <img class="acceso__img" src="' + K.esc(K.medio(medio)) + '" alt="" loading="lazy">' +
      '  <span class="acceso__txt">' +
      '    <span class="acceso__t">' + K.esc(titulo) + '</span>' +
      '    <span class="acceso__p">' + K.esc(texto) + '</span>' +
      '  </span>' +
      '</button>'
    );
    b.addEventListener('click', function () { K.vibrar(8); al(); });
    return b;
  }

  /** Sin imagen en ALCALDIA-MEDIOS para la acción: el icono del kit, del mismo tamaño. */
  function accesoIcono(titulo, texto, icono, al) {
    var b = K.nodo(
      '<button type="button" class="kit-tarjeta acceso">' +
      '  <span class="acceso__img acceso__img--icono" aria-hidden="true">' + K.icono(icono, 40) + '</span>' +
      '  <span class="acceso__txt">' +
      '    <span class="acceso__t">' + K.esc(titulo) + '</span>' +
      '    <span class="acceso__p">' + K.esc(texto) + '</span>' +
      '  </span>' +
      '</button>'
    );
    b.addEventListener('click', function () { K.vibrar(8); al(); });
    return b;
  }

  /* ══════════════ auxiliares ══════════════ */

  function saludoDelDia() {
    var h = new Date().getHours();
    return h < 12 ? 'Buenos días' : (h < 19 ? 'Buenas tardes' : 'Buenas noches');
  }

  function fechaHumana(d) {
    var dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
                 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return dias[d.getDay()] + ' ' + d.getDate() + ' de ' + meses[d.getMonth()];
  }

  function nombreCorto(n) {
    var p = String(n || '').trim().split(/\s+/);
    if (!p[0]) return '';
    return p.length > 1 ? (p[0] + ' ' + p[1]) : p[0];
  }

  function errorCaja(e, alReintentar) {
    var msg = (e && e.message) ? e.message : 'No se pudo cargar.';
    var c = K.nodo(
      '<section class="kit-tarjeta error">' +
      '  <p class="error__t">' + K.esc(msg) + '</p>' +
      '  <button type="button" class="kit-btn kit-btn--plano">Reintentar</button>' +
      '</section>'
    );
    c.querySelector('button').addEventListener('click', function () {
      if (alReintentar) alReintentar(); else enrutar();
    });
    return c;
  }
}());
