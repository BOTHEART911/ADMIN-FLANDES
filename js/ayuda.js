/* ============================================================
   ADMIN-FLANDES · AYUDA POR VISTA (Insights)
   Ecosistema Flandes · Fase 10 (10.2: contratistas, novedades y todos los datos)

   El mismo patrón de las otras apps: cada vista tiene una GUÍA que habla
   de lo que hay en pantalla y PREGUNTAS RÁPIDAS con la respuesta
   calculada en el teléfono. Nada viaja al servidor ni pasa por una IA:
   los números salen de lo que ya llegó con el arranque.
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var CTX = function () { return {}; };

  function ctx() { try { return CTX() || {}; } catch (e) { return {}; } }
  function A() { return ctx().arranque || {}; }
  function nombre(s) {
    var t = K.piezas.personas ? K.piezas.personas.nombrePropio(s) : String(s || '');
    return t.replace(/ (De|Del|La|Las|Los|Y|E|En) /g, function (m) { return m.toLowerCase(); });
  }
  function primerNombre(s) { return nombre(String(s || '').trim().split(/\s+/)[0] || ''); }
  function hola() { var y = ctx().yo || {}; return y.nombre ? primerNombre(y.nombre) + ', ' : ''; }
  function usuarios() { return A().usuarios || []; }
  function activos() { return usuarios().filter(function (u) { return u.estado === 'ACTIVO'; }); }
  function listaCorta(filas, fmt, max) {
    max = max || 8;
    var t = filas.slice(0, max).map(fmt).join('\n');
    if (filas.length > max) t += '\n… y ' + (filas.length - max) + ' más.';
    return t;
  }
  var APP_T = { CONTRATACION: 'Contratación', SUPERVISION: 'Supervisión', CONTABILIDAD: 'Contabilidad', TESORERIA: 'Tesorería', COMUNICACIONES: 'Comunicaciones', ADMIN: 'Admin' };

  var P_BLOQUEADOS = { texto: '¿Hay alguien bloqueado?', responde: function () {
    var l = usuarios().filter(function (u) { return u.intentos; });
    return l.length ? listaCorta(l, function (u) { return '· **' + nombre(u.nombre) + '** (' + (APP_T[u.app] || u.app) + '): ' + u.intentos + ' intentos' + (u.bloqueado ? ' — **bloqueado**' : ''); })
      + '\nToca **Desbloquear** en su tarjeta, o reinicia la contraseña (también desbloquea).'
      : 'Nadie tiene intentos fallidos ahora mismo. ✓';
  } };
  var P_SIN_CEL = { texto: '¿Quién no tiene celular?', responde: function () {
    var l = activos().filter(function (u) { return !u.telefono; });
    return l.length ? '**' + l.length + '** usuarios activos sin celular (no reciben la bienvenida ni recuperan la contraseña por WhatsApp):\n' +
      listaCorta(l, function (u) { return '· ' + nombre(u.nombre) + ' — ' + (APP_T[u.app] || u.app); }) : 'Todos los usuarios activos tienen celular. ✓';
  } };

  var GUIAS = {

    inicio: function () {
      var a = A();
      var t = hola() + 'este es el tablero del ecosistema. ';
      var act = activos().length;
      t += 'Hay **' + act + '** usuarios activos en las apps de funcionarios. ';
      var m = a.mantenimiento || {};
      if (m.activo) t += '**Ojo: el modo mantenimiento está ENCENDIDO** (' + ((m.apps || []).length ? m.apps.join(', ') : 'todas las apps') + '). ';
      var so = a.soporte;
      if (a.atrasos && a.atrasos.total) t += 'Hay **' + a.atrasos.total + '** ' + (a.atrasos.total === 1 ? 'contratista' : 'contratistas') + ' con la cuenta atrasada (**CUENTAS ATRASADAS**). ';
      if (so && (so.pendientes || so.reabiertos || so.enProceso)) t += 'En **SOPORTES** hay **' + ((so.pendientes || 0) + (so.enProceso || 0) + (so.reabiertos || 0)) + '** por atender' + (so.reabiertos ? ' (' + so.reabiertos + ' reabiertos)' : '') + '. ';
      t += 'En **CONTRATISTAS** gestionas cualquier contrato (datos, novedades, cesión, cuentas en silencio y canal). Abajo, lo que pide atención: toca una línea y abre la vista ya filtrada.';
      return {
        guia: t,
        botones: [P_BLOQUEADOS, P_SIN_CEL,
          { texto: '¿Cuántos usuarios hay por app?', responde: function () {
              var c = {};
              activos().forEach(function (u) { c[u.app] = (c[u.app] || 0) + 1; });
              return Object.keys(c).sort().map(function (k) { return '· **' + (APP_T[k] || k) + '**: ' + c[k]; }).join('\n') || 'No hay usuarios activos.';
            } },
          { texto: '¿Qué versión tiene cada app?', responde: function () {
              var v = ctx().versiones || {};
              var k = Object.keys(v);
              return k.length ? k.map(function (x) { return '· **' + x + '**: ' + v[x]; }).join('\n') : 'Todavía se están leyendo las versiones: pregunta en unos segundos.';
            } }]
      };
    },

    configuracion: function () {
      var sec = window.CONFIG ? window.CONFIG._seccion() : '';
      var f = A().festivos || {};
      var textos = {
        calendario: 'Los **festivos** se calculan por ley para la vigencia (' + (f.vigencia || '') + ') y la siguiente; aquí marcas los que no aplican o agregas días no laborales. El **día de corte** manda a la radicación a los dos primeros hábiles del mes siguiente, y el **cierre de vigencia** apaga la radicación.',
        catalogos: 'Las listas que se escogen en los formularios. Agrega con el campo de abajo y quita con la X. Las que tienen **candado** las usa el código tal cual.',
        supervisores: 'Los supervisores que se ofrecen al crear un contrato, con su celular, su firma y su **grupo** de WhatsApp (sin grupo, sus avisos no salen).',
        grupos: 'Ids de los grupos de WhatsApp y carpetas de Drive. Pega el enlace completo: el CORE saca el id y comprueba que la carpeta exista.',
        plantillas: 'Las plantillas de Google de cada documento. **Ir a plantilla** la abre para revisarla.',
        mensajes: 'Toca un aviso para cambiar su texto (push, WhatsApp, correo) y sus canales. Los **marcadores** entre llaves se rellenan solos.',
        mantenimiento: 'Con el **modo mantenimiento** cierras una o todas las apps con un mensaje; tú sigues entrando como DEV. Aquí también están las direcciones de cada app (con su versión), los sonidos y las claves.',
        marca: 'Los nombres y firmas que salen en los documentos y en el pie de las siete apps.',
        otras: 'El resto de CONFIG, con el editor según su tipo. Las contables y las de Tesorería se editan normalmente en su app.'
      };
      return {
        guia: (textos[sec] || 'La configuración del ecosistema.') + ' Cada cambio pide un **motivo** (opcional) y queda en la bitácora.',
        botones: [
          { texto: '¿Qué cambié hoy?', responde: function () {
              var d = new Date(), hoy = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
              var l = (A().bitacora || []).filter(function (b) { return String(b.fecha).indexOf(hoy) === 0; });
              return l.length ? listaCorta(l, function (b) { return '· ' + String(b.fecha).slice(11, 16) + ' **' + b.accion + '** ' + b.objeto; }) : 'Hoy no se ha cambiado nada.';
            } },
          { texto: '¿Cuáles son los festivos de este año?', responde: function () {
              var l = (f.detalle || []).filter(function (x) { return !x.quitado && String(x.fecha).slice(-4) === String(f.vigencia); });
              return l.length ? listaCorta(l, function (x) { return '· **' + x.fecha.slice(0, 5) + '** ' + x.nombre; }, 20) : 'No hay festivos calculados.';
            } },
          { texto: '¿Qué supervisores no tienen grupo?', responde: function () {
              var s = (A().supervisores || { lista: [] }).lista.filter(function (x) { return !x.grupo; });
              return s.length ? listaCorta(s, function (x) { return '· **' + nombre(x.nombre) + '** — ' + x.contratos.activos + ' contratos activos'; }) + '\nSus avisos al grupo no salen hasta que les pongas uno.' : 'Todos los supervisores tienen grupo. ✓';
            } }
        ]
      };
    },

    usuarios: function () {
      return {
        guia: 'Cada tarjeta es un usuario en UNA app (la misma persona puede estar en varias). Filtra por app y estado. Al crear uno, la contraseña es su **documento** salvo que escribas otra, y puedes mandarle la **bienvenida** en el mismo paso. ' +
              'Los **REVISOR** de Supervisión necesitan saber a quién revisan; y en Supervisión y Contratación decides si **aprueban y devuelven**. En Contratación una persona puede ser **REVISOR y CREADOR** a la vez (revisar cuentas sigue siendo solo del REVISOR).',
        botones: [P_BLOQUEADOS, P_SIN_CEL,
          { texto: '¿Qué estoy viendo?', responde: function () {
              var l = window.USUARIOS ? window.USUARIOS._filtradas() : [];
              var c = {};
              l.forEach(function (u) { String(u.rol || '').split(',').forEach(function (r) { r = r.trim(); if (r) c[r] = (c[r] || 0) + 1; }); });
              return 'Estás viendo **' + l.length + '** usuarios' + (l.length ? ': ' + Object.keys(c).map(function (k) { return c[k] + ' ' + k; }).join(', ') : '') + '.';
            } },
          { texto: '¿Quién sigue con la contraseña del documento?', responde: function () {
              var l = activos().filter(function (u) { return u.claveEsDocumento; });
              return l.length ? '**' + l.length + '** no la han cambiado:\n' + listaCorta(l, function (u) { return '· ' + nombre(u.nombre) + ' — ' + (APP_T[u.app] || u.app); }) : 'Nadie activo tiene como contraseña su documento. ✓';
            } }]
      };
    },

    bitacora: function () {
      return {
        guia: 'Cada cambio hecho desde ADMIN: quién, cuándo, en qué app, sobre qué, **antes y después**, y el motivo. Abre "Ver el cambio" para el detalle campo por campo. El **PDF** agrupa por día; el **Excel** trae una fila por cambio con todo el valor.',
        botones: [
          { texto: '¿Qué se cambia más?', responde: function () {
              var l = window.BITACORA ? window.BITACORA._filtradas() : [];
              var c = {};
              l.forEach(function (b) { c[b.objeto] = (c[b.objeto] || 0) + 1; });
              var k = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; });
              return k.length ? listaCorta(k, function (x) { return '· **' + x + '**: ' + c[x]; }, 8) : 'No hay cambios con estos filtros.';
            } },
          { texto: '¿Cuántos cambios sin motivo?', responde: function () {
              var l = (window.BITACORA ? window.BITACORA._filtradas() : []).filter(function (b) { return !b.motivo; });
              return l.length ? '**' + l.length + '** cambios no tienen motivo. Escribirlo ayuda a entender después por qué se hizo.' : 'Todos los cambios tienen motivo. ✓';
            } }
        ]
      };
    }
  };

  /* ══════════════ 10.3 · recordatorios y notificación final ══════════════ */
  function RC() { return window.RECORDATORIOS ? (window.RECORDATORIOS._datos() || null) : null; }

  GUIAS.recordatorios = function () {
    var v = RC();
    var t = 'Los recordatorios de cuentas y la notificación final, que antes eran dos scripts sueltos. ';
    if (v) {
      t += 'Recordatorios **' + (v.rec.activo ? 'encendidos' : 'apagados') + '**, notificación final **' + (v.fin.activo ? 'encendida' : 'apagada') + '** y reloj **' + (v.reloj > 0 ? 'instalado' : 'sin instalar') + '**. ';
      if (!v.rec.activo && !v.fin.activo) t += 'Así debe estar mientras se trabaja sobre la copia de trabajo. ';
    }
    t += 'La **vista previa** muestra lo que saldría ahora mismo sin mandar nada.';
    return {
      guia: t,
      botones: [
        { texto: '¿Qué dice cada color?', responde: function () {
            var c = v ? h12(v.rec.horaCorte) : '4:00 pm';
            return '🟢 Reportada **hoy**, o el hábil anterior **desde las ' + c + '**.\n🟠 Reportada el hábil anterior **antes de las ' + c + '**.\n🔴 Reportada hace **dos hábiles o más**, a cualquier hora.\nLos fines de semana y los festivos no cuentan: lo del sábado cuenta como del viernes en la tarde.';
          } },
        { texto: '¿Qué saldría ahora?', responde: function () {
            if (!v) return 'La vista previa todavía está cargando.';
            var p = v.previa;
            return '· **A supervisores:** ' + p.B1.resumen + (p.B1.mensajes.length ? ' (' + p.B1.mensajes.map(function (m) { return nombre(m.para) + ' ' + m.cuentas; }).join(', ') + ')' : '') +
              '\n· **A Contratación:** ' + p.B2.resumen + '\n· **Notificación final:** ' + p.FN.resumen + '\n· **Cierre de acceso:** ' + p.FD.resumen;
          } },
        { texto: '¿A quién notificaría el lunes?', responde: function () {
            if (!v) return 'La vista previa todavía está cargando.';
            var l = v.previa.FN.mensajes;
            return l.length ? '**' + l.length + '** contratos ACTIVOS con su última cuenta PAGADA:\n' + listaCorta(l, function (m) { return '· ' + nombre(m.para) + ' (' + m.id + ')'; }) + '\nConservan el acceso hasta el **' + (v.previa.FN.hasta || '') + '**.' : 'Ninguno: no hay contratos ACTIVOS con su última cuenta PAGADA.';
          } },
        { texto: '¿Cómo lo paso a producción?', responde: function () {
            return '1. Apaga los activadores de los proyectos viejos **RECORDATORIO_CUENTAS** y **NOTIFICACION_FINAL**.\n2. Con el CORE ya apuntando al libro de producción, enciende aquí los dos interruptores y guarda.\n3. Toca **Instalar el reloj**.\nDesde el siguiente turno sale todo desde el CORE.';
          } }
      ]
    };
  };
  function h12(hm) { var p = String(hm || '').split(':'), h = +p[0], m = +p[1]; return isNaN(h) ? hm : (h % 12 || 12) + ':' + ('0' + m).slice(-2) + (h >= 12 ? ' pm' : ' am'); }

  /* ══════════════ 10.4 · soportes ══════════════ */
  function SO() { return window.SOPORTES ? window.SOPORTES._datos() : null; }
  function soLista() { var d = SO(); return (d && d.lista) || []; }
  var SO_APP = { CONTRATISTA: 'Contratista', CONTRATACION: 'Contratación', SUPERVISION: 'Supervisión', CONTABILIDAD: 'Contabilidad', TESORERIA: 'Tesorería', COMUNICACIONES: 'Comunicaciones', ADMIN: 'Admin' };
  function soDias(f) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(f || ''));
    if (!m) return -1;
    var d = new Date(+m[3], +m[2] - 1, +m[1]), hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return Math.round((hoy - d) / 864e5);
  }

  GUIAS.soportes = function () {
    var d = SO(), t;
    if (!d) t = 'Los soportes están cargando.';
    else {
      var c = d.cifras || {};
      var abiertos = (c.PENDIENTE || 0) + (c['EN PROCESO'] || 0) + (c.REABIERTO || 0);
      t = hola() + 'hay **' + c.total + '** soportes. ' + (abiertos ? '**' + abiertos + '** por atender' + (c.REABIERTO ? ' (**' + c.REABIERTO + ' reabiertos**: los calificaron mal)' : '') + '. ' : 'No hay nada por atender. ✓ ') +
          (c.calificados ? 'La atención va en **' + String(c.promedio).replace('.', ',') + ' de 5** con ' + c.calificados + (c.calificados === 1 ? ' calificación' : ' calificaciones') + '. ' : '') +
          'Al dejar un caso **resuelto**, a la persona le salen las estrellas la próxima vez que abra su app; con 1 o 2 vuelve aquí. **Cargar un soporte** registra lo que atendiste por teléfono o en persona.';
    }
    return {
      guia: t,
      botones: [
        { texto: '¿Qué está esperando respuesta?', responde: function () {
            var l = soLista().filter(function (x) { return x.estado === 'PENDIENTE' || x.estado === 'REABIERTO' || x.estado === 'EN PROCESO'; })
              .sort(function (a, b) { return soDias(b.fecha) - soDias(a.fecha); });
            return l.length ? '**' + l.length + '** por atender, el que más lleva primero:\n' + listaCorta(l, function (x) {
              var n = soDias(x.fecha);
              return '· **' + x.id + '** ' + nombre(x.emisor) + ' (' + (SO_APP[x.app] || x.app) + ') — ' + x.estado + (n >= 0 ? ', ' + (n === 0 ? 'hoy' : 'hace ' + n + (n === 1 ? ' día' : ' días')) : ', sin fecha (app anterior)');
            }) : 'Nada por atender. ✓';
          } },
        { texto: '¿Cómo nos califican?', responde: function () {
            var l = soLista().filter(function (x) { return x.estrellas; });
            if (!l.length) return 'Todavía nadie ha calificado. Las estrellas salen cuando dejas un caso **resuelto**.';
            var c = [0, 0, 0, 0, 0, 0], s = 0;
            l.forEach(function (x) { c[x.estrellas]++; s += x.estrellas; });
            var t2 = 'Promedio **' + String(Math.round(s / l.length * 10) / 10).replace('.', ',') + ' de 5** en ' + l.length + (l.length === 1 ? ' calificación' : ' calificaciones') + ':';
            for (var i = 5; i >= 1; i--) if (c[i]) t2 += '\n· ' + i + '★: **' + c[i] + '**';
            var com = l.filter(function (x) { return x.comentario; }).slice(0, 3);
            if (com.length) t2 += '\nLo último que dijeron:\n' + com.map(function (x) { return '· “' + x.comentario + '” (' + x.estrellas + '★, ' + nombre(x.emisor) + ')'; }).join('\n');
            return t2;
          } },
        { texto: '¿Qué se reabrió y por qué?', responde: function () {
            var l = soLista().filter(function (x) { return x.reabierto; });
            return l.length ? listaCorta(l, function (x) { return '· **' + x.id + '** ' + nombre(x.emisor) + ': ' + (x.estado === 'REABIERTO' ? '**sigue reabierto**' : x.estado.toLowerCase()) + (x.comentario ? ' — “' + x.comentario + '”' : ''); }) : 'Ningún caso se ha reabierto. ✓';
          } },
        { texto: '¿Quién pide más soporte?', responde: function () {
            var c = {}, a = {};
            soLista().forEach(function (x) { var k = nombre(x.emisor); c[k] = (c[k] || 0) + 1; a[x.app] = (a[x.app] || 0) + 1; });
            var k = Object.keys(c).sort(function (x, y) { return c[y] - c[x]; });
            if (!k.length) return 'No hay soportes.';
            return listaCorta(k, function (x) { return '· **' + x + '**: ' + c[x]; }, 6) + '\nPor app: ' + Object.keys(a).map(function (x) { return (SO_APP[x] || x) + ' ' + a[x]; }).join(', ') + '.';
          } },
        { texto: '¿Qué estoy viendo?', responde: function () {
            var l = window.SOPORTES ? window.SOPORTES._filtradas() : [];
            var c = {};
            l.forEach(function (x) { c[x.estado] = (c[x.estado] || 0) + 1; });
            return 'Estás viendo **' + l.length + '** soportes' + (l.length ? ': ' + Object.keys(c).map(function (k) { return c[k] + ' ' + k.toLowerCase(); }).join(', ') : '') + '. El **PDF** los agrupa por app con la calificación de cada uno; el **Excel** trae una fila por caso con el historial.';
          } }
      ]
    };
  };

  /* ══════════════ 10.2 · contratistas ══════════════ */
  function CA() { return window.CONTRATOS_ADMIN ? (window.CONTRATOS_ADMIN._ultima() || {}) : {}; }

  GUIAS.novedad = function () {
    return {
      guia: 'Las novedades del contrato. **Otrosí**, **prórroga**, **terminación anticipada** y **liquidación** son solo información (no generan documento) y quedan en la hoja NOVEDADES_CONTRATOS. ' +
            '**Suspensión y reinicio** corre la terminación; **cambio de supervisor** pasa sus cuentas abiertas al nuevo. **Adición** y **cesión** abren su propia vista.',
      botones: [
        { texto: '¿Qué novedades tiene este contrato?', responde: function () {
            var d = CA().d, n = d && d.admin ? d.admin.novedades : [];
            if (!d) return 'El contrato todavía está cargando.';
            if (!n.length) return 'Ninguna registrada desde ADMIN.';
            return listaCorta(n, function (x) { return '· **' + x.novedad + '** ' + (x.fechaNovedad ? 'del ' + x.fechaNovedad : '') + ' — ' + nombre(x.quien); }, 8);
          } },
        { texto: '¿La prórroga cambia el valor?', responde: function () {
            return 'No. La prórroga es **solo tiempo**: corre la fecha de terminación y recalcula el tiempo de ejecución (descontando lo suspendido). Si también hay plata, es una **adición**.';
          } }
      ]
    };
  };

  GUIAS.datos = function () {
    return {
      guia: 'Cada columna de la fila del contrato. Cambia lo que haga falta: las celdas que tocas se marcan y solo esas se escriben. ' +
            'Lo que tiene reglas propias (secretaría, supervisor, valor, CDP, objeto y obligaciones) se edita en **Editar contrato**. La contraseña y el ID no se editan.',
      botones: [
        { texto: '¿Qué pasa si cambio el documento o el contrato?', responde: function () {
            return 'Cambia la llave (**ID CONTRATO** = documento + contrato). La app comprueba que no exista otra igual y **sus cuentas la acompañan**: se les cambia el ID, el documento y el número.';
          } },
        { texto: '¿Y si alguien lo cambió mientras editaba?', responde: function () {
            return 'La app compara la huella de la fila: si otra persona guardó primero, **no se pisa** y te pide volver a abrirla.';
          } }
      ]
    };
  };

  /* las guías de la lista, la ficha, agregar, adición, cesión, suspensión, editar y la
     carga masiva son las de CONTRATACION: js/ayuda-contratos.js (archivo compartido) */
  /* ══════════════ 10.5 · cuentas atrasadas ══════════════ */
  function AT() { return window.ATRASOS ? window.ATRASOS._datos() : null; }
  function nomAt(s) { return K.piezas.personas ? K.piezas.personas.nombrePropio(s) : String(s || ''); }

  GUIAS.atrasos = function () {
    var d = AT(), l = d ? (d.lista || []) : [];
    var t;
    if (!d) t = 'Las cuentas atrasadas están cargando.';
    else if (!l.length) t = 'Nadie tiene la cuenta atrasada: todos presentaron dentro del plazo de **' + (d.dias || 5) + ' días hábiles**. ✓';
    else {
      var v = 0; l.forEach(function (x) { v += x.pendientes || 1; });
      t = '**' + l.length + '** ' + (l.length === 1 ? 'contratista tiene' : 'contratistas tienen') + ' la cuenta atrasada (**' + v + '** ' + (v === 1 ? 'cuenta vencida' : 'cuentas vencidas') + ' sin presentar). ' +
          'La regla: presentar al supervisor dentro de **' + (d.dias || 5) + ' días hábiles** después del fin del periodo, sin fines de semana ni festivos. ' +
          '**Compartir** abre el compartir de tu teléfono o computador con la lista escrita: tú escoges el chat, el grupo o el correo.';
    }
    if (d && d.cfg && d.cfg.push) t += ' El aviso push al contratista está **' + (d.cfg.push.activo ? 'ENCENDIDO' : 'APAGADO') + '**' + (d.porAvisar ? ' y ' + d.porAvisar + ' atrasados aún no lo tienen' : '') + '.';
    if (d && d.sinDatos && d.sinDatos.length) t += ' Ojo: **' + d.sinDatos.length + '** contratos activos no tienen fechas o total de informes, y no se pueden evaluar.';
    return {
      guia: t,
      botones: [
        { texto: '¿Quién lleva más días?', responde: function () {
            var x = AT() && AT().lista || [];
            if (!x.length) return '¡Nadie está atrasado!';
            return listaCorta(x, function (a) { return '· **' + nomAt(a.nombre) + '** — cuenta ' + a.informe + ' de ' + a.total + ', venció el ' + a.limite + ' (' + a.dias + (a.dias === 1 ? ' día hábil' : ' días hábiles') + ')'; }, 6);
          } },
        { texto: '¿Quién debe varias cuentas?', responde: function () {
            var x = (AT() && AT().lista || []).filter(function (a) { return a.pendientes > 1; });
            if (!x.length) return 'Nadie debe más de una cuenta vencida.';
            return listaCorta(x, function (a) { return '· **' + nomAt(a.nombre) + '** — ' + a.pendientes + ' cuentas vencidas, desde la ' + a.informe; }, 8);
          } },
        { texto: '¿Quién la tiene lista y no la reporta?', responde: function () {
            var x = (AT() && AT().lista || []).filter(function (a) { return a.estado === 'INGRESADA'; });
            if (!x.length) return 'Nadie tiene la cuenta atrasada ya ingresada sin reportar.';
            return 'Ya la ingresaron pero les falta **reportarla** en su app:\n' + listaCorta(x, function (a) { return '· **' + nomAt(a.nombre) + '** — cuenta ' + a.informe; }, 8);
          } },
        { texto: '¿Por supervisor?', responde: function () {
            var x = AT() && AT().lista || [], n = {};
            x.forEach(function (a) { n[a.sup] = (n[a.sup] || 0) + 1; });
            var k = Object.keys(n).sort(function (a, b) { return n[b] - n[a]; });
            return k.length ? k.map(function (s) { return '· **' + nomAt(s) + '**: ' + n[s]; }).join('\n') : 'Nadie está atrasado.';
          } },
        { texto: '¿Cómo se cuenta el plazo?', responde: function () {
            var d = AT() || {};
            return 'El periodo de cada cuenta va mes a mes desde la fecha de inicio del contrato (o sigue desde el fin de la cuenta anterior). ' +
              'Desde el día siguiente al fin del periodo se cuentan **' + (d.dias || 5) + ' días hábiles** (sin sábados, domingos ni festivos). ' +
              'Si al terminar ese día la cuenta no se ha **reportado** al supervisor, queda atrasada. Una cuenta en borrador o ingresada sin reportar no cuenta como presentada.';
          } }
      ]
    };
  };

  /* ══════════════ 10.6 · comunicados, mi bot y tableros ══════════════ */

  var APPS_C = { CONTRATISTA: 'Contratistas', CONTRATACION: 'Contratación', SUPERVISION: 'Supervisión', CONTABILIDAD: 'Contabilidad', TESORERIA: 'Tesorería', COMUNICACIONES: 'Comunicaciones' };
  function CM() { return window.COMUNICADOS ? window.COMUNICADOS._datos() : null; }

  GUIAS.comunicados = function () {
    var d = CM();
    var t = hola() + 'aquí publicas comunicados y escoges **a qué apps van**: cada app solo ve lo que le toca, y los teléfonos de esas apps reciben una notificación. ';
    if (d) {
      var pub = (d.lista || []).filter(function (c) { return c.estado === 'PUBLICADO'; }).length;
      t += 'Hay **' + pub + '** publicados. ';
    }
    t += 'Lo que se publicó antes (y lo que publican las otras oficinas) sigue llegando a los contratistas, como siempre.';
    return {
      guia: t,
      botones: [
        { texto: '¿Cuántos teléfonos reciben avisos?', responde: function () {
            var tp = (CM() || {}).telefonosPorApp || {};
            var k = Object.keys(tp);
            return k.length ? k.map(function (a) { return '· **' + (APPS_C[a] || a) + '**: ' + tp[a]; }).join('\n') + '\nSolo reciben la notificación los teléfonos que activaron los avisos en su app.' : 'Todavía no cargó la lista.';
          } },
        { texto: '¿Qué estoy viendo?', responde: function () {
            var l = window.COMUNICADOS ? window.COMUNICADOS._filtradas() : [];
            if (!l.length) return 'Ningún comunicado con estos filtros.';
            var c = {};
            l.forEach(function (x) { window.COMUNICADOS._destinos(x).forEach(function (a) { c[a] = (c[a] || 0) + 1; }); });
            return '**' + l.length + '** comunicados. Por app: ' + Object.keys(c).map(function (a) { return (APPS_C[a] || a) + ' ' + c[a]; }).join(', ') + '.';
          } },
        { texto: '¿Cuál fue el último?', responde: function () {
            var l = ((CM() || {}).lista || []).filter(function (x) { return x.estado === 'PUBLICADO'; });
            if (!l.length) return 'No hay comunicados publicados.';
            var x = l[0];
            return '**' + nombre(x.emisor) + '** (' + (x.fecha || 'sin fecha') + '), para ' + window.COMUNICADOS._destinos(x).map(function (a) { return APPS_C[a] || a; }).join(', ') + ':\n' + String(x.texto || '(solo documentos)').slice(0, 220);
          } }
      ]
    };
  };

  function MB() { return window.MIBOT ? window.MIBOT._datos() : null; }
  GUIAS.mibot = function () {
    var d = MB();
    var t = hola() + 'este es el bot de WhatsApp de las siete apps. ';
    if (d) {
      var E = (window.MIBOT.ESTADOS[(d.estado || {}).status] || {}).t || 'desconocido';
      t += 'Estado: **' + E + '**. ';
      if (!d.llave) t += 'Para verlo y manejarlo pega la **llave de la cuenta** de BuilderBot (no la del proyecto). ';
      if (d.silencio) t += '**Ojo: los avisos están silenciados** (ninguna app manda WhatsApp ni push). ';
    }
    t += 'Si se desconecta: **Generar QR** y escanéalo desde WhatsApp › Dispositivos vinculados.';
    return {
      guia: t,
      botones: [
        { texto: '¿Están saliendo los WhatsApp?', responde: function () {
            var e = ((MB() || {}).envios || {}).dias7 || {};
            if (!e.total) return 'En los últimos 7 días no se anotó ningún WhatsApp.';
            return 'En 7 días: **' + e.total + '** WhatsApp — **' + (e.ok || 0) + '** salieron, **' + (e.fallos || 0) + '** no salieron' + (e.silenciados ? ', ' + e.silenciados + ' silenciados' : '') + '.';
          } },
        { texto: '¿Qué hago si el bot se cae?', responde: function () {
            return '1. Toca **Reiniciar** y espera unos segundos.\n2. Si sigue caído, **Generar QR** y escanéalo con el teléfono del bot.\n3. Si el QR no sale, **Eliminar sesión** y vuelve a generar el QR.\nMientras tanto los avisos que tienen push igual le llegan al contratista por la app.';
          } },
        { texto: '¿Quién está bloqueado?', responde: function () {
            var l = (((MB() || {}).listaNegra) || {}).numeros || [];
            return l.length ? l.map(function (n) { return '· ' + n; }).join('\n') : 'Nadie está en la lista negra.';
          } }
      ]
    };
  };

  function TB() { return window.TABLERO ? window.TABLERO._datos() : null; }
  GUIAS.tablero = function () {
    var d = TB(), g = d ? d.general || {} : {};
    var t = hola() + 'el ecosistema de un vistazo. ';
    if (d) t += 'Hay **' + (((g.contratos || {}).porEstado || {}).ACTIVO || 0) + '** contratos activos, **' + ((g.cuentas || {}).abiertas || 0) + '** cuentas en curso y se han girado **' + K.pesos((g.dinero || {}).total || 0) + '**. ';
    t += 'Toca una cifra para ir a su vista. Se calcula cada 20 minutos; **Recalcular** trae lo de ahora.';
    return {
      guia: t,
      botones: [
        { texto: '¿Qué app está más lenta?', responde: function () {
            var a = (((TB() || {}).general || {}).servidor || {}).apps || [];
            if (!a.length) return 'Sin llamadas en los últimos 7 días.';
            var l = a.slice().sort(function (x, y) { return (y.p90 || 0) - (x.p90 || 0); });
            return listaCorta(l, function (x) { return '· **' + (APP_T[x.app] || x.app || 'Sin app') + '**: la típica ' + Math.round((x.mediana || 0) / 100) / 10 + ' s, 9 de 10 en ' + Math.round((x.p90 || 0) / 100) / 10 + ' s (' + x.llamadas + ' llamadas)'; }, 6);
          } },
        { texto: '¿Cuántos errores hubo?', responde: function () {
            var e = ((TB() || {}).general || {}).errores || {};
            var k = Object.keys(e.porApp || {});
            return k.length ? '**' + e.total + '** errores en 7 días:\n' + k.map(function (a) { return '· ' + (APP_T[a] || a || 'Sin app') + ': ' + e.porApp[a]; }).join('\n') : 'Ningún error en 7 días. ✓';
          } },
        { texto: '¿Cuánto se giró este mes?', responde: function () {
            var m = (((TB() || {}).general || {}).dinero || {}).porMes || [];
            if (!m.length) return 'No hay pagos registrados.';
            var u = m[m.length - 1];
            return 'En **' + u.mes + '** se giraron **' + K.pesos(u.valor) + '** en ' + u.pagos + ' pagos.';
          } }
      ]
    };
  };

  GUIAS.rendimiento = function () {
    var d = TB();
    var t = hola() + 'cuánto se demora cada paso de una cuenta, en **días hábiles**. ';
    if (d && window.TABLERO) {
      var s = window.TABLERO._stats((window.TABLERO._filtradas() || []).map(function (o) { return o.dTot; }).filter(function (x) { return x !== null && x !== undefined; }));
      if (s.n) t += 'De punta a punta (reporte → pago) la cuenta típica tarda **' + s.med + '** días hábiles y 9 de cada 10 tardan **' + s.p90 + '** o menos. ';
      if (!d._conTraza) t += 'Con los datos viejos la revisión del supervisor y la de Contratación salen juntas; desde producción se separan solas. ';
    }
    t += 'Filtra por fechas y por área; el PDF sale por bloques y el Excel trae cada cuenta.';
    function porTramo(k) {
      return function () {
        var tr = (window.TABLERO.TRAMOS || []).filter(function (x) { return x.k === k; })[0];
        var pp = window.TABLERO._porPersona(window.TABLERO._filtradas(), tr);
        return pp.length ? listaCorta(pp, function (x) { return '· **' + nombre(x.quien) + '**: ' + x.med + ' días (mediana de ' + x.n + ')'; }, 8) : 'Sin datos en este rango.';
      };
    }
    return {
      guia: t,
      botones: [
        { texto: '¿Dónde se va el tiempo?', responde: function () {
            var l = window.TABLERO._filtradas();
            return (window.TABLERO._tramos() || []).filter(function (x) { return x.k !== 'dTot'; }).map(function (x) {
              var s = window.TABLERO._stats(l.map(function (o) { return o[x.k]; }).filter(function (v) { return v !== null && v !== undefined; }));
              return '· **' + x.t + '**: ' + (s.med === null ? '—' : s.med + ' días') + ' (9 de 10 en ' + (s.p90 === null ? '—' : s.p90) + ')';
            }).join('\n');
          } },
        { texto: '¿Qué supervisión tarda más?', responde: function () {
            var g = {};
            window.TABLERO._filtradas().forEach(function (o) { if (o.dCie !== null && o.dCie !== undefined) (g[o.sup] = g[o.sup] || []).push(o.dCie + (o.dRev || 0)); });
            var l = Object.keys(g).map(function (k) { return { k: k, s: window.TABLERO._stats(g[k]) }; }).sort(function (a, b) { return b.s.med - a.s.med; });
            return l.length ? listaCorta(l, function (x) { return '· **' + nombre(x.k) + '**: ' + x.s.med + ' días de revisión + cierre (mediana de ' + x.s.n + ')'; }, 8) : 'Sin datos.';
          } },
        { texto: '¿Contabilidad por persona?', responde: porTramo('dCtb') },
        { texto: '¿Tesorería por persona?', responde: porTramo('dEgr') },
        { texto: '¿Cómo se cuentan los días?', responde: function () {
            return 'Se cuentan los **días hábiles** entre un paso y el siguiente: sin sábados, domingos ni festivos (los de Configuración; en diciembre cuenta todo, como en la radicación). Si pasa el mismo día, cuenta **0**. ' +
              'Las fechas salen de las hojas FIRMAS, APROBADAS, ORDENES, EGRESOS y PAGOS, y desde producción de la traza de cada cuenta.';
          } }
      ]
    };
  };

  /* ══════════════ ajuste 4 · tutoriales en video ══════════════ */

  function TU() { return window.TUTORIALES ? window.TUTORIALES._datos() : null; }
  GUIAS.tutoriales = function () {
    var d = TU();
    var t = hola() + 'aquí manejas los videos de **TUTORIALES DE USO** de la app del contratista. ';
    if (d) {
      t += 'La vista está **' + (d.activo ? 'ENCENDIDA' : 'APAGADA') + '** y hay **' + (d.activos || 0) + '** de ' + (d.videos || []).length + ' tutoriales activos. ';
      if (d.enCloudinary) t += 'Ojo: **' + d.enCloudinary + '** portadas siguen en Cloudinary. ';
    }
    t += 'Para cambiar un video: súbelo a la carpeta TUTORIALES EN VIDEO, toca **Editar** y pega su enlace.';
    return {
      guia: t,
      botones: [
        { texto: '¿Cómo cambio un video?', responde: function () {
            return '1. Toca **Ir a carpeta** y sube el video nuevo a Drive.\n2. En el tutorial toca **Editar** y pega el enlace del video.\n3. Si quieres, sube una **portada** (imagen 16:9).\n4. **Guardar**: el CORE comprueba que sea un video, lo comparte con enlace y toma la duración. Los me gusta y comentarios se conservan.';
          } },
        { texto: '¿Qué ve el contratista si apago?', responde: function () {
            return 'No ve la tarjeta **TUTORIALES DE USO** en su inicio y, si tenía el enlace guardado, el servidor no le entrega los videos. No se borra nada: al encender vuelve todo como estaba.';
          } },
        { texto: '¿Cuáles tienen más vistas?', responde: function () {
            var l = ((TU() || {}).videos || []).slice().sort(function (a, b) { return (b.vistas || 0) - (a.vistas || 0); }).slice(0, 5);
            return l.length ? l.map(function (v, i) { return (i + 1) + '. **' + v.titulo + '** · ' + (v.vistas || 0) + ' vistas'; }).join('\n') : 'Todavía no cargó la lista.';
          } }
      ]
    };
  };

  var TITULOS = { inicio: 'Tu inicio', comunicados: 'Comunicados', mibot: 'Mi bot', tutoriales: 'Tutoriales en video', tablero: 'Tablero del ecosistema', rendimiento: 'Tablero de rendimiento', atrasos: 'Cuentas atrasadas', configuracion: 'Configuración', usuarios: 'Usuarios y roles', bitacora: 'Bitácora', recordatorios: 'Recordatorios', soportes: 'Soportes',
                  novedad: 'Novedades del contrato', datos: 'Todos los datos del contrato' };
  if (window.AYUDA_CONTRATOS) window.AYUDA_CONTRATOS.sumar(GUIAS, TITULOS);

  function montar(vista, extra) {
    if (!K.piezas.insights) return;
    var g = GUIAS[vista];
    if (!g) return;
    var base = g();
    var cfg = {
      vista: (extra && extra.vista) || TITULOS[vista] || vista,
      guia: function () { return g().guia; },
      botones: base.botones || [],
      alto: !!base.alto
    };
    /* la lista de contratistas trae cifras sobre lo que hay en pantalla */
    if (base.filas) { cfg.filas = base.filas; cfg.medidas = base.medidas; cfg.filtros = base.filtros; }
    K.piezas.insights.montar(cfg);
  }

  window.AYUDA = {
    configurar: function (fn) { if (typeof fn === 'function') CTX = fn; },
    montar: montar,
    tiene: function (v) { return !!GUIAS[v]; },
    _guias: GUIAS
  };
}());
