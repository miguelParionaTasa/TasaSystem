require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function insertConsumibles() {
  const data = [
{codMaximo:'31008166',name:'ABRAZADERA REGULABLE INOX.3/4',unidadMedida:'UN',nombreMaximo:'ABRAZADERA REGULABLE INOX.3/4',precio:1.3,},
{codMaximo:'34005937',name:'ACEITE SIMP DRIVE 5L#1002.195 A:34018474',unidadMedida:'UN',nombreMaximo:'ACEITE SIMP DRIVE 5L#1002.195 A:34018474',precio:1477.2,},
{codMaximo:'34003569',name:'INLET PIPE/TUB ALIMENT.#6120788094L',unidadMedida:'UN',nombreMaximo:'INLET PIPE/TUB ALIMENT.#6120788094L',precio:1905.8,},
{codMaximo:'34003214',name:'LAMELLAR RING (3UN) #1005.012.00',unidadMedida:'UN',nombreMaximo:'LAMELLAR RING (3UN) #1005.012.00',precio:227.04,},
{codMaximo:'34002531',name:'EMPAQ.P/VISOR VIDR.5/8"',unidadMedida:'UN',nombreMaximo:'EMPAQ.P/VISOR VIDR.5/8"',precio:20.73,},
{codMaximo:'34020976',name:'ACTUAD.VALV.GAS #SKP25.U12U1',unidadMedida:'UN',nombreMaximo:'ACTUAD.VALV.GAS #SKP25.U12U1',precio:2763.36,},
{codMaximo:'34003232',name:'O-RING #1012.171.60',unidadMedida:'UN',nombreMaximo:'O-RING #1012.171.60',precio:204.12,},
{codMaximo:'34003236',name:'O-RING #1012.291.60',unidadMedida:'UN',nombreMaximo:'O-RING #1012.291.60',precio:149.33,},
{codMaximo:'34003216',name:'LAMELLAR RING (2UN) #1005.102.40',unidadMedida:'UN',nombreMaximo:'LAMELLAR RING (2UN) #1005.102.40',precio:523.54,},
{codMaximo:'34003214',name:'LAMELLAR RING (3UN) #1005.012.00',unidadMedida:'UN',nombreMaximo:'LAMELLAR RING (3UN) #1005.012.00',precio:227.04,},
{codMaximo:'34003585',name:'TRANSFORMADOR IGNI.#1-832-00107',unidadMedida:'UN',nombreMaximo:'TRANSFORMADOR IGNI.#1-832-00107',precio:1758.04,},
{codMaximo:'34002814',name:'RECTANGULAR RING #190606',unidadMedida:'UN',nombreMaximo:'RECTANGULAR RING #190606',precio:18.88,},
{codMaximo:'34002872',name:'RECTANGULAR RING #72354',unidadMedida:'UN',nombreMaximo:'RECTANGULAR RING #72354',precio:284.54,},

  ];

  try {
    for (const item of data) {const existente = await prisma.consumible.findFirst({
        where: { codMaximo: item.codMaximo },
      });

      if (existente) {
        console.log(`Producto en base de datos → ${item.name}`);
        continue;
      }

      const nuevo = await prisma.consumible.create({ data: item });
      console.log(`Insertado → ${nuevo.name} (ID: ${nuevo.id})`);
    }

    console.log('✅ Proceso finalizado.');
  } catch (error) {
    console.error('❌ Error al insertar consumibles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertConsumibles();
