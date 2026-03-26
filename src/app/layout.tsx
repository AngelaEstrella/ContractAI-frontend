import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthBootstrap from "@/components/providers/AuthBootstrap";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ContractAI - Inteligencia para el Notariado Moderno",
  description: "Automatiza la gestión de tus contratos y consultas legales con inteligencia artificial de nivel empresarial. Diseñado específicamente para documentación legal de alto impacto.",
  icons: {
    icon: "/logo-contractAI-azul.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthBootstrap>{children}</AuthBootstrap>
      </body>
    </html>
  );
}
