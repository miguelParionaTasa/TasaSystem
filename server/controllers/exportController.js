const ExcelJS = require('exceljs');
const prisma = require('./prisma'); // Tu instancia única de Prisma

async function exportDatabase(req, res) {
  try {
    const workbook = new ExcelJS.Workbook();

    // Listado de todos los modelos que deseas exportar
    const models = {
      Users: await prisma.user.findMany(),
      Areas: await prisma.area.findMany(),
      Ots: await prisma.ots.findMany(),
      OTConsumibles: await prisma.oTConsumible.findMany(),
      Consumibles: await prisma.consumible.findMany(),
      Zonas: await prisma.zona.findMany(),
      Ubicaciones: await prisma.ubicacion.findMany(),
      Componentes: await prisma.componente.findMany(),
      Atributos: await prisma.atributo.findMany(),
      AtributoHistorial: await prisma.atributoHistorial.findMany(),
      Repuestos: await prisma.repuesto.findMany(),
      Equipos: await prisma.equipo.findMany(),
      Images: await prisma.image.findMany(),
      OTbasico: await prisma.oTbasico.findMany(),
    };

    for (const [modelName, data] of Object.entries(models)) {
      const worksheet = workbook.addWorksheet(modelName);

      if (data.length > 0) {
        worksheet.columns = Object.keys(data[0]).map((key) => ({
          header: key,
          key: key,
          width: 20,
        }));
        worksheet.addRows(data);
      } else {
        worksheet.addRow(['(Sin datos)']);
      }
    }

    // Enviar el archivo al frontend
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=base_datos.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('❌ Error exportando:', error);
    res.status(500).json({ message: 'Error al exportar' });
  }
}

module.exports = { exportDatabase };
