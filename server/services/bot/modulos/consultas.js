const prisma = require("../../../controllers/prisma");

function consultasBot(bot, estados, menuPrincipal){

// ===============================
// MENSAJES
// ===============================

bot.on("message", async (msg)=>{

    const chatId = msg.chat.id;
    const texto = msg.text?.trim();

    if(!texto) return;

    const estado = estados[chatId];
    if(!estado) return;

    // ===============================
    // ZONA POR NUMERO
    // ===============================

    if(estado.paso === "seleccion_zona"){

        const zonas = estado.zonas;

        if(!/^\d+$/.test(texto)){
            bot.sendMessage(chatId,"⚠️ Debes escribir el número de zona.");
            return;
        }

        const indice = parseInt(texto) - 1;

        if(indice < 0 || indice >= zonas.length){
            bot.sendMessage(chatId,"⚠️ Ese número de zona no existe.");
            return;
        }

        const zona = zonas[indice];

        estados[chatId] = { zona };

        const ubicaciones = await prisma.oTMovimientoSAP.findMany({
            where:{zona},
            distinct:["ubicacion"],
            select:{ubicacion:true},
            orderBy:{ubicacion:"asc"}
        });

        const botones = ubicaciones.map(u=>[
            {
                text:`🏭 ${u.ubicacion}`,
                callback_data:`ubicacion_${u.ubicacion}`
            }
        ]);

        botones.push([{text:"⬅ Volver",callback_data:"consulta_zona"}]);
        botones.push([{text:"❌ Cancelar",callback_data:"cancelar"}]);

        bot.sendMessage(chatId,
        `📍 Zona seleccionada: *${zona}*\n\nSelecciona ubicación`,
        {
            parse_mode:"Markdown",
            reply_markup:{inline_keyboard:botones}
        });

        return;
    }


    // ===============================
    // ESPERANDO OT
    // ===============================

    if(estado.esperandoOT){

        if(!/^\d+$/.test(texto)){
            bot.sendMessage(chatId,"⚠️ Debes escribir solo números.");
            return;
        }

        const otNumero = texto;

        const materiales = await prisma.oTMovimientoSAP.findMany({
            where:{otNumero},
            orderBy:{nombreMaterial:"asc"}
        });

        if(materiales.length === 0){

            bot.sendMessage(chatId,"⚠️ No se encontraron materiales");

            delete estados[chatId];

            return menuPrincipal(chatId);
        }

        const descripcionOT = materiales[0]?.descripcionOT || "";

        let respuesta = `📦 *Materiales OT ${otNumero} - ${descripcionOT}*\n\n`;

        materiales.forEach(m=>{

            respuesta += `🔧 *${m.codigoMaterial}*\n`;
            respuesta += `${m.nombreMaterial}\n`;
            respuesta += `Cantidad: ${m.cantidad} ${m.unidadMedida}\n`;
            respuesta += `Reserva SAP: ${m.reservaSAP || "—"}\n`;

            if(m.comentario){
                respuesta += `Comentario: ${m.comentario}\n`;
            }

            respuesta += `\n`;

        });

        bot.sendMessage(chatId,respuesta,{
            parse_mode:"Markdown",
            reply_markup:{
                inline_keyboard:[
                    [{text:"🔎 Nueva consulta",callback_data:"consultar"}],
                    [{text:"🏠 Menú principal",callback_data:"menu"}]
                ]
            }
        });

        delete estados[chatId];

        return;
    }

});


// ===============================
// CALLBACKS
// ===============================

bot.on("callback_query", async (query)=>{

    const chatId = query.message.chat.id;
    const data = query.data;

    bot.answerCallbackQuery(query.id);
// ===============================
// MENU PRINCIPAL
// ===============================

if(data === "menu"){

    delete estados[chatId];

    return menuPrincipal(chatId);
}


// ===============================
// CANCELAR
// ===============================

if(data === "cancelar"){

    delete estados[chatId];

    bot.sendMessage(chatId,"❌ Operación cancelada");

    return menuPrincipal(chatId);
}
    // ===============================
    // MENU CONSULTAS
    // ===============================

    if(data === "consultar"){

        bot.sendMessage(chatId,
        "🔎 *Selecciona tipo de consulta*",
        {
            parse_mode:"Markdown",
            reply_markup:{
                inline_keyboard:[
                    [{text:"🔢 Especificar OT",callback_data:"consulta_ot"}],
                    [{text:"📍 Buscar por zona",callback_data:"consulta_zona"}],
                    [{text:"🏠 Menú principal",callback_data:"menu"}],
                    [{text:"❌ Cancelar",callback_data:"cancelar"}]
                ]
            }
        });

        return;
    }

    // ===============================
    // CONSULTA OT
    // ===============================

    if(data === "consulta_ot"){

        estados[chatId] = {esperandoOT:true};

        bot.sendMessage(chatId,
        "✏️ *Escribe el número de OT*\n\nEjemplo: `777540`",
        {
            parse_mode:"Markdown",
            reply_markup:{
                inline_keyboard:[
                    [{text:"🏠 Menú principal",callback_data:"menu"}],
                    [{text:"❌ Cancelar",callback_data:"cancelar"}]
                ]
            }
        });

        return;
    }

    // ===============================
    // CONSULTA POR ZONA
    // ===============================

    if(data === "consulta_zona"){

    const zonas = await prisma.oTMovimientoSAP.findMany({
        distinct:["zona"],
        select:{zona:true},
        orderBy:{zona:"asc"}
    });

    const listaZonas = zonas.map(z=>z.zona);

    estados[chatId] = {
        paso:"seleccion_zona",
        zonas: listaZonas
    };

    let mensaje = "📍 *Selecciona zona*\n\n";

    listaZonas.forEach((z,i)=>{
        
    });

    const botones = listaZonas.map(z=>[
        {
            text:`📍 ${z}`,
            callback_data:`zona_${z}`
        }
    ]);

    botones.push([{text:"🏠 Menú principal",callback_data:"menu"}]);
    botones.push([{text:"❌ Cancelar",callback_data:"cancelar"}]);

    bot.sendMessage(chatId,mensaje,{
        parse_mode:"Markdown",
        reply_markup:{inline_keyboard:botones}
    });

    return;
}

    // ===============================
    // SELECCION ZONA
    // ===============================

    if(data.startsWith("zona_")){

        const zona = data.replace("zona_","");

        estados[chatId] = {zona};

        const ubicaciones = await prisma.oTMovimientoSAP.findMany({
            where:{zona},
            distinct:["ubicacion"],
            select:{ubicacion:true},
            orderBy:{ubicacion:"asc"}
        });

        const botones = ubicaciones.map(u=>[
            {
                text:`🏭 ${u.ubicacion}`,
                callback_data:`ubicacion_${u.ubicacion}`
            }
        ]);

        botones.push([{text:"⬅ Volver",callback_data:"consulta_zona"}]);
        botones.push([{text:"❌ Cancelar",callback_data:"cancelar"}]);

        bot.sendMessage(chatId,
        `📍 *Zona:* ${zona}\n\nSelecciona ubicación`,
        {
            parse_mode:"Markdown",
            reply_markup:{inline_keyboard:botones}
        });

        return;
    }

    // ===============================
    // SELECCION UBICACION
    // ===============================

    if(data.startsWith("ubicacion_")){

        const ubicacion = data.replace("ubicacion_","");
        const zona = estados[chatId]?.zona;

        estados[chatId].ubicacion = ubicacion;

        const ots = await prisma.oTMovimientoSAP.findMany({

            where:{
                zona,
                ubicacion
            },

            distinct:["otNumero"],

            select:{
                otNumero:true,
                descripcionOT:true
            },

            orderBy:{
                otNumero:"asc"
            }

        });

        const botones = ots.map(o=>[
            {
                text:`🔧 ${o.otNumero} - ${o.descripcionOT}`,
                callback_data:`ot_${o.otNumero}`
            }
        ]);

        botones.push([{text:"⬅ Volver zonas",callback_data:"consulta_zona"}]);
        botones.push([{text:"❌ Cancelar",callback_data:"cancelar"}]);

        bot.sendMessage(chatId,
        `🏭 *Ubicación:* ${ubicacion}\n\nSelecciona OT`,
        {
            parse_mode:"Markdown",
            reply_markup:{inline_keyboard:botones}
        });

        return;
    }

    // ===============================
    // SELECCION OT
    // ===============================

    if(data.startsWith("ot_")){

        const otNumero = data.replace("ot_","");

        const materiales = await prisma.oTMovimientoSAP.findMany({
            where:{otNumero},
            orderBy:{nombreMaterial:"asc"}
        });

        if(materiales.length === 0){

            bot.sendMessage(chatId,"⚠️ No se encontraron materiales");

            return menuPrincipal(chatId);
        }

        const descripcionOT = materiales[0]?.descripcionOT || "";

        let respuesta = `📦 *Materiales OT ${otNumero} - ${descripcionOT}*\n\n`;

        materiales.forEach(m=>{

            respuesta += `🔧 *${m.codigoMaterial}*\n`;
            respuesta += `${m.nombreMaterial}\n`;
            respuesta += `Cantidad: ${m.cantidad} ${m.unidadMedida}\n`;
            respuesta += `Reserva SAP: ${m.reservaSAP || "—"}\n`;

            if(m.comentario){
                respuesta += `Comentario: ${m.comentario}\n`;
            }

            respuesta += `\n`;

        });

        bot.sendMessage(chatId,respuesta,{
            parse_mode:"Markdown",
            reply_markup:{
                inline_keyboard:[
                    [{text:"🔎 Nueva consulta",callback_data:"consultar"}],
                    [{text:"🏠 Menú principal",callback_data:"menu"}]
                ]
            }
        });

        delete estados[chatId];

        return;
    }

});

}

module.exports = consultasBot;