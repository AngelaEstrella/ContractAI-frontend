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
        background: "linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)"
      }}
    >
      <div className="flex items-center px-4 py-6">
        <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center w-full" : ""}`}>
          <button
            onClick={toggleSidebar}
            onMouseEnter={() => setIsHoveringLogo(true)}
            onMouseLeave={() => setIsHoveringLogo(false)}
            className="relative group"
          >
            {isHoveringLogo ? (
              isCollapsed ? (
                <PanelLeftOpen size={32} className="text-white" />
              ) : (
                <PanelLeftClose size={32} className="text-white" />
              )
            ) : (
              <Image
                src="/logo-contractAI-azul.png"
                alt="ContractAI Logo"
                width={32}
                height={32}
                className="brightness-0 invert"
              />
            )}
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {isCollapsed ? "Abrir barra lateral" : "Cerrar barra lateral"}
            </span>
          </button>
          {!isCollapsed && (
            <span className="text-xl font-semibold text-white">ContractAI</span>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative group flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <Icon size={22} />
              {!isCollapsed && <span>{item.name}</span>}
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