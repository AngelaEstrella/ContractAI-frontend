import { CHAT_SUGGESTIONS } from "@/features/ai-agent/lib/chat-utils";
import { RobotIcon } from "./RobotIcon";

type ChatEmptyStateProps = {
  onSuggestionSelect: (text: string) => void;
};

export function ChatEmptyState({ onSuggestionSelect }: ChatEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-500/30">
        <RobotIcon size="lg" />
      </div>
      <h3 className="mb-3 text-2xl font-bold tracking-tight text-slate-800">
        ¡Hola! Soy tu asistente de contratos
      </h3>
      <p className="max-w-md leading-relaxed text-slate-500">
        Preguntame cualquier cosa sobre tus contratos. Puedo ayudarte a analizar clausulas,
        explicar terminos legales y mucho mas.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {CHAT_SUGGESTIONS.map((text) => (
          <button
            key={text}
            onClick={() => onSuggestionSelect(text)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
