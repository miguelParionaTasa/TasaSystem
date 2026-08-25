const TelegramBotClient = require("./TelegramBotClient");
const prisma = require("../controllers/prisma");
const { env } = require("../config/env");
const { registerPendingAccess, authorizeTelegram } = require("./telegramAccessService");
const { createMaterialRequest } = require("./solicitudMaterialService");

const states = new Map();
const setState = (chatId, state) => states.set(String(chatId), { ...state, updatedAt: Date.now() });
const getState = (chatId) => states.get(String(chatId));
const clearState = (chatId) => states.delete(String(chatId));
const keyboard = (rows) => ({ reply_markup: { inline_keyboard: rows } });
const short = (value, max = 48) => String(value || "—").slice(0, max);
const isPrivateChat = (message) => message?.chat?.type === "private";

const iniciarTelegramBot = () => {
  const bot = new TelegramBotClient(env.telegramToken);

  const requirePrivateChat = async (message) => {
    if (isPrivateChat(message)) return true;
    await bot.sendMessage(message.chat.id, "Por seguridad, usa este bot únicamente desde un chat privado.");
    return false;
  };

  const deny = async (msg, plantCode = "PISCO_SUR") => {
    let pending;
    try {
      pending = await registerPendingAccess(msg, plantCode);
    } catch (error) {
      if (error.code === "PLANT_NOT_FOUND") {
        return bot.sendMessage(msg.chat.id, "Código de planta no válido. Usa /start PISCO_SUR o solicita el código a tu administrador.");
      }
      throw error;
    }
    await bot.sendMessage(
      msg.chat.id,
      `No estás autorizado para usar este servicio.\n\nTu ID de Telegram es: ${msg.from.id}\nPlanta solicitada: ${pending.planta.codigo}\nSolicitud registrada: ${pending.activo ? "activa" : "pendiente"}. Pide al administrador de planta que vincule este acceso con tu usuario web.\n\nPara otra planta usa /start CODIGO_PLANTA.`
    );
  };

  const accessFor = (chatId) => authorizeTelegram(String(chatId));

  const menu = async (chatId, access) => {
    clearState(chatId);
    await bot.sendMessage(
      chatId,
      `TASA System · ${access.planta.nombre}\n¿Qué deseas hacer?`,
      keyboard([
        [{ text: "Reservas por OT", callback_data: "consulta_ot" }, { text: "Reservas por zona", callback_data: "consulta_zona" }],
        [{ text: "Buscar material", callback_data: "material" }, { text: "Pedir material", callback_data: "pedido" }],
        [{ text: "Mis pedidos", callback_data: "mis_pedidos" }],
      ])
    );
  };

  bot.onText(/^\/miid(?:@\w+)?$/i, async (msg) => {
    if (!(await requirePrivateChat(msg))) return;
    await bot.sendMessage(msg.chat.id, `Tu ID de Telegram es: ${msg.from.id}\nEste mismo ID funciona desde el celular y la laptop mientras uses la misma cuenta.`);
  });

  bot.onText(/^\/start(?:@\w+)?(?:\s+([A-Z0-9_]+))?$/i, async (msg, match) => {
    if (!(await requirePrivateChat(msg))) return;
    const access = await accessFor(msg.from.id);
    if (!access) return deny(msg, match?.[1] || "PISCO_SUR");
    return menu(msg.chat.id, access);
  });

  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    await bot.answerCallbackQuery(query.id).catch(() => {});
    if (!(await requirePrivateChat(query.message))) return;
    const access = await accessFor(query.from.id);
    if (!access) return deny({ ...query.message, from: query.from });
    const data = query.data;

    if (data === "menu" || data === "cancelar") return menu(chatId, access);
    if (data === "consulta_ot") {
      setState(chatId, { step: "consulta_ot", access });
      return bot.sendMessage(chatId, "Escribe el número de OT.", keyboard([[{ text: "Cancelar", callback_data: "cancelar" }]]));
    }
    if (data === "consulta_zona") {
      const zones = await prisma.oTMovimientoSAP.findMany({
        where: { plantaId: access.plantaId, zona: { not: null } },
        distinct: ["zona"],
        select: { zona: true },
        orderBy: { zona: "asc" },
      });
      setState(chatId, { step: "zonas", access, zones });
      const rows = zones.slice(0, 40).map((item, index) => [{ text: short(item.zona), callback_data: `zona:${index}` }]);
      rows.push([{ text: "Volver", callback_data: "menu" }]);
      return bot.sendMessage(chatId, zones.length ? "Selecciona una zona:" : "No hay zonas importadas para esta planta.", keyboard(rows));
    }
    if (data.startsWith("zona:")) {
      const state = getState(chatId);
      const zone = state?.zones?.[Number(data.split(":")[1])]?.zona;
      if (!zone) return menu(chatId, access);
      const locations = await prisma.oTMovimientoSAP.findMany({
        where: { plantaId: access.plantaId, zona: zone, ubicacion: { not: null } },
        distinct: ["ubicacion"],
        select: { ubicacion: true },
        orderBy: { ubicacion: "asc" },
      });
      setState(chatId, { step: "ubicaciones", access, zone, locations });
      const rows = locations.slice(0, 40).map((item, index) => [{ text: short(item.ubicacion), callback_data: `ubicacion:${index}` }]);
      rows.push([{ text: "Volver", callback_data: "consulta_zona" }]);
      return bot.sendMessage(chatId, `Zona: ${zone}\nSelecciona ubicación:`, keyboard(rows));
    }
    if (data.startsWith("ubicacion:")) {
      const state = getState(chatId);
      const location = state?.locations?.[Number(data.split(":")[1])]?.ubicacion;
      if (!location) return menu(chatId, access);
      const ots = await prisma.oTMovimientoSAP.findMany({
        where: { plantaId: access.plantaId, zona: state.zone, ubicacion: location },
        distinct: ["otNumero"],
        select: { otNumero: true, descripcionOT: true },
        orderBy: { otNumero: "asc" },
        take: 40,
      });
      setState(chatId, { step: "ots_zona", access, ots });
      const rows = ots.map((item, index) => [{ text: `${item.otNumero} · ${short(item.descripcionOT, 28)}`, callback_data: `ot:${index}` }]);
      rows.push([{ text: "Menú", callback_data: "menu" }]);
      return bot.sendMessage(chatId, ots.length ? `OT de ${state.zone} / ${location}:` : "No hay OT en esa ubicación.", keyboard(rows));
    }
    if (data.startsWith("ot:")) {
      const state = getState(chatId);
      const ot = state?.ots?.[Number(data.split(":")[1])]?.otNumero;
      if (!ot) return menu(chatId, access);
      return sendOtMaterials(chatId, access, ot);
    }
    if (data === "material") {
      setState(chatId, { step: "material", access });
      return bot.sendMessage(chatId, "Escribe el código SAP o parte del nombre del material.", keyboard([[{ text: "Cancelar", callback_data: "cancelar" }]]));
    }
    if (data === "pedido") {
      setState(chatId, { step: "pedido_ot", access, materials: [] });
      return bot.sendMessage(chatId, "Escribe la OT para la que necesitas materiales.", keyboard([[{ text: "Cancelar", callback_data: "cancelar" }]]));
    }
    if (data.startsWith("pedido_material:")) {
      const state = getState(chatId);
      const candidate = state?.candidates?.[Number(data.split(":")[1])];
      if (!candidate) return menu(chatId, access);
      setState(chatId, { ...state, step: "pedido_cantidad", selected: candidate });
      return bot.sendMessage(chatId, `Material: ${candidate.nombreMaterial}\nUnidad: ${candidate.unidadMedida || "—"}\nEscribe la cantidad.`);
    }
    if (data === "pedido_manual") {
      const state = getState(chatId);
      setState(chatId, { ...state, step: "pedido_manual" });
      return bot.sendMessage(chatId, "Usa este formato:\nNombre | Unidad | Cantidad\nEjemplo: Rodamiento 6205 | UND | 2");
    }
    if (data === "pedido_otro") {
      const state = getState(chatId);
      setState(chatId, { ...state, step: "pedido_buscar", candidates: null, selected: null });
      return bot.sendMessage(chatId, "Escribe código SAP o nombre del siguiente material.", keyboard([[{ text: "Ingreso manual", callback_data: "pedido_manual" }, { text: "Finalizar", callback_data: "pedido_finalizar" }]]));
    }
    if (data === "pedido_finalizar") {
      const state = getState(chatId);
      if (!state?.materials?.length) return bot.sendMessage(chatId, "Agrega por lo menos un material.");
      const request = await createMaterialRequest({
        plantaId: access.plantaId,
        solicitanteId: access.userId,
        telegramAccesoId: access.id,
        origen: "TELEGRAM",
        temporadaId: state.seasonId,
        otNumero: state.otNumero,
        descripcionOT: state.descripcionOT,
        detalles: state.materials,
      });
      clearState(chatId);
      await bot.sendMessage(chatId, `Pedido ${request.codigo} registrado.\nOT: ${request.otNumero}\nMateriales: ${request.detalles.length}`);
      return menu(chatId, access);
    }
    if (data === "mis_pedidos") {
      const requests = await prisma.solicitudMaterial.findMany({
        where: { plantaId: access.plantaId, solicitanteId: access.userId, origen: "TELEGRAM" },
        include: { detalles: true },
        orderBy: { fechaCreacion: "desc" },
        take: 10,
      });
      const lines = requests.map((item) => `${item.codigo} · OT ${item.otNumero} · ${item.estado} · ${item.detalles.length} material(es)`);
      return bot.sendMessage(chatId, lines.length ? `Tus pedidos recientes:\n\n${lines.join("\n")}` : "Aún no tienes pedidos por Telegram.", keyboard([[{ text: "Menú", callback_data: "menu" }]]));
    }
  });

  const sendOtMaterials = async (chatId, access, otNumero) => {
    const rows = await prisma.oTMovimientoSAP.findMany({
      where: { plantaId: access.plantaId, otNumero: String(otNumero) },
      include: { temporada: { select: { codigo: true } } },
      orderBy: { nombreMaterial: "asc" },
      take: 40,
    });
    if (!rows.length) return bot.sendMessage(chatId, "No se encontraron reservas para esa OT.", keyboard([[{ text: "Menú", callback_data: "menu" }]]));
    const lines = rows.map((item) => `${item.codigoMaterial} · ${short(item.nombreMaterial, 45)} · ${item.cantidad} ${item.unidadMedida || ""} · Reserva ${item.reservaSAP || "—"}`);
    return bot.sendMessage(chatId, `OT ${otNumero} · ${rows[0].temporada?.codigo || "sin temporada"}\n\n${lines.join("\n")}`.slice(0, 3900), keyboard([[{ text: "Nueva consulta", callback_data: "consulta_ot" }, { text: "Menú", callback_data: "menu" }]]));
  };

  const searchMaterials = async (access, query) => {
    const needle = String(query).trim();
    const isCode = /^\d+$/.test(needle);
    const sapRows = await prisma.oTMovimientoSAP.findMany({
      where: {
        plantaId: access.plantaId,
        ...(isCode
          ? { codigoMaterial: { contains: needle } }
          : { nombreMaterial: { contains: needle, mode: "insensitive" } }),
      },
      distinct: ["codigoMaterial", "nombreMaterial"],
      select: { codigoMaterial: true, nombreMaterial: true, unidadMedida: true },
      take: 10,
    });
    return sapRows.map((item) => ({
      codigoMaterial: item.codigoMaterial,
      nombreMaterial: item.nombreMaterial || item.codigoMaterial,
      unidadMedida: item.unidadMedida,
    }));
  };

  bot.on("message", async (msg) => {
    const input = msg.text?.trim();
    if (!input || input.startsWith("/")) return;
    if (!(await requirePrivateChat(msg))) return;
    const access = await accessFor(msg.from.id);
    if (!access) return deny(msg);
    const state = getState(msg.chat.id);
    if (!state) return menu(msg.chat.id, access);

    if (state.step === "consulta_ot") return sendOtMaterials(msg.chat.id, access, input);
    if (state.step === "material") {
      const materials = await searchMaterials(access, input);
      const lines = materials.map((item) => `${item.codigoMaterial} · ${short(item.nombreMaterial)} · ${item.unidadMedida || "—"}`);
      return bot.sendMessage(msg.chat.id, lines.length ? lines.join("\n") : "No se encontraron materiales.", keyboard([[{ text: "Nueva búsqueda", callback_data: "material" }, { text: "Menú", callback_data: "menu" }]]));
    }
    if (state.step === "pedido_ot") {
      const ot = await prisma.oTBot.findFirst({ where: { plantaId: access.plantaId, otNumero: input }, include: { temporada: true } });
      const sap = ot ? null : await prisma.oTMovimientoSAP.findFirst({ where: { plantaId: access.plantaId, otNumero: input }, include: { temporada: true } });
      const source = ot || sap;
      if (!source) return bot.sendMessage(msg.chat.id, "La OT no existe en la planta seleccionada. Intenta nuevamente.");
      setState(msg.chat.id, { ...state, step: "pedido_buscar", otNumero: input, descripcionOT: source.descripcionOT, seasonId: source.temporadaId });
      return bot.sendMessage(msg.chat.id, `OT ${input} confirmada.\nEscribe código SAP o nombre del material.`, keyboard([[{ text: "Ingreso manual", callback_data: "pedido_manual" }, { text: "Cancelar", callback_data: "cancelar" }]]));
    }
    if (state.step === "pedido_buscar") {
      const candidates = await searchMaterials(access, input);
      if (!candidates.length) {
        return bot.sendMessage(msg.chat.id, "No encontré coincidencias. Puedes probar otra búsqueda o ingresar manualmente.", keyboard([[{ text: "Ingreso manual", callback_data: "pedido_manual" }]]));
      }
      setState(msg.chat.id, { ...state, candidates });
      return bot.sendMessage(msg.chat.id, "Selecciona el material:", keyboard([
        ...candidates.map((item, index) => [{ text: `${item.codigoMaterial} · ${short(item.nombreMaterial, 30)}`, callback_data: `pedido_material:${index}` }]),
        [{ text: "Ingreso manual", callback_data: "pedido_manual" }],
      ]));
    }
    if (state.step === "pedido_cantidad") {
      const quantity = Number(input.replace(",", "."));
      if (!Number.isFinite(quantity) || quantity <= 0) return bot.sendMessage(msg.chat.id, "Escribe una cantidad mayor que cero.");
      const materials = [...state.materials, { ...state.selected, cantidad: quantity }];
      setState(msg.chat.id, { ...state, materials, step: "pedido_listo", selected: null, candidates: null });
      return bot.sendMessage(msg.chat.id, `Material agregado. Total: ${materials.length}.`, keyboard([[{ text: "Agregar otro", callback_data: "pedido_otro" }, { text: "Finalizar", callback_data: "pedido_finalizar" }], [{ text: "Cancelar", callback_data: "cancelar" }]]));
    }
    if (state.step === "pedido_manual") {
      const parts = input.split("|").map((part) => part.trim());
      const quantity = Number((parts[2] || "").replace(",", "."));
      if (parts.length !== 3 || !parts[0] || !Number.isFinite(quantity) || quantity <= 0) return bot.sendMessage(msg.chat.id, "Formato inválido. Usa: Nombre | Unidad | Cantidad");
      const materials = [...state.materials, { nombreMaterial: parts[0], unidadMedida: parts[1] || null, cantidad: quantity }];
      setState(msg.chat.id, { ...state, materials, step: "pedido_listo" });
      return bot.sendMessage(msg.chat.id, `Material agregado. Total: ${materials.length}.`, keyboard([[{ text: "Agregar otro", callback_data: "pedido_otro" }, { text: "Finalizar", callback_data: "pedido_finalizar" }], [{ text: "Cancelar", callback_data: "cancelar" }]]));
    }
  });

  bot.on("polling_error", (error) => console.error("Error de Telegram:", error.message));
  void bot.start();
  console.log("Bot de Telegram iniciado con lista de acceso.");
  return bot;
};

module.exports = iniciarTelegramBot;
