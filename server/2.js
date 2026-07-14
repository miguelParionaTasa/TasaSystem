const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const CARPETA_TRABAJO = path.join(process.env.USERPROFILE, 'Downloads');
const ARCHIVO_ANVERSO = path.join(CARPETA_TRABAJO, 'Lup.pdf');
const ARCHIVO_REVERSO = path.join(CARPETA_TRABAJO, 'lup pos.pdf');

async function procesarPDFsDirecto() {
    try {
        console.log('Leyendo archivos PDF...');
        const bytesAnverso = fs.readFileSync(ARCHIVO_ANVERSO);
        const bytesReverso = fs.readFileSync(ARCHIVO_REVERSO);

        const pdfAnverso = await PDFDocument.load(bytesAnverso);
        const pdfReverso = await PDFDocument.load(bytesReverso);

        const totalPaginas = pdfAnverso.getPageCount(); 

        console.log(`Iniciando el proceso directo para ${totalPaginas} documentos...`);

        for (let i = 0; i < totalPaginas; i++) {
            const nuevoPdf = await PDFDocument.create();

            // Toma la página 'i' de anverso (Comienza en 0 para la página 1)
            const [paginaAnverso] = await nuevoPdf.copyPages(pdfAnverso, [i]);
            nuevoPdf.addPage(paginaAnverso);

            // Toma la misma página 'i' de reverso de forma directa
            const [paginaReverso] = await nuevoPdf.copyPages(pdfReverso, [i]);
            nuevoPdf.addPage(paginaReverso);

            const bytesNuevoPdf = await nuevoPdf.save();
            const nombreSalida = path.join(CARPETA_TRABAJO, `documento_final_${i + 1}.pdf`);
            
            fs.writeFileSync(nombreSalida, bytesNuevoPdf);
            console.log(`✅ Guardado: documento_final_${i + 1}.pdf (Anverso pág. ${i + 1} + Reverso pág. ${i + 1})`);
        }

        console.log('¡Proceso terminado con éxito!');
    } catch (error) {
        console.error('Ocurrió un error durante el procesamiento:', error);
    }
}

procesarPDFsDirecto();
