/* ============================================================
   ADMIN-FLANDES · USUARIOS Y ROLES
   Ecosistema Flandes · Fase 10 · entrega 10.1

   Las personas que entran a las apps de funcionarios (Contratación,
   Supervisión, Contabilidad, Tesorería, Comunicaciones) y a ADMIN. Una
   tarjeta por fila de la hoja USUARIOS: la misma persona puede tener
   usuario en varias apps, cada uno con su rol.

   Nada se pide al abrir: la lista vino con el arranque. Cada botón es
   UNA llamada y devuelve la tarjeta nueva (y la fila de la bitácora):
     · Nuevo usuario / Editar ('usuarioGuardar'): app, rol, documento,
       nombre, celular y correo. La contraseña inicial es el DOCUMENTO si
       no se escribe otra. Si esa persona ya tuvo usuario en esa app
       (INACTIVO), se reactiva la misma fila en vez de crear otra.
     · REVISOR de Supervisión: a qué supervisor o secretaría revisa y si
       puede aprobar y devolver. REVISOR de Contratación: si decide.
     · Estado ('usuarioEstadoCambiar'): ACTIVO, SUSPENDIDO o INACTIVO.
     · Contraseña ('usuarioClaveReiniciar'): vuelve al documento (u otra)
       y quita el bloqueo; puede mandar la bienvenida de una vez.
     · Desbloquear ('usuarioDesbloquear'): tras 5 intentos fallidos.
     · Bienvenida ('bienvenida'): el enlace de su app, su usuario y su
       contraseña por WhatsApp (o correo si no tiene celular); si no tiene
       ninguno, se comparte desde este teléfono.

   Filtros: #/usuarios/<APP> o los atajos del inicio
   (#/usuarios/BLOQUEADOS, SIN_CELULAR, SIN_CORREO, CLAVE_DOC).
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var C = {};
  var F = { app: '', estado: 'ACTIVO', buscar: '', marca: '' };

  var APP_T = { CONTRATACION: 'Contratación', SUPERVISION: 'Supervisión', CONTABILIDAD: 'Contabilidad', TESORERIA: 'Tesorería', COMUNICACIONES: 'Comunicaciones', ADMIN: 'Admin' };
  var ROL_T = {
    CREADOR: 'Crea y edita contratos', REVISOR: 'Revisa cuentas', SUPERVISOR: 'Supervisa sus contratos',
    CONTABLE: 'Hace órdenes de pago', OFICINA: 'Oficina de Contabilidad', EGRESO: 'Hace egresos', PAGO: 'Registra pagos',
    INVITADO: 'Solo consulta', ADMIN: 'Administra el área', COMUNICADOR: 'Atiende solicitudes', DEV: 'Desarrollador'
  };
  var MARCAS = {
    BLOQUEADOS: ['Bloqueados ahora', function (u) { return u.bloqueado; }],
    SIN_CELULAR: ['Activos sin celular', function (u) { return u.estado === 'ACTIVO' && !u.telefono; }],
    SIN_CORREO: ['Activos sin correo', function (u) { return u.estado === 'ACTIVO' && !u.correo; }],
    CLAVE_DOC: ['Contraseña = documento', function (u) { return u.estado === 'ACTIVO' && u.claveEsDocumento; }]
  };

  function O() { return window.OFICINA; }
  function D() { return C.datos ? C.datos() : {}; }
  function lista() { return D().usuarios || []; }
  function apps() { return D().apps || ['CONTRATACION', 'SUPERVISION', 'CONTABILIDAD', 'TESORERIA', 'COMUNICACIONES', 'ADMIN']; }
  function rolesDe(app) { var r = (D().roles || {})[app] || []; return r.slice(); }

  function filtradas() {
    var q = K.norm(F.buscar);
    return lista().filter(function (u) {
      if (F.app && u.app !== F.app) return false;
      if (F.marca && MARCAS[F.marca]) return MARCAS[F.marca][1](u);
      if (F.estado && u.estado !== F.estado) return false;
      if (q && K.norm(u.nombre + ' ' + u.documento + ' ' + u.app + ' ' + u.rol + ' ' + u.telefono + ' ' + u.correo).indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) {
      return (a.app + a.nombre).localeCompare(b.app + b.nombre, 'es');
    });
  }

  /* ══════════════ la vista ══════════════ */

  function vista(sub) {
    sub = String(sub || '').toUpperCase();
    if (MARCAS[sub]) { F.marca = sub; F.app = ''; }
    else if (APP_T[sub]) { F.app = sub; F.marca = ''; }
    var caja = K.nodo('<div class="kit-ancho vista ct ad"></div>');
    C.app.appendChild(caja);
    O().cabecera(caja, 'persona', 'USUARIOS Y ROLES',
      'Quién entra a cada app y con qué rol. La contraseña inicial es el <b>documento</b> (salvo que escribas otra) y cada cambio queda en la bitácora.');

    var top = K.nodo('<div class="ad-top"></div>');
    var nuevo = K.nodo('<button type="button" class="kit-btn kit-btn--marca">' + K.icono('mas', 16) + ' Nuevo usuario</button>');
    nuevo.addEventListener('click', function () { editar(null); });
    top.appendChild(nuevo);
    caja.appendChild(top);

    var b = O().barra({ placeholder: 'Buscar por nombre, documento, celular o correo', valor: F.buscar,
      alBuscar: function (t) { F.buscar = t; pintar(); },
      alRefrescar: function () { return C.recargar().then(function () { pastillas(); pintar(); }); } });
    caja.appendChild(b.caja);
    var zA = K.nodo('<div class="ad-pastillas"></div>'), zE = K.nodo('<div class="ad-pastillas"></div>'), zM = K.nodo('<div class="ad-marca-f"></div>');
    caja.appendChild(zA); caja.appendChild(zE); caja.appendChild(zM);
    var zona = K.nodo('<div class="kit-rejilla kit-rejilla--auto ct-lista ad-usuarios"></div>');
    caja.appendChild(zona);
    K.piezas.creditos.montar(caja);

    var pA, pE;
    function pastillas() {
      zA.innerHTML = ''; zE.innerHTML = '';
      pA = K.piezas.pastillas.montar(zA, {
        opciones: [{ valor: '', texto: 'Todas las apps' }].concat(apps().map(function (a) { return { valor: a, texto: APP_T[a] || a }; })),
        valor: F.app, alCambiar: function (v) { F.app = v; pintar(); }
      });
      pE = K.piezas.pastillas.montar(zE, {
        opciones: [{ valor: 'ACTIVO', texto: 'Activos', tono: 'ok' }, { valor: 'SUSPENDIDO', texto: 'Suspendidos', tono: 'aviso' }, { valor: 'INACTIVO', texto: 'Inactivos', tono: 'malo' }, { valor: '', texto: 'Todos' }],
        valor: F.estado, alCambiar: function (v) { F.estado = v; F.marca = ''; pintar(); }
      });
    }
    function conteos() {
      var mA = { '': 0 }, mE = { '': 0, ACTIVO: 0, SUSPENDIDO: 0, INACTIVO: 0 };
      lista().forEach(function (u) {
        if (!F.estado || u.estado === F.estado) { mA[''] = (mA[''] || 0) + 1; mA[u.app] = (mA[u.app] || 0) + 1; }
        if (!F.app || u.app === F.app) { mE['']++; mE[u.estado] = (mE[u.estado] || 0) + 1; }
      });
      pA.conteos(mA); pE.conteos(mE);
    }
    function pintar() {
      conteos();
      zM.innerHTML = '';
      if (F.marca && MARCAS[F.marca]) {
        var mm = K.nodo('<p class="ad-filtro">' + K.icono('info', 14) + ' <span></span> <button type="button" class="kit-btn kit-btn--plano ad-mini">' + K.icono('cerrar', 12) + ' Quitar</button></p>');
        mm.querySelector('span').textContent = 'Viendo: ' + MARCAS[F.marca][0];
        mm.querySelector('button').addEventListener('click', function () { F.marca = ''; history.replaceState(null, '', '#/usuarios'); pintar(); });
        zM.appendChild(mm);
      }
      zona.innerHTML = '';
      var l = filtradas();
      if (!l.length) { zona.appendChild(O().vacio('Ningún usuario con esos filtros.', function () { F = { app: '', estado: '', buscar: '', marca: '' }; b.inp.value = ''; pastillas(); pintar(); })); return; }
      l.forEach(function (u) { zona.appendChild(tarjeta(u, pintar)); });
    }
    pastillas();
    pintar();
    vista._repintar = pintar;
  }

  function tarjeta(u, repintar) {
    var t = K.nodo('<article class="kit-tarjeta ad-u ad-u--' + u.estado.toLowerCase() + '">' +
      '<div class="ad-u__cab"><span class="ad-u__cara"></span><div class="ad-u__id"><b></b><small></small></div><span class="ad-u__est"></span></div>' +
      '<div class="ad-u__rol"></div><ul class="ad-sup__datos ad-u__datos"></ul><div class="ct-acc"></div></article>');
    if (K.piezas.personas) t.querySelector('.ad-u__cara').appendChild(K.piezas.personas.avatar(u.nombre, { tam: 46, foto: u.imagen ? (K.miniDrive ? K.miniDrive(u.imagen, 120) : u.imagen) : '' }));
    t.querySelector('.ad-u__id b').textContent = O().nombre(u.nombre);
    t.querySelector('.ad-u__id small').textContent = 'C.C. ' + u.documento + (u.id ? ' · ' + u.id : '');
    var est = t.querySelector('.ad-u__est');
    est.className = 'ct-marca ad-u__est ad-est--' + u.estado.toLowerCase();
    est.textContent = u.estado;
    t.querySelector('.ad-u__rol').innerHTML = '<span class="ct-marca ad-app-m">' + K.esc(APP_T[u.app] || u.app) + '</span> <b>' + K.esc(u.rol) + '</b> <span class="ad-u__rt">' + K.esc(ROL_T[u.rol] || '') + '</span>';
    var ul = t.querySelector('ul');
    function li(ic, txt, clase) { var e = K.nodo('<li' + (clase ? ' class="' + clase + '"' : '') + '>' + K.icono(ic, 13) + '<span></span></li>'); e.querySelector('span').textContent = txt; ul.appendChild(e); }
    li('telefono', u.telefono || 'Sin celular: no recibe ni recupera la contraseña', u.telefono ? '' : 'ad-malo');
    li('sobre', u.correo || 'Sin correo', u.correo ? '' : 'ad-apagado');
    if (!u.tieneClave) li('llave', 'Sin contraseña', 'ad-malo');
    else if (u.claveEsDocumento) li('llave', 'Contraseña = su documento (no la ha cambiado)', 'ad-aviso');
    if (u.bloqueado) li('candado', 'BLOQUEADO: ' + u.intentos + ' intentos fallidos', 'ad-malo');
    else if (u.intentos) li('aviso', u.intentos + (u.intentos === 1 ? ' intento fallido' : ' intentos fallidos'), 'ad-aviso');
    if (u.rol === 'REVISOR' && (u.app === 'SUPERVISION' || u.app === 'CONTRATACION')) {
      if (u.app === 'SUPERVISION') li('persona', u.alcance ? (u.alcance.supervisor ? 'Revisa lo de ' + O().nombre(u.alcance.supervisor) : 'Revisa ' + O().titulo(u.alcance.secretaria)) : 'Sin supervisor ni secretaría asignada: no ve nada', u.alcance ? '' : 'ad-malo');
      li(u.decide ? 'check' : 'prohibido', u.decide ? 'Puede aprobar y devolver' : 'Solo visto bueno o inconsistencia (no aprueba ni devuelve)', '');
    }
    if (u.creado) li('reloj', 'Creado ' + u.creado + (u.creadoPor ? ' por ' + O().nombre(u.creadoPor) : ''), 'ad-apagado');

    var acc = t.querySelector('.ct-acc');
    function boton(ic, txt, al, clase) {
      var x = K.nodo('<button type="button" class="kit-btn kit-btn--plano ins-accion' + (clase ? ' ' + clase : '') + '">' + K.icono(ic, 14) + ' ' + K.esc(txt) + '</button>');
      x.addEventListener('click', al);
      acc.appendChild(x);
      return x;
    }
    boton('lapiz', 'Editar', function () { editar(u); });
    if (u.estado === 'ACTIVO') boton('whatsapp', 'Bienvenida', function () { bienvenida(u); });
    boton('llave', 'Contraseña', function () { clave(u); });
    if (u.intentos) boton('candado', 'Desbloquear', function () { desbloquear(u); });
    boton(u.estado === 'ACTIVO' ? 'prohibido' : 'check', u.estado === 'ACTIVO' ? 'Estado' : 'Activar', function () { estado(u); }, u.estado === 'ACTIVO' ? 'cf-quitar' : '');
    return t;
  }

  /* respuesta común de las escrituras */
  function alGuardar(r) {
    if (r.usuarios) C.usuarios(r.usuarios);
    else if (r.usuario) C.usuario(r.usuario);
    if (r.bitacora) C.bitacora(r.bitacora);
    if (vista._repintar) vista._repintar();
  }

  function pedir(accion, datos, textos) {
    return K.piezas.guardado.mientras(K.pedir(accion, datos, { ms: 60000 }), textos).then(function (r) { alGuardar(r); return r; });
  }

  /* ══════════════ nuevo / editar ══════════════ */

  function editar(u) {
    var nuevo = !u;
    u = u || { app: F.app || 'CONTRATACION', rol: '', documento: '', nombre: '', telefono: '', correo: '' };
    var f = K.nodo('<div class="formulario ad-form"></div>');
    function campo(et, html, ayuda) {
      var l = K.nodo('<label class="campo"><span>' + K.esc(et) + '</span>' + html + '</label>');
      if (ayuda) l.appendChild(K.nodo('<p class="campo__ayuda">' + ayuda + '</p>'));
      f.appendChild(l);
      return l.querySelector('input,select');
    }
    var sA = campo('App *', '<select class="op-select"></select>');
    apps().forEach(function (a) { var o = document.createElement('option'); o.value = a; o.textContent = APP_T[a] || a; if (a === u.app) o.selected = true; sA.appendChild(o); });
    sA.disabled = !nuevo;
    var sR = campo('Rol *', '<select class="op-select"></select>');
    var iD = campo('Documento *', '<input type="text" inputmode="numeric" maxlength="12">', nuevo ? 'Con el documento entra a la app.' : 'El documento y la app no se cambian: si están mal, desactiva este usuario y crea otro.');
    iD.value = u.documento; iD.disabled = !nuevo;
    var iN = campo('Nombre completo *', '<input type="text" maxlength="120">'); iN.value = u.nombre;
    var iT = campo('Celular', '<input type="tel" inputmode="numeric" maxlength="10" placeholder="3XXXXXXXXX">', 'Ahí le llegan la bienvenida y la recuperación de la contraseña.'); iT.value = u.telefono;
    var iC = campo('Correo', '<input type="email" maxlength="120">', 'Para los avisos por correo.'); iC.value = u.correo;
    var iK = null, chB = null;
    if (nuevo) {
      iK = campo('Contraseña inicial', '<input type="text" maxlength="40" placeholder="Si la dejas vacía, es el documento" autocomplete="off">', 'Se le recomienda cambiarla al entrar (menú de su foto → Actualizar contraseña).');
      var lb = K.nodo('<label class="op-check cf-sw"><input type="checkbox" checked><span>Enviarle la bienvenida al guardar (WhatsApp, o correo si no tiene celular)</span></label>');
      chB = lb.querySelector('input'); f.appendChild(lb);
    }
    var zRev = K.nodo('<div class="ad-rev"></div>');
    f.appendChild(zRev);
    var iMo = campo('Motivo (queda en la bitácora)', '<input type="text" maxlength="300" placeholder="Opcional">');
    [iD, iT].forEach(function (i) { i.addEventListener('input', function () { i.value = i.value.replace(/\D/g, ''); }); });
    var rev = { alcanceTipo: u.alcance ? (u.alcance.supervisor ? 'supervisor' : 'secretaria') : '', alcance: u.alcance ? (u.alcance.supervisor || u.alcance.secretaria) : '', decide: u.decide === true };

    function roles() {
      sR.innerHTML = '';
      rolesDe(sA.value).forEach(function (r) { var o = document.createElement('option'); o.value = r; o.textContent = r + (ROL_T[r] ? ' · ' + ROL_T[r] : ''); if (r === u.rol) o.selected = true; sR.appendChild(o); });
      if (C.esDev && C.esDev() && sA.value === 'ADMIN' && rolesDe('ADMIN').indexOf('DEV') < 0) { var o = document.createElement('option'); o.value = 'DEV'; o.textContent = 'DEV'; sR.appendChild(o); }
      revisor();
    }
    function revisor() {
      zRev.innerHTML = '';
      if (sR.value !== 'REVISOR' || (sA.value !== 'SUPERVISION' && sA.value !== 'CONTRATACION')) return;
      var g = K.nodo('<div class="kit-tarjeta ad-rev__caja"><p class="grupo__t">' + K.icono('persona', 14) + ' Usuario REVISOR</p></div>');
      if (sA.value === 'SUPERVISION') {
        var sup = (D().supervisores || { lista: [] }).lista.map(function (x) { return x.nombre; });
        var secs = D().secretarias || [];
        var sT = K.nodo('<select class="op-select"><option value="">— Sin asignar (no ve nada) —</option><option value="supervisor">Lo de un supervisor</option><option value="secretaria">Lo de una secretaría</option></select>');
        sT.value = rev.alcanceTipo;
        var sV = K.nodo('<select class="op-select"></select>');
        function opciones() {
          sV.innerHTML = '';
          var l = rev.alcanceTipo === 'supervisor' ? sup : (rev.alcanceTipo === 'secretaria' ? secs : []);
          sV.hidden = !l.length;
          l.forEach(function (n) { var o = document.createElement('option'); o.value = n; o.textContent = O().nombre(n); if (K.norm(n) === K.norm(rev.alcance)) o.selected = true; sV.appendChild(o); });
          if (l.length && !l.some(function (n) { return K.norm(n) === K.norm(rev.alcance); })) rev.alcance = l[0];
        }
        sT.addEventListener('change', function () { rev.alcanceTipo = sT.value; rev.alcance = ''; opciones(); });
        sV.addEventListener('change', function () { rev.alcance = sV.value; });
        var l1 = K.nodo('<label class="campo"><span>¿Qué revisa?</span></label>'); l1.appendChild(sT); l1.appendChild(sV);
        g.appendChild(l1);
        opciones();
      }
      var lb = K.nodo('<label class="op-check cf-sw"><input type="checkbox"><span>Puede aprobar y devolver cuentas</span></label>');
      lb.querySelector('input').checked = rev.decide;
      lb.querySelector('input').addEventListener('change', function (e) { rev.decide = e.target.checked; });
      g.appendChild(lb);
      g.appendChild(K.nodo('<p class="formulario__nota">' + (sA.value === 'SUPERVISION'
        ? 'Si no aprueba ni devuelve, solo guarda la cuenta como VISTO BUENO o CON INCONSISTENCIA. Lo que se aprueba o devuelve sale siempre a nombre del supervisor.'
        : 'En Contratación, mientras nadie tenga la marca, todos los REVISOR deciden. Al quitársela a uno, los demás la conservan.') + '</p>'));
      zRev.appendChild(g);
    }
    sA.addEventListener('change', function () { u.rol = ''; roles(); });
    sR.addEventListener('change', revisor);
    roles();

    var m = O().modal({ titulo: nuevo ? 'Nuevo usuario' : 'Editar a ' + O().nombre(u.nombre), cuerpo: f,
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } }, { texto: nuevo ? 'Crear' : 'Guardar', icono: 'check', marca: true, al: guardar }] });

    function guardar() {
      var d = { nuevo: nuevo, appDestino: sA.value, rol: sR.value, documento: iD.value.trim(), nombre: iN.value.trim(), telefono: iT.value.trim(), correo: iC.value.trim(), motivo: iMo.value.trim() };
      if (!d.documento || !d.nombre || !d.rol) { K.aviso('Faltan el documento, el nombre o el rol.', 'aviso', 4000); return; }
      if (d.documento.length < 5) { K.aviso('El documento es muy corto.', 'aviso', 3500); return; }
      if (d.telefono && !/^3\d{9}$/.test(d.telefono)) { K.aviso('El celular debe tener 10 dígitos y empezar por 3.', 'aviso', 4000); return; }
      if (d.correo && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(d.correo)) { K.aviso('El correo no es válido.', 'aviso', 3500); return; }
      if (nuevo) { d.clave = iK.value.trim(); d.bienvenida = chB.checked; }
      if (d.rol === 'REVISOR' && (d.appDestino === 'SUPERVISION' || d.appDestino === 'CONTRATACION')) {
        d.decide = rev.decide;
        if (d.appDestino === 'SUPERVISION') d.alcance = rev.alcanceTipo && rev.alcance ? (rev.alcanceTipo === 'supervisor' ? { supervisor: rev.alcance } : { secretaria: rev.alcance }) : null;
      }
      m.botones[1].disabled = true;
      pedir('usuarioGuardar', d, {
        titulo: nuevo ? 'Creando el usuario' : 'Guardando el usuario', sub: d.nombre.toUpperCase() + ' · ' + (APP_T[d.appDestino] || d.appDestino),
        pasos: nuevo ? ['Comprobando que no exista…', 'Guardando en USUARIOS…', d.bienvenida ? 'Mandando la bienvenida…' : 'Apuntando en la bitácora…'] : ['Guardando en USUARIOS…', 'Apuntando en la bitácora…'],
        listo: { titulo: nuevo ? 'Usuario creado' : 'Usuario al día', paso: 'Queda en la bitácora' }
      }).then(function (r) {
        m.cerrar();
        if (r.aviso) K.aviso(r.aviso, 'aviso', 9000);
        if (r.bienvenida) resultadoBienvenida(r.bienvenida, r.usuario);
      }, function (e) { m.botones[1].disabled = false; K.aviso((e && e.message) || 'No se pudo guardar.', 'malo', 8000); });
    }
  }

  /* ══════════════ acciones de la tarjeta ══════════════ */

  function bienvenida(u) {
    var canal = u.telefono ? 'por WhatsApp al ' + u.telefono : (u.correo ? 'por correo a ' + u.correo : 'desde este teléfono (no tiene celular ni correo)');
    K.piezas.confirmar.preguntar({ titulo: 'Bienvenida a ' + O().nombre(u.nombre),
      texto: 'Se le manda ' + canal + ' el enlace de ' + (APP_T[u.app] || u.app) + ', su usuario (el documento) y su contraseña, con la recomendación de cambiarla.', si: 'Mandar' })
      .then(function (si) {
        if (!si) return;
        pedir('bienvenida', { documento: u.documento, appDestino: u.app }, {
          titulo: 'Mandando la bienvenida', sub: O().nombre(u.nombre), pasos: ['Armando el mensaje…', 'Enviando…'], listo: { titulo: 'Listo', paso: 'Queda en la bitácora' }
        }).then(function (r) { resultadoBienvenida(r.envio, u); }, function (e) { K.aviso((e && e.message) || 'No se pudo mandar.', 'malo', 8000); });
      });
  }

  /** Si no salió (sin celular ni correo, o el bot falló), se ofrece compartir el texto desde el teléfono. */
  function resultadoBienvenida(envio, u) {
    if (!envio) return;
    if (envio.ok) { K.aviso('Bienvenida enviada por ' + (envio.canal === 'CORREO' ? 'correo' : 'WhatsApp') + '.', 'ok', 4000); return; }
    var f = K.nodo('<div class="formulario ad-form"><p class="formulario__nota formulario__nota--fuerte"></p><pre class="ad-json ad-json--solo"></pre></div>');
    f.querySelector('p').textContent = 'No salió: ' + (envio.error || 'sin canal') + '. Puedes compartirla desde aquí:';
    f.querySelector('pre').textContent = envio.texto || '';
    var bots = [{ texto: 'Copiar', icono: 'copiar', al: function () { if (navigator.clipboard) navigator.clipboard.writeText(envio.texto).then(function () { K.aviso('Copiado.', 'ok', 1800); }); } }];
    if (navigator.share) bots.push({ texto: 'Compartir', icono: 'enviar', marca: true, al: function () { navigator.share({ title: 'Bienvenida', text: envio.texto })['catch'](function () {}); } });
    else if (u && u.telefono) bots.push({ texto: 'Abrir WhatsApp', icono: 'whatsapp', marca: true, al: function () { window.open('https://wa.me/57' + u.telefono + '?text=' + encodeURIComponent(envio.texto), '_blank', 'noopener'); } });
    var m = O().modal({ titulo: 'Bienvenida sin enviar', cuerpo: f, botones: bots.concat([{ texto: 'Cerrar', al: function () { m.cerrar(); } }]) });
  }

  function clave(u) {
    var f = K.nodo('<div class="formulario ad-form">' +
      '<label class="campo"><span>Contraseña nueva</span><input type="text" maxlength="40" autocomplete="off" placeholder="Vacía = su documento (' + K.esc(u.documento) + ')"></label>' +
      '<label class="op-check cf-sw"><input type="checkbox"' + (u.telefono || u.correo ? ' checked' : '') + '><span>Mandarle la bienvenida con la contraseña nueva</span></label>' +
      '<label class="campo"><span>Motivo (queda en la bitácora)</span><input type="text" maxlength="300" placeholder="Opcional"></label>' +
      '<p class="formulario__nota">También quita el bloqueo por intentos fallidos. La contraseña no se escribe en la bitácora.</p></div>');
    var ins = f.querySelectorAll('input');
    var m = O().modal({ titulo: 'Contraseña de ' + O().nombre(u.nombre), cuerpo: f,
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } }, { texto: 'Reiniciar', icono: 'llave', marca: true, al: function () {
        var c = ins[0].value.trim();
        if (c && c.length < 5) { K.aviso('Mínimo 5 caracteres.', 'aviso', 3000); return; }
        m.botones[1].disabled = true;
        pedir('usuarioClaveReiniciar', { documento: u.documento, appDestino: u.app, clave: c, enviar: ins[1].checked, motivo: ins[2].value.trim() }, {
          titulo: 'Reiniciando la contraseña', sub: O().nombre(u.nombre), pasos: ['Cifrando…', 'Quitando el bloqueo…', ins[1].checked ? 'Mandando la bienvenida…' : 'Apuntando en la bitácora…'],
          listo: { titulo: 'Contraseña reiniciada', paso: c ? 'Con la que escribiste' : 'Es su documento' }
        }).then(function (r) { m.cerrar(); if (r.bienvenida) resultadoBienvenida(r.bienvenida, r.usuario); }, function (e) { m.botones[1].disabled = false; K.aviso((e && e.message) || 'No se pudo.', 'malo', 7000); });
      } }] });
  }

  function desbloquear(u) {
    pedir('usuarioDesbloquear', { documento: u.documento, appDestino: u.app }, {
      titulo: 'Desbloqueando', sub: O().nombre(u.nombre), pasos: ['Borrando los intentos fallidos…'], listo: { titulo: 'Desbloqueado', paso: 'Ya puede entrar' }
    })['catch'](function (e) { K.aviso((e && e.message) || 'No se pudo.', 'malo', 7000); });
  }

  function estado(u) {
    var f = K.nodo('<div class="formulario ad-form"><div class="cf-chips ad-estados"></div>' +
      '<label class="campo"><span>Motivo (queda en la bitácora)</span><input type="text" maxlength="300" placeholder="Opcional"></label>' +
      '<p class="formulario__nota"><b>Suspendido</b>: no entra por un tiempo (vacaciones, licencia). <b>Inactivo</b>: ya no trabaja en esa app. Ninguno borra nada.</p></div>');
    var elegido = u.estado;
    var z = f.querySelector('.ad-estados');
    ['ACTIVO', 'SUSPENDIDO', 'INACTIVO'].forEach(function (e) {
      var b = K.nodo('<button type="button" class="kit-pastilla" aria-pressed="' + (e === elegido) + '"></button>');
      b.textContent = e;
      b.addEventListener('click', function () { elegido = e; z.querySelectorAll('.kit-pastilla').forEach(function (x) { x.setAttribute('aria-pressed', x.textContent === e); }); });
      z.appendChild(b);
    });
    var m = O().modal({ titulo: 'Estado de ' + O().nombre(u.nombre) + ' en ' + (APP_T[u.app] || u.app), cuerpo: f,
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } }, { texto: 'Guardar', icono: 'check', marca: true, al: function () {
        if (elegido === u.estado) { m.cerrar(); return; }
        m.botones[1].disabled = true;
        pedir('usuarioEstadoCambiar', { documento: u.documento, appDestino: u.app, estado: elegido, motivo: f.querySelector('input').value.trim() }, {
          titulo: 'Cambiando el estado', sub: O().nombre(u.nombre) + ' → ' + elegido, pasos: ['Guardando en USUARIOS…'], listo: { titulo: 'Estado al día', paso: elegido }
        }).then(function () { m.cerrar(); }, function (e) { m.botones[1].disabled = false; K.aviso((e && e.message) || 'No se pudo.', 'malo', 7000); });
      } }] });
  }

  window.USUARIOS = {
    configurar: function (c) { C = c || {}; },
    vista: vista,
    olvidar: function () { F = { app: '', estado: 'ACTIVO', buscar: '', marca: '' }; },
    _filtradas: filtradas, _filtro: function () { return F; }, _appT: APP_T, _marcas: MARCAS
  };
}());
