"use client";

import { useEffect, useRef, useState } from "react";
import { getConversationById, getConversations, sendMessage } from "@/lib/api";
import { ChatComposer } from "@/features/ai-agent/components/ChatComposer";
import { ChatEmptyState } from "@/features/ai-agent/components/ChatEmptyState";
import { ChatHistorySidebar } from "@/features/ai-agent/components/ChatHistorySidebar";
import { ChatMessageList } from "@/features/ai-agent/components/ChatMessageList";
import { RobotIcon } from "@/features/ai-agent/components/RobotIcon";
import { useLiveNow } from "@/features/ai-agent/hooks/use-live-now";
import { mapConversationToMessages } from "@/features/ai-agent/lib/chat-utils";
import type { ChatMessage } from "@/features/ai-agent/types";
import type { Conversation } from "@/types/api.types";

export default function AIAgentPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<number | undefined>(undefined);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const now = useLiveNow();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      setIsHistoryLoading(true);
      setConversations(await getConversations());
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const loadConversation = async (conversationId: number) => {
    try {
      const conversation = await getConversationById(conversationId);
      setMessages(mapConversationToMessages(conversation));
      setThreadId(conversationId);
      setShowHistory(false);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const submitCurrentMessage = async () => {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: trimmedValue,
      timestamp: new Date(),
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInputValue("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await sendMessage({
        message: userMessage.content,
        thread_id: threadId,
      });

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((currentMessages) => [...currentMessages, botMessage]);
      setThreadId(response.thread_id);
    } catch {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: "bot",
        content: "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.",
        timestamp: new Date(),
      };

      setMessages((currentMessages) => [...currentMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setThreadId(undefined);
    setShowHistory(false);
    textareaRef.current?.focus();
  };

  const toggleHistory = () => {
    setShowHistory((currentValue) => {
      const nextValue = !currentValue;

      if (nextValue) {
        void loadConversations();
      }

      return nextValue;
    });
  };

  return (
    <div className="-m-8 flex h-[calc(100vh-95px)] overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <ChatHistorySidebar
        conversations={conversations}
        isLoading={isHistoryLoading}
        onSelectConversation={(conversationId) => {
          void loadConversation(conversationId);
        }}
        showHistory={showHistory}
      />

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200/60 bg-white/70 px-8 py-4 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleHistory}
              className={`rounded-xl p-2.5 transition-all duration-200 ${
                showHistory ? "bg-blue-100 text-blue-600" : "text-slate-500 hover:bg-slate-100"
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
                  d="M12 8v4l3 3m6-3A9 9 0 113 12a9 9 0 0118 0Z"
                />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                <RobotIcon size="md" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight text-slate-800">ContractAI Bot</h2>
                <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
                  En linea
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={startNewConversation}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25"
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
            Nueva conversacion
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {messages.length === 0 ? (
            <ChatEmptyState
              onSuggestionSelect={(text) => {
                setInputValue(text);
                textareaRef.current?.focus();
              }}
            />
          ) : (
            <ChatMessageList
              bottomRef={messagesEndRef}
              isLoading={isLoading}
              messages={messages}
              now={now}
            />
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitCurrentMessage();
          }}
        >
          <ChatComposer
            inputValue={inputValue}
            isLoading={isLoading}
            onChange={(event) => {
              setInputValue(event.target.value);
              event.target.style.height = "auto";
              event.target.style.height = `${Math.min(event.target.scrollHeight, 120)}px`;
            }}
            onContainerClick={() => textareaRef.current?.focus()}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submitCurrentMessage();
              }
            }}
            onSubmit={() => {
              void submitCurrentMessage();
            }}
            textareaRef={textareaRef}
          />
        </form>
      </div>
    </div>
  );
}
