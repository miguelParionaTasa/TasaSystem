require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const registros = [
{ descripcionEquipo: '1er corte', zonaId: 11, ubicacionId: 379, userId: 1, ottId: '756944' },
{ descripcionEquipo: '1er corte', zonaId: 1, ubicacionId: 612, userId: 1, ottId: '762865' },
{ descripcionEquipo: '1er corte', zonaId: 1, ubicacionId: 915, userId: 1, ottId: '770913' },
{ descripcionEquipo: '1er corte', zonaId: 1, ubicacionId: 904, userId: 1, ottId: '770654' },
{ descripcionEquipo: '1er corte', zonaId: 1, ubicacionId: 910, userId: 1, ottId: '770874' },
{ descripcionEquipo: '1er corte', zonaId: 1, ubicacionId: 618, userId: 1, ottId: '770881' },
{ descripcionEquipo: '1er corte', zonaId: 3, ubicacionId: 688, userId: 1, ottId: '767322' },
{ descripcionEquipo: '1er corte', zonaId: 3, ubicacionId: 36, userId: 1, ottId: '767252' },
{ descripcionEquipo: '1er corte', zonaId: 3, ubicacionId: 682, userId: 1, ottId: '745235' },
{ descripcionEquipo: '1er corte', zonaId: 5, ubicacionId: 138, userId: 1, ottId: '759819' },
{ descripcionEquipo: '1er corte', zonaId: 5, ubicacionId: 144, userId: 1, ottId: '767375' },
{ descripcionEquipo: '1er corte', zonaId: 7, ubicacionId: 206, userId: 1, ottId: '745400' },
{ descripcionEquipo: '1er corte', zonaId: 7, ubicacionId: 209, userId: 1, ottId: '762379' },
{ descripcionEquipo: '1er corte', zonaId: 15, ubicacionId: 563, userId: 1, ottId: '747421' },
{ descripcionEquipo: '1er corte', zonaId: 15, ubicacionId: 550, userId: 1, ottId: '767358' },
{ descripcionEquipo: '1er corte', zonaId: 3, ubicacionId: 30, userId: 1, ottId: '709398' },
{ descripcionEquipo: '1er corte', zonaId: 4, ubicacionId: 115, userId: 1, ottId: '756906' },
{ descripcionEquipo: '1er corte', zonaId: 13, ubicacionId: 498, userId: 1, ottId: '772416' },
{ descripcionEquipo: '1er corte', zonaId: 3, ubicacionId: 87, userId: 1, ottId: '762361' },
{ descripcionEquipo: '1er corte', zonaId: 2, ubicacionId: 7, userId: 1, ottId: '772525' },
{ descripcionEquipo: '1er corte', zonaId: 9, ubicacionId: 283, userId: 1, ottId: '761281' },
{ descripcionEquipo: '1er corte', zonaId: 8, ubicacionId: 239, userId: 1, ottId: '767441' },
{ descripcionEquipo: '1er corte', zonaId: 8, ubicacionId: 239, userId: 1, ottId: '767443' },
{ descripcionEquipo: '1er corte', zonaId: 8, ubicacionId: 238, userId: 1, ottId: '767445' },
{ descripcionEquipo: '1er corte', zonaId: 1, ubicacionId: 611, userId: 1, ottId: '770888' },
{ descripcionEquipo: '1er corte', zonaId: 11, ubicacionId: 381, userId: 1, ottId: '756946' },
{ descripcionEquipo: '1er corte', zonaId: 11, ubicacionId: 384, userId: 1, ottId: '756948' },
{ descripcionEquipo: '1er corte', zonaId: 11, ubicacionId: 387, userId: 1, ottId: '756950' },
{ descripcionEquipo: '1er corte', zonaId: 11, ubicacionId: 389, userId: 1, ottId: '756954' },
{ descripcionEquipo: '1er corte', zonaId: 11, ubicacionId: 391, userId: 1, ottId: '756958' },
{ descripcionEquipo: '1er corte', zonaId: 11, ubicacionId: 393, userId: 1, ottId: '756960' },
{ descripcionEquipo: '1er corte', zonaId: 4, ubicacionId: 116, userId: 1, ottId: '767847' },
{ descripcionEquipo: '1er corte', zonaId: 1, ubicacionId: 612, userId: 1, ottId: '770924' },



    ];

    const result = await prisma.ots.createMany({
      data: registros,
      skipDuplicates: true, // evita error si ya existen
    });

    console.log(`✅ Registros insertados en Ots: ${result.count}`);
  } catch (error) {
    console.error("❌ Error al crear registros en Ots:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
