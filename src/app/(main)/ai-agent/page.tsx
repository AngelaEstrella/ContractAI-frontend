'use client';

import { useState, useRef, useEffect } from 'react';
import { sendMessage, getConversations, getConversationById } from '@/lib/api';
import { ConversationMessage, Conversation } from '@/types/api.types';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// Componente para renderizar markdown básico (negritas, cursivas, código)
const MarkdownRenderer = ({ content }: { content: string }) => {
  const renderMarkdown = (text: string) => {
    const elements: React.ReactNode[] = [];
    let key = 0;
    
    const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|('(.+?)')/g;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        elements.push(text.slice(lastIndex, match.index));
      }
      
      if (match[1]) {
        elements.push(
          <strong key={key++} className="font-semibold">
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        elements.push(
          <em key={key++} className="italic">
            {match[4]}
          </em>
        );
      } else if (match[5]) {
        elements.push(
          <code key={key++} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-sm font-mono">
            {match[6]}
          </code>
        );
      } else if (match[7]) {
        elements.push(
          <span key={key++} className="font-semibold text-[#1152D4]">
            {match[8]}
          </span>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }
    
    return elements.length > 0 ? elements : text;
  };

  const lines = content.split('\n');
  
  return (
    <>
      {lines.map((line, index) => (
        <span key={index}>
          {renderMarkdown(line)}
          {index < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
};

// Componente de reloj en tiempo real
const LiveTime = ({ timestamp, sender }: { timestamp: Date; sender: 'user' | 'bot' }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isRecent = (currentTime.getTime() - timestamp.getTime()) < 60000;
  
  return (
    <span className="flex items-center gap-1.5">
      {formatTime(timestamp)}
      {sender === 'user' && (
        <>
          <span className="text-slate-300">•</span>
          <span className="text-emerald-500">Enviado</span>
        </>
      )}
      {sender === 'bot' && (
        <>
          <span className="text-slate-300">•</span>
          <span className="text-blue-500">ContractAI</span>
        </>
      )}
      {isRecent && (
        <span className="ml-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
      )}
    </span>
  );
};

// Ícono de Robot
const RobotIcon = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };
  
  return (
    <svg 
      className={sizeClasses[size]} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="3" r="1.5" fill="currentColor" className="animate-pulse" />
      <line x1="12" y1="4.5" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="5" y="7" width="14" height="11" rx="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor">
        <animate attributeName="r" values="1.5;1.8;1.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="15" cy="12" r="1.5" fill="currentColor">
        <animate attributeName="r" values="1.5;1.8;1.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <path d="M9 15.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="2" y="10" width="2" height="4" rx="1" fill="currentColor" />
      <rect x="20" y="10" width="2" height="4" rx="1" fill="currentColor" />
      <path d="M8 18v2.5a1.5 1.5 0 001.5 1.5h5a1.5 1.5 0 001.5-1.5V18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
};

export default function AIAgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<number | undefined>(undefined);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch {
      console.error('Error loading conversations:', error);
    }
  };

  const loadConversation = async (conversationId: number) => {
    try {
      const data = await getConversationById(conversationId);
      const loadedMessages: Message[] = data.content.map((msg: ConversationMessage, index: number) => ({
        id: `loaded-${index}`,
        sender: msg.sender === 'user' ? 'user' : 'bot',
        content: msg.message,
        timestamp: new Date(data.created_at),
      }));
      setMessages(loadedMessages);
      setThreadId(conversationId);
      setShowHistory(false);
    } catch {
      console.error('Error loading conversation:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await sendMessage({
        message: userMessage.content,
        thread_id: threadId,
      });

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setThreadId(response.thread_id);
    } catch {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        sender: 'bot',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleContainerClick = () => {
    textareaRef.current?.focus();
  };

  const startNewConversation = () => {
    setMessages([]);
    setThreadId(undefined);
    setShowHistory(false);
  };

  const toggleHistory = () => {
    const newShowHistory = !showHistory;
    setShowHistory(newShowHistory);
    if (newShowHistory) {
      loadConversations();
    }
  };

  return (
    <div className="flex h-[calc(100vh-95px)] bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 -m-8 overflow-hidden">
      {/* Sidebar de historial del chat */}
      <div
        className={`${
          showHistory ? 'w-80' : 'w-0'
        } transition-all duration-300 ease-out overflow-hidden bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col shadow-xl shadow-slate-200/20 flex-shrink-0`}
      >
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="font-semibold text-slate-700 text-sm tracking-wide uppercase">
            Historial
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              No hay conversaciones anteriores
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className="w-full p-4 text-left hover:bg-blue-50/50 border-b border-slate-50 transition-all duration-200 group"
              >
                <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                  {conv.title}
                </p>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(conv.created_at).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat principal */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header del chat */}
        <div className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-8 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleHistory}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                showHistory 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'hover:bg-slate-100 text-slate-500'
              }`}
              title="Historial"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
                <RobotIcon size="md" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800 tracking-tight">ContractAI Bot</h2>
                <p className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50"></span>
                  En línea
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={startNewConversation}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva conversación
          </button>
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/30 text-white">
                <RobotIcon size="lg" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">
                ¡Hola! Soy tu asistente de contratos
              </h3>
              <p className="text-slate-500 max-w-md leading-relaxed">
                Pregúntame cualquier cosa sobre tus contratos. Puedo ayudarte a analizar cláusulas,
                explicar términos legales y mucho más.
              </p>
              
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {['¿Qué puedes hacer?', 'Analizar un contrato', 'Explicar una cláusula'].map((text) => (
                  <button
                    key={text}
                    onClick={() => {
                      setInputValue(text);
                      textareaRef.current?.focus();
                    }}
                    className="px-4 py-2 bg-white rounded-full text-sm text-slate-600 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 shadow-sm"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5 max-w-3xl mx-auto pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-end gap-3 max-w-[85%] sm:max-w-[75%] ${
                      message.sender === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {message.sender === 'bot' && (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 text-white">
                        <RobotIcon size="sm" />
                      </div>
                    )}
                    {message.sender === 'user' && (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 shadow-md border border-slate-200/50">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-slate-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}

                    <div className="flex flex-col">
                      <div
                        className={`px-5 py-3.5 ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-md shadow-lg shadow-blue-500/20'
                            : 'bg-white text-slate-700 rounded-2xl rounded-bl-md shadow-lg shadow-slate-200/50 border border-slate-100'
                        }`}
                      >
                        <div className="text-[15px] leading-relaxed">
                          {message.sender === 'bot' ? (
                            <MarkdownRenderer content={message.content} />
                          ) : (
                            <span className="whitespace-pre-wrap">{message.content}</span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`text-[11px] text-slate-400 mt-2 ${
                          message.sender === 'user' ? 'text-right pr-1' : 'text-left pl-1'
                        }`}
                      >
                        <LiveTime timestamp={message.timestamp} sender={message.sender} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-end gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 text-white">
                      <RobotIcon size="sm" />
                    </div>
                    <div className="bg-white px-5 py-4 rounded-2xl rounded-bl-md shadow-lg shadow-slate-200/50 border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input de mensaje */}
        <div className="bg-white/90 backdrop-blur-xl border-t border-slate-200/60 px-4 sm:px-8 py-4 flex-shrink-0">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div 
              onClick={handleContainerClick}
              className="flex items-end gap-3 bg-slate-50 rounded-2xl px-4 py-3 border-2 border-slate-200 focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-blue-500/10 transition-all duration-200 cursor-text hover:border-slate-300 hover:bg-white"
            >
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje aquí..."
                className="flex-1 bg-transparent resize-none outline-none text-slate-700 placeholder-slate-400 text-[15px] max-h-[120px] min-h-[28px] leading-relaxed py-1"
                rows={1}
                disabled={isLoading}
              />
              
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={`p-3 rounded-xl transition-all duration-200 flex-shrink-0 ${
                  inputValue.trim() && !isLoading
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
            
            <p className="text-center text-xs text-slate-400 mt-3">
              Presiona <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono text-[10px]">Enter</kbd> para enviar • <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono text-[10px]">Shift+Enter</kbd> para nueva línea
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
