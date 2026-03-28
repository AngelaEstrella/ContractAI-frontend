import type { Conversation } from "@/types/api.types";
import { formatConversationDate } from "@/features/ai-agent/lib/chat-utils";

type ChatHistorySidebarProps = {
  conversations: Conversation[];
  isLoading: boolean;
  onSelectConversation: (conversationId: number) => void;
  showHistory: boolean;
};

export function ChatHistorySidebar({
  conversations,
  isLoading,
  onSelectConversation,
  showHistory,
}: ChatHistorySidebarProps) {
  return (
    <div
      className={`${showHistory ? "w-80" : "w-0"} flex flex-shrink-0 flex-col overflow-hidden border-r border-slate-200/60 bg-white/80 shadow-xl shadow-slate-200/20 backdrop-blur-xl transition-all duration-300 ease-out`}
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Historial</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-slate-400">Cargando conversaciones...</div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">No hay conversaciones anteriores</div>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className="group w-full border-b border-slate-50 p-4 text-left transition-all duration-200 hover:bg-blue-50/50"
            >
              <p className="truncate text-sm font-medium text-slate-700 transition-colors group-hover:text-blue-600">
                {conversation.title}
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatConversationDate(conversation.created_at)}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
