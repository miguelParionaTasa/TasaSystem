require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const nuevoUsuario = await prisma.user.create({
      data: {
        firstName: "Miguel",
        lastName: "Pariona",
        areaId: 2, // Asumiendo que 2 es el ID del área correspondiente
        username: "70242478", // El usuario es el DNI
        password: "70242478", // La contraseña es el DNI tal cual
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