const prisma = require("./prisma");
const { uploadImage, cloudinary } = require("../config/cloudinary");

// --------------------------------------------
// Crear Tarjeta Roja
// --------------------------------------------
const createTarjetaRoja = async (req, res) => {
  try {
    const data = req.body;

    if (!data.reporta || !data.fecha) {
      return res.status(400).json({ message: "Campos obligatorios faltantes" });
    }

    let imagesData = [];

    if (req.file) {
      const result = await uploadImage(req.file.buffer, "tarjetasRojas");
      imagesData.push({ url: result.secure_url });
    }

    const nueva = await prisma.tarjetaRoja.create({
      data: {
        ...data,
        fecha: new Date(data.fecha),
        ...(imagesData.length > 0 && { images: { create: imagesData } }),
        userId: data.userId ? Number(data.userId) : null,
      },
      include: {
        user: true,
        images: true,
      },
    });

    res.status(201).json(nueva);
  } catch (error) {
    console.error("❌ Error al crear tarjeta roja:", error);
    res.status(500).json({ message: "Error al crear tarjeta roja" });
  }
};

// --------------------------------------------
// Obtener todas las tarjetas
// --------------------------------------------
const getTarjetasRojas = async (_, res) => {
  try {
    const data = await prisma.tarjetaRoja.findMany({
      include: {
        user: true,
        images: true,
      },
      orderBy: { id: "desc" },
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("❌ Error al obtener tarjetas rojas:", error);
    res.status(500).json({ message: "Error al obtener tarjetas rojas" });
  }
};

// --------------------------------------------
// Obtener por ID
// --------------------------------------------
const getTarjetaRojaById = async (req, res) => {
  const { id } = req.params;

  try {
    const tarjeta = await prisma.tarjetaRoja.findUnique({
      where: { id: Number(id) },
      include: {
        user: true,
        images: true,
      },
    });

    if (!tarjeta)
      return res.status(404).json({ message: "Tarjeta Roja no encontrada" });

    res.status(200).json(tarjeta);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ message: "Error al obtener tarjeta roja" });
  }
};

// --------------------------------------------
// Subir imagen
// --------------------------------------------
const uploadTarjetaRojaImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No se subió archivo" });
    }

    const result = await uploadImage(req.file.buffer, "tarjetasRojas");

    const image = await prisma.image.create({
      data: {
        url: result.secure_url,
        tarjetaRojas: { connect: { id: Number(id) } },
      },
    });

    res.status(201).json(image);
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);
    res.status(500).json({ message: "Error al subir imagen" });
  }
};

// --------------------------------------------
// Actualizar tarjeta roja + historial
// --------------------------------------------
const updateTarjetaRoja = async (req, res) => {
  try {
    const { id } = req.params;
    const cambios = req.body;

    const actual = await prisma.tarjetaRoja.findUnique({
      where: { id: Number(id) },
    });

    if (!actual) {
      return res.status(404).json({ message: "Tarjeta Roja no encontrada" });
    }

    const actualizado = await prisma.tarjetaRoja.update({
      where: { id: Number(id) },
      data: cambios,
    });

    // Guardar en historial
    await prisma.tarjetaRojaHistorial.create({
      data: {
        tarjetaId: Number(id),
        userId: Number(cambios.userId),
        campo: "actualización general",
        valorAnterior: JSON.stringify(actual),
        valorNuevo: JSON.stringify(actualizado),
      },
    });

    res.status(200).json(actualizado);
  } catch (error) {
    console.error("❌ Error al actualizar tarjeta roja:", error);
    res.status(500).json({ message: "Error al actualizar tarjeta roja" });
  }
};

// --------------------------------------------
// Eliminar tarjeta roja
// --------------------------------------------
const deleteTarjetaRoja = async (req, res) => {
  try {
    const { id } = req.params;

    const tarjeta = await prisma.tarjetaRoja.findUnique({
      where: { id: Number(id) },
      include: { images: true },
    });

    if (!tarjeta) {
      return res.status(404).json({ message: "Tarjeta Roja no encontrada" });
    }

    // Eliminar imágenes Cloudinary
    for (const img of tarjeta.images) {
      try {
        const parts = img.url.split("/");
        const folder = parts[parts.length - 2];
        const file = parts.pop().split(".")[0];
        await cloudinary.uploader.destroy(`${folder}/${file}`);
      } catch (_) {}
    }

    await prisma.image.deleteMany({
      where: { tarjetaRojas: { some: { id: tarjeta.id } } },
    });

    await prisma.tarjetaRojaHistorial.deleteMany({
      where: { tarjetaId: tarjeta.id },
    });

    await prisma.tarjetaRoja.delete({ where: { id: tarjeta.id } });

    res.status(204).send();
  } catch (error) {
    console.error("❌ Error al eliminar tarjeta roja:", error);
    res.status(500).json({ message: "Error al eliminar tarjeta roja" });
  }
};

// --------------------------------------------
// Historial
// --------------------------------------------
const getTarjetaRojaHistorial = async (req, res) => {
  const { id } = req.params;

  try {
    const historial = await prisma.tarjetaRojaHistorial.findMany({
      where: { tarjetaId: Number(id) },
      include: { user: true },
      orderBy: { fechaCambio: "desc" },
    });

    res.status(200).json(historial);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ message: "Error al obtener historial" });
  }
};

module.exports = {
  createTarjetaRoja,
  getTarjetasRojas,
  getTarjetaRojaById,
  updateTarjetaRoja,
  deleteTarjetaRoja,
  getTarjetaRojaHistorial,
  uploadTarjetaRojaImage,
};
