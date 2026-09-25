/* ============================================================
   ADMIN-FLANDES · MI BOT (Fase 10 · entrega 10.6)

   La vista "Mis Bots" de SEP-GROUP traída al ecosistema Flandes, para el
   ÚNICO bot de WhatsApp que tiene (BuilderBot):

     · ESTADO del bot (conectado, esperando QR, desconectado…).
     · CONECTAR WHATSAPP: el QR para escanear desde WhatsApp › Dispositivos
       vinculados. Si el bot no tiene despliegue, el CORE lo crea primero.
     · REINICIAR y ELIMINAR SESIÓN (esta pide escribir ELIMINAR).
     · LISTA NEGRA: números a los que el bot no les responde.
     · SILENCIAR EL CORE: con un toque las siete apps dejan de mandar
       WhatsApp y push (la llave BOT_SILENCIO de siempre).
     · MENSAJE DE PRUEBA a un número (sale de verdad).
     · ÚLTIMOS ENVÍOS por WhatsApp y los grupos a los que escribe el CORE.

   La administración de BuilderBot pide la LLAVE DE LA CUENTA (no la del
   proyecto con la que se mandan los mensajes). Se pega aquí una vez; el
   CORE la comprueba contra BuilderBot, la guarda en CONFIG y nunca la
   devuelve al teléfono. Todo lo que BuilderBot no ofrece por su API
   (silenciar en su nube, limpiar una conversación) no se inventa.

   Un viaje al entrar ('bot') y uno por botón; cada botón devuelve la
   vista entera ya al día.
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var O = window.OFICINA;
  var C = {};
  var D = null;          /* lo último que trajo el CORE */
  var zona = null;

  var ESTADOS = {
    ONLINE:         { t: 'Conectado', p: 'El bot está respondiendo y enviando.', tono: 'ok' },
    READY_TO_SCAN:  { t: 'Esperando el QR', p: 'Genera el QR y escanéalo desde WhatsApp › Dispositivos vinculados.', tono: 'aviso' },
    INITIALIZATION: { t: 'Iniciando', p: 'BuilderBot está levantando el bot. Refresca en unos segundos.', tono: 'aviso' },
    OFFLINE:        { t: 'Desconectado', p: 'Genera el QR para volver a vincular WhatsApp.', tono: 'malo' },
    FAILED:         { t: 'Con falla', p: 'Reinícialo; si sigue igual, elimina la sesión y vuelve a escanear.', tono: 'malo' },
    SIN_DESPLIEGUE: { t: 'Sin sesión', p: 'El bot no tiene sesión de WhatsApp. Genera el QR para crearla.', tono: 'malo' },
    SIN_LLAVE:      { t: 'Falta la llave de la cuenta', p: 'Pega abajo la llave de la cuenta de BuilderBot para ver y manejar el bot.', tono: 'aviso' },
    ERROR:          { t: 'No se pudo consultar', p: '', tono: 'malo' },
    UNKNOWN:        { t: 'Estado desconocido', p: 'Toca Refrescar.', tono: 'aviso' }
  };

  function traer(accion, datos) { return O.leer(accion, datos || {}); }

  function vista() {
    var caja = K.nodo('<div class="kit-ancho vista ct bt"></div>');
    C.app.appendChild(caja);
    O.cabecera(caja, 'whatsapp', 'MI BOT',
      'El bot de WhatsApp de las siete apps: su estado, la conexión por QR, reiniciar, la lista negra, silenciar los avisos y lo último que envió.');
    var b = O.barra({ placeholder: 'Buscar en los últimos envíos', valor: '',
      alBuscar: function (q) { BUSCA = q; if (D) pintar(); },
      alRefrescar: function () { return traer('bot').then(recibir); } });
    caja.appendChild(b.caja);
    zona = K.nodo('<div class="bt-zona"></div>');
    caja.appendChild(zona);
    K.piezas.creditos.montar(caja);
    K.piezas.esqueletos.mientras(zona, D ? Promise.resolve(D) : traer('bot'), { forma: 'ficha', cuantos: 2, espera: 'Consultando el bot' })
      .then(recibir)['catch'](function (e) { zona.appendChild(C.errorCaja(e)); });
  }
  var BUSCA = '';

  function recibir(d) {
    D = d || {};
    if (d && d.bitacora && C.bitacora) C.bitacora(d.bitacora);
    if (d && d.hecho) K.aviso(d.hecho, 'ok', 3500);
    pintar();
    return D;
  }

  /** Un botón que llama al CORE, con el cohete si escribe algo. */
  function accion(nombre, datos, texto) {
    if (K.ocupado) return Promise.resolve(null);
    K.ocupado = true;
    var p = K.pedir(nombre, datos || {}, { ms: 90000 });
    var g = K.piezas.guardado ? K.piezas.guardado.mientras(p, { titulo: texto || 'Un momento', sub: 'Hablando con BuilderBot…', listo: { titulo: 'Listo' } }) : p;
    return g.then(function (r) { K.ocupado = false; return r; }, function (e) { K.ocupado = false; K.aviso((e && e.message) || 'No se pudo.', 'malo', 8000); return null; });
  }

  function pintar() {
    if (!zona) return;
    zona.innerHTML = '';
    var st = (D.estado && D.estado.status) || 'UNKNOWN';
    var E = ESTADOS[st] || ESTADOS.UNKNOWN;

    /* ── estado ── */
    var est = K.nodo('<section class="kit-tarjeta bt-estado bt-estado--' + E.tono + '"><span class="bt-estado__luz" aria-hidden="true"></span>' +
      '<div><h3 class="bt-estado__t"></h3><p class="bt-estado__p"></p><p class="bt-estado__s"></p></div></section>');
    est.querySelector('.bt-estado__t').textContent = E.t;
    est.querySelector('.bt-estado__p').textContent = (D.estado && D.estado.error) || E.p;
    est.querySelector('.bt-estado__s').textContent = 'Proyecto ' + (D.proyecto || '—') + ' · consultado ' + (D.hora || '').slice(11, 16) +
      (D.silencio ? ' · CORE SILENCIADO' : '');
    zona.appendChild(est);
    if (D.silencio) zona.appendChild(K.nodo('<p class="ad-alerta ad-alerta--malo bt-silencio">' + K.icono('prohibido', 16) +
      '<span>El CORE está <b>silenciado</b>: ninguna app manda WhatsApp ni push hasta que lo actives.</span></p>'));

    /* ── llave de la cuenta ── */
    if (!D.llave) zona.appendChild(cajaLlave(false));

    /* ── conectar y controles ── */
    var s1 = seccion('Conectar WhatsApp', 'whatsapp');
    var qrz = K.nodo('<div class="bt-qr"></div>');
    var bQR = K.nodo('<button type="button" class="kit-btn kit-btn--marca">' + K.icono('whatsapp', 16) + ' Generar QR</button>');
    var bYa = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('check', 16) + ' Ya lo escaneé</button>');
    bQR.disabled = !D.llave;
    bQR.addEventListener('click', function () {
      accion('botQR', {}, 'Preparando el QR').then(function (r) {
        if (!r) return;
        qrz.innerHTML = '';
        if (r.conectado) { K.aviso('El bot ya está conectado: no hace falta QR.', 'ok', 4000); return; }
        if (r.qr) {
          var img = K.nodo('<img class="bt-qr__img" alt="Código QR para vincular WhatsApp">');
          img.src = r.qr;
          qrz.appendChild(img);
          qrz.appendChild(K.nodo('<p class="formulario__nota">Abre WhatsApp en el teléfono del bot › <b>Dispositivos vinculados</b> › Vincular un dispositivo, y escanéalo. El código se renueva cada cierto tiempo: si vence, toca Generar QR otra vez.</p>'));
          qrz.appendChild(bYa);
        } else {
          qrz.appendChild(K.nodo('<p class="formulario__nota"></p>')).textContent = r.aviso || 'BuilderBot no devolvió el QR todavía.';
        }
      });
    });
    bYa.addEventListener('click', function () { bYa.disabled = true; traer('bot').then(recibir, function (e) { bYa.disabled = false; K.aviso((e && e.message) || 'No se pudo.', 'malo', 5000); }); });
    s1.cuerpo.appendChild(fila([bQR]));
    s1.cuerpo.appendChild(qrz);
    var bRe = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('recargar', 16) + ' Reiniciar</button>');
    var bEl = K.nodo('<button type="button" class="kit-btn kit-btn--plano kit-btn--malo">' + K.icono('basura', 16) + ' Eliminar sesión</button>');
    bRe.disabled = bEl.disabled = !D.llave;
    bRe.addEventListener('click', function () {
      K.piezas.confirmar.abrir({ titulo: '¿Reiniciar el bot?', texto: 'Se reinicia en BuilderBot y tarda unos segundos en volver. Los mensajes de ese momento pueden no salir.', si: 'Reiniciar', no: 'Cancelar' })
        .then(function (ok) { if (ok) accion('botReiniciar', {}, 'Reiniciando el bot').then(function (r) { if (r) recibir(r); }); });
    });
    bEl.addEventListener('click', eliminarSesion);
    s1.cuerpo.appendChild(fila([bRe, bEl]));
    zona.appendChild(s1.caja);

    /* ── silencio ── */
    var s2 = seccion('Avisos del ecosistema', 'campana');
    s2.cuerpo.appendChild(K.nodo('<p class="formulario__nota">' + (D.silencio
      ? 'Silenciado: ninguna de las siete apps manda WhatsApp ni notificaciones push.'
      : 'Activo: las apps mandan WhatsApp y push según los canales de cada aviso.') + '</p>'));
    var bSil = K.nodo('<button type="button" class="kit-btn ' + (D.silencio ? 'kit-btn--marca' : 'kit-btn--plano kit-btn--malo') + '">' +
      K.icono(D.silencio ? 'altavoz' : 'prohibido', 16) + (D.silencio ? ' Activar los avisos' : ' Silenciar los avisos') + '</button>');
    bSil.addEventListener('click', function () {
      var nuevo = !D.silencio;
      K.piezas.confirmar.abrir({
        titulo: nuevo ? '¿Silenciar el CORE?' : '¿Activar los avisos?',
        texto: nuevo ? 'Ninguna app mandará WhatsApp ni push hasta que lo actives. Sirve para mantenimiento o pruebas.'
                     : 'Las siete apps vuelven a mandar WhatsApp y push.',
        si: nuevo ? 'Silenciar' : 'Activar', no: 'Cancelar', peligro: nuevo
      }).then(function (ok) { if (ok) accion('botSilencio', { silencio: nuevo }, nuevo ? 'Silenciando' : 'Activando').then(function (r) { if (r) recibir(r); }); });
    });
    s2.cuerpo.appendChild(fila([bSil]));
    zona.appendChild(s2.caja);

    /* ── lista negra ── */
    var s3 = seccion('Lista negra', 'prohibido');
    s3.cuerpo.appendChild(K.nodo('<p class="formulario__nota">El bot no les responde a estos números (spam, abuso o pruebas).</p>'));
    var inp = K.nodo('<input class="bt-num" inputmode="numeric" autocomplete="off" placeholder="Celular: 3001234567" aria-label="Celular">');
    inp.addEventListener('input', function () { inp.value = inp.value.replace(/[^\d]/g, '').slice(0, 12); });
    var bBl = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('prohibido', 16) + ' Bloquear</button>');
    bBl.disabled = !D.llave;
    bBl.addEventListener('click', function () {
      if (inp.value.length < 10) { K.aviso('Escribe el celular con 10 dígitos.', 'aviso', 3500); return; }
      accion('botLista', { numero: inp.value, accion: 'bloquear' }, 'Bloqueando').then(function (r) { if (r) recibir(r); });
    });
    s3.cuerpo.appendChild(fila([inp, bBl]));
    var ln = D.listaNegra;
    if (ln && ln.error) s3.cuerpo.appendChild(K.nodo('<p class="formulario__nota bt-error"></p>')).textContent = ln.error;
    var nums = (ln && ln.numeros) || [];
    if (D.llave && !nums.length && !(ln && ln.error)) s3.cuerpo.appendChild(K.nodo('<p class="formulario__nota">Nadie está bloqueado.</p>'));
    nums.forEach(function (n) {
      var r = K.nodo('<div class="bt-bloq">' + K.icono('telefono', 14) + '<span></span><button type="button" class="kit-btn kit-btn--plano">Desbloquear</button></div>');
      r.querySelector('span').textContent = n;
      r.querySelector('button').addEventListener('click', function () {
        accion('botLista', { numero: n, accion: 'desbloquear' }, 'Desbloqueando').then(function (x) { if (x) recibir(x); });
      });
      s3.cuerpo.appendChild(r);
    });
    zona.appendChild(s3.caja);

    /* ── prueba ── */
    var s4 = seccion('Mensaje de prueba', 'enviar');
    s4.cuerpo.appendChild(K.nodo('<p class="formulario__nota">Manda un WhatsApp corto a un número para comprobar que el bot envía. <b>Sale de verdad.</b></p>'));
    var inpP = K.nodo('<input class="bt-num" inputmode="numeric" autocomplete="off" placeholder="Celular: 3001234567" aria-label="Celular de prueba">');
    inpP.addEventListener('input', function () { inpP.value = inpP.value.replace(/[^\d]/g, '').slice(0, 12); });
    var bPr = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('enviar', 16) + ' Enviar prueba</button>');
    bPr.disabled = !!D.silencio;
    bPr.addEventListener('click', function () {
      if (inpP.value.length < 10) { K.aviso('Escribe el celular con 10 dígitos.', 'aviso', 3500); return; }
      K.piezas.confirmar.abrir({ titulo: '¿Mandar la prueba?', texto: 'Le llega un WhatsApp de verdad al ' + inpP.value + '.', si: 'Enviar', no: 'Cancelar' })
        .then(function (ok) { if (ok) accion('botPrueba', { numero: inpP.value }, 'Enviando la prueba').then(function (r) { if (r) { if (r.bitacora && C.bitacora) C.bitacora(r.bitacora); K.aviso(r.hecho, 'ok', 4000); } }); });
    });
    s4.cuerpo.appendChild(fila([inpP, bPr]));
    zona.appendChild(s4.caja);

    /* ── últimos envíos ── */
    var s5 = seccion('Últimos envíos por WhatsApp', 'reloj');
    var d7 = (D.envios && D.envios.dias7) || {};
    s5.cuerpo.appendChild(K.nodo('<div class="ct-cifras bt-cifras">' +
      cifra(d7.total || 0, 'Últimos 7 días') + cifra(d7.ok || 0, 'Salieron') + cifra(d7.fallos || 0, 'No salieron') + cifra(d7.silenciados || 0, 'Silenciados') + '</div>'));
    var q = K.norm(BUSCA);
    var env = ((D.envios && D.envios.lista) || []).filter(function (x) { return !q || K.norm([x.nombre, x.tipo, x.app, x.estado, x.detalle].join(' ')).indexOf(q) >= 0; });
    if (!env.length) s5.cuerpo.appendChild(K.nodo('<p class="formulario__nota">' + (q ? 'Ningún envío con esa búsqueda.' : 'Todavía no hay envíos por WhatsApp registrados.') + '</p>'));
    env.forEach(function (x) {
      var ok = /ENVIAD|RESPALDO|COLA/.test(K.norm(x.estado)), sil = /SILENC/.test(K.norm(x.estado));
      var r = K.nodo('<div class="bt-env"><span class="bt-env__p bt-env__p--' + (ok ? 'ok' : (sil ? 'aviso' : 'malo')) + '" aria-hidden="true"></span>' +
        '<div><b></b><small></small><p></p></div><span class="kit-pastilla bt-env__e"></span></div>');
      r.querySelector('b').textContent = O.nombre(x.nombre || 'Sin nombre');
      r.querySelector('small').textContent = x.fecha + ' · ' + String(x.tipo || '').replace(/_/g, ' ').toLowerCase() + (x.app ? ' · ' + x.app : '');
      r.querySelector('p').textContent = x.detalle || '';
      r.querySelector('.bt-env__e').textContent = x.estado === 'RESPALDO' ? 'ENVIADO (respaldo)' : x.estado;
      s5.cuerpo.appendChild(r);
    });
    zona.appendChild(s5.caja);

    /* ── grupos ── */
    var s6 = seccion('Grupos a los que escribe el CORE', 'persona');
    (D.grupos || []).forEach(function (g) {
      var r = K.nodo('<div class="bt-grupo"><b></b><code></code><button type="button" class="kit-btn kit-btn--plano" aria-label="Copiar el id">' + K.icono('copiar', 14) + '</button></div>');
      r.querySelector('b').textContent = g.llave.replace(/^GRUPO_/, '').replace(/_/g, ' ');
      r.querySelector('code').textContent = g.id || '(vacío)';
      r.querySelector('button').addEventListener('click', function () {
        try { navigator.clipboard.writeText(g.id); K.aviso('Id copiado.', 'ok', 1800); } catch (e) {}
      });
      s6.cuerpo.appendChild(r);
    });
    s6.cuerpo.appendChild(K.nodo('<p class="formulario__nota">Se cambian en Configuración › Grupos y carpetas.</p>'));
    zona.appendChild(s6.caja);

    if (D.llave) zona.appendChild(cajaLlave(true));
  }

  function cifra(n, t) { return '<div class="ct-cifra"><b>' + K.numero(n) + '</b><span>' + K.esc(t) + '</span></div>'; }

  function seccion(t, ico) {
    var caja = K.nodo('<section class="kit-tarjeta bt-sec"><h3 class="bt-sec__t">' + K.icono(ico, 18) + ' <span></span></h3><div class="bt-sec__c"></div></section>');
    caja.querySelector('.bt-sec__t span').textContent = t;
    return { caja: caja, cuerpo: caja.querySelector('.bt-sec__c') };
  }
  function fila(nodos) { var f = K.nodo('<div class="bt-fila"></div>'); nodos.forEach(function (n) { f.appendChild(n); }); return f; }

  function cajaLlave(yaHay) {
    var s = seccion(yaHay ? 'Cambiar la llave de la cuenta' : 'Llave de la cuenta de BuilderBot', 'llave');
    s.caja.classList.add(yaHay ? 'bt-llave--hay' : 'bt-llave');
    s.cuerpo.appendChild(K.nodo('<p class="formulario__nota">' + (yaHay
      ? 'Ya hay una llave guardada y comprobada. Pega otra solo si la cambiaste en BuilderBot.'
      : 'En <b>app.builderbot.cloud</b> › Configuración de API, copia la llave de la <b>cuenta</b> (no la del proyecto con la que se envían los mensajes) y pégala aquí. Se comprueba contra BuilderBot antes de guardarla y no vuelve a salir del CORE.') + '</p>'));
    var inp = K.nodo('<input class="bt-num" type="password" autocomplete="off" placeholder="Llave de la cuenta" aria-label="Llave de la cuenta de BuilderBot">');
    var bG = K.nodo('<button type="button" class="kit-btn kit-btn--marca">' + K.icono('candado', 16) + ' Guardar</button>');
    bG.addEventListener('click', function () {
      var v = inp.value.trim();
      if (!v) { K.aviso('Pega la llave.', 'aviso', 3000); return; }
      accion('botLlave', { llave: v }, 'Comprobando la llave').then(function (r) { if (r) { inp.value = ''; recibir(r); } });
    });
    s.cuerpo.appendChild(fila([inp, bG]));
    return s.caja;
  }

  function eliminarSesion() {
    var cuerpo = K.nodo('<div><p class="formulario__nota">Se cierra la sesión de WhatsApp del bot y se borra su despliegue en BuilderBot. <b>Mientras no vuelvas a escanear el QR, ninguna app manda WhatsApp.</b></p>' +
      '<label class="bt-conf"><span>Escribe ELIMINAR para confirmar</span><input autocomplete="off" aria-label="Escribe ELIMINAR"></label></div>');
    var m = O.modal({
      titulo: 'Eliminar la sesión del bot', cuerpo: cuerpo,
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } },
                { texto: 'Eliminar sesión', icono: 'basura', marca: true, al: function () {
                  var v = cuerpo.querySelector('input').value.trim();
                  if (v.toUpperCase() !== 'ELIMINAR') { K.aviso('Escribe ELIMINAR.', 'aviso', 3000); return; }
                  m.cerrar();
                  accion('botEliminar', { confirmar: v }, 'Eliminando la sesión').then(function (r) { if (r) recibir(r); });
                } }]
    });
  }

  window.MIBOT = {
    configurar: function (c) { C = c || {}; },
    vista: vista,
    olvidar: function () { D = null; BUSCA = ''; },
    _datos: function () { return D; },
    ESTADOS: ESTADOS
  };
}());
