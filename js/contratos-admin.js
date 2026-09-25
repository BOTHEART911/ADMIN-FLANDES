/* ============================================================
   ADMIN-FLANDES · CONTRATISTAS: LO QUE SOLO HACE ADMIN
   Ecosistema Flandes · Fase 10, entrega 10.2

   La lista, la ficha, agregar, adición, cesión, suspensión y editar (5.5)
   son las MISMAS de CONTRATACION (contratistas.js y gestion.js, archivos
   compartidos). Este archivo se engancha por window.GESTION_EXTRA y suma:

     · En la ficha: CANAL de notificación (WhatsApp / correo / ambos o el
       de por defecto), las CUENTAS del contrato con su estado y el botón
       para cambiarlo EN SILENCIO (no se avisa a nadie; queda en la traza
       con tu nombre) y el HISTORIAL de novedades y correcciones.
     · #/novedad/<id>          otrosí, prórroga, suspensión y reinicio,
                               terminación anticipada, liquidación y cambio
                               de supervisor (adición y cesión van a su vista).
     · #/datos/<id>            TODOS los datos de la fila, editables (menos la
                               contraseña y el ID, que se derivan). Si cambias
                               documento o N° de contrato, la llave cambia y
                               sus cuentas la acompañan.
     · Los botones también salen en contratos INACTIVOS.

   UN SOLO LLAMADO: la ficha ya trae todo ('contratistaDetalle' de ADMIN).
   Cada botón es una llamada y la respuesta trae la ficha nueva, la lista
   y la fila de la bitácora: no se vuelve a pedir nada.
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var C = {};
  var ULTIMA = null;           /* lo que está en pantalla, para Insights */

  var NOVEDADES = [
    { tipo: 'OTROSI', t: 'Otrosí', ico: 'documento', p: 'Solo información: qué cambió y desde cuándo. Puede avisar al contratista para que lo adjunte.' },
    { tipo: 'PRORROGA', t: 'Prórroga', ico: 'reloj', p: 'Más tiempo sin más plata: corre la terminación y recalcula la ejecución.' },
    { tipo: 'SUSPENSION', t: 'Suspensión y reinicio', ico: 'pausa', p: 'Del día que se suspende al día que se reinicia: la terminación se corre lo mismo.' },
    { tipo: 'TERMINACION', t: 'Terminación anticipada', ico: 'prohibido', p: 'El contrato termina antes: nueva fecha final y lo ejecutado.' },
    { tipo: 'LIQUIDACION', t: 'Liquidación', ico: 'moneda', p: 'Valor ejecutado y saldo a liberar. Solo información.' },
    { tipo: 'SUPERVISOR', t: 'Cambio de supervisor', ico: 'persona', p: 'Pasa el contrato y sus cuentas abiertas al nuevo supervisor y su grupo.' },
    { tipo: 'ADICION', t: 'Adición', ico: 'mas', p: 'Más tiempo y más plata (1ª o 2ª adición).', vista: 'adicion' },
    { tipo: 'CESION', t: 'Cesión', ico: 'persona', p: 'Otra persona sigue el contrato: entra como contratista nuevo y se parte el plazo.', vista: 'cesion' }
  ];
  var CANALES = [
    { v: '', t: 'Por defecto' }, { v: 'WHATSAPP', t: 'WhatsApp' }, { v: 'CORREO', t: 'Correo' }, { v: 'AMBOS', t: 'Los dos' }
  ];
  var TONO = { BORRADOR: '', INGRESADA: 'aviso', REPORTADA: 'aviso', DEVUELTA: 'malo', 'REVISADA POR SUPERVISOR': 'aviso',
               APROBADA: 'ok', CERRADA: 'ok', 'ORDEN DE PAGO': 'ok', EGRESO: 'ok', PAGADA: 'ok' };

  function O() { return window.OFICINA; }
  function nombre(s) { return O() ? O().nombre(s) : String(s || ''); }
  function mal(e) { K.aviso((e && e.message) || 'No se pudo guardar.', 'malo', 9000); }

  /** Toda respuesta de escritura: lista, ficha y bitácora al día sin otro viaje. */
  function recibir(r) {
    if (!r) return;
    if (r.contratistas && window.CONTRATISTAS) window.CONTRATISTAS.recibir(r.contratistas);
    if (r.detalle && window.CONTRATISTAS && window.CONTRATISTAS.ficha) window.CONTRATISTAS.ficha(r.detalle);
    if (r.bitacora && C.bitacora) C.bitacora(r.bitacora);
  }

  function pedir(accion, datos, textos) {
    K.ocupado = true;
    return K.piezas.guardado.mientras(K.pedir(accion, datos, { ms: 90000 }), textos).then(function (r) {
      K.ocupado = false; recibir(r); return r;
    }, function (e) { K.ocupado = false; throw e; });
  }

  /** Repinta la ficha con lo que devolvió la escritura (ya quedó en caché: no viaja). */
  function aLaFicha(id) {
    var h = '#/contratista/' + encodeURIComponent(id);
    if (location.hash === h && C.enrutar) C.enrutar(); else location.hash = h;
  }

  /* ══════════════ los ganchos de contratistas.js / gestion.js ══════════════ */

  var EXTRA = {
    inactivos: true,
    items: function (f, items) {
      return items.concat([
        ['novedad', 'reloj', 'Novedades'],
        ['datos', 'hoja', 'Todos los datos']
      ]).filter(function (x) { return f.estado === 'ACTIVO' || x[0] === 'editar' || x[0] === 'novedad' || x[0] === 'datos'; });
    },
    alGuardar: recibir,
    ficha: pintarExtra
  };

  /* ══════════════ la ficha: canal, cuentas, historial ══════════════ */

  function pintarExtra(caja, d, f) {
    var a = d.admin;
    if (!a) return;
    ULTIMA = { vista: 'ficha', d: d };
    var sec = K.nodo('<section class="kit-tarjeta grupo ad-ctr"><h3 class="grupo__t">' + K.icono('herramienta', 15) + ' Administración</h3></section>');

    /* canal */
    var zc = K.nodo('<div class="ad-ctr__canal"><p class="ad-ctr__et">Canal de sus notificaciones individuales</p><div class="cf-chips"></div>' +
      '<p class="formulario__nota"></p></div>');
    var nota = zc.querySelector('.formulario__nota');
    nota.textContent = (a.canal ? 'Recibe por ' + etiquetaCanal(a.canal) + '.' : 'Usa el canal por defecto (' + etiquetaCanal(a.canalDefecto) + ').') +
      ' El push siempre se intenta. Se aplica a todos sus contratos.';
    CANALES.forEach(function (c) {
      var b = K.nodo('<button type="button" class="kit-pastilla" aria-pressed="' + ((a.canal || '') === c.v) + '"></button>');
      b.textContent = c.v ? c.t : c.t + ' (' + etiquetaCanal(a.canalDefecto) + ')';
      b.addEventListener('click', function () {
        if ((a.canal || '') === c.v) return;
        pedir('canalGuardar', { idContrato: d.idContrato, canal: c.v }, {
          titulo: 'Guardando el canal', sub: nombre(f.nombre), pasos: ['En todas sus filas', 'Apuntando en la bitácora'],
          listo: { titulo: 'Canal al día', paso: c.v ? c.t : 'Por defecto' }
        }).then(function () { aLaFicha(d.idContrato); }, mal);
      });
      zc.querySelector('.cf-chips').appendChild(b);
    });
    sec.appendChild(zc);

    /* atajos */
    var at = K.nodo('<div class="ct-gest ad-ctr__acc"></div>');
    [['novedad/' + d.idContrato, 'reloj', 'Registrar una novedad'], ['datos/' + d.idContrato, 'hoja', 'Editar todos los datos']].forEach(function (x) {
      var b = K.nodo('<button type="button" class="ct-gest__b">' + K.icono(x[1], 15) + ' ' + K.esc(x[2]) + '</button>');
      b.addEventListener('click', function () { K.vibrar(8); C.irA(x[0]); });
      at.appendChild(b);
    });
    sec.appendChild(at);
    /* lo de ADMIN va arriba, antes de los datos del contrato: es a lo que se viene */
    var ancla = caja.querySelector('.grupo--persona') || caja.querySelector('.ct-ficha__rej');
    function arriba(n) { if (ancla) caja.insertBefore(n, ancla); else caja.appendChild(n); }
    arriba(sec);

    /* cuentas */
    var sc = K.nodo('<section class="kit-tarjeta grupo ad-ctr"><h3 class="grupo__t">' + K.icono('moneda', 15) + ' Cuentas del contrato (' + a.cuentas.length + ')</h3></section>');
    if (!a.cuentas.length) sc.appendChild(K.nodo('<p class="formulario__nota">Todavía no ha radicado cuentas de este contrato.</p>'));
    else sc.appendChild(K.nodo('<p class="formulario__nota">Cambiar el estado aquí es <b>en silencio</b>: no le llega nada a nadie. Queda en la traza de la cuenta con tu nombre y en la bitácora.</p>'));
    a.cuentas.slice().reverse().forEach(function (cu) {
      var t = K.nodo('<article class="ad-cta"><div class="ad-cta__cab"><b></b><span class="ct-marca ad-cta__est"></span></div>' +
        '<p class="ad-cta__p"></p><p class="ad-cta__traza"></p></article>');
      t.querySelector('b').textContent = 'Cuenta ' + cu.informe + (cu.total ? ' de ' + cu.total : '');
      var est = t.querySelector('.ad-cta__est');
      est.textContent = cu.estado || 'SIN ESTADO';
      est.classList.add('ad-cta__est--' + (TONO[cu.estado] || 'nada'));
      t.querySelector('.ad-cta__p').textContent = [cu.radicada ? 'Radicada ' + cu.radicada : 'Sin radicar', cu.cobro ? K.pesos(cu.cobro) : ''].filter(Boolean).join(' · ');
      t.querySelector('.ad-cta__traza').textContent = cu.ultima ? 'Último movimiento: ' + cu.ultima : '';
      var b = K.nodo('<button type="button" class="kit-btn kit-btn--plano ad-mini">' + K.icono('lapiz', 13) + ' Cambiar estado</button>');
      b.addEventListener('click', function () { estadoCuenta(d, cu, a.estados); });
      t.appendChild(b);
      sc.appendChild(t);
    });
    arriba(sc);

    /* historial */
    var hist = (a.novedades || []).map(function (n) { return { fecha: n.fecha, t: n.novedad, p: n.detalle, q: n.quien, app: n.app, fn: n.fechaNovedad }; })
      .concat((a.ediciones || []).map(function (e) {
        return { fecha: e.fecha, t: e.motivo === 'OTROSI' ? 'OTROSÍ (5.5)' : 'CORRECCIÓN (5.5)', q: e.quien,
                 p: (e.cambios || []).map(function (x) { return x.titulo + ': ' + x.antes + ' → ' + x.despues; }).join(' · ') };
      }));
    var sh = K.nodo('<section class="kit-tarjeta grupo ad-ctr"><h3 class="grupo__t">' + K.icono('reloj', 15) + ' Novedades y cambios (' + hist.length + ')</h3></section>');
    if (!hist.length) sh.appendChild(K.nodo('<p class="formulario__nota">Sin novedades registradas desde ADMIN.</p>'));
    hist.slice(0, 40).forEach(function (h) {
      var n = K.nodo('<div class="ad-nov"><p class="ad-nov__t"><b></b> <small></small></p><p class="ad-nov__p"></p></div>');
      n.querySelector('b').textContent = h.t;
      n.querySelector('small').textContent = [h.fn ? 'del ' + h.fn : '', h.fecha, h.q ? nombre(h.q) : '', h.app && h.app !== 'ADMIN' ? 'desde ' + h.app : ''].filter(Boolean).join(' · ');
      n.querySelector('.ad-nov__p').textContent = h.p || '';
      sh.appendChild(n);
    });
    caja.appendChild(sh);
  }

  function etiquetaCanal(c) {
    return ({ WHATSAPP: 'WhatsApp', CORREO: 'correo', AMBOS: 'WhatsApp y correo' })[String(c || '').toUpperCase()] || 'WhatsApp y correo';
  }

  function estadoCuenta(d, cu, estados) {
    var f = K.nodo('<div class="formulario ad-form"><p class="formulario__nota formulario__nota--fuerte">Cuenta ' + cu.informe + ' · hoy está en <b>' + K.esc(cu.estado) + '</b>. ' +
      'El cambio es <b>en silencio</b>: no sale WhatsApp, correo ni push.</p><div class="cf-chips ad-estados"></div>' +
      '<label class="campo"><span>Motivo (queda en la traza y en la bitácora)</span><input type="text" maxlength="300" placeholder="Ej: la radicaron dos veces"></label>' +
      (cu.traza && cu.traza.length ? '<div class="ad-traza"><p class="ad-ctr__et">Traza reciente</p>' + cu.traza.map(function (x) {
        return '<p>' + K.esc(x.fecha + ' · ' + x.estado + ' · ' + x.quien) + '</p>';
      }).join('') + '</div>' : '') + '</div>');
    var elegido = cu.estado, z = f.querySelector('.ad-estados');
    (estados || []).forEach(function (e) {
      var b = K.nodo('<button type="button" class="kit-pastilla" aria-pressed="' + (e === elegido) + '"></button>');
      b.textContent = e;
      b.addEventListener('click', function () { elegido = e; z.querySelectorAll('.kit-pastilla').forEach(function (x) { x.setAttribute('aria-pressed', x.textContent === e); }); });
      z.appendChild(b);
    });
    var m = O().modal({ titulo: 'Estado de la cuenta ' + cu.informe, cuerpo: f,
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } }, { texto: 'Cambiar en silencio', icono: 'check', marca: true, al: function () {
        if (elegido === cu.estado) { m.cerrar(); return; }
        m.botones[1].disabled = true;
        pedir('cuentaEstadoSilencio', { idContrato: d.idContrato, fila: cu.fila, informe: cu.informe, estado: elegido, motivo: f.querySelector('input').value.trim() }, {
          titulo: 'Cambiando el estado', sub: 'Cuenta ' + cu.informe + ': ' + cu.estado + ' → ' + elegido, pasos: ['Comprobando la fila', 'Escribiendo la traza', 'Sin avisos'],
          listo: { titulo: 'Estado al día', paso: elegido }
        }).then(function () { m.cerrar(); aLaFicha(d.idContrato); }, function (e) { m.botones[1].disabled = false; mal(e); });
      } }] });
  }

  /* ══════════════ #/novedad/<id> y #/novedad/<id>/<TIPO> ══════════════ */

  function conFicha(sub, icono, t, p, pintar) {
    var partes = String(sub || '').split('/');
    var id = decodeURIComponent(partes[0] || '');
    var caja = K.nodo('<div class="kit-ancho vista gs ad-nv"></div>');
    C.app.appendChild(caja);
    O().cabecera(caja, icono, t, p);
    var cuerpo = K.nodo('<div class="gs-cuerpo"></div>');
    caja.appendChild(cuerpo);
    K.piezas.creditos.montar(caja);
    var espera = K.pedir('contratistaDetalle', { idContrato: id }, { ms: 60000 });
    K.piezas.esqueletos.mientras(cuerpo, espera, { forma: 'texto', cuantos: 6 })
      .then(function (d) { cuerpo.innerHTML = ''; ULTIMA = { vista: t, d: d }; pintar(cuerpo, d, partes[1] || ''); })
      ['catch'](function (e) { cuerpo.appendChild(C.errorCaja(e)); });
  }

  function resumen(d) {
    var c = d.contrato || {};
    var g = K.nodo('<section class="kit-tarjeta grupo gs-resumen"></section>');
    var cab = K.nodo('<div class="ct-t__cab"></div>');
    if (K.piezas.personas) cab.appendChild(K.piezas.personas.avatar(c.nombre || (d.datos || {}).nombre, { tam: 44 }));
    cab.appendChild(K.nodo('<div class="ct-t__quien"><h3 class="ct-t__n">' + K.esc(nombre((d.datos || {}).nombre)) + '</h3>' +
      '<p class="ct-t__doc">Contrato ' + K.esc(c.contrato) + ' · ' + K.esc(c.estado || '') + ' · ' + K.esc(c.tramo || 'PRIMARIO') + '</p></div>'));
    g.appendChild(cab);
    g.appendChild(K.nodo('<dl class="ct-t__datos">' + [
      ['Plazo', (c.fechaInicio || '—') + ' → ' + (c.fechaTermino || '—')], ['Ejecución', c.ejecucion || '—'],
      ['Valor final', c.valorFinal && c.valorFinal.texto ? '$ ' + c.valorFinal.texto : '—'], ['Supervisor(a)', nombre(c.supervisor) || '—']
    ].map(function (x) { return '<div><dt>' + K.esc(x[0]) + '</dt><dd>' + K.esc(x[1]) + '</dd></div>'; }).join('') + '</dl>'));
    return g;
  }

  function novedad(sub) {
    conFicha(sub, 'reloj', 'NOVEDADES', 'Lo que le pasa al contrato después de firmado. Todo queda en la hoja NOVEDADES_CONTRATOS y en la bitácora.', function (cuerpo, d, tipo) {
      cuerpo.appendChild(resumen(d));
      var n = NOVEDADES.filter(function (x) { return x.tipo === String(tipo).toUpperCase(); })[0];
      if (!n) { elegir(cuerpo, d); return; }
      formNovedad(cuerpo, d, n);
    });
  }

  function elegir(cuerpo, d) {
    var activo = (d.contrato || {}).estado === 'ACTIVO';
    var r = K.nodo('<div class="kit-rejilla kit-rejilla--auto accesos ad-nv__tipos"></div>');
    NOVEDADES.forEach(function (x) {
      var solo = (x.vista || x.tipo === 'SUSPENSION' || x.tipo === 'SUPERVISOR' || x.tipo === 'PRORROGA') && !activo;
      var b = K.nodo('<button type="button" class="kit-tarjeta acceso"' + (solo ? ' disabled' : '') + '>' +
        '<span class="acceso__img acceso__img--icono" aria-hidden="true">' + K.icono(x.ico, 40) + '</span>' +
        '<span class="acceso__txt"><span class="acceso__t"></span><span class="acceso__p"></span></span></button>');
      b.querySelector('.acceso__t').textContent = x.t.toUpperCase();
      b.querySelector('.acceso__p').textContent = solo ? 'Solo con el contrato ACTIVO.' : x.p;
      b.addEventListener('click', function () {
        K.vibrar(8);
        C.irA(x.vista ? x.vista + '/' + encodeURIComponent(d.idContrato) : 'novedad/' + encodeURIComponent(d.idContrato) + '/' + x.tipo);
      });
      r.appendChild(b);
    });
    cuerpo.appendChild(r);
  }

  function campo(f, et, html, ayuda) {
    var l = K.nodo('<label class="campo"><span>' + K.esc(et) + '</span>' + html + '</label>');
    if (ayuda) l.appendChild(K.nodo('<small class="campo__ayuda">' + ayuda + '</small>'));
    f.appendChild(l);
    return l.querySelector('input,select,textarea');
  }

  function fechaIn(f, et, ayuda, anio) {
    return campo(f, et, '<input type="text" readonly data-kit-fecha placeholder="dd/mm/aaaa" data-titulo="' + K.esc(et) + '"' + (anio ? ' data-anio-fijo="' + anio + '"' : '') + '>', ayuda);
  }

  function valorDe(inp) { return K.fecha ? K.fecha(String(inp.value || '').trim()) : String(inp.value || '').trim(); }

  function formNovedad(cuerpo, d, n) {
    var c = d.contrato || {}, a = d.admin || {};
    var f = K.nodo('<form class="kit-tarjeta formulario" novalidate><h3 class="grupo__t">' + K.icono(n.ico, 15) + ' ' + K.esc(n.t) + '</h3>' +
      '<p class="formulario__nota">' + K.esc(n.p) + '</p></form>');
    var I = {};
    if (n.tipo === 'OTROSI') {
      I.fecha = fechaIn(f, 'Fecha del otrosí');
      I.detalle = campo(f, 'Qué cambia', '<textarea rows="4" maxlength="3000" placeholder="Ej: se modifica la obligación 3 …"></textarea>');
      var lb = K.nodo('<label class="op-check cf-sw"><input type="checkbox" checked><span>Avisar al contratista para que adjunte el OTROSÍ (SECOP II) en su próxima cuenta</span></label>');
      I.avisar = lb.querySelector('input'); f.appendChild(lb);
    } else if (n.tipo === 'PRORROGA') {
      I.fecha = fechaIn(f, 'Nueva fecha de terminación', 'Hoy termina el ' + (c.fechaTermino || '—') + '.');
      I.detalle = campo(f, 'Observación (opcional)', '<input type="text" maxlength="500">');
    } else if (n.tipo === 'SUSPENSION') {
      var fl = K.nodo('<div class="campo-fila"></div>'); f.appendChild(fl);
      I.fechaSuspension = fechaIn(fl, 'Se suspende el');
      I.fechaReinicio = fechaIn(fl, 'Se reinicia el', 'Los días entre las dos se suman a lo suspendido.');
      I.detalle = campo(f, 'Observación (opcional)', '<input type="text" maxlength="500">');
      if (c.dias || (d.fila && d.fila[18])) f.appendChild(K.nodo('<p class="formulario__nota">Ya tiene suspensión: <b>' + K.esc((d.fila || [])[18] || '') + '</b>. Esta se suma.</p>'));
    } else if (n.tipo === 'TERMINACION') {
      I.fecha = fechaIn(f, 'Fecha de terminación', 'Hoy termina el ' + (c.fechaTermino || '—') + '.');
      I.valor = campo(f, 'Valor ejecutado (opcional)', '<input type="tel" inputmode="numeric" placeholder="$">');
      I.detalle = campo(f, 'Motivo', '<input type="text" maxlength="500">');
    } else if (n.tipo === 'LIQUIDACION') {
      I.fecha = fechaIn(f, 'Fecha de la liquidación');
      I.valor = campo(f, 'Valor ejecutado', '<input type="tel" inputmode="numeric" placeholder="$">', 'Valor del contrato: ' + (c.valorFinal && c.valorFinal.texto ? '$ ' + c.valorFinal.texto : '—') + '. El saldo a liberar se calcula solo.');
      I.detalle = campo(f, 'Observación (opcional)', '<input type="text" maxlength="500">');
    } else if (n.tipo === 'SUPERVISOR') {
      I.supervisor = campo(f, 'Nuevo supervisor(a)', '<select class="op-select"><option value="">Selecciona</option></select>', 'Hoy: ' + nombre(c.supervisor) + '. Las cuentas que no han llegado al plan de pagos pasan al nuevo.');
      (a.supervisores || []).forEach(function (s) {
        if (K.norm(s) === K.norm(c.supervisor)) return;
        var o = document.createElement('option'); o.value = s; o.textContent = nombre(s); I.supervisor.appendChild(o);
      });
      I.detalle = campo(f, 'Observación (opcional)', '<input type="text" maxlength="500">');
    }
    if (I.valor) K.pesosEnVivo ? K.pesosEnVivo(I.valor, function () {}) : null;
    var fila = K.nodo('<div class="campo-fila campo-fila--botones"><button type="button" class="kit-btn kit-btn--plano">Cancelar</button>' +
      '<button type="submit" class="kit-btn kit-btn--marca">' + K.icono('check', 16) + ' Registrar</button></div>');
    fila.firstChild.addEventListener('click', function () { aLaFicha(d.idContrato); });
    f.appendChild(fila);
    cuerpo.appendChild(f);
    if (K.piezas.fechas) K.piezas.fechas.montar(f);

    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var b = { idContrato: d.idContrato, tipo: n.tipo };
      var lista = [];
      if (I.fecha) { b.fecha = valorDe(I.fecha); if (!b.fecha) { K.aviso('Elige la fecha.', 'aviso', 4000); return; } lista.push(['Fecha', b.fecha]); }
      if (I.fechaSuspension) {
        b.fechaSuspension = valorDe(I.fechaSuspension); b.fechaReinicio = valorDe(I.fechaReinicio);
        if (!b.fechaSuspension || !b.fechaReinicio) { K.aviso('Elige las dos fechas.', 'aviso', 4000); return; }
        lista.push(['Se suspende', b.fechaSuspension], ['Se reinicia', b.fechaReinicio]);
      }
      if (I.valor) { b.valor = K.aNumero(I.valor.value); if (n.tipo === 'LIQUIDACION' && !b.valor && I.valor.value.trim() !== '0') { K.aviso('Escribe el valor ejecutado.', 'aviso', 4000); return; } if (b.valor) lista.push(['Valor ejecutado', K.pesos(b.valor)]); }
      if (I.supervisor) { b.supervisor = I.supervisor.value; if (!b.supervisor) { K.aviso('Elige el supervisor.', 'aviso', 4000); return; } lista.push(['Nuevo supervisor', nombre(b.supervisor)]); }
      if (I.detalle) { b.detalle = I.detalle.value.trim(); if (n.tipo === 'OTROSI' && b.detalle.length < 10) { K.aviso('Describe qué cambia el otrosí.', 'aviso', 4000); return; } if (b.detalle) lista.push(['Detalle', b.detalle.length > 80 ? b.detalle.slice(0, 80) + '…' : b.detalle]); }
      if (I.avisar) { b.avisar = I.avisar.checked; lista.push(['Aviso al contratista', b.avisar ? 'Sí' : 'No']); }
      K.piezas.confirmar.abrir({ titulo: n.t + ' · contrato ' + c.contrato, lista: lista, si: 'Registrar', no: 'Revisar' }).then(function (ok) {
        if (!ok) return;
        pedir('novedad', b, { titulo: 'Registrando ' + n.t.toLowerCase(), sub: nombre((d.datos || {}).nombre), pasos: ['Guardando en CONTRATISTAS', 'Apuntando la novedad', 'Bitácora'],
          listo: { titulo: 'Novedad registrada', paso: n.t } })
          .then(function (r) {
            if (r.aviso && r.aviso.ok === false) K.aviso('Quedó registrada, pero el aviso no salió: ' + (r.aviso.error || 'sin canal') + '.', 'aviso', 8000);
            aLaFicha(r.idContrato || d.idContrato);
          }, mal);
      });
    });
  }

  /* ══════════════ #/datos/<id> · todos los datos ══════════════ */

  var ORDEN_G = ['La persona', 'El contrato', 'Plazo', 'Valores, informes y respaldos', 'Cesión', 'Pago, seguridad social y RUT', 'Obligaciones', 'Otras columnas'];

  function datos(sub) {
    conFicha(sub, 'hoja', 'TODOS LOS DATOS', 'Cada columna de la fila del contrato en la hoja CONTRATISTAS. Cambia lo que haga falta y guarda: solo se escriben las celdas que tocaste.', function (cuerpo, d) {
      cuerpo.appendChild(resumen(d));
      var a = d.admin || {};
      var cambios = {};
      var bus = O().barra({ placeholder: 'Buscar una columna', alBuscar: function (t) { filtrar(t); }, alRefrescar: function () {
        return K.pedir('contratistaDetalle', { idContrato: d.idContrato }, { ms: 60000 }).then(function (x) { recibir({ detalle: x }); C.app.innerHTML = ''; datos(sub); });
      } });
      cuerpo.appendChild(bus.caja);
      var f = K.nodo('<form class="ad-datos" novalidate></form>');
      cuerpo.appendChild(f);
      var grupos = {};
      (a.campos || []).forEach(function (c) { (grupos[c.g] = grupos[c.g] || []).push(c); });
      ORDEN_G.filter(function (g) { return grupos[g]; }).forEach(function (g) {
        var s = K.nodo('<section class="kit-tarjeta grupo ad-datos__g"><h3 class="grupo__t"></h3></section>');
        s.querySelector('h3').textContent = g + ' (' + grupos[g].length + ')';
        grupos[g].forEach(function (c) {
          var l = K.nodo('<label class="campo ad-datos__c" data-t=""><span></span></label>');
          l.setAttribute('data-t', K.norm(c.t + ' ' + c.v));
          l.querySelector('span').textContent = c.t;
          var inp;
          if (c.bloqueada || c.en55) {
            inp = K.nodo('<input type="text" readonly class="ad-datos__solo">');
            inp.value = c.k === 'CLAVE' ? '•••••• (se cambia con "Olvidé mi contraseña")' : c.v;
            l.appendChild(inp);
            l.appendChild(K.nodo('<small class="campo__ayuda">' + (c.bloqueada ? 'Se deriva: no se edita.' : 'Se edita en <b>Editar contrato</b> (corrección u otrosí), que arrastra lo que depende de ella.') + '</small>'));
          } else {
            inp = c.fecha || /^FECHA|NACIMIENTO/.test(c.k)
              ? K.nodo('<input type="text" readonly data-kit-fecha placeholder="dd/mm/aaaa">')
              : (String(c.v).length > 90 ? K.nodo('<textarea rows="3"></textarea>') : K.nodo('<input type="text" autocomplete="off">'));
            inp.value = c.v;
            if (inp.hasAttribute('data-kit-fecha')) inp.setAttribute('data-titulo', c.t);
            var marcar = function () {
              var v = inp.hasAttribute('data-kit-fecha') ? valorDe(inp) : inp.value.trim();
              if (v === c.v) delete cambios[c.c]; else cambios[c.c] = v;
              l.classList.toggle('ad-datos__c--cambio', cambios[c.c] !== undefined);
              contar();
            };
            inp.addEventListener('input', marcar);
            inp.addEventListener('change', marcar);
            l.appendChild(inp);
            if (c.k === 'DOCUMENTO' || c.k === 'CONTRATO') l.appendChild(K.nodo('<small class="campo__ayuda">Es parte de la llave (ID CONTRATO): si cambia, sus cuentas la acompañan.</small>'));
            if (c.k === 'ESTADO') l.appendChild(K.nodo('<small class="campo__ayuda">ACTIVO, NOTIFICADO (última cuenta pagada: solo descarga la certificación) o INACTIVO. Ojo: la notificación final (RECORDATORIOS) también lo cambia.</small>'));
          }
          s.appendChild(l);
        });
        f.appendChild(s);
      });
      if (K.piezas.fechas) K.piezas.fechas.montar(f);
      var pie = K.nodo('<div class="kit-tarjeta ad-datos__pie"><label class="campo"><span>Motivo (queda en la bitácora)</span><input type="text" maxlength="300" placeholder="Opcional"></label>' +
        '<div class="campo-fila campo-fila--botones"><button type="button" class="kit-btn kit-btn--plano">Volver a la ficha</button>' +
        '<button type="button" class="kit-btn kit-btn--marca" disabled>' + K.icono('check', 16) + ' <span>Guardar</span></button></div></div>');
      cuerpo.appendChild(pie);
      var bG = pie.querySelectorAll('button')[1];
      pie.querySelector('button').addEventListener('click', function () { aLaFicha(d.idContrato); });
      function contar() {
        var n = Object.keys(cambios).length;
        bG.disabled = !n;
        bG.querySelector('span').textContent = n ? 'Guardar ' + n + (n === 1 ? ' cambio' : ' cambios') : 'Guardar';
      }
      function filtrar(t) {
        var q = K.norm(t);
        f.querySelectorAll('.ad-datos__c').forEach(function (l) { l.hidden = q && l.getAttribute('data-t').indexOf(q) < 0; });
        f.querySelectorAll('.ad-datos__g').forEach(function (s) { s.hidden = !s.querySelector('.ad-datos__c:not([hidden])'); });
      }
      bG.addEventListener('click', function () {
        var porCol = {}; (a.campos || []).forEach(function (c) { porCol[c.c] = c; });
        var lista = Object.keys(cambios).map(function (k) { return [porCol[k].t, (porCol[k].v || '(vacío)') + ' → ' + (cambios[k] || '(vacío)')]; });
        K.piezas.confirmar.abrir({ titulo: 'Guardar ' + lista.length + (lista.length === 1 ? ' cambio' : ' cambios'), lista: lista, si: 'Guardar', no: 'Revisar',
          nota: 'Solo se escriben estas celdas. Si otra persona cambió el contrato mientras tanto, no se pisa.' }).then(function (ok) {
          if (!ok) return;
          pedir('contratoCampos', { idContrato: d.idContrato, huella: a.huella, cambios: cambios, motivo: pie.querySelector('input').value.trim() }, {
            titulo: 'Guardando los datos', sub: lista.length + (lista.length === 1 ? ' celda' : ' celdas'), pasos: ['Comprobando que nadie lo cambió', 'Escribiendo en CONTRATISTAS', 'Bitácora'],
            listo: { titulo: 'Datos al día', paso: 'Queda en la bitácora' }
          }).then(function (r) {
            if (r.idAnterior && r.idAnterior !== r.idContrato) K.aviso('La llave cambió a ' + r.idContrato + (r.cuentasMovidas ? ' y sus ' + r.cuentasMovidas + ' cuentas la acompañan' : '') + '.', 'ok', 7000);
            aLaFicha(r.idContrato);
          }, mal);
        });
      });
    });
  }

  window.GESTION_EXTRA = EXTRA;
  window.CONTRATOS_ADMIN = {
    configurar: function (c) { C = c || {}; },
    novedad: novedad, datos: datos,
    _ultima: function () { return ULTIMA; }, _novedades: NOVEDADES
  };
}());
