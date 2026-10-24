/* ADMIN-FLANDES · BASE SEMBRADA DEL ASISTENTE (24/10/2026)
   Respaldo embebido: la usa el asistente la primera vez y en la entrada.
   La de verdad vive en el CORE (hoja ASISTENTE_TEMAS) y se edita en ADMIN;
   cuando cambia, llega con el arranque y reemplaza esta en el teléfono.
   Generado desde la semilla: no se edita a mano. */
window.ASISTENTE_BASE = [
{
"id": "AD-INICIO",
"app": "ADMIN",
"vista": "",
"titulo": "Ir al inicio",
"frases": [
"ir al inicio",
"volver al inicio",
"pantalla principal",
"menu principal",
"regresar al menu"
],
"respuesta": "Te llevo a tu **inicio**: los accesos por bloques, **LO QUE PIDE ATENCIÓN** y las apps del ecosistema con su versión.",
"accion": "ir:inicio",
"estado": "",
"activo": true,
"orden": 1
},
{
"id": "AD-QUE-ME-TOCA",
"app": "ADMIN",
"vista": "inicio,soportes,usuarios,atrasos,configuracion",
"titulo": "¿Qué pide atención?",
"frases": [
"que pide atencion",
"que tengo pendiente",
"que me toca hacer",
"que hago primero",
"que es lo mas urgente",
"hay algo urgente",
"por donde empiezo",
"que esta mal en el ecosistema",
"alertas",
"que hay que revisar"
],
"respuesta": "{{queMeToca}}",
"accion": "",
"estado": "",
"activo": true,
"orden": 2
},
{
"id": "AD-RESUMEN",
"app": "ADMIN",
"vista": "inicio,tablero",
"titulo": "¿Cómo está el ecosistema?",
"frases": [
"como esta el ecosistema",
"resumen del ecosistema",
"como va todo",
"estado general",
"cifras del inicio",
"cuantos usuarios hay",
"usuarios activos",
"todo en orden"
],
"respuesta": "{{resumen}}",
"accion": "ir:tablero",
"estado": "",
"activo": true,
"orden": 3
},
{
"id": "AD-VERSIONES",
"app": "ADMIN",
"vista": "inicio,configuracion",
"titulo": "¿Qué versión tiene cada app?",
"frases": [
"que version tiene cada app",
"versiones de las apps",
"version publicada",
"que version esta publicada",
"ya se publico",
"version de contratista",
"esta actualizada la app"
],
"respuesta": "{{versiones}}",
"accion": "ir:cfgMantenimiento",
"estado": "",
"activo": true,
"orden": 4
},
{
"id": "AD-MANT-ESTADO",
"app": "ADMIN",
"vista": "inicio,configuracion",
"titulo": "¿Hay alguna app cerrada?",
"frases": [
"hay alguna app cerrada",
"esta activo el mantenimiento",
"modo mantenimiento",
"apps en mantenimiento",
"la app esta cerrada",
"por que no entran a la app"
],
"respuesta": "{{mantenimiento}}",
"accion": "ir:cfgMantenimiento",
"estado": "",
"activo": true,
"orden": 5
},
{
"id": "AD-MANT-COMO",
"app": "ADMIN",
"vista": "inicio,configuracion",
"titulo": "Cerrar una app por mantenimiento",
"frases": [
"como cierro una app",
"cerrar la app por mantenimiento",
"activar mantenimiento",
"poner en mantenimiento",
"quitar el mantenimiento",
"abrir la app otra vez",
"cerrar todas las apps"
],
"respuesta": "En **CONFIGURACIÓN › Mantenimiento** enciendes el modo, escoges **una app o todas** y escribes el mensaje que verán al abrir. Tú sigues entrando como **DEV**. Para abrirlas otra vez apagas el interruptor y guardas; queda en la bitácora.",
"accion": "ir:cfgMantenimiento",
"estado": "",
"activo": true,
"orden": 6
},
{
"id": "AD-SOPORTES",
"app": "ADMIN",
"vista": "inicio,soportes",
"titulo": "¿Qué soportes hay por atender?",
"frases": [
"que soportes hay por atender",
"soportes pendientes",
"cuantos soportes hay",
"que esta esperando respuesta",
"solicitudes de soporte",
"quien pidio ayuda",
"soportes abiertos",
"tengo soportes"
],
"respuesta": "{{soportes}}",
"accion": "ir:sopAbiertos",
"estado": "",
"activo": true,
"orden": 7
},
{
"id": "AD-SOP-REABIERTOS",
"app": "ADMIN",
"vista": "inicio,soportes",
"titulo": "¿Qué soportes se reabrieron?",
"frases": [
"que soportes se reabrieron",
"soportes reabiertos",
"me calificaron mal",
"calificacion mala",
"una estrella",
"por que se reabrio"
],
"respuesta": "{{reabiertos}}",
"accion": "ir:sopReabiertos",
"estado": "",
"activo": true,
"orden": 8
},
{
"id": "AD-SOP-RESPONDER",
"app": "ADMIN",
"vista": "soportes",
"titulo": "¿Cómo respondo un soporte?",
"frases": [
"como respondo un soporte",
"responder un soporte",
"contestar soporte",
"dejar resuelto un soporte",
"cerrar un soporte",
"atender una solicitud de soporte"
],
"respuesta": "Abre el soporte, escribe la **respuesta** y déjalo **en proceso** o **resuelto**. Al quedar resuelto a la persona le llega el aviso y, la próxima vez que abra su app, lo **califica con estrellas**; con 1 o 2 estrellas vuelve aquí como **reabierto**.",
"accion": "ir:sopAbiertos",
"estado": "",
"activo": true,
"orden": 9
},
{
"id": "AD-SOP-CARGAR",
"app": "ADMIN",
"vista": "soportes",
"titulo": "Cargar un soporte que atendí por fuera",
"frases": [
"cargar un soporte",
"registrar un soporte",
"atendi por telefono",
"me pidieron ayuda en persona",
"soporte a nombre de alguien",
"anotar un soporte"
],
"respuesta": "Con **Cargar un soporte** registras lo que atendiste por teléfono o en persona, **a nombre de quien lo pidió**: escoges la persona y la app, escribes qué pidió y qué hiciste. Cuenta igual en las cifras y en el PDF.",
"accion": "ir:sopNuevo",
"estado": "",
"activo": true,
"orden": 10
},
{
"id": "AD-SOP-DESCARGAR",
"app": "ADMIN",
"vista": "soportes",
"titulo": "Descargar los soportes",
"frases": [
"descargar los soportes",
"pdf de soportes",
"excel de soportes",
"informe de soportes",
"exportar soportes"
],
"respuesta": "En **SOPORTES** filtra por estado, app y fechas, y toca **PDF** (agrupa por app con la calificación de cada uno) o **Excel** (una fila por caso con el historial).",
"accion": "ir:soportes",
"estado": "",
"activo": true,
"orden": 11
},
{
"id": "AD-ATRASOS",
"app": "ADMIN",
"vista": "inicio,atrasos",
"titulo": "¿Quién tiene la cuenta atrasada?",
"frases": [
"quien tiene la cuenta atrasada",
"cuentas atrasadas",
"contratistas atrasados",
"quien no ha presentado la cuenta",
"cuantos estan atrasados",
"quien no ha reportado",
"cuentas vencidas"
],
"respuesta": "{{atrasados}}",
"accion": "ir:atrasos",
"estado": "",
"activo": true,
"orden": 12
},
{
"id": "AD-ATRASOS-PLAZO",
"app": "ADMIN",
"vista": "atrasos",
"titulo": "¿Cómo se cuenta el atraso?",
"frases": [
"como se cuenta el atraso",
"cuando queda atrasada una cuenta",
"plazo para presentar la cuenta",
"cuantos dias tienen para presentar",
"dias habiles de atraso",
"por que sale atrasado"
],
"respuesta": "El periodo de cada cuenta va mes a mes desde el inicio del contrato. Desde el día siguiente al fin del periodo se cuentan los **días hábiles** del plazo (sin sábados, domingos ni festivos); si al terminar la cuenta no está **reportada** al supervisor, queda atrasada. Una cuenta en borrador o ingresada sin reportar no cuenta como presentada.",
"accion": "ir:atrasos",
"estado": "",
"activo": true,
"orden": 13
},
{
"id": "AD-ATRASOS-AVISO",
"app": "ADMIN",
"vista": "atrasos",
"titulo": "Avisarle a los atrasados",
"frases": [
"avisar a los atrasados",
"mandar recordatorio a los atrasados",
"push a los atrasados",
"compartir la lista de atrasados",
"recordarles la cuenta"
],
"respuesta": "En **CUENTAS ATRASADAS** puedes mandar el **aviso push** a los atrasados y **compartir** la lista (por supervisor si filtras). El aviso nunca sale solo: lo mandas tú desde ahí.",
"accion": "ir:atrasos",
"estado": "",
"activo": true,
"orden": 14
},
{
"id": "AD-AGENDA",
"app": "ADMIN",
"vista": "inicio,agenda",
"titulo": "Agenda de revisión",
"frases": [
"agenda de revision",
"que dias llegan las cuentas",
"cuanto trabajo llega",
"cuando llegan las cuentas",
"carga de revision por supervisor"
],
"respuesta": "La **AGENDA DE REVISIÓN** muestra qué días llegan las cuentas y de quiénes, por supervisión y secretaría, para repartir el trabajo antes de que llegue.",
"accion": "ir:agenda",
"estado": "",
"activo": true,
"orden": 15
},
{
"id": "AD-BLOQUEADOS",
"app": "ADMIN",
"vista": "inicio,usuarios",
"titulo": "¿Quién está bloqueado?",
"frases": [
"quien esta bloqueado",
"usuarios bloqueados",
"alguien bloqueado",
"no puede entrar",
"se bloqueo",
"bloqueado por intentos"
],
"respuesta": "{{bloqueados}}",
"accion": "ir:usBloqueados",
"estado": "",
"activo": true,
"orden": 16
},
{
"id": "AD-DESBLOQUEAR",
"app": "ADMIN",
"vista": "usuarios",
"titulo": "Desbloquear a alguien",
"frases": [
"como desbloqueo a alguien",
"desbloquear usuario",
"quitar el bloqueo",
"se le bloqueo la cuenta",
"intentos fallidos"
],
"respuesta": "En la tarjeta de la persona toca **Desbloquear** (sale solo si tiene intentos fallidos). Reiniciar la **Contraseña** también desbloquea.",
"accion": "ir:usBloqueados",
"estado": "",
"activo": true,
"orden": 17
},
{
"id": "AD-CLAVE-REINICIAR",
"app": "ADMIN",
"vista": "usuarios",
"titulo": "Reiniciar la contraseña de alguien",
"frases": [
"reiniciar la contrasena de alguien",
"olvido la contrasena",
"cambiarle la clave a un usuario",
"restablecer contrasena",
"no recuerda la clave",
"nueva contrasena para un usuario"
],
"respuesta": "En su tarjeta toca **Contraseña**: vacía queda su **documento**, o escribe otra (mínimo 5 caracteres). Puedes mandarle la **bienvenida** con la nueva en el mismo paso. También quita el bloqueo y la contraseña no se escribe en la bitácora.",
"accion": "ir:usuarios",
"estado": "",
"activo": true,
"orden": 18
},
{
"id": "AD-SIN-CELULAR",
"app": "ADMIN",
"vista": "inicio,usuarios",
"titulo": "¿Quién no tiene celular?",
"frases": [
"quien no tiene celular",
"usuarios sin celular",
"sin telefono",
"no tiene whatsapp",
"quien no recibe la bienvenida"
],
"respuesta": "{{sinCelular}}",
"accion": "ir:usSinCelular",
"estado": "",
"activo": true,
"orden": 19
},
{
"id": "AD-SIN-CORREO",
"app": "ADMIN",
"vista": "inicio,usuarios",
"titulo": "¿Quién no tiene correo?",
"frases": [
"quien no tiene correo",
"usuarios sin correo",
"sin email",
"no recibe correos"
],
"respuesta": "{{sinCorreo}}",
"accion": "ir:usSinCorreo",
"estado": "",
"activo": true,
"orden": 20
},
{
"id": "AD-CLAVE-DOC",
"app": "ADMIN",
"vista": "inicio,usuarios",
"titulo": "¿Quién sigue con la contraseña del documento?",
"frases": [
"quien sigue con la contrasena del documento",
"contrasena igual al documento",
"no han cambiado la clave",
"clave por defecto",
"contrasena insegura"
],
"respuesta": "{{claveDoc}}",
"accion": "ir:usClaveDoc",
"estado": "",
"activo": true,
"orden": 21
},
{
"id": "AD-CREAR-USUARIO",
"app": "ADMIN",
"vista": "usuarios,inicio",
"titulo": "Crear un usuario",
"frases": [
"crear un usuario",
"nuevo usuario",
"dar acceso a una app",
"agregar un funcionario",
"darle acceso a alguien",
"registrar un usuario",
"mandar la bienvenida"
],
"respuesta": "En **USUARIOS Y ROLES** toca **Nuevo usuario**: app, rol, documento, nombre, celular y correo. La contraseña es su **documento** salvo que escribas otra, y puedes mandarle la **bienvenida** (WhatsApp o correo) en el mismo paso. Cada usuario es de UNA app: la misma persona puede estar en varias.",
"accion": "ir:usuarios",
"estado": "",
"activo": true,
"orden": 22
},
{
"id": "AD-ROLES",
"app": "ADMIN",
"vista": "usuarios",
"titulo": "Roles y quién revisa a quién",
"frases": [
"que roles hay",
"cambiar el rol",
"revisor",
"a quien revisa",
"revisor y creador",
"aprueba y devuelve",
"varios roles"
],
"respuesta": "El rol se cambia con **Editar** en la tarjeta. Los **REVISOR** de Supervisión necesitan saber a quién revisan (un supervisor o una secretaría); en Supervisión y Contratación decides si **aprueban y devuelven**. En Contratación una persona puede ser **REVISOR y CREADOR** a la vez.",
"accion": "ir:usuarios",
"estado": "",
"activo": true,
"orden": 23
},
{
"id": "AD-SIN-CONTRATO",
"app": "ADMIN",
"vista": "usuarios",
"titulo": "¿Qué hace la casilla SIN CONTRATO?",
"frases": [
"que hace la casilla sin contrato",
"sin contrato",
"usuario sin contrato",
"que no salga el nombre",
"texto generico",
"textos sin contrato"
],
"respuesta": "Para quien trabaja **sin contrato** (REVISOR de Contratación, CONTABLE, EGRESO o PAGO): la persona trabaja igual, pero hacia el contratista y en los documentos sale un **texto genérico** («Usuario revisor», «Usuario Contabilidad»…). Por dentro queda quién lo hizo. Los textos se cambian en **Textos sin contrato** y **Ver los SIN CONTRATO** los filtra.",
"accion": "ir:usSinContrato",
"estado": "",
"activo": true,
"orden": 24
},
{
"id": "AD-BORRAR-USUARIO",
"app": "ADMIN",
"vista": "usuarios",
"titulo": "Borrar un usuario",
"frases": [
"borrar un usuario",
"eliminar usuario",
"quitar a alguien de una app",
"sacar un usuario",
"inactivar usuario"
],
"respuesta": "**Estado** lo deja inactivo o suspendido sin borrar nada. **Borrar** quita la fila de esa app (o de las que marques): antes te muestra qué depende de la persona, pide motivo y la fila completa queda en la bitácora. A un **SUPERVISOR con contratos activos** no lo deja borrar: primero va el **Reemplazo de supervisor**.",
"accion": "ir:usuarios",
"estado": "",
"activo": true,
"orden": 25
},
{
"id": "AD-DOCUMENTO",
"app": "ADMIN",
"vista": "usuarios",
"titulo": "Cambiar el documento de un usuario",
"frases": [
"cambiar el documento de un usuario",
"documento equivocado",
"corregir el documento",
"documento repetido",
"se equivocaron en la cedula"
],
"respuesta": "Solo **DEV**: en la tarjeta toca **Documento**. Primero **Ver qué se cambia** te muestra hoja por hoja dónde está (USUARIOS, dispositivos, avisos, soportes, bitácora, CONFIG…) y luego lo cambia en todas, para que conserve su historial, su foto y su firma.",
"accion": "ir:usuarios",
"estado": "",
"activo": true,
"orden": 26
},
{
"id": "AD-REEMPLAZO-SUP",
"app": "ADMIN",
"vista": "configuracion,usuarios",
"titulo": "Reemplazo de supervisor",
"frases": [
"reemplazo de supervisor",
"cambiar de supervisor",
"el supervisor se fue",
"nuevo supervisor",
"pasar los contratos a otro supervisor",
"cambio de supervisor"
],
"respuesta": "En **CONFIGURACIÓN › Supervisores** toca **Reemplazo de supervisor**: escoges quién sale, quién entra y desde cuándo. Antes de aplicar ves hoja por hoja qué cambia (contratos activos, cuentas que aún no revisó, revisores y grupo). Lo terminado y lo ya revisado se queda con quien lo hizo.",
"accion": "ir:cfgSupervisores",
"estado": "",
"activo": true,
"orden": 27
},
{
"id": "AD-SUP-SIN-GRUPO",
"app": "ADMIN",
"vista": "inicio,configuracion",
"titulo": "¿Qué supervisores no tienen grupo?",
"frases": [
"que supervisores no tienen grupo",
"supervisor sin grupo",
"grupo de whatsapp del supervisor",
"no le llegan los avisos al supervisor"
],
"respuesta": "{{supSinGrupo}}",
"accion": "ir:cfgSupervisores",
"estado": "",
"activo": true,
"orden": 28
},
{
"id": "AD-FESTIVOS",
"app": "ADMIN",
"vista": "inicio,configuracion",
"titulo": "Festivos del año",
"frases": [
"festivos del ano",
"cuales son los festivos",
"agregar un festivo",
"dia no laboral",
"quitar un festivo",
"festivos no coinciden"
],
"respuesta": "{{festivos}}",
"accion": "ir:cfgCalendario",
"estado": "",
"activo": true,
"orden": 29
},
{
"id": "AD-CALENDARIO",
"app": "ADMIN",
"vista": "configuracion",
"titulo": "Día de corte y cierre de vigencia",
"frases": [
"dia de corte",
"cierre de vigencia",
"radicacion",
"vigencia",
"cuando pueden radicar",
"apagar la radicacion"
],
"respuesta": "En **CONFIGURACIÓN › Calendario**: la **vigencia**, los festivos, el **día de corte** de cada mes (manda la radicación a los dos primeros hábiles del mes siguiente) y el **cierre de la vigencia**, que apaga la radicación. Mandan sobre las fechas que ve el contratista.",
"accion": "ir:cfgCalendario",
"estado": "",
"activo": true,
"orden": 30
},
{
"id": "AD-APORTES",
"app": "ADMIN",
"vista": "configuracion",
"titulo": "Porcentajes de salud, pensión y ARL",
"frases": [
"porcentaje de salud",
"porcentaje de pension",
"porcentaje arl",
"aportes",
"base de cotizacion",
"planilla",
"umbral solidaridad"
],
"respuesta": "Están en **CONFIGURACIÓN › Calendario**: los **porcentajes de aporte** (salud, pensión y ARL) sobre la base de cotización, que se llenan solos en INGRESAR CUENTA del contratista, y el **umbral** del fondo de solidaridad pensional.",
"accion": "ir:cfgCalendario",
"estado": "",
"activo": true,
"orden": 31
},
{
"id": "AD-CATALOGOS",
"app": "ADMIN",
"vista": "configuracion",
"titulo": "Listas de los formularios",
"frases": [
"agregar un banco",
"lista de eps",
"catalogos",
"agregar una secretaria",
"lista de arl",
"fondos de pensiones",
"tipos de contrato",
"listas desplegables"
],
"respuesta": "En **CONFIGURACIÓN › Catálogos** están las listas que se escogen en Contratista y Contratación (bancos, EPS, AFP, ARL, secretarías, tipos de contrato…). Agregas con el campo de abajo y quitas con la X. Las que tienen **candado** las usa el código tal cual.",
"accion": "ir:cfgCatalogos",
"estado": "",
"activo": true,
"orden": 32
},
{
"id": "AD-GRUPOS",
"app": "ADMIN",
"vista": "configuracion",
"titulo": "Grupos de WhatsApp y carpetas",
"frases": [
"grupos de whatsapp",
"carpetas de drive",
"cambiar el grupo",
"carpeta de una secretaria",
"id del grupo",
"grupo de contratacion"
],
"respuesta": "En **CONFIGURACIÓN › Grupos y carpetas** pegas el enlace completo del grupo o de la carpeta: el CORE saca el id y comprueba que la carpeta exista.",
"accion": "ir:cfgGrupos",
"estado": "",
"activo": true,
"orden": 33
},
{
"id": "AD-PLANTILLAS",
"app": "ADMIN",
"vista": "configuracion",
"titulo": "Plantillas de documentos",
"frases": [
"plantillas",
"cambiar una plantilla",
"plantilla del informe",
"plantilla de la orden de pago",
"formato del documento",
"documento sale mal"
],
"respuesta": "En **CONFIGURACIÓN › Plantillas** están las plantillas de Google de cada documento. **Ir a plantilla** la abre; para cambiarla pegas el enlace o id de la nueva y el CORE comprueba que exista.",
"accion": "ir:cfgPlantillas",
"estado": "",
"activo": true,
"orden": 34
},
{
"id": "AD-GUIAS",
"app": "ADMIN",
"vista": "configuracion,inicio",
"titulo": "Guías rápidas en PDF",
"frases": [
"guias rapidas",
"cambiar la guia",
"subir una guia",
"guia sin pdf",
"instructivo de la app",
"manual de la app"
],
"respuesta": "{{sinGuia}} Para reemplazar una guía: sube el PDF a la carpeta **GUÍAS RÁPIDAS** y pega su enlace en **CONFIGURACIÓN › Guías rápidas**; el CORE comprueba que sea PDF y lo comparte. Las apps no se vuelven a publicar.",
"accion": "ir:cfgGuias",
"estado": "",
"activo": true,
"orden": 35
},
{
"id": "AD-MENSAJES",
"app": "ADMIN",
"vista": "configuracion,inicio",
"titulo": "Cambiar el texto de un aviso",
"frases": [
"cambiar el texto de un aviso",
"mensajes y avisos",
"texto del whatsapp",
"plantilla del mensaje",
"canal del aviso",
"mensaje de bienvenida",
"cambiar el correo que sale"
],
"respuesta": "En **MENSAJES Y AVISOS** tocas un aviso para cambiar su texto (push, WhatsApp, correo) y por qué **canales** sale. Los **marcadores** entre llaves se rellenan solos. Cada cambio pide motivo y queda en la bitácora.",
"accion": "ir:cfgMensajes",
"estado": "",
"activo": true,
"orden": 36
},
{
"id": "AD-MARCA",
"app": "ADMIN",
"vista": "configuracion",
"titulo": "Nombres y firmas de los documentos",
"frases": [
"nombres y firmas",
"cambiar el nombre del alcalde",
"nit",
"firma de los documentos",
"pie de las apps",
"marca"
],
"respuesta": "En **CONFIGURACIÓN › Marca** están los nombres, el NIT y las firmas que salen en los documentos y en el pie de las siete apps.",
"accion": "ir:cfgMarca",
"estado": "",
"activo": true,
"orden": 37
},
{
"id": "AD-RECORDATORIOS",
"app": "ADMIN",
"vista": "inicio,recordatorios,configuracion",
"titulo": "Recordatorios y notificación final",
"frases": [
"recordatorios",
"recordatorio de cuentas",
"notificacion final",
"recordar a los supervisores",
"que saldria ahora",
"reloj de recordatorios",
"apagar los recordatorios"
],
"respuesta": "En **RECORDATORIOS** encienden o apagan los recordatorios de cuentas (a supervisores y a Contratación) y la **notificación final** del contrato, con sus horas y textos. La **vista previa** muestra lo que saldría ahora mismo sin mandar nada.",
"accion": "ir:recordatorios",
"estado": "",
"activo": true,
"orden": 38
},
{
"id": "AD-BITACORA",
"app": "ADMIN",
"vista": "inicio,bitacora,configuracion",
"titulo": "¿Qué se cambió hoy?",
"frases": [
"que se cambio hoy",
"que cambie hoy",
"bitacora",
"quien cambio",
"historial de cambios",
"quien hizo el cambio",
"cambios de hoy"
],
"respuesta": "{{cambiosHoy}}",
"accion": "ir:bitacora",
"estado": "",
"activo": true,
"orden": 39
},
{
"id": "AD-REGISTROS",
"app": "ADMIN",
"vista": "inicio,bitacora",
"titulo": "Descargar lo que hice",
"frases": [
"descargar lo que hice",
"mis registros",
"informe gerencial",
"pdf de la bitacora",
"excel de la bitacora",
"reporte de mis cambios",
"informe de actividades"
],
"respuesta": "En **BITÁCORA · MIS REGISTROS** escoges la persona y las fechas: el **PDF** agrupa por día, el **Excel** trae una fila por cambio y el **Informe gerencial** sale con portada, cifras y gráficas.",
"accion": "ir:registros",
"estado": "",
"activo": true,
"orden": 40
},
{
"id": "AD-TABLERO",
"app": "ADMIN",
"vista": "inicio,tablero",
"titulo": "Tablero del ecosistema",
"frases": [
"tablero del ecosistema",
"cuanto se ha girado",
"cuentas por estado",
"contratos activos",
"salud del servidor",
"errores del servidor"
],
"respuesta": "El **TABLERO DEL ECOSISTEMA** tiene contratos, cuentas por estado, lo girado, usuarios, soportes y la salud del servidor. Se calcula cada 20 minutos; **Recalcular** trae lo de ahora y cada cifra abre su vista.",
"accion": "ir:tablero",
"estado": "",
"activo": true,
"orden": 41
},
{
"id": "AD-RENDIMIENTO",
"app": "ADMIN",
"vista": "inicio,rendimiento,tablero",
"titulo": "¿Cuánto se demora una cuenta?",
"frases": [
"cuanto se demora una cuenta",
"tablero de rendimiento",
"donde se va el tiempo",
"que supervision tarda mas",
"tiempos de pago",
"quien se demora mas"
],
"respuesta": "El **TABLERO DE RENDIMIENTO** mide cuánto se demora cada paso de una cuenta en **días hábiles**, por supervisión, por área y por persona. Filtra por fechas y área; PDF por bloques y Excel con cada cuenta.",
"accion": "ir:rendimiento",
"estado": "",
"activo": true,
"orden": 42
},
{
"id": "AD-COMUNICADO",
"app": "ADMIN",
"vista": "inicio,comunicados",
"titulo": "Publicar un comunicado",
"frases": [
"publicar un comunicado",
"mandar un comunicado",
"comunicados",
"avisar a todos los contratistas",
"retirar un comunicado",
"anuncio a las apps"
],
"respuesta": "En **COMUNICADOS** escribes el comunicado, adjuntas documentos si hace falta y escoges **a qué apps va**: cada app solo ve lo suyo y sus teléfonos reciben la notificación. Desde ahí también ves y retiras los de todas las oficinas.",
"accion": "ir:comunicados",
"estado": "",
"activo": true,
"orden": 43
},
{
"id": "AD-BOT",
"app": "ADMIN",
"vista": "inicio,mibot",
"titulo": "¿El bot de WhatsApp está conectado?",
"frases": [
"el bot esta conectado",
"estado del bot",
"estan saliendo los whatsapp",
"mi bot",
"bot de whatsapp",
"no llegan los whatsapp"
],
"respuesta": "{{bot}}",
"accion": "ir:mibot",
"estado": "",
"activo": true,
"orden": 44
},
{
"id": "AD-BOT-CAIDO",
"app": "ADMIN",
"vista": "mibot",
"titulo": "¿Qué hago si el bot se cae?",
"frases": [
"que hago si el bot se cae",
"el bot se desconecto",
"generar qr",
"escanear el qr",
"reiniciar el bot",
"vincular el bot"
],
"respuesta": "1. Toca **Reiniciar** y espera unos segundos.\n2. Si sigue caído, **Generar QR** y escanéalo con el teléfono del bot (WhatsApp › Dispositivos vinculados).\n3. Si el QR no sale, **Eliminar sesión** y vuelve a generarlo.\nMientras tanto, los avisos con push igual llegan por la app.",
"accion": "ir:mibot",
"estado": "",
"activo": true,
"orden": 45
},
{
"id": "AD-SILENCIO",
"app": "ADMIN",
"vista": "mibot,configuracion",
"titulo": "Silenciar los avisos",
"frases": [
"silenciar los avisos",
"apagar los whatsapp",
"que no salgan mensajes",
"bot en silencio",
"lista negra",
"bloquear un numero"
],
"respuesta": "En **MI BOT**, **Silenciar los avisos** hace que ninguna app mande WhatsApp ni push hasta que los vuelvas a activar. La **lista negra** bloquea números puntuales.",
"accion": "ir:mibot",
"estado": "",
"activo": true,
"orden": 46
},
{
"id": "AD-TUTORIALES",
"app": "ADMIN",
"vista": "inicio,tutoriales",
"titulo": "Tutoriales en video",
"frases": [
"tutoriales en video",
"cambiar un video",
"subir un tutorial",
"apagar los tutoriales",
"portada del video",
"videos del contratista"
],
"respuesta": "En **TUTORIALES EN VIDEO** enciendes o apagas la vista del contratista. Para cambiar un video: súbelo a la carpeta TUTORIALES EN VIDEO, toca **Editar** y pega su enlace; el CORE lo comparte y toma la duración. Los me gusta y comentarios se conservan.",
"accion": "ir:tutoriales",
"estado": "",
"activo": true,
"orden": 47
},
{
"id": "AD-CONTRATISTAS",
"app": "ADMIN",
"vista": "inicio,contratistas,contratista",
"titulo": "Buscar un contrato",
"frases": [
"buscar un contrato",
"buscar un contratista",
"ver un contratista",
"contratistas activos",
"ficha del contratista",
"datos de un contratista",
"contratos"
],
"respuesta": "En **CONTRATISTAS** empiezas con los **activos**; busca por nombre, documento o número y toca la tarjeta para abrir su **ficha**: lo que ve el contratista, sus cuentas, el canal de avisos, **Novedades** y **Todos los datos**.",
"accion": "ir:ctActivos",
"estado": "",
"activo": true,
"orden": 48
},
{
"id": "AD-AGREGAR",
"app": "ADMIN",
"vista": "inicio,contratistas,agregar",
"titulo": "Agregar un contratista",
"frases": [
"agregar un contratista",
"registrar un contrato",
"nuevo contrato",
"crear contratista",
"contrato nuevo"
],
"respuesta": "En **AGREGAR CONTRATISTA** va primero **el documento**: la app dice si es persona nueva, alguien que ya trabajó con la Alcaldía (trae sus datos y su contraseña) o alguien con contrato activo. Después llenas el contrato; el valor en letras y el conteo de obligaciones salen solos.",
"accion": "ir:agregar",
"estado": "",
"activo": true,
"orden": 49
},
{
"id": "AD-MASIVA",
"app": "ADMIN",
"vista": "contratistas,masiva,inicio",
"titulo": "Carga masiva de contratos",
"frases": [
"carga masiva",
"subir varios contratos",
"plantilla de excel",
"cargar muchos contratos",
"importar contratos"
],
"respuesta": "En **CARGA MASIVA** descargas la **plantilla**, la llenas (una fila por contrato) y la cargas. Primero se **revisa** todo con las reglas del alta de uno sin escribir nada; después registras solo lo que pasó.",
"accion": "ir:masiva",
"estado": "",
"activo": true,
"orden": 50
},
{
"id": "AD-NOVEDADES",
"app": "ADMIN",
"vista": "contratista,contratistas,novedad",
"titulo": "Adición, cesión, suspensión u otrosí",
"frases": [
"adicion",
"cesion",
"suspension",
"otrosi",
"prorroga",
"terminacion anticipada",
"liquidacion",
"novedades del contrato",
"editar contrato",
"adicionar un contrato"
],
"respuesta": "Abre la **ficha** del contrato: **Adición** (la app decide si es la 1ª o la 2ª), **Cesión** (el cesionario entra como contratista nuevo), **Suspensión** (corre la fecha final) y **Editar contrato** (con la casilla OTROSÍ se le avisa al contratista). Otrosí, prórroga, terminación y liquidación como información van en **Novedades**.",
"accion": "ir:ctActivos",
"estado": "",
"activo": true,
"orden": 51
},
{
"id": "AD-CUENTA-SILENCIO",
"app": "ADMIN",
"vista": "contratista,contratistas",
"titulo": "Cambiar el estado de una cuenta en silencio",
"frases": [
"cambiar el estado de una cuenta",
"estado en silencio",
"corregir el estado de la cuenta",
"cuenta mal estado",
"mover una cuenta de estado",
"plan de pagos"
],
"respuesta": "En la **ficha** del contratista, en su lista de cuentas, cambias el estado **en silencio**: no sale WhatsApp, correo ni push. Queda en la traza de la cuenta con tu nombre y en la bitácora.",
"accion": "ir:ctActivos",
"estado": "",
"activo": true,
"orden": 52
},
{
"id": "AD-REHACER",
"app": "ADMIN",
"vista": "contratista,contratistas,soportes",
"titulo": "Rehacer los documentos de una cuenta",
"frases": [
"rehacer los documentos",
"rehacer documentos de una cuenta",
"documentos de la cuenta salieron mal",
"regenerar el pdf",
"volver a generar documentos"
],
"respuesta": "En la **ficha** del contratista, en la cuenta, toca **Rehacer documentos**: se rehacen los documentos combinados de su carpeta y queda como soporte en **SOPORTES**.",
"accion": "ir:ctActivos",
"estado": "",
"activo": true,
"orden": 53
},
{
"id": "AD-CANAL",
"app": "ADMIN",
"vista": "contratista,contratistas",
"titulo": "Canal de avisos del contratista",
"frases": [
"canal de avisos",
"que le lleguen por correo",
"cambiar el canal",
"notificaciones por whatsapp o correo",
"no le llegan los avisos al contratista"
],
"respuesta": "En la **ficha** del contratista escoges el **canal** de sus notificaciones individuales: WhatsApp, correo o ambos.",
"accion": "ir:ctActivos",
"estado": "",
"activo": true,
"orden": 54
},
{
"id": "AD-ASISTENTE",
"app": "ADMIN",
"vista": "inicio,asistente",
"titulo": "Entrenar el asistente",
"frases": [
"entrenar el asistente",
"ensenarle al asistente",
"preguntas sin respuesta",
"temas del asistente",
"mejorar las respuestas",
"por ensenar",
"que pregunta la gente"
],
"respuesta": "{{asistente}} En **ASISTENTE DE AYUDA** (solo DEV) editas los temas de cada app, **enseñas** las preguntas que quedaron sin respuesta o con 👎 y pruebas una frase con el mismo motor del teléfono.",
"accion": "ir:asistente",
"estado": "",
"activo": true,
"orden": 55
},
{
"id": "AD-PERMISOS",
"app": "ADMIN",
"vista": "",
"titulo": "¿Qué puedo hacer con mi usuario?",
"frases": [
"que puedo hacer",
"mis permisos",
"que vistas tengo",
"por que no veo una vista",
"no me aparece",
"que rol tengo"
],
"respuesta": "{{permisos}}",
"accion": "",
"estado": "",
"activo": true,
"orden": 56
},
{
"id": "AD-AVISOS",
"app": "ADMIN",
"vista": "",
"titulo": "¿Este teléfono recibe avisos?",
"frases": [
"este telefono recibe avisos",
"no me llegan notificaciones",
"activar notificaciones",
"avisos push",
"notificaciones en el celular"
],
"respuesta": "{{avisosTelefono}}",
"accion": "",
"estado": "",
"activo": true,
"orden": 57
},
{
"id": "AD-FOTO",
"app": "ADMIN",
"vista": "",
"titulo": "Cambiar mi foto",
"frases": [
"cambiar mi foto",
"foto de perfil",
"poner mi foto",
"quitar la foto"
],
"respuesta": "Tu foto se ve en las siete apps. Toca el botón y escoge o toma una nueva.",
"accion": "foto",
"estado": "",
"activo": true,
"orden": 58
},
{
"id": "AD-CLAVE",
"app": "ADMIN",
"vista": "",
"titulo": "Cambiar mi contraseña",
"frases": [
"cambiar mi contrasena",
"actualizar mi clave",
"nueva contrasena mia",
"cambiar mi clave"
],
"respuesta": "Te abro **Actualizar contraseña**: escribes la actual y la nueva.",
"accion": "clave",
"estado": "",
"activo": true,
"orden": 59
},
{
"id": "AD-INSTALAR",
"app": "ADMIN",
"vista": "",
"titulo": "Instalar la app",
"frases": [
"instalar la app",
"poner la app en el celular",
"acceso directo",
"descargar la app"
],
"respuesta": "Puedes instalarla en tu teléfono o computador para abrirla como una app más.",
"accion": "instalar",
"estado": "",
"activo": true,
"orden": 60
},
{
"id": "AD-GUIA",
"app": "ADMIN",
"vista": "",
"titulo": "Descargar la guía rápida",
"frases": [
"descargar la guia",
"guia rapida de admin",
"como se usa esta app",
"instructivo",
"ayuda en pdf"
],
"respuesta": "Te bajo la **guía rápida** de Admin en PDF.",
"accion": "guia",
"estado": "",
"activo": true,
"orden": 61
},
{
"id": "ADE-OLVIDE",
"app": "ADMIN",
"vista": "entrada",
"titulo": "Olvidé mi contraseña",
"frases": [
"olvide mi contrasena",
"no recuerdo la clave",
"recuperar contrasena",
"perdi la clave",
"no me acuerdo de la contrasena"
],
"respuesta": "Escribe tu **documento** y toca **Olvidé mi contraseña**: te llega por WhatsApp al celular registrado.",
"accion": "olvide",
"estado": "",
"activo": true,
"orden": 62
},
{
"id": "ADE-ENTRAR",
"app": "ADMIN",
"vista": "entrada",
"titulo": "¿Cómo entro?",
"frases": [
"como entro",
"como ingreso",
"cual es mi usuario",
"con que entro",
"no puedo entrar",
"iniciar sesion"
],
"respuesta": "Entras con tu **documento** (sin puntos) y tu **contraseña**. Si es la primera vez, la contraseña es tu documento salvo que te hayan dado otra.",
"accion": "documento",
"estado": "",
"activo": true,
"orden": 63
},
{
"id": "ADE-BLOQUEO",
"app": "ADMIN",
"vista": "entrada",
"titulo": "Me bloqueé por intentos",
"frases": [
"me bloquee",
"cuenta bloqueada",
"demasiados intentos",
"dice bloqueado"
],
"respuesta": "Con **cinco intentos** fallidos la entrada se bloquea **15 minutos**. Espera o usa **Olvidé mi contraseña**.",
"accion": "olvide",
"estado": "",
"activo": true,
"orden": 64
},
{
"id": "ADE-INSTALAR",
"app": "ADMIN",
"vista": "entrada",
"titulo": "Instalar la app",
"frases": [
"instalar la app",
"poner la app en el celular",
"descargar la app",
"acceso directo"
],
"respuesta": "Puedes instalarla en tu teléfono o computador para abrirla como una app más.",
"accion": "instalar",
"estado": "",
"activo": true,
"orden": 65
},
{
"id": "ADE-QUE-ES",
"app": "ADMIN",
"vista": "entrada",
"titulo": "¿Para qué sirve esta app?",
"frases": [
"para que sirve",
"que es esta app",
"que es admin",
"que hago aqui"
],
"respuesta": "**Admin Flandes** es la app del administrador del ecosistema: configuración, usuarios y roles de las siete apps, soportes, comunicados, el bot de WhatsApp, tableros y la gestión de cualquier contrato.",
"accion": "",
"estado": "",
"activo": true,
"orden": 66
},
{
"id": "ADE-ACCESO",
"app": "ADMIN",
"vista": "entrada",
"titulo": "No tengo acceso a Admin",
"frases": [
"no tengo acceso",
"no tengo usuario",
"crear usuario",
"quien me da acceso"
],
"respuesta": "Admin es solo para el **administrador del ecosistema**. Si trabajas en otra oficina, entra a la app de tu área (Contratación, Supervisión, Contabilidad, Tesorería o Comunicaciones).",
"accion": "",
"estado": "",
"activo": true,
"orden": 67
}
];
