const ExcelJS = require('exceljs');
const prisma = require('./prisma'); // Tu instancia única de Prisma

async function exportDatabase(req, res) {
  try {
    const workbook = new ExcelJS.Workbook();

    // Listado de todos los modelos que deseas exportar
    const models = {
      Activos: await prisma.activo.findMany({
        include: { images: true }  // Incluir imágenes asociadas
      }),
      ActivoHistorial: await prisma.activoHistorial.findMany(),
      Areas: await prisma.area.findMany(),
      Atributos: await prisma.atributo.findMany({
        include: { images: true }  // Incluir imágenes asociadas
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
        // Para cada modelo, agregamos las columnas, incluyendo las imágenes si existen
        const sampleRow = data[0];
        worksheet.columns = Object.keys(sampleRow).map((key) => ({
          header: key,
          key: key,
          width: 20,
        }));

        // Si hay imágenes, agregar una columna para la URL de la imagen
        data.forEach(row => {
          // Incluir las URLs de las imágenes asociadas si existen
          if (row.images && row.images.length > 0) {
            row.images = row.images.map(image => image.url).join(', '); // Concatenar las URLs
          } else {
            row.images = '(Sin imagen)';
          }
        });

        worksheet.addRows(data);
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
