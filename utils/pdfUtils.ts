import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@5.4.296/build/pdf.worker.min.js';

export async function extractTextFromPdf(file: File): Promise<string> {
  const fileReader = new FileReader();
  
  return new Promise((resolve, reject) => {
    fileReader.onload = async (event) => {
      if (!event.target?.result) {
        return reject(new Error("Falha ao ler o arquivo."));
      }
      
      const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
      
      try {
        const CMap_URL = 'https://aistudiocdn.com/pdfjs-dist@5.4.296/cmaps/';
        const pdf = await pdfjsLib.getDocument({
            data: typedArray,
            cMapUrl: CMap_URL,
            cMapPacked: true,
        }).promise;

        let fullText = "";
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
          const cleanedPageText = pageText.replace(/\s+/g, ' ').trim();

          fullText += `--- Página ${i} ---\n${cleanedPageText}\n\n`;
        }
        
        resolve(fullText);
      } catch (error) {
        console.error("Error processing PDF:", error);
        if (error instanceof Error && error.name === 'MissingPDF') {
             reject(new Error("O arquivo parece estar corrompido ou não é um PDF válido."));
        } else {
             reject(new Error("Não foi possível extrair o texto do PDF. O arquivo pode estar protegido ou usar um formato não suportado."));
        }
      }
    };
    
    fileReader.onerror = (error) => {
      reject(error);
    };

    fileReader.readAsArrayBuffer(file);
  });
}