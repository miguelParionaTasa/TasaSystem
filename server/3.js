require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const nuevoUsuario = await prisma.user.create({
      data: {
        firstName: "Juan",
        lastName: "Jimenez",
        areaId: 2,
        username: "43571219", // El usuario es el DNI
        password: "43571219", // La contraseña es el DNI tal cual
        isAdmin: false,
        isDeleted: false,
      },
    });

    console.log('Usuario creado con éxito:', nuevoUsuario);

  } catch (error) {
    console.error('Error al crear el usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
