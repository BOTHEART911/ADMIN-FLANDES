/* ============================================================
   ADMIN-FLANDES · CONFIGURACIÓN → PLAN DE PAGOS (26/10/2026)

   La lista que usa el contratista en UNIFICAR Y DESCARGAR (Estado de
   cuenta → Mi cuenta Drive): qué documentos van en el PDF del Plan de
   pagos del SECOP II, cómo se reconoce cada uno en la carpeta de la cuenta
   y en qué orden.

   Cada documento:
     · Nombre en la lista ..... lo que ve el contratista.
     · El archivo en Drive .... cómo EMPIEZA su nombre (sin importar
                                 tildes, mayúsculas ni signos). "*" = todos
                                 los archivos de esa carpeta (los anexos).
     · Carpeta ................ raíz de la cuenta, NOVEDADES, BANCO Y
                                 PLANILLA, ANEXOS… (la que crea el sistema).
     · Siempre va / Si aplica .. la pastilla verde o dorada, como en la guía.
     · Va en el PDF ............ apagado = ese archivo no se ofrece nunca
                                 (así está el informe de supervisión).

   Una lectura al abrir la sección (planPagosLista) y una escritura al
   guardar (planPagosGuardar, con la versión para no pisar a otra persona).
   El CORE valida y deja el cambio en la BITÁCORA.
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var CARPETAS = [
    { v: '', t: 'Raíz de la cuenta (los formatos)' },
    { v: 'NOVEDADES', t: 'NOVEDADES' },
    { v: 'BANCO Y PLANILLA', t: 'BANCO Y PLANILLA' },
    { v: 'ANEXOS', t: 'ANEXOS' },
    { v: 'EVIDENCIAS', t: 'EVIDENCIAS' },
    { v: 'ORDEN -EGRESO', t: 'ORDEN -EGRESO' }
  ];

  var E = { lista: null, version: '', fabrica: true, quien: '', fecha: '', original: '', cargando: null };

  function O() { return window.OFICINA; }
  function copia(x) { return JSON.parse(JSON.stringify(x)); }
  function sucio() { return E.lista && JSON.stringify(E.lista) !== E.original; }

  function traer(forzar) {
    if (E.cargando && !forzar) return E.cargando;
    E.cargando = K.pedir('planPagosLista', {}, { ms: 45000 }).then(function (r) {
      E.lista = copia(r.lista || []); E.version = r.version || ''; E.fabrica = !!r.fabrica;
      E.quien = r.quien || ''; E.fecha = r.fecha || ''; E.original = JSON.stringify(E.lista);
      return E;
    }, function (e) { E.cargando = null; throw e; });
    return E.cargando;
  }

  /** La sección, lista para meter en la zona de CONFIGURACIÓN. */
  function bloque() {
    var s = K.nodo('<section class="kit-tarjeta grupo cf-bloque ad-bloque pa"><h3 class="grupo__t">' + K.icono('pdf', 16) +
      ' DOCUMENTOS DEL PLAN DE PAGOS</h3>' +
      '<p class="formulario__nota">Lo que arma el contratista en <b>UNIFICAR Y DESCARGAR</b> (Estado de cuenta → Mi cuenta Drive), en este orden. ' +
      'Cada documento se reconoce por cómo <b>empieza el nombre</b> del archivo y la <b>carpeta</b> de la cuenta donde queda. ' +
      'Lo que esté en la carpeta y no esté aquí le sale al final, sin marcar, como «No está en la guía».</p>' +
      '<p class="pa-quien formulario__nota"></p>' +
      '<div class="pa-zona"></div></section>');
    var zona = s.querySelector('.pa-zona');
    if (E.lista) pintar(s, zona);
    else {
      var quitar = K.piezas.esqueletos ? K.piezas.esqueletos.poner(zona, { forma: 'filas', cuantos: 8 }) : function () {};
      traer().then(function () { quitar(); pintar(s, zona); }, function (e) {
        quitar();
        if (e && e.codigo === 'CANCELADA') return;
        zona.innerHTML = '';
        var p = K.nodo('<p class="ad-estado ad-malo">' + K.icono('aviso', 14) + ' <span></span></p>');
        p.querySelector('span').textContent = (e && e.message) || 'No se pudo traer la lista.';
        zona.appendChild(p);
        var r = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('recargar', 14) + ' Reintentar</button>');
        r.addEventListener('click', function () { zona.innerHTML = ''; zona.parentNode.replaceChild(bloque(), s); });
        zona.appendChild(r);
      });
    }
    return s;
  }

  function quienTxt() {
    if (E.fabrica) return K.icono('info', 13) + ' Rige la lista de fábrica (la de la guía del 26/10/2026).';
    return K.icono('check', 13) + ' Última edición: ' + K.esc(E.quien || '—') + (E.fecha ? ' · ' + K.esc(E.fecha) : '') + '.';
  }

  function pintar(s, zona) {
    s.querySelector('.pa-quien').innerHTML = quienTxt();
    zona.innerHTML = '';
    var acc = K.nodo('<div class="pa-acc"></div>');
    var nuevo = K.nodo('<button type="button" class="kit-btn kit-btn--marca">' + K.icono('mas', 16) + ' Agregar documento</button>');
    nuevo.addEventListener('click', function () { editar(-1, function () { pintar(s, zona); }); });
    acc.appendChild(nuevo);
    var fab = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('recargar', 15) + ' Volver a la de fábrica</button>');
    fab.addEventListener('click', function () { aFabrica(s, zona); });
    if (!E.fabrica) acc.appendChild(fab);
    zona.appendChild(acc);

    var ol = K.nodo('<ol class="pa-lista"></ol>');
    var n = 0;
    E.lista.forEach(function (x, i) {
      if (x.va !== false) n++;
      ol.appendChild(fila(x, i, x.va !== false ? n : 0, function () { pintar(s, zona); }));
    });
    zona.appendChild(ol);

    if (sucio()) {
      var barra = K.nodo('<div class="pa-guardar"><p><b>Tienes cambios sin guardar.</b> El contratista sigue viendo la lista de antes hasta que guardes.</p>' +
        '<label class="campo"><span>Motivo (queda en la bitácora)</span><input type="text" maxlength="300" placeholder="Opcional"></label>' +
        '<div class="pa-guardar__b"></div></div>');
      var des = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('cerrar', 15) + ' Descartar</button>');
      des.addEventListener('click', function () { E.lista = JSON.parse(E.original); pintar(s, zona); });
      var gua = K.nodo('<button type="button" class="kit-btn kit-btn--marca">' + K.icono('check', 16) + ' Guardar la lista</button>');
      gua.addEventListener('click', K.piezas.antidoble.una(function () {
        return guardar({ lista: E.lista, version: E.version, motivo: barra.querySelector('input').value.trim() }, 'Guardando la lista', s, zona);
      }));
      barra.querySelector('.pa-guardar__b').appendChild(des);
      barra.querySelector('.pa-guardar__b').appendChild(gua);
      zona.appendChild(barra);
    }
  }

  function fila(x, i, n, repintar) {
    var badge = x.va === false
      ? '<span class="pa-badge pa-badge--no">No va</span>'
      : (x.aplica ? '<span class="pa-badge pa-badge--aplica">' + K.esc(x.nota || 'Si aplica') + '</span>' : '<span class="pa-badge pa-badge--siempre">Siempre va</span>');
    var archivo = String(x.archivo).trim() === '*' ? 'Todos los archivos' : 'Empieza por «' + K.esc(x.archivo) + '»';
    var li = K.nodo(
      '<li class="pa-item' + (x.va === false ? ' pa-item--no' : '') + '">' +
      '  <span class="pa-n">' + (n || '—') + '</span>' +
      '  <div class="pa-txt"><b>' + K.esc(x.t) + '</b>' +
      '    <small>' + archivo + ' · ' + K.esc(x.carpeta || 'Raíz de la cuenta') + '</small></div>' +
      '  <div class="pa-der">' + badge +
      '    <span class="pa-botones">' +
      '      <button type="button" class="pa-b pa-sube" title="Subir"' + (i === 0 ? ' disabled' : '') + ' aria-label="Subir ' + K.esc(x.t) + '">' + K.icono('arriba', 15) + '</button>' +
      '      <button type="button" class="pa-b pa-baja" title="Bajar"' + (i === E.lista.length - 1 ? ' disabled' : '') + ' aria-label="Bajar ' + K.esc(x.t) + '">' + K.icono('abajo', 15) + '</button>' +
      '      <button type="button" class="pa-b pa-edit" title="Editar" aria-label="Editar ' + K.esc(x.t) + '">' + K.icono('lapiz', 15) + '</button>' +
      '      <button type="button" class="pa-b pa-quitar" title="Quitar de la lista" aria-label="Quitar ' + K.esc(x.t) + '">' + K.icono('basura', 15) + '</button>' +
      '    </span></div>' +
      '</li>');
    li.querySelector('.pa-sube').addEventListener('click', function () { mover(i, -1); repintar(); });
    li.querySelector('.pa-baja').addEventListener('click', function () { mover(i, 1); repintar(); });
    li.querySelector('.pa-edit').addEventListener('click', function () { editar(i, repintar); });
    li.querySelector('.pa-quitar').addEventListener('click', function () {
      K.piezas.confirmar.preguntar({ titulo: 'Quitar «' + x.t + '»', texto: 'Ese archivo ya no se reconoce como documento de la guía: si está en la carpeta, le sale al contratista al final, sin marcar. Si lo que quieres es que no salga nunca, edítalo y apaga «Va en el PDF».', si: 'Quitar', peligro: true })
        .then(function (si) { if (si) { E.lista.splice(i, 1); repintar(); } });
    });
    return li;
  }

  function mover(i, paso) {
    var j = i + paso;
    if (j < 0 || j >= E.lista.length) return;
    var x = E.lista.splice(i, 1)[0];
    E.lista.splice(j, 0, x);
  }

  function editar(i, repintar) {
    var nuevo = i < 0;
    var x = nuevo ? { k: '', t: '', archivo: '', carpeta: '', aplica: true, nota: 'Si aplica', va: true } : copia(E.lista[i]);
    var f = K.nodo('<div class="formulario ad-form pa-form"></div>');
    function campo(et, html, ayuda) {
      var l = K.nodo('<label class="campo"><span>' + K.esc(et) + '</span>' + html + '</label>');
      if (ayuda) l.appendChild(K.nodo('<p class="campo__ayuda">' + ayuda + '</p>'));
      f.appendChild(l);
      return l.querySelector('input,select');
    }
    var iT = campo('Nombre en la lista *', '<input type="text" maxlength="80">', 'Lo que ve el contratista. Ejemplo: Certificación ARL.');
    var iA = campo('El archivo en Drive empieza por *', '<input type="text" maxlength="120">',
      'Tal como se llama el archivo en la carpeta de la cuenta, sin la extensión. No importan tildes ni mayúsculas. Escribe <b>*</b> para tomar <b>todos</b> los archivos de la carpeta (así van los anexos).');
    var sel = '<select>' + CARPETAS.map(function (c) { return '<option value="' + K.esc(c.v) + '">' + K.esc(c.t) + '</option>'; }).join('') +
      '<option value="__otra">Otra carpeta…</option></select>';
    var iC = campo('Carpeta de la cuenta', sel);
    var iO = campo('Nombre de la otra carpeta', '<input type="text" maxlength="80">');
    var lO = iO.parentNode;
    var cuando = K.nodo('<fieldset class="campo pa-cuando"><legend>¿Cuándo va?</legend>' +
      '<label><input type="radio" name="pa-cuando" value="no"> Siempre va <small>(pastilla verde)</small></label>' +
      '<label><input type="radio" name="pa-cuando" value="si"> Solo cuando aplica <small>(pastilla dorada)</small></label></fieldset>');
    f.appendChild(cuando);
    var iN = campo('Texto de la pastilla dorada', '<input type="text" maxlength="30">', 'Corto. Ejemplo: Pensionados, Régimen Simple, Si aplica.');
    var lN = iN.parentNode;
    var va = K.nodo('<label class="campo pa-va"><input type="checkbox"> <span><b>Va en el PDF.</b> Apagado, ese archivo no se le ofrece nunca al contratista (así está el informe de supervisión).</span></label>');
    f.appendChild(va);
    var iPos = null;
    if (nuevo) {
      iPos = campo('Va después de', '<select><option value="-1">Al principio</option>' +
        E.lista.map(function (y, k) { return '<option value="' + k + '">' + (k + 1) + '. ' + K.esc(y.t) + '</option>'; }).join('') + '</select>');
      iPos.value = String(E.lista.length - 1);
    }

    iT.value = x.t; iA.value = x.archivo;
    var conocida = CARPETAS.some(function (c) { return c.v === x.carpeta; });
    iC.value = conocida ? x.carpeta : '__otra';
    iO.value = conocida ? '' : x.carpeta;
    cuando.querySelector('input[value="' + (x.aplica ? 'si' : 'no') + '"]').checked = true;
    iN.value = x.nota || '';
    va.querySelector('input').checked = x.va !== false;
    function ver() {
      lO.style.display = iC.value === '__otra' ? '' : 'none';
      lN.style.display = cuando.querySelector('input[value="si"]').checked ? '' : 'none';
    }
    iC.addEventListener('change', ver);
    cuando.addEventListener('change', ver);
    ver();

    var m = O().modal({ titulo: nuevo ? 'Agregar documento al plan de pagos' : 'Editar «' + x.t + '»', cuerpo: f,
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } }, { texto: nuevo ? 'Agregar' : 'Listo', icono: 'check', marca: true, al: listo }] });
    setTimeout(function () { try { iT.focus(); } catch (e) {} }, 60);

    function listo() {
      var carpeta = iC.value === '__otra' ? iO.value.trim().toUpperCase() : iC.value;
      var y = {
        k: x.k || ('doc' + Date.now().toString(36)), t: iT.value.replace(/\s+/g, ' ').trim(),
        archivo: iA.value.replace(/\s+/g, ' ').trim().replace(/\.(pdf|docx?|xlsx?|jpe?g|png)$/i, ''),
        carpeta: carpeta, aplica: cuando.querySelector('input[value="si"]').checked,
        nota: cuando.querySelector('input[value="si"]').checked ? (iN.value.trim() || 'Si aplica') : '',
        va: va.querySelector('input').checked
      };
      if (!y.t) { K.aviso('Escribe el nombre en la lista.', 'aviso', 3500); return; }
      if (!y.archivo) { K.aviso('Escribe cómo empieza el nombre del archivo (o * para todos).', 'aviso', 4500); return; }
      if (y.archivo === '*' && !y.carpeta) { K.aviso('«Todos los archivos» solo se puede con una carpeta (no con la raíz).', 'aviso', 5000); return; }
      if (iC.value === '__otra' && !carpeta) { K.aviso('Escribe el nombre de la carpeta.', 'aviso', 3500); return; }
      if (nuevo) E.lista.splice(Number(iPos.value) + 1, 0, y);
      else E.lista[i] = y;
      m.cerrar();
      repintar();
    }
  }

  function aFabrica(s, zona) {
    K.piezas.confirmar.preguntar({ titulo: 'Volver a la lista de fábrica', texto: 'Se pierde lo que cambiaste: el orden y los documentos vuelven a los de la guía del plan de pagos.', si: 'Volver a la de fábrica', peligro: true })
      .then(function (si) { if (si) guardar({ fabrica: true, version: E.version }, 'Volviendo a la lista de fábrica', s, zona); });
  }

  function guardar(datos, titulo, s, zona) {
    var pr = K.pedir('planPagosGuardar', datos, { ms: 60000 });
    return (K.piezas.guardado ? K.piezas.guardado.mientras(pr, {
      titulo: titulo, sub: 'Vale para el contratista desde ya.',
      pasos: ['Revisando la lista…', 'Guardando en CONFIG…', 'Dejándolo en la bitácora…'], listo: { titulo: 'Lista al día', paso: 'Queda en la bitácora' }
    }) : pr).then(function (r) {
      E.lista = copia(r.lista || []); E.version = r.version || ''; E.fabrica = !!r.fabrica;
      E.quien = r.quien || ''; E.fecha = r.fecha || ''; E.original = JSON.stringify(E.lista);
      pintar(s, zona);
    }, function (e) {
      K.aviso((e && e.message) || 'No se pudo guardar.', 'malo', 8000);
      if (/otra persona/i.test(String(e && e.message))) {
        E.cargando = null;
        traer(true).then(function () { pintar(s, zona); });
      }
    });
  }

  window.PLANPAGOS_ADMIN = { bloque: bloque, sucio: sucio, _estado: function () { return E; } };
}());
