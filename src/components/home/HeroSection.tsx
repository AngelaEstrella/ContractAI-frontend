import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="flex items-center justify-between px-24 py-16 max-w-[1600px] mx-auto min-h-[calc(100vh-100px)]">
      <div className="max-w-2xl -mt-16 pr-8">
        <span className="inline-flex items-center gap-2 text-[var(--primary)] text-base font-medium mb-6">
          <span className="w-6 h-6 bg-[var(--primary)] rounded-full flex items-center justify-center">
            <span className="text-white text-sm">✓</span>
          </span>
          INTELIGENCIA LEGAL DE CONFIANZA
        </span>
        
        <h1 className="text-6xl font-bold leading-tight mb-8">
          Inteligencia para el{" "}
          <span className="text-[var(--primary)]">Notario Moderno</span>
        </h1>
        
        <p className="text-gray-600 text-xl mb-10 leading-relaxed">
          Automatiza la gestión de tus contratos y consultas legales con 
          inteligencia artificial de nivel empresarial. Diseñado específicamente 
          para documentación legal de alto impacto.
        </p>
        
        <Link
          href="/dashboard"
          className="inline-block bg-[var(--primary)] text-white px-10 py-5 rounded-lg text-xl font-medium hover:bg-[var(--primary-dark)] transition-colors"
        >
          Iniciar sesión
        </Link>
      </div>
      
      <div className="hidden lg:block -mt-16 flex-shrink-0">
        <Image
          src="/imagen-ContractAI-laptop.png"
          alt="ContractAI Platform"
          width={750}
          height={600}
          className="rounded-2xl"
          priority
        />
      </div>
    </section>
  );
}