import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="flex items-center justify-between px-12 py-6 border-b border-gray-100">
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/logo-contractAI-azul.png"
          alt="ContractAI Logo"
          width={36}
          height={36}
          priority
        />
        <span className="text-2xl font-semibold">ContractAI</span>
      </Link>
    </header>
  );
}