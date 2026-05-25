const prisma = require("./prisma"); // Ruta correcta a tu cliente Prisma
const { cloudinary, uploadImage } = require("../config/cloudinary");

// ==========================================
// 📸 1. SUBIR IMAGEN A CLÍNICA EXISTENTE
// ==========================================
const uploadClinicaImage = async (req, res) => {
  // Se asume que "upload" es tu middleware de Multer configurado previamente
  upload(req, res, async (err) => {
    try {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "El archivo excede el tamaño máximo permitido de 2 MB." });
        }
        return res.status(500).json({ message: "Error al procesar el archivo.", error: err.message });
      }

      const { id } = req.params;
      if (!req.file) {
        return res.status(400).json({ message: "No se subió ninguna imagen." });
      }

      const result = await uploadImage(req.file.buffer, "clinica");

      const newImage = await prisma.image.create({
        data: {
          url: result.secure_url,
          clinica: { connect: { id: parseInt(id) } },
        },
      });

      res.status(201).json(newImage);
    } catch (error) {
      console.error("❌ Error al subir imagen de clínica:", error);
      res.status(500).json({ message: "Error al subir imagen.", error: error.message });
    }
  });
};

// ==========================================
// 📌 2. CREAR NUEVO REGISTRO (CON TODOS LOS ATRIBUTOS)
// ==========================================
const createClinica = async (req, res) => {
  try {
    const { nombre, valor, ubicacionId, userId, ot, fecha } = req.body;

    if (!nombre || !ubicacionId) {
      return res.status(400).json({ message: "Los campos 'nombre' y 'ubicacionId' son obligatorios." });
    }

    // Manejo estricto de zona horaria Perú UTC-5 para la fecha
    let fechaFinal = new Date();
    if (fecha) {
      const esFormatoLatino = fecha.includes('/');
      if (esFormatoLatino) {
        const [dia, mes, anio] = fecha.trim().split('/');
        fechaFinal = new Date(`${anio}-${mes}-${dia}T00:00:00-05:00`);
      } else {
        fechaFinal = new Date(`${fecha.trim()}T00:00:00-05:00`);
      }
    }

    let imagesData = [];
    if (req.file) {
      const result = await uploadImage(req.file.buffer, "clinica");
      imagesData.push({ url: result.secure_url });
    }

    const clinica = await prisma.clinica.create({
      data: {
        nombre: nombre.trim(),
        valor: valor ? valor.trim() : null,
        ot: ot ? ot.trim() : null,
        ubicacionId: parseInt(ubicacionId),
        userId: userId ? parseInt(userId) : null,
        fecha: fechaFinal,
        ...(imagesData.length > 0 && { images: { create: imagesData } }),
      },
      include: { 
        images: true, 
        user: true,
        ubicacion: { include: { zona: true } }
      },
    });

    res.status(201).json(clinica);
  } catch (error) {
    console.error("❌ Error al crear clínica con todos los atributos:", error);
    res.status(500).json({ message: "Error al crear clínica", error: error.message });
  }
};

// ==========================================
// 📋 3. OBTENER TODAS LAS CLÍNICAS
// ==========================================
const getAllClinicas = async (req, res) => {
  try {
    const clinicas = await prisma.clinica.findMany({
      include: {
        ubicacion: { include: { zona: true } },
        user: true,
        images: true,
        ClinicaHistorial: { include: { user: true } }
      },
      orderBy: { id: "desc" }
    });
    res.status(200).json(clinicas);
  } catch (error) {
    console.error("❌ Error al obtener el catálogo completo de clínicas:", error);
    res.status(500).json({ message: "Error al obtener clínicas" });
  }
};

// ==========================================
// 🔍 4. OBTENER CLÍNICA POR ID
// ==========================================
const getClinicaById = async (req, res) => {
  const { id } = req.params;
  try {
    const clinica = await prisma.clinica.findUnique({
      where: { id: parseInt(id) },
      include: {
        ubicacion: { include: { zona: true } },
        user: true,
        images: true,
        ClinicaHistorial: { include: { user: true } }
      },
    });

    if (!clinica) return res.status(404).json({ message: "Clínica no encontrada" });

    res.status(200).json(clinica);
  } catch (error) {
    console.error("❌ Error al obtener clínica por ID:", error);
    res.status(500).json({ message: "Error al obtener clínica" });
  }
};

// ==========================================
// ✏️ 5. ACTUALIZAR CLÍNICA (CON TODOS LOS ATRIBUTOS E HISTORIAL)
// ==========================================
const updateClinica = async (req, res) => {
  const { id } = req.params;
  const { nombre, valor, ubicacionId, ot, fecha, userId } = req.body;

  try {
    const clinicaActual = await prisma.clinica.findUnique({
      where: { id: parseInt(id) },
    });

    if (!clinicaActual) return res.status(404).json({ message: "Clínica no encontrada" });

    // Si cambian la fecha, se recalcula con desfase Perú UTC-5
    let fechaFinal = undefined;
    if (fecha) {
      const esFormatoLatino = fecha.includes('/');
      if (esFormatoLatino) {
        const [dia, mes, anio] = fecha.trim().split('/');
        fechaFinal = new Date(`${anio}-${mes}-${dia}T00:00:00-05:00`);
      } else {
        fechaFinal = new Date(`${fecha.trim()}T00:00:00-05:00`);
      }
    }

    // Registrar historial si el valor técnico tuvo cambios reales
    if (userId && valor !== undefined && clinicaActual.valor !== valor) {
      await prisma.clinicaHistorial.create({
        data: {
          clinica: { connect: { id: clinicaActual.id } },
          valorAnterior: clinicaActual.valor ?? "",
          valorNuevo: valor ?? "",
          user: { connect: { id: parseInt(userId) } },
        },
      });
    }

    const updatedClinica = await prisma.clinica.update({
      where: { id: parseInt(id) },
      data: { 
        nombre: nombre !== undefined ? nombre.trim() : undefined, 
        valor: valor !== undefined ? valor.trim() : undefined, 
        ot: ot !== undefined ? ot.trim() : undefined,
        ubicacionId: ubicacionId ? parseInt(ubicacionId) : undefined,
        fecha: fechaFinal,
        userId: userId ? parseInt(userId) : undefined 
      },
      include: {
        ubicacion: { include: { zona: true } },
        user: true,
        images: true
      }
    });

    res.status(200).json(updatedClinica);
  } catch (error) {
    console.error("❌ Error al actualizar los atributos de la clínica:", error);
    res.status(500).json({ message: "Error al actualizar clínica" });
  }
};

// ==========================================
// 🗑️ 6. ELIMINAR CLÍNICA + IMÁGENES + HISTORIAL
// ==========================================
const deleteClinica = async (req, res) => {
  const { id } = req.params;

  try {
    const clinica = await prisma.clinica.findUnique({
      where: { id: parseInt(id) },
      include: { images: true },
    });

    if (!clinica) return res.status(404).json({ message: "Clínica no encontrada" });

    // Eliminar archivos físicos de Cloudinary
    for (const img of clinica.images) {
      await deleteImageFromUrl(img.url);
    }

    // Eliminar registros de imágenes en Base de Datos
    await prisma.image.deleteMany({
      where: { clinica: { some: { id: clinica.id } } },
    });

    // Eliminar todo el historial asociado para evitar errores de claves foráneas
    await prisma.clinicaHistorial.deleteMany({
      where: { clinicaId: clinica.id },
    });

    // Eliminar el registro de clínica principal
    await prisma.clinica.delete({ where: { id: clinica.id } });

    res.status(204).send();
  } catch (error) {
    console.error("❌ Error al eliminar clínica:", error);
    res.status(500).json({ message: "Error al eliminar clínica" });
  }
};

// ==========================================
// 🧾 7. OBTENER HISTORIAL DE CAMBIOS
// ==========================================
const getClinicaHistorial = async (req, res) => {
  const { id } = req.params;

  try {
    const historial = await prisma.clinicaHistorial.findMany({
      where: { clinicaId: parseInt(id) },
      include: { user: true },
      orderBy: { id: "desc" },
    });

    if (historial.length === 0) {
      return res.status(404).json({ message: "No se encontró historial para esta clínica." });
    }

    res.status(200).json(historial);
  } catch (error) {
    console.error("❌ Error al obtener historial de clínica:", error);
    res.status(500).json({ message: "Error al obtener historial de clínica" });
  }
};

// ==========================================
// 🔎 8. BUSCADOR PARAMETRIZADO TOTAL
// ==========================================
const searchClinicas = async (req, res) => {
  const { zonaId, ubicacionId, nombre, valor, ot, fechaInicio, fechaFin } = req.query;

  try {
    const filters = [];

    if (zonaId) filters.push({ ubicacion: { zonaId: parseInt(zonaId) } });
    if (ubicacionId) filters.push({ ubicacionId: parseInt(ubicacionId) });
    if (nombre) filters.push({ nombre: { contains: nombre.trim(), mode: "insensitive" } });
    if (valor) filters.push({ valor: { contains: valor.trim(), mode: "insensitive" } });
    if (ot) filters.push({ ot: { contains: ot.trim(), mode: "insensitive" } });

    if (fechaInicio || fechaFin) {
      const rangoFecha = {};
      if (fechaInicio) rangoFecha.gte = new Date(`${fechaInicio}T00:00:00-05:00`);
      if (fechaFin) rangoFecha.lte = new Date(`${fechaFin}T23:59:59-05:00`);
      filters.push({ fecha: rangoFecha });
    }

    const clinicas = await prisma.clinica.findMany({
      where: filters.length > 0 ? { AND: filters } : {},
      include: {
        ubicacion: { include: { zona: true } },
        user: true,
        images: true,
      },
      orderBy: { id: "desc" }
    });

    res.status(200).json(clinicas);
  } catch (error) {console.error("❌ Error en la búsqueda parametrizada de clínicas:", error);res.status(500).json({ message: "Error en la búsqueda de clínicas" });}};
  // ===========// 🔥 FUNCIÓN AUXILIAR: ELIMINAR DE CLOUDINARY// ====
   
  const deleteImageFromUrl = async (url) => {try {const parts = url.split("/");
  const filenameWithExt = parts[parts.length - 1];const folder = parts[parts.length - 2];
  const publicId = `${folder}/${filenameWithExt.split(".")[0]}`;
  const result = await cloudinary.uploader.destroy(publicId);
  console.log("Imagen eliminada de Cloudinary:", result);return result;} 
  catch (error) {console.error("Error al eliminar imagen de Cloudinary:", error);throw error;}};
  
  module.exports = {createClinica,getAllClinicas,getClinicaById,updateClinica,deleteClinica,getClinicaHistorial,uploadClinicaImage,searchClinicas,};
