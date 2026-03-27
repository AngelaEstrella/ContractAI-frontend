import type { ChangeEvent } from "react";
import { CURRENCY_OPTIONS, DOCUMENT_STATE_OPTIONS, DOCUMENT_TYPE_OPTIONS } from "@/lib/document.utils";
import { HelpTip, type Step1Draft } from "@/features/contracts/lib/contract-form.utils";
import { contractFormStyles } from "./contract-form.styles";

type ContractFormGeneralFieldsProps = {
  data: Step1Draft;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

export function ContractFormGeneralFields({ data, onChange }: ContractFormGeneralFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
      <div>
        <label className={contractFormStyles.label}>Nombre del contrato</label>
        <input
          name="name"
          value={data.name}
          placeholder="Ej: Contrato de servicios 2024"
          onChange={onChange}
          className={contractFormStyles.input}
        />
      </div>
      <div>
        <label className={contractFormStyles.label}>Cliente</label>
        <input
          name="client"
          value={data.client}
          placeholder="Nombre del cliente"
          onChange={onChange}
          className={contractFormStyles.input}
        />
      </div>
      <div>
        <label className={contractFormStyles.label}>
          Tipo de contrato
          <HelpTip text="Servicios = prestacion de servicios profesionales. Licencias = uso de software. Soporte = mantenimiento y asistencia tecnica." />
        </label>
        <select
          name="type"
          value={data.type}
          onChange={onChange}
          className={contractFormStyles.select}
        >
          {DOCUMENT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={contractFormStyles.label}>
          Estado
          <HelpTip text="Activo = contrato vigente. Pendiente = en revision o pendiente de firma. Expirado = fuera del periodo de vigencia." />
        </label>
        <select
          name="state"
          value={data.state}
          onChange={onChange}
          className={contractFormStyles.select}
        >
          {DOCUMENT_STATE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={contractFormStyles.label}>Fecha de inicio</label>
        <input
          type="date"
          name="start_date"
          value={data.start_date}
          onChange={onChange}
          className={contractFormStyles.input}
        />
      </div>
      <div>
        <label className={contractFormStyles.label}>Fecha de vencimiento</label>
        <input
          type="date"
          name="end_date"
          value={data.end_date}
          onChange={onChange}
          className={contractFormStyles.input}
        />
      </div>
      <div className="col-span-2">
        <label className={contractFormStyles.label}>
          Moneda del contrato
          <HelpTip text="La moneda elegida se aplicara automaticamente a todos los servicios. No se puede cambiar por servicio individual." />
        </label>
        <select
          name="contract_currency"
          value={data.contract_currency}
          onChange={onChange}
          className={contractFormStyles.select}
        >
          {CURRENCY_OPTIONS.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
