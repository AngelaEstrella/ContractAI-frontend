"use client";

type MainErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function MainError({ error, reset }: MainErrorProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 px-6 py-5 shadow-sm">
        <p className="text-sm font-semibold text-red-700">Algo fallo al cargar esta vista.</p>
        <p className="mt-2 text-sm text-red-600">{error.message || "Intenta nuevamente en unos segundos."}</p>
      </div>
      <button
        onClick={reset}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
      >
        Reintentar
      </button>
    </div>
  );
}
