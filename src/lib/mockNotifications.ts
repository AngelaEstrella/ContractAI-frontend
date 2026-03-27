export type NotificationType = "critical" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timeLabel: string;
  actions: { label: string; variant: "primary" | "ghost" }[];
  read: boolean;
}

export const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "critical",
    title: "Contrato vencido",
    description: "El contrato con Proveedor Logístico S.A. venció hace 2 días sin renovación.",
    timeLabel: "24H",
    actions: [
      { label: "Revisar ahora", variant: "primary" },
      { label: "Descartar", variant: "ghost" },
    ],
    read: false,
  },
  {
    id: "2",
    type: "critical",
    title: "Cláusula de alto riesgo detectada",
    description: "La IA detectó una cláusula de penalización desproporcionada en Contrato #2047.",
    timeLabel: "7 DÍAS",
    actions: [
      { label: "Ver cláusula", variant: "primary" },
      { label: "Ignorar", variant: "ghost" },
    ],
    read: false,
  },
  {
    id: "3",
    type: "warning",
    title: "Revisión pendiente de aprobación",
    description: "El contrato con Distribuidora Norte lleva 5 días esperando tu aprobación.",
    timeLabel: "24H",
    actions: [
      { label: "Ver detalles", variant: "primary" },
      { label: "Posponer", variant: "ghost" },
    ],
    read: false,
  },
  {
    id: "4",
    type: "info",
    title: "Nuevo contrato asignado",
    description: "Se te asignó el contrato de servicios tecnológicos con InnovateTech Ltda.",
    timeLabel: "AHORA",
    actions: [{ label: "Ver contrato", variant: "primary" }],
    read: true,
  },
  {
    id: "5",
    type: "warning",
    title: "Firma requerida próxima a vencer",
    description: "El plazo para firmar el acuerdo de confidencialidad vence en 48 horas.",
    timeLabel: "7 DÍAS",
    actions: [
      { label: "Firmar ahora", variant: "primary" },
      { label: "Recordar después", variant: "ghost" },
    ],
    read: true,
  },
];
