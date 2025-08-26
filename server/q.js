require('dotenv').config(); // Cargar variables de entorno desde .env

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corregirFechas() {
  try {
    // Traer registros entre id 266 y 372 con año 2001
    const registros = await prisma.oTConsumible.findMany({
      where: {
        id: {
          gte: 266,
          lte: 372,
        },
        fechaCreacion: {
          gte: new Date('2001-01-01'),
          lt: new Date('2002-01-01'),
        },
      },
    });

    console.log(`Registros encontrados: ${registros.length}`);

    for (const registro of registros) {
      const fechaOriginal = registro.fechaCreacion;
      const nuevaFecha = new Date(fechaOriginal);
      nuevaFecha.setFullYear(2025); // Solo cambiar el año

      await prisma.oTConsumible.update({
        where: { id: registro.id },
        data: { fechaCreacion: nuevaFecha },
      });

      console.log(`Actualizado ID ${registro.id} → ${nuevaFecha.toISOString()}`);
    }

    console.log('✅ Fechas corregidas correctamente.');
  } catch (error) {
    console.error('❌ Error al corregir fechas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corregirFechas();
