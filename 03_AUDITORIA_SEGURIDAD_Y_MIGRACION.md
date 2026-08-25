# TASA System — auditoría de seguridad y migración

Fecha de revisión: **24 de agosto de 2026**.

## 1. Hallazgos críticos del ZIP original

| Riesgo | Evidencia original | Corrección incluida |
|---|---|---|
| Contraseñas en texto plano | Login comparaba texto y `/user` las devolvía | bcrypt costo 12, migración idempotente y filtro global de campos sensibles |
| API pública | La mayoría de CRUD, importaciones y exportación no autenticaban | Autenticación global después de `/auth` y `/ping` |
| Exportación total pública | `/export/exportar` incluía `User.password` | Solo administradores, por planta y con selección segura |
| JWT en `localStorage` | Cualquier XSS podía leerlo | Cookie `HttpOnly`, `Secure`, `SameSite=Lax` mediante proxy Netlify |
| Permisos por ID 1/2/3 | La interfaz decidía privilegios por ID | Roles Prisma y controles obligatorios en backend |
| Sin separación por planta | Datos globales y relaciones ambiguas | `plantaId`, contexto tenant y validación de referencias |
| Suplantación de usuario | Varios controladores aceptaban `userId` del cliente | Backend reemplaza siempre el actor por el usuario autenticado, incluso en multipart |
| Telegram abierto | Cualquier chat podía consultar y pedir | Registro pendiente, HMAC, AES-GCM, vinculación web y autorización en cada evento |
| Pedido Telegram aislado | Modelo bot separado sin bandeja web | `SolicitudMaterial` común con origen WEB/TELEGRAM |
| Importación destructiva | Algunas cargas eliminaban antes de insertar | MERGE predeterminado, SNAPSHOT acotado, upsert y registro de importación |
| Archivos sin validar | Multer aceptaba cualquier contenido/tamaño | MIME + extensión + tamaño + un archivo por solicitud |
| Auditoría débil | Sin bitácora transversal confiable | Request ID, actor, planta, ruta, resultado, datos sanitizados y trigger append-only |
| Datos reales en el repositorio | CSV SAP/Maximo/ATC y scripts ad hoc | Retirados del ZIP corregido |
| Dependencias vulnerables | 22 alertas backend y 68 frontend en la revisión inicial | Paquetes retirados/actualizados; auditoría de producción en cero al cierre |

## 2. Cambios de base de datos

La migración `20260824090000_seguridad_multiplanta` es aditiva y realiza:

- creación de `Planta` e inserción de `PISCO_SUR`;
- asignación de todos los registros existentes a Pisco Sur;
- usuario 1 → `SUPER_ADMIN`; usuarios 2 y 3 → `ADMIN_PLANTA`; resto → `TECNICO_OPERADOR`;
- creación de temporadas CHIV detectables desde `OTbasico.Temp`;
- una temporada activa como máximo por planta;
- claves compuestas de OT por planta;
- activo opcional respecto de zona, ubicación y equipo;
- bandeja unificada de solicitudes;
- autorizaciones Telegram cifradas;
- auditoría append-only e historial de importaciones;
- corrección del tipo histórico `TelegramUser.id`/`OTBot.telegramUserId` a BIGINT;
- backfill de planta en entidades e históricos dependientes.

La migración **no ejecuta el hash de contraseñas** para mantener esa operación separada, medible y posterior al backup.

## 3. Secretos que deben rotarse

Los secretos compartidos en conversaciones, capturas, scripts o repositorios deben considerarse comprometidos. Antes del despliegue:

1. Rotar `JWT_SECRET` con al menos 32 bytes aleatorios.
2. Revocar el token actual del bot mediante BotFather y generar otro.
3. Revisar/rotar la contraseña de Aiven si alguna URL completa fue expuesta.
4. Rotar el secreto de Cloudinary si fue publicado.
5. Crear y respaldar `TELEGRAM_DATA_KEY` independiente de `JWT_SECRET`.

Ejemplo local para generar claves: `openssl rand -base64 48`. No pegarlas en Git, documentos ni tickets.

## 4. Variables de Render

Configurar según `server/.env.example`:

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET`
- `SESSION_HOURS=8`
- `AUTH_COOKIE_NAME=tasasystem_session`
- `FRONTEND_URLS=https://tasasystem.netlify.app`
- credenciales Cloudinary
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_DATA_KEY`

Eliminar `API_URL`; el bot ya no llama a la API pública para registrar pedidos.

## 5. Despliegue seguro sin pérdida de datos

### Fase A — respaldo y ensayo

1. Activar/verificar el mecanismo de backup o PITR de Aiven.
2. Crear un dump lógico cifrado y registrar su checksum.
3. Restaurar el dump en una base de prueba independiente.
4. Desplegar una instancia Render de prueba contra esa copia.
5. Ejecutar `npm ci`, `npm run prisma:validate` y `npm test`.
6. Ejecutar `npx prisma migrate deploy` únicamente en la copia.
7. Comparar conteos antes/después por tabla y revisar las consultas de verificación de este documento.
8. Probar login, planta, roles, importación, exportación y Telegram con cuentas de prueba.

### Fase B — ventana productiva

1. Avisar una ventana corta sin importaciones ni escrituras.
2. Generar un segundo backup inmediatamente antes del cambio.
3. Preparar el backend nuevo con las variables nuevas, todavía sin recibir tráfico.
4. Ejecutar `npx prisma migrate deploy` desde el **Pre-Deploy Command** de Render o un job controlado de una sola instancia; arrancar el servicio nuevo solo si termina correctamente.
5. Ejecutar `npm run passwords:check` y guardar solo los conteos.
6. Ejecutar `npm run passwords:migrate`.
7. Volver a ejecutar `npm run passwords:check`; el conteo plano debe ser cero.
8. Desplegar el frontend Netlify con `REACT_APP_API_URL=/api/`.
9. Comprobar que el proxy `/api` funciona y que no aparece `token` en `localStorage`.
10. Activar una sola instancia del bot y aprobar únicamente IDs de prueba.
11. Finalizar la ventana después de los smoke tests.

No usar `prisma db push` en producción.

## 6. Consultas de verificación

Ejecutar en la copia y luego en producción, sin mostrar valores sensibles:

```sql
SELECT COUNT(*) AS usuarios_sin_planta FROM "User" WHERE "plantaId" IS NULL;
SELECT "rol", COUNT(*) FROM "User" GROUP BY "rol" ORDER BY "rol";
SELECT p."codigo", COUNT(u.*) FROM "Planta" p LEFT JOIN "User" u ON u."plantaId" = p."id" GROUP BY p."codigo";
SELECT COUNT(*) AS claves_no_bcrypt FROM "User" WHERE "password" !~ '^\$2[aby]\$[0-9]{2}\$';
SELECT "plantaId", COUNT(*) FROM "Temporada" WHERE "activa" = true GROUP BY "plantaId" HAVING COUNT(*) > 1;
SELECT "plantaId", "codigoActivo", COUNT(*) FROM "Activo" WHERE "codigoActivo" IS NOT NULL GROUP BY 1,2 HAVING COUNT(*) > 1;
SELECT "plantaId", "OTmaximo", COUNT(*) FROM "OTbasico" GROUP BY 1,2 HAVING COUNT(*) > 1;
SELECT COUNT(*) FROM "Auditoria";
SELECT "estado", COUNT(*) FROM "Importacion" GROUP BY "estado";
```

Además, comparar conteos de las tablas existentes antes y después. Un backfill de `plantaId` no debe reducir ninguno.

## 7. Smoke tests mínimos

- Credenciales incorrectas devuelven un mensaje genérico.
- Usuario normal no puede exportar, importar, eliminar ni abrir Administración.
- ADMIN_PLANTA escribe su planta y recibe 403 al intentar escribir otra.
- SUPERVISOR puede leer otra planta pero no administrar usuarios.
- Exportación no contiene `password`, `tokenVersion` ni IDs Telegram completos.
- `/user` ya no existe y `/useres/:id` nunca devuelve contraseña.
- Un archivo no XLSX o mayor a 12 MB es rechazado.
- La misma carga completada es detectada por checksum.
- `/miid` funciona sin autorización; las demás consultas no.
- El bot rechaza el uso desde grupos y autoriza el ID de la cuenta, no el ID del chat.
- Pedido Telegram aparece en Reportes → Telegram.
- Revocar Telegram impide el siguiente uso.
- Cambiar contraseña invalida la cookie anterior.

## 8. Reversión

No existe una reversión segura basada en “deshashear” bcrypt: es intencionalmente irreversible.

### Si falla antes de migrar contraseñas

1. Detener backend y bot nuevos.
2. Volver a la versión anterior del código.
3. Restaurar el backup previo si la migración llegó a ejecutarse.
4. Verificar conteos antes de reabrir escrituras.

### Si falla después de migrar contraseñas

La opción confiable es restaurar el snapshot previo junto con el código anterior. Como alternativa, conservar la base nueva y corregir el código; no volver al login antiguo, porque no entiende bcrypt.

Los secretos rotados no deben volver a sus valores anteriores, incluso durante rollback. Configurar los secretos nuevos también en la versión recuperada cuando sea compatible.

## 9. Riesgos residuales y siguiente fase

- No se ejecutó la migración contra producción ni contra una copia real de Aiven desde este ZIP.
- Falta un ambiente staging permanente y pruebas de integración con datos anonimizados.
- El rate limit de login es en memoria; con varias instancias debe moverse a Redis u otro almacén compartido.
- Long polling requiere una sola instancia. Para escalar el bot, migrar a webhook con secreto y cola.
- La validación de archivos limita tipo y tamaño, pero no incluye antivirus; agregar escaneo si se aceptan documentos externos.
- Create React App sigue siendo una herramienta de compilación heredada. No afecta el bundle auditado de producción, pero conviene migrar el frontend a Vite en una fase independiente.
- Definir retención, exportación y monitoreo de `Auditoria`; el trigger impide modificaciones y eliminaciones ordinarias.
- Añadir CI con base PostgreSQL efímera para ejecutar todas las migraciones desde cero y sobre una copia anonimizada.

Al cierre de esta revisión, `npm audit --omit=dev` reportó **0 vulnerabilidades de producción** en backend y frontend, el esquema Prisma validó, cinco pruebas automatizadas pasaron y el frontend compiló correctamente.
