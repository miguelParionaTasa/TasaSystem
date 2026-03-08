function pedidosBot(bot, estados, menuPrincipal){

bot.on("callback_query", async (query)=>{

    const chatId = query.message.chat.id;
    const data = query.data;

    if(data === "pedir"){

        bot.sendMessage(chatId,
        "📦 *Módulo de pedido de material*\n\n🚧 En desarrollo",
        {
            parse_mode:"Markdown",
            reply_markup:{
                inline_keyboard:[
                    [{text:"🏠 Menú principal",callback_data:"menu"}],
                    [{text:"❌ Cancelar",callback_data:"cancelar"}]
                ]
            }
        });

    }

});

}

module.exports = pedidosBot;