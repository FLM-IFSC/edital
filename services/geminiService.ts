import { GoogleGenAI, Chat, Part } from "@google/genai";

// Helper function to convert File to a Gemini API Part
async function fileToGenerativePart(file: File): Promise<Part> {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
        },
    };
}


export async function performOcrOnPdf(file: File, apiKey: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const pdfPart = await fileToGenerativePart(file);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: {
                parts: [
                    pdfPart,
                    { text: "Você é um especialista em OCR. Extraia todo o texto deste documento PDF, página por página. Mantenha a formatação original o máximo possível. Para cada página, comece com o marcador '--- Página X ---', onde X é o número da página. Se uma página estiver em branco, indique isso. O documento está em português do Brasil." }
                ]
            }
        });
        return response.text;
    } catch (e) {
        console.error("Gemini OCR Error:", e);
        throw new Error("A IA não conseguiu processar o documento. Pode ser muito complexo ou estar corrompido.");
    }
}


export function createDocumentChat(documentText: string, apiKey: string): Chat {
    const ai = new GoogleGenAI({ apiKey });
    
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `
# INSTRUÇÕES FUNDAMENTAIS

1.  **FONTE ÚNICA DA VERIDADE:** Sua única e exclusiva fonte de informação é o documento PDF fornecido. Você está estritamente proibido de usar conhecimento externo, dados de treinamento prévio ou acesso à internet.
2.  **SEM ALUCINAÇÕES:** Não invente respostas ou adivinhe informações que não estão explicitamente no texto. Sua tarefa é extrair e apresentar o que está escrito no documento. Se a informação não existe no texto, afirme isso.
3.  **CITAÇÕES OBRIGATÓRIAS:** TODA informação que você fornecer deve ser acompanhada por uma citação da página correspondente. Use o formato [Página X]. Se a informação abrange várias páginas, use [Página X, Y]. A citação não é opcional.

# INTERAÇÃO COM O USUÁRIO

1.  **IDIOMA:** Responda sempre em português do Brasil.
2.  **FLEXIBILIDADE COM ERROS:** Seja inteligente ao interpretar a pergunta. Se o usuário cometer um erro de digitação óbvio (ex: 'lattex' em vez de 'latex', 'incrição' em vez de 'inscrição'), você DEVE entender a intenção e buscar pelo termo correto no documento. Responda com base na informação correta, como se o usuário tivesse digitado a palavra certa.
3.  **COMPREENSÃO COLOQUIAL:** Entenda e processe perguntas mesmo que contenham gírias ou linguagem informal. O seu objetivo é entender a intenção do aluno, não ser um corretor ortográfico.
4.  **PEDIDO DE ESCLARECIMENTO:** Só peça esclarecimento se a pergunta for genuinamente ambígua ou se um erro de digitação puder se referir a múltiplos conceitos diferentes no texto. Não peça para o usuário reformular por causa de um simples erro de digitação que você pode inferir.

# CONTEXTO DO DOCUMENTO

O texto completo do documento é fornecido abaixo. Use-o para responder a todas as perguntas.

--- INÍCIO DO DOCUMENTO ---
${documentText}
--- FIM DO DOCUMENTO ---
`,
        }
    });
    
    return chat;
}
