require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const registros = [
{ descripcionEquipo: "3er corte", zonaId: 1, ubicacionId: 625, userId: 1, ottId: "702251" },


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
