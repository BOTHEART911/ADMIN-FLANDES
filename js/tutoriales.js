/* ============================================================
   ADMIN-FLANDES · TUTORIALES EN VIDEO (22/11/2026 · YouTube)

   La vista TUTORIALES DE USO de la app CONTRATISTA se administra aquí.
   Dos pestañas:

     · TUTORIALES. El interruptor de la vista y cada tutorial: título,
       tema, descripción, el enlace del VIDEO (lo ve el PC) y el del SHORT
       (lo ve el celular), la duración, la IMAGEN DEL SHORT (opcional:
       YouTube no entrega la portada vertical de los Shorts; la horizontal
       sí la da YouTube) y las PALABRAS con las que el asistente ofrece el
       video. Se ordenan con las flechas. Retirar lo esconde; Eliminar lo
       borra con sus me gusta, vistas y comentarios.
     · COMENTARIOS. Todos los de los tutoriales: responder como DEV (sale
       con la insignia DEV en la app) y eliminar (para todos, con sus
       respuestas; queda en la bitácora).

   Una llamada al entrar ('tutoriales'); los comentarios, al abrir su
   pestaña. Cada escritura devuelve la lista al día: no hay segundo viaje.
   Reemplaza la versión de Drive (ajuste 4, 25/09).
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var O = window.OFICINA;
  var C = {};
  var FILTRO_K = 'admin.tutoriales.filtro.v2';

  var D = null;          /* {activo, temas, videos, activos, sinResponder, baseContratista} */
  var CM = null;         /* {comentarios, total, sinResponder} */
  var HORA = null;
  var CARGANDO = null;
  var PEST = 'tutoriales';
  var F = { estado: leerFiltro(), busca: '', com: 'SIN' };
  var TEMAS = { pasos: 'Primeros pasos', borrador: 'Tu borrador', cuenta: 'Tu cuenta', plan: 'Plan de pagos', ayuda: 'Ayuda' };

  function leerFiltro() { var g = K.guardar.leer(FILTRO_K, null); return g === null || g === undefined ? '' : g; }
  function guardarFiltro() { K.guardar.escribir(FILTRO_K, F.estado); }
  function temaTxt(c) { return (D && D.temas && D.temas[c]) || TEMAS[c] || 'Sin tema'; }
  function plural(n, uno, varios) { return K.numero(n) + ' ' + (n === 1 ? uno : varios); }

  function recibir(d) {
    D = d || { videos: [] };
    D.videos = (D.videos || []).map(function (v) {
      v._t = K.norm([v.id, v.titulo, temaTxt(v.categoria), v.descripcion, (v.palabras || []).join(' ')].join(' '));
      return v;
    }).sort(function (a, b) { return (a.orden - b.orden) || String(a.id).localeCompare(String(b.id)); });
    HORA = new Date();
  }

  function cargar(fresco) {
    if (D && !fresco) return Promise.resolve(D);
    if (CARGANDO && !fresco) return CARGANDO;
    CARGANDO = O.leer('tutoriales').then(function (d) { CARGANDO = null; recibir(d); return D; },
      function (e) { CARGANDO = null; throw e; });
    return CARGANDO;
  }

  /* imágenes: la horizontal de YouTube; la vertical, la del repo de CONTRATISTA o la de Drive */
  function imgSrc(v) {
    var s = String(v || '');
    if (/^img\//.test(s)) return (D && D.baseContratista ? D.baseContratista : '') + s;
    return s;
  }
  function fuentesH(v) {
    var id = v.youtube || v.short;
    return id ? ['https://i.ytimg.com/vi/' + id + '/mqdefault.jpg', 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'] : [];
  }
  function fuentesV(v) {
    var l = [];
    if (v.shortImg) l.push(imgSrc(v.shortImg));
    if (v.short) l.push('https://i.ytimg.com/vi/' + v.short + '/oar2.jpg');
    return l;
  }
  function imagen(fuentes, clase, ancho, alto, alt) {
    var img = K.nodo('<img class="' + clase + '" alt="' + K.esc(alt || '') + '" loading="lazy" referrerpolicy="no-referrer" width="' + ancho + '" height="' + alto + '">');
    var i = 0;
    img.addEventListener('error', function () { i++; if (i < fuentes.length) img.src = fuentes[i]; else img.classList.add('tu-img--sin'); });
    if (fuentes.length) img.src = fuentes[0]; else img.classList.add('tu-img--sin');
    return img;
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

  /* ══════════════ vista ══════════════ */

  var REPINTAR = null;

  function vista() {
    var caja = K.nodo('<div class="kit-ancho vista ct of tu"></div>');
    C.app.appendChild(caja);
    O.cabecera(caja, 'play', 'TUTORIALES EN VIDEO',
      'Los videos de YouTube que ve el contratista en <b>TUTORIALES DE USO</b>: el Short en el celular y el video en el PC. Aquí se encienden, se ordenan y se responden sus comentarios.');

    var zSw = K.nodo('<section class="kit-tarjeta tu-sw-caja" aria-live="polite"></section>');
    caja.appendChild(zSw);

    var tabs = K.nodo('<div class="tu-tabs" role="tablist" aria-label="Tutoriales y comentarios">' +
      '<button type="button" role="tab" class="tu-tab" data-p="tutoriales">' + K.icono('play', 16) + ' Tutoriales</button>' +
      '<button type="button" role="tab" class="tu-tab" data-p="comentarios">' + K.icono('comentario', 16) + ' Comentarios <span class="tu-tab__n"></span></button></div>');
    caja.appendChild(tabs);
    var zona = K.nodo('<div class="tu-zona"></div>');
    caja.appendChild(zona);
    tabs.querySelectorAll('.tu-tab').forEach(function (b) {
      b.addEventListener('click', function () { K.vibrar(6); PEST = b.getAttribute('data-p'); pintar(); });
    });

    function pintar() {
      pintarInterruptor(zSw);
      tabs.querySelectorAll('.tu-tab').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-p') === PEST ? 'true' : 'false'); });
      var n = D ? (CM ? CM.sinResponder : D.sinResponder) || 0 : 0;
      var tn = tabs.querySelector('.tu-tab__n');
      tn.textContent = n ? n + ' sin responder' : '';
      tn.hidden = !n;
      zona.innerHTML = '';
      if (PEST === 'comentarios') pestanaComentarios(zona); else pestanaTutoriales(zona);
    }
    REPINTAR = pintar;

    K.piezas.esqueletos.mientras(zona, cargar(false), { forma: 'filas', cuantos: 5, espera: 'Trayendo los tutoriales' })
      .then(pintar)['catch'](function (e) { caja.appendChild(C.errorCaja(e, function () { D = null; vista(); })); });
    K.piezas.creditos.montar(caja);
  }

  function repintar() { if (REPINTAR) REPINTAR(); }

  /* ── interruptor ── */

  function conVideo() { return D.videos.filter(function (v) { return v.activo && (v.youtube || v.short); }).length; }

  function pintarInterruptor(z) {
    z.innerHTML = '';
    if (!D) return;
    var on = !!D.activo;
    var fila = K.nodo(
      '<div class="tu-sw-fila">' +
      '  <div class="tu-sw-txt"><b></b><small></small></div>' +
      '  <label class="tu-sw"><input type="checkbox" role="switch" aria-label="Vista TUTORIALES en la app Contratista"><span class="tu-sw__pista"><span class="tu-sw__bola"></span></span></label>' +
      '</div>');
    fila.querySelector('b').textContent = on ? 'Vista TUTORIALES encendida en Contratista' : 'Vista TUTORIALES apagada en Contratista';
    fila.querySelector('small').textContent = on
      ? 'El contratista ve TUTORIALES DE USO en su inicio con ' + plural(conVideo(), 'tutorial', 'tutoriales') + ', y el asistente ofrece el video cuando aplica.'
      : 'El contratista no ve la vista ni el asistente ofrece videos. Enciéndela cuando estén al día.';
    z.classList.toggle('tu-sw-caja--on', on);
    var inp = fila.querySelector('input');
    inp.checked = on;
    inp.addEventListener('change', function () { cambiar(inp, inp.checked); });
    z.appendChild(fila);
  }

  function cambiar(inp, quiero) {
    inp.checked = !quiero;   /* no cambia hasta que el CORE lo confirme */
    var n = conVideo();
    if (quiero && !n) { K.aviso('No hay ningún tutorial activo con video: el contratista vería la vista vacía.', 'aviso', 6000); return; }
    K.piezas.confirmar.abrir({
      titulo: quiero ? '¿Encender los tutoriales?' : '¿Apagar los tutoriales?',
      texto: quiero ? 'Los contratistas verán TUTORIALES DE USO en su inicio con los ' + n + ' tutoriales activos.'
                    : 'Los contratistas dejan de ver TUTORIALES DE USO. No se borra nada.',
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
      }, function (e) { K.ocupado = false; inp.disabled = false; K.aviso((e && e.message) || 'No se pudo cambiar.', 'malo', 7000); });
    });
  }

  /* ══════════════ pestaña TUTORIALES ══════════════ */

  function pestanaTutoriales(zona) {
    var nuevo = K.nodo('<button type="button" class="kit-btn kit-btn--marca of-nuevo">' + K.icono('mas', 18) + ' Agregar tutorial</button>');
    nuevo.addEventListener('click', function () { K.vibrar(8); editar(null); });
    zona.appendChild(nuevo);
    var b = O.barra({
      placeholder: 'Título, tema, palabras o id', valor: F.busca,
      alBuscar: function (q) { F.busca = q; lista(); },
      alRefrescar: function () { return cargar(true).then(repintar); }
    });
    zona.appendChild(b.caja);
    var zP = K.nodo('<div></div>');
    zona.appendChild(zP);
    var conteo = K.nodo('<p class="ct-conteo" aria-live="polite"></p>');
    zona.appendChild(conteo);
    var rej = K.nodo('<div class="tu-lista"></div>');
    zona.appendChild(rej);
    var pE = K.piezas.pastillas.montar(zP, {
      etiqueta: 'Estado', valor: F.estado,
      opciones: [{ valor: '', texto: 'Todos' }, { valor: 'ACTIVO', texto: 'Publicados', tono: 'ok' }, { valor: 'RETIRADO', texto: 'Retirados', tono: 'malo' }],
      alCambiar: function (v) { F.estado = v || ''; guardarFiltro(); lista(); }
    });

    function lista() {
      var base = D.videos.filter(function (v) { return pasa(v, true); });
      if (pE && pE.conteos) pE.conteos({ '': base.length, ACTIVO: base.filter(function (v) { return v.activo; }).length,
        RETIRADO: base.filter(function (v) { return !v.activo; }).length });
      O.marcar(zP, F.estado);
      var filas = D.videos.filter(function (v) { return pasa(v); });
      conteo.innerHTML = '<b>' + K.numero(filas.length) + '</b> ' + (filas.length === 1 ? 'tutorial' : 'tutoriales') +
        (HORA ? '<span class="ct-sello">' + K.icono('reloj', 13) + ' Al día a las ' + K.esc(O.horaCorta(HORA)) + '</span>' : '');
      rej.innerHTML = '';
      if (!D.videos.length) { rej.appendChild(K.nodo('<div class="kit-tarjeta ct-vacio">' + K.icono('play', 30) + '<p><b>Todavía no hay tutoriales.</b><br>Toca Agregar tutorial.</p></div>')); return; }
      if (!filas.length) rej.appendChild(O.vacio('No hay tutoriales con estos filtros.', function () { F.estado = ''; F.busca = ''; b.inp.value = ''; guardarFiltro(); lista(); }));
      var ordenable = !F.estado && !F.busca;
      filas.forEach(function (v) { rej.appendChild(fila(v, ordenable)); });
    }
    lista();
  }

  function fila(v, ordenable) {
    var t = K.nodo(
      '<article class="kit-tarjeta tu-f' + (v.activo ? '' : ' tu-f--ret') + '">' +
      '  <span class="tu-f__n" aria-label="Tutorial ' + (v.n || '') + '">' + (v.n || '–') + '</span>' +
      '  <span class="tu-f__h"></span><span class="tu-f__v"></span>' +
      '  <span class="tu-f__txt"><b></b><small></small><span class="tu-f__avisos"></span></span>' +
      '  <span class="kit-pastilla of-estado ' + (v.activo ? 'of-estado--ok' : 'of-estado--malo') + '">' + (v.activo ? 'Publicado' : 'Retirado') + '</span>' +
      '  <span class="tu-f__acc"></span>' +
      '</article>');
    t.querySelector('.tu-f__h').appendChild(imagen(fuentesH(v), 'tu-img', 112, 63, ''));
    t.querySelector('.tu-f__v').appendChild(imagen(fuentesV(v), 'tu-img', 36, 64, ''));
    t.querySelector('b').textContent = v.titulo;
    t.querySelector('small').textContent = [temaTxt(v.categoria), v.duracion, (v.youtube && v.short ? 'video y Short' : (v.short ? 'solo Short' : 'solo video')),
      plural(v.vistas || 0, 'vista', 'vistas'), plural(v.likes || 0, 'me gusta', 'me gusta'), plural(v.comentarios || 0, 'comentario', 'comentarios')].filter(Boolean).join(' · ');
    var av = t.querySelector('.tu-f__avisos');
    if (!v.shortImg && v.short) av.appendChild(K.nodo('<span class="tu-aviso tu-aviso--suave">' + K.icono('imagen', 13) + ' Sin imagen del Short: se ve un cuadro del video</span>'));
    if (!(v.palabras || []).length) av.appendChild(K.nodo('<span class="tu-aviso tu-aviso--suave">' + K.icono('robot', 13) + ' Sin palabras: el asistente no lo ofrece</span>'));

    var acc = t.querySelector('.tu-f__acc');
    function boton(icono, texto, fn, clase, solo) {
      var b = K.nodo('<button type="button" class="kit-btn kit-btn--plano ' + (clase || '') + '"' + (solo ? ' aria-label="' + texto + '" title="' + texto + '"' : '') + '>' + K.icono(icono, 15) + (solo ? '' : ' ' + texto) + '</button>');
      b.addEventListener('click', fn);
      acc.appendChild(b);
      return b;
    }
    if (ordenable) {
      var i = D.videos.indexOf(v);
      var bu = boton('arriba', 'Subir en el orden', function () { mover(v, -1); }, 'tu-f__flecha', true);
      var bd = boton('abajo', 'Bajar en el orden', function () { mover(v, 1); }, 'tu-f__flecha', true);
      bu.disabled = i <= 0; bd.disabled = i >= D.videos.length - 1;
    }
    boton('lapiz', 'Editar', function () { editar(v); });
    boton(v.activo ? 'prohibido' : 'recargar', v.activo ? 'Retirar' : 'Publicar', function () { retirar(v); }, v.activo ? 'kit-btn--malo' : '');
    boton('basura', 'Eliminar', function () { eliminar(v); }, 'kit-btn--malo tu-f__borrar', true);
    return t;
  }

  /* ── orden ── */

  var ORDEN_EN_VUELO = false;
  function mover(v, paso) {
    if (ORDEN_EN_VUELO || K.ocupado) return;
    var l = D.videos.slice(), i = l.indexOf(v), j = i + paso;
    if (j < 0 || j >= l.length) return;
    l.splice(i, 1); l.splice(j, 0, v);
    var antes = D.videos;
    D.videos = l;
    l.forEach(function (x, k) { x.orden = k + 1; });
    repintar();   /* se ve de una; el CORE confirma */
    ORDEN_EN_VUELO = true;
    K.pedir('tutorialesOrdenar', { ids: l.map(function (x) { return x.id; }) }, { ms: 60000 }).then(function (r) {
      ORDEN_EN_VUELO = false;
      if (r.bitacora) C.bitacora(r.bitacora);
      if (r.resumen) recibir(r.resumen);
      repintar();
    }, function (e) {
      ORDEN_EN_VUELO = false;
      D.videos = antes; repintar();
      K.aviso((e && e.message) || 'No se pudo cambiar el orden.', 'malo', 6000);
    });
  }

  /* ── crear / editar ── */

  function editar(v) {
    var nuevo = !v;
    v = v || { titulo: '', categoria: 'pasos', descripcion: '', youtube: '', short: '', duracion: '', palabras: [], activo: true, shortImg: '' };
    var img = { dataUrl: '', quitar: false };
    var cuerpo = K.nodo('<div class="tu-form"></div>');

    function campo(etiqueta, html, ayuda, donde) {
      var l = K.nodo('<label class="op-campo"><span></span>' + html + (ayuda ? '<small class="campo__ayuda"></small>' : '') + '</label>');
      l.querySelector('span').textContent = etiqueta;
      if (ayuda) l.querySelector('small').textContent = ayuda;
      (donde || cuerpo).appendChild(l);
      return l.querySelector('input, select, textarea');
    }

    var iT = campo('Título', '<input class="ad-in" maxlength="120" autocomplete="off">');
    iT.value = v.titulo;
    var sT = campo('Tema (las pastillas de la vista del contratista)', '<select class="ad-in op-select"></select>');
    Object.keys(TEMAS).forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = temaTxt(c); sT.appendChild(o); });
    sT.value = TEMAS[v.categoria] ? v.categoria : 'pasos';
    var iD = campo('Descripción (opcional)', '<textarea class="ad-in" rows="2" maxlength="1000"></textarea>');
    iD.value = v.descripcion || '';

    var dos = K.nodo('<div class="tu-form__dos"></div>');
    cuerpo.appendChild(dos);
    var iY = campo('Enlace del video (lo ve el PC)', '<input class="ad-in" autocomplete="off" inputmode="url" placeholder="https://youtu.be/…">',
      'La miniatura la toma la app de YouTube.', dos);
    iY.value = v.youtube ? 'https://youtu.be/' + v.youtube : '';
    var iS = campo('Enlace del Short (lo ve el celular)', '<input class="ad-in" autocomplete="off" inputmode="url" placeholder="https://youtube.com/shorts/…">', '', dos);
    iS.value = v.short ? 'https://youtube.com/shorts/' + v.short : '';
    var iDu = campo('Duración (m:ss)', '<input class="ad-in" maxlength="5" autocomplete="off" inputmode="numeric" placeholder="1:38">',
      'YouTube no la entrega sin facturación: se escribe aquí.', dos);
    iDu.value = v.duracion || '';

    /* imagen del Short */
    var zI = K.nodo(
      '<div class="op-campo tu-portada"><span>Imagen del Short (opcional)</span>' +
      '  <div class="tu-portada__fila">' +
      '    <div class="tu-portada__vista tu-portada__vista--v"></div>' +
      '    <div class="tu-portada__botones">' +
      '      <label class="kit-btn kit-btn--plano">' + K.icono('imagen', 15) + ' <span>Cambiar imagen</span><input type="file" accept="image/*" hidden></label>' +
      '      <button type="button" class="kit-btn kit-btn--plano kit-btn--malo">' + K.icono('basura', 15) + ' Quitar imagen</button>' +
      '      <small class="campo__ayuda">YouTube no entrega la portada propia del Short: súbela aquí (vertical 9:16). Vacía, se ve un cuadro del video.</small>' +
      '    </div>' +
      '  </div>' +
      '</div>');
    cuerpo.appendChild(zI);
    var vistaI = zI.querySelector('.tu-portada__vista');
    var inFile = zI.querySelector('input[type="file"]');
    var bQuitar = zI.querySelector('button');
    function pintarImg() {
      vistaI.innerHTML = '';
      var src = img.dataUrl || (img.quitar ? '' : imgSrc(v.shortImg));
      var sin = function () { vistaI.innerHTML = '<span class="tu-portada__sin">' + K.icono('imagen', 26) + '</span>'; };
      if (src) { var im = K.nodo('<img alt="Imagen del Short" referrerpolicy="no-referrer">'); im.addEventListener('error', sin); im.src = src; vistaI.appendChild(im); }
      else sin();
      bQuitar.style.display = src ? '' : 'none';
    }
    inFile.addEventListener('change', function () {
      var f = inFile.files && inFile.files[0];
      inFile.value = '';
      if (!f) return;
      if (!/^image\//.test(f.type) && !/\.(heic|heif)$/i.test(f.name)) { K.aviso('Debe ser una imagen.', 'aviso', 4000); return; }
      var prep = K.piezas.imagenes ? K.piezas.imagenes.preparar(f) : Promise.reject(new Error('Falta la pieza de imágenes.'));
      prep.then(function (r) { img.dataUrl = r.dataUrl; img.quitar = false; pintarImg(); },
        function (e) { K.aviso((e && e.message) || 'No se pudo leer la imagen.', 'malo', 5000); });
    });
    bQuitar.addEventListener('click', function () { img.dataUrl = ''; img.quitar = !!v.shortImg; pintarImg(); });
    pintarImg();

    var iP = campo('Palabras para el asistente (separadas por coma)', '<textarea class="ad-in" rows="2" maxlength="900"></textarea>',
      'Si la pregunta del contratista trae alguna de estas palabras, el asistente le ofrece este video.');
    iP.value = (v.palabras || []).join(', ');

    var lA = K.nodo('<label class="op-check"><input type="checkbox"><span>Publicado<small>Retirado = no le sale al contratista, pero no se borra.</small></span></label>');
    var iA = lA.querySelector('input');
    iA.checked = v.activo !== false;
    cuerpo.appendChild(lA);
    var iM = campo('Motivo (opcional, queda en la bitácora)', '<input class="ad-in" maxlength="300" autocomplete="off">');

    var m = O.modal({
      titulo: nuevo ? 'Agregar tutorial' : 'Tutorial ' + (v.n || '') + ' · editar', cuerpo: cuerpo, ancha: true,
      botones: [
        { texto: 'Cancelar', al: function () { m.cerrar(); } },
        { texto: 'Guardar', icono: 'check', marca: true, al: guardar }
      ]
    });
    setTimeout(function () { (nuevo ? iT : iY).focus(); }, 120);

    function guardar() {
      var titulo = iT.value.replace(/\s+/g, ' ').trim();
      if (titulo.length < 4) { K.aviso('Escribe el título.', 'aviso', 3000); iT.focus(); return; }
      if (!iY.value.trim() && !iS.value.trim()) { K.aviso('Pega el enlace del video o del Short.', 'aviso', 3000); iY.focus(); return; }
      if (iDu.value.trim() && !/^\d{1,2}:\d{2}$/.test(iDu.value.trim())) { K.aviso('La duración va como m:ss (por ejemplo 1:38).', 'aviso', 4000); iDu.focus(); return; }
      if (K.ocupado) return;
      K.ocupado = true;
      var datos = {
        id: nuevo ? '' : v.id, titulo: titulo, categoria: sT.value, descripcion: iD.value.trim(),
        youtube: iY.value.trim(), short: iS.value.trim(), duracion: iDu.value.trim(), palabras: iP.value,
        orden: nuevo ? '' : v.orden, activo: iA.checked, motivo: iM.value.trim()
      };
      if (img.dataUrl) datos.shortImg = img.dataUrl;
      else if (img.quitar) datos.quitarShortImg = true;
      K.piezas.guardado.mientras(K.pedir('tutorialGuardar', datos, { ms: 90000 }), {
        titulo: nuevo ? 'Agregando el tutorial' : 'Guardando el tutorial', sub: 'No cierres la app.',
        pasos: [img.dataUrl ? 'Subiendo la imagen del Short…' : 'Guardando…', 'Poniendo la lista al día…'],
        listo: { titulo: 'Tutorial guardado', paso: 'Listo' }
      }).then(function (r) {
        K.ocupado = false;
        m.cerrar();
        if (r.bitacora) C.bitacora(r.bitacora);
        if (r.resumen) recibir(r.resumen);
        repintar();
      }, function (e) { K.ocupado = false; K.aviso((e && e.message) || 'No se pudo guardar.', 'malo', 9000); });
    }
  }

  /* ── retirar / publicar ── */

  function retirar(v) {
    var quitar = v.activo;
    K.piezas.confirmar.abrir({
      titulo: quitar ? '¿Retirar este tutorial?' : '¿Publicar este tutorial?',
      texto: quitar ? '"' + v.titulo + '" deja de verse en la app del contratista. No se borra: lo puedes volver a publicar.'
                    : '"' + v.titulo + '" vuelve a verse en la app del contratista' + (D && D.activo ? '.' : ' (cuando enciendas la vista).'),
      si: quitar ? 'Retirar' : 'Publicar', no: 'Cancelar'
    }).then(function (ok) {
      if (!ok || K.ocupado) return;
      K.ocupado = true;
      K.pedir('tutorialGuardar', {
        id: v.id, titulo: v.titulo, categoria: v.categoria, descripcion: v.descripcion, youtube: v.youtube, short: v.short,
        duracion: v.duracion, palabras: (v.palabras || []).join(', '), orden: v.orden, activo: !quitar
      }, { ms: 60000 }).then(function (r) {
        K.ocupado = false;
        if (r.bitacora) C.bitacora(r.bitacora);
        if (r.resumen) recibir(r.resumen);
        K.aviso(quitar ? 'Tutorial retirado.' : 'Tutorial publicado.', 'ok', 2500);
        repintar();
      }, function (e) { K.ocupado = false; K.aviso((e && e.message) || 'No se pudo cambiar.', 'malo', 7000); });
    });
  }

  /* ── eliminar ── */

  function eliminar(v) {
    var cuerpo = K.nodo('<div><p class="formulario__nota"></p>' +
      '<label class="bt-conf"><span>Escribe ELIMINAR para confirmar</span><input autocomplete="off" aria-label="Escribe ELIMINAR"></label></div>');
    cuerpo.querySelector('p').textContent = 'Se borra "' + v.titulo + '" con sus ' + plural(v.likes || 0, 'me gusta', 'me gusta') + ', sus vistas y sus ' +
      plural(v.comentarios || 0, 'comentario', 'comentarios') + '. Los videos de YouTube NO se borran. Si solo quieres esconderlo, usa Retirar.';
    var m = O.modal({
      titulo: 'Eliminar el tutorial', cuerpo: cuerpo,
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } },
                { texto: 'Eliminar', icono: 'basura', marca: true, al: function () {
                  if (cuerpo.querySelector('input').value.trim().toUpperCase() !== 'ELIMINAR') { K.aviso('Escribe ELIMINAR.', 'aviso', 3000); return; }
                  if (K.ocupado) return;
                  K.ocupado = true;
                  m.cerrar();
                  K.piezas.guardado.mientras(K.pedir('tutorialEliminar', { id: v.id, confirmar: 'ELIMINAR' }, { ms: 60000 }), {
                    titulo: 'Eliminando el tutorial', sub: 'No cierres la app.', pasos: ['Borrando me gusta, vistas y comentarios…', 'Borrando el tutorial…'],
                    listo: { titulo: 'Tutorial eliminado', paso: 'Listo' }
                  }).then(function (r) {
                    K.ocupado = false;
                    if (r.bitacora) C.bitacora(r.bitacora);
                    if (r.resumen) recibir(r.resumen);
                    CM = null;
                    repintar();
                  }, function (e) { K.ocupado = false; K.aviso((e && e.message) || 'No se pudo eliminar.', 'malo', 7000); });
                } }]
    });
  }

  /* ══════════════ pestaña COMENTARIOS ══════════════ */

  function recibirCm(r) {
    CM = r || { comentarios: [], total: 0, sinResponder: 0 };
    if (D) D.sinResponder = CM.sinResponder;
  }

  function pestanaComentarios(zona) {
    var zP = K.nodo('<div></div>');
    zona.appendChild(zP);
    var nota = K.nodo('<p class="ct-conteo">Eliminar quita el comentario y sus respuestas para todos; queda en la bitácora.</p>');
    zona.appendChild(nota);
    var lista = K.nodo('<div class="tu-cms"></div>');
    zona.appendChild(lista);
    var pC = K.piezas.pastillas.montar(zP, {
      etiqueta: 'Comentarios', valor: F.com,
      opciones: [{ valor: 'SIN', texto: 'Sin responder', tono: 'aviso' }, { valor: 'RESP', texto: 'Respondidos', tono: 'ok' }, { valor: '', texto: 'Todos' }],
      alCambiar: function (v) { F.com = v || ''; pintarCm(); }
    });
    function pintarCm() {
      var l = CM.comentarios;
      if (pC && pC.conteos) pC.conteos({ SIN: l.filter(function (x) { return !x.respondido; }).length, RESP: l.filter(function (x) { return x.respondido; }).length, '': l.length });
      O.marcar(zP, F.com);
      lista.innerHTML = '';
      var f = l.filter(function (x) { return !F.com || (F.com === 'SIN' ? !x.respondido : x.respondido); });
      if (!f.length) { lista.appendChild(K.nodo('<div class="kit-tarjeta ct-vacio">' + K.icono('comentario', 30) + '<p><b>' + (F.com === 'SIN' ? 'No hay comentarios sin responder.' : 'No hay comentarios.') + '</b></p></div>')); return; }
      f.forEach(function (x) { lista.appendChild(tarjetaCm(x)); });
    }
    var p = CM ? Promise.resolve(CM) : K.pedir('tutorialComentariosAdmin', {}).then(function (r) { recibirCm(r); return CM; });
    K.piezas.esqueletos.mientras(lista, p, { forma: 'filas', cuantos: 3, espera: 'Trayendo los comentarios' })
      .then(function () { pintarCm(); var tn = document.querySelector('.tu-tab__n'); if (tn) { tn.textContent = CM.sinResponder ? CM.sinResponder + ' sin responder' : ''; tn.hidden = !CM.sinResponder; } })
      ['catch'](function (e) { if (e && e.codigo === 'CANCELADA') return; lista.appendChild(C.errorCaja(e, function () { CM = null; repintar(); })); });
  }

  function nombre(x) { return x.dev ? 'Oscar Polanía' : (K.piezas.personas ? K.piezas.personas.nombrePropio(x.nombre) : x.nombre); }

  function tarjetaCm(x) {
    var tu = x.tutorial || {};
    var t = K.nodo(
      '<article class="kit-tarjeta tu-cm">' +
      '  <span class="tu-cm__tut"><span class="tu-cm__img"></span><small></small></span>' +
      '  <div class="tu-cm__cuerpo">' +
      '    <div class="tu-cm__cab"><span class="tu-cm__quien"><b></b><small></small></span>' +
      '      <span class="kit-pastilla of-estado ' + (x.respondido ? 'of-estado--ok' : 'of-estado--aviso') + '">' + (x.respondido ? 'Respondido' : 'Sin responder') + '</span>' +
      '      <span class="tu-cm__acc"></span></div>' +
      '    <p class="tu-cm__txt"></p>' +
      '    <div class="tu-cm__resps"></div>' +
      '  </div>' +
      '</article>');
    t.querySelector('.tu-cm__img').appendChild(imagen(fuentesH(tu), 'tu-img', 150, 84, ''));
    t.querySelector('.tu-cm__tut small').textContent = tu.n ? 'Tutorial ' + tu.n + ' · ' + tu.titulo : 'Tutorial borrado';
    t.querySelector('.tu-cm__quien b').textContent = nombre(x);
    t.querySelector('.tu-cm__quien small').textContent = [x.secretaria, x.fecha].filter(Boolean).join(' · ') + (x.editado ? ' · editado' : '');
    t.querySelector('.tu-cm__txt').textContent = x.texto;
    var rs = t.querySelector('.tu-cm__resps');
    (x.respuestas || []).forEach(function (r) {
      var e = K.nodo('<div class="tu-cm__r"><p class="tu-cm__rcab"><b></b>' + (r.dev ? '<span class="tu-dev">DEV</span>' : '') + '<small></small></p><p class="tu-cm__rtxt"></p><span class="tu-cm__racc"></span></div>');
      e.querySelector('b').textContent = nombre(r);
      e.querySelector('small').textContent = r.fecha + (r.editado ? ' · editado' : '');
      e.querySelector('.tu-cm__rtxt').textContent = r.texto;
      var bb = K.nodo('<button type="button" class="kit-btn kit-btn--plano kit-btn--malo ad-mini" aria-label="Eliminar esta respuesta">' + K.icono('basura', 14) + '</button>');
      bb.addEventListener('click', function () { borrarCm(r); });
      e.querySelector('.tu-cm__racc').appendChild(bb);
      rs.appendChild(e);
    });
    var acc = t.querySelector('.tu-cm__acc');
    var br = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('responder', 15) + ' Responder</button>');
    br.addEventListener('click', function () { responder(x, t, br); });
    acc.appendChild(br);
    var be = K.nodo('<button type="button" class="kit-btn kit-btn--plano kit-btn--malo">' + K.icono('basura', 15) + ' Eliminar</button>');
    be.addEventListener('click', function () { borrarCm(x); });
    acc.appendChild(be);
    return t;
  }

  function responder(x, t, boton) {
    if (t.querySelector('.tu-cm__form')) { t.querySelector('textarea').focus(); return; }
    var f = K.nodo('<form class="tu-cm__form" novalidate><label class="op-campo"><span>Respuesta como DEV (sale con la insignia DEV en la app)</span>' +
      '<textarea class="ad-in" rows="3" maxlength="1000"></textarea></label>' +
      '<div class="tu-cm__fpie"><button type="button" class="kit-btn kit-btn--plano">Cancelar</button>' +
      '<button type="submit" class="kit-btn kit-btn--marca">' + K.icono('enviar', 15) + ' Responder como DEV</button></div></form>');
    t.querySelector('.tu-cm__cuerpo').appendChild(f);
    var ta = f.querySelector('textarea');
    ta.value = 'Hola, ' + String(nombre(x)).split(' ')[0] + ': ';
    ta.focus();
    f.querySelector('button[type=button]').addEventListener('click', function () { f.remove(); boton.focus(); });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var texto = ta.value.trim();
      if (texto.length < 3) { K.aviso('Escribe la respuesta.', 'aviso', 3000); return; }
      if (K.ocupado) return;
      K.ocupado = true;
      var bs = f.querySelector('button[type=submit]'); bs.disabled = true; ta.disabled = true;
      K.pedir('tutorialResponderDev', { comentarioId: x.id, texto: texto }, { ms: 60000 }).then(function (r) {
        K.ocupado = false;
        recibirCm(r);
        K.aviso('Respuesta publicada ✓', 'ok', 2500);
        repintar();
      }, function (e) { K.ocupado = false; bs.disabled = false; ta.disabled = false; K.aviso((e && e.message) || 'No se pudo responder.', 'malo', 7000); });
    });
  }

  function borrarCm(x) {
    var cuerpo = K.nodo('<div><p class="formulario__nota"></p><label class="op-campo"><span>Motivo (opcional, queda en la bitácora)</span><input class="ad-in" maxlength="300" autocomplete="off"></label></div>');
    cuerpo.querySelector('p').textContent = '«' + String(x.texto).slice(0, 160) + '» de ' + nombre(x) + ' se quita para todos' +
      ((x.respuestas || []).length ? ', con sus ' + plural(x.respuestas.length, 'respuesta', 'respuestas') : '') + '. No se puede deshacer.';
    var m = O.modal({
      titulo: 'Eliminar el comentario', cuerpo: cuerpo,
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } },
                { texto: 'Eliminar', icono: 'basura', marca: true, al: function () {
                  if (K.ocupado) return;
                  K.ocupado = true;
                  var motivo = cuerpo.querySelector('input').value.trim();
                  m.cerrar();
                  K.pedir('tutorialComentarioEliminar', { comentarioId: x.id, motivo: motivo }, { ms: 60000 }).then(function (r) {
                    K.ocupado = false;
                    recibirCm(r);
                    K.aviso('Comentario eliminado', 'ok', 2500);
                    repintar();
                  }, function (e) { K.ocupado = false; K.aviso((e && e.message) || 'No se pudo eliminar.', 'malo', 7000); });
                } }]
    });
  }

  window.TUTORIALES = {
    configurar: function (c) { C = c || {}; },
    vista: vista,
    cargar: cargar,
    olvidar: function () { D = null; CM = null; PEST = 'tutoriales'; F = { estado: '', busca: '', com: 'SIN' }; K.guardar.borrar(FILTRO_K); },
    _datos: function () { return D; }
  };
}());
