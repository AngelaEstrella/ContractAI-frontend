"use client";

import { useState } from "react";
import AddContractForm from "./AddContractForm";

type Contract = {
  id: number;
  name: string;
  client: string;
  type: string;
  start: string;
  end: string;
  value: string;
  licenses: number;
  status: "Activo" | "Por vencer" | "Expirado";
};

const mockContracts: Contract[] = [
  {
    id: 1,
    name: "Plataforma Corporativa Pro",
    client: "GlobalMedia S.A.",
    type: "Servicios",
    start: "01 Mar 2024",
    end: "28 Feb 2026",
    value: "$120,000",
    licenses: 48,
    status: "Por vencer",
  },
  {
    id: 2,
    name: "Soporte Técnico Anual",
    client: "Nexus Solutions",
    type: "Soporte",
    start: "01 Ene 2025",
    end: "31 Dic 2025",
    value: "$67,290",
    licenses: 85,
    status: "Activo",
  },
];

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  // ✅ ID progresivo
  const addContract = (newContract: Omit<Contract, "id">) => {
    setContracts((prev) => {
      const lastId =
        prev.length > 0 ? Math.max(...prev.map((c) => c.id)) : 0;

      return [...prev, { ...newContract, id: lastId + 1 }];
    });
  };

  const filtered = contracts.filter((c) => {
    const matchFilter = filter === "all" || c.status === filter;
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.client.toLowerCase().includes(search.toLowerCase());

    return matchFilter && matchSearch;
  });

  const statusStyle = (status: string) => {
    switch (status) {
      case "Activo":
        return "bg-green-100 text-green-600";
      case "Por vencer":
        return "bg-yellow-100 text-yellow-600";
      case "Expirado":
        return "bg-red-100 text-red-500";
      default:
        return "";
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Gestión de Contratos</h1>

        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          + Nuevo Contrato
        </button>
      </div>

      {/* ✅ MODAL FLOTANTE REAL */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* cerrar */}
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              ✖
            </button>

            <AddContractForm
              onAdd={addContract}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* BUSCADOR */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Buscar..."
          className="px-4 py-2 border rounded-lg w-1/3"
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-2">
          {["all", "Activo", "Por vencer", "Expirado"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === f ? "bg-black text-white" : "bg-gray-200"
              }`}
            >
              {f === "all" ? "Todos" : f}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-4">ID</th>
              <th>Contrato</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Inicio</th>
              <th>Vencimiento</th>
              <th>Valor</th>
              <th>Licencias</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="p-4">{c.id}</td>
                <td>{c.name}</td>
                <td>{c.client}</td>
                <td>{c.type}</td>
                <td>{c.start}</td>
                <td>{c.end}</td>
                <td>{c.value}</td>
                <td>{c.licenses}</td>
                <td>
                  <span className={`px-2 py-1 rounded ${statusStyle(c.status)}`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}