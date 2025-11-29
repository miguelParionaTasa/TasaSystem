const ExcelJS = require('exceljs');
const prisma = require('./prisma'); // Tu instancia única de Prisma

async function exportDatabase(req, res) {
  try {
    const workbook = new ExcelJS.Workbook();

    // Listado de todos los modelos que deseas exportar
    const models = {
  Activos: await prisma.activo.findMany(),
  ActivoHistorial: await prisma.activoHistorial.findMany(),
  Areas: await prisma.area.findMany(),
  Atributos: await prisma.atributo.findMany(),
  AtributoHistorial: await prisma.atributoHistorial.findMany(),
  Clinicas: await prisma.clinica.findMany(),
  ClinicaHistorial: await prisma.clinicaHistorial.findMany(),
  Componentes: await prisma.componente.findMany(),
  Configuracion: await prisma.configuracion.findMany(),
  Consumibles: await prisma.consumible.findMany(),
  Equipos: await prisma.equipo.findMany(),
  HistorialItems: await prisma.historialItem.findMany(),
  Historico: await prisma.historico.findMany(),
  Images: await prisma.image.findMany(),
  InventarioItems: await prisma.inventarioItem.findMany(),
  Lubricaciones: await prisma.lubricacion.findMany(),
  OTbasico: await prisma.oTbasico.findMany(),
  OTConsumibles: await prisma.oTConsumible.findMany(),
  Ots: await prisma.ots.findMany(),
  Predictivos: await prisma.predictivo.findMany(),
  Procesos: await prisma.procesos.findMany(),
  ProcesosHistorial: await prisma.procesosHistorial.findMany(),
  Repuestos: await prisma.repuesto.findMany(),
  Users: await prisma.user.findMany(),
  Ubicaciones: await prisma.ubicacion.findMany(),
  Zonas: await prisma.zona.findMany(),
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
