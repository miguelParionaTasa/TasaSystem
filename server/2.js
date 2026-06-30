const fs = require('fs');
const path = require('path');
// Importamos la librería compatible que no da fallos de inicialización
const pdfParse = require('pdf-parse-fork');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

const CARPETA_TRABAJO = path.join(process.env.USERPROFILE, 'Downloads');
const ARCHIVOS_PDF = [
    { nombre: '1abc.pdf', ruta: path.join(CARPETA_TRABAJO, '1abc.pdf') },
    { nombre: '2abc.pdf', ruta: path.join(CARPETA_TRABAJO, '2abc.pdf') }
];
const ARCHIVO_SALIDA_WORD = path.join(CARPETA_TRABAJO, 'Resultado_Items.docx');

async function extraerTextosAWord() {
    try {
        const hijosDocumento = [];

        // Título principal en el archivo Word
        hijosDocumento.push(
            new Paragraph({
                text: "EXTRACCIÓN DE ÍTEMS DESDE ARCHIVOS PDF",
                heading: HeadingLevel.TITLE,
                spacing: { after: 300 }
            })
        );

        for (const pdfInfo of ARCHIVOS_PDF) {
            if (!fs.existsSync(pdfInfo.ruta)) {
                console.log(`⚠️ El archivo no existe en descargas: ${pdfInfo.nombre}`);
                continue;
            }

            console.log(`Leyendo y procesando texto de: ${pdfInfo.nombre}...`);
            const dataBuffer = fs.readFileSync(pdfInfo.ruta);
            
            // Extracción nativa del texto
            const datosPdf = await pdfParse(dataBuffer);
            
            // Separar el texto extraído línea por línea (ítem por ítem)
            const lineas = datosPdf.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            // Encabezado de sección para identificar el archivo de origen
            hijosDocumento.push(
                new Paragraph({
                    text: `Contenido de: ${pdfInfo.nombre}`,
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 200, after: 150 }
                })
            );

            if (lineas.length === 0) {
                hijosDocumento.push(new Paragraph({ text: "*(No se detectó texto digital legible en este documento)*" }));
            }

            // Agregar cada línea como un ítem de lista estructurado
            lineas.forEach((linea, index) => {
                hijosDocumento.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Ítem ${index + 1}: `, bold: true, color: "003366" }),
                            new TextRun({ text: linea })
                        ],
                        spacing: { after: 100 }
                    })
                );
            });
        }

        // Estructurar y empaquetar el archivo definitivo de Word
        const doc = new Document({
            sections: [{
                properties: {},
                children: hijosDocumento
            }]
        });

        const b64string = await Packer.toBase64String(doc);
        fs.writeFileSync(ARCHIVO_SALIDA_WORD, Buffer.from(b64string, 'base64'));

        console.log(`\n✅ ¡Proceso completado con éxito!`);
        console.log(`📁 Archivo generado en: ${ARCHIVO_SALIDA_WORD}`);

    } catch (error) {
        console.error('Ocurrió un error inesperado al procesar los documentos:', error);
    }
}

extraerTextosAWord();
