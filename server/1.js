require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function parseFechaExcelPeru(fechaStr) {
  const [dia, mes, anio] = fechaStr.split('/');
  return new Date(`${anio}-${mes}-${dia}T00:00:00-05:00`);
}

async function main() {
  const clinicasNuevas = [
    { nombre: 'NP Reemplazo paleta purificador harina', ot: '797067', ubicacionId: 727, fecha: parseFechaExcelPeru('30/04/2026'), valor: 'OTmaximo', userId: 1 },
    { nombre: 'NP Cambio de contactor y pusladores en caseta TDF 1', ot: '797065', ubicacionId: 955, fecha: parseFechaExcelPeru('30/04/2026'), valor: 'OTmaximo', userId: 1 },
    { nombre: 'NP Mantenimiento actuadores y posicionador de efectos', ot: '797063', ubicacionId: 776, fecha: parseFechaExcelPeru('30/04/2026'), valor: 'OTmaximo', userId: 1 }
  ];

  console.log('Insertando registros masivos en Clínica...');

  const resultado = await prisma.clinica.createMany({
    data: clinicasNuevas,
    skipDuplicates: true
  });

  console.log(`¡Éxito! Se guardaron ${resultado.count} registros en Clínica.`);
}

main()
  .catch((e) => {
    console.error('Error al insertar el bloque:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
