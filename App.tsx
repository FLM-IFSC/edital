import React, { useState, useCallback, useRef } from 'react';
import { Chat } from '@google/genai';
import PdfViewer, { PdfViewerRef } from './components/PdfViewer';
import ChatComponent from './components/Chat';
import { extractTextFromPdf } from './utils/pdfUtils';
import { createDocumentChat } from './services/geminiService';
import PaperclipIcon from './components/icons/PaperclipIcon';
import BotIcon from './components/icons/BotIcon';

const ApiKeyEntry: React.FC<{ onApiKeySubmit: (key: string) => void }> = ({ onApiKeySubmit }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onApiKeySubmit(key.trim());
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <BotIcon className="mx-auto h-16 w-16 text-blue-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Bem-vindo ao Chat com PDF</h1>
        <p className="text-gray-400 mb-6">Para começar, por favor, insira sua chave da API do Google AI.</p>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Sua Chave de API"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          />
          <button
            type="submit"
            disabled={!key.trim()}
            className="bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            Salvar e Continuar
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-4">
          Sua chave é usada apenas no seu navegador e não é armazenada em nossos servidores.
        </p>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [documentChat, setDocumentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfViewerRef = useRef<PdfViewerRef>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setIsLoading(true);
      setError(null);
      setPdfFile(file);
      try {
        const text = await extractTextFromPdf(file);
        const chat = createDocumentChat(text, apiKey);
        setDocumentChat(chat);
      } catch (err) {
        setError((err as Error).message || 'Falha ao processar o PDF.');
        setPdfFile(null);
        setDocumentChat(null);
      } finally {
        setIsLoading(false);
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
    return <ApiKeyEntry onApiKeySubmit={setApiKey} />;
  }

  if (!pdfFile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
            <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-gray-600 rounded-lg p-16 cursor-pointer hover:border-blue-500 hover:bg-gray-800 transition-all duration-300"
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
            {isLoading && <p className="mt-4 text-lg animate-pulse">Processando Documento...</p>}
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

export default App;