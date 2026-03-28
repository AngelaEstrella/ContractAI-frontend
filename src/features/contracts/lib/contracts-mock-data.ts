import type { Document } from "@/types/api.types";

export type ContractFolder = {
  id: number;
  name: string;
};

const buildMockDocument = (document: Partial<Document> & Pick<Document, "id" | "name" | "client">): Document => ({
  id: document.id,
  name: document.name,
  client: document.client,
  type: document.type ?? "SUPPORT",
  start_date: document.start_date ?? "2024-01-01",
  end_date: document.end_date ?? "2026-01-01",
  form_data: document.form_data ?? {},
  state: document.state ?? "ACTIVE",
  service_items: document.service_items ?? [],
  file_path: document.file_path ?? null,
  file_name: document.file_name ?? null,
  created_at: document.created_at ?? "2026-03-01T09:00:00.000Z",
  updated_at: document.updated_at ?? "2026-03-22T15:30:00.000Z",
});

export const INITIAL_CONTRACT_FOLDERS: ContractFolder[] = [
  { id: 1, name: "Clientes" },
  { id: 2, name: "Trabajadores" },
];

export const INITIAL_CONTRACTS_BY_FOLDER: Record<number, Document[]> = {
  1: [],
  2: [
    buildMockDocument({
      id: 9001,
      name: "Contrato de soporte - Ana Garcia",
      client: "Ana Garcia",
      type: "SUPPORT",
      start_date: "2025-03-01",
      end_date: "2026-03-01",
      file_name: "contrato_ana_garcia.pdf",
      updated_at: "2026-03-24T08:30:00.000Z",
    }),
    buildMockDocument({
      id: 9002,
      name: "Licencia temporal - Luis Martinez",
      client: "Luis Martinez",
      type: "LICENSES",
      start_date: "2025-06-01",
      end_date: "2025-12-31",
      state: "EXPIRED",
      updated_at: "2026-03-10T17:45:00.000Z",
    }),
  ],
};
