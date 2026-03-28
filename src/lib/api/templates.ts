import type { Document } from "@/types/api.types";
import { TIMEOUTS } from "./constants";
import { fetchAPI } from "./fetch-client";

export interface Template {
  id: number;
  name: string;
}

export interface WorkerContractFormData {
  // Datos del trabajador
  trabajador_nombre: string;
  trabajador_dni: string;
  trabajador_domicilio: string;
  trabajador_actividades: string;
  // Tipo y modalidad de contrato
  forma_contratacion: string;
  modalidad_y_causas_contratacion: string;
  contrato_duracion: string;
  contrato_fecha_inicio: string;
  contrato_fecha_fin: string;
  // Remuneración
  remuneracion_monto: string;
  remuneracion_periodicidad: string;
  // Horario
  horario_dias: string;
  horario_horas: string;
  refrigerio_duracion: string;
  refrigerio_inicio: string;
  refrigerio_fin: string;
  // Fecha de firma (calculados automáticamente en el frontend)
  dia_firma: string;
  mes_firma: string;
  anio_firma: string;
}

export async function getTemplates(): Promise<Template[]> {
  return fetchAPI<Template[]>("/templates/", { method: "GET" }, TIMEOUTS.DEFAULT);
}

export async function generateWorkerContract(
  templateId: number,
  data: WorkerContractFormData,
): Promise<Document> {
  return fetchAPI<Document>(
    `/templates/${templateId}/generate`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    TIMEOUTS.UPLOAD,
  );
}
