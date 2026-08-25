const bcrypt = require("bcryptjs");
const prisma = require("./prisma");
const { writeAudit } = require("../services/auditService");
const { getTenantContext, tenantStorage } = require("../security/tenantContext");

const USER_SELECT = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  rol: true,
  plantaId: true,
  areaId: true,
  isDeleted: true,
  ultimoAcceso: true,
  createdAt: true,
  planta: { select: { id: true, codigo: true, nombre: true } },
  area: { select: { id: true, name: true } },
};
const VALID_ROLES = new Set(["SUPER_ADMIN", "ADMIN_PLANTA", "SUPERVISOR", "TECNICO_OPERADOR", "ALMACEN", "CONSULTA", "AUDITOR"]);

const normalizeSeasonCode = ({ tipo = "CHIV", numero, anio }) => {
  const normalizedType = String(tipo).trim().toUpperCase();
  const number = Number(numero);
  const year = Number(anio);
  if (normalizedType !== "CHIV" || ![1, 2].includes(number) || year < 2000 || year > 2100) {
    throw new Error("La temporada debe ser CHIV 1 o 2 y tener un año válido.");
  }
  return { tipo: normalizedType, numero: number, anio: year, codigo: `${normalizedType}${number}-${String(year).slice(-2)}` };
};

const getPlants = async (req, res) => {
  const plants = await prisma.planta.findMany({ orderBy: { nombre: "asc" } });
  res.json(plants);
};

const createPlant = async (req, res) => {
  if (req.user.rol !== "SUPER_ADMIN") return res.status(403).json({ error: "Solo SUPER_ADMIN puede crear plantas." });
  const codigo = String(req.body.codigo || "").trim().toUpperCase().replace(/\s+/g, "_");
  const nombre = String(req.body.nombre || "").trim();
  if (!codigo || !nombre) return res.status(400).json({ error: "Código y nombre son obligatorios." });
  const plant = await prisma.planta.create({ data: { codigo, nombre } });
  res.status(201).json(plant);
};

const getUsers = async (req, res) => {
  const users = await prisma.user.findMany({ select: USER_SELECT, orderBy: [{ isDeleted: "asc" }, { firstName: "asc" }] });
  res.json(users);
};

const createUser = async (req, res) => {
  const { username, password, firstName, lastName, areaId } = req.body;
  let rol = req.body.rol || "TECNICO_OPERADOR";
  if (!VALID_ROLES.has(rol)) return res.status(400).json({ error: "Rol inválido." });
  if (rol === "SUPER_ADMIN" && req.user.rol !== "SUPER_ADMIN") rol = "ADMIN_PLANTA";
  if (!username || !password || !firstName || !lastName || !areaId) {
    return res.status(400).json({ error: "Nombre, apellido, usuario, contraseña y área son obligatorios." });
  }
  if (String(password).length < 10) return res.status(400).json({ error: "La contraseña debe tener al menos 10 caracteres." });
  const user = await prisma.user.create({
    data: {
      username: String(username).trim(),
      password: await bcrypt.hash(String(password), 12),
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      areaId: Number(areaId),
      rol,
      isAdmin: ["SUPER_ADMIN", "ADMIN_PLANTA"].includes(rol),
      passwordChangedAt: new Date(),
    },
    select: USER_SELECT,
  });
  res.status(201).json(user);
};

const updateUser = async (req, res) => {
  const id = Number(req.params.id);
  const current = await prisma.user.findUnique({ where: { id }, select: { id: true, rol: true } });
  if (!current) return res.status(404).json({ error: "Usuario no encontrado." });
  let rol = req.body.rol;
  if (rol !== undefined && !VALID_ROLES.has(rol)) return res.status(400).json({ error: "Rol inválido." });
  if ((rol === "SUPER_ADMIN" || current.rol === "SUPER_ADMIN") && req.user.rol !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Solo SUPER_ADMIN puede modificar ese rol." });
  }
  const data = {};
  for (const key of ["firstName", "lastName", "username", "rol", "areaId", "isDeleted"]) {
    if (req.body[key] !== undefined) data[key] = key === "areaId" ? Number(req.body[key]) : req.body[key];
  }
  if (data.rol) data.isAdmin = ["SUPER_ADMIN", "ADMIN_PLANTA"].includes(data.rol);
  if (data.isDeleted !== undefined || data.rol) data.tokenVersion = { increment: 1 };
  const user = await prisma.user.update({ where: { id }, data, select: USER_SELECT });
  res.json(user);
};

const resetPassword = async (req, res) => {
  const id = Number(req.params.id);
  const password = String(req.body.password || "");
  if (password.length < 10) return res.status(400).json({ error: "La contraseña debe tener al menos 10 caracteres." });
  await prisma.user.update({
    where: { id },
    data: {
      password: await bcrypt.hash(password, 12),
      passwordChangedAt: new Date(),
      tokenVersion: { increment: 1 },
    },
  });
  res.status(204).send();
};

const getSeasons = async (req, res) => {
  res.json(await prisma.temporada.findMany({ orderBy: [{ anio: "desc" }, { numero: "desc" }] }));
};

const createSeason = async (req, res) => {
  try {
    const normalized = normalizeSeasonCode(req.body);
    const data = {
      ...normalized,
      activa: Boolean(req.body.activa),
      fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : null,
      fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : null,
    };
    const season = data.activa
      ? (await prisma.$transaction([
        prisma.temporada.updateMany({ data: { activa: false } }),
        prisma.temporada.create({ data }),
      ]))[1]
      : await prisma.temporada.create({ data });
    res.status(201).json(season);
  } catch (error) {
    res.status(error.code === "P2002" ? 409 : 400).json({
      error: error.code === "P2002" ? "La temporada ya existe en esta planta." : "Los datos de la temporada no son válidos.",
    });
  }
};

const activateSeason = async (req, res) => {
  const id = Number(req.params.id);
  await prisma.$transaction([
    prisma.temporada.updateMany({ data: { activa: false } }),
    prisma.temporada.update({ where: { id }, data: { activa: true } }),
  ]);
  res.status(204).send();
};

const getTelegramAccesses = async (req, res) => {
  const accesses = await prisma.telegramAcceso.findMany({
    select: {
      id: true,
      userId: true,
      plantaId: true,
      telegramIdUltimos4: true,
      nombreTelegram: true,
      usernameTelegram: true,
      activo: true,
      aprobadoEn: true,
      ultimoUso: true,
      createdAt: true,
      user: { select: USER_SELECT },
    },
    orderBy: [{ activo: "asc" }, { createdAt: "desc" }],
  });
  res.json(accesses);
};

const approveTelegramAccess = async (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.body.userId);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, plantaId: true } });
  if (!user) return res.status(404).json({ error: "Usuario web no encontrado." });
  const access = await prisma.telegramAcceso.update({
    where: { id },
    data: {
      userId,
      plantaId: user.plantaId,
      activo: true,
      aprobadoPorId: req.user.id,
      aprobadoEn: new Date(),
    },
    select: { id: true, userId: true, plantaId: true, telegramIdUltimos4: true, activo: true },
  });
  res.json(access);
};

const revokeTelegramAccess = async (req, res) => {
  await prisma.telegramAcceso.update({ where: { id: Number(req.params.id) }, data: { activo: false } });
  res.status(204).send();
};

const getAudits = async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const take = Math.min(Math.max(Number(req.query.take || 50), 1), 200);
  const where = {
    plantaId: req.plantaId,
    ...(req.query.accion ? { accion: { contains: String(req.query.accion), mode: "insensitive" } } : {}),
    ...(req.query.usuarioId ? { usuarioId: Number(req.query.usuarioId) } : {}),
  };
  const [data, total] = await prisma.$transaction([
    prisma.auditoria.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * take, take }),
    prisma.auditoria.count({ where }),
  ]);
  res.json({ data: data.map((item) => ({ ...item, id: item.id.toString() })), total, page, pages: Math.ceil(total / take) });
};

const getImports = async (req, res) => {
  res.json(await prisma.importacion.findMany({ orderBy: { createdAt: "desc" }, take: 100 }));
};

const transferAsset = async (req, res) => {
  const id = Number(req.params.id);
  const plantaDestinoId = Number(req.body.plantaDestinoId);
  const motivo = String(req.body.motivo || "").trim();
  if (!plantaDestinoId || !motivo) return res.status(400).json({ error: "Planta destino y motivo son obligatorios." });
  const [asset, destination] = await Promise.all([
    prisma.activo.findUnique({ where: { id }, select: { id: true, nombre: true, codigoActivo: true, plantaId: true, zonaId: true, ubicacionId: true, equipoId: true, zona: true, ubicacion: true, historial: true } }),
    prisma.planta.findUnique({ where: { id: plantaDestinoId }, select: { id: true, codigo: true, nombre: true, activa: true } }),
  ]);
  if (!asset) return res.status(404).json({ error: "Activo no encontrado en la planta seleccionada." });
  if (!destination?.activa) return res.status(400).json({ error: "La planta destino no existe o está inactiva." });
  if (asset.plantaId === destination.id) return res.status(400).json({ error: "El activo ya pertenece a esa planta." });
  if (asset.codigoActivo) {
    const context = getTenantContext();
    const duplicate = await tenantStorage.run(
      { ...context, plantaId: destination.id },
      () => prisma.activo.findFirst({ where: { codigoActivo: { equals: asset.codigoActivo, mode: "insensitive" } }, select: { id: true } })
    );
    if (duplicate) return res.status(409).json({ error: "Ya existe un activo con ese código en la planta destino." });
  }
  const trace = `[${new Date().toISOString()}] Transferido a ${destination.codigo}. Motivo: ${motivo}`;
  const context = getTenantContext();
  const updated = await tenantStorage.run(
    { ...context, allowPlantTransfer: true },
    () => prisma.activo.update({
      where: { id },
      data: {
        plantaId: destination.id,
        zonaId: null,
        ubicacionId: null,
        equipoId: null,
        zona: null,
        ubicacion: null,
        historial: [asset.historial, trace].filter(Boolean).join("\n"),
        userId: req.user.id,
      },
    })
  );
  await writeAudit({
    usuarioId: req.user.id,
    plantaId: asset.plantaId,
    rol: req.user.rol,
    origen: "WEB",
    accion: "ACTIVO_TRANSFERIDO",
    entidad: "Activo",
    entidadId: id,
    datosAntes: asset,
    datosDespues: { ...updated, motivo, plantaDestino: destination },
  });
  res.json(updated);
};

module.exports = {
  getPlants,
  createPlant,
  getUsers,
  createUser,
  updateUser,
  resetPassword,
  getSeasons,
  createSeason,
  activateSeason,
  getTelegramAccesses,
  approveTelegramAccess,
  revokeTelegramAccess,
  getAudits,
  getImports,
  normalizeSeasonCode,
  transferAsset,
};
