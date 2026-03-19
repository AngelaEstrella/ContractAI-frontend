"use client";

import { useState, useEffect } from "react";
import { uploadDocument, updateDocument } from "@/lib/api";
import { Document, DocumentType } from "@/types/api.types";
import { Upload, X, FileText } from "lucide-react";

type Props = {
  readonly onAdd: (c: Document) => void;
  readonly onClose: () => void;
  readonly editMode?: boolean;
  readonly initialData?: Document;
};

export default function AddContractForm({ onAdd, onClose, editMode = false, initialData }: Props) {
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

  // Cargar datos iniciales cuando estamos en modo edición
  useEffect(() => {
    if (editMode && initialData) {
      setForm({
        name: initialData.name,
        client: initialData.client,
        type: initialData.type,
        start_date: initialData.start_date,
        end_date: initialData.end_date,
        value: initialData.value,
        currency: initialData.currency,
        licenses: initialData.licenses,
      });
    }
  }, [editMode, initialData]);

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
    // Solo requerir archivo en modo crear
    if (!editMode && !file) {
      setError("Debes seleccionar un archivo");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let resultDocument: Document;

      if (editMode && initialData) {
        // Modo edición: llamar a updateDocument
        resultDocument = await updateDocument(initialData.id, {
          name: form.name,
          client: form.client,
          type: form.type,
          start_date: form.start_date,
          end_date: form.end_date,
          value: form.value,
          currency: form.currency,
          licenses: form.licenses,
        });
      } else {
        // Modo crear: llamar a uploadDocument
        resultDocument = await uploadDocument({
          file: file!,
          name: form.name,
          client: form.client,
          type: form.type,
          start_date: form.start_date,
          end_date: form.end_date,
          value: form.value,
          currency: form.currency,
          licenses: form.licenses,
        });
      }

      onAdd(resultDocument);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Error al ${editMode ? 'actualizar' : 'crear'} contrato`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold text-slate-800 mb-6">
        {editMode ? "Editar Contrato" : "Nuevo Contrato"}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre del contrato */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nombre del contrato
          </label>
          <input
            name="name"
            value={form.name}
            placeholder="Ej: Contrato de servicios 2024"
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Cliente
          </label>
          <input
            name="client"
            value={form.client}
            placeholder="Nombre del cliente"
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Tipo de contrato
          </label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white"
          >
            <option value="SERVICIOS">Servicios</option>
            <option value="LICENCIAS">Licencias</option>
            <option value="SOPORTE">Soporte</option>
          </select>
        </div>

        {/* Licencias */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Cantidad de licencias
          </label>
          <input
            name="licenses"
            type="number"
            value={form.licenses}
            placeholder="0"
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Fecha inicio */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Fecha de inicio
          </label>
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Fecha vencimiento */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Fecha de vencimiento
          </label>
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Valor y Moneda */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Valor del contrato
          </label>
          <div className="flex gap-2">
            <input
              name="value"
              type="number"
              value={form.value}
              placeholder="0.00"
              onChange={handleChange}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="w-28 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="PEN">PEN</option>
            </select>
          </div>
        </div>

        {/* Zona de archivo - Solo mostrar en modo crear, u opcionalmente en editar */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Documento PDF
            {editMode && <span className="text-slate-400 font-normal ml-1">(opcional)</span>}
          </label>
          
          {/* En modo edición, mostrar que ya hay un archivo */}
          {editMode && !file && (
            <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Documento actual</p>
                  <p className="text-xs text-slate-500">El archivo PDF existente se mantendrá</p>
                </div>
              </div>
            </div>
          )}
          
          {!file ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
              }`}
            >
              <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm text-slate-600 mb-1">
                Arrastra tu archivo aquí o{" "}
                <label className="text-blue-600 cursor-pointer hover:underline font-medium">
                  selecciona un archivo
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-xs text-slate-400">Solo archivos PDF</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 text-xs font-bold">PDF</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 text-sm font-medium flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              {editMode ? "Actualizando..." : "Guardando..."}
            </>
          ) : (
            editMode ? "Guardar cambios" : "Crear contrato"
          )}
        </button>
      </div>
    </>
  );
}