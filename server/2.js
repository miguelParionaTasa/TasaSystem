require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Traer el último registro insertado
    const ultimo = await prisma.ots.findFirst({
      orderBy: { id: 'desc' },
      select: {
        id: true,
        ottId: true,
      },
    });

    if (ultimo) {
      console.log(`✅ Último registro -> ID: ${ultimo.id} | ottId: ${ultimo.ottId}`);
    } else {
      console.log("⚠️ No hay registros en la tabla Ots.");
    }
  } catch (error) {
    console.error("❌ Error al consultar el último registro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
