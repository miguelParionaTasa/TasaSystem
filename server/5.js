require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Actualizar el apellido de Juan
    await prisma.user.update({
      where: { id: 2 }, // id de Juan
      data: { lastName: "Salas" },
    });
    console.log("Apellido de Juan actualizado a Salas");

    // Actualizar el apellido de Boris
    await prisma.user.update({
      where: { id: 3 }, // id de Boris
      data: { lastName: "Fernandez" },
    });
    console.log("Apellido de Boris actualizado a Fernandez");

  } catch (error) {
    console.error("Error actualizando los apellidos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
