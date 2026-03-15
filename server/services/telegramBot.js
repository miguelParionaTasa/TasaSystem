const TelegramBot = require("node-telegram-bot-api");
const consultasBot = require("./bot/modulos/consultas");
const pedidosBot = require("./bot/modulos/pedidos");
const materialBot  = require("./bot/modulos/material"); // 👈 NUEVO
const token = process.env.TELEGRAM_BOT_TOKEN;

const estados = {};

function iniciarTelegramBot(){

    const bot = new TelegramBot(token,{polling:true});

    console.log("🤖 Bot iniciado");

    function menuPrincipal(chatId){

        estados[chatId] = {paso:"menu"};

        bot.sendMessage(chatId,
        "👷‍♂️ *Sistema de pedidos de mantenimiento*\n\nSelecciona una opción:",
        {
            parse_mode:"Markdown",
            reply_markup:{
                inline_keyboard:[
                    [{text:"🔎 Consultar pedidos",callback_data:"consultar"}],
                    [{text:"🧰 Consulta material",callback_data:"material"}],
                    [{text:"📦 Pedir material",callback_data:"pedir"}],
                    [{text:"❌ Cancelar",callback_data:"cancelar"}]
                ]
            }
        });

    }

    // ===============================
    // COMANDO /START
    // ===============================

    bot.onText(/\/start/, (msg)=>{

        const chatId = msg.chat.id;

        menuPrincipal(chatId);

    });

    // ===============================
    // CUALQUIER MENSAJE
    // ===============================

    bot.on("message",(msg)=>{

    const chatId = msg.chat.id;
    const texto = msg.text?.trim();

    // ignorar comandos
    if(texto?.startsWith("/")) return;

    // si no existe estado → mostrar menú
    if(!estados[chatId]){
        return menuPrincipal(chatId);
    }

    // si está en el menú y escribe cualquier cosa → volver a mostrar menú
    if(estados[chatId].paso === "menu"){
        return menuPrincipal(chatId);
    }

});

    // cargar módulo consultas
    consultasBot(bot, estados, menuPrincipal);
    pedidosBot(bot, estados, menuPrincipal);
      materialBot(bot, estados, menuPrincipal); 

}

module.exports = iniciarTelegramBot;