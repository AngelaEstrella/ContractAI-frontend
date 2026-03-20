"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Bot, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { useSidebarStore } from "@/store";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Contratos", href: "/contracts", icon: FileText },
  { name: "Agente IA", href: "/ai-agent", icon: Bot },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);

  return (
    <aside 
      className={`${isCollapsed ? "w-20" : "w-64"} min-h-screen flex flex-col transition-all duration-300`}
      style={{
        background: "linear-gradient(180deg, #3b82f6 0%, #4f46e5 50%, #1e40af 100%)"
      }}
    >
      {/* Header con logo */}
      <div className="px-4 py-6">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            onMouseEnter={() => setIsHoveringLogo(true)}
            onMouseLeave={() => setIsHoveringLogo(false)}
            className="relative group w-9 h-9 flex items-center justify-center flex-shrink-0"
          >
            {isHoveringLogo ? (
              isCollapsed ? (
                <PanelLeftOpen size={28} className="text-white" />
              ) : (
                <PanelLeftClose size={28} className="text-white" />
              )
            ) : (
              <Image
                src="/logo-contractAI-azul.png"
                alt="ContractAI Logo"
                width={36}
                height={36}
                className="brightness-0 invert"
              />
            )}
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {isCollapsed ? "Abrir barra lateral" : "Cerrar barra lateral"}
            </span>
          </button>
          
          <span 
            className={`text-2xl font-semibold text-white transition-all duration-300 overflow-hidden whitespace-nowrap ${
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            }`}
          >
            ContractAI
          </span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative group flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-200 ${
                isActive
                  ? "bg-white/20 text-white shadow-lg shadow-black/10"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={22} className="flex-shrink-0" />
              <span 
                className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                }`}
              >
                {item.name}
              </span>
              {isCollapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}