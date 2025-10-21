import React, { useState, useCallback, useRef } from 'react';
import { Chat } from '@google/genai';
import PdfViewer, { PdfViewerRef } from './components/PdfViewer';
import ChatComponent from './components/Chat';
import { createDocumentChat, performOcrOnPdf } from './services/geminiService';
import PaperclipIcon from './components/icons/PaperclipIcon';
import IFSCIcon from './components/icons/IFSCIcon';
import SpinnerIcon from './components/icons/SpinnerIcon';

const App: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [documentChat, setDocumentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfViewerRef = useRef<PdfViewerRef>(null);
  
  // A chave da API é injetada via GitHub Actions e fica disponível no objeto window
  const apiKey = (window as any).GEMINI_API_KEY;

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setIsLoading(true);
      setError(null);
      setPdfFile(null);
      setDocumentChat(null);

      try {
        setLoadingMessage('Analisando documento com IA para extrair o texto... Isso pode levar um momento.');
        const text = await performOcrOnPdf(file, apiKey);

        if (!text?.trim()) {
            throw new Error("Não foi possível extrair nenhum texto do documento com a IA. O arquivo pode estar corrompido ou ser muito complexo.");
        }
        
        setLoadingMessage('Preparando o assistente de chat...');
        const chat = createDocumentChat(text, apiKey);
        setDocumentChat(chat);
        setPdfFile(file); // Define o arquivo apenas em caso de sucesso total

      } catch (err) {
        setError((err as Error).message || 'Falha ao processar o PDF.');
        setPdfFile(null);
        setDocumentChat(null);
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    } else {
        setError("Por favor, selecione um arquivo PDF válido.");
    }
  }, [apiKey]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const file = event.dataTransfer.files?.[0];
      if (file && file.type === 'application/pdf') {
          const mockEvent = {
              target: { files: [file] }
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          handleFileChange(mockEvent);
      } else {
          setError("Por favor, solte um arquivo PDF válido.");
      }
  }, [handleFileChange]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
  };

  const onCitationClick = (page: number) => {
    pdfViewerRef.current?.goToPage(page);
  };
  
  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <IFSCIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-red-400">Erro de Configuração</h1>
            <p className="text-gray-400">
                A chave da API do Gemini não foi encontrada. Se você é o desenvolvedor,
                certifique-se de que a variável `GEMINI_API_KEY` foi configurada corretamente
                nos secrets do repositório para a GitHub Action.
            </p>
        </div>
      </div>
    );
  }

  if (!pdfFile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
            <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-gray-600 rounded-lg p-16 cursor-pointer hover:border-green-500 hover:bg-gray-800 transition-all duration-300"
            >
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                />
                <PaperclipIcon className="mx-auto h-16 w-16 text-gray-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Envie seu PDF</h2>
                <p className="text-gray-400">Arraste e solte ou clique para selecionar um arquivo</p>
            </div>
             {isLoading && (
                <div className="mt-4 flex items-center justify-center text-lg text-red-500">
                    <SpinnerIcon className="animate-spin h-5 w-5 mr-3" />
                    <span>{loadingMessage}</span>
                </div>
            )}
            {error && <p className="mt-4 text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="w-3/5 h-full">
        <PdfViewer ref={pdfViewerRef} file={pdfFile} />
      </div>
      <div className="w-2/5 h-full">
        <ChatComponent documentChat={documentChat} onCitationClick={onCitationClick} />
      </div>
    </div>
  );
};

export default React.memo(App);