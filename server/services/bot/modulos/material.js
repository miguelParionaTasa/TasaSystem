// services/bot/modulos/material.js
const prisma = require("../../../controllers/prisma");

module.exports = function materialBot(bot, estados, menuPrincipal) {

const PASO_MENU="material_menu";
const PASO_CODIGO="material_codigo_espera";
const PASO_NOMBRE="material_nombre_espera";

function showMaterialMenu(chatId){

estados[chatId]={paso:PASO_MENU};

bot.sendMessage(chatId,
"🧰 *Consulta material*\nElige cómo quieres buscar:",
{
parse_mode:"Markdown",
reply_markup:{
inline_keyboard:[
[{text:"🔢 Código de material",callback_data:"material_codigo"}],
[{text:"🔤 Nombre de material",callback_data:"material_nombre"}],
[{text:"⬅️ Volver",callback_data:"material_volver"}]
]
}
}
);

}


/* =================================
CALLBACKS
================================= */

bot.on("callback_query",async(query)=>{

const chatId=query.message.chat.id;
const data=query.data;

bot.answerCallbackQuery(query.id).catch(()=>{});

if(data==="material") return showMaterialMenu(chatId);

if(data==="material_volver"){
delete estados[chatId];
return menuPrincipal(chatId);
}

if(data==="material_codigo"){
estados[chatId]={paso:PASO_CODIGO};
return bot.sendMessage(chatId,
"Escribe el *código numérico* del material.\n\nEjemplo: `33063062`",
{parse_mode:"Markdown"}
);
}

if(data==="material_nombre"){
estados[chatId]={paso:PASO_NOMBRE};
return bot.sendMessage(chatId,
"Escribe el *nombre* del material.\nEjemplo: `canal 12`",
{parse_mode:"Markdown"}
);
}

if(data==="material_reset"){
return showMaterialMenu(chatId);
}


/* =================================
VER HISTORIAL DEL MATERIAL
================================= */

if(data.startsWith("material_ver_")){

const codigo=data.replace("material_ver_","");

const registros=await prisma.oTMovimientoSAP.findMany({
where:{codigoMaterial:codigo},
select:{
otNumero:true,
descripcionOT:true,
reservaSAP:true,
unidadMedida:true,
cantidad:true,
comentario:true
},
orderBy:{otNumero:"desc"},
take:20
});

if(!registros.length){
return bot.sendMessage(chatId,"No hay historial de OTs para este material.");
}

const lines=registros.map(r=>{

const desc=(r.descripcionOT||"").slice(0,20);

return `${r.otNumero} | ${desc} | ${r.reservaSAP||"-"} | ${r.unidadMedida||"-"} | ${r.cantidad||0} | ${r.comentario||""}`;

});

return bot.sendMessage(chatId,

`📋 *Historial OT material ${escapeMd(codigo)}*\n\n`+
"OT | Descripción | Reserva | UM | Cant | Coment\n"+
"------------------------------------------------\n"+
lines.join("\n"),

{
parse_mode:"Markdown",
reply_markup:{
inline_keyboard:[
[{text:"🔁 Nueva búsqueda",callback_data:"material_reset"}],
[{text:"⬅️ Volver",callback_data:"material_volver"}]
]
}
}

);

}

});


/* =================================
MENSAJES
================================= */

bot.on("message",async(msg)=>{

const chatId=msg.chat.id;
const texto=msg.text?.trim();

if(!texto||texto.startsWith("/")) return;

const paso=estados[chatId]?.paso;

if(paso===PASO_CODIGO){

const soloDigitos=texto.replace(/\D/g,"");

if(!soloDigitos){
return bot.sendMessage(chatId,"⚠️ Debes escribir solo números.");
}

return handleBuscarPorCodigo(chatId,soloDigitos);

}

if(paso===PASO_NOMBRE){
return handleBuscarPorNombre(chatId,texto);
}

});


/* =================================
BUSCAR POR CODIGO
================================= */

async function handleBuscarPorCodigo(chatId, codigoInput) {

const codigo = codigoInput.replace(/\D/g,"");

if(!codigo){
return bot.sendMessage(chatId,"⚠️ Debes escribir solo números.");
}

/* =================================
CASO 1: CODIGO COMPLETO (8 DIGITOS)
================================= */

if(codigo.length === 8){

const material = await prisma.oTMovimientoSAP.findFirst({
where:{ codigoMaterial: codigo },
select:{
codigoMaterial:true,
nombreMaterial:true
}
});

if(!material){

return bot.sendMessage(chatId,
"No encontré ese código de material."
);

}

return bot.sendMessage(chatId,
`🔎 *Material encontrado*\n\n• *${escapeMd(material.codigoMaterial)}* — ${escapeMd(material.nombreMaterial)}`,
{
parse_mode:"Markdown",
reply_markup:{
inline_keyboard:[
[{
text:"📋 Ver historial OT",
callback_data:`material_ver_${material.codigoMaterial}`
}],
[{text:"⬅️ Volver",callback_data:"material_volver"}]
]
}
}

);

}

/* =================================
CASO 2: BUSQUEDA PARCIAL
================================= */

const materiales = await prisma.oTMovimientoSAP.findMany({

where:{
codigoMaterial:{
contains: codigo
}
},

distinct:["codigoMaterial","nombreMaterial"],

select:{
codigoMaterial:true,
nombreMaterial:true
},

take:10

});


if(!materiales.length){

return bot.sendMessage(chatId,
"No encontré materiales con esa secuencia."
);

}


const keyboard = materiales.map(m=>[
{
text:`${m.codigoMaterial} — ${m.nombreMaterial.slice(0,30)}`,
callback_data:`material_ver_${m.codigoMaterial}`
}
]);


keyboard.push([{text:"⬅️ Volver",callback_data:"material_volver"}]);


return bot.sendMessage(chatId,

`🔢 *Resultados por código (“${codigo}”)*\nToca uno para ver historial:`,

{
parse_mode:"Markdown",
reply_markup:{
inline_keyboard: keyboard
}
}

);

}


/* =================================
BUSCAR POR NOMBRE
================================= */

async function handleBuscarPorNombre(chatId,nombreInput){

const palabras=tokenize(nombreInput);

const whereAND=palabras.map(p=>({
nombreMaterial:{contains:p,mode:"insensitive"}
}));

const encontrados=await prisma.oTMovimientoSAP.findMany({
where:{AND:whereAND},
distinct:["codigoMaterial","nombreMaterial"],
select:{codigoMaterial:true,nombreMaterial:true},
take:20
});

if(!encontrados.length){

estados[chatId]={paso:PASO_MENU};

return bot.sendMessage(chatId,"No se encontraron materiales.");

}

const keyboard=encontrados.map(m=>[
{
text:`${m.codigoMaterial} — ${m.nombreMaterial.slice(0,30)}`,
callback_data:`material_ver_${m.codigoMaterial}`
}
]);

keyboard.push([{text:"⬅️ Volver",callback_data:"material_volver"}]);

return bot.sendMessage(chatId,

`🔤 *Resultados por nombre (“${escapeMd(nombreInput)}”)*\nToca uno para ver historial:`,

{
parse_mode:"Markdown",
reply_markup:{inline_keyboard:keyboard}
}

);

}


/* =================================
HELPERS
================================= */

function normalize(s){
return(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
}

function tokenize(s){
return normalize(s).split(/\s+/).filter(Boolean);
}

function escapeMd(s=""){
return String(s).replace(/(_*[\~`>#+\-=|{}.!\\])/g,"\\$1");
}

};