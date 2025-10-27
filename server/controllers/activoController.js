// controllers/activoController.js
const prisma = require("./prisma");
const { cloudinary, uploadImage } = require("../config/cloudinary");

// 📤 Subir imagen asociada a un activo
const uploadActivoImage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ message: "ID inválido" });
    if (!req.file) return res.status(400).json({ message: "No se subió imagen" });

    // Subir imagen a Cloudinary
    const result = await uploadImage(req.file.buffer, "activos");

    // Registrar en BD
    const imageRecord = await prisma.image.create({
      data: {
        url: result.secure_url,
        activos: { connect: { id: Number(id) } },
      },
    });

    res.status(201).json(imageRecord);
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);
    res.status(500).json({ message: "Error al subir imagen" });
  }
};

// ➕ Crear un activo (con imagen opcional)
const createActivo = async (req, res) => {
  try {
    const { nombre, valor, valor2, marca, modelo, serie, zona, ubicacion, equipoId, userId } = req.body;

    if (!nombre || !userId) {
      return res.status(400).json({ message: "Campos requeridos faltantes" });
    }

    let imagesData = [];
    if (req.file) {
      const result = await uploadImage(req.file.buffer, "activos");
      imagesData.push({ url: result.secure_url });
    }

    const nuevoActivo = await prisma.activo.create({
      data: {
        nombre,
        valor: valor || null,
        valor2: valor2 || null,
        marca: marca || null,
        modelo: modelo || null,
        serie: serie || null,
        zona: zona || null,           // ✅ añadido
        ubicacion: ubicacion || null, // ✅ añadido
        userId: Number(userId),
        equipoId: equipoId ? Number(equipoId) : null,
        ...(imagesData.length > 0 && { images: { create: imagesData } }),
      },
      include: {
        images: true,
        equipo: { include: { ubicacion: { include: { zona: true } } } },
        user: true,
      },
    });

    res.status(201).json(nuevoActivo);
  } catch (error) {
    console.error("❌ Error al crear activo:", error);
    res.status(500).json({ message: "Error al crear activo" });
  }
};



// 📋 Obtener todos los activos
const getAllActivos = async (_, res) => {
  try {
    const activos = await prisma.activo.findMany({
      include: {
        equipo: { include: { ubicacion: { include: { zona: true } } } },
        user: true,
        images: true,
      },
      orderBy: { id: "desc" },
    });
    res.status(200).json(activos);
  } catch (error) {
    console.error("❌ Error al obtener activos:", error);
    res.status(500).json({ message: "Error al obtener activos" });
  }
};

// 🔍 Obtener un activo por ID
const getActivoById = async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  try {
    const activo = await prisma.activo.findUnique({
      where: { id: Number(id) },
      include: {
        equipo: { include: { ubicacion: { include: { zona: true } } } },
        user: true,
        images: true,
      },
    });

    if (!activo) return res.status(404).json({ message: "Activo no encontrado" });
    res.status(200).json(activo);
  } catch (error) {
    console.error("❌ Error al obtener activo:", error);
    res.status(500).json({ message: "Error al obtener activo" });
  }
};

// 🔄 Actualizar activo (con registro en historial)
// controllers/activoController.js


const updateActivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, descripcionNueva, ...data } = req.body;

    // 1️⃣ Buscar el activo actual antes de actualizar
    const activoAnterior = await prisma.activo.findUnique({
      where: { id: parseInt(id) },
    });

    if (!activoAnterior) {
      return res.status(404).json({ message: "Activo no encontrado" });
    }

    // 2️⃣ Actualizar el activo
    const activoActualizado = await prisma.activo.update({
      where: { id: parseInt(id) },
      data,
    });

    // 3️⃣ Registrar historial del cambio
    await prisma.activoHistorial.create({
      data: {
        activoId: parseInt(id),
        userId: parseInt(userId),
        valorAnterior: JSON.stringify(activoAnterior), // guarda snapshot previo
        valorNuevo: JSON.stringify(activoActualizado), // guarda snapshot nuevo
      },
    });

    res.status(200).json({ message: "Activo actualizado correctamente", activoActualizado });
  } catch (error) {
    console.error("❌ Error al actualizar activo:", error);
    res.status(500).json({ message: "Error al actualizar activo", error });
  }
};


// 🧹 Función auxiliar para eliminar imagen en Cloudinary
const deleteImageFromUrl = async (url) => {
  try {
    const parts = url.split("/");
    const folder = parts[parts.length - 2];
    const fileName = parts[parts.length - 1].split(".")[0];
    const publicId = `${folder}/${fileName}`;
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("🗑️ Imagen eliminada:", result);
  } catch (error) {
    console.error("❌ Error al eliminar imagen Cloudinary:", error);
  }
};

// 🗑️ Eliminar activo (con imágenes e historial)
const deleteActivo = async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  try {
    const activo = await prisma.activo.findUnique({
      where: { id: Number(id) },
      include: { images: true },
    });

    if (!activo) return res.status(404).json({ message: "Activo no encontrado" });

    // Eliminar imágenes de Cloudinary y BD
    for (const img of activo.images) await deleteImageFromUrl(img.url);
    await prisma.image.deleteMany({ where: { activos: { some: { id: activo.id } } } });

    // Eliminar historial
    await prisma.activoHistorial.deleteMany({ where: { activoId: activo.id } });

    // Eliminar activo
    await prisma.activo.delete({ where: { id: activo.id } });

    res.status(204).send();
  } catch (error) {
    console.error("❌ Error al eliminar activo:", error);
    res.status(500).json({ message: "Error al eliminar activo" });
  }
};

// 📜 Obtener historial de un activo
const getActivoHistorial = async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  try {
    const historial = await prisma.activoHistorial.findMany({
      where: { activoId: Number(id) },
      include: { user: true },
      orderBy: { fechaCambio: "desc" },
    });

    if (historial.length === 0)
      return res.status(404).json({ message: "No se encontró historial para este activo" });

    res.status(200).json(historial);
  } catch (error) {
    console.error("❌ Error al obtener historial:", error);
    res.status(500).json({ message: "Error al obtener historial del activo" });
  }
};

// 🔎 Búsqueda filtrada

const searchActivos = async (req, res) => {
  const { zonaId, ubicacionId, equipoId, nombre, placa, valor } = req.query;
  const placaBusqueda = (placa || valor)?.trim();

  try {
    const filtros = [];

    // =========================
    // Filtro por zona
    // =========================
    if (zonaId) {
      filtros.push({
        OR: [
          // Caso 1: texto libre en el campo 'zona' del activo
          { zona: { contains: String(zonaId), mode: "insensitive" } },
          // Caso 2: zona relacionada a través del equipo → ubicacion → zona
          { equipo: { ubicacion: { zona: { nombreMaximo: { contains: String(zonaId), mode: "insensitive" } } } } },
        ],
      });
    }

    // =========================
    // Filtro por ubicación
    // =========================
    if (ubicacionId) {
      filtros.push({
        OR: [
          { ubicacion: { contains: String(ubicacionId), mode: "insensitive" } }, // si activo lo tiene como texto
          { equipo: { ubicacionId: Number(ubicacionId) } }, // si viene de equipo
        ],
      });
    }

    // =========================
    // Filtro por equipo
    // =========================
    if (equipoId) {
      filtros.push({
        OR: [
          { equipoId: Number(equipoId) },
          { equipo: { id: Number(equipoId) } },
        ],
      });
    }

    // =========================
    // Filtro por nombre
    // =========================
    if (nombre) {
      filtros.push({
        nombre: { contains: nombre.trim(), mode: "insensitive" },
      });
    }

    // =========================
    // Filtro por placa/valor
    // =========================
    if (placaBusqueda) {
      filtros.push({
        AND: [
          { valor: { not: null } },
          { valor: { notIn: ["", "-"] } },
          { valor: { contains: placaBusqueda, mode: "insensitive" } },
        ],
      });
    }

    // =========================
    // Consulta principal
    // =========================
    const activos = await prisma.activo.findMany({
      where: filtros.length ? { AND: filtros } : {}, // si no hay filtros, trae todos
      include: {
        equipo: {
          include: {
            ubicacion: {
              include: { zona: true },
            },
          },
        },
        user: true,
        images: true,
      },
      orderBy: { nombre: "asc" },
    });

    if (!activos.length) {
      return res.status(404).json({ message: "No se encontraron activos con los filtros aplicados." });
    }

    res.status(200).json(activos);
  } catch (error) {
    console.error("❌ Error al buscar activos:", error);
    res.status(500).json({
      message: "Error al buscar activos",
      error: error.message,
    });
  }
};



module.exports = {
  createActivo,
  getAllActivos,
  getActivoById,
  updateActivo,
  deleteActivo,
  getActivoHistorial,
  uploadActivoImage,
  searchActivos,
};
