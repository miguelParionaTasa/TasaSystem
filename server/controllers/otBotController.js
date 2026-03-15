const XLSX = require("xlsx");
const prisma = require("./prisma");

// ===============================
// 🔹 Función para serializar BigInt a string
// ===============================
const safeJson = (data) =>
  JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );

// ===============================
// 🔹 IMPORTAR EXCEL OT BOT
// ===============================
const importExcelOTBot = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió archivo" });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
      cellDates: true
    });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: null,
      raw: true
    });

    if (!rows.length) {
      return res.status(400).json({ error: "Excel vacío" });
    }

    // 🔹 Normalizar datos
    const dataExcel = rows
      .filter(r => r.otNumero)
      .map(r => ({
        otNumero: String(r.otNumero).trim(),
        descripcionOT: r.descripcionOT || null,
        zona: r.zona || null,
        ubicacion: r.ubicacion || null,
        avance: r.avance ? Number(r.avance) : 0,
        estado: r.estado || "WAPPR"
      }));

    // 🔹 Obtener OT existentes en UNA consulta
    const otNumeros = dataExcel.map(r => r.otNumero);

    const existentes = await prisma.oTBot.findMany({
      where: {
        otNumero: { in: otNumeros }
      },
      select: {
        id: true,
        otNumero: true
      }
    });

    // Convertir a mapa para búsqueda rápida
    const mapaExistentes = new Map(
      existentes.map(e => [e.otNumero, e.id])
    );

    const nuevas = [];
    const actualizar = [];

    for (const ot of dataExcel) {
      if (!mapaExistentes.has(ot.otNumero)) {
        nuevas.push(ot);
      } else {
        actualizar.push({
          id: mapaExistentes.get(ot.otNumero),
          ...ot
        });
      }
    }

    // 🔹 Insertar nuevas OT
    if (nuevas.length) {
      await prisma.oTBot.createMany({
        data: nuevas,
        skipDuplicates: true
      });
    }

    // 🔹 Actualizar existentes
    for (const ot of actualizar) {
      await prisma.oTBot.update({
        where: { id: ot.id },
        data: {
          descripcionOT: ot.descripcionOT,
          zona: ot.zona,
          ubicacion: ot.ubicacion,
          avance: ot.avance,
          estado: ot.estado
        }
      });
    }

    res.json(safeJson({
      message: "Importación completada",
      creadas: nuevas.length,
      actualizadas: actualizar.length
    }));

  } catch (error) {
    console.error("❌ Error importando Excel OTBot:", error);
    res.status(500).json({
      error: "Error importando Excel",
      detalle: error.message
    });
  }
};

// ===============================
// 🔹 Obtener todas las OT
// ===============================
const getAllOTBot = async (req, res) => {
  try {
    const ots = await prisma.oTBot.findMany({
      orderBy: { id: "desc" }
    });

    res.json(safeJson(ots));

  } catch (error) {
    console.error("Error obteniendo OTBot:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ===============================
// 🔹 Asignar OT a un usuario de Telegram
// ===============================
const asignarOT = async (req, res) => {
  try {
    const { otNumero, telegramUserId } = req.params;

    const userId = BigInt(telegramUserId); // userId sí puede ser BigInt
    const otNumStr = otNumero.toString().trim(); // ✅ OT como string

    // 1️⃣ Asegurar usuario en la DB
    await prisma.telegramUser.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, telegramId: telegramUserId }
    });

    // 2️⃣ Verificar OT
    const otExiste = await prisma.oTBot.findUnique({
      where: { otNumero: otNumStr }
    });

    if (!otExiste) {
      return res.status(404).json({ error: "OT no encontrada" });
    }

    // 3️⃣ Verificar si ya está asignada
    if (otExiste.telegramUserId) {
      return res.status(400).json({ error: "OT ya asignada" });
    }

    // 4️⃣ Asignar OT
    const otActualizada = await prisma.oTBot.update({
      where: { otNumero: otNumStr },
      data: { telegramUserId: userId }
    });

    res.json(safeJson(otActualizada));

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error asignando OT" });
  }
};

// ===============================
// 🔹 Obtener OT por número
// ===============================
const getOTByNumero = async (req, res) => {
  try {
    const { otNumero } = req.params;

    // Buscar OT
    const ot = await prisma.oTBot.findUnique({
      where: { otNumero: otNumero.toString() }, // asegurar string
    });

    if (!ot) {
      return res.status(404).json({ error: "OT no encontrada" });
    }

    // Convertir BigInt a string y fechas a ISO
    const otSerializable = {
      ...ot,
      id: ot.id.toString(),
      telegramUserId: ot.telegramUserId ? ot.telegramUserId.toString() : null,
      fechaCreacion: ot.fechaCreacion ? ot.fechaCreacion.toISOString() : null,
      fechaActualiza: ot.fechaActualiza ? ot.fechaActualiza.toISOString() : null,
    };

    res.json(otSerializable);

  } catch (error) {
    console.error("Error en getOTByNumero:", error);
    res.status(500).json({ error: "Error buscando OT" });
  }
};
const crearOTConsumible = async (req, res) => {
  try {
    const { otNumero, material, cantidad, unidadMedida, codMaximo, telegramUserId } = req.body;

    // Validar datos obligatorios
    if (!otNumero || !material) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    // Buscar la OT por número (usar el campo correcto otNumero)
    const ot = await prisma.oTBot.findUnique({
      where: { otNumero } // ✅ corregido
    });

    if (!ot) {
      return res.status(404).json({ message: "OT no encontrada" });
    }

    // Crear el consumible
    const nuevoConsumible = await prisma.oTConsumibleBot.create({
      data: {
        otBotId: ot.id,
        nombreConsumible: material,
        cantidad: cantidad ? parseFloat(cantidad) : 0, // convertir a Float si viene
        unidadMedida: unidadMedida || "",
        comentarios: codMaximo || "",
        fechaCreacion: new Date()
      }
    });

    res.status(201).json(nuevoConsumible);
  } catch (error) {
    console.error("Error en crearOTConsumible:", error);
    res.status(500).json({ message: "Error al crear consumible" });
  }
};
const obtenerOTConsumibles = async (req, res) => {
  try {
    const consumibles = await prisma.oTConsumibleBot.findMany({
      orderBy: { fechaCreacion: "desc" }, // opcional: los más recientes primero
    });

    res.json(consumibles);
  } catch (error) {
    console.error("Error en obtenerOTConsumibles:", error);
    res.status(500).json({ message: "Error al obtener consumibles" });
  }
};
module.exports = {
  importExcelOTBot,
  getAllOTBot,
  getOTByNumero,
  asignarOT,
  crearOTConsumible,
  obtenerOTConsumibles
};