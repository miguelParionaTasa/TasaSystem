const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  // Pega aquí las líneas generadas desde Excel
await prisma.OTConsumible.update({ where: { id: 61 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 77 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 85 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 86 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 87 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 88 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 89 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 90 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 91 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 92 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 93 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 96 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 98 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 103 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 106 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 118 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 121 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 172 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 189 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 214 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 237 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 239 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 267 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 268 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 272 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 281 }, data: { comentarios: "Falta Retirar" } });
await prisma.OTConsumible.update({ where: { id: 282 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 283 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 287 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 288 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 303 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 304 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 314 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 315 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 319 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 323 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 324 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 350 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 351 }, data: { comentarios: "Falta Retirar" } });
await prisma.OTConsumible.update({ where: { id: 355 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 371 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 377 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 390 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 398 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 399 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 402 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 404 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 407 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 422 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 428 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 431 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 432 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 434 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 435 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 436 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 438 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 445 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 447 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 448 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 449 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 451 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 452 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 453 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 455 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 460 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 467 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 475 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 482 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 489 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 500 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 508 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 515 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 524 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 531 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 538 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 543 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 544 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 547 }, data: { comentarios: "Sin Stock" } });
await prisma.OTConsumible.update({ where: { id: 548 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 553 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 554 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 569 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 570 }, data: { comentarios: "Retirado" } });
await prisma.OTConsumible.update({ where: { id: 595 }, data: { comentarios: "Retirado" } });

}

main()
  .then(async () => {
    console.log("Actualización completada");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
