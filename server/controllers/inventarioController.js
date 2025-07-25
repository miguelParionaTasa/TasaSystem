const prisma = require("./prisma");
const cloudinary = require("../config/cloudinary");

// Subir imagen a Cloudinary
const uploadImageToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "inventario_items", quality: "auto", fetch_format: "auto" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    uploadStream.end(file.buffer);
  });
};

// ---- CREAR INVENTARIO ITEM ----
const createInventarioItem = async (req, res) => {
  try {
    const { descripcion, cantidad, estado, ubicacion, nivel, fechaIngreso, destino, responsableId } = req.body;
    let imageUrl = null;

    if (req.file) {
      try {
        const result = await uploadImageToCloudinary(req.file);
        imageUrl = result.secure_url;
      } catch (err) {
        console.error("Error al subir la imagen a Cloudinary:", err);
        return res.status(500).json({ message: "Error al subir la imagen" });
      }
    }

    const nuevoItem = await prisma.inventarioItem.create({
      data: {
        descripcion,
        cantidad: parseInt(cantidad),
        estado,
        ubicacion,
        nivel,
        fechaIngreso: new Date(fechaIngreso),
        destino,
        responsableId: parseInt(responsableId),
        imageUrl,
      },
    });

    return res.status(201).json(nuevoItem);
  } catch (error) {
    console.error("Error al crear InventarioItem:", error);
    return res.status(500).json({ message: "Error al crear InventarioItem" });
  }
};

// ---- LISTAR INVENTARIO ITEMS ----
const getInventarioItems = async (req, res) => {
  try {
    const items = await prisma.inventarioItem.findMany({
      include: { responsable: true },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(items);
  } catch (error) {
    console.error("Error al obtener InventarioItems:", error);
    return res.status(500).json({ message: "Error al obtener InventarioItems" });
  }
};

// ---- OBTENER ITEM POR ID CON HISTORIAL ----
const getInventarioItemById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await prisma.inventarioItem.findUnique({
      where: { id: parseInt(id) },
      include: { responsable: true, historial: true },
    });
    if (!item) return res.status(404).json({ message: "InventarioItem no encontrado" });
    return res.status(200).json(item);
  } catch (error) {
    console.error("Error al obtener InventarioItem:", error);
    return res.status(500).json({ message: "Error al obtener InventarioItem" });
  }
};

// ---- ACTUALIZAR INVENTARIO ITEM ----
const updateInventarioItem = async (req, res) => {
  const { id } = req.params;
  const { descripcion, cantidad, estado, ubicacion, nivel, fechaIngreso, fechaSalida, destino, responsableId } = req.body;

  try {
    let imageUrl = undefined; // undefined = no actualizar campo

    if (req.file) {
      try {
        const result = await uploadImageToCloudinary(req.file);
        imageUrl = result.secure_url;
      } catch (err) {
        console.error("Error al subir la imagen a Cloudinary:", err);
        return res.status(500).json({ message: "Error al subir la imagen" });
      }
    }

    const updatedItem = await prisma.inventarioItem.update({
      where: { id: parseInt(id) },
      data: {
        descripcion,
        cantidad: cantidad ? parseInt(cantidad) : undefined,
        estado,
        ubicacion,
        nivel,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : undefined,
        fechaSalida: fechaSalida ? new Date(fechaSalida) : null,
        destino,
        responsableId: responsableId ? parseInt(responsableId) : undefined,
        ...(imageUrl !== undefined && { imageUrl }), // actualizar solo si hay nueva imagen
      },
    });

    return res.status(200).json(updatedItem);
  } catch (error) {
    console.error("Error al actualizar InventarioItem:", error);
    return res.status(500).json({ message: "Error al actualizar InventarioItem" });
  }
};

// ---- ELIMINAR INVENTARIO ITEM ----
const deleteInventarioItem = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.inventarioItem.delete({ where: { id: parseInt(id) } });
    return res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar InventarioItem:", error);
    return res.status(500).json({ message: "Error al eliminar InventarioItem" });
  }
};

// ---- AGREGAR HISTORIAL A ITEM ----
const addHistorialToItem = async (req, res) => {
  const { inventarioId, fechaUso, cantidadUsada, descripcionUso, destino, responsable } = req.body;
  try {
    const historial = await prisma.historialItem.create({
      data: {
        inventarioId: parseInt(inventarioId),
        fechaUso: new Date(fechaUso),
        cantidadUsada: parseFloat(cantidadUsada),
        descripcionUso,
        destino,
        responsable,
      },
    });
    return res.status(201).json(historial);
  } catch (error) {
    console.error("Error al agregar historial:", error);
    return res.status(500).json({ message: "Error al agregar historial" });
  }
};
const salidaDeItem = async (req, res) => {
  const {
    inventarioId,
    fechaUso,
    cantidadUsada,
    descripcionUso,
    destino,
    responsable // string (o cambia el modelo si quieres userId)
  } = req.body;

  try {
    const id = parseInt(inventarioId, 10);
    const cant = parseInt(cantidadUsada, 10);

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventarioItem.findUnique({
        where: { id },
        select: { cantidad: true }
      });

      if (!item) {
        throw new Error("Item no encontrado");
      }
      if (cant > item.cantidad) {
        throw new Error("Cantidad mayor al stock disponible");
      }

      // 1) Crear historial
      const historial = await tx.historialItem.create({
        data: {
          inventarioId: id,
          fechaUso: new Date(fechaUso),
          cantidadUsada: cant,
          descripcionUso,
          destino,
          responsable,
        },
      });

      // 2) Actualizar stock
      const updated = await tx.inventarioItem.update({
        where: { id },
        data: {
          cantidad: item.cantidad - cant,
          fechaSalida: new Date(fechaUso),
          destino,
        },
      });

      return { historial, updated };
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error en salidaDeItem:", error);
    return res.status(400).json({ message: error.message || "Error en salida" });
  }
};

// ---- OBTENER HISTORIAL DE UN ITEM ----
const getHistorialByItemId = async (req, res) => {
  const { inventarioId } = req.params;
  try {
    const historial = await prisma.historialItem.findMany({
      where: { inventarioId: parseInt(inventarioId) },
      orderBy: { fechaUso: "desc" },
    });
    return res.status(200).json(historial);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return res.status(500).json({ message: "Error al obtener historial" });
  }
};

module.exports = {
  createInventarioItem,
  getInventarioItems,
  getInventarioItemById,
  updateInventarioItem,
  deleteInventarioItem,
  addHistorialToItem,
  salidaDeItem,
  getHistorialByItemId,
};
