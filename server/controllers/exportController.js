const ExcelJS = require('exceljs');
const prisma = require('./prisma'); // Tu instancia única de Prisma

async function exportDatabase(req, res) {
  try {
    const workbook = new ExcelJS.Workbook();

    // Listado de todos los modelos que deseas exportar (Incluye Clinica)
    const models = {
      Clinica: await prisma.clinica.findMany(), // 👈 Agregado el modelo clinica
      Activos: await prisma.activo.findMany({
        include: { images: true }
      }),
      ActivoHistorial: await prisma.activoHistorial.findMany(),
      Areas: await prisma.area.findMany(),
      Atributos: await prisma.atributo.findMany({
        include: { images: true }
      }),
      HistorialItems: await prisma.historialItem.findMany(),
      Historico: await prisma.historico.findMany(),
      Images: await prisma.image.findMany(),
      OTbasico: await prisma.oTbasico.findMany(),
      OTConsumibles: await prisma.oTConsumible.findMany(),
      Ots: await prisma.ots.findMany(),
      Users: await prisma.user.findMany(),
      Ubicaciones: await prisma.ubicacion.findMany(),
      Zonas: await prisma.zona.findMany(),
    };

    // Agregar las filas de cada modelo al archivo Excel
    for (const [modelName, data] of Object.entries(models)) {
      const worksheet = workbook.addWorksheet(modelName);

      if (data.length > 0) {
        const sampleRow = data[0];
        worksheet.columns = Object.keys(sampleRow).map((key) => ({
          header: key,
          key: key,
          width: 20,
        }));

        // Procesar y limpiar los datos antes de insertarlos en Excel
        const processedRows = data.map(row => {
          // Clonamos la fila para no mutar directamente la respuesta de Prisma
          const newRow = { ...row };

          // 1. Manejo de imágenes (Tu lógica original)
          if (newRow.images && Array.isArray(newRow.images)) {
            newRow.images = newRow.images.length > 0 
              ? newRow.images.map(image => image.url).join(', ') 
              : '(Sin imagen)';
          }

          // 2. SOLUCIÓN AL ERROR DE FECHAS: 
          // Recorremos cada columna de la fila buscando objetos tipo Date de JS/Prisma
          Object.keys(newRow).forEach(key => {
            if (newRow[key] instanceof Date) {
              // Validamos que sea una fecha válida
              if (!isNaN(newRow[key].getTime())) {
                // Opción A: Guardarla como String formateado localmente (Evita distorsiones al 100%)
                // Produce un texto limpio: "23/01/2026 06:36:22" en la zona horaria del servidor
                const date = newRow[key];
                const pad = (n) => String(n).padStart(2, '0');
                
                const day = pad(date.getDate());
                const month = pad(date.getMonth() + 1);
                const year = date.getFullYear();
                const hours = pad(date.getHours());
                const minutes = pad(date.getMinutes());
                const seconds = pad(date.getSeconds());

                newRow[key] = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
              }
            }
          });

          return newRow;
        });

        // Insertamos los datos procesados en la hoja
        worksheet.addRows(processedRows);
      } else {
        worksheet.addRow(['(Sin datos)']);
      }
    }

    // Enviar el archivo al frontend
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=base_datos.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('❌ Error exportando:', error);
    res.status(500).json({ message: 'Error al exportar' });
  }
}


module.exports = { exportDatabase };
