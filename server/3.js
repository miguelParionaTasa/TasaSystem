require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const registros = [
      { nombreConsumible: 'SOLDADURA INOX.AW E308L-16  1.60MM', unidadMedida: 'KG', consumibleSap: '31013865', cantidad: 0.5, otId: 319, userId: 1, comentarios: 'Retirado', reservaSap: '39338763', fechaCreacion: new Date("2026-01-10") },

    ];

    // Inserta registros uno por uno y devuelve los IDs creados
    for (const reg of registros) {
      const nuevo = await prisma.oTConsumible.create({
        data: reg,
      });
      console.log(`✅ Registro creado con ID: ${nuevo.id}, Nombre: ${nuevo.nombreConsumible}`);
    }
  } catch (error) {
    console.error("❌ Error al crear registros en OTConsumible:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
