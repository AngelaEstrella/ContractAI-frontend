"use client";

import { useState, useEffect } from "react";
import { getDocuments } from "@/lib/api";
import { Document } from "@/types/api.types";
import AddContractForm from "./AddContractForm";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Cargar contratos al montar el componente
  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocuments();
      setContracts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar contratos");
    } finally {
      setLoading(false);
    }
  };

  const addContract = (newContract: Document) => {
    setContracts((prev) => [...prev, newContract]);
  };

  const filtered = contracts.filter((c) => {
    const matchFilter = filter === "all" || c.state === filter;
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.client.toLowerCase().includes(search.toLowerCase());

    return matchFilter && matchSearch;
  });

  const statusStyle = (status: string) => {
    switch (status) {
      case "ACTIVO":
        return "bg-green-100 text-green-600";
      case "POR_VENCER":
        return "bg-yellow-100 text-yellow-600";
      case "EXPIRADO":
        return "bg-red-100 text-red-500";
      default:
        return "";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "ACTIVO":
        return "Activo";
      case "POR_VENCER":
        return "Por vencer";
      case "EXPIRADO":
        return "Expirado";
      default:
        return status;
    }
  };

  if (loading) {
  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 text-lg">Cargando contratos...</p>
    </div>
  );
}

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={loadContracts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Reintentar
        </button>
      </div>
    );
  }

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

      {/* MODAL FLOTANTE */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
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
          {["all", "ACTIVO", "POR_VENCER", "EXPIRADO"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === f ? "bg-black text-white" : "bg-gray-200"
              }`}
            >
              {f === "all" ? "Todos" : statusLabel(f)}
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
                <td>{c.start_date}</td>
                <td>{c.end_date}</td>
                <td>{c.currency} {c.value.toLocaleString()}</td>
                <td>{c.licenses}</td>
                <td>
                  <span className={`px-2 py-1 rounded ${statusStyle(c.state)}`}>
                    {statusLabel(c.state)}
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