/* ============================================================
   ADMIN-FLANDES · ADAPTADOR DEL ASISTENTE DE AYUDA
   24/10/2026 · entrega 8 (la pieza es la misma de las otras seis apps)

   La pieza kit/asistente.js no sabe nada de esta app. Aquí se le dice:
     · a dónde puede llevar (destino), con qué rótulo y con qué filtro ya
       puesto: usuarios bloqueados / sin celular / sin correo / con la
       contraseña del documento / SIN CONTRATO, soportes por atender o
       reabiertos, contratistas activos, la sección de CONFIGURACIÓN,
     · qué está cerrado y por qué (puerta): el permiso de la vista (el
       mismo PERMISO del enrutador; ASISTENTE solo para DEV),
     · lo más urgente al abrir (urgente): mantenimiento encendido →
       soportes reabiertos → soportes por atender → contratistas
       atrasados → bloqueados → festivos que no coinciden → supervisores
       sin grupo → usuarios sin celular → guías sin PDF,
     · los datos reales de las respuestas ({{clave}}).

   TODO sale de lo que la app ya trajo: las cifras del inicio ligero
   (login), los usuarios/supervisores/festivos que llegan de fondo y, si
   ya se abrieron, soportes, atrasos, mi bot y el asistente. Ningún dato
   viaja al servidor para responder.

   "Hablar con soporte": ADMIN no se pide soporte a sí mismo (10/10). Al
   DEV la pregunta sin respuesta lo lleva a ASISTENTE DE AYUDA › Probar con
   la frase puesta, para enseñársela ahí mismo; a otro rol, al soporte.
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  if (!K || !K.piezas.asistente) return;

  function APP() { return window.ADMIN_APP || {}; }
  function yo() { try { return (APP().yo && APP().yo()) || {}; } catch (e) { return {}; } }
  function A() { try { return (APP().arranque && APP().arranque()) || null; } catch (e) { return null; } }
  function N() { try { return APP().cifras ? APP().cifras() : {}; } catch (e) { return {}; } }
  function esDev() { return K.norm(yo().rol || '') === 'DEV'; }
  function puede(p) { try { return APP().puede ? APP().puede(p) : true; } catch (e) { return true; } }

  var APP_T = { CONTRATISTA: 'Contratista', CONTRATACION: 'Contratación', SUPERVISION: 'Supervisión', CONTABILIDAD: 'Contabilidad',
    TESORERIA: 'Tesorería', COMUNICACIONES: 'Comunicaciones', ADMIN: 'Admin' };

  function nombre(s) {
    var t = K.piezas.personas ? K.piezas.personas.nombrePropio(s) : String(s || '');
    return t.replace(/ (De|Del|La|Las|Los|Y|E|En) /g, function (m) { return m.toLowerCase(); })
            .replace(/ (De|Del|La|Las|Los|Y|E|En) /g, function (m) { return m.toLowerCase(); });
  }
  function plural(n, uno, varios) { return K.numero(n) + ' ' + (n === 1 ? uno : varios); }
  function lista(filas, fmt, max) {
    max = max || 6;
    var t = filas.slice(0, max).map(fmt).join('\n');
    if (filas.length > max) t += '\n… y ' + (filas.length - max) + ' más.';
    return t;
  }
  function usuarios() { var a = A(); return (a && a.usuarios) || null; }
  function activos() { return (usuarios() || []).filter(function (u) { return u.estado === 'ACTIVO'; }); }
  function linUsuario(u) { return '· ' + nombre(u.nombre) + ' — ' + (APP_T[u.app] || u.app) + (u.rol ? ' (' + u.rol + ')' : ''); }

  /* ---------- lo más urgente al abrir ---------- */

  function urgente() {
    var a = A();
    if (!a) return null;
    var n = N();
    if (n.mantenimiento && puede('configuracion')) {
      return { texto: '**El modo mantenimiento está ENCENDIDO** en: ' + n.mantenimiento + '. Esas apps no dejan entrar a nadie más que al DEV.', accion: 'ir:cfgMantenimiento' };
    }
    if (n.sopReabiertos && puede('soportes')) {
      return { texto: '**' + plural(n.sopReabiertos, 'soporte se reabrió', 'soportes se reabrieron') + '**: lo' + (n.sopReabiertos === 1 ? '' : 's') + ' calificaron con 1 o 2 estrellas.', accion: 'ir:sopReabiertos' };
    }
    if (n.sopAbiertos && puede('soportes')) {
      return { texto: 'Hay **' + plural(n.sopAbiertos, 'soporte por atender', 'soportes por atender') + '**' + (n.sopPendientes ? ' (' + n.sopPendientes + ' sin responder)' : '') + '.', accion: 'ir:sopAbiertos' };
    }
    if (n.atrasados && puede('configuracion')) {
      return { texto: '**' + plural(n.atrasados, 'contratista tiene', 'contratistas tienen') + ' la cuenta atrasada**: no la presentaron al supervisor dentro del plazo.', accion: 'ir:atrasos' };
    }
    if (n.bloqueados && puede('usuarios')) {
      return { texto: '**' + plural(n.bloqueados, 'usuario está bloqueado', 'usuarios están bloqueados') + '** por intentos fallidos.', accion: 'ir:usBloqueados' };
    }
    if (!n.festivosAlDia && (a.festivos || a.resumen) && puede('configuracion')) {
      return { texto: 'Los **festivos** de la hoja no coinciden con los calculados por ley: revísalos.', accion: 'ir:cfgCalendario' };
    }
    if (n.supSinGrupo && puede('configuracion')) {
      return { texto: '**' + plural(n.supSinGrupo, 'supervisor no tiene', 'supervisores no tienen') + ' grupo de WhatsApp**: sus avisos al grupo no salen.', accion: 'ir:cfgSupervisores' };
    }
    if (n.sinCelular && puede('usuarios')) {
      return { texto: '**' + plural(n.sinCelular, 'usuario activo no tiene', 'usuarios activos no tienen') + ' celular**: no reciben la bienvenida ni recuperan la contraseña.', accion: 'ir:usSinCelular' };
    }
    if (n.sinGuia && puede('configuracion')) {
      return { texto: '**' + plural(n.sinGuia, 'guía rápida no tiene', 'guías rápidas no tienen') + ' PDF publicado**: su "Descargar guía rápida" no baja nada.', accion: 'ir:cfgGuias' };
    }
    return null;
  }

  /* ---------- a dónde puede llevar ---------- */

  /* [rótulo, ruta, antes de ir] */
  function filtroSoportes(estado) { return function () { if (window.SOPORTES && window.SOPORTES.filtrar) window.SOPORTES.filtrar({ estado: estado, app: '' }); }; }
  function soloMios() { if (window.BITACORA && window.BITACORA.soloDe) window.BITACORA.soloDe(yo().documento); }
  var DESTINOS = {
    inicio:           ['Ir al inicio', 'inicio'],
    configuracion:    ['Ir a CONFIGURACIÓN', 'configuracion'],
    cfgCalendario:    ['Ir al Calendario', 'configuracion/calendario'],
    cfgCatalogos:     ['Ir a Catálogos', 'configuracion/catalogos'],
    cfgSupervisores:  ['Ir a Supervisores', 'configuracion/supervisores'],
    cfgGrupos:        ['Ir a Grupos y carpetas', 'configuracion/grupos'],
    cfgPlantillas:    ['Ir a Plantillas', 'configuracion/plantillas'],
    cfgGuias:         ['Ir a Guías rápidas', 'configuracion/guias'],
    cfgMensajes:      ['Ir a MENSAJES Y AVISOS', 'configuracion/mensajes'],
    cfgMantenimiento: ['Ir a MANTENIMIENTO', 'configuracion/mantenimiento'],
    cfgMarca:         ['Ir a Marca', 'configuracion/marca'],
    usuarios:         ['Ir a USUARIOS Y ROLES', 'usuarios'],
    usBloqueados:     ['Ver los bloqueados', 'usuarios/BLOQUEADOS'],
    usSinCelular:     ['Ver los que no tienen celular', 'usuarios/SIN_CELULAR'],
    usSinCorreo:      ['Ver los que no tienen correo', 'usuarios/SIN_CORREO'],
    usClaveDoc:       ['Ver los de contraseña = documento', 'usuarios/CLAVE_DOC'],
    usSinContrato:    ['Ver los SIN CONTRATO', 'usuarios/SIN_CONTRATO'],
    soportes:         ['Ir a SOPORTES', 'soportes', filtroSoportes('')],
    sopAbiertos:      ['Ver los soportes por atender', 'soportes', filtroSoportes('ABIERTOS')],
    sopReabiertos:    ['Ver los reabiertos', 'soportes', filtroSoportes('REABIERTO')],
    sopNuevo:         ['Cargar un soporte', 'soportes/nuevo'],
    atrasos:          ['Ir a CUENTAS ATRASADAS', 'atrasos'],
    agenda:           ['Ir a la AGENDA DE REVISIÓN', 'agenda'],
    bitacora:         ['Ir a la BITÁCORA', 'bitacora'],
    registros:        ['Ir a MIS REGISTROS', 'bitacora', soloMios],
    recordatorios:    ['Ir a RECORDATORIOS', 'recordatorios'],
    comunicados:      ['Ir a COMUNICADOS', 'comunicados'],
    mibot:            ['Ir a MI BOT', 'mibot'],
    tablero:          ['Ir al TABLERO DEL ECOSISTEMA', 'tablero'],
    rendimiento:      ['Ir al TABLERO DE RENDIMIENTO', 'rendimiento'],
    tutoriales:       ['Ir a TUTORIALES EN VIDEO', 'tutoriales'],
    asistente:        ['Ir a ASISTENTE DE AYUDA', 'asistente'],
    contratistas:     ['Ir a CONTRATISTAS', 'contratistas'],
    ctActivos:        ['Ver los contratos activos', 'contratistas/activos'],
    agregar:          ['Ir a AGREGAR CONTRATISTA', 'agregar'],
    masiva:           ['Ir a CARGA MASIVA', 'masiva']
  };
  var NOMBRES = { configuracion: 'CONFIGURACIÓN', usuarios: 'USUARIOS Y ROLES', soportes: 'SOPORTES', atrasos: 'CUENTAS ATRASADAS',
    agenda: 'la AGENDA DE REVISIÓN', bitacora: 'la BITÁCORA', recordatorios: 'RECORDATORIOS', comunicados: 'COMUNICADOS', mibot: 'MI BOT',
    tablero: 'los TABLEROS', rendimiento: 'los TABLEROS', tutoriales: 'TUTORIALES EN VIDEO', asistente: 'ASISTENTE DE AYUDA (solo DEV)',
    contratistas: 'CONTRATISTAS', agregar: 'AGREGAR CONTRATISTA', masiva: 'CARGA MASIVA' };

  function rutaActual() { return String(location.hash || '').replace(/^#\/?/, ''); }

  function destino(id) {
    var d = DESTINOS[id];
    if (!d) return null;
    return { etiqueta: d[0], ir: function () {
      if (d[2]) { try { d[2](); } catch (e) {} }
      if (rutaActual() === d[1]) { window.dispatchEvent(new HashChangeEvent('hashchange')); return; }
      location.hash = '#/' + d[1];
    } };
  }

  /** Lo cerrado se explica con el permiso que falta (el mismo del enrutador). */
  function puerta(id) {
    var d = DESTINOS[id];
    if (!d || d[1] === 'inicio') return null;
    var v = d[1].split('/')[0];
    var perm = APP().permiso ? APP().permiso(v) : v;
    if (puede(perm)) return null;
    if (v === 'asistente') return { texto: 'El **ASISTENTE DE AYUDA** (temas y entrenamiento) solo lo maneja el rol **DEV**.', accion: '' };
    return { texto: 'Tu usuario no tiene permiso para **' + (NOMBRES[v] || v) + '**. Los permisos de ADMIN los da el DEV.', accion: '' };
  }

  /* ---------- acciones que no son ir a una vista ---------- */

  function vistaTitulo() { try { return (APP().vistaActual && APP().vistaActual()) || ''; } catch (e) { return ''; } }

  function accion(a) {
    switch (a) {
      case 'guia': return { etiqueta: 'Descargar la guía rápida', icono: 'descargar', cierra: false, hacer: function () { if (K.piezas.guia) K.piezas.guia.descargar('ADMIN'); } };
      case 'soporte':
        /* 10/10 · ADMIN no se pide soporte a sí mismo: al DEV lo lleva a enseñarle la frase al asistente */
        if (esDev()) return { etiqueta: 'Enseñarle esta pregunta', icono: 'robot', hacer: function (p) {
          if (window.ASISTENTE_ADMIN && window.ASISTENTE_ADMIN.probar) window.ASISTENTE_ADMIN.probar({ app: 'ADMIN', frase: p || '', vista: vista() });
          if (rutaActual() === 'asistente') window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = '#/asistente';
        } };
        return { etiqueta: 'Contarle a soporte', icono: 'salvavidas', hacer: function (p) {
          if (K.piezas.soporte) K.piezas.soporte.abrir({ vista: vistaTitulo(), texto: p ? 'Le pregunté al asistente: «' + p + '»\n' : '' });
        } };
      case 'foto': return { etiqueta: 'Cambiar mi foto', icono: 'camara', hacer: function () { if (APP().abrirFoto) APP().abrirFoto(); } };
      case 'clave': return { etiqueta: 'Actualizar contraseña', icono: 'llave', hacer: function () { K.piezas.sesion.cambiarClave(); } };
      case 'instalar': return { etiqueta: 'Instalar la app', icono: 'descargar', hacer: function () { if (K.piezas.instalar) K.piezas.instalar.abrir(); } };
      default: return null;
    }
  }

  /* ---------- los datos de las respuestas ---------- */

  var LLEGANDO = 'Los datos de las vistas todavía están llegando: pregúntame de nuevo en un momento.';
  function sinPermiso(q) { return 'Tu usuario no tiene permiso para ' + q + '. Los permisos de ADMIN los da el DEV.'; }

  function dias(f) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(f || ''));
    if (!m) return -1;
    var d = new Date(+m[3], +m[2] - 1, +m[1]), h = new Date(); h.setHours(0, 0, 0, 0);
    return Math.round((h - d) / 864e5);
  }
  function haceDias(n) { return n < 0 ? '' : (n === 0 ? 'hoy' : 'hace ' + n + (n === 1 ? ' día' : ' días')); }

  function datoUsuarios(k, marca, uno, varios, ok) {
    if (!puede('usuarios')) return sinPermiso('USUARIOS Y ROLES');
    var n = N()[k] || 0;
    var us = usuarios();
    if (!us) return n ? 'Hay **' + plural(n, uno, varios) + '**. Te llevo a la lista.' : ok;
    var l = (window.USUARIOS && window.USUARIOS._marcas && window.USUARIOS._marcas[marca])
      ? us.filter(window.USUARIOS._marcas[marca][1]) : [];
    if (!l.length) return ok;
    return '**' + plural(l.length, uno, varios) + '**:\n' + lista(l, linUsuario, 8);
  }

  function textoPermisos() {
    if (esDev()) return 'Tu usuario es **DEV**: entra a todo, incluido el ASISTENTE DE AYUDA y el modo mantenimiento.';
    var si = [], no = [];
    [['configuracion', 'configuración, recordatorios, atrasos y agenda'], ['usuarios', 'usuarios y roles'], ['bitacora', 'bitácora'],
     ['soportes', 'soportes'], ['comunicados', 'comunicados'], ['miBot', 'mi bot'], ['dashboard', 'tableros'], ['tutoriales', 'tutoriales'],
     ['contratistas', 'contratistas'], ['agregarContratista', 'agregar contratistas']]
      .forEach(function (p) { (puede(p[0]) ? si : no).push(p[1]); });
    return 'Tu usuario es **' + (yo().rol || 'ADMIN') + '** de Admin. Puede: ' + (si.join(', ') || 'consultar') + '.' +
      (no.length ? ' No tiene: ' + no.join(', ') + '. Los permisos los da el DEV.' : '');
  }

  function dato(k) {
    var a = A(), n = N(), d, l, t;
    if (!a && k !== 'nombre' && k !== 'permisos' && k !== 'avisosTelefono') return 'Todavía estoy cargando el inicio: pregúntame en un momento.';
    switch (k) {
      case 'queMeToca':
        var u = urgente();
        return u ? u.texto : 'Por ahora **nada pide atención**: todo en orden. ✓';

      case 'resumen':
        t = '**' + K.numero(n.activos || 0) + '** usuarios activos en las apps de funcionarios' +
          (n.bloqueados ? ', **' + n.bloqueados + '** bloqueados' : '') + '. ';
        t += n.sopAbiertos ? 'Soportes por atender: **' + n.sopAbiertos + '**. ' : 'Ningún soporte por atender. ';
        if (n.atrasados) t += 'Contratistas atrasados: **' + n.atrasados + '**. ';
        t += n.mantenimiento ? '**Mantenimiento ENCENDIDO** en ' + n.mantenimiento + '. ' : 'Todas las apps abiertas. ';
        t += 'Hoy van **' + K.numero(n.cambiosHoy || 0) + '** cambios en la bitácora.';
        if (puede('dashboard')) t += ' Lo girado y las cuentas por estado están en el TABLERO.';
        return t;

      case 'versiones':
        var v = (APP().versiones && APP().versiones()) || {};
        var apps = (APP().apps && APP().apps()) || [];
        if (!Object.keys(v).length) return 'Todavía se están leyendo las versiones publicadas: pregúntame en unos segundos.';
        return 'La versión publicada de cada app:\n' + apps.map(function (x) { return '· **' + x.t + '**: ' + (v[x.app] || 'leyendo…'); }).join('\n');

      case 'mantenimiento':
        return n.mantenimiento ? '**Sí: el modo mantenimiento está ENCENDIDO** en ' + n.mantenimiento + '. Esas apps solo dejan entrar al DEV.'
          : 'No: **todas las apps están abiertas**. ✓';

      case 'soportes':
        if (!puede('soportes')) return sinPermiso('SOPORTES');
        d = window.SOPORTES && window.SOPORTES._datos();
        if (d && d.lista) {
          l = d.lista.filter(function (x) { return x.estado === 'PENDIENTE' || x.estado === 'EN PROCESO' || x.estado === 'REABIERTO'; })
            .sort(function (x, y) { return dias(y.fecha) - dias(x.fecha); });
          if (!l.length) return 'Nada por atender. ✓';
          return '**' + plural(l.length, 'soporte por atender', 'soportes por atender') + '**, el que más lleva primero:\n' + lista(l, function (x) {
            return '· **' + x.id + '** ' + nombre(x.emisor) + ' (' + (APP_T[x.app] || x.app) + ') — ' + String(x.estado).toLowerCase() + (dias(x.fecha) >= 0 ? ', ' + haceDias(dias(x.fecha)) : '');
          }, 6);
        }
        if (!n.sopAbiertos) return 'Nada por atender. ✓';
        return 'Hay **' + plural(n.sopAbiertos, 'soporte por atender', 'soportes por atender') + '**: ' +
          [n.sopPendientes ? n.sopPendientes + ' sin responder' : '', (n.sopAbiertos - n.sopPendientes - n.sopReabiertos) > 0 ? (n.sopAbiertos - n.sopPendientes - n.sopReabiertos) + ' en proceso' : '',
           n.sopReabiertos ? n.sopReabiertos + ' reabiertos' : ''].filter(Boolean).join(', ') + '.';

      case 'reabiertos':
        if (!puede('soportes')) return sinPermiso('SOPORTES');
        d = window.SOPORTES && window.SOPORTES._datos();
        if (d && d.lista) {
          l = d.lista.filter(function (x) { return x.estado === 'REABIERTO'; });
          if (!l.length) return 'Ninguno está reabierto ahora. ✓';
          return lista(l, function (x) { return '· **' + x.id + '** ' + nombre(x.emisor) + ' (' + (APP_T[x.app] || x.app) + ')' + (x.estrellas ? ', ' + x.estrellas + '★' : '') + (x.comentario ? ' — “' + x.comentario + '”' : ''); }, 6);
        }
        return n.sopReabiertos ? '**' + plural(n.sopReabiertos, 'soporte reabierto', 'soportes reabiertos') + '**: los calificaron con 1 o 2 estrellas.' : 'Ninguno está reabierto ahora. ✓';

      case 'atrasados':
        if (!puede('configuracion')) return sinPermiso('CUENTAS ATRASADAS');
        d = window.ATRASOS && window.ATRASOS._datos();
        if (d && d.lista) {
          if (!d.lista.length) return 'Nadie tiene la cuenta atrasada. ✓';
          l = d.lista.slice().sort(function (x, y) { return (y.dias || 0) - (x.dias || 0); });
          return '**' + plural(l.length, 'contratista atrasado', 'contratistas atrasados') + '**, el de más días primero:\n' +
            lista(l, function (x) { return '· **' + nombre(x.nombre) + '** — cuenta ' + x.informe + ', ' + x.dias + (x.dias === 1 ? ' día' : ' días') + (x.sup ? ' · sup. ' + nombre(String(x.sup).split(' ').slice(0, 2).join(' ')) : ''); }, 6);
        }
        if (a.atrasos && a.atrasos.total !== undefined) {
          return a.atrasos.total ? '**' + plural(a.atrasos.total, 'contratista tiene', 'contratistas tienen') + ' la cuenta atrasada** (cálculo de hoy). Te llevo a la lista con los nombres y los días.'
            : 'Nadie tiene la cuenta atrasada. ✓';
        }
        return 'El cálculo de hoy todavía no está hecho: te llevo a **CUENTAS ATRASADAS** y ahí se calcula.';

      case 'bloqueados':
        return datoUsuarios('bloqueados', 'BLOQUEADOS', 'usuario bloqueado', 'usuarios bloqueados', 'Nadie está bloqueado ahora. ✓') +
          (n.bloqueados ? '\nToca **Desbloquear** en su tarjeta, o reinicia la contraseña (también desbloquea).' : '');
      case 'sinCelular':
        return datoUsuarios('sinCelular', 'SIN_CELULAR', 'usuario activo sin celular', 'usuarios activos sin celular', 'Todos los usuarios activos tienen celular. ✓');
      case 'sinCorreo':
        return datoUsuarios('sinCorreo', 'SIN_CORREO', 'usuario activo sin correo', 'usuarios activos sin correo', 'Todos los usuarios activos tienen correo. ✓');
      case 'claveDoc':
        return datoUsuarios('claveDoc', 'CLAVE_DOC', 'usuario sigue con la contraseña del documento', 'usuarios siguen con la contraseña del documento', 'Nadie activo tiene como contraseña su documento. ✓');

      case 'supSinGrupo':
        if (!puede('configuracion')) return sinPermiso('CONFIGURACIÓN');
        if (a.supervisores && a.supervisores.lista) {
          l = a.supervisores.lista.filter(function (x) { return !x.grupo; });
          return l.length ? lista(l, function (x) { return '· **' + nombre(x.nombre) + '**' + (x.contratos ? ' — ' + (x.contratos.activos || 0) + ' contratos activos' : ''); }, 8) +
            '\nSus avisos al grupo no salen hasta que les pongas uno.' : 'Todos los supervisores tienen grupo. ✓';
        }
        return n.supSinGrupo ? '**' + plural(n.supSinGrupo, 'supervisor', 'supervisores') + '** sin grupo de WhatsApp: sus avisos al grupo no salen.' : 'Todos los supervisores tienen grupo. ✓';

      case 'festivos':
        if (!puede('configuracion')) return sinPermiso('CONFIGURACIÓN');
        var f = a.festivos;
        t = n.festivosAlDia ? '' : '**Ojo: los festivos de la hoja no coinciden con los calculados por ley.** ';
        if (!f || !f.detalle) return t + (a.cfg ? '' : LLEGANDO + ' ') + 'Se calculan por ley para la vigencia; en **Calendario** marcas los que no aplican o agregas días no laborales.';
        var hoy = new Date(), fuera = {};
        hoy.setHours(0, 0, 0, 0);
        (((f.ajustes || {}).quitar) || []).forEach(function (x) { fuera[x] = 1; });
        l = f.detalle.filter(function (x) {
          var m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(x.fecha || ''));
          return !fuera[x.fecha] && m && new Date(+m[3], +m[2] - 1, +m[1]) >= hoy;
        });
        return t + (l.length ? 'Los próximos festivos:\n' + lista(l, function (x) { return '· **' + String(x.fecha).slice(0, 5) + '** ' + x.nombre; }, 6)
          : 'No quedan festivos este año.') + '\nEn **Calendario** marcas los que no aplican o agregas días no laborales.';

      case 'sinGuia':
        if (!puede('configuracion')) return '';
        if (a.cfg) {
          l = a.cfg.filter(function (it) { return /^GUIA_/.test(it.llave) && !String(it.valor || '').trim(); });
          return l.length ? 'Sin PDF: ' + l.map(function (it) { return '**' + it.llave.replace(/^GUIA_/, '') + '**'; }).join(', ') + '.' : 'Todas las guías tienen su PDF. ✓';
        }
        return n.sinGuia ? '**' + plural(n.sinGuia, 'guía rápida', 'guías rápidas') + '** sin PDF publicado.' : 'Todas las guías tienen su PDF. ✓';

      case 'cambiosHoy':
        if (!puede('bitacora')) return sinPermiso('la BITÁCORA');
        if (a.bitacora) {
          var h = new Date(), hoyT = ('0' + h.getDate()).slice(-2) + '/' + ('0' + (h.getMonth() + 1)).slice(-2) + '/' + h.getFullYear();
          l = a.bitacora.filter(function (b) { return String(b.fecha).indexOf(hoyT) === 0; });
          return l.length ? 'Hoy van **' + l.length + '** cambios, el último primero:\n' + lista(l, function (b) { return '· ' + String(b.fecha).slice(11, 16) + ' **' + b.accion + '** ' + b.objeto + (b.nombre ? ' — ' + nombre(String(b.nombre).split(' ').slice(0, 2).join(' ')) : ''); }, 6)
            : 'Hoy no se ha cambiado nada.';
        }
        return n.cambiosHoy ? 'Hoy van **' + n.cambiosHoy + '** cambios. El detalle (quién, antes y después) está en la **BITÁCORA**.' : 'Hoy no se ha cambiado nada.';

      case 'bot':
        if (!puede('miBot')) return sinPermiso('MI BOT');
        d = window.MIBOT && window.MIBOT._datos();
        if (!d) return 'Abre **MI BOT** y vuelve a preguntarme: así te digo su estado y los envíos de la semana.';
        var st = String((d.estado && d.estado.status) || 'UNKNOWN');
        var E = (window.MIBOT.ESTADOS && window.MIBOT.ESTADOS[st]) || null;
        t = 'El bot está **' + ((E && E.t) || st) + '**.' + (E && E.p && st !== 'ONLINE' ? ' ' + E.p : '');
        if (d.silencio) t += ' **Ojo: los avisos están silenciados** (ninguna app manda WhatsApp ni push).';
        var e7 = (d.envios && d.envios.dias7) || null;
        if (e7 && e7.total) t += ' En 7 días: ' + e7.total + ' WhatsApp, ' + (e7.ok || 0) + ' salieron y ' + (e7.fallos || 0) + ' no.';
        return t;

      case 'asistente':
        if (!esDev()) return '';
        d = window.ASISTENTE_ADMIN && window.ASISTENTE_ADMIN._datos();
        if (!d || !d.resumen) return '';
        return d.resumen.porEnsenar ? 'Hay **' + plural(d.resumen.porEnsenar, 'pregunta por enseñar', 'preguntas por enseñar') + '**.' : 'No hay preguntas por enseñar. ✓';

      case 'permisos': return textoPermisos();
      case 'avisosTelefono':
        var es = K.piezas.avisos ? K.piezas.avisos.estado() : '';
        if (es === 'listo') return 'Este teléfono **ya recibe avisos** de Admin, aunque tengas la app cerrada.';
        if (es === 'ios-sin-instalar') return 'En iPhone los avisos solo llegan con la app **instalada** en la pantalla de inicio: menú de tu perfil → Instalar la app.';
        if (es === 'bloqueado') return 'Los avisos están **bloqueados** en este navegador: actívalos en los permisos del sitio (el candado junto a la dirección) y vuelve a abrir la app.';
        return 'Los avisos se activan solos al entrar: acepta el permiso de notificaciones cuando el teléfono lo pida.';
      case 'nombre': return nombre(String(yo().nombre || '').split(/\s+/)[0] || '');
      default: return '';
    }
  }

  function vista() {
    try { var cl = (K.piezas.insights.configuracion() || {}).clave; if (cl) return cl; } catch (e) {}
    return rutaActual().split('/')[0] || 'inicio';
  }

  var ADAPTADOR = {
    vista: vista,
    estado: function () { return 'ACTIVO'; },
    dato: dato, urgente: urgente, destino: destino, puerta: puerta, accion: accion
  };

  /* ══════════════ la pantalla de entrada ══════════════ */

  function campo(n) { return document.querySelector('.kit-sesion [name="' + n + '"]'); }
  function resaltar(el) {
    if (!el) return;
    el.classList.add('kit-as-resalta');
    try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
    setTimeout(function () { el.classList.remove('kit-as-resalta'); }, 3600);
  }

  var ENTRADA = {
    vista: function () { return 'entrada'; },
    estado: function () { return ''; },
    dato: function () { return ''; },
    urgente: function () { return null; },
    destino: function () { return null; },
    puerta: function () { return null; },
    accion: function (a) {
      if (a === 'olvide') return { etiqueta: 'Mostrarme el botón', icono: 'llave', hacer: function () {
        var d = campo('documento');
        if (d && !String(d.value || '').trim()) { d.focus(); resaltar(d); }
        /* NO se toca: pedir la contraseña lo decide la persona */
        resaltar(document.querySelector('.kit-sesion__olvide'));
      } };
      if (a === 'documento') return { etiqueta: 'Ir a la entrada', icono: 'persona', hacer: function () {
        var d = campo('documento'), cl = campo('clave');
        var el = d && !String(d.value || '').trim() ? d : (cl || d);
        if (el) { el.focus(); resaltar(el); }
      } };
      if (a === 'instalar') return { etiqueta: 'Cómo instalarla', icono: 'descargar', hacer: function () { if (K.piezas.instalar) K.piezas.instalar.abrir(); } };
      return null;
    }
  };

  K.piezas.asistente.configurar({
    app: 'ADMIN',
    base: window.ASISTENTE_BASE || [],
    adaptador: ADAPTADOR
  });

  window.ADMIN_ASISTENTE = {
    adaptador: ADAPTADOR,
    entrada: ENTRADA,
    /* para las pruebas */
    _urgente: urgente, _dato: dato, _destinos: DESTINOS
  };
}());
