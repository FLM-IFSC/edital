import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chat as GeminiChat } from '@google/genai';
import { ChatMessage } from '../types';
import BotIcon from './icons/BotIcon';
import UserIcon from './icons/UserIcon';
import SendIcon from './icons/SendIcon';
import IFSCIcon from './icons/IFSCIcon';

interface ChatProps {
  documentChat: GeminiChat | null;
  onCitationClick: (page: number) => void;
}

const suggestedQuestions = [
    "Qual o prazo de inscrição?",
    "Quais são os pré-requisitos?",
    "Faça um resumo do edital.",
];

const Chat: React.FC<ChatProps> = ({ documentChat, onCitationClick }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    if (documentChat) {
      setMessages([
        {
          id: 'initial-bot-message',
          role: 'bot',
          content: 'Olá! Estou pronto para responder perguntas sobre o documento que você enviou.'
        }
      ]);
      setShowSuggestions(true);
    }
  }, [documentChat]);

  const submitQuery = useCallback(async (query: string) => {
    if (!query.trim() || !documentChat || isLoading) return;

    setShowSuggestions(false);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const botMessageId = `bot-${Date.now()}`;
    setMessages(prev => [...prev, { id: botMessageId, role: 'bot', content: '' }]);

    try {
      const result = await documentChat.sendMessageStream({ message: query });
      let currentText = '';
      for await (const chunk of result) {
        currentText += chunk.text;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === botMessageId ? { ...msg, content: currentText } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === botMessageId ? { ...msg, content: 'Desculpe, encontrei um erro. Por favor, tente novamente.' } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [documentChat, isLoading]);
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuery(input);
    setInput('');
  }

  const handleSuggestionClick = (question: string) => {
    submitQuery(question);
  }

  const renderMessageContent = (content: string) => {
    const citationRegex = /\[\s*Página\s*(\d+)\s*\]/g;
    const parts = content.split(citationRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) { // This is a page number
        const pageNum = parseInt(part, 10);
        return (
          <button
            key={index}
            onClick={() => onCitationClick(pageNum)}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-2 rounded-md transition-colors mx-1 text-sm"
          >
            Página {pageNum}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l-2 border-gray-700">
      <div className="p-4 border-b-2 border-gray-700 flex items-center space-x-3">
         <IFSCIcon className="text-green-500 h-8 w-8" />
         <h2 className="text-xl font-bold">ED<span className="text-green-500">i</span>T<span className="text-green-500">a</span>L</h2>
      </div>
      <div className="flex-grow p-4 overflow-y-auto space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start space-x-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'bot' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center"><BotIcon className="w-5 h-5 text-white"/></div>}
            <div className={`p-3 rounded-lg max-w-lg ${message.role === 'user' ? 'bg-gray-700 text-white rounded-br-none' : 'bg-gray-800 text-gray-300 rounded-bl-none'}`}>
              <div className="prose prose-invert max-w-none prose-p:my-2">
                 {renderMessageContent(message.content)}
                 {isLoading && message.id === messages[messages.length - 1].id && <span className="ml-2 inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>}
              </div>
            </div>
            {message.role === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center"><UserIcon className="w-5 h-5 text-white"/></div>}
          </div>
        ))}
        {showSuggestions && (
            <div className="flex justify-start flex-wrap gap-2 pt-4 pl-12">
                {suggestedQuestions.map((q) => (
                    <button
                        key={q}
                        onClick={() => handleSuggestionClick(q)}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                        {q}
                    </button>
                ))}
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t-2 border-gray-700">
        <form onSubmit={handleFormSubmit} className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? 'Aguardando resposta...' : 'Digite um comando aqui'}
            className="flex-grow bg-gray-800 border border-gray-600 rounded-full py-3 px-5 focus:outline-none focus:ring-2 focus:ring-green-500 text-white disabled:opacity-50"
            disabled={isLoading || !documentChat}
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="bg-green-600 text-white rounded-full p-3 hover:bg-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
            <SendIcon className="w-6 h-6"/>
          </button>
        </form>
        <p className="text-xs text-center text-gray-500 mt-2">O Gemini no Workspace pode cometer erros. Por isso, cheque as respostas.</p>
      </div>
    </div>
  );
};

export default React.memo(Chat);