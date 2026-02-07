
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = [
    {name: 'TPSU_Mantto quemador y Calibrar Caldero Vapor#1', Temp: 'CHIV2-25', OTmaximo: '756944', estado: 'WAPPR', zonaId: 11, ubicacionId: 379, equipoId: null, tecnico1: 'Systema', tecnico2:''},
{name: 'T1-26 MP SABA Sistema Hidráulico LS', Temp: 'CHIV2-25', OTmaximo: '762865', estado: 'WAPPR', zonaId: 1, ubicacionId: 612, equipoId: null, tecnico1: 'Systema', tecnico2:''},

  ];

  const res = await prisma.oTbasico.createMany({
    data,
    skipDuplicates: true, // evita error si algún OTmaximo ya existe
  });

  console.log(`OTbasico insertados: ${res.count}`);
}

main()
  .catch((e) => {
    console.error('Error al insertar OTbasico:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
``
