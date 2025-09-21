const prisma = require("./prisma"); // ruta correcta a tu cliente Prisma
const { uploadImage } = require("../config/cloudinary");
// Crear un nuevo atributo
const uploadAtributoImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) return res.status(400).json({ message: "No se subió imagen" });

    // Usamos el buffer directo (gracias a memoryStorage)
    const result = await uploadImage(req.file.buffer, "atributos");

    const updatedImage = await prisma.image.create({
      data: {
        url: result.secure_url,
        atributos: { connect: { id: parseInt(id) } },
      },
    });

    res.status(201).json(updatedImage);
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);
    res.status(500).json({ message: "Error al subir imagen" });
  }
};

// 📌 Crear un atributo (con posible imagen asociada)
const createAtributo = async (req, res) => {
  try {
    const { nombre, valor, equipoId, userId } = req.body;

    let imagesData = [];
    if (req.file) {
      const result = await uploadImage(req.file.buffer, "atributos");
      imagesData.push({ url: result.secure_url });
    }

    const atributo = await prisma.atributo.create({
      data: {
        nombre,
        valor,
        equipoId: parseInt(equipoId),
        userId: parseInt(userId),
        ...(imagesData.length > 0 && { images: { create: imagesData } }),
      },
      include: { images: true, equipo: true, user: true },
    });

    res.status(201).json(atributo);
  } catch (error) {
    console.error("❌ Error al crear atributo:", error);
    res.status(500).json({ message: "Error al crear atributo" });
  }
};


// Obtener todos los atributos
const getAllAtributos = async (req, res) => {
  try {
    const atributos = await prisma.atributo.findMany({
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
    res.status(200).json(atributos);
  } catch (error) {
    console.error("Error al obtener atributos:", error);
    res.status(500).json({ message: "Error al obtener atributos" });
  }
};

// Obtener un atributo por ID
const getAtributoById = async (req, res) => {
  const { id } = req.params;
  console.log("👉 ID recibido:", id);  // 👈 Verifica qué llega

  try {
    if (!id) {
      return res.status(400).json({ message: "Debe enviar un ID válido en la URL" });
    }

    const atributo = await prisma.atributo.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        equipo: {
          include: {
            ubicacion: { include: { zona: true } },
          },
        },
        user: true,
      },
    });

    if (!atributo) {
      return res.status(404).json({ message: "Atributo no encontrado" });
    }

    res.status(200).json(atributo);
  } catch (error) {
    console.error("Error al obtener atributo por ID:", error);
    res.status(500).json({ message: "Error al obtener atributo" });
  }
};



// Actualizar un atributo con historial
// Después:
const updateAtributo = async (req, res) => {
  const { id } = req.params;
  const { nombre, valor, userId } = req.body;

  try {
    const atributoActual = await prisma.atributo.findUnique({
      where: { id: parseInt(id) },
    });

    if (!atributoActual) {
      return res.status(404).json({ message: "Atributo no encontrado" });
    }

    // Guardar historial antes de actualizar
    await prisma.atributoHistorial.create({
  data: {
    atributo: { connect: { id: atributoActual.id } },
    valorAnterior: atributoActual.valor?.toString() ?? "",
    valorNuevo: valor?.toString() ?? atributoActual.valor?.toString() ?? "",
    user: { connect: { id: Number(userId) } }, // 👈 conversión segura
  }
});


    const updatedAtributo = await prisma.atributo.update({
      where: { id: parseInt(id) },
      data: { nombre, valor, userId },
    });

    res.status(200).json(updatedAtributo);
  } catch (error) {
    console.error("Error al actualizar atributo:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Atributo no encontrado" });
    } else if (error.code === "P2002") {
      return res.status(400).json({ message: "Datos inválidos" });
    } else {
      return res.status(500).json({ message: "Error al actualizar atributo" });
    }
  }
};
const deleteImageFromUrl = async (url) => {
  try {
    // Extraer public_id de la URL
    const parts = url.split('/');
    const filenameWithExt = parts[parts.length - 1]; // ej: henaznvpb4tdauoliudh.png
    const folder = parts[parts.length - 2];          // ej: atributos
    const publicId = `${folder}/${filenameWithExt.split('.')[0]}`; // atributos/henaznvpb4tdauoliudh

    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Imagen eliminada de Cloudinary:', result);
    return result;
  } catch (error) {
    console.error('Error al eliminar imagen de Cloudinary:', error);
    throw error;
  }
};


const deleteAtributo = async (req, res) => {
  const { id } = req.params;

  try {
    const atributo = await prisma.atributo.findUnique({
      where: { id: parseInt(id) },
      include: { images: true }
    });

    if (!atributo) return res.status(404).json({ message: "Atributo no encontrado" });

    // Eliminar imágenes de Cloudinary
    for (const img of atributo.images) {
      await deleteImageFromUrl(img.url);
    }

    // Eliminar imágenes de la base de datos asociadas a este atributo
    await prisma.image.deleteMany({
      where: {
        atributos: { some: { id: atributo.id } }
      }
    });

    // Finalmente, eliminar el atributo
    await prisma.atributo.delete({ where: { id: atributo.id } });

    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar atributo:", error);
    res.status(500).json({ message: "Error al eliminar atributo" });
  }
};




// Historial de un atributo
const getAtributoHistorial = async (req, res) => {
  const { id } = req.params;

  try {
    const historial = await prisma.atributoHistorial.findMany({
      where: { atributoId: parseInt(id) },
      include: { user: true },
      orderBy: { fechaCambio: "desc" },
    });

    if (historial.length === 0) {
      return res.status(404).json({ message: "No se encontró historial para este atributo." });
    }

    res.status(200).json(historial);
  } catch (error) {
    console.error("Error al obtener el historial del atributo:", error);
    res.status(500).json({ message: "Error al obtener el historial del atributo." });
  }
};

// 🔎 Buscar por zona, ubicación, equipo o nombre de atributo
const searchAtributos = async (req, res) => {
  const { zonaId, ubicacionId, equipoId, nombre } = req.query;

  try {
    const atributos = await prisma.atributo.findMany({
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
    images: true, // ✅ incluye las imágenes aquí
  },
});


    res.status(200).json(atributos);
  } catch (error) {
    console.error("Error en la búsqueda de atributos:", error);
    res.status(500).json({ message: "Error en la búsqueda de atributos" });
  }
};



module.exports = {
  createAtributo,
  getAllAtributos,
  getAtributoById,
  updateAtributo,
  deleteAtributo,
  getAtributoHistorial,
  uploadAtributoImage,
  searchAtributos,
};

