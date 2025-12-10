require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const registros = [
      
    ];

    const result = await prisma.tarjetaRoja.createMany({
      data: registros,
      skipDuplicates: true
    });

    console.log(`✅ Registros insertados en TarjetaRoja: ${result.count}`);
  } catch (error) {
    console.error("❌ Error al crear registros en TarjetaRoja:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
