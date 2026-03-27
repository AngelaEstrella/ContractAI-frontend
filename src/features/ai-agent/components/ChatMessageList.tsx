import type { RefObject } from "react";
import { formatMessageTime, isRecentTimestamp } from "@/features/ai-agent/lib/chat-utils";
import type { ChatMessage } from "@/features/ai-agent/types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { RobotIcon } from "./RobotIcon";

type ChatMessageListProps = {
  bottomRef: RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  messages: ChatMessage[];
  now: Date;
};

export function ChatMessageList({ bottomRef, isLoading, messages, now }: ChatMessageListProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-4">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`flex max-w-[85%] items-end gap-3 sm:max-w-[75%] ${message.sender === "user" ? "flex-row-reverse" : ""}`}>
            {message.sender === "bot" ? (
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                <RobotIcon size="sm" />
              </div>
            ) : (
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-200/50 bg-gradient-to-br from-slate-100 to-slate-200 shadow-md">
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
                  message.sender === "user"
                    ? "rounded-2xl rounded-br-md bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                    : "rounded-2xl rounded-bl-md border border-slate-100 bg-white text-slate-700 shadow-lg shadow-slate-200/50"
                }`}
              >
                <div className="text-[15px] leading-relaxed">
                  {message.sender === "bot" ? (
                    <MarkdownRenderer content={message.content} />
                  ) : (
                    <span className="whitespace-pre-wrap">{message.content}</span>
                  )}
                </div>
              </div>
              <div
                className={`mt-2 text-[11px] text-slate-400 ${message.sender === "user" ? "pr-1 text-right" : "pl-1 text-left"}`}
              >
                <span className="flex items-center gap-1.5">
                  {formatMessageTime(message.timestamp)}
                  <span className="text-slate-300">•</span>
                  <span className={message.sender === "user" ? "text-emerald-500" : "text-blue-500"}>
                    {message.sender === "user" ? "Enviado" : "ContractAI"}
                  </span>
                  {isRecentTimestamp(message.timestamp, now) && (
                    <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="flex items-end gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <RobotIcon size="sm" />
            </div>
            <div className="rounded-2xl rounded-bl-md border border-slate-100 bg-white px-5 py-4 shadow-lg shadow-slate-200/50">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]" />
                <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]" />
                <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-blue-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
