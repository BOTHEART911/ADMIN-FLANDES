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
              'Los **REVISOR** de Supervisión necesitan saber a quién revisan; y en Supervisión y Contratación decides si **aprueban y devuelven**.',
        botones: [P_BLOQUEADOS, P_SIN_CEL,
          { texto: '¿Qué estoy viendo?', responde: function () {
              var l = window.USUARIOS ? window.USUARIOS._filtradas() : [];
              var c = {};
              l.forEach(function (u) { c[u.rol] = (c[u.rol] || 0) + 1; });
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
  var TITULOS = { inicio: 'Tu inicio', configuracion: 'Configuración', usuarios: 'Usuarios y roles', bitacora: 'Bitácora', recordatorios: 'Recordatorios',
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
