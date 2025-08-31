require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const registros = [
      {
        name: "TPSU SepSol#2 Alfa Laval FPNX 934 (XXXX H)",
        Temp: "CHIV2-25",
        OTmaximo: "715045",
        estado: "APPR",
        zonaId: 9,
        ubicacionId: 271,
        tecnico1: "Operador",
        tecnico2: ""
      },
      {
        name: "Caldero #1 VALV. REG GAS Mtto y Calib",
        Temp: "CHIV2-25",
        OTmaximo: "730720",
        estado: "APPR",
        zonaId: 11,
        ubicacionId: 379,
        tecnico1: "Operador",
        tecnico2: ""
      }
    ];

    const result = await prisma.OTbasico.createMany({
      data: registros,
      skipDuplicates: true, // evita error si el OTmaximo ya existe (porque es único)
    });

    console.log(`✅ Registros insertados: ${result.count}`);
  } catch (error) {
    console.error("❌ Error al crear registros:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
