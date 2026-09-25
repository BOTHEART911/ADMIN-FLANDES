/* ============================================================
   ADMIN-FLANDES · COMUNICADOS (Fase 10 · entrega 10.6)

   La misma vista de COMUNICADOS de Contratación, Supervisión y
   Comunicaciones (5.4 / 6.3 / 9) con lo que solo tiene ADMIN:

     · A QUIÉN VA: al publicar se escogen las apps (Contratista,
       Contratación, Supervisión, Contabilidad, Tesorería,
       Comunicaciones). El CORE lo guarda en NOTICIAS › DESTINOS y cada
       app solo muestra lo que le toca. Lo publicado antes, y lo que
       publican las demás apps, sigue igual: lo ven los contratistas.
     · AVISO: notificación a los teléfonos de las apps escogidas (el de
       los contratistas es el de siempre). Masivo = push, nunca WhatsApp.
     · VE Y RETIRA TODO: los comunicados de todas las oficinas.

   Una llamada al entrar ('comunicados'), una al publicar
   ('comunicadoPublicar') y una al retirar ('comunicadoRetirar').
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var O = window.OFICINA;
  var C = {};
  var FILTRO_K = 'admin.comunicados.filtro.v1';

  var APPS_T = { CONTRATISTA: 'Contratistas', CONTRATACION: 'Contratación', SUPERVISION: 'Supervisión',
                 CONTABILIDAD: 'Contabilidad', TESORERIA: 'Tesorería', COMUNICACIONES: 'Comunicaciones' };
  var ORDEN = ['CONTRATISTA', 'CONTRATACION', 'SUPERVISION', 'CONTABILIDAD', 'TESORERIA', 'COMUNICACIONES'];

  var DATA = null;     /* {lista, telefonos, telefonosPorApp, tope} */
  var HORA = null;
  var CARGANDO = null;
  var F = leerFiltro();

  function leerFiltro() {
    var g = K.guardar.leer(FILTRO_K, null) || {};
    return { estado: g.estado === undefined ? 'PUBLICADO' : g.estado, para: g.para || '', busca: '' };
  }
  function guardarFiltro() { K.guardar.escribir(FILTRO_K, { estado: F.estado, para: F.para }); }

  /** A quién llega de verdad: sin DESTINOS = contratistas (como siempre). */
  function destinosDe(c) { return (c.destinos && c.destinos.length) ? c.destinos : ['CONTRATISTA']; }
  function paraTexto(c) { return destinosDe(c).map(function (a) { return APPS_T[a] || a; }).join(' · '); }

  function recibir(d) {
    DATA = d || { lista: [] };
    DATA.lista = (DATA.lista || []).map(function (c) {
      c._t = K.norm([c.emisor, c.area, c.texto, c.id, paraTexto(c)].join(' ') + ' ' + (c.documentos || []).map(function (x) { return x.nombre; }).join(' '));
      return c;
    });
    HORA = new Date();
  }

  function cargar(fresco) {
    if (DATA && !fresco) return Promise.resolve(DATA);
    if (CARGANDO && !fresco) return CARGANDO;
    CARGANDO = O.leer('comunicados').then(function (d) { CARGANDO = null; recibir(d); return DATA; },
      function (e) { CARGANDO = null; throw e; });
    return CARGANDO;
  }

  function coincide(t, q) {
    q = K.norm(q || '');
    if (!q) return true;
    var p = q.split(' ').filter(Boolean);
    for (var i = 0; i < p.length; i++) if (t.indexOf(p[i]) < 0) return false;
    return true;
  }

  function pasa(c, sin) {
    sin = sin || {};
    if (!sin.estado && F.estado && c.estado !== F.estado) return false;
    if (!sin.para && F.para && destinosDe(c).indexOf(F.para) < 0) return false;
    return coincide(c._t, F.busca);
  }

  function filtradas() { return DATA ? DATA.lista.filter(function (c) { return pasa(c); }) : []; }

  function vista() {
    var caja = K.nodo('<div class="kit-ancho vista ct of"></div>');
    C.app.appendChild(caja);
    O.cabecera(caja, 'megafono', 'COMUNICADOS',
      'Escoge a qué apps va cada comunicado: llega como notificación a los teléfonos de esas apps y queda en su vista de comunicados, con los documentos que adjuntes.');

    var nuevo = K.nodo('<button type="button" class="kit-btn kit-btn--marca of-nuevo">' + K.icono('mas', 18) + ' Nuevo comunicado</button>');
    nuevo.addEventListener('click', function () { K.vibrar(8); redactar(); });
    caja.appendChild(nuevo);

    var b = O.barra({
      placeholder: 'Texto, oficina, quién lo publicó, a quién va o documento', valor: F.busca,
      alBuscar: function (q) { F.busca = q; pintar(); },
      alRefrescar: function () { return cargar(true).then(pintar); }
    });
    caja.appendChild(b.caja);
    var zA = K.nodo('<div></div>'), zB = K.nodo('<div></div>');
    caja.appendChild(zA); caja.appendChild(zB);
    var conteo = K.nodo('<p class="ct-conteo" aria-live="polite"></p>');
    caja.appendChild(conteo);
    var tels = K.nodo('<div class="cm-tels"></div>');
    caja.appendChild(tels);
    var rej = K.nodo('<div class="of-muro"></div>');
    caja.appendChild(rej);

    var pA = K.piezas.pastillas.montar(zA, {
      etiqueta: 'Estado', valor: F.estado,
      opciones: [{ valor: 'PUBLICADO', texto: 'Publicados', tono: 'ok' }, { valor: 'RETIRADO', texto: 'Retirados', tono: 'malo' }, { valor: '', texto: 'Todos' }],
      alCambiar: function (v) { F.estado = v; guardarFiltro(); pintar(); }
    });
    var pB = K.piezas.pastillas.montar(zB, {
      etiqueta: 'Para', valor: F.para,
      opciones: [{ valor: '', texto: 'Todas las apps' }].concat(ORDEN.map(function (a) { return { valor: a, texto: APPS_T[a] }; })),
      alCambiar: function (v) { F.para = v; guardarFiltro(); pintar(); }
    });

    function pintar() {
      var L = DATA ? DATA.lista : [];
      var bE = L.filter(function (c) { return pasa(c, { estado: true }); });
      pA.conteos({ PUBLICADO: bE.filter(function (c) { return c.estado === 'PUBLICADO'; }).length,
                   RETIRADO: bE.filter(function (c) { return c.estado === 'RETIRADO'; }).length, '': bE.length });
      O.marcar(zA, F.estado);
      var bP = L.filter(function (c) { return pasa(c, { para: true }); }), mp = { '': bP.length };
      ORDEN.forEach(function (a) { mp[a] = bP.filter(function (c) { return destinosDe(c).indexOf(a) >= 0; }).length; });
      pB.conteos(mp);
      O.marcar(zB, F.para);

      var filas = filtradas();
      conteo.innerHTML = '<b>' + K.numero(filas.length) + '</b> ' + (filas.length === 1 ? 'comunicado' : 'comunicados') +
        (HORA ? '<span class="ct-sello">' + K.icono('reloj', 13) + ' Al día a las ' + K.esc(O.horaCorta(HORA)) + '</span>' : '');
      tels.innerHTML = '';
      var tp = (DATA && DATA.telefonosPorApp) || {};
      ORDEN.forEach(function (a) {
        var n = tp[a] || 0;
        tels.appendChild(K.nodo('<span class="cm-tel' + (n ? '' : ' cm-tel--0') + '" title="Teléfonos con los avisos activos">' +
          K.icono('telefono', 12) + ' ' + K.esc(APPS_T[a]) + ' <b>' + n + '</b></span>'));
      });
      rej.innerHTML = '';
      if (!L.length) {
        rej.appendChild(K.nodo('<div class="kit-tarjeta ct-vacio">' + K.icono('megafono', 30) + '<p><b>Todavía no hay comunicados.</b><br>Toca Nuevo comunicado.</p></div>'));
        return;
      }
      if (!filas.length) rej.appendChild(O.vacio('No hay comunicados con estos filtros.', function () { F.estado = ''; F.para = ''; F.busca = ''; b.inp.value = ''; guardarFiltro(); pintar(); }));
      filas.forEach(function (c) { rej.appendChild(tarjeta(c)); });
    }

    function tarjeta(c) {
      var ret = c.estado === 'RETIRADO';
      var t = K.nodo('<article class="kit-tarjeta of-com' + (ret ? ' of-com--ret' : '') + '"></article>');
      var cab = K.nodo('<div class="of-com__cab"></div>');
      if (K.piezas.personas) cab.appendChild(K.piezas.personas.avatar(c.emisor, { tam: 44, foto: c.foto || '' }));
      cab.appendChild(K.nodo('<div class="of-com__quien"><b>' + K.esc(O.nombre(c.emisor) || 'Alcaldía') + '</b>' +
        '<span>' + K.esc(O.titulo(c.area)) + (c.fecha ? ' · ' + K.esc(O.cuando(c.fecha)) + (c.hora ? ' ' + K.esc(c.hora) : '') : '') + '</span></div>'));
      if (ret) cab.appendChild(K.nodo('<span class="kit-pastilla ct-t__estado of-estado of-estado--malo">RETIRADO</span>'));
      else if (c.mio) cab.appendChild(K.nodo('<span class="kit-pastilla ct-t__estado of-estado of-estado--ok">TUYO</span>'));
      t.appendChild(cab);
      var para = K.nodo('<p class="cm-para">' + K.icono('enviar', 13) + ' <span></span></p>');
      para.querySelector('span').textContent = 'Para: ' + paraTexto(c) + ((c.destinos && c.destinos.length) ? '' : ' (sin elegir: como siempre)');
      t.appendChild(para);
      if (c.texto) t.appendChild(K.nodo('<p class="of-com__txt">' + O.conEnlaces(c.texto) + '</p>'));
      var docs = c.documentos || [];
      if (docs.length) {
        var z = K.nodo('<div class="of-com__docs"></div>');
        docs.forEach(function (d, i) {
          var x = K.nodo('<button type="button" class="of-doc">' + K.icono(d.tipo === 'imagen' ? 'imagen' : (d.tipo === 'pdf' ? 'pdf' : 'documento'), 16) +
            '<span></span><small>' + K.esc(K.piezas.adjuntos ? K.piezas.adjuntos.pesoLegible(d.bytes || 0) : '') + '</small></button>');
          x.querySelector('span').textContent = d.nombre;
          x.addEventListener('click', function () { verDocs(c, i); });
          z.appendChild(x);
        });
        t.appendChild(z);
      }
      var a = K.nodo('<div class="ct-acc"></div>');
      var bt = K.nodo('<button type="button" class="kit-btn kit-btn--plano' + (ret ? '' : ' kit-btn--malo') + '">' +
        K.icono(ret ? 'recargar' : 'prohibido', 15) + (ret ? ' Volver a publicar' : ' Retirar') + '</button>');
      bt.addEventListener('click', function () { retirar(c, !ret); });
      a.appendChild(bt);
      t.appendChild(a);
      return t;
    }

    function retirar(c, quitar) {
      K.piezas.confirmar.abrir({
        titulo: quitar ? '¿Retirar este comunicado?' : '¿Volver a publicarlo?',
        texto: quitar ? 'Deja de verse en ' + paraTexto(c) + '. No se borra: lo puedes volver a publicar.'
                      : 'Vuelve a verse en ' + paraTexto(c) + ' (no se manda otra notificación).',
        si: quitar ? 'Retirar' : 'Publicar', no: 'Cancelar'
      }).then(function (ok) {
        if (!ok) return;
        K.pedir('comunicadoRetirar', { id: c.id, volver: !quitar }, { ms: 60000 }).then(function (r) {
          c.estado = r.estado;
          K.aviso(quitar ? 'Comunicado retirado.' : 'Comunicado publicado de nuevo.', 'ok', 2500);
          pintar();
        }, function (e) { K.aviso((e && e.message) || 'No se pudo cambiar.', 'malo', 6000); });
      });
    }

    K.piezas.esqueletos.mientras(rej, cargar(false), { forma: 'tarjetas', cuantos: 3 })
      .then(pintar)['catch'](function (e) { caja.appendChild(C.errorCaja(e)); });
    K.piezas.creditos.montar(caja);
    vista._repintar = pintar;
  }

  function verDocs(c, i) {
    if (!K.piezas.visor) return;
    K.piezas.visor.abrir((c.documentos || []).map(function (d) {
      return { titulo: d.nombre, tipo: d.tipo === 'office' ? 'pdf' : (d.tipo === 'otro' ? undefined : d.tipo),
               cargar: function () { return O.leer('comunicadoDocumento', { id: c.id, n: d.n }); } };
    }), { indice: i || 0 });
  }

  /* ══════════════ redactar ══════════════ */

  function redactar() {
    var tope = (DATA && DATA.tope) || { archivos: 5, mb: 15 };
    var tp = (DATA && DATA.telefonosPorApp) || {};
    var cuerpo = K.nodo('<div class="of-redactar"></div>');

    cuerpo.appendChild(K.nodo('<p class="of-rapidos__t">¿A qué apps va?</p>'));
    var zDest = K.nodo('<div class="cm-dest" role="group" aria-label="Apps a las que va"></div>');
    ORDEN.forEach(function (a) {
      var n = tp[a] || 0;
      var l = K.nodo('<label class="cm-dest__o"><input type="checkbox" value="' + a + '"' + (a === 'CONTRATISTA' ? ' checked' : '') + '>' +
        '<span>' + K.esc(APPS_T[a]) + '<small>' + (n ? n + (n === 1 ? ' teléfono' : ' teléfonos') : 'sin teléfonos con avisos') + '</small></span></label>');
      zDest.appendChild(l);
    });
    var rapidos = K.nodo('<div class="cm-dest__rap"></div>');
    [['Todas', ORDEN], ['Solo oficinas', ORDEN.slice(1)], ['Solo contratistas', ['CONTRATISTA']]].forEach(function (r) {
      var x = K.nodo('<button type="button" class="kit-btn kit-btn--plano cm-dest__b"></button>');
      x.textContent = r[0];
      x.addEventListener('click', function () { zDest.querySelectorAll('input').forEach(function (i) { i.checked = r[1].indexOf(i.value) >= 0; }); });
      rapidos.appendChild(x);
    });
    cuerpo.appendChild(zDest);
    cuerpo.appendChild(rapidos);

    var ta = K.nodo('<textarea class="rv-editor__ta of-ta" rows="7" maxlength="4000" placeholder="Escribe el comunicado. Los enlaces (https://…) se podrán tocar."></textarea>');
    cuerpo.appendChild(ta);
    var cuenta = K.nodo('<p class="of-cuenta">0 / 4000</p>');
    cuerpo.appendChild(cuenta);
    ta.addEventListener('input', function () { cuenta.textContent = ta.value.length + ' / 4000'; });
    cuerpo.appendChild(K.nodo('<p class="of-rapidos__t">Documentos (opcional) · hasta ' + tope.archivos + ', de ' + tope.mb + ' MB cada uno</p>'));
    var zona = K.nodo('<div class="of-adjuntos"></div>');
    cuerpo.appendChild(zona);
    var adj = K.piezas.adjuntos ? K.piezas.adjuntos.montar(zona, {
      acepta: 'application/pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
      varios: true, maximo: tope.archivos, maximoMB: tope.mb
    }) : null;
    var chk = K.nodo('<label class="of-check"><input type="checkbox" checked><span>Avisar con una notificación a los teléfonos de esas apps</span></label>');
    cuerpo.appendChild(chk);

    var m = O.modal({
      titulo: 'Nuevo comunicado', cuerpo: cuerpo, ancha: true,
      botones: [
        { texto: 'Cancelar', al: function () { m.cerrar(); } },
        { texto: 'Publicar', icono: 'megafono', marca: true, al: publicar }
      ]
    });
    setTimeout(function () { ta.focus(); }, 120);

    function destinos() { return [].slice.call(zDest.querySelectorAll('input:checked')).map(function (i) { return i.value; }); }

    function publicar() {
      var texto = ta.value.replace(/\r/g, '').trim();
      var archivos = adj ? adj.archivos() : [];
      var para = destinos();
      if (!para.length) { K.aviso('Escoge al menos una app a la que va el comunicado.', 'aviso', 4000); return; }
      if (!texto && !archivos.length) { K.aviso('Escribe el comunicado o adjunta un documento.', 'aviso', 4000); ta.focus(); return; }
      var avisar = chk.querySelector('input').checked;
      var tels = para.reduce(function (s, a) { return s + (tp[a] || 0); }, 0);
      K.piezas.confirmar.abrir({
        titulo: 'Publicar el comunicado',
        lista: [
          ['Para', para.map(function (a) { return APPS_T[a]; }).join(', ')],
          ['Texto', texto ? (texto.length > 80 ? texto.slice(0, 80) + '…' : texto) : '(solo documentos)'],
          ['Documentos', archivos.length ? archivos.map(function (f) { return f.name; }).join(', ') : 'ninguno'],
          ['Aviso', avisar ? 'Notificación a ' + tels + (tels === 1 ? ' teléfono' : ' teléfonos') : 'Sin notificación']
        ],
        si: 'Publicar', no: 'Revisar'
      }).then(function (ok) {
        if (!ok || K.ocupado) return;
        K.ocupado = true;
        var trae = adj ? adj.aBase64() : Promise.resolve([]);
        var envio = trae.then(function (lista) {
          return K.pedir('comunicadoPublicar', {
            texto: texto, avisar: avisar, destinos: para,
            archivos: lista.map(function (a) { return { nombre: a.nombre, mime: a.tipo, base64: a.datos }; })
          }, { ms: 120000 });
        });
        K.piezas.guardado.mientras(envio, {
          titulo: 'Publicando el comunicado', sub: 'No cierres la app.',
          pasos: ['Subiendo los documentos…', 'Guardando…', 'Avisando a los teléfonos…'],
          listo: { titulo: 'Comunicado publicado', paso: 'Ya lo pueden ver' }
        }).then(function (r) {
          K.ocupado = false;
          m.cerrar();
          var fallo = [r && r.aviso && r.aviso.error, r && r.avisoOficinas && r.avisoOficinas.error].filter(Boolean);
          if (avisar && fallo.length) K.aviso('Quedó publicado, pero la notificación no salió: ' + fallo.join(' · '), 'aviso', 9000);
          F.estado = 'PUBLICADO'; guardarFiltro();
          return cargar(true).then(function () { if (vista._repintar) vista._repintar(); });
        }, function (e) {
          K.ocupado = false;
          K.aviso((e && e.message) || 'No se pudo publicar.', 'malo', 9000);
        });
      });
    }
  }

  window.COMUNICADOS = {
    configurar: function (c) { C = c || {}; },
    vista: vista,
    cargar: cargar,
    olvidar: function () { DATA = null; K.guardar.borrar(FILTRO_K); F = leerFiltro(); },
    _datos: function () { return DATA; },
    _filtradas: filtradas,
    _destinos: destinosDe,
    APPS_T: APPS_T
  };
}());
