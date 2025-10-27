require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Array de objetos con el 'id' del OTbasico y el nuevo 'tecnico2' a asignar
  // Basado en la imagen:
  const registrosParaActualizar = [
    { id: 39, nuevoTecnico2: '717571' },
    { id: 40, nuevoTecnico2: '720573' },
    { id: 41, nuevoTecnico2: '694835' },
    // Puedes agregar más registros aquí
  ];

  console.log(`Iniciando la actualización de ${registrosParaActualizar.length} registros de OTbasico...`);

  // Mapear el array a un array de promesas de actualización
  const actualizaciones = registrosParaActualizar.map(registro =>
    prisma.oTbasico.update({
      where: {
        id: registro.id,
      },
      data: {
        // Asegúrate de que el valor sea String, ya que el modelo OTbasico lo define como String
        tecnico2: registro.nuevoTecnico2, 
      },
    })
  );

  try {
    // Ejecutar todas las actualizaciones en una sola transacción
    const resultados = await prisma.$transaction(actualizaciones);
    
    console.log(`\n✅ ${resultados.length} registros de OTbasico actualizados exitosamente.`);
    
    // Opcional: Mostrar los IDs de los registros actualizados
    console.log('IDs actualizados:', resultados.map(r => r.id));
    
  } catch (error) {
    console.error('\n❌ Error al actualizar los registros de OTbasico. La transacción fue revertida:', error);
    // Si algún ID no existe o hay otro error, ninguno de los cambios se aplicará.
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });