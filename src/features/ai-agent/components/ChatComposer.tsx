import type { KeyboardEvent, RefObject, TextareaHTMLAttributes } from "react";

type ChatComposerProps = {
  inputValue: string;
  isLoading: boolean;
  onChange: TextareaHTMLAttributes<HTMLTextAreaElement>["onChange"];
  onContainerClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

export function ChatComposer({
  inputValue,
  isLoading,
  onChange,
  onContainerClick,
  onKeyDown,
  onSubmit,
  textareaRef,
}: ChatComposerProps) {
  return (
    <div className="flex-shrink-0 border-t border-slate-200/60 bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div
          onClick={onContainerClick}
          className="flex cursor-text items-end gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 transition-all duration-200 hover:border-slate-300 hover:bg-white focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-blue-500/10"
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder="Escribe tu mensaje aqui..."
            className="min-h-[28px] max-h-[120px] flex-1 resize-none bg-transparent py-1 text-[15px] leading-relaxed text-slate-700 outline-none placeholder:text-slate-400"
            rows={1}
            disabled={isLoading}
          />

          <button
            type="button"
            onClick={onSubmit}
            disabled={!inputValue.trim() || isLoading}
            className={`flex-shrink-0 rounded-xl p-3 transition-all duration-200 ${
              inputValue.trim() && !isLoading
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-slate-400">
          Presiona <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">Enter</kbd> para enviar • <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">Shift+Enter</kbd> para nueva linea
        </p>
      </div>
    </div>
  );
}
