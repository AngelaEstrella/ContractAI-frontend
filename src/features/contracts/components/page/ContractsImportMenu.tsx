"use client";

import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { GoogleDriveIcon } from "./GoogleDriveIcon";

type ContractsImportMenuProps = {
  align?: "left" | "right";
  isImportingDriveFiles?: boolean;
  isOpeningDrivePicker: boolean;
  onOpenDrive: () => Promise<void> | void;
};

export function ContractsImportMenu({
  align = "right",
  isImportingDriveFiles = false,
  isOpeningDrivePicker,
  onOpenDrive,
}: ContractsImportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isBusy = isOpeningDrivePicker || isImportingDriveFiles;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDriveClick = async () => {
    setIsOpen(false);
    await onOpenDrive();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        disabled={isBusy}
        onClick={() => setIsOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm disabled:cursor-wait disabled:opacity-70"
      >
        {isBusy ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {isOpeningDrivePicker ? "Abriendo Drive..." : isImportingDriveFiles ? "Subiendo..." : "Importar"}
        <svg
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full z-30 mt-1.5 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg`}
        >
          <button
            disabled={isBusy}
            onClick={() => {
              void handleDriveClick();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-blue-50 disabled:cursor-wait disabled:opacity-70"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
              <GoogleDriveIcon className="h-4 w-4" />
            </div>
            <span>{isBusy ? "Conectando..." : "Google Drive"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
