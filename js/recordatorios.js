/* ============================================================
   ADMIN-FLANDES · RECORDATORIOS Y NOTIFICACIÓN FINAL
   Ecosistema Flandes · Fase 10 · entrega 10.3

   Lo que antes eran dos scripts sueltos en la carpeta SCRIPTS
   (RECORDATORIO_CUENTAS y NOTIFICACION_FINAL) vive ahora en el CORE
   (Recordatorios103.gs) y se maneja aquí:

     · ESTADO Y RELOJ ..... si está encendido, el reloj del CORE (cada
                            10 min mira las horas de aquí) y los próximos
                            turnos.
     · RECORDATORIOS ...... horas, hora de corte de los colores, textos de
                            los dos bloques (supervisores y Contratación)
                            y las cuentas prioritarias.
     · NOTIFICACIÓN FINAL . días y horas de notificar y de cerrar el acceso.
                            El TEXTO del aviso es el de CONTRATO_NOTIFICADO
                            en Mensajes y avisos (un solo sitio).
     · VISTA PREVIA ....... los mensajes que saldrían AHORA con los datos
                            de la hoja, sin mandar nada. "Enviar ahora" solo
                            funciona con el interruptor encendido.

   UN SOLO LLAMADO: entrar pide 'recordatorios' (config + vista previa +
   reloj + últimas corridas). Guardar ('recordatoriosGuardar') devuelve la
   llave guardada Y la vista previa nueva en el mismo viaje.
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var C = {};
  var V = null;             /* lo último que trajo el CORE */
  var PREVIA = 'B1';        /* pestaña de la vista previa */
  var DIAS = [[1, 'Lun'], [2, 'Mar'], [3, 'Mié'], [4, 'Jue'], [5, 'Vie'], [6, 'Sáb'], [7, 'Dom']];
  var TITULOS = { B1: 'A supervisores', B2: 'A Contratación', FN: 'Notificación final', FD: 'Cierre de acceso' };

  function O() { return window.OFICINA; }
  function copia(x) { return JSON.parse(JSON.stringify(x === undefined ? null : x)); }
  function seccion(icono, titulo, texto) {
    return K.nodo('<section class="kit-tarjeta grupo cf-bloque ad-bloque rc-bloque"><h3 class="grupo__t">' + K.icono(icono, 16) + ' ' + K.esc(titulo) + '</h3>' +
      (texto ? '<p class="formulario__nota">' + texto + '</p>' : '') + '</section>');
  }
  function h12(hm) {
    var p = String(hm || '').split(':'), h = +p[0], m = +p[1];
    if (!(h >= 0)) return hm;
    return (h % 12 || 12) + ':' + ('0' + m).slice(-2) + (h >= 12 ? ' pm' : ' am');
  }

  /** El formato de WhatsApp, para ver el mensaje como va a llegar. */
  function wa(texto) {
    return String(texto || '').split('\n').map(function (l) {
      var cita = /^>\s?/.test(l);
      var t = K.esc(cita ? l.replace(/^>\s?/, '') : l)
        .replace(/\*([^*\n]+)\*/g, '<b>$1</b>')
        .replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s).,:;])/g, '$1<i>$2</i>');
      return cita ? '<span class="rc-wa__cita">' + t + '</span>' : (t || '&nbsp;');
    }).join('<br>');
  }

  /* ══════════════ la vista ══════════════ */

  function vista() {
    var caja = K.nodo('<div class="kit-ancho vista rc"></div>');
    C.app.appendChild(caja);
    O().cabecera(caja, 'reloj', 'RECORDATORIOS Y NOTIFICACIÓN FINAL',
      'Los recordatorios de cuentas a los grupos de los supervisores y de Contratación, y la notificación final del contrato que terminó. ' +
      'Antes eran dos scripts sueltos; ahora viven en el CORE, leen la hoja por <b>nombre de columna</b> y todo se configura aquí.');
    var zona = K.nodo('<div class="cf-zona ad-zona rc-zona"></div>');
    caja.appendChild(zona);
    K.piezas.creditos.montar(caja);

    var p = K.pedir('recordatorios', {}, { ms: 90000 }).then(function (d) { V = d; return d; });
    K.piezas.esqueletos.mientras(zona, p, { forma: 'ficha', cuantos: 3 })
      .then(function () { pintar(zona); if (window.AYUDA) window.AYUDA.montar('recordatorios'); },
        function (e) { zona.appendChild(C.errorCaja(e)); });
    vista._zona = zona;
  }

  function pintar(zona) {
    zona = zona || vista._zona;
    if (!zona || !V) return;
    zona.innerHTML = '';
    zona.appendChild(bloqueEstado());
    zona.appendChild(bloqueRecordatorios());
    zona.appendChild(bloqueFinal());
    zona.appendChild(bloquePrevia());
    zona.appendChild(bloqueUltimas());
  }

  /* ══════════════ estado y reloj ══════════════ */

  function bloqueEstado() {
    var recOn = V.rec && V.rec.activo === true, finOn = V.fin && V.fin.activo === true, reloj = V.reloj > 0;
    var s = seccion('reloj', 'ESTADO Y RELOJ',
      'Salen solo con <b>el interruptor encendido</b> y <b>el reloj instalado</b>. Mientras se trabaja sobre la <b>copia de trabajo</b> deben quedar apagados: ' +
      'los grupos son los de verdad y hoy los avisa el script viejo. Se encienden el día del paso a producción, después de apagar los activadores viejos.');
    if ((recOn || finOn) && !reloj) s.classList.add('ad-bloque--alerta');
    var g = K.nodo('<div class="rc-estado"></div>');
    function fila(ok, icono, t, p) {
      var f = K.nodo('<div class="rc-estado__f rc-estado__f--' + (ok ? 'ok' : 'off') + '">' + K.icono(icono, 18) + '<div><b></b><span></span></div></div>');
      f.querySelector('b').textContent = t; f.querySelector('span').textContent = p;
      g.appendChild(f);
    }
    fila(recOn, 'whatsapp', 'Recordatorios ' + (recOn ? 'ENCENDIDOS' : 'APAGADOS'), recOn ? 'Supervisores ' + (V.rec.bloque1.horas || []).map(h12).join(' y ') + ' · Contratación ' + (V.rec.bloque2.horas || []).map(h12).join(' y ') : 'No sale ningún recordatorio.');
    fila(finOn, 'campana', 'Notificación final ' + (finOn ? 'ENCENDIDA' : 'APAGADA'), finOn ? 'Notifica ' + diasTxt(V.fin.notificar.dias) + ' ' + h12(V.fin.notificar.hora) + ' · cierra ' + diasTxt(V.fin.desactivar.dias) + ' ' + h12(V.fin.desactivar.hora) : 'Nadie pasa a NOTIFICADO ni a ' + (V.fin.estadoFinal || 'INACTIVO') + '.');
    fila(reloj, 'reloj', reloj ? 'Reloj instalado' : (V.reloj < 0 ? 'No se pudo leer el reloj' : 'Reloj sin instalar'), reloj ? 'Cada 10 minutos el CORE mira si toca un turno.' : 'Con el reloj quitado no sale nada, aunque el interruptor esté encendido.');
    s.appendChild(g);

    if (V.proximos && V.proximos.length) {
      var l = K.nodo('<div class="rc-prox"><p class="formulario__nota formulario__nota--fuerte">Próximos turnos</p><ul></ul></div>');
      V.proximos.forEach(function (x) { var li = document.createElement('li'); li.innerHTML = '<b>' + K.esc(x.cuando) + '</b> · ' + K.esc(x.titulo); l.querySelector('ul').appendChild(li); });
      s.appendChild(l);
    }
    if (V.sinGrupo && V.sinGrupo.length) {
      var a = K.nodo('<button type="button" class="ad-alerta ad-alerta--aviso">' + K.icono('whatsapp', 16) + '<span></span>' + K.icono('adelante', 14) + '</button>');
      a.querySelector('span').textContent = 'Sin grupo de WhatsApp (su recordatorio no sale): ' + V.sinGrupo.join(', ');
      a.addEventListener('click', function () { C.irA('configuracion/supervisores'); });
      s.appendChild(a);
    }

    var acc = K.nodo('<div class="ct-acc"></div>');
    var bR = K.nodo('<button type="button" class="kit-btn ' + (reloj ? 'kit-btn--plano' : 'kit-btn--marca') + '">' + K.icono(reloj ? 'parar' : 'play', 15) + ' ' + (reloj ? 'Quitar el reloj' : 'Instalar el reloj') + '</button>');
    bR.addEventListener('click', function () { cambiarReloj(!reloj, bR); });
    var bP = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('recargar', 15) + ' Actualizar la vista previa</button>');
    bP.addEventListener('click', function () {
      bP.disabled = true; bP.classList.add('kit-ocupado');
      K.pedir('recordatorios', {}, { ms: 90000 }).then(function (d) { V = d; pintar(); K.aviso('Vista previa al día.', 'ok', 2000); },
        function (e) { bP.disabled = false; bP.classList.remove('kit-ocupado'); K.aviso((e && e.message) || 'No se pudo actualizar.', 'malo', 6000); });
    });
    acc.appendChild(bP); acc.appendChild(bR);
    s.appendChild(acc);
    return s;
  }

  function diasTxt(l) { return (l || []).map(function (d) { return (DIAS[d - 1] || [0, '?'])[1].toLowerCase(); }).join(', '); }

  function cambiarReloj(poner, boton) {
    var texto = poner
      ? 'El CORE va a revisar cada 10 minutos si toca un turno. Con el interruptor encendido, los mensajes salen a los grupos DE VERDAD. ¿Instalar el reloj?'
      : 'Sin el reloj no sale ningún recordatorio ni se hace la notificación final. ¿Quitarlo?';
    K.piezas.confirmar.preguntar({ titulo: poner ? 'Instalar el reloj' : 'Quitar el reloj', texto: texto, si: poner ? 'Sí, instalar' : 'Sí, quitar', peligro: poner })
      .then(function (si) {
        if (!si) return;
        boton.disabled = true;
        K.piezas.guardado.mientras(K.pedir('recordatoriosReloj', { accion: poner ? 'instalar' : 'quitar' }, { ms: 60000 }), {
          titulo: poner ? 'Instalando el reloj' : 'Quitando el reloj', sub: 'Recordatorios y notificación final',
          pasos: ['Revisando los activadores del CORE…'], listo: { titulo: 'Listo', paso: 'Queda en la bitácora' }
        }).then(function (r) { V.reloj = r.reloj; if (r.bitacora) C.bitacora(r.bitacora); K.aviso(r.mensaje, 'ok', 4000); pintar(); },
          function (e) { boton.disabled = false; K.aviso((e && e.message) || 'No se pudo.', 'malo', 7000); });
      });
  }

  /* ══════════════ guardar una de las dos llaves ══════════════ */

  function guardar(llave, valor, motivo, boton) {
    if (boton) boton.disabled = true;
    return K.piezas.guardado.mientras(K.pedir('recordatoriosGuardar', { llave: llave, valor: JSON.stringify(valor), motivo: motivo || '' }, { ms: 90000 }), {
      titulo: llave === 'RECORDATORIOS' ? 'Guardando los recordatorios' : 'Guardando la notificación final',
      sub: 'El reloj usa lo nuevo desde el próximo turno.',
      pasos: ['Validando en el CORE…', 'Guardando en CONFIG…', 'Armando la vista previa…'], listo: { titulo: 'Guardado', paso: 'Queda en la bitácora' }
    }).then(function (r) {
      if (r.sinCambio) K.aviso('No había nada que cambiar.', 'info', 2500);
      if (r.item) C.llave(r.item);
      if (r.bitacora) C.bitacora(r.bitacora);
      if (r.vista) V = r.vista;
      pintar();
      return r;
    }, function (e) { if (boton) boton.disabled = false; K.aviso((e && e.message) || 'No se pudo guardar.', 'malo', 9000); throw e; });
  }

  function pie(s, llave, leer, cambiado) {
    var p = K.nodo('<div class="ad-pie" hidden>' +
      '<label class="op-campo ad-motivo"><span>Motivo del cambio (queda en la bitácora)</span><input type="text" maxlength="300" placeholder="Opcional"></label>' +
      '<div class="ct-acc"><button type="button" class="kit-btn kit-btn--plano">' + K.icono('girar', 14) + ' Deshacer</button>' +
      '<button type="button" class="kit-btn kit-btn--marca">' + K.icono('check', 16) + ' Guardar</button></div></div>');
    var bs = p.querySelectorAll('button');
    bs[0].addEventListener('click', function () { pintar(); });
    bs[1].addEventListener('click', function () {
      var v;
      try { v = leer(); } catch (e) { K.aviso(e.message || 'Revisa los datos.', 'aviso', 5000); return; }
      guardar(llave, v, p.querySelector('input').value.trim(), bs[1])['catch'](function () {});
    });
    s.appendChild(p);
    return function () { p.hidden = !cambiado(); };
  }

  /* piezas de formulario */
  function interruptor(s, texto, on, al) {
    var l = K.nodo('<label class="op-check cf-sw ad-sw ad-sw--grande"><input type="checkbox"><span></span></label>');
    var i = l.querySelector('input');
    i.checked = !!on;
    function t() { l.querySelector('span').innerHTML = texto(i.checked); }
    i.addEventListener('change', function () { t(); al(i.checked); });
    t();
    s.appendChild(l);
    return i;
  }
  function campo(padre, etiqueta, valor, al, opc) {
    opc = opc || {};
    var l = K.nodo('<label class="op-campo' + (opc.ancho ? ' cf-ancho' : '') + '"><span></span>' + (opc.largo ? '<textarea class="ad-in" rows="' + (opc.filas || 3) + '"></textarea>' : '<input class="ad-in">') + (opc.ayuda ? '<small class="campo__ayuda"></small>' : '') + '</label>');
    l.querySelector('span').textContent = etiqueta;
    var i = l.querySelector(opc.largo ? 'textarea' : 'input');
    if (opc.tipo) i.type = opc.tipo;
    if (opc.max) i.maxLength = opc.max;
    if (opc.modo) i.setAttribute('inputmode', opc.modo);
    i.value = valor === undefined || valor === null ? '' : valor;
    if (opc.ayuda) l.querySelector('small').textContent = opc.ayuda;
    i.addEventListener('input', function () { al(i.value); });
    i.addEventListener('change', function () { al(i.value); });
    padre.appendChild(l);
    return i;
  }
  /** Las horas del día como pastillas + un campo para agregar otra. */
  function horas(padre, lista, al) {
    var z = K.nodo('<div class="rc-horas"><div class="cf-chips"></div><div class="rc-horas__mas"><input type="time" class="ad-in" step="300" aria-label="Hora nueva"><button type="button" class="kit-btn kit-btn--plano ad-mini">' + K.icono('mas', 13) + ' Agregar</button></div></div>');
    var chips = z.querySelector('.cf-chips'), iH = z.querySelector('input'), bM = z.querySelector('button');
    function dibujar() {
      chips.innerHTML = '';
      lista.slice().sort().forEach(function (h) {
        var b = K.nodo('<span class="kit-pastilla rc-hora" aria-pressed="true"><span></span><button type="button" aria-label="Quitar">' + K.icono('cerrar', 12) + '</button></span>');
        b.querySelector('span').textContent = h12(h);
        b.querySelector('button').addEventListener('click', function () { lista.splice(lista.indexOf(h), 1); dibujar(); al(); });
        chips.appendChild(b);
      });
      if (!lista.length) chips.appendChild(K.nodo('<small class="ad-malo">Sin horas: este bloque no sale.</small>'));
    }
    bM.addEventListener('click', function () {
      var v = String(iH.value || '').slice(0, 5);
      if (!/^\d{2}:\d{2}$/.test(v)) { K.aviso('Escoge la hora.', 'aviso', 2500); return; }
      if (lista.indexOf(v) >= 0) { K.aviso('Esa hora ya está.', 'info', 2500); return; }
      if (lista.length >= 6) { K.aviso('Máximo 6 horas al día.', 'aviso', 3000); return; }
      lista.push(v); iH.value = ''; dibujar(); al();
    });
    dibujar();
    padre.appendChild(z);
  }
  function diasSel(padre, lista, al) {
    var z = K.nodo('<div class="cf-chips rc-dias"></div>');
    DIAS.forEach(function (d) {
      var b = K.nodo('<button type="button" class="kit-pastilla"></button>');
      b.textContent = d[1];
      function marcar() { b.setAttribute('aria-pressed', lista.indexOf(d[0]) >= 0 ? 'true' : 'false'); }
      b.addEventListener('click', function () { var i = lista.indexOf(d[0]); if (i >= 0) lista.splice(i, 1); else lista.push(d[0]); lista.sort(); marcar(); al(); });
      marcar();
      z.appendChild(b);
    });
    padre.appendChild(z);
  }
  function sub(s, icono, t, p) {
    var d = K.nodo('<div class="rc-sub"><h4>' + K.icono(icono, 15) + ' ' + K.esc(t) + '</h4>' + (p ? '<p class="formulario__nota">' + p + '</p>' : '') + '</div>');
    s.appendChild(d);
    return d;
  }

  /* ══════════════ RECORDATORIOS ══════════════ */

  function bloqueRecordatorios() {
    var orig = copia(V.rec), v = copia(V.rec);
    var s = seccion('whatsapp', 'RECORDATORIOS DE CUENTAS',
      'Solo en días hábiles. Cada línea lleva color, día y hora del reporte, <b>la más nueva primero</b>: ' +
      '🟢 reportada hoy o después de la hora de corte del hábil anterior · 🟠 el hábil anterior antes de la hora de corte · 🔴 hace dos hábiles o más. ' +
      'Ya no lleva el pie de "Por favor tener en cuenta los tiempos".');
    if (v.activo) s.classList.add('rc-bloque--on');
    var r = function () {};
    interruptor(s, function (on) { return on ? '<b>Recordatorios ENCENDIDOS</b>' : 'Recordatorios apagados'; }, v.activo, function (on) { v.activo = on; r(); });

    var g = K.nodo('<div class="cf-item__campos rc-fila"></div>');
    campo(g, 'Hora de corte de los colores', v.horaCorte, function (x) { v.horaCorte = String(x).slice(0, 5); r(); }, { tipo: 'time', ayuda: 'Por defecto las 4:00 pm.' });
    campo(g, 'Pausa entre mensajes (segundos)', v.intervaloSeg, function (x) { v.intervaloSeg = Number(x); r(); }, { modo: 'numeric', max: 2, ayuda: 'De 1 a 30. Evita que BuilderBot los bloquee.' });
    s.appendChild(g);

    /* bloque 1 */
    var b1 = sub(s, 'persona', 'A LOS SUPERVISORES (REPORTADA y PLAN DE PAGOS)',
      'Un mensaje por supervisor, a su grupo (se cambia en <a href="#/configuracion/supervisores">Supervisores</a>). Si dos supervisores comparten grupo, el mensaje dice de quién es la lista.');
    interruptor(b1, function (on) { return on ? 'Este bloque sale' : '<span class="ad-malo">Este bloque NO sale</span>'; }, v.bloque1.activo !== false, function (on) { v.bloque1.activo = on; r(); });
    horas(b1, v.bloque1.horas, function () { r(); });
    var t1 = K.nodo('<div class="cf-item__campos"></div>');
    campo(t1, 'Encabezado ({hora})', v.bloque1.encabezado, function (x) { v.bloque1.encabezado = x; r(); }, { largo: true, filas: 2, ancho: true });
    campo(t1, 'Una cuenta por revisar ({n})', v.bloque1.revisionUno, function (x) { v.bloque1.revisionUno = x; r(); });
    campo(t1, 'Varias cuentas por revisar ({n})', v.bloque1.revisionVarios, function (x) { v.bloque1.revisionVarios = x; r(); });
    campo(t1, 'Un plan por aceptar ({n})', v.bloque1.planUno, function (x) { v.bloque1.planUno = x; r(); });
    campo(t1, 'Varios planes por aceptar ({n})', v.bloque1.planVarios, function (x) { v.bloque1.planVarios = x; r(); });
    campo(t1, 'Línea del supervisor en grupos compartidos ({supervisor})', v.bloque1.supervisor, function (x) { v.bloque1.supervisor = x; r(); }, { ancho: true });
    b1.appendChild(t1);

    /* bloque 2 */
    var b2 = sub(s, 'hoja', 'A CONTRATACIÓN (REVISADA POR SUPERVISOR)',
      'Un solo mensaje al grupo de Contratación <code>' + K.esc(V.grupoContratacion || 'sin grupo') + '</code> (llave GRUPO_CONTRATACION, en <a href="#/configuracion/grupos">Grupos y carpetas</a>). La hora que cuenta es la de la aprobación del supervisor.');
    interruptor(b2, function (on) { return on ? 'Este bloque sale' : '<span class="ad-malo">Este bloque NO sale</span>'; }, v.bloque2.activo !== false, function (on) { v.bloque2.activo = on; r(); });
    horas(b2, v.bloque2.horas, function () { r(); });
    var t2 = K.nodo('<div class="cf-item__campos"></div>');
    campo(t2, 'Encabezado ({hora})', v.bloque2.encabezado, function (x) { v.bloque2.encabezado = x; r(); }, { largo: true, filas: 2, ancho: true });
    campo(t2, 'Una cuenta por revisar ({n})', v.bloque2.revisionUno, function (x) { v.bloque2.revisionUno = x; r(); });
    campo(t2, 'Varias cuentas por revisar ({n})', v.bloque2.revisionVarios, function (x) { v.bloque2.revisionVarios = x; r(); });
    b2.appendChild(t2);

    /* prioritarias */
    var bp = sub(s, 'aviso', 'CUENTAS PRIORITARIAS',
      'Si una de estas cuentas está en la lista, sale un <b>segundo mensaje</b> al mismo grupo. En el de supervisores dice si falta la revisión, el plan de pagos o los dos.');
    var tp = K.nodo('<div class="cf-item__campos"></div>');
    campo(tp, 'Encabezado del segundo mensaje', v.prioridad.encabezado, function (x) { v.prioridad.encabezado = x; r(); }, { ancho: true });
    campo(tp, 'Cómo se llama la revisión', v.prioridad.etiquetaRevision, function (x) { v.prioridad.etiquetaRevision = x; r(); });
    campo(tp, 'Cómo se llama el plan de pagos', v.prioridad.etiquetaPlan, function (x) { v.prioridad.etiquetaPlan = x; r(); });
    bp.appendChild(tp);
    var lp = K.nodo('<div class="rc-prios"></div>');
    bp.appendChild(lp);
    function prios() {
      lp.innerHTML = '';
      v.prioridad.cuentas.forEach(function (c, i) {
        var t = K.nodo('<div class="kit-tarjeta rc-prio"><div class="rc-prio__cab"><b>Cuenta prioritaria ' + (i + 1) + '</b></div><div class="cf-item__campos"></div></div>');
        var q = K.nodo('<button type="button" class="kit-btn kit-btn--plano ad-mini">' + K.icono('basura', 13) + ' Quitar</button>');
        q.addEventListener('click', function () { v.prioridad.cuentas.splice(i, 1); prios(); r(); });
        t.querySelector('.rc-prio__cab').appendChild(q);
        var f = t.querySelector('.cf-item__campos');
        campo(f, 'Nombre (como está en la hoja)', c.nombre, function (x) { c.nombre = x.toUpperCase(); r(); });
        campo(f, 'Documento (manda sobre el nombre)', c.documento, function (x) { c.documento = x.replace(/\D/g, ''); r(); }, { modo: 'numeric', max: 12 });
        campo(f, 'Descripción', c.desc, function (x) { c.desc = x; r(); }, { largo: true, filas: 3, ancho: true });
        campo(f, 'Frase final', c.cierre, function (x) { c.cierre = x; r(); }, { ancho: true });
        lp.appendChild(t);
      });
    }
    prios();
    var mas = K.nodo('<button type="button" class="kit-btn kit-btn--plano ad-mini">' + K.icono('mas', 13) + ' Agregar una cuenta prioritaria</button>');
    mas.addEventListener('click', function () { v.prioridad.cuentas.push({ nombre: '', documento: '', desc: '', cierre: '' }); prios(); r(); });
    bp.appendChild(mas);

    r = pie(s, 'RECORDATORIOS', function () {
      if (!/^\d{2}:\d{2}$/.test(v.horaCorte || '')) throw new Error('Escoge la hora de corte.');
      if (!(v.intervaloSeg >= 1 && v.intervaloSeg <= 30)) throw new Error('La pausa entre mensajes va de 1 a 30 segundos.');
      v.prioridad.cuentas.forEach(function (c, i) {
        if (!c.nombre && !c.documento) throw new Error('La cuenta prioritaria ' + (i + 1) + ' necesita nombre o documento.');
        if (!String(c.desc || '').trim()) throw new Error('La cuenta prioritaria ' + (i + 1) + ' necesita su descripción.');
      });
      if (v.activo && !orig.activo && !V.reloj) K.aviso('Ojo: el reloj no está instalado, así que todavía no sale nada.', 'aviso', 6000);
      return v;
    }, function () { return JSON.stringify(v) !== JSON.stringify(orig); });
    return s;
  }

  /* ══════════════ NOTIFICACIÓN FINAL ══════════════ */

  function bloqueFinal() {
    var orig = copia(V.fin), v = copia(V.fin);
    var s = seccion('campana', 'NOTIFICACIÓN FINAL',
      'El día de notificar, el contrato <b>ACTIVO</b> cuya <b>última cuenta</b> (N° de informe = total de informes) está <b>PAGADA</b> recibe el aviso y pasa a <b>NOTIFICADO</b>: ' +
      'entra a su app solo para descargar la certificación. El día de cierre, todo NOTIFICADO pasa al estado final. Corre también en festivos, como el script viejo.');
    if (v.activo) s.classList.add('rc-bloque--on');
    var r = function () {};
    interruptor(s, function (on) { return on ? '<b>Notificación final ENCENDIDA</b>' : 'Notificación final apagada'; }, v.activo, function (on) { v.activo = on; r(); });

    var n = sub(s, 'sobre', 'NOTIFICAR', 'Días y hora en que se avisa y se marca NOTIFICADO.');
    diasSel(n, v.notificar.dias, function () { r(); });
    var gn = K.nodo('<div class="cf-item__campos"></div>');
    campo(gn, 'Hora', v.notificar.hora, function (x) { v.notificar.hora = String(x).slice(0, 5); r(); }, { tipo: 'time' });
    n.appendChild(gn);

    var d = sub(s, 'candado', 'CERRAR EL ACCESO', 'Días y hora en que todo NOTIFICADO pasa al estado final. Es la fecha que ve el contratista en su app y en el aviso ({hasta}).');
    diasSel(d, v.desactivar.dias, function () { r(); });
    var gd = K.nodo('<div class="cf-item__campos"></div>');
    campo(gd, 'Hora', v.desactivar.hora, function (x) { v.desactivar.hora = String(x).slice(0, 5); r(); }, { tipo: 'time' });
    var ls = K.nodo('<label class="op-campo"><span>Estado final</span><select class="op-select ad-in"><option value="INACTIVO">INACTIVO</option><option value="FINALIZADO">FINALIZADO</option></select></label>');
    var sel = ls.querySelector('select'); sel.value = v.estadoFinal || 'INACTIVO';
    sel.addEventListener('change', function () { v.estadoFinal = sel.value; r(); });
    gd.appendChild(ls);
    d.appendChild(gd);

    var m = sub(s, 'comentario', 'EL MENSAJE',
      'Es el aviso <b>CONTRATO_NOTIFICADO</b>. Su texto (WhatsApp, push y correo) y sus canales se cambian en <a href="#/configuracion/mensajes">Mensajes y avisos</a>, junto con los demás. Así se ve hoy:');
    var pl = V.plantillaFinal || {};
    m.appendChild(K.nodo('<div class="rc-wa"><div class="rc-wa__globo">' + wa(pl.wa || '(sin texto de WhatsApp)') + '</div></div>'));
    m.appendChild(K.nodo('<p class="formulario__nota">Canales: <b>' + K.esc((V.canalesFinal || []).join(', ') || 'ninguno') + '</b>. {hasta} = el día de cierre (ej. "jueves 1 de octubre").</p>'));

    r = pie(s, 'NOTIFICACION_FINAL', function () {
      if (!v.notificar.dias.length || !v.desactivar.dias.length) throw new Error('Escoge al menos un día para notificar y uno para cerrar.');
      if (!/^\d{2}:\d{2}$/.test(v.notificar.hora || '') || !/^\d{2}:\d{2}$/.test(v.desactivar.hora || '')) throw new Error('Escoge las dos horas.');
      return v;
    }, function () { return JSON.stringify(v) !== JSON.stringify(orig); });
    return s;
  }

  /* ══════════════ VISTA PREVIA ══════════════ */

  function bloquePrevia() {
    var s = seccion('ojo', 'VISTA PREVIA (NO SE MANDA NADA)',
      'Lo que saldría ahora mismo con los datos de la hoja (' + K.esc(V.hora || '') + '). Hay <b>' + V.cifras.reportada + '</b> cuentas REPORTADA, <b>' + V.cifras.plan + '</b> en PLAN DE PAGOS y <b>' + V.cifras.revisada + '</b> REVISADA POR SUPERVISOR.' +
      (V.habilHoy ? '' : ' <b>Hoy no es día hábil:</b> el reloj no manda recordatorios.'));
    var zp = K.nodo('<div class="ad-pastillas"></div>');
    s.appendChild(zp);
    var zona = K.nodo('<div class="rc-previa"></div>');
    s.appendChild(zona);
    var conteos = {};
    ['B1', 'B2', 'FN', 'FD'].forEach(function (k) { var p = V.previa[k]; conteos[k] = (k === 'FD' ? p.cambios.length : p.mensajes.length); });
    var pas = K.piezas.pastillas.montar(zp, {
      opciones: ['B1', 'B2', 'FN', 'FD'].map(function (k) { return { valor: k, texto: TITULOS[k] }; }),
      valor: PREVIA,
      alCambiar: function (x) { PREVIA = x || 'B1'; dibujar(); }
    });
    if (pas && pas.conteos) pas.conteos(conteos);
    function dibujar() {
      zona.innerHTML = '';
      var p = V.previa[PREVIA];
      zona.appendChild(K.nodo('<p class="rc-previa__res">' + K.icono('info', 14) + ' <span></span></p>'));
      zona.querySelector('.rc-previa__res span').textContent = p.resumen;
      if (PREVIA === 'FD' || (PREVIA === 'FN' && !p.mensajes.length)) {
        if (p.cambios.length) {
          var ul = K.nodo('<ul class="rc-lista"></ul>');
          p.cambios.forEach(function (c) { var li = document.createElement('li'); li.innerHTML = '<b>' + K.esc(c.nombre) + '</b> · ' + K.esc(c.id) + ' · ' + K.esc(c.antes) + ' → ' + K.esc(c.despues); ul.appendChild(li); });
          zona.appendChild(ul);
        }
      }
      p.mensajes.forEach(function (m) {
        var t = K.nodo('<article class="kit-tarjeta rc-msg"><header class="rc-msg__cab"><b></b><span></span></header><div class="rc-wa"></div></article>');
        t.querySelector('b').textContent = m.para || '';
        t.querySelector('span').innerHTML = PREVIA === 'FN'
          ? K.esc(m.id + ' · ' + (m.canales || []).join(', '))
          : (m.destino ? K.icono('whatsapp', 12) + ' ' + K.esc(m.destino) + ' · ' + m.cuentas + (m.cuentas === 1 ? ' cuenta' : ' cuentas') : '<span class="ad-malo">' + K.icono('aviso', 12) + ' Sin grupo: no sale</span>');
        var w = t.querySelector('.rc-wa');
        w.appendChild(K.nodo('<div class="rc-wa__globo">' + wa(m.texto) + '</div>'));
        if (m.alerta) w.appendChild(K.nodo('<div class="rc-wa__globo rc-wa__globo--alerta">' + wa(m.alerta) + '</div>'));
        zona.appendChild(t);
      });
      var on = (PREVIA === 'B1' || PREVIA === 'B2') ? V.rec.activo === true : V.fin.activo === true;
      var b = K.nodo('<button type="button" class="kit-btn ' + (on ? 'kit-btn--marca' : 'kit-btn--plano') + '">' + K.icono('enviar', 15) + ' Enviar ahora: ' + K.esc(TITULOS[PREVIA]) + '</button>');
      if (!on) { b.disabled = true; zona.appendChild(K.nodo('<p class="formulario__nota">' + K.icono('candado', 13) + ' Apagado: "Enviar ahora" solo funciona con el interruptor encendido.</p>')); }
      b.addEventListener('click', function () { enviarAhora(PREVIA, b); });
      zona.appendChild(b);
    }
    dibujar();
    return s;
  }

  function enviarAhora(job, boton) {
    var textos = {
      B1: 'Sale YA el recordatorio a los grupos de los supervisores que tienen cuentas pendientes.',
      B2: 'Sale YA el recordatorio al grupo de Contratación.',
      FN: 'Los contratos de la lista pasan YA a NOTIFICADO y reciben el aviso.',
      FD: 'Todos los NOTIFICADOS pasan YA al estado final y pierden el acceso.'
    };
    K.piezas.confirmar.preguntar({ titulo: 'Enviar ahora', texto: textos[job] + ' No se puede deshacer. ¿Seguimos?', si: 'Sí, enviar', peligro: true })
      .then(function (si) {
        if (!si) return;
        boton.disabled = true;
        K.piezas.guardado.mientras(K.pedir('recordatoriosEnviar', { job: job }, { ms: 300000 }), {
          titulo: 'Enviando: ' + TITULOS[job], sub: 'Con pausa entre mensajes para que BuilderBot no los bloquee.',
          pasos: ['Leyendo la hoja…', 'Mandando…'], listo: { titulo: 'Hecho', paso: 'Queda en la bitácora' }
        }).then(function (r) {
          V.ultimas = r.ultimas || V.ultimas;
          if (r.bitacora) C.bitacora(r.bitacora);
          K.aviso(r.resultado.resumen, r.resultado.mensajes.some(function (m) { return m.estado === 'FALLO'; }) ? 'aviso' : 'ok', 6000);
          pintar();
        }, function (e) { boton.disabled = false; K.aviso((e && e.message) || 'No se pudo enviar.', 'malo', 9000); });
      });
  }

  /* ══════════════ ÚLTIMAS CORRIDAS ══════════════ */

  function bloqueUltimas() {
    var l = V.ultimas || [];
    var s = seccion('reloj', 'ÚLTIMAS CORRIDAS', l.length ? 'Lo que hizo el reloj (o tú, a mano). Las de la última semana; el detalle queda también en la bitácora.' : 'Todavía no ha corrido ningún turno.');
    if (!l.length) return s;
    var ul = K.nodo('<ul class="rc-lista rc-ultimas"></ul>');
    l.forEach(function (x) {
      var li = K.nodo('<li class="' + (x.error ? 'rc-ultimas--mal' : '') + '"><b></b> <span></span><small></small></li>');
      li.querySelector('b').textContent = x.fecha + ' · ' + x.titulo + (x.manual ? ' (a mano, ' + x.quien + ')' : ' (' + x.hora + ')');
      li.querySelector('span').textContent = '— ' + x.resumen;
      li.querySelector('small').textContent = (x.fallos || []).length ? ' Fallaron: ' + x.fallos.join(' · ') : '';
      ul.appendChild(li);
    });
    s.appendChild(ul);
    return s;
  }

  window.RECORDATORIOS = {
    configurar: function (c) { C = c || {}; },
    vista: vista,
    olvidar: function () { V = null; PREVIA = 'B1'; },
    _datos: function () { return V; }
  };
}());
