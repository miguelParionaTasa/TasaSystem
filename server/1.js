require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const registros = [
{ name: "TPSU SepSol#4 Alfa Laval FPNX 728 (1000 H)", Temp: "CHIV2-25", OTmaximo: "731376", estado: "APPR", zonaId: 9, ubicacionId: 275, tecnico1: "pendi", tecnico2: "" },
{ name: "Caldero #1 SERV Reparación Espejo", Temp: "CHIV2-25", OTmaximo: "730729", estado: "APPR", zonaId: 11, ubicacionId: 379, tecnico1: "pendi", tecnico2: "" },
{ name: "Caldero #4 SERV Reparación Cono espejo", Temp: "CHIV2-25", OTmaximo: "730736", estado: "APPR", zonaId: 11, ubicacionId: 387, tecnico1: "pendi", tecnico2: "" },

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
