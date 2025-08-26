require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function insertOts() {
  const data = [
    {zonaId: 3, ubicacionId: 62, descripcionEquipo: "Sap al 5 agosto", userId: 1, ottId: "721894"},
{zonaId: 3, ubicacionId: 82, descripcionEquipo: "Sap al 5 agosto", userId: 1, ottId: "721919"},
{zonaId: 6, ubicacionId: 202, descripcionEquipo: "Sap al 5 agosto", userId: 1, ottId: "720831"},
{zonaId: 3, ubicacionId: 27, descripcionEquipo: "Sap al 5 agosto", userId: 1, ottId: "726239"},
{zonaId: 11, ubicacionId: 379, descripcionEquipo: "Sap al 5 agosto", userId: 1, ottId: "710642"},
{zonaId: 11, ubicacionId: 381, descripcionEquipo: "Sap al 5 agosto", userId: 1, ottId: "710644"},
{zonaId: 11, ubicacionId: 384, descripcionEquipo: "Sap al 5 agosto", userId: 1, ottId: "710646"},
{zonaId: 11, ubicacionId: 387, descripcionEquipo: "Sap al 5 agosto", userId: 1, ottId: "710648"},
{zonaId: 11, ubicacionId: 389, descripcionEquipo: "Sap al 5 agosto", userId: 1, ottId: "710652"},
{zonaId: 11, ubicacionId: 391, descripcionEquipo: "Sap al 5 agosto", userId: 1, ottId: "710654"},
{zonaId: 11, ubicacionId: 393, descripcionEquipo: "Sap al 5 agosto", userId: 1, ottId: "710656"},
{zonaId: 4, ubicacionId: 115, descripcionEquipo: "Sap al 5 agosto", userId: 1, ottId: "704071"},
{zonaId: 4, ubicacionId: 123, descripcionEquipo: "Sap al 5 agosto", userId: 1, ottId: "720232"},
{zonaId: 4, ubicacionId: 122, descripcionEquipo: "Sap al 5 agosto", userId: 1, ottId: "720230"},
{zonaId: 9, ubicacionId: 273, descripcionEquipo: "Sap al 5 agosto", userId: 1, ottId: "715049"},

  ];

  try {
    for (const item of data) {
      const ot = await prisma.ots.create({ data: item });
      console.log(`Insertado → ID: ${ot.id}, ottId: ${ot.ottId}`);
    }

    console.log('✅ Inserción de OTs completada.');
  } catch (error) {
    console.error('❌ Error al insertar OTs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertOts();
