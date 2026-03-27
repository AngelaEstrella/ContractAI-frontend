"use client";

import { ChatComposer } from "@/features/ai-agent/components/page/ChatComposer";
import { ChatEmptyState } from "@/features/ai-agent/components/page/ChatEmptyState";
import { ChatHistorySidebar } from "@/features/ai-agent/components/page/ChatHistorySidebar";
import { ChatMessageList } from "@/features/ai-agent/components/page/ChatMessageList";
import { RobotIcon } from "@/features/ai-agent/components/page/RobotIcon";
import { useAIAgentPage } from "@/features/ai-agent/hooks/use-ai-agent-page";

export function AIAgentPageContent() {
  const page = useAIAgentPage();

  return (
    <div className="-m-8 flex h-[calc(100vh-95px)] overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <ChatHistorySidebar
        conversations={page.conversations}
        isLoading={page.isHistoryLoading}
        onSelectConversation={(conversationId) => {
          void page.loadConversation(conversationId);
        }}
        showHistory={page.showHistory}
      />

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200/60 bg-white/70 px-8 py-4 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={page.toggleHistory}
              className={`rounded-xl p-2.5 transition-all duration-200 ${
                page.showHistory ? "bg-blue-100 text-blue-600" : "text-slate-500 hover:bg-slate-100"
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
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  En linea
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={page.startNewConversation}
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
          {page.messages.length === 0 ? (
            <ChatEmptyState onSuggestionSelect={page.handleSuggestionSelect} />
          ) : (
            <ChatMessageList
              bottomRef={page.messagesEndRef}
              isLoading={page.isLoading}
              messages={page.messages}
              now={page.now}
            />
          )}
        </div>

        <form onSubmit={page.handleFormSubmit}>
          <ChatComposer
            inputValue={page.inputValue}
            isLoading={page.isLoading}
            onChange={page.handleInputChange}
            onContainerClick={() => page.textareaRef.current?.focus()}
            onKeyDown={page.handleComposerKeyDown}
            onSubmit={page.handleComposerSubmit}
            textareaRef={page.textareaRef}
          />
        </form>
      </div>
    </div>
  );
}
