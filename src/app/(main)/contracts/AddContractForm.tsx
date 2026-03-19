"use client";

import { useState } from "react";
import { uploadDocument } from "@/lib/api";
import { Document, DocumentType } from "@/types/api.types";
import { Upload, X } from "lucide-react";

type Props = {
  readonly onAdd: (c: Document) => void;
  readonly onClose: () => void;
};

export default function AddContractForm({ onAdd, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [form, setForm] = useState({
    name: "",
    client: "",
    type: "SERVICIOS" as DocumentType,
    start_date: "",
    end_date: "",
    value: 0,
    currency: "USD",
    licenses: 0,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "licenses" || name === "value" ? Number(value) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        setError("Solo se permiten archivos PDF");
      }
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Debes seleccionar un archivo");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const newDocument = await uploadDocument({
        file,
        name: form.name,
        client: form.client,
        type: form.type,
        start_date: form.start_date,
        end_date: form.end_date,
        value: form.value,
        currency: form.currency,
        licenses: form.licenses,
      });

      onAdd(newDocument);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear contrato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">Nuevo Contrato</h2>

      {error && (
        <div className="bg-red-100 text-red-600 p-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <input
          name="name"
          placeholder="Nombre del contrato"
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="client"
          placeholder="Cliente"
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <select
          name="type"
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="SERVICIOS">SERVICIOS</option>
          <option value="LICENCIAS">lICENCIAS</option>
          <option value="SOPORTE">SOPORTE</option>
        </select>

        <input
          name="licenses"
          type="number"
          placeholder="Licencias"
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <div>
          <label className="block text-sm text-gray-600 mb-1">Fecha inicio</label>
          <input
            type="date"
            name="start_date"
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Fecha vencimiento</label>
          <input
            type="date"
            name="end_date"
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Valor y Moneda juntos */}
        <div className="col-span-2 flex gap-2">
          <input
            name="value"
            type="number"
            placeholder="Valor"
            onChange={handleChange}
            className="border p-2 rounded flex-1"
          />
          <select
            name="currency"
            onChange={handleChange}
            className="border p-2 rounded w-32"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="PEN">PEN</option>
          </select>
        </div>

        {/* Zona de arrastrar archivo */}
        <div className="col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Documento PDF</label>
          
          {!file ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
              <p className="text-gray-600 mb-2">
                Arrastra tu archivo aquí o{" "}
                <label className="text-blue-600 cursor-pointer hover:underline">
                  selecciona un archivo
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-sm text-gray-400">Solo archivos PDF</p>
            </div>
          ) : (
            <div className="border rounded-lg p-4 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                  <span className="text-red-600 text-xs font-bold">PDF</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>

        <button
          onClick={onClose}
          disabled={loading}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          Cancelar
        </button>
      </div>
    </>
  );
}