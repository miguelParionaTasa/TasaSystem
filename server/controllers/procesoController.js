const prisma = require("./prisma");
const { cloudinary, uploadImage } = require("../config/cloudinary");

//
// 📸 Subir imagen de proceso
//
const uploadprocesoImage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: "No se subió imagen" });

    const result = await uploadImage(req.file.buffer, "procesos");

    const newImage = await prisma.image.create({
      data: {
        url: result.secure_url,
        procesos: { connect: { id: parseInt(id) } },
      },
    });

    res.status(201).json(newImage);
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);
    res.status(500).json({ message: "Error al subir imagen" });
  }
};

//
// 🟢 Crear proceso
//
const createproceso = async (req, res) => {
  try {
    const { nombre, valor, ubicacionId, userId } = req.body;

    if (!nombre || !ubicacionId)
      return res.status(400).json({ message: "Faltan datos obligatorios: nombre o ubicación" });

    let imagesData = [];
    if (req.file) {
      const result = await uploadImage(req.file.buffer, "procesos");
      imagesData.push({ url: result.secure_url });
    }

    const proceso = await prisma.procesos.create({
      data: {
        nombre,
        valor,
        userId: userId ? parseInt(userId) : null,
        ubicacionId: parseInt(ubicacionId),
        ...(imagesData.length > 0 && { images: { create: imagesData } }),
      },
      include: { images: true, ubicacion: { include: { zona: true } }, user: true },
    });

    res.status(201).json(proceso);
  } catch (error) {
    console.error("❌ Error al crear proceso:", error);
    res.status(500).json({ message: "Error al crear proceso" });
  }
};

//
// 📋 Obtener todos los procesos
//
const getAllprocesos = async (req, res) => {
  try {
    const procesos = await prisma.procesos.findMany({
      include: {
        ubicacion: { include: { zona: true } },
        user: true,
        images: true,
      },
      orderBy: { id: "desc" },
    });
    res.status(200).json(procesos);
  } catch (error) {
    console.error("❌ Error al obtener procesos:", error);
    res.status(500).json({ message: "Error al obtener procesos" });
  }
};

//
// 🔍 Obtener proceso por ID
//
const getprocesoById = async (req, res) => {
  try {
    const { id } = req.params;
    const proceso = await prisma.procesos.findUnique({
      where: { id: parseInt(id) },
      include: {
        ubicacion: { include: { zona: true } },
        user: true,
        images: true,
      },
    });

    if (!proceso) return res.status(404).json({ message: "Proceso no encontrado" });
    res.status(200).json(proceso);
  } catch (error) {
    console.error("❌ Error al obtener proceso:", error);
    res.status(500).json({ message: "Error al obtener proceso" });
  }
};

//
// ✏️ Actualizar proceso (con historial)
//
const updateproceso = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, valor, userId, ubicacionId } = req.body;

    const procesoActual = await prisma.procesos.findUnique({ where: { id: parseInt(id) } });
    if (!procesoActual) return res.status(404).json({ message: "Proceso no encontrado" });

    // Registrar en historial
    await prisma.procesosHistorial.create({
      data: {
        proceso: { connect: { id: procesoActual.id } },
        valorAnterior: procesoActual.valor ?? "",
        valorNuevo: valor ?? procesoActual.valor ?? "",
        user: { connect: { id: Number(userId) } },
      },
    });

    // Actualizar proceso
    const updatedproceso = await prisma.procesos.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        valor,
        userId,
        ubicacionId: ubicacionId ? parseInt(ubicacionId) : procesoActual.ubicacionId,
      },
      include: { ubicacion: true, user: true, images: true },
    });

    res.status(200).json(updatedproceso);
  } catch (error) {
    console.error("❌ Error al actualizar proceso:", error);
    res.status(500).json({ message: "Error al actualizar proceso" });
  }
};

//
// 🗑️ Eliminar proceso
//
const deleteImageFromUrl = async (url) => {
  try {
    const parts = url.split("/");
    const filenameWithExt = parts[parts.length - 1];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${filenameWithExt.split(".")[0]}`;
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("❌ Error al eliminar imagen de Cloudinary:", error);
  }
};

const deleteproceso = async (req, res) => {
  try {
    const { id } = req.params;

    const proceso = await prisma.procesos.findUnique({
      where: { id: parseInt(id) },
      include: { images: true },
    });

    if (!proceso) return res.status(404).json({ message: "Proceso no encontrado" });

    // Eliminar imágenes asociadas en Cloudinary
    for (const img of proceso.images) await deleteImageFromUrl(img.url);

    // Eliminar registros en cascada
    await prisma.image.deleteMany({ where: { procesos: { some: { id: proceso.id } } } });
    await prisma.procesosHistorial.deleteMany({ where: { procesoId: proceso.id } });
    await prisma.procesos.delete({ where: { id: proceso.id } });

    res.status(204).send();
  } catch (error) {
    console.error("❌ Error al eliminar proceso:", error);
    res.status(500).json({ message: "Error al eliminar proceso" });
  }
};

//
// 📜 Obtener historial de un proceso
//
const getprocesoHistorial = async (req, res) => {
  try {
    const { id } = req.params;

    const historial = await prisma.procesosHistorial.findMany({
      where: { procesoId: parseInt(id) },
      include: { user: true },
      orderBy: { fechaCambio: "desc" },
    });

    if (historial.length === 0)
      return res.status(404).json({ message: "No se encontró historial para este proceso." });

    res.status(200).json(historial);
  } catch (error) {
    console.error("❌ Error al obtener historial:", error);
    res.status(500).json({ message: "Error al obtener historial del proceso" });
  }
};

//
// 🔎 Búsqueda flexible (zona, ubicación, nombre)
//
const searchprocesos = async (req, res) => {
  try {
    const { zonaId, ubicacionId, nombre } = req.query;

    const procesos = await prisma.procesos.findMany({
      where: {
        AND: [
          zonaId ? { ubicacion: { zonaId: parseInt(zonaId) } } : {},
          ubicacionId ? { ubicacionId: parseInt(ubicacionId) } : {},
          nombre ? { nombre: { contains: nombre, mode: "insensitive" } } : {},
        ],
      },
      include: {
        ubicacion: { include: { zona: true } },
        user: true,
        images: true,
      },
    });

    res.status(200).json(procesos);
  } catch (error) {
    console.error("❌ Error en la búsqueda de procesos:", error);
    res.status(500).json({ message: "Error en la búsqueda de procesos" });
  }
};

module.exports = {
  createproceso,
  getAllprocesos,
  getprocesoById,
  updateproceso,
  deleteproceso,
  getprocesoHistorial,
  uploadprocesoImage,
  searchprocesos,
};
