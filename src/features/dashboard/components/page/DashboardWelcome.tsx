type DashboardWelcomeProps = {
  firstName: string;
};

export function DashboardWelcome({ firstName }: DashboardWelcomeProps) {
  return (
    <section className="rounded-2xl bg-white px-6 py-6 shadow-md md:px-8">
      <h1 className="text-3xl font-semibold text-slate-800">Bienvenido, {firstName}</h1>
      <p className="mt-2 text-sm text-[var(--gray-medium)] md:text-base">
        Este es el resumen de tus contratos y documentos para hoy.
      </p>
    </section>
  );
}
