require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const registros = [
      {
        descripcionEquipo: "2do corte",
        zonaId: 12,
        ubicacionId: 451,
        userId: 1,
        ottId: "694786", // referencia OTbasico.OTmaximo
      },
      {
        descripcionEquipo: "2do corte",
        zonaId: 11,
        ubicacionId: 791,
        userId: 1,
        ottId: "711119", // referencia OTbasico.OTmaximo
      }
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
