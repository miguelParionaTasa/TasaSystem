require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Eliminar activos con ID entre 964 y 967
    const deleted = await prisma.activo.deleteMany({
      where: {
        id: { in: [964, 965, 966, 967] },
      },
    });

    console.log(`✅ Se eliminaron ${deleted.count} activos.`);
  } catch (error) {
    console.error("❌ Error al eliminar activos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
