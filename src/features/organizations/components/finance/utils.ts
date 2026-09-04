export const calculateMonthlyFine = (
  year: number,
  month: number,
  paymentDate: string,
  fineAmount: number,
  cutOffDay: number,
): number => {
  const [pYear, pMonth, pDay] = paymentDate.split("-").map(Number);
  const payment = new Date(pYear, pMonth - 1, pDay, 0, 0, 0);
  const deadline = new Date(year, month - 1, cutOffDay, 23, 59, 59);
  return payment > deadline ? fineAmount : 0.0;
};

export const formatCurrency = (
  amount?: number | null,
  language = "pt-BR",
  currency = "BRL",
): string =>
  new Intl.NumberFormat(language, {
    style: "currency",
    currency: currency || "BRL",
  }).format(amount ?? 0);

export const formatDateOnly = (
  dateStr?: string | null,
  language = "pt-BR",
): string => {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(language);
};
