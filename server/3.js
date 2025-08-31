require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const registros = [
    { nombreConsumible: "ACEROS/METALES", unidadMedida: "UN", consumibleSap: "BSU-700081", cantidad: 1, otId: 139, userId: 1, comentarios: "Falta Retirar", reservaSap: "36879404", fechaCreacion: new Date("2025-08-02") },
{ nombreConsumible: "VALV.", unidadMedida: "UN", consumibleSap: "BSU-700122", cantidad: 26, otId: 140, userId: 1, comentarios: "Sin Stock", reservaSap: "37561694", fechaCreacion: new Date("2025-07-30") },
{ nombreConsumible: "VALV.BOLA BCE.CROMADO NPT 150PSI 1 1/2plgd", unidadMedida: "UN", consumibleSap: "31014953", cantidad: 1, otId: 141, userId: 1, comentarios: "Retirado", reservaSap: "37483820", fechaCreacion: new Date("2025-07-30") },
{ nombreConsumible: "PLUMON INDELEBLE PTA.GRUESA NEGRO", unidadMedida: "UN", consumibleSap: "32005548", cantidad: 1, otId: 141, userId: 1, comentarios: "Retirado", reservaSap: "37483820", fechaCreacion: new Date("2025-07-30") },
{ nombreConsumible: "VALV.", unidadMedida: "UN", consumibleSap: "BSU-700122", cantidad: 4, otId: 141, userId: 1, comentarios: "Sin Stock", reservaSap: "37561695", fechaCreacion: new Date("2025-07-30") },
{ nombreConsumible: "OXIGENO IND.", unidadMedida: "M3", consumibleSap: "31003986", cantidad: 10, otId: 142, userId: 1, comentarios: "Retirado", reservaSap: "37483105", fechaCreacion: new Date("2025-07-28") },
{ nombreConsumible: "SOLDADURA CELLOCORD AP E6011 3.25MM", unidadMedida: "KG", consumibleSap: "31013855", cantidad: 2, otId: 142, userId: 1, comentarios: "Retirado", reservaSap: "37483105", fechaCreacion: new Date("2025-07-28") },
{ nombreConsumible: "SOLDADURA CELLOCORD AP E6011 3.25MM", unidadMedida: "KG", consumibleSap: "31013855", cantidad: 2, otId: 142, userId: 1, comentarios: "Retirado", reservaSap: "37489726", fechaCreacion: new Date("2025-07-28") },
{ nombreConsumible: "DISCO CORTE FE.1/8plgdX7/8plgdX4 1/2plgd", unidadMedida: "UN", consumibleSap: "31009820", cantidad: 2, otId: 142, userId: 1, comentarios: "Retirado", reservaSap: "37489726", fechaCreacion: new Date("2025-07-28") },
{ nombreConsumible: "PLATINA AC.NAVAL 3/8plgdX2plgdX20plgd", unidadMedida: "UN", consumibleSap: "31013414", cantidad: 11, otId: 142, userId: 1, comentarios: "Sin Stock", reservaSap: "37490208", fechaCreacion: new Date("2025-07-28") },
{ nombreConsumible: "TRAPO IND.", unidadMedida: "KG", consumibleSap: "32005362", cantidad: 2, otId: 143, userId: 1, comentarios: "Retirado", reservaSap: "37481962", fechaCreacion: new Date("2025-08-26") },
{ nombreConsumible: "LIJA FIERRO NRO.40-3", unidadMedida: "UN", consumibleSap: "31015349", cantidad: 5, otId: 143, userId: 1, comentarios: "Retirado", reservaSap: "37481962", fechaCreacion: new Date("2025-08-26") },
{ nombreConsumible: "SOLVENTE DIELEC.SQP-66-NF 1GL", unidadMedida: "GLN", consumibleSap: "31013902", cantidad: 1, otId: 143, userId: 1, comentarios: "Retirado", reservaSap: "37481962", fechaCreacion: new Date("2025-08-26") },
{ nombreConsumible: "LIJA AGUA NRO.120-3/0", unidadMedida: "UN", consumibleSap: "31015419", cantidad: 5, otId: 143, userId: 1, comentarios: "Retirado", reservaSap: "37481962", fechaCreacion: new Date("2025-08-26") },
{ nombreConsumible: "RODAMIENTO NU 1020 ML/C3", unidadMedida: "UN", consumibleSap: "33042454", cantidad: 1, otId: 144, userId: 1, comentarios: "Retirado", reservaSap: "37443877", fechaCreacion: new Date("2025-09-15") },
{ nombreConsumible: "SOLDADURA CELLOCORD AP E6011 3.25MM", unidadMedida: "KG", consumibleSap: "31013855", cantidad: 2, otId: 145, userId: 1, comentarios: "Retirado", reservaSap: "37482274", fechaCreacion: new Date("2025-09-08") },
{ nombreConsumible: "SOLDADURA SUPERCITO E7018 3.25MM 25KG", unidadMedida: "KG", consumibleSap: "31013874", cantidad: 2, otId: 145, userId: 1, comentarios: "Retirado", reservaSap: "37482274", fechaCreacion: new Date("2025-09-08") },
{ nombreConsumible: "SOLDADURA CELLOCORD AP E6011 3.25MM", unidadMedida: "KG", consumibleSap: "31013855", cantidad: 2, otId: 145, userId: 1, comentarios: "Retirado", reservaSap: "37483054", fechaCreacion: new Date("2025-09-08") },
{ nombreConsumible: "SOLDADURA SUPERCITO E7018 3.25MM 25KG", unidadMedida: "KG", consumibleSap: "31013874", cantidad: 2, otId: 145, userId: 1, comentarios: "Retirado", reservaSap: "37483054", fechaCreacion: new Date("2025-09-08") },
{ nombreConsumible: "LOCTITE P/O-RINGS LOC-495.5", unidadMedida: "UN", consumibleSap: "31011357", cantidad: 1, otId: 145, userId: 1, comentarios: "Retirado", reservaSap: "37482278", fechaCreacion: new Date("2025-09-08") },
{ nombreConsumible: "SILICONA ROJA", unidadMedida: "UN", consumibleSap: "31015444", cantidad: 1, otId: 146, userId: 1, comentarios: "Retirado", reservaSap: "37483746", fechaCreacion: new Date("2025-09-15") },
{ nombreConsumible: "SOLDADURA INOX.AW E308L-16 2.50MM", unidadMedida: "KG", consumibleSap: "31013867", cantidad: 1, otId: 147, userId: 1, comentarios: "Retirado", reservaSap: "37483055", fechaCreacion: new Date("2025-08-28") },
{ nombreConsumible: "DISCO CORTE INOX.1/8plgdX7/8plgdX7plgd", unidadMedida: "UN", consumibleSap: "31009823", cantidad: 2, otId: 147, userId: 1, comentarios: "Retirado", reservaSap: "37483055", fechaCreacion: new Date("2025-08-28") },
{ nombreConsumible: "ESCOBILLA COPA FE.2 1/2plgd", unidadMedida: "UN", consumibleSap: "31010191", cantidad: 2, otId: 148, userId: 1, comentarios: "Retirado", reservaSap: "37483596", fechaCreacion: new Date("2025-08-18") },
{ nombreConsumible: "LIJA CIRC.NRO.40  Ø4 1/2plgd", unidadMedida: "UN", consumibleSap: "31032194", cantidad: 2, otId: 148, userId: 1, comentarios: "Retirado", reservaSap: "37483596", fechaCreacion: new Date("2025-08-18") },
{ nombreConsumible: "BROCHA NY. 2plgd", unidadMedida: "UN", consumibleSap: "31015363", cantidad: 2, otId: 149, userId: 1, comentarios: "Retirado", reservaSap: "37483048", fechaCreacion: new Date("2025-08-18") },
{ nombreConsumible: "MATERIAL EN CUSTODIA ALMACÉN UI 2025", unidadMedida: "UN", consumibleSap: "BSU-002025", cantidad: 6, otId: 150, userId: 1, comentarios: "Retirado", reservaSap: "37482304", fechaCreacion: new Date("2025-08-24") },
{ nombreConsumible: "MANGUITO FIJACION OH 3048 H", unidadMedida: "UN", consumibleSap: "33034911", cantidad: 1, otId: 151, userId: 1, comentarios: "Sin Stock", reservaSap: "37490201", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "EMPAQ.JEBE Y LONA 1/8plgdX1MT", unidadMedida: "M", consumibleSap: "31032197", cantidad: 2, otId: 152, userId: 1, comentarios: "Retirado", reservaSap: "37489923", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "DISCO CORTE INOX.1/8plgdX7/8plgdX7plgd", unidadMedida: "UN", consumibleSap: "31009823", cantidad: 2, otId: 152, userId: 1, comentarios: "Retirado", reservaSap: "37489923", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "SOLDADURA INOX.AW E308L-16 2.50MM", unidadMedida: "KG", consumibleSap: "31013867", cantidad: 1, otId: 152, userId: 1, comentarios: "Retirado", reservaSap: "37489923", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "DISCO CORTE INOX.1/8plgdX7/8plgdX4 1/2plgd", unidadMedida: "UN", consumibleSap: "31009821", cantidad: 2, otId: 152, userId: 1, comentarios: "Retirado", reservaSap: "37489923", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "LUBRICANTE MULTIUSO WD40", unidadMedida: "UN", consumibleSap: "30000506", cantidad: 1, otId: 153, userId: 1, comentarios: "Retirado", reservaSap: "37489809", fechaCreacion: new Date("2025-08-26") },
{ nombreConsumible: "TRAPO IND.", unidadMedida: "KG", consumibleSap: "32005362", cantidad: 2, otId: 153, userId: 1, comentarios: "Retirado", reservaSap: "37489809", fechaCreacion: new Date("2025-08-26") },
{ nombreConsumible: "CINTA TEFL.1/2plgd", unidadMedida: "ROL", consumibleSap: "31015439", cantidad: 4, otId: 153, userId: 1, comentarios: "Retirado", reservaSap: "37489809", fechaCreacion: new Date("2025-08-26") },
{ nombreConsumible: "SOLDADURA INOX.AW E308L-16 2.50MM", unidadMedida: "KG", consumibleSap: "31013867", cantidad: 2, otId: 154, userId: 1, comentarios: "Retirado", reservaSap: "37483056", fechaCreacion: new Date("2025-08-27") },
{ nombreConsumible: "DISCO CORTE INOX.1/8plgdX7/8plgdX4 1/2plgd", unidadMedida: "UN", consumibleSap: "31009821", cantidad: 2, otId: 154, userId: 1, comentarios: "Retirado", reservaSap: "37483056", fechaCreacion: new Date("2025-08-27") },
{ nombreConsumible: "ELIMINADOR D/AIRE TRAMPA VAP. HC", unidadMedida: "UN", consumibleSap: "33053224", cantidad: 2, otId: 155, userId: 1, comentarios: "Sin Stock", reservaSap: "37482235", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "CORRECTOR LIQUID PAPER (TIPO LAPICERO)", unidadMedida: "FCO", consumibleSap: "32004042", cantidad: 2, otId: 156, userId: 1, comentarios: "Retirado", reservaSap: "37490137", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "PLUMON INDELEBLE PTA.GRUESA NEGRO", unidadMedida: "UN", consumibleSap: "32005548", cantidad: 2, otId: 156, userId: 1, comentarios: "Retirado", reservaSap: "37490137", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "OXIGENO IND.", unidadMedida: "M3", consumibleSap: "31003986", cantidad: 10, otId: 157, userId: 1, comentarios: "Retirado", reservaSap: "37483787", fechaCreacion: new Date("2025-07-30") },
{ nombreConsumible: "LUBRICANTE MULTIUSO WD40", unidadMedida: "UN", consumibleSap: "30000506", cantidad: 1, otId: 157, userId: 1, comentarios: "Retirado", reservaSap: "37483787", fechaCreacion: new Date("2025-07-30") },
{ nombreConsumible: "TRAPO IND.", unidadMedida: "KG", consumibleSap: "32005362", cantidad: 1, otId: 157, userId: 1, comentarios: "Retirado", reservaSap: "37483787", fechaCreacion: new Date("2025-07-30") },
{ nombreConsumible: "BOQUILLA  CORTE PLASMA P/T  9-8210", unidadMedida: "UN", consumibleSap: "31008885", cantidad: 1, otId: 157, userId: 1, comentarios: "Retirado", reservaSap: "37483787", fechaCreacion: new Date("2025-07-30") },
{ nombreConsumible: "ELECTRODO CORTE PLASMA P/T  9-8215", unidadMedida: "UN", consumibleSap: "31009898", cantidad: 1, otId: 157, userId: 1, comentarios: "Retirado", reservaSap: "37483787", fechaCreacion: new Date("2025-07-30") },
{ nombreConsumible: "DISCO DESBASTE INOX.1/4plgdX7/8plgdX 4 1/2plgd", unidadMedida: "UN", consumibleSap: "31009837", cantidad: 1, otId: 157, userId: 1, comentarios: "Retirado", reservaSap: "37483787", fechaCreacion: new Date("2025-07-30") },
{ nombreConsumible: "DISCO CORTE INOX.1/8plgdX7/8plgdX7plgd", unidadMedida: "UN", consumibleSap: "31009823", cantidad: 2, otId: 157, userId: 1, comentarios: "Retirado", reservaSap: "37483787", fechaCreacion: new Date("2025-07-30") },
{ nombreConsumible: "TIZA P/MARCAR METALES (CALDERERO)", unidadMedida: "UN", consumibleSap: "31015445", cantidad: 1, otId: 157, userId: 1, comentarios: "Retirado", reservaSap: "37483787", fechaCreacion: new Date("2025-07-30") },
{ nombreConsumible: "CABLE AUTOMOTRIZ GPT 10AWG", unidadMedida: "M", consumibleSap: "33061987", cantidad: 100, otId: 158, userId: 1, comentarios: "Sin Stock", reservaSap: "37483944", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "TERMINALES STARFIX 10MM2", unidadMedida: "UN", consumibleSap: "33061990", cantidad: 500, otId: 158, userId: 1, comentarios: "Sin Stock", reservaSap: "37483944", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "CAJA CONDULET LB 1plgd", unidadMedida: "UN", consumibleSap: "33030804", cantidad: 3, otId: 159, userId: 1, comentarios: "Sin Stock", reservaSap: "37483241", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "CONECTOR RAPIDO REC. PASAMURO OD 12 MM", unidadMedida: "UN", consumibleSap: "33042204", cantidad: 4, otId: 160, userId: 1, comentarios: "Sin Stock", reservaSap: "37483242", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "AEROSOL BARNIZ TRANSP. 1601-3M", unidadMedida: "FCO", consumibleSap: "31008292", cantidad: 2, otId: 161, userId: 1, comentarios: "Sin Stock", reservaSap: "37483247", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "GUARDAMOTOR GV3P25 17-25A", unidadMedida: "UN", consumibleSap: "33061989", cantidad: 1, otId: 162, userId: 1, comentarios: "Sin Stock", reservaSap: "37483945", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "CONTACTOR LC1D80M7 80A 1NA+1NC AC3 220VA", unidadMedida: "UN", consumibleSap: "33061988", cantidad: 1, otId: 162, userId: 1, comentarios: "Sin Stock", reservaSap: "37483945", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "CINTA AISLANTE 3/4plgdX18MT TEMFLEX 1700", unidadMedida: "ROL", consumibleSap: "31032187", cantidad: 2, otId: 163, userId: 1, comentarios: "Retirado", reservaSap: "37483597", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "LIMPIACONTACTOS ELECTRICOS/ELECT.", unidadMedida: "UN", consumibleSap: "31011265", cantidad: 2, otId: 163, userId: 1, comentarios: "Retirado", reservaSap: "37483597", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "LIJA AGUA NRO.220-6/0", unidadMedida: "UN", consumibleSap: "31015347", cantidad: 2, otId: 163, userId: 1, comentarios: "Retirado", reservaSap: "37483597", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "MACHO UNC 3/16plgd (JGO.3PZA)", unidadMedida: "JGO", consumibleSap: "31011384", cantidad: 1, otId: 163, userId: 1, comentarios: "Sin Stock", reservaSap: "37483238", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "CABLE AUTOMOTRIZ GPT 10AWG", unidadMedida: "M", consumibleSap: "33061987", cantidad: 100, otId: 163, userId: 1, comentarios: "Sin Stock", reservaSap: "37483946", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "LUBRICANTE MULTIUSO WD40", unidadMedida: "UN", consumibleSap: "30000506", cantidad: 1, otId: 164, userId: 1, comentarios: "Retirado", reservaSap: "37482225", fechaCreacion: new Date("2025-09-25") },
{ nombreConsumible: "MATERIAL EN CUSTODIA ALMACÉN UI 2025", unidadMedida: "UN", consumibleSap: "BSU-002025", cantidad: 2, otId: 165, userId: 1, comentarios: "Retirado", reservaSap: "37482678", fechaCreacion: new Date("2025-08-25") },
{ nombreConsumible: "CABLE VULCANIZADO NLT 4X14AWG", unidadMedida: "M", consumibleSap: "33042165", cantidad: 85, otId: 166, userId: 1, comentarios: "Sin Stock", reservaSap: "37490143", fechaCreacion: new Date("2025-09-11") },
{ nombreConsumible: "RODAMIENTO 6206 2Z/C3", unidadMedida: "UN", consumibleSap: "33041088", cantidad: 2, otId: 167, userId: 1, comentarios: "Sin Stock", reservaSap: "37483864", fechaCreacion: new Date("2025-09-05") },
{ nombreConsumible: "RODAMIENTO 6207 2Z/C3", unidadMedida: "UN", consumibleSap: "33041091", cantidad: 1, otId: 168, userId: 1, comentarios: "Falta Retirar", reservaSap: "37483863", fechaCreacion: new Date("2025-10-03") },
{ nombreConsumible: "RODAMIENTO 6307 2Z/C3", unidadMedida: "UN", consumibleSap: "33041126", cantidad: 1, otId: 168, userId: 1, comentarios: "Falta Retirar", reservaSap: "37483863", fechaCreacion: new Date("2025-10-03") },
{ nombreConsumible: "RODAMIENTO 6205 2Z/C3", unidadMedida: "UN", consumibleSap: "33041083", cantidad: 2, otId: 169, userId: 1, comentarios: "Sin Stock", reservaSap: "37482864", fechaCreacion: new Date("2025-09-05") },
{ nombreConsumible: "RODAMIENTO 6203 2Z/C3", unidadMedida: "UN", consumibleSap: "33041072", cantidad: 2, otId: 169, userId: 1, comentarios: "Sin Stock", reservaSap: "37482864", fechaCreacion: new Date("2025-09-05") },
{ nombreConsumible: "RODAMIENTO 6203 2Z/C3", unidadMedida: "UN", consumibleSap: "33041072", cantidad: 1, otId: 169, userId: 1, comentarios: "Sin Stock", reservaSap: "37483113", fechaCreacion: new Date("2025-09-05") },
{ nombreConsumible: "LIJA AGUA NRO.180-5/0", unidadMedida: "UN", consumibleSap: "31015346", cantidad: 2, otId: 170, userId: 1, comentarios: "Retirado", reservaSap: "37483701", fechaCreacion: new Date("2025-09-05") },
{ nombreConsumible: "LIJA AGUA NRO.400 10/0-A", unidadMedida: "UN", consumibleSap: "31015348", cantidad: 2, otId: 170, userId: 1, comentarios: "Retirado", reservaSap: "37483701", fechaCreacion: new Date("2025-09-05") },
{ nombreConsumible: "LIJA FIERRO NRO.120-1/2", unidadMedida: "UN", consumibleSap: "31015425", cantidad: 2, otId: 170, userId: 1, comentarios: "Retirado", reservaSap: "37483701", fechaCreacion: new Date("2025-09-05") },
{ nombreConsumible: "SOLVENTE DIELEC.SQP-66-NF 1GL", unidadMedida: "GLN", consumibleSap: "31013902", cantidad: 1, otId: 170, userId: 1, comentarios: "Retirado", reservaSap: "37483701", fechaCreacion: new Date("2025-09-05") },
{ nombreConsumible: "BROCHA NY. 3plgd", unidadMedida: "UN", consumibleSap: "31015543", cantidad: 1, otId: 170, userId: 1, comentarios: "Retirado", reservaSap: "37483701", fechaCreacion: new Date("2025-09-05") },
{ nombreConsumible: "TRAPO IND.", unidadMedida: "KG", consumibleSap: "32005362", cantidad: 2, otId: 170, userId: 1, comentarios: "Retirado", reservaSap: "37483701", fechaCreacion: new Date("2025-09-05") },
{ nombreConsumible: "LUBRICANTE MULTIUSO WD40", unidadMedida: "UN", consumibleSap: "30000506", cantidad: 1, otId: 170, userId: 1, comentarios: "Retirado", reservaSap: "37483701", fechaCreacion: new Date("2025-09-05") },
{ nombreConsumible: "BROCHA NY. 2plgd", unidadMedida: "UN", consumibleSap: "31015363", cantidad: 1, otId: 170, userId: 1, comentarios: "Retirado", reservaSap: "37483702", fechaCreacion: new Date("2025-09-05") },
{ nombreConsumible: "PILA ALCALINA TIPO AAA", unidadMedida: "UN", consumibleSap: "33059393", cantidad: 7, otId: 171, userId: 1, comentarios: "Retirado", reservaSap: "37482717", fechaCreacion: new Date("2025-09-05") },
{ nombreConsumible: "TORNILLO STOVE BOLT INOX.M6X35", unidadMedida: "UN", consumibleSap: "31033828", cantidad: 32, otId: 171, userId: 1, comentarios: "Sin Stock", reservaSap: "37483398", fechaCreacion: new Date("2025-09-05") },
{ nombreConsumible: "SILICONA ROJA", unidadMedida: "UN", consumibleSap: "31015444", cantidad: 2, otId: 172, userId: 1, comentarios: "Retirado", reservaSap: "37489728", fechaCreacion: new Date("2025-09-15") },
{ nombreConsumible: "SOLDADURA INOX.AW E308L-16 2.50MM", unidadMedida: "KG", consumibleSap: "31013867", cantidad: 2, otId: 173, userId: 1, comentarios: "Retirado", reservaSap: "37483051", fechaCreacion: new Date("2025-10-10") },
{ nombreConsumible: "VALV.", unidadMedida: "UN", consumibleSap: "BSU-700122", cantidad: 2, otId: 174, userId: 1, comentarios: "Sin Stock", reservaSap: "37561693", fechaCreacion: new Date("2025-09-21") },

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
