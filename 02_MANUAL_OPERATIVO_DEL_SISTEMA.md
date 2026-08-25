# TASA System — manual operativo

## 1. Qué resuelve el sistema

El técnico, operador, planner o supervisor puede revisar trabajos próximos, anticipar materiales, consultar reservas SAP y seguir lo ya solicitado. La información se separa por planta y por temporada CHIV.

La ubicación normal de un trabajo es **planta → zona → ubicación**. Un activo o equipo puede quedar sin mapear mientras se completa la información; esto no impide registrar o consultar la OT.

## 2. Ingreso y planta seleccionada

1. Ingresar con usuario y contraseña.
2. Los administradores y supervisores verán un selector de planta en el encabezado.
3. Un administrador de planta puede leer otra planta seleccionada, pero solo modificar la suya. El sistema rechazará una escritura cruzada.
4. `SUPER_ADMIN` puede operar todas las plantas.

La sesión caduca aproximadamente a las 8 horas. Ya no existe un token visible en el almacenamiento del navegador.

## 3. Flujo diario recomendado

1. Seleccionar planta y temporada correctas.
2. Abrir **Todas OT** para revisar los trabajos próximos.
3. Entrar a **Pedidos** para registrar materiales por OT.
4. Consultar **Reportes** para comparar pedidos internos, reservas SAP y pedidos Telegram.
5. Revisar **Materiales**, **Histórico**, **Activos**, **Predictivo**, **Clínica**, **Tarjeta roja** o **Inventario** según la labor.

## 4. Reportes y trazabilidad

En Reportes, el filtro **Por** permite:

- **Mi grupo**: solicitudes del grupo o área operativa.
- **Mis movimientos**: registros del usuario actual.
- **SAP**: reservas y materiales importados desde SAP.
- **Telegram**: pedidos creados por el bot, con código, OT, estado y solicitante.

Los administradores pueden descargar un Excel de la planta seleccionada. El archivo excluye contraseñas, tokens y datos cifrados.

## 5. Temporadas

Administración → Temporadas permite crear CHIV 1 o 2 con su año y activar una sola por planta. Ejemplos:

- CHIV 1 / 2025 se muestra como `CHIV1-25`.
- CHIV 2 / 2025 se muestra como `CHIV2-25`.

Antes de importar reservas SAP u OT para Telegram debe seleccionarse una temporada. No mezclar archivos de dos temporadas en una misma carga.

## 6. Importar Excel

Solo `ADMIN_PLANTA` y `SUPER_ADMIN` pueden importar.

1. Seleccionar el tipo de carga.
2. Elegir la temporada cuando corresponda.
3. Seleccionar un archivo `.xlsx`.
4. Importar y leer el resumen: creados, actualizados, omitidos y errores.
5. Si hay errores, corregir únicamente las filas informadas y cargar nuevamente.

### Activos

Descargar la plantilla desde el mismo módulo. Trabajar en la hoja `ACTIVOS` sin cambiar los encabezados.

- Obligatorios: `codigo_activo`, `nombre`.
- Opcionales: valor, valor 2, marca, modelo, serie, zona, ubicación, equipo e historial.
- Un activo sin ubicación ni equipo es válido.
- Una zona, ubicación o equipo reconocido se enlaza automáticamente. Si todavía no está homologado, el texto se conserva, el activo queda sin ese enlace y el resultado muestra una advertencia.
- La carga actualiza por código y nunca borra los activos que no aparecen.
- La planta se obtiene de la sesión; no escribirla en el Excel.

### SAP: MERGE o SNAPSHOT

- Usar **MERGE** para cargas normales: agrega y actualiza sin eliminar.
- Usar **SNAPSHOT** solo cuando el archivo representa el estado completo de las OT incluidas para esa temporada. No afecta otras OT, temporadas ni plantas.
- Si existe una sola fila con error, el sistema omite las eliminaciones del `SNAPSHOT` y lo indica en la respuesta.

## 7. Acceso por Telegram

### Obtener el ID

1. Abrir un chat privado con el bot desde el celular o Telegram Desktop; no usarlo dentro de un grupo.
2. Enviar `/miid`.
3. El bot responderá el ID de la cuenta. No es el número telefónico.
4. Enviar `/start PISCO_SUR` o el código de la planta correspondiente.
5. Mientras no esté aprobado, el bot responderá que el servicio no está permitido.

### Aprobar un usuario

1. El administrador entra a Administración → Acceso a Telegram.
2. Identifica la solicitud por nombre, usuario y últimos cuatro dígitos.
3. Selecciona el usuario web correcto.
4. Presiona **Aprobar**.

El administrador nunca necesita copiar el ID completo a la base de datos ni conocer el teléfono.

### Opciones del bot

- **Reservas por OT**: número de OT y materiales asociados.
- **Reservas por zona**: zona → ubicación → OT.
- **Buscar material**: código SAP o parte del nombre.
- **Pedir material**: valida la OT, permite buscar o ingresar manualmente y genera un código de solicitud.
- **Mis pedidos**: últimos pedidos y estado.

Cuando Almacén, Supervisor o Administración cambia el estado de un pedido Telegram, el bot intenta notificar al solicitante.

## 8. Usuarios y contraseñas

El administrador crea usuarios con una sola planta, una sola área y un rol. La contraseña temporal debe tener al menos 10 caracteres.

Al restablecer una contraseña:

- se guarda con bcrypt;
- se invalidan las sesiones anteriores;
- el valor nunca aparece en exportaciones ni respuestas de API.

## 9. Transferir un activo

Solo `SUPER_ADMIN` puede transferir un activo entre plantas mediante la operación administrativa correspondiente.

- Se exige una planta destino y un motivo.
- Se limpian zona, ubicación y equipo actuales para evitar un mapeo falso.
- El historial anterior conserva su planta.
- La transferencia queda registrada en la auditoría append-only.

## 10. Mensajes comunes

| Mensaje | Acción |
|---|---|
| “Sesión requerida” | Volver a iniciar sesión |
| “No tienes permiso para operar sobre la planta seleccionada” | Volver a la planta propia o pedir a SUPER_ADMIN |
| “Selecciona o activa una temporada” | Crear/activar CHIV antes de importar |
| “Este mismo archivo ya fue importado” | Revisar el historial de importaciones; no duplicar la carga |
| “Referencia no pertenece a la planta” | Corregir zona, ubicación, equipo, activo o temporada |
| Telegram: “No estás autorizado” | Enviar `/start CODIGO_PLANTA` y solicitar aprobación |

Ante una falla de importación, no repetir varias veces sin revisar el `importacionId` y los errores por fila.
