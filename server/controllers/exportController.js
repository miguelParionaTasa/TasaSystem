const ExcelJS = require('exceljs');
const prisma = require('./prisma'); // Tu instancia única de Prisma

async function exportDatabase(req, res) {
  try {
    // 1. Configuramos las cabeceras HTTP de inmediato para preparar la descarga por Streaming
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=base_datos_optimizada.xlsx');

    // 2. Instanciamos el libro usando el modo STREAMING (Escribe directo al cliente y libera RAM)
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res, // Escribe directamente en la respuesta HTTP
      useStyles: true,
      useSharedStrings: true
    });

    // Definición de todos los modelos a procesar uno a uno
    const modelKeys = [
      { name: 'Users', delegate: prisma.user },
      { name: 'Areas', delegate: prisma.area },
      { name: 'Ots', delegate: prisma.ots },
      { name: 'OTConsumibles', delegate: prisma.oTConsumible, includeImages: true },
      { name: 'OTMovimientosSAP', delegate: prisma.oTMovimientoSAP },
      { name: 'Consumibles', delegate: prisma.consumible },
      { name: 'Zonas', delegate: prisma.zona },
      { name: 'Ubicaciones', delegate: prisma.ubicacion },
      { name: 'Lubricaciones', delegate: prisma.lubricacion, includeImages: true },
      { name: 'Componentes', delegate: prisma.componente, includeImages: true },
      { name: 'Atributos', delegate: prisma.atributo, includeImages: true },
      { name: 'Clinicas', delegate: prisma.clinica, includeImages: true },
      { name: 'ClinicaHistoriales', delegate: prisma.clinicaHistorial },
      { name: 'Activos', delegate: prisma.activo, includeImages: true },
      { name: 'ActivoHistoriales', delegate: prisma.activoHistorial },
      { name: 'AtributoHistoriales', delegate: prisma.atributoHistorial },
      { name: 'Repuestos', delegate: prisma.repuesto, includeImages: true },
      { name: 'Equipos', delegate: prisma.equipo, includeImages: true },
      { name: 'Images', delegate: prisma.image },
      { name: 'OTbasicos', delegate: prisma.oTbasico },
      { name: 'Historicos', delegate: prisma.historico },
      { name: 'InventarioItems', delegate: prisma.inventarioItem },
      { name: 'HistorialItems', delegate: prisma.historialItem },
      { name: 'Configuraciones', delegate: prisma.configuracion },
      { name: 'Predictivos', delegate: prisma.predictivo, includeImages: true },
      { name: 'Procesos', delegate: prisma.procesos, includeImages: true },
      { name: 'ProcesosHistoriales', delegate: prisma.procesosHistorial },
      { name: 'TarjetasRojas', delegate: prisma.tarjetaRoja, includeImages: true },
      { name: 'TarjetaRojaHistoriales', delegate: prisma.tarjetaRojaHistorial },
      { name: 'TelegramUsers', delegate: prisma.telegramUser },
      { name: 'OTBots', delegate: prisma.oTBot },
      { name: 'OTConsumibleBots', delegate: prisma.oTConsumibleBot }
    ];

    const CHUNK_SIZE = 5000; // Procesamos los registros en bloques de 5,000 para no saturar la RAM

    // Helper interno para formatear fechas de manera eficiente
    const pad = (n) => String(n).padStart(2, '0');
    const formatDate = (val) => `${pad(val.getDate())}/${pad(val.getMonth() + 1)}/${val.getFullYear()} ${pad(val.getHours())}:${pad(val.getMinutes())}:${pad(val.getSeconds())}`;

    // 3. Procesamiento secuencial por modelo
    for (const model of modelKeys) {
      const worksheet = workbook.addWorksheet(model.name);
      
      let skip = 0;
      let hasMore = true;
      let columnsSet = false;

      // Bucle de paginación por bloques
      while (hasMore) {
        const queryOptions = {
          skip: skip,
          take: CHUNK_SIZE,
          orderBy: { id: 'asc' } // Asegura consistencia en la paginación secuencial
        };

        if (model.includeImages) {
          queryOptions.include = { images: true };
        }

        // Traemos únicamente un bloque controlado de registros
        const rows = await model.delegate.findMany(queryOptions);

        if (rows.length === 0) {
          if (skip === 0) {
            worksheet.addRow(['(Sin datos registrados en esta tabla)']).commit();
          }
          hasMore = false;
          break;
        }

        // Definimos las columnas solo una vez basándonos en el primer registro del primer bloque
        if (!columnsSet) {
          worksheet.columns = Object.keys(rows[0])
            .filter(key => typeof rows[0][key] !== 'object' || rows[0][key] instanceof Date || Array.isArray(rows[0][key]))
            .map((key) => ({
              header: key,
              key: key,
              width: 22,
            }));
          columnsSet = true;
        }

        // Procesamos y limpiamos el bloque actual en memoria
        for (const row of rows) {
          const newRow = { ...row };

          // Aplanamiento rápido de arrays de imágenes adjuntas
          if (newRow.images && Array.isArray(newRow.images)) {
            newRow.images = newRow.images.length > 0 
              ? newRow.images.map(img => img.url || JSON.stringify(img)).join(', ') 
              : '(Sin imagen)';
          }

          // Sanitización veloz de celdas individuales
          Object.keys(newRow).forEach(key => {
            const val = newRow[key];
            if (val instanceof Date) {
              newRow[key] = !isNaN(val.getTime()) ? formatDate(val) : '(Fecha inválida)';
            } else if (typeof val === 'bigint') {
              newRow[key] = val.toString();
            } else if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
              newRow[key] = JSON.stringify(val, (k, v) => typeof v === 'bigint' ? v.toString() : v);
            }
          });

          // Insertamos la fila en caliente
          worksheet.addRow(newRow).commit();
        }

        // Si el bloque actual es menor al tamaño solicitado, terminamos la tabla
        if (rows.length < CHUNK_SIZE) {
          hasMore = false;
        } else {
          skip += CHUNK_SIZE; // Avanzamos al siguiente bloque
        }
      }

      // Consolidamos y liberamos la hoja actual de la memoria del servidor
      worksheet.commit();
    }

    // 4. Finalizamos la escritura del flujo general de streaming
    await workbook.commit();
    res.end();

  } catch (error) {
    console.error('❌ Error crítico en el streaming del exportador:', error);
    // Si ocurre un error antes de enviar cabeceras mandamos un 500, de lo contrario cerramos la conexión
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error interno al procesar el gran volumen de datos' });
    } else {
      res.end();
    }
  }
}

module.exports = { exportDatabase };
