export const daysUntil = (
  dateStr: string | null | undefined,
  nowTs: number,
) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - nowTs;
  if (Number.isNaN(diff)) return null;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const formatDayMonth = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
};

export const formatTime = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatWeekday = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", { weekday: "long" }).toUpperCase();
};

export const formatMonth = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", { month: "long" });
};

export const compactActionBtnSx = {
  flexShrink: 0,
  border: "1.5px solid",
  borderColor: "divider",
  borderRadius: "6px",
  bgcolor: "background.paper",
  color: "text.secondary",
  p: "4px 6px",
  font: "700 9px/1 Archivo,sans-serif",
  letterSpacing: ".06em",
  cursor: "pointer",
  "&:hover": { borderColor: "text.primary", color: "text.primary" },
} as const;

export const clickableRowSx = {
  cursor: "pointer",
  transition: "background-color 0.15s ease",
  "&:hover": {
    bgcolor: "action.hover",
  },
} as const;
