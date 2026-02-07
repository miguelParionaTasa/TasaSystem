const XLSX = require("xlsx");
const prisma = require("./prisma");

// ===============================
// 🔹 UTILIDAD PROFESIONAL FECHAS
// ===============================
const parseExcelDate = (value) => {
  if (!value) return null;

  let fecha = null;

  // ✅ Caso 1: Ya es Date válido
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  // ✅ Caso 2: Número serial Excel
  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    fecha = new Date(excelEpoch.getTime() + value * 86400000);
  }

  // ✅ Caso 3: String tipo 27/02/2026
  else if (typeof value === "string") {
    const limpio = value.trim();

    // formato dd/mm/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(limpio)) {
      const [dia, mes, anio] = limpio.split("/");
      fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
    } else {
      // intento automático (ISO u otros formatos)
      fecha = new Date(limpio);
    }
  }

  // Validación final
  if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
    return null;
  }

  return fecha;
};

// ===============================
// 🔹 IMPORTAR EXCEL (Snapshot OT)
// ===============================
const importExcel = async (req, res) => {
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
      return res.status(400).json({ error: "El archivo está vacío" });
    }

    // 🔥 Obtener OT únicas válidas
    const otUnicas = [
      ...new Set(
        rows
          .filter(r => r.otNumero)
          .map(r => String(r.otNumero).trim())
      )
    ];

    if (!otUnicas.length) {
      return res.status(400).json({ error: "No se encontraron OT válidas" });
    }

    // 🔄 Transformación segura
    const data = rows
      .filter(row => row.otNumero) // evitar filas basura
      .map(row => ({
        otNumero: String(row.otNumero).trim(),
        descripcionOT: row.descripcionOT || null,
        zona: row.zona || null,
        ubicacion: row.ubicacion || null,
        comentarioOT: row.comentarioOT || null,
        codigoMaterial: row.codigoMaterial
          ? String(row.codigoMaterial).trim()
          : null,
        nombreMaterial: row.nombreMaterial || null,
        unidadMedida: row.unidadMedida || null,
        cantidad: row.cantidad ? Number(row.cantidad) : 0,
        reservaSAP: row.reservaSAP
          ? String(row.reservaSAP).trim()
          : null,
        comentario: row.comentario || null,
        fechaPedido: parseExcelDate(row.fechaPedido)
      }));

    // 🔥 Transacción segura tipo snapshot
    await prisma.$transaction(async (tx) => {

      // 1️⃣ Borrar solo OTs que vienen en el Excel
      await tx.oTMovimientoSAP.deleteMany({
        where: {
          otNumero: { in: otUnicas }
        }
      });

      // 2️⃣ Insertar nuevos registros
      await tx.oTMovimientoSAP.createMany({
        data,
        skipDuplicates: true
      });

    });

    return res.json({
      message: "Importación exitosa",
      registrosInsertados: data.length,
      otsActualizadas: otUnicas.length
    });

  } catch (error) {
    console.error("❌ Error importando Excel:", error);

    return res.status(500).json({
      error: "Error importando Excel",
      detalle: error.message
    });
  }
};

// ===============================
// 🔹 Obtener todos
// ===============================
const getAllMovimientos = async (req, res) => {
  try {
    const movimientos = await prisma.oTMovimientoSAP.findMany({
      orderBy: { id: "desc" }
    });

    res.json(movimientos);
  } catch (error) {
    console.error("Error obteniendo movimientos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ===============================
// 🔹 Obtener por OT
// ===============================
const getMovimientosByOT = async (req, res) => {
  try {
    const { otNumero } = req.params;

    const movimientos = await prisma.oTMovimientoSAP.findMany({
      where: { otNumero: String(otNumero) },
      orderBy: { id: "desc" }
    });

    res.json(movimientos);
  } catch (error) {
    console.error("Error obteniendo movimientos por OT:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  importExcel,
  getAllMovimientos,
  getMovimientosByOT
};
