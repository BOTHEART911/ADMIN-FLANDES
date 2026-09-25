/* ============================================================
   ADMIN-FLANDES · TUTORIALES EN VIDEO (ajuste 4, previo a la Fase 11)

   La vista TUTORIALES DE USO de la app CONTRATISTA se administra aquí:

     · INTERRUPTOR. Enciende o apaga esa vista. Apagada, al contratista
       no le sale la tarjeta del inicio y el CORE no le entrega nada
       (aunque tenga el enlace guardado). No se deja encender si no hay
       ningún tutorial activo con video.
     · CADA TUTORIAL. Título, tema, descripción, orden y si está activo,
       el VIDEO (enlace o id de Drive: el CORE comprueba que sea un
       video, lo comparte con enlace y saca la duración) y la PORTADA
       (imagen que se sube aquí y queda en Drive, ya no en Cloudinary).
     · Retirar lo esconde sin borrarlo; Eliminar borra también sus me
       gusta y comentarios (pide escribir ELIMINAR).

   Una llamada al entrar ('tutoriales'). Cada escritura devuelve la
   lista al día: no hay segundo viaje para repintar.
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var O = window.OFICINA;
  var C = {};
  var FILTRO_K = 'admin.tutoriales.filtro.v1';

  var D = null;          /* {activo, carpeta, temas, videos, activos, enCloudinary} */
  var HORA = null;
  var CARGANDO = null;
  var F = { estado: leerFiltro(), busca: '' };

  function leerFiltro() { var g = K.guardar.leer(FILTRO_K, null); return g === null || g === undefined ? '' : g; }
  function guardarFiltro() { K.guardar.escribir(FILTRO_K, F.estado); }

  function temaTxt(c) {
    var t = (D && D.temas) || {};
    return t[c] || (c ? c.charAt(0).toUpperCase() + c.slice(1) : 'Sin tema');
  }

  function recibir(d) {
    D = d || { videos: [] };
    D.videos = (D.videos || []).map(function (v) {
      v._t = K.norm([v.id, v.titulo, temaTxt(v.categoria), v.descripcion].join(' '));
      return v;
    });
    HORA = new Date();
  }

  function cargar(fresco) {
    if (D && !fresco) return Promise.resolve(D);
    if (CARGANDO && !fresco) return CARGANDO;
    CARGANDO = O.leer('tutoriales').then(function (d) { CARGANDO = null; recibir(d); return D; },
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
  function pasa(v, sinEstado) {
    if (!sinEstado && F.estado === 'ACTIVO' && !v.activo) return false;
    if (!sinEstado && F.estado === 'RETIRADO' && v.activo) return false;
    return coincide(v._t, F.busca);
  }
  function filtrados() { return D ? D.videos.filter(function (v) { return pasa(v); }) : []; }

  function plural(n, uno, varios) { return K.numero(n) + ' ' + (n === 1 ? uno : varios); }
  function driveVer(id) { return 'https://drive.google.com/file/d/' + encodeURIComponent(id) + '/view'; }

  /* ══════════════ vista ══════════════ */

  var REPINTAR = null;

  function vista() {
    var caja = K.nodo('<div class="kit-ancho vista ct of tu"></div>');
    C.app.appendChild(caja);
    O.cabecera(caja, 'play', 'TUTORIALES EN VIDEO',
      'Los videos que ve el contratista en <b>TUTORIALES DE USO</b>. Enciende o apaga esa vista, y cambia el video (de Drive) y la portada de cada uno.');

    var zSw = K.nodo('<section class="kit-tarjeta tu-sw-caja" aria-live="polite"></section>');
    caja.appendChild(zSw);

    var nuevo = K.nodo('<button type="button" class="kit-btn kit-btn--marca of-nuevo">' + K.icono('mas', 18) + ' Nuevo tutorial</button>');
    nuevo.addEventListener('click', function () { K.vibrar(8); editar(null); });
    caja.appendChild(nuevo);

    var b = O.barra({
      placeholder: 'Título, tema, descripción o id', valor: F.busca,
      alBuscar: function (q) { F.busca = q; pintar(); },
      alRefrescar: function () { return cargar(true).then(pintar); }
    });
    caja.appendChild(b.caja);
    var zP = K.nodo('<div></div>');
    caja.appendChild(zP);
    var conteo = K.nodo('<p class="ct-conteo" aria-live="polite"></p>');
    caja.appendChild(conteo);
    var rej = K.nodo('<div class="kit-rejilla kit-rejilla--auto tu-rejilla"></div>');
    caja.appendChild(rej);

    var pE = K.piezas.pastillas.montar(zP, {
      etiqueta: 'Estado', valor: F.estado,
      opciones: [{ valor: '', texto: 'Todos' }, { valor: 'ACTIVO', texto: 'Activos', tono: 'ok' }, { valor: 'RETIRADO', texto: 'Retirados', tono: 'malo' }],
      alCambiar: function (v) { F.estado = v || ''; guardarFiltro(); pintar(); }
    });

    function pintar() {
      pintarInterruptor(zSw);
      var L = D ? D.videos : [];
      var base = L.filter(function (v) { return pasa(v, true); });
      if (pE && pE.conteos) pE.conteos({ '': base.length, ACTIVO: base.filter(function (v) { return v.activo; }).length,
        RETIRADO: base.filter(function (v) { return !v.activo; }).length });
      O.marcar(zP, F.estado);
      var filas = filtrados();
      conteo.innerHTML = '<b>' + K.numero(filas.length) + '</b> ' + (filas.length === 1 ? 'tutorial' : 'tutoriales') +
        (HORA ? '<span class="ct-sello">' + K.icono('reloj', 13) + ' Al día a las ' + K.esc(O.horaCorta(HORA)) + '</span>' : '');
      rej.innerHTML = '';
      if (!L.length) {
        rej.appendChild(K.nodo('<div class="kit-tarjeta ct-vacio">' + K.icono('play', 30) + '<p><b>Todavía no hay tutoriales.</b><br>Toca Nuevo tutorial.</p></div>'));
        return;
      }
      if (!filas.length) rej.appendChild(O.vacio('No hay tutoriales con estos filtros.', function () { F.estado = ''; F.busca = ''; b.inp.value = ''; guardarFiltro(); pintar(); }));
      filas.forEach(function (v) { rej.appendChild(tarjeta(v)); });
    }
    REPINTAR = pintar;

    K.piezas.esqueletos.mientras(rej, cargar(false), { forma: 'tarjetas', cuantos: 4, espera: 'Trayendo los tutoriales' })
      .then(pintar)['catch'](function (e) { caja.appendChild(C.errorCaja(e, function () { D = null; vista(); })); });
    K.piezas.creditos.montar(caja);
  }

  function repintar() { if (REPINTAR) REPINTAR(); }

  /* ── interruptor ── */

  function pintarInterruptor(z) {
    z.innerHTML = '';
    if (!D) return;
    var on = !!D.activo;
    var activosConVideo = D.videos.filter(function (v) { return v.activo && v.drive; }).length;
    var fila = K.nodo(
      '<div class="tu-sw-fila">' +
      '  <div class="tu-sw-txt"><b></b><small></small></div>' +
      '  <label class="tu-sw"><input type="checkbox" role="switch" aria-label="Vista TUTORIALES en la app Contratista"><span class="tu-sw__pista"><span class="tu-sw__bola"></span></span></label>' +
      '</div>');
    fila.querySelector('b').textContent = on ? 'Vista TUTORIALES encendida en Contratista' : 'Vista TUTORIALES apagada en Contratista';
    fila.querySelector('small').textContent = on
      ? 'El contratista ve la tarjeta TUTORIALES DE USO en su inicio y los ' + activosConVideo + ' videos activos.'
      : 'El contratista no ve la tarjeta ni puede abrir los videos. Enciéndela cuando los videos estén al día.';
    z.classList.toggle('tu-sw-caja--on', on);
    var inp = fila.querySelector('input');
    inp.checked = on;
    inp.addEventListener('change', function () { cambiar(inp, inp.checked); });
    z.appendChild(fila);

    var datos = K.nodo('<p class="tu-sw-datos"></p>');
    var partes = [plural(D.activos || 0, 'activo', 'activos') + ' de ' + plural(D.videos.length, 'tutorial', 'tutoriales')];
    if (D.enCloudinary) partes.push(D.enCloudinary + (D.enCloudinary === 1 ? ' portada sigue' : ' portadas siguen') + ' en Cloudinary');
    datos.textContent = partes.join(' · ');
    if (D.carpeta) {
      var a = K.nodo('<a class="kit-btn kit-btn--plano ad-mini" target="_blank" rel="noopener">' + K.icono('archivo', 14) + ' Ir a carpeta</a>');
      a.href = 'https://drive.google.com/drive/folders/' + encodeURIComponent(D.carpeta);
      a.title = 'Carpeta TUTORIALES EN VIDEO: sube ahí los videos nuevos';
      datos.appendChild(a);
    }
    z.appendChild(datos);
  }

  function cambiar(inp, quiero) {
    inp.checked = !quiero;   /* no cambia hasta que el CORE lo confirme */
    if (quiero && !D.videos.some(function (v) { return v.activo && v.drive; })) {
      K.aviso('No hay ningún tutorial activo con video: el contratista vería la vista vacía.', 'aviso', 6000);
      return;
    }
    var n = D.videos.filter(function (v) { return v.activo && v.drive; }).length;
    K.piezas.confirmar.abrir({
      titulo: quiero ? '¿Encender los tutoriales?' : '¿Apagar los tutoriales?',
      texto: quiero
        ? 'Los contratistas verán la tarjeta TUTORIALES DE USO en su inicio con los ' + n + ' videos activos. Revisa que estén al día antes de encender.'
        : 'Los contratistas dejan de ver la tarjeta TUTORIALES DE USO y no pueden abrir los videos. No se borra nada.',
      si: quiero ? 'Encender' : 'Apagar', no: 'Cancelar'
    }).then(function (ok) {
      if (!ok || K.ocupado) return;
      K.ocupado = true;
      inp.disabled = true;
      K.pedir('tutorialesInterruptor', { activo: quiero }, { ms: 60000 }).then(function (r) {
        K.ocupado = false;
        D.activo = !!r.activo;
        if (r.bitacora) C.bitacora(r.bitacora);
        K.aviso(D.activo ? 'Tutoriales encendidos: los contratistas ya los ven.' : 'Tutoriales apagados.', 'ok', 3500);
        repintar();
      }, function (e) {
        K.ocupado = false;
        inp.disabled = false;
        K.aviso((e && e.message) || 'No se pudo cambiar.', 'malo', 7000);
      });
    });
  }

  /* ── tarjeta ── */

  function portadaImg(v, clase) {
    var img = K.nodo('<img class="' + clase + '" alt="" loading="lazy" referrerpolicy="no-referrer">');
    var fuentes = [v.portada, v.miniaturaVideo].filter(Boolean), i = 0;
    img.addEventListener('error', function () {
      i++;
      if (i < fuentes.length) img.src = fuentes[i];
      else img.classList.add('tu-mini--sin');
    });
    if (fuentes.length) img.src = fuentes[0]; else img.classList.add('tu-mini--sin');
    return img;
  }

  function tarjeta(v) {
    var t = K.nodo(
      '<article class="kit-tarjeta tu-t' + (v.activo ? '' : ' tu-t--ret') + '">' +
      '  <button type="button" class="tu-t__mini" aria-label="Ver el video">' +
      '    <span class="tu-t__play">' + K.icono('play', 22) + '</span>' +
      (v.duracion ? '<span class="tu-t__dur">' + K.esc(v.duracion) + '</span>' : '') +
      '  </button>' +
      '  <div class="tu-t__cuerpo">' +
      '    <div class="tu-t__fila"><span class="tu-t__tema"></span><span class="kit-pastilla of-estado ' + (v.activo ? 'of-estado--ok' : 'of-estado--malo') + '">' + (v.activo ? 'ACTIVO' : 'RETIRADO') + '</span></div>' +
      '    <b class="tu-t__titulo"></b>' +
      '    <small class="tu-t__meta"></small>' +
      '    <div class="tu-t__avisos"></div>' +
      '    <div class="ct-acc tu-t__acc"></div>' +
      '  </div>' +
      '</article>');
    t.querySelector('.tu-t__mini').insertBefore(portadaImg(v, 'tu-mini'), t.querySelector('.tu-t__play'));
    t.querySelector('.tu-t__tema').textContent = temaTxt(v.categoria) + ' · orden ' + v.orden;
    t.querySelector('.tu-t__titulo').textContent = v.titulo;
    t.querySelector('.tu-t__meta').textContent = [plural(v.vistas || 0, 'vista', 'vistas'), plural(v.likes || 0, 'me gusta', 'me gusta'),
      plural(v.comentarios || 0, 'comentario', 'comentarios'), v.id].join(' · ');
    var av = t.querySelector('.tu-t__avisos');
    if (v.portadaCloudinary) av.appendChild(K.nodo('<span class="tu-aviso">' + K.icono('aviso', 13) + ' Portada en Cloudinary: súbela de nuevo</span>'));
    else if (!v.portadaCruda) av.appendChild(K.nodo('<span class="tu-aviso tu-aviso--suave">' + K.icono('imagen', 13) + ' Sin portada: se ve un cuadro del video</span>'));
    if (!v.drive) av.appendChild(K.nodo('<span class="tu-aviso">' + K.icono('aviso', 13) + ' Sin video</span>'));

    t.querySelector('.tu-t__mini').addEventListener('click', function () { verVideo(v); });
    var acc = t.querySelector('.tu-t__acc');
    var bE = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('lapiz', 15) + ' Editar</button>');
    bE.addEventListener('click', function () { editar(v); });
    var bR = K.nodo('<button type="button" class="kit-btn kit-btn--plano' + (v.activo ? ' kit-btn--malo' : '') + '">' +
      K.icono(v.activo ? 'prohibido' : 'recargar', 15) + (v.activo ? ' Retirar' : ' Activar') + '</button>');
    bR.addEventListener('click', function () { retirar(v); });
    var bB = K.nodo('<button type="button" class="kit-btn kit-btn--plano kit-btn--malo tu-t__borrar" aria-label="Eliminar" title="Eliminar">' + K.icono('basura', 15) + '</button>');
    bB.addEventListener('click', function () { eliminar(v); });
    acc.appendChild(bE); acc.appendChild(bR); acc.appendChild(bB);
    return t;
  }

  /* ── ver el video ── */

  function verVideo(v) {
    if (!v.drive) { K.aviso('Este tutorial no tiene video.', 'aviso', 3000); return; }
    var cuerpo = K.nodo('<div class="tu-ver"><div class="tu-ver__marco"></div><p class="formulario__nota"></p></div>');
    cuerpo.querySelector('.tu-ver__marco').innerHTML = '<iframe src="https://drive.google.com/file/d/' + encodeURIComponent(v.drive) +
      '/preview" title="' + K.esc(v.titulo) + '" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    cuerpo.querySelector('p').textContent = temaTxt(v.categoria) + (v.duracion ? ' · ' + v.duracion : '') + (v.descripcion ? ' — ' + v.descripcion : '');
    var m = O.modal({
      titulo: v.titulo, cuerpo: cuerpo, ancha: true,
      botones: [
        { texto: 'Abrir en Drive', icono: 'abrir-pestana', al: function () { window.open(driveVer(v.drive), '_blank', 'noopener'); } },
        { texto: 'Cerrar', marca: true, al: function () { m.cerrar(); } }
      ]
    });
  }

  /* ── crear / editar ── */

  function editar(v) {
    var nuevo = !v;
    v = v || { titulo: '', categoria: '', descripcion: '', drive: '', orden: '', activo: true, portada: '', portadaCruda: '' };
    var temas = (D && D.temas) || {};
    var usados = (D ? D.videos : []).map(function (x) { return x.categoria; });
    var claves = Object.keys(temas);
    usados.forEach(function (c) { if (c && claves.indexOf(c) < 0) claves.push(c); });

    var portada = { dataUrl: '', quitar: false };
    var cuerpo = K.nodo('<div class="tu-form"></div>');

    function campo(etiqueta, html, ayuda) {
      var l = K.nodo('<label class="op-campo"><span></span>' + html + (ayuda ? '<small class="campo__ayuda"></small>' : '') + '</label>');
      l.querySelector('span').textContent = etiqueta;
      if (ayuda) l.querySelector('small').textContent = ayuda;
      cuerpo.appendChild(l);
      return l.querySelector('input, select, textarea');
    }

    var iT = campo('Título', '<input class="ad-in" maxlength="120" autocomplete="off">');
    iT.value = v.titulo;
    var sT = campo('Tema (las pastillas de la vista del contratista)', '<select class="ad-in op-select"></select>');
    claves.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = temaTxt(c); sT.appendChild(o); });
    var oOtro = document.createElement('option'); oOtro.value = '__otro'; oOtro.textContent = 'Otro tema…'; sT.appendChild(oOtro);
    sT.value = v.categoria && claves.indexOf(v.categoria) >= 0 ? v.categoria : (claves[0] || '__otro');
    var lOtro = K.nodo('<label class="op-campo"><span>Nombre del tema nuevo</span><input class="ad-in" maxlength="40" autocomplete="off" placeholder="Por ejemplo: Plan de pagos"></label>');
    var iOtro = lOtro.querySelector('input');
    cuerpo.appendChild(lOtro);
    /* style y no [hidden]: .op-campo es grid y le gana al atributo dentro del modal */
    function verOtro() { lOtro.style.display = sT.value === '__otro' ? '' : 'none'; }
    sT.addEventListener('change', verOtro); verOtro();

    var iD = campo('Descripción (opcional)', '<textarea class="ad-in" rows="3" maxlength="1000"></textarea>');
    iD.value = v.descripcion || '';

    var iV = campo('Video en Drive (enlace o id)', '<input class="ad-in" autocomplete="off" placeholder="https://drive.google.com/file/d/…/view">',
      'Sube el video a la carpeta TUTORIALES EN VIDEO y pega aquí su enlace. Al guardar se comprueba que sea un video, se comparte con enlace y se toma su duración.');
    iV.value = v.drive ? driveVer(v.drive) : '';

    /* portada */
    var zP = K.nodo(
      '<div class="op-campo tu-portada"><span>Portada (imagen 16:9, se guarda en Drive)</span>' +
      '  <div class="tu-portada__fila">' +
      '    <div class="tu-portada__vista"></div>' +
      '    <div class="tu-portada__botones">' +
      '      <label class="kit-btn kit-btn--plano">' + K.icono('imagen', 15) + ' <span>Subir imagen</span><input type="file" accept="image/*" hidden></label>' +
      '      <button type="button" class="kit-btn kit-btn--plano kit-btn--malo" hidden>' + K.icono('basura', 15) + ' Quitar portada</button>' +
      '      <small class="campo__ayuda">Sin portada, el contratista ve un cuadro del propio video.</small>' +
      '    </div>' +
      '  </div>' +
      '</div>');
    cuerpo.appendChild(zP);
    var vistaP = zP.querySelector('.tu-portada__vista');
    var inFile = zP.querySelector('input[type="file"]');
    var bQuitar = zP.querySelector('button');
    function pintarPortada() {
      vistaP.innerHTML = '';
      var src = portada.dataUrl || (portada.quitar ? '' : v.portada);
      var sin = function () { vistaP.innerHTML = '<span class="tu-portada__sin">' + K.icono('imagen', 26) + '</span>'; };
      if (src) {
        var im = K.nodo('<img alt="Portada" referrerpolicy="no-referrer">');
        im.addEventListener('error', sin);
        im.src = src;
        vistaP.appendChild(im);
      } else sin();
      bQuitar.style.display = src ? '' : 'none';
    }
    inFile.addEventListener('change', function () {
      var f = inFile.files && inFile.files[0];
      inFile.value = '';
      if (!f) return;
      if (!/^image\//.test(f.type) && !/\.(heic|heif)$/i.test(f.name)) { K.aviso('La portada debe ser una imagen.', 'aviso', 4000); return; }
      var prep = K.piezas.imagenes ? K.piezas.imagenes.preparar(f) : Promise.reject(new Error('Falta la pieza de imágenes.'));
      prep.then(function (r) { portada.dataUrl = r.dataUrl; portada.quitar = false; pintarPortada(); },
        function (e) { K.aviso((e && e.message) || 'No se pudo leer la imagen.', 'malo', 5000); });
    });
    bQuitar.addEventListener('click', function () { portada.dataUrl = ''; portada.quitar = !!v.portadaCruda; pintarPortada(); });
    pintarPortada();

    var iO = campo('Orden dentro del tema', '<input class="ad-in" type="number" min="0" max="999" inputmode="numeric">',
      nuevo ? 'Vacío = va al final de su tema.' : '');
    iO.value = v.orden === '' || v.orden === undefined ? '' : v.orden;

    var lA = K.nodo('<label class="op-check"><input type="checkbox"><span>Activo<small>Retirado = no le sale al contratista, pero no se borra.</small></span></label>');
    var iA = lA.querySelector('input');
    iA.checked = v.activo !== false;
    cuerpo.appendChild(lA);

    var iM = campo('Motivo (opcional, queda en la bitácora)', '<input class="ad-in" maxlength="300" autocomplete="off">');

    var m = O.modal({
      titulo: nuevo ? 'Nuevo tutorial' : 'Editar tutorial', cuerpo: cuerpo, ancha: true,
      botones: [
        { texto: 'Cancelar', al: function () { m.cerrar(); } },
        { texto: 'Guardar', icono: 'check', marca: true, al: guardar }
      ]
    });
    setTimeout(function () { (nuevo ? iT : iV).focus(); }, 120);

    function guardar() {
      var titulo = iT.value.replace(/\s+/g, ' ').trim();
      var tema = sT.value === '__otro' ? iOtro.value.trim() : sT.value;
      var video = iV.value.trim();
      if (titulo.length < 4) { K.aviso('Escribe el título.', 'aviso', 3000); iT.focus(); return; }
      if (!tema) { K.aviso('Escribe el nombre del tema.', 'aviso', 3000); iOtro.focus(); return; }
      if (!video) { K.aviso('Pega el enlace del video en Drive.', 'aviso', 3000); iV.focus(); return; }
      if (K.ocupado) return;
      K.ocupado = true;
      var datos = {
        id: nuevo ? '' : v.id, titulo: titulo, categoria: tema, descripcion: iD.value.trim(), video: video,
        orden: iO.value.trim(), activo: iA.checked, motivo: iM.value.trim()
      };
      if (portada.dataUrl) datos.portada = portada.dataUrl;
      else if (portada.quitar) datos.quitarPortada = true;
      K.piezas.guardado.mientras(K.pedir('tutorialGuardar', datos, { ms: 120000 }), {
        titulo: nuevo ? 'Creando el tutorial' : 'Guardando el tutorial', sub: 'No cierres la app.',
        pasos: ['Revisando el video en Drive…', portada.dataUrl ? 'Subiendo la portada…' : 'Guardando…', 'Poniendo la lista al día…'],
        listo: { titulo: 'Tutorial guardado', paso: 'Listo' }
      }).then(function (r) {
        K.ocupado = false;
        m.cerrar();
        if (r.bitacora) C.bitacora(r.bitacora);
        if (r.resumen) recibir(r.resumen);
        if (!r.duracionDeDrive) K.aviso('Drive todavía no da la duración del video (pasa con los recién subidos). Vuelve a guardarlo en unos minutos.', 'aviso', 8000);
        repintar();
      }, function (e) {
        K.ocupado = false;
        K.aviso((e && e.message) || 'No se pudo guardar.', 'malo', 9000);
      });
    }
  }

  /* ── retirar / activar ── */

  function retirar(v) {
    var quitar = v.activo;
    K.piezas.confirmar.abrir({
      titulo: quitar ? '¿Retirar este tutorial?' : '¿Activar este tutorial?',
      texto: quitar ? '"' + v.titulo + '" deja de verse en la app del contratista. No se borra: lo puedes volver a activar.'
                    : '"' + v.titulo + '" vuelve a verse en la app del contratista' + (D && D.activo ? '.' : ' (cuando enciendas la vista).'),
      si: quitar ? 'Retirar' : 'Activar', no: 'Cancelar'
    }).then(function (ok) {
      if (!ok || K.ocupado) return;
      K.ocupado = true;
      K.pedir('tutorialGuardar', {
        id: v.id, titulo: v.titulo, categoria: v.categoria, descripcion: v.descripcion, video: v.drive,
        orden: v.orden, activo: !quitar
      }, { ms: 90000 }).then(function (r) {
        K.ocupado = false;
        if (r.bitacora) C.bitacora(r.bitacora);
        if (r.resumen) recibir(r.resumen);
        K.aviso(quitar ? 'Tutorial retirado.' : 'Tutorial activo.', 'ok', 2500);
        repintar();
      }, function (e) { K.ocupado = false; K.aviso((e && e.message) || 'No se pudo cambiar.', 'malo', 7000); });
    });
  }

  /* ── eliminar ── */

  function eliminar(v) {
    var cuerpo = K.nodo('<div><p class="formulario__nota"></p>' +
      '<label class="bt-conf"><span>Escribe ELIMINAR para confirmar</span><input autocomplete="off" aria-label="Escribe ELIMINAR"></label></div>');
    cuerpo.querySelector('p').textContent = 'Se borra "' + v.titulo + '" con sus ' + plural(v.likes || 0, 'me gusta', 'me gusta') + ' y sus ' +
      plural(v.comentarios || 0, 'comentario', 'comentarios') + ', y su portada en Drive. El video de Drive NO se borra. Si solo quieres esconderlo, usa Retirar.';
    var m = O.modal({
      titulo: 'Eliminar el tutorial', cuerpo: cuerpo,
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } },
                { texto: 'Eliminar', icono: 'basura', marca: true, al: function () {
                  var t = cuerpo.querySelector('input').value.trim().toUpperCase();
                  if (t !== 'ELIMINAR') { K.aviso('Escribe ELIMINAR.', 'aviso', 3000); return; }
                  if (K.ocupado) return;
                  K.ocupado = true;
                  m.cerrar();
                  K.piezas.guardado.mientras(K.pedir('tutorialEliminar', { id: v.id, confirmar: 'ELIMINAR' }, { ms: 90000 }), {
                    titulo: 'Eliminando el tutorial', sub: 'No cierres la app.', pasos: ['Borrando me gusta y comentarios…', 'Borrando el tutorial…'],
                    listo: { titulo: 'Tutorial eliminado', paso: 'Listo' }
                  }).then(function (r) {
                    K.ocupado = false;
                    if (r.bitacora) C.bitacora(r.bitacora);
                    if (r.resumen) recibir(r.resumen);
                    if (r.apagado) K.aviso('No quedó ningún tutorial activo: la vista se apagó sola.', 'aviso', 7000);
                    repintar();
                  }, function (e) { K.ocupado = false; K.aviso((e && e.message) || 'No se pudo eliminar.', 'malo', 7000); });
                } }]
    });
  }

  window.TUTORIALES = {
    configurar: function (c) { C = c || {}; },
    vista: vista,
    cargar: cargar,
    olvidar: function () { D = null; F = { estado: '', busca: '' }; K.guardar.borrar(FILTRO_K); },
    _datos: function () { return D; },
    _filtrados: filtrados
  };
}());
