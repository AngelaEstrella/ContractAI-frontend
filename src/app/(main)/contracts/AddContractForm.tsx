"use client";

import { useState } from "react";

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

type Props = {
  readonly onAdd: (c: Omit<Contract, "id">) => void;
  readonly onClose: () => void;
};

export default function AddContractForm({ onAdd, onClose }: Props) {
  const [form, setForm] = useState({
    name: "",
    client: "",
    type: "",
    start: "",
    end: "",
    value: "",
    licenses: 0,
    status: "Activo" as Contract["status"],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "licenses" ? Number(value) : value,
    }));
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleSubmit = () => {
    onAdd({
      ...form,
      start: formatDate(form.start),
      end: formatDate(form.end),
    });

    onClose();
  };

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">Nuevo Contrato</h2>

      <div className="grid grid-cols-2 gap-4">
        <input name="name" placeholder="Nombre" onChange={handleChange} className="border p-2 rounded" />
        <input name="client" placeholder="Cliente" onChange={handleChange} className="border p-2 rounded" />
        <input name="type" placeholder="Tipo" onChange={handleChange} className="border p-2 rounded" />

        <input type="date" name="start" onChange={handleChange} className="border p-2 rounded" />
        <input type="date" name="end" onChange={handleChange} className="border p-2 rounded" />

        <input name="value" placeholder="Valor" onChange={handleChange} className="border p-2 rounded" />
        <input name="licenses" type="number" placeholder="Licencias" onChange={handleChange} className="border p-2 rounded" />

        <select name="status" onChange={handleChange} className="border p-2 rounded">
          <option value="Activo">Activo</option>
          <option value="Por vencer">Por vencer</option>
          <option value="Expirado">Expirado</option>
        </select>
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">
          Guardar
        </button>

        <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">
          Cancelar
        </button>
      </div>
    </>
  );
}