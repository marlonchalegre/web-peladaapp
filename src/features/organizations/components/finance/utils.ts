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
