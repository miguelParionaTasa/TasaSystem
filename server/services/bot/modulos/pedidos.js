const axios = require("axios");
const API_URL = process.env.API_URL; // así funciona en Node.js



function pedidosBot(bot, estados, menuPrincipal) {

  // ===============================
  // CALLBACK QUERY
  // ===============================
  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    // -------------------------------
    // INICIO PEDIDO
    // -------------------------------
    if (data === "pedir") {
      estados[chatId] = { paso: "esperando_ot" };

      bot.sendMessage(chatId,
        "📦 *Pedido de material*\n\nEscribe el número de OT:",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "❌ Cancelar", callback_data: "cancelar" }]
            ]
          }
        });
    }

    // -------------------------------
    // BOTÓN INGRESAR PEDIDO
    // -------------------------------
    if (data.startsWith("pedido_ot_")) {
      const otNumero = data.replace("pedido_ot_", "");
      estados[chatId] = {
        paso: "seleccion_material",
        otNumero,
        materiales: [],
        buscandoSAP: true
      };

      bot.sendMessage(chatId,
        `📝 Ingresa el material que deseas pedir para la OT ${otNumero}.\nPuedes buscar por SAP escribiendo parte del nombre, o ingresar manualmente si no existe.`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "✏️ Ingreso manual rápido", callback_data: "manual_rapido" }]
            ]
          }
        });
    }

    // -------------------------------
    // BOTÓN DE INGRESO MANUAL DIRECTO
    // -------------------------------
    if (data === "manual_rapido") {
      const estado = estados[chatId];
      estado.buscandoSAP = false;
      estado.paso = "seleccion_material";

      bot.sendMessage(chatId,
        "✏️ Modo manual activado.\nIngresa el material en formato: *NombreMaterial,UnidadMedida,Cantidad*",
        { parse_mode: "Markdown" });
    }

    // -------------------------------
    // FINALIZAR PEDIDO
    // -------------------------------
    if (data === "finalizar_pedido") {
      const pedido = estados[chatId];
      if (!pedido || pedido.materiales.length === 0) {
        return bot.sendMessage(chatId, "⚠️ No hay materiales registrados.");
      }

      try {
        for (const mat of pedido.materiales) {
          await axios.post(`${API_URL}/ot-consumibles/`, {
            otNumero: pedido.otNumero,
            material: mat.nombre,
            cantidad: mat.cantidad,
            unidadMedida: mat.unidadMedida || "",
            codMaximo: mat.codMaximo || "",
            telegramUserId: chatId,
            fechaPedido: new Date()
          });
        }

        bot.sendMessage(chatId,
          `✅ Pedido registrado correctamente para la OT ${pedido.otNumero}.\nTotal de materiales: ${pedido.materiales.length}`,
          { parse_mode: "Markdown" });

        delete estados[chatId];
      } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "❌ Error registrando pedido. Verifica que el backend tenga POST /pedidos activo.");
      }
    }

    // -------------------------------
    // SELECCIÓN DE MATERIAL SAP
    // -------------------------------
    if (data.startsWith("selmat_")) {
      const matId = data.replace("selmat_", "");
      const pedido = estados[chatId];

      try {
        const res = await axios.get(`${API_URL}/consumibles/${matId}`);
        const mat = res.data;

        pedido.paso = "cantidad_material";
        pedido.materialSeleccionado = mat;

        bot.sendMessage(chatId,
          `📦 Material seleccionado: *${mat.name}* (${mat.unidadMedida})\nIngresa la cantidad deseada:`,
          { parse_mode: "Markdown" });
      } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "❌ Error obteniendo material SAP");
      }
    }
  });

  // ===============================
  // MENSAJES
  // ===============================
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const texto = msg.text?.trim();
    if (!estados[chatId]) return;

    const estado = estados[chatId];

    // -------------------------------
    // CAPTURAR OT
    // -------------------------------
    if (estado.paso === "esperando_ot") {
      const otNumero = texto;

      try {
        const res = await axios.get(`${API_URL}/otbot/numero/${otNumero}`);
        const ot = res.data;

        if (!ot) {
          return bot.sendMessage(chatId, "❌ OT no encontrada\nIntenta nuevamente.");
        }

        estados[chatId] = { paso: "ot_confirmada", otNumero };

        bot.sendMessage(chatId,
          `✅ *OT encontrada*\n\nOT: ${ot.otNumero}\nEstado: ${ot.estado}\nUbicación: ${ot.ubicacion}\nResponsable: ${ot.telegramUserId ? "Ya asignada" : "Sin asignar"}\n\n¿Qué deseas hacer?`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "📝 Ingresar pedido", callback_data: `pedido_ot_${ot.otNumero}` }],
                [{ text: "❌ Cancelar", callback_data: "cancelar" }]
              ]
            }
          });
      } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "❌ Error consultando OT");
      }
    }

    // -------------------------------
    // SELECCIÓN DE MATERIAL / AUTOCOMPLETADO SAP
    // -------------------------------
    if (estado.paso === "seleccion_material") {
      if (estado.buscandoSAP) {
        try {
          const res = await axios.get(`${API_URL}/consumibles`);
          const consumibles = res.data;

          const matches = consumibles.filter(c =>
            c.name.toLowerCase().includes(texto.toLowerCase())
          );

          if (matches.length > 0) {
            const keyboard = matches.slice(0, 5).map(c => [{ text: `${c.name} (${c.unidadMedida})`, callback_data: `selmat_${c.id}` }]);
            bot.sendMessage(chatId, "🔎 Materiales encontrados, selecciona uno:", {
              reply_markup: { inline_keyboard: keyboard }
            });
          } else {
            estado.buscandoSAP = false;
            bot.sendMessage(chatId,
              "⚠️ No se encontró el material en SAP.\nIngresa manualmente en formato: *NombreMaterial,UnidadMedida,Cantidad*",
              { parse_mode: "Markdown" });
          }
        } catch (error) {
          console.error(error);
          bot.sendMessage(chatId, "❌ Error consultando consumibles SAP");
        }
      } else {
        // INGRESO MANUAL
        const partes = texto.split(",");
        if (partes.length !== 3 || isNaN(partes[2])) {
          return bot.sendMessage(chatId, "⚠️ Formato incorrecto. Usa: *NombreMaterial,UnidadMedida,Cantidad*", { parse_mode: "Markdown" });
        }

        const [nombre, unidadMedida, cantidadStr] = partes.map(p => p.trim());
        const cantidad = parseInt(cantidadStr);

        estado.materiales.push({ nombre, cantidad, unidadMedida });

        bot.sendMessage(chatId,
          `✅ Material manual agregado: ${nombre} (Cantidad: ${cantidad}, Unidad: ${unidadMedida})\n\n¿Deseas agregar otro material?`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "➕ Agregar otro material", callback_data: `pedido_ot_${estado.otNumero}` }],
                [{ text: "✅ Finalizar pedido", callback_data: "finalizar_pedido" }]
              ]
            }
          });
      }
    }

    // -------------------------------
    // CAPTURAR CANTIDAD DEL MATERIAL SAP
    // -------------------------------
    if (estado.paso === "cantidad_material" && estado.materialSeleccionado) {
      const cantidad = parseInt(texto);
      if (isNaN(cantidad)) {
        return bot.sendMessage(chatId, "⚠️ Ingresa un número válido para la cantidad");
      }

      estado.materiales.push({
        nombre: estado.materialSeleccionado.name,
        cantidad,
        unidadMedida: estado.materialSeleccionado.unidadMedida,
        codMaximo: estado.materialSeleccionado.codMaximo
      });

      delete estado.materialSeleccionado;

      bot.sendMessage(chatId,
        `✅ Material agregado.\n\n¿Deseas agregar otro material?`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "➕ Agregar otro material", callback_data: `pedido_ot_${estado.otNumero}` }],
              [{ text: "✅ Finalizar pedido", callback_data: "finalizar_pedido" }]
            ]
          }
        });

      estado.paso = "seleccion_material";
    }
  });

}

module.exports = pedidosBot;