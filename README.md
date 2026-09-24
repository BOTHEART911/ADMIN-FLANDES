# ADMIN-FLANDES

App del desarrollador del ecosistema de la Alcaldía de Flandes. Front estático (GitHub Pages) sobre FLANDES_CORE (app `ADMIN`). Mismo kit, estilos, cielo, cohete, esqueletos, Insights, foto de perfil, modo oscuro, login compacto y firma que las otras apps. Hoy entra solo el DEV.

## Fase 10 · entrega 10.1
- **Inicio**: el login trae el arranque con TODO (configuración, usuarios, supervisores, festivos, avisos y las últimas 400 filas de la bitácora): un solo viaje. Lo que pide atención (bloqueados, sin celular, supervisores sin grupo, mantenimiento activo…) y la versión publicada de cada app, leída de su propio `version.js`.
- **Configuración** (`js/configuracion.js`): CONFIG por secciones — calendario (festivos por ley con ajustes, día de corte por mes, cierre de vigencia), catálogos, supervisores, grupos y carpetas (con "Ir a carpeta"), plantillas (con "Ir a plantilla"), mensajes y avisos (push, WhatsApp, correo y canales), mantenimiento (modo mantenimiento, direcciones y versiones, sonidos, claves), marca y el resto. Cada tarjeta guarda sola, con motivo.
- **Usuarios y roles** (`js/usuarios.js`): las apps de funcionarios y ADMIN. Crear (contraseña inicial = documento), editar, estado, reiniciar contraseña, desbloquear, bienvenida por WhatsApp o correo; REVISOR con a quién revisa y si aprueba o devuelve.
- **Bitácora** (`js/bitacora.js`): cada cambio con quién, cuándo, antes, después y motivo. PDF por bloques y Excel.
- Soporte en la tarjeta del inicio y en el menú del perfil. Insights en todas las vistas.

## Fase 10 · entrega 10.2 · contratistas
- **CONTRATISTAS, ficha, agregar, adición, cesión, suspensión y editar (5.5)**: las MISMAS vistas de CONTRATACION. `js/contratistas.js`, `js/gestion.js`, `js/masiva.js` y `js/ayuda-contratos.js` son archivos compartidos (idénticos en los dos repos); el CORE las atiende con rutas de ADMIN que llaman a las mismas funciones y suman la bitácora.
- **Cesión**: el cesionario entra como contratista nuevo (su fila, su informe 1) y el plazo, el valor y los informes se parten entre los dos; lo ya cobrado es del cedente.
- **Carga masiva** con `plantillas/PLANTILLA_CARGA_MASIVA_CONTRATISTAS.xlsx`: se revisa todo sin escribir y se registra lo que pasa, con o sin avisos.
- **Lo propio de ADMIN** (`js/contratos-admin.js`): canal de notificación por contratista, cuentas del contrato con cambio de estado EN SILENCIO (queda en la traza con quién lo hizo), historial de novedades, NOVEDADES (otrosí, prórroga, suspensión y reinicio, terminación anticipada, liquidación, cambio de supervisor) y TODOS LOS DATOS de la fila.

Firma: **Oscar Polania** · Experto en soluciones digitales.
