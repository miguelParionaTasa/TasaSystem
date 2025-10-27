const prisma = require("./prisma"); // ruta correcta a tu cliente Prisma
const { cloudinary, uploadImage } = require("../config/cloudinary");

// 📸 Subir imagen a una clínica existente
const uploadClinicaImage = async (req, res) => {
  upload(req, res, async (err) => {
    try {
      // ⚠️ 1️⃣ Validar errores de Multer (como límite de tamaño)
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ message: "El archivo excede el tamaño máximo permitido de 2 MB." });
        }
        return res.status(500).json({ message: "Error al procesar el archivo.", error: err.message });
      }

      // ⚠️ 2️⃣ Validar que haya imagen
      const { id } = req.params;
      if (!req.file) {
        return res.status(400).json({ message: "No se subió ninguna imagen." });
      }

      // ⚙️ 3️⃣ Subir imagen a Cloudinary (ya optimizada a WebP)
      const result = await uploadImage(req.file.buffer, "clinica");

      // 💾 4️⃣ Guardar referencia en BD
      const newImage = await prisma.image.create({
        data: {
          url: result.secure_url,
          clinica: { connect: { id: parseInt(id) } },
        },
      });

      // ✅ 5️⃣ Responder éxito
      res.status(201).json(newImage);

    } catch (error) {
      console.error("❌ Error al subir imagen de clínica:", error);
      res.status(500).json({ message: "Error al subir imagen.", error: error.message });
    }
  });
};


// 📌 Crear nueva clínica (con posible imagen)
const createClinica = async (req, res) => {
  try {
    const { nombre, valor, equipoId, userId } = req.body;

    let imagesData = [];
    if (req.file) {
      const result = await uploadImage(req.file.buffer, "clinica");
      imagesData.push({ url: result.secure_url });
    }

    const clinica = await prisma.clinica.create({
      data: {
        nombre,
        valor,
        equipoId: parseInt(equipoId),
        userId: parseInt(userId),
        ...(imagesData.length > 0 && { images: { create: imagesData } }),
      },
      include: { images: true, equipo: true, user: true },
    });

    res.status(201).json(clinica);
  } catch (error) {
    console.error("❌ Error al crear clínica:", error);
    res.status(500).json({ message: "Error al crear clínica" });
  }
};

// 📋 Obtener todas las clínicas
const getAllClinicas = async (req, res) => {
  try {
    const clinicas = await prisma.clinica.findMany({
      include: {
        equipo: {
          include: {
            ubicacion: { include: { zona: true } },
          },
        },
        user: true,
        images: true,
      },
    });
    res.status(200).json(clinicas);
  } catch (error) {
    console.error("Error al obtener clínicas:", error);
    res.status(500).json({ message: "Error al obtener clínicas" });
  }
};

// 🔍 Obtener una clínica por ID
const getClinicaById = async (req, res) => {
  const { id } = req.params;
  try {
    const clinica = await prisma.clinica.findUnique({
      where: { id: parseInt(id) },
      include: {
        equipo: {
          include: {
            ubicacion: { include: { zona: true } },
          },
        },
        user: true,
        images: true,
      },
    });

    if (!clinica) return res.status(404).json({ message: "Clínica no encontrada" });

    res.status(200).json(clinica);
  } catch (error) {
    console.error("Error al obtener clínica por ID:", error);
    res.status(500).json({ message: "Error al obtener clínica" });
  }
};

// ✏️ Actualizar clínica con historial
const updateClinica = async (req, res) => {
  const { id } = req.params;
  const { nombre, valor, userId } = req.body;

  try {
    const clinicaActual = await prisma.clinica.findUnique({
      where: { id: parseInt(id) },
    });

    if (!clinicaActual)
      return res.status(404).json({ message: "Clínica no encontrada" });

    // Registrar historial
    await prisma.clinicaHistorial.create({
  data: {
    clinica: { connect: { id: clinicaActual.id } }, // ✅ Nombre correcto
    valorAnterior: clinicaActual.valor ?? "",
    valorNuevo: valor ?? clinicaActual.valor ?? "",
    user: { connect: { id: Number(userId) } },
  },
});


    const updatedClinica = await prisma.clinica.update({
      where: { id: parseInt(id) },
      data: { nombre, valor, userId: parseInt(userId) },
    });

    res.status(200).json(updatedClinica);
  } catch (error) {
    console.error("Error al actualizar clínica:", error);
    res.status(500).json({ message: "Error al actualizar clínica" });
  }
};

// 🗑️ Eliminar clínica + imágenes + historial
const deleteClinica = async (req, res) => {
  const { id } = req.params;

  try {
    const clinica = await prisma.clinica.findUnique({
      where: { id: parseInt(id) },
      include: { images: true },
    });

    if (!clinica) return res.status(404).json({ message: "Clínica no encontrada" });

    // Eliminar imágenes de Cloudinary
    for (const img of clinica.images) {
      await deleteImageFromUrl(img.url);
    }

    // Eliminar imágenes en BD
    await prisma.image.deleteMany({
      where: { clinica: { some: { id: clinica.id } } },
    });

    // Eliminar historial
    await prisma.clinicaHistorial.deleteMany({
      where: { clinicaId: clinica.id },
    });

    // Eliminar registro principal
    await prisma.clinica.delete({ where: { id: clinica.id } });

    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar clínica:", error);
    res.status(500).json({ message: "Error al eliminar clínica" });
  }
};

// 🧾 Obtener historial de una clínica
const getClinicaHistorial = async (req, res) => {
  const { id } = req.params;

  try {
    const historial = await prisma.clinicaHistorial.findMany({
      where: { clinicaId: parseInt(id) },
      include: { user: true },
      orderBy: { fechaCambio: "desc" },
    });

    if (historial.length === 0)
      return res.status(404).json({ message: "No se encontró historial para esta clínica." });

    res.status(200).json(historial);
  } catch (error) {
    console.error("Error al obtener historial de clínica:", error);
    res.status(500).json({ message: "Error al obtener historial de clínica" });
  }
};

// 🔎 Búsqueda por zona, ubicación, equipo o nombre
const searchClinicas = async (req, res) => {
  const { zonaId, ubicacionId, equipoId, nombre } = req.query;

  try {
    const clinicas = await prisma.clinica.findMany({
      where: {
        AND: [
          zonaId ? { equipo: { zonaId: parseInt(zonaId) } } : {},
          ubicacionId ? { equipo: { ubicacionId: parseInt(ubicacionId) } } : {},
          equipoId ? { equipoId: parseInt(equipoId) } : {},
          nombre ? { nombre: { contains: nombre, mode: "insensitive" } } : {},
        ],
      },
      include: {
        equipo: {
          include: {
            ubicacion: { include: { zona: true } },
          },
        },
        user: true,
        images: true,
      },
    });

    res.status(200).json(clinicas);
  } catch (error) {
    console.error("Error en la búsqueda de clínicas:", error);
    res.status(500).json({ message: "Error en la búsqueda de clínicas" });
  }
};

// 🔥 Función auxiliar: eliminar imagen de Cloudinary
const deleteImageFromUrl = async (url) => {
  try {
    const parts = url.split("/");
    const filenameWithExt = parts[parts.length - 1];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${filenameWithExt.split(".")[0]}`;

    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Imagen eliminada de Cloudinary:", result);
    return result;
  } catch (error) {
    console.error("Error al eliminar imagen de Cloudinary:", error);
    throw error;
  }
};

module.exports = {
  createClinica,
  getAllClinicas,
  getClinicaById,
  updateClinica,
  deleteClinica,
  getClinicaHistorial,
  uploadClinicaImage,
  searchClinicas,
};
