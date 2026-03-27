"use client";

import { useState } from "react";
import { Folder, Plus } from "lucide-react";
import type { ContractFolder } from "@/features/contracts/lib/contracts-mock-data";

type ContractsFolderTabsProps = {
  activeFolderId: number;
  folders: ContractFolder[];
  onCreateFolder: (name: string) => void;
  onSelectFolder: (folderId: number) => void;
};

export function ContractsFolderTabs({
  activeFolderId,
  folders,
  onCreateFolder,
  onSelectFolder,
}: ContractsFolderTabsProps) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");

  const confirmFolderCreation = () => {
    const normalizedName = folderName.trim();

    if (normalizedName) {
      onCreateFolder(normalizedName);
    }

    setFolderName("");
    setIsCreatingFolder(false);
  };

  return (
    <div className="mb-4 flex flex-shrink-0 items-center gap-1 border-b border-slate-200">
      {folders.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onSelectFolder(folder.id)}
          className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeFolderId === folder.id
              ? "-mb-px border-b-2 border-blue-600 bg-white text-blue-600"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          }`}
        >
          <Folder className="h-4 w-4" />
          {folder.name}
        </button>
      ))}

      {isCreatingFolder ? (
        <div className="flex items-center gap-1 px-2">
          <input
            autoFocus
            type="text"
            placeholder="Nombre..."
            value={folderName}
            onBlur={confirmFolderCreation}
            onChange={(event) => setFolderName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                confirmFolderCreation();
              }

              if (event.key === "Escape") {
                setFolderName("");
                setIsCreatingFolder(false);
              }
            }}
            className="w-32 rounded-lg border border-blue-400 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none ring-2 ring-blue-500/20"
          />
        </div>
      ) : (
        <button
          onClick={() => setIsCreatingFolder(true)}
          className="ml-1 flex items-center gap-1.5 rounded-t-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva carpeta
        </button>
      )}
    </div>
  );
}
